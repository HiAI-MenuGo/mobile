import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { soundService } from '../services/sound';

// Địa chỉ backend mặc định: Android emulator dùng 10.0.2.2, iOS/Web dùng localhost
const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
const rawSocketUrl = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL).trim().replace(/\/+$/, '');
export const SOCKET_URL = rawSocketUrl.replace(/\/api$/, '');

let sharedSocket: Socket | null = null;

export interface SocketConfig {
  token?: string | null;
  tenantId?: string;
  branchId?: string;
  autoConnect?: boolean;
}

export function getSocket(config: SocketConfig = {}): Socket {
  if (!sharedSocket) {
    const { token, tenantId = 'default-tenant', branchId = 'default-branch' } = config;

    sharedSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: config.autoConnect !== false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      auth: {
        token: token || undefined,
        tenantId,
        branchId,
      },
    });

    sharedSocket.on('connect', () => {
      console.log('⚡ [useSocket] Connected to Socket.IO Server at', SOCKET_URL);
    });

    sharedSocket.on('disconnect', (reason) => {
      console.log('🔌 [useSocket] Disconnected:', reason);
    });

    sharedSocket.on('connect_error', (error) => {
      console.warn('⚠️ [useSocket] Connection error:', error.message);
    });

    // Task B-003: Lắng nghe đơn mới và thanh toán thành công để phát chuông & rung cảnh báo
    sharedSocket.on('order:new', () => {
      soundService.playNewOrderAlert();
    });

    sharedSocket.on('payment:completed', () => {
      soundService.playPaymentCompleteAlert();
    });
  }

  return sharedSocket;
}

export function useSocket(config: SocketConfig = {}) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket>(getSocket(config));

  useEffect(() => {
    const socket = socketRef.current;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    emit,
  };
}

/**
 * Hook lắng nghe sự kiện Socket.IO cụ thể và tự động huỷ đăng ký khi unmount
 */
export function useSocketEvent<T = any>(
  event: string,
  handler: (data: T) => void,
  dependencies: any[] = []
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();

    const listener = (data: T) => {
      if (handlerRef.current) {
        handlerRef.current(data);
      }
    };

    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [event, ...dependencies]);
}
