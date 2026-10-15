import { Vibration } from 'react-native';
let Audio: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Audio = require('expo-av')?.Audio;
} catch {
  Audio = null;
}
import { create } from 'zustand';
import { createTaggedLogger } from '../utils/logger';

const log = createTaggedLogger('SOUND');

interface SoundState {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  pushEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setPushEnabled: (enabled: boolean) => void;
}

export const useSoundStore = create<SoundState>((set) => ({
  soundEnabled: true,
  vibrationEnabled: true,
  pushEnabled: true,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setVibrationEnabled: (enabled) => {
    set({ vibrationEnabled: enabled });
    if (enabled) {
      try { Vibration.vibrate(80); } catch {}
    }
  },
  setPushEnabled: (enabled) => set({ pushEnabled: enabled }),
}));

export type SoundKey = 'new_order' | 'payment_complete' | 'low_stock' | 'staff_call' | 'sold_out';

class SoundService {
  private soundObjects: Map<SoundKey, any> = new Map();
  private loaded = false;

  /** Preload tất cả sound files khi app khởi động */
  async loadSounds() {
    if (this.loaded || !Audio) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const soundsToLoad: { key: SoundKey; uri: any }[] = [
        { key: 'new_order', uri: require('../assets/sounds/new_order.mp3') },
        { key: 'payment_complete', uri: require('../assets/sounds/payment_complete.mp3') },
        { key: 'low_stock', uri: require('../assets/sounds/new_order.mp3') }, // reuse
        { key: 'staff_call', uri: require('../assets/sounds/payment_complete.mp3') }, // reuse
        { key: 'sold_out', uri: require('../assets/sounds/new_order.mp3') }, // reuse
      ];

      await Promise.all(soundsToLoad.map(async ({ key, uri }) => {
        try {
          const { sound } = await Audio.Sound.createAsync(uri, { shouldPlay: false, isLooping: false });
          this.soundObjects.set(key, sound);
        } catch (e) {
          log.warn(`Failed to load sound: ${key}`, e);
        }
      }));
      this.loaded = true;
    } catch (e) {
      log.error('Failed to initialize audio', e);
    }
  }

  /** Phát sound theo key */
  async play(key: SoundKey) {
    const { soundEnabled, vibrationEnabled } = useSoundStore.getState();
    if (!soundEnabled) return;

    const sound = this.soundObjects.get(key);
    if (sound) {
      try {
        await sound.replayAsync();
      } catch (e) {
        log.warn(`Play sound failed: ${key}`, e);
      }
    }

    if (vibrationEnabled) {
      try {
        Vibration.vibrate(this.getVibrationPattern(key));
      } catch {}
    }
  }

  /** Helper aliases */
  async playNewOrderAlert() {
    await this.play('new_order');
  }

  async playPaymentCompleteAlert() {
    await this.play('payment_complete');
  }

  private getVibrationPattern(key: SoundKey): number | number[] {
    switch (key) {
      case 'new_order': return [0, 250, 100, 250];
      case 'payment_complete': return 200;
      case 'low_stock': return [0, 300, 100, 300];
      case 'staff_call': return [0, 400, 100, 400, 100, 400];
      case 'sold_out': return [0, 200, 100, 200];
      default: return 200;
    }
  }

  /** Dọn dẹp khi logout */
  async unloadAll() {
    await Promise.all(Array.from(this.soundObjects.values()).map(s => s.unloadAsync().catch(() => {})));
    this.soundObjects.clear();
    this.loaded = false;
  }
}

export const soundService = new SoundService();
