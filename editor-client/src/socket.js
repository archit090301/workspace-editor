// src/socket.js
import { io } from "socket.io-client";

// Use env var in production, fallback to localhost for dev
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
});
