"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthContext";
import { useNotification } from "./NotificationProvider";
import { tokenStore } from "@/lib/api/token-store";
import { soundManager } from "@/utils/notification-sound";

interface SseContextType {
  // Can be extended with connection state if needed
  isConnected: boolean;
}

const SseContext = createContext<SseContextType>({ isConnected: false });

export const useSse = () => useContext(SseContext);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

export const SseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { session } = useAuth();
  const { showInfo } = useNotification();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!session?.user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const connectSse = () => {
      const token = tokenStore.getToken();
      if (!token) return;

      const sseUrl = `${API_BASE_URL}/notifications/sse?token=${encodeURIComponent(
        token
      )}`;

      try {
        const es = new EventSource(sseUrl);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (!payload || payload.type === "HEARTBEAT") {
              return;
            }

            // Notificación dirigida al usuario
            if (payload.type === "NOTIFICATION" && payload.notification) {
              const notif = payload.notification;
              showInfo(`${notif.title}: ${notif.message}`);

              // Emitir evento global de notificación
              window.dispatchEvent(
                new CustomEvent("app:notification", { detail: notif })
              );
            }

            // Evento de actualización de PQRS para invalidar caches reactivamente
            if (payload.type === "PQRS_UPDATED") {
              const isSelfAction =
                Boolean(payload.triggeredById) &&
                payload.triggeredById === session?.user?.id;

              if (!isSelfAction) {
                soundManager.play("ticket");
                soundManager.notifyTabBackground("🔔 Nueva actividad - PQRS");
              }

              window.dispatchEvent(
                new CustomEvent("app:pqrs_updated", { detail: payload })
              );
            }

            // Evento de mensaje nuevo en el hilo de conversación (sin parpadeos de tabla)
            if (payload.type === "PQRS_MESSAGE_ADDED") {
              const messageAuthorId =
                payload.message?.createdById ||
                payload.message?.createdBy?.id ||
                payload.triggeredById;
              const isSelfAction =
                Boolean(messageAuthorId) && messageAuthorId === session?.user?.id;

              if (!isSelfAction) {
                soundManager.play("message");
                soundManager.notifyTabBackground("🔔 Nuevo mensaje - PQRS");
              }

              window.dispatchEvent(
                new CustomEvent("app:pqrs_message_added", { detail: payload })
              );
            }
          } catch (e) {
            console.error("Error al procesar evento SSE:", e);
          }
        };

        es.onerror = () => {
          es.close();
          eventSourceRef.current = null;
          // Reintentar reconexión en 8 segundos
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            if (session?.user) {
              connectSse();
            }
          }, 8000);
        };
      } catch (err) {
        console.error("Error al iniciar conexión SSE:", err);
      }
    };

    connectSse();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [session, showInfo]);

  return (
    <SseContext.Provider value={{ isConnected: Boolean(eventSourceRef.current) }}>
      {children}
    </SseContext.Provider>
  );
};
