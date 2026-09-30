import { Audio } from 'expo-av';
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

class SoundService {
  private newOrderSound: Audio.Sound | null = null;
  private paymentSound: Audio.Sound | null = null;

  constructor() {
    this.initAudioMode();
  }

  private async initAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch {
      // Ignore audio mode configuration failure on unsupported environments
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
      if (this.newOrderSound) {
        await this.newOrderSound.replayAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/new_order.mp3'),
          { shouldPlay: true, volume: 1.0 }
        );
        this.newOrderSound = sound;
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
      if (this.paymentSound) {
        await this.paymentSound.replayAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/payment_complete.mp3'),
          { shouldPlay: true, volume: 1.0 }
        );
        this.paymentSound = sound;
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
      if (this.newOrderSound) {
        await this.newOrderSound.unloadAsync();
        this.newOrderSound = null;
      }
      if (this.paymentSound) {
        await this.paymentSound.unloadAsync();
        this.paymentSound = null;
      }
    } catch {
      // Ignore unload error
    }
  }
}

export const soundService = new SoundService();
