import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { soundService } from '../services/sound';
import { createTaggedLogger } from '../utils/logger';
const log = createTaggedLogger('SOCKET');

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

// Auth mac dinh cho socket. login/logout cap nhat qua setSocketAuth().
// getSocket() luon dung storedAuth khi caller khong truyen config ro rang,
// nen socket tao truoc login (guest) se duoc gan token + reconnect sau login.
let storedAuth: { token?: string | null; tenantId: string; branchId: string } = {
  tenantId: 'default-tenant',
  branchId: 'default-branch',
};

function createSocket(opts: { token?: string | null; tenantId: string; branchId: string; autoConnect?: boolean }): Socket {
  const { token, tenantId, branchId } = opts;
  const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: opts.autoConnect !== false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    auth: {
      token: token || undefined,
      tenantId,
      branchId,
    },
  });

  socket.on('connect', () => {
    log.info('[useSocket] Connected to Socket.IO Server at', SOCKET_URL);
  });

  socket.on('disconnect', (reason) => {
    log.info('[useSocket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    log.warn('[useSocket] Connection error:', error.message);
  });

  // Task B-003: Lang nghe don moi va thanh toan thanh cong de phat chuong & rung canh bao
  socket.on('order:new', () => {
    soundService.playNewOrderAlert();
  });

  socket.on('payment:completed', () => {
    soundService.playPaymentCompleteAlert();
  });

  return socket;
}

export function getSocket(config: SocketConfig = {}): Socket {
  if (!sharedSocket) {
    const token = config.token ?? storedAuth.token;
    const tenantId = config.tenantId ?? storedAuth.tenantId;
    const branchId = config.branchId ?? storedAuth.branchId;
    sharedSocket = createSocket({ token, tenantId, branchId, autoConnect: config.autoConnect });
  }

  return sharedSocket;
}

/**
 * Cap nhat auth cho socket sau login / restore session / doi chi nhanh.
 * Giu nguyen socket object nen cac listener (useSocketEvent) khong bi mat;
 * ep reconnect de server join dung room tenant:/branch:.
 */
export function setSocketAuth(config: { token?: string | null; tenantId?: string; branchId?: string }) {
  storedAuth = {
    token: config.token ?? null,
    tenantId: config.tenantId ?? storedAuth.tenantId,
    branchId: config.branchId ?? storedAuth.branchId,
  };
  if (sharedSocket) {
    sharedSocket.auth = {
      token: storedAuth.token || undefined,
      tenantId: storedAuth.tenantId,
      branchId: storedAuth.branchId,
    };
    sharedSocket.disconnect();
    sharedSocket.connect();
  }
}

/** Ngat han socket khi logout de khong nhan event staff nua. */
export function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.removeAllListeners();
    sharedSocket.disconnect();
    sharedSocket = null;
  }
  storedAuth = { tenantId: 'default-tenant', branchId: 'default-branch' };
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

/**
 * Phát sự kiện chuyển chi nhánh sang Socket.IO server để gia nhập đúng room branch
 */
export function switchSocketBranch(branchId: string) {
  storedAuth.branchId = branchId;
  if (sharedSocket) {
    sharedSocket.emit('branch:switch', branchId);
  }
}

