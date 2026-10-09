import { Vibration } from 'react-native';
import { create } from 'zustand';

interface SoundState {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
}

export const useSoundStore = create<SoundState>((set) => ({
  soundEnabled: true,
  vibrationEnabled: true,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setVibrationEnabled: (enabled) => set({ vibrationEnabled: enabled }),
}));

// Safely resolve createAudioPlayer from expo-audio if available in current native environment
let createAudioPlayerFn: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const expoAudio = require('expo-audio');
  createAudioPlayerFn = expoAudio?.createAudioPlayer;
} catch (err) {
  // Native module not linked in current Expo Go environment; will safely fallback to vibration
}

class SoundService {
  private newOrderPlayer: any = null;
  private paymentPlayer: any = null;

  constructor() {
    this.initPlayers();
  }

  private initPlayers() {
    if (!createAudioPlayerFn) return;
    try {
      this.newOrderPlayer = createAudioPlayerFn(require('../../assets/sounds/new_order.mp3'));
      this.paymentPlayer = createAudioPlayerFn(require('../../assets/sounds/payment_complete.mp3'));
    } catch (e) {
      // Ignore initial sound loading error
    }
  }

  /**
   * Phát âm thanh và rung báo đơn mới (order:new)
   */
  async playNewOrderAlert() {
    const { soundEnabled, vibrationEnabled } = useSoundStore.getState();

    if (vibrationEnabled) {
      // Rung nhịp kép cảnh báo đơn hàng mới
      try {
        Vibration.vibrate([0, 250, 100, 250]);
      } catch {
        // Fallback if vibration unavailable
      }
    }

    if (!soundEnabled) return;

    try {
      if (this.newOrderPlayer) {
        if (typeof this.newOrderPlayer.seekTo === 'function') {
          await this.newOrderPlayer.seekTo(0);
        }
        this.newOrderPlayer.play();
      } else if (createAudioPlayerFn) {
        this.newOrderPlayer = createAudioPlayerFn(require('../../assets/sounds/new_order.mp3'));
        this.newOrderPlayer?.play();
      }
    } catch (e) {
      console.warn('⚠️ [SoundService] Could not play new order sound:', e);
    }
  }

  /**
   * Phát âm thanh và rung báo thanh toán thành công (payment:completed)
   */
  async playPaymentCompleteAlert() {
    const { soundEnabled, vibrationEnabled } = useSoundStore.getState();

    if (vibrationEnabled) {
      try {
        Vibration.vibrate(200);
      } catch {
        // Fallback
      }
    }

    if (!soundEnabled) return;

    try {
      if (this.paymentPlayer) {
        if (typeof this.paymentPlayer.seekTo === 'function') {
          await this.paymentPlayer.seekTo(0);
        }
        this.paymentPlayer.play();
      } else if (createAudioPlayerFn) {
        this.paymentPlayer = createAudioPlayerFn(require('../../assets/sounds/payment_complete.mp3'));
        this.paymentPlayer?.play();
      }
    } catch (e) {
      console.warn('⚠️ [SoundService] Could not play payment sound:', e);
    }
  }

  /**
   * Giải phóng tài nguyên audio khi tắt app
   */
  async unloadAll() {
    try {
      if (this.newOrderPlayer?.remove) {
        this.newOrderPlayer.remove();
        this.newOrderPlayer = null;
      }
      if (this.paymentPlayer?.remove) {
        this.paymentPlayer.remove();
        this.paymentPlayer = null;
      }
    } catch {
      // Ignore unload error
    }
  }
}

export const soundService = new SoundService();
