import { io } from "socket.io-client";

/**
 * Broadcasts an event to the Socket.io server from server-side route handlers or actions.
 * Returns a Promise that resolves once the event is emitted (or after timeout) so that
 * serverless / edge / Node.js handlers do not terminate prematurely.
 */
export async function broadcastSocketEvent(event: string, payload: any): Promise<void> {
  return new Promise((resolve) => {
    try {
      const socketUrl =
        process.env.SOCKET_URL ||
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        "http://localhost:3001";

      const socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        reconnection: false,
        timeout: 3000,
      });

      const fallbackTimer = setTimeout(() => {
        try {
          socket.disconnect();
        } catch (_) {}
        resolve();
      }, 2000);

      socket.on("connect", () => {
        socket.emit(event, payload);
        setTimeout(() => {
          clearTimeout(fallbackTimer);
          try {
            socket.disconnect();
          } catch (_) {}
          resolve();
        }, 100);
      });

      socket.on("connect_error", (error) => {
        console.error(`[socket-broadcast] Failed to connect to ${socketUrl}:`, error.message);
        clearTimeout(fallbackTimer);
        try {
          socket.disconnect();
        } catch (_) {}
        resolve();
      });
    } catch (error) {
      console.error("[socket-broadcast] Error broadcasting socket event:", error);
      resolve();
    }
  });
}
