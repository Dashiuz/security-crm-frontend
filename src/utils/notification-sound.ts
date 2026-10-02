"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "noxia_pqrs_mute";
const COOLDOWN_MS = 1500;
const MUTE_CHANGE_EVENT = "noxia:sound_mute_changed";

type SoundType = "message" | "ticket";

class NotificationSoundManager {
  private static instance: NotificationSoundManager;
  private audioCtx: AudioContext | null = null;
  private lastPlayedTime = 0;
  private isMuted = false;
  private originalDocumentTitle: string | null = null;
  private isInitialized = false;

  private constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        this.isMuted = stored === "true";
      } catch {
        this.isMuted = false;
      }
      this.initAutoplayUnlock();
      this.initVisibilityListener();
    }
  }

  public static getInstance(): NotificationSoundManager {
    if (!NotificationSoundManager.instance) {
      NotificationSoundManager.instance = new NotificationSoundManager();
    }
    return NotificationSoundManager.instance;
  }

  /**
   * Desbloqueo silencioso de Autoplay del navegador en la primera interacción del usuario
   */
  private initAutoplayUnlock(): void {
    if (typeof window === "undefined" || this.isInitialized) return;

    const unlock = () => {
      this.ensureAudioContext();
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
    };

    window.addEventListener("click", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true, passive: true });
    window.addEventListener("touchstart", unlock, { once: true, passive: true });
    this.isInitialized = true;
  }

  /**
   * Garantiza la existencia del contexto de audio
   */
  private ensureAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  /**
   * Listener global de visibilidad para restaurar el título original de la pestaña
   */
  private initVisibilityListener(): void {
    if (typeof document === "undefined") return;

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.originalDocumentTitle) {
        document.title = this.originalDocumentTitle;
        this.originalDocumentTitle = null;
      }
    });
  }

  /**
   * Actualiza temporalmente el título del navegador si la pestaña está en segundo plano
   */
  public notifyTabBackground(indicator = "🔔 Nueva actividad - PQRS"): void {
    if (typeof document === "undefined") return;

    if (document.hidden) {
      if (!this.originalDocumentTitle) {
        this.originalDocumentTitle = document.title;
      }
      document.title = indicator;
    }
  }

  /**
   * Retorna el estado actual de silencio
   */
  public getMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Alterna el estado de silencio, persiste en localStorage y emite evento para React
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, String(this.isMuted));
      } catch {
        // localStorage restringido o deshabilitado
      }
      window.dispatchEvent(
        new CustomEvent(MUTE_CHANGE_EVENT, { detail: { isMuted: this.isMuted } })
      );
    }
    return this.isMuted;
  }

  /**
   * Reproduce un tono individual con rampa de ganancia suave para evitar 'clics' de audio
   */
  private playTone(
    ctx: AudioContext,
    frequency: number,
    startTime: number,
    duration: number,
    peakGain = 0.2
  ): void {
    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, startTime);

      // Web Audio API exige valores estrictamente mayores a 0 para rampas exponenciales
      const floorGain = 0.0001;
      const attackTime = 0.02;

      gainNode.gain.setValueAtTime(floorGain, startTime);
      gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + attackTime);
      gainNode.gain.exponentialRampToValueAtTime(floorGain, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch {
      // Ignorar errores puntuales de scheduling en contextos cerrados
    }
  }

  /**
   * Sintetiza y reproduce el sonido solicitado respetando cooldown y mute
   * @param type 'message' (pop burbuja) | 'ticket' (chime ascendente)
   * @param force Si es true, ignora el cooldown (útil para pruebas inmediatas al desmutear)
   */
  public play(type: SoundType, force = false): void {
    if (this.isMuted) return;

    const now = Date.now();
    if (!force && now - this.lastPlayedTime < COOLDOWN_MS) {
      return;
    }
    this.lastPlayedTime = now;

    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const audioNow = ctx.currentTime;

    if (type === "message") {
      // 1. 'message': Tono pop suave de 2 notas
      // Tono 1: 587.33 Hz (Re5), duración 0.12s
      this.playTone(ctx, 587.33, audioNow, 0.12, 0.22);
      // Tono 2: 880.00 Hz (La5), inicio +0.08s, duración 0.18s
      this.playTone(ctx, 880.0, audioNow + 0.08, 0.18, 0.25);
    } else if (type === "ticket") {
      // 2. 'ticket': Acorde ascendente tipo chime de 3 notas
      // Tono 1: 523.25 Hz (Do5), duración 0.15s
      this.playTone(ctx, 523.25, audioNow, 0.15, 0.2);
      // Tono 2: 659.25 Hz (Mi5), inicio +0.12s, duración 0.15s
      this.playTone(ctx, 659.25, audioNow + 0.12, 0.22);
      // Tono 3: 783.99 Hz (Sol5), inicio +0.24s, duración 0.30s
      this.playTone(ctx, 783.99, audioNow + 0.24, 0.25);
    }
  }
}

export const soundManager = NotificationSoundManager.getInstance();

/**
 * Hook reactivo para consumir y alternar el estado de sonido en componentes de React
 */
export function useNotificationSound() {
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getMutedState());

  useEffect(() => {
    // Sincronizar en el montaje por si cambió en SSR o cliente
    setIsMuted(soundManager.getMutedState());

    const handleMuteChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isMuted: boolean }>;
      if (customEvent.detail?.isMuted !== undefined) {
        setIsMuted(customEvent.detail.isMuted);
      } else {
        setIsMuted(soundManager.getMutedState());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setIsMuted(e.newValue === "true");
      }
    };

    window.addEventListener(MUTE_CHANGE_EVENT, handleMuteChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(MUTE_CHANGE_EVENT, handleMuteChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const toggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
    // Si pasa a activo, reproducir tono de prueba inmediato
    if (!nextMuted) {
      soundManager.play("message", true);
    }
    return nextMuted;
  };

  const playSound = (type: SoundType, force = false) => {
    soundManager.play(type, force);
  };

  return {
    isMuted,
    toggleMute,
    playSound,
    notifyTabBackground: (indicator?: string) =>
      soundManager.notifyTabBackground(indicator),
  };
}
