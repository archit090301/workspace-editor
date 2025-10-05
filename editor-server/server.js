import express from "express";
import cors from "cors";
import session from "express-session";
import connectMySQL from "express-mysql-session";
import passport from "passport";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://workspace-editor.vercel.app",
  "https://editor-server-o637.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS not allowed for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

const MySQLStore = connectMySQL(session);

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000, 
  expiration: 24 * 60 * 60 * 1000, 
});

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

import passportConfig from "./config/passport.js";
passportConfig(passport);

app.use(passport.initialize());
app.use(passport.session());

import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import fileRoutes from "./routes/files.js";
import runRoutes from "./routes/run.js";
import friendRoutes from "./routes/friends.js";
import adminRoutes from "./routes/admin.js";
import aiRoutes from "./routes/ai.js";

app.use("/api", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", fileRoutes);
app.use("/api/run", runRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

import("./sockets/collab.js")
  .then(({ default: collab }) => collab(io))
  .catch((err) => console.error("Socket load error:", err));

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`)
  );
}

export { app, server };
export default app;
