const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const passport = require("passport");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();

// ---- CORS ----
const allowedOrigins = [
  "http://localhost:5173",                // local dev
  "https://workspace-editor.vercel.app",  // ✅ your deployed frontend
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

// ---- Session Store in MySQL ----
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000, // 15 min
  expiration: 24 * 60 * 60 * 1000, // 1 day
});

// trust proxy (needed when behind Render/Heroku/EB)
app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production", // only send cookies over HTTPS
    },
  })
);

// ---- Passport (before routes) ----
require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());

// ---- Routes ----
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const fileRoutes = require("./routes/files");
const runRoutes = require("./routes/run");
const friendRoutes = require("./routes/friends");
const adminRoutes = require("./routes/admin");

app.use("/api", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", fileRoutes);
app.use("/api/run", runRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/", (req, res) => res.json({ ok: true }));

// ---- HTTP + Socket.IO ----
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Collaborative sockets
require("./sockets/collab")(io);

// ---- Start server ----
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`)
);
