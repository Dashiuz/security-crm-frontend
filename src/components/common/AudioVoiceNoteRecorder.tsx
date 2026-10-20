"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  Mic as MicIcon,
  DeleteOutline as DeleteOutlineIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
} from "@mui/icons-material";

// Window speech recognition typings
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface AudioVoiceNoteRecorderProps {
  onTranscript: (sessionText: string) => void;
  onAudioFileReady: (file: File | null) => void;
  onRecordingStart?: () => void;
  onDiscard?: () => void;
  disabled?: boolean;
  embedded?: boolean;
}

export default function AudioVoiceNoteRecorder({
  onTranscript,
  onAudioFileReady,
  onRecordingStart,
  onDiscard,
  disabled = false,
  embedded = false,
}: AudioVoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speechWarning, setSpeechWarning] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const accumulatedTranscriptRef = useRef<string>("");
  const currentSegmentTranscriptRef = useRef<string>("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const selectedMimeRef = useRef<string>("audio/webm");

  // Format seconds to mm:ss
  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const cleanupAudioAnalyser = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignorar
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  };

  const cleanupStream = () => {
    cleanupAudioAnalyser();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startAudioAnalyser = (stream: MediaStream) => {
    cleanupAudioAnalyser();
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudioLevel = () => {
          if (!isRecordingRef.current || isPausedRef.current || !analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(normalized);

          animFrameRef.current = requestAnimationFrame(checkAudioLevel);
        };

        animFrameRef.current = requestAnimationFrame(checkAudioLevel);
      }
    } catch {
      // Analyser opcional; no bloquea grabación
    }
  };

  const resumeAudioAnalyser = () => {
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      try {
        audioContextRef.current.resume();
      } catch {}
    }

    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const checkAudioLevel = () => {
        if (!isRecordingRef.current || isPausedRef.current || !analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      if (!animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(checkAudioLevel);
      }
    }
  };

  // Start recording
  const startRecording = async () => {
    setErrorMessage(null);
    setSpeechWarning(null);
    setLiveTranscript("");
    accumulatedTranscriptRef.current = "";
    currentSegmentTranscriptRef.current = "";
    audioChunksRef.current = [];
    isRecordingRef.current = true;
    isPausedRef.current = false;
    setIsPaused(false);

    if (onRecordingStart) {
      onRecordingStart();
    }

    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = true;
      }

      // 2. Setup Audio Visualizer
      startAudioAnalyser(stream);

      // 3. Setup MediaRecorder
      let selectedMime = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        selectedMime = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        selectedMime = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        selectedMime = "audio/mp4";
      }
      selectedMimeRef.current = selectedMime;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        cleanupStream();
        if (audioChunksRef.current.length > 0) {
          const cleanMime = selectedMimeRef.current.includes("mp4") ? "audio/mp4" : "audio/webm";
          const audioBlob = new Blob(audioChunksRef.current, { type: cleanMime });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);

          const fileName = `voice_note_${Date.now()}.${cleanMime.includes("mp4") ? "mp4" : "webm"}`;
          const audioFile = new File([audioBlob], fileName, { type: cleanMime });
          onAudioFileReady(audioFile);
        }
      };

      mediaRecorder.start(250); // Collect chunks every 250ms

      // 4. Setup Web Speech API for real-time transcription
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = "es-CO";
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;

          recognition.onresult = (event: any) => {
            if (isPausedRef.current) return;

            let sessionFinal = "";
            let interim = "";

            for (let i = 0; i < event.results.length; ++i) {
              const res = event.results[i];
              if (res.isFinal) {
                sessionFinal += res[0].transcript + " ";
              } else {
                interim += res[0].transcript;
              }
            }

            const segment = (sessionFinal + interim).trim();
            currentSegmentTranscriptRef.current = segment;

            const base = accumulatedTranscriptRef.current.trim();
            const full = base ? (segment ? `${base} ${segment}` : base) : segment;

            if (full) {
              setLiveTranscript(full);
              onTranscript(full);
            }
          };

          recognition.onerror = (event: any) => {
            const err = event.error;
            if (err === "no-speech") return;
            if (err === "network") {
              setSpeechWarning(
                "Servicio de dictado offline. La nota de voz sí se grabará."
              );
            } else if (err === "not-allowed" || err === "service-not-allowed") {
              setSpeechWarning(
                "Permiso de dictado bloqueado. El audio se guardará como evidencia."
              );
            }
          };

          recognition.onend = () => {
            if (isRecordingRef.current && !isPausedRef.current && recognitionRef.current) {
              // Si el navegador cierra la sesión por silencio, consolidar antes de reiniciar
              const segment = currentSegmentTranscriptRef.current.trim();
              if (segment) {
                const base = accumulatedTranscriptRef.current.trim();
                accumulatedTranscriptRef.current = base ? `${base} ${segment}` : segment;
                currentSegmentTranscriptRef.current = "";
              }
              try {
                recognition.start();
              } catch {
                // Ya activo o cerrado
              }
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch {
          setSpeechWarning(
            "Dictado automático no disponible. El audio se grabará."
          );
        }
      } else {
        setSpeechWarning(
          "Su navegador no soporta transcripción por voz. El audio se grabará."
        );
      }

      setIsRecording(true);
      setRecordDuration(0);
      stopTimer();
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      cleanupStream();
      isRecordingRef.current = false;
      setErrorMessage(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Permiso de micrófono denegado. Habilite el acceso en el navegador."
          : "No se pudo acceder al micrófono para la grabación."
      );
    }
  };

  // Pause Recording
  const handlePause = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.pause();
      } catch {}
    }

    // Consolidar el texto dictado en este tramo antes de detener recognition
    const segment = currentSegmentTranscriptRef.current.trim();
    if (segment) {
      const base = accumulatedTranscriptRef.current.trim();
      accumulatedTranscriptRef.current = base ? `${base} ${segment}` : segment;
      currentSegmentTranscriptRef.current = "";
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    isPausedRef.current = true;
    setIsPaused(true);
    stopTimer();

    // Cancel animation frame & suspend AudioContext to conserve CPU & battery
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state === "running") {
      try {
        audioContextRef.current.suspend();
      } catch {}
    }
    setAudioLevel(0);
  };

  // Resume Recording
  const handleResume = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      try {
        mediaRecorderRef.current.resume();
      } catch {}
    }
    isPausedRef.current = false;
    setIsPaused(false);
    currentSegmentTranscriptRef.current = "";

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {}
    }

    resumeAudioAnalyser();

    stopTimer();
    timerRef.current = setInterval(() => {
      setRecordDuration((prev) => prev + 1);
    }, 1000);
  };

  // Stop and Discard (Botón Rojo Izquierda)
  const handleDiscard = () => {
    isRecordingRef.current = false;
    isPausedRef.current = false;
    accumulatedTranscriptRef.current = "";
    currentSegmentTranscriptRef.current = "";

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch {}
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    cleanupStream();
    stopTimer();
    audioChunksRef.current = [];

    setIsRecording(false);
    setIsPaused(false);
    setRecordDuration(0);
    setLiveTranscript("");
    setErrorMessage(null);
    setSpeechWarning(null);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    if (onDiscard) {
      onDiscard();
    }
    onAudioFileReady(null);
  };

  // Finalize and Save (Botón Verde Derecha)
  const handleSendAndSave = () => {
    isRecordingRef.current = false;
    isPausedRef.current = false;

    // Consolidar el último segmento antes de cerrar
    const segment = currentSegmentTranscriptRef.current.trim();
    if (segment) {
      const base = accumulatedTranscriptRef.current.trim();
      accumulatedTranscriptRef.current = base ? `${base} ${segment}` : segment;
      currentSegmentTranscriptRef.current = "";
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    stopTimer();
    cleanupAudioAnalyser();
    setIsRecording(false);
    setIsPaused(false);
  };

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      isPausedRef.current = false;
      stopTimer();
      cleanupStream();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <Box sx={{ width: "100%" }}>
      {errorMessage && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.5, py: 0.5, color: "error.main" }}>
          <ErrorIcon fontSize="small" />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {errorMessage}
          </Typography>
        </Stack>
      )}

      {speechWarning && (
        <Alert
          severity="info"
          variant="outlined"
          sx={{ mx: 1.5, my: 0.5, py: 0.2, px: 1, fontSize: "0.72rem", borderRadius: 1.5 }}
        >
          {speechWarning}
        </Alert>
      )}

      {/* Estado Reposo: Botón Micrófono Integrado en Esquina */}
      {!isRecording && !audioUrl && embedded && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", px: 1.5, pb: 1, pt: 0.3 }}>
          <Tooltip title="Dictar por voz y grabar nota de audio">
            <span>
              <IconButton
                size="small"
                color="primary"
                onClick={startRecording}
                disabled={disabled}
                sx={{
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                  color: "primary.main",
                  width: 32,
                  height: 32,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "primary.main",
                    color: "white",
                    transform: "scale(1.08)",
                  },
                }}
              >
                <MicIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )}

      {/* Estado Grabando: Barra de Control Docked en la Base de la Misma Caja */}
      {isRecording && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            py: 0.8,
            borderTop: "1px solid",
            borderColor: isPaused ? "warning.light" : "error.light",
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "#fef2f2",
            transition: "all 0.2s ease",
          }}
        >
          {/* Indicador, Temporizador, Onda y Texto */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0, mr: 1.5 }}>
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                bgcolor: isPaused ? "warning.main" : "error.main",
                animation: isPaused ? "none" : "pulseVoice 1.2s infinite ease-in-out",
                flexShrink: 0,
                "@keyframes pulseVoice": {
                  "0%": { opacity: 1, transform: "scale(1)" },
                  "50%": { opacity: 0.35, transform: "scale(1.2)" },
                  "100%": { opacity: 1, transform: "scale(1)" },
                },
              }}
            />

            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: isPaused ? "warning.dark" : "error.dark",
                fontSize: "0.78rem",
                fontVariantNumeric: "tabular-nums",
                flexShrink: 0,
              }}
            >
              {isPaused ? `Pausa ${formatDuration(recordDuration)}` : formatDuration(recordDuration)}
            </Typography>

            {/* Mini VU Meter bars */}
            <Stack direction="row" spacing={0.3} alignItems="flex-end" sx={{ height: 13, flexShrink: 0 }}>
              {[0.4, 0.7, 1.0, 0.6, 0.8].map((factor, idx) => {
                const h = isPaused
                  ? 3
                  : Math.max(3, Math.min(13, Math.round((audioLevel / 100) * 13 * factor)));
                return (
                  <Box
                    key={idx}
                    sx={{
                      width: 2.5,
                      height: h,
                      bgcolor: !isPaused && audioLevel > 5 ? "error.main" : "text.disabled",
                      borderRadius: 1,
                      transition: "height 0.1s ease",
                    }}
                  />
                );
              })}
            </Stack>

            {/* Snippet de lo que se está dictando en vivo */}
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: liveTranscript ? "text.primary" : "text.secondary",
                fontSize: "0.72rem",
                fontStyle: liveTranscript ? "normal" : "italic",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
                minWidth: 0,
              }}
            >
              {liveTranscript || (isPaused ? "Grabación pausada" : "Escuchando dictado...")}
            </Typography>
          </Stack>

          {/* Trío de Botones de Control (Sin texto, solo iconos con Tooltip) */}
          <Stack direction="row" spacing={0.8} alignItems="center" flexShrink={0}>
            {/* 1. Botón Rojo a la izquierda: Detener y desechar */}
            <Tooltip title="Detener y desechar grabación">
              <span>
                <IconButton
                  size="small"
                  onClick={handleDiscard}
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: "error.main",
                    color: "white",
                    transition: "all 0.15s ease",
                    "&:hover": { bgcolor: "error.dark", transform: "scale(1.08)" },
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </span>
            </Tooltip>

            {/* 2. Botón Gris en medio: Pausa / Reanudar */}
            <Tooltip title={isPaused ? "Reanudar grabación" : "Pausar grabación"}>
              <span>
                <IconButton
                  size="small"
                  onClick={isPaused ? handleResume : handlePause}
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark" ? "rgba(255,255,255,0.15)" : "#94a3b8",
                    color: "white",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark" ? "rgba(255,255,255,0.25)" : "#64748b",
                      transform: "scale(1.08)",
                    },
                  }}
                >
                  {isPaused ? (
                    <PlayArrowIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <PauseIcon sx={{ fontSize: 17 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>

            {/* 3. Botón Verde a la derecha: Enviar / Guardar */}
            <Tooltip title="Finalizar y guardar nota de voz">
              <span>
                <IconButton
                  size="small"
                  onClick={handleSendAndSave}
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: "#16a34a",
                    color: "white",
                    transition: "all 0.15s ease",
                    "&:hover": { bgcolor: "#15803d", transform: "scale(1.08)" },
                  }}
                >
                  <SendIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      )}

      {/* Estado Guardado: Audio Adjunto Incorporado */}
      {audioUrl && !isRecording && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            py: 0.8,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <CheckCircleIcon color="primary" sx={{ fontSize: 18, flexShrink: 0 }} />
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.75rem", flexShrink: 0 }}
            >
              Audio ({formatDuration(recordDuration)}):
            </Typography>
            <Box
              component="audio"
              controls
              src={audioUrl}
              onPlay={(e) => {
                const el = e.currentTarget as HTMLAudioElement;
                el.volume = 1.0;
                el.muted = false;
              }}
              sx={{ height: 28, maxWidth: 220 }}
            />
          </Stack>

          <Tooltip title="Eliminar nota de voz">
            <IconButton size="small" color="error" onClick={handleDiscard} sx={{ p: 0.5 }}>
              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
