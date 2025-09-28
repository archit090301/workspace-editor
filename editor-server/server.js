// server.js
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const passport = require("passport");
const http = require("http");              // ✅ new
const { Server } = require("socket.io");   // ✅ new
require("dotenv").config();

const app = express();

// ---- CORS
const allowedOrigins = [
  "http://localhost:5173",
  // add your deployed frontend here when ready:
  // "https://editor-haov.vercel.app"
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// ---- Session Store in MySQL
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

// trust proxy (needed when behind Render/EB load balancer)
app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// ---- Passport (must come BEFORE routes)
require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());

// ---- Routes (AFTER passport)
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const fileRoutes = require("./routes/files");
const runRoutes = require("./routes/run");
const friendRoutes = require("./routes/friends");

app.use("/api", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", fileRoutes);
app.use("/api/run", runRoutes);
app.use("/api/friends", friendRoutes);

// Health check
app.get("/", (req, res) => res.json({ ok: true }));

// ---- Create HTTP + Socket.IO server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);


// ---- Attach collaborative sockets
require("./sockets/collab")(io);  // ✅ you already created sockets/collab.js earlier

// ---- Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running http://localhost:${PORT}`));
