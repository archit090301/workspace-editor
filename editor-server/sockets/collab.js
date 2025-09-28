// sockets/collab.js
const { v4: uuid } = require("uuid");
const axios = require("axios");

const rooms = {};

module.exports = function attachCollab(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    // Create new room
    socket.on("collab:create_room", (_, cb) => {
      const roomId = uuid().slice(0, 8);
      rooms[roomId] = rooms[roomId] || {
        code: "// Start collaborating…",
        language: "javascript",
        users: {},
      };
      cb && cb({ roomId });
    });

    // Join room
    socket.on("collab:join_room", ({ roomId, username }, cb) => {
      if (!rooms[roomId]) {
        cb && cb({ ok: false, error: "Room not found" });
        return;
      }

      socket.join(roomId);
      rooms[roomId].users[socket.id] = username || "user";

      // save on socket for cleanup
      socket.data.roomId = roomId;
      socket.data.username = username || "user";

      // send current state to joining client
      cb &&
        cb({
          ok: true,
          state: {
            code: rooms[roomId].code,
            language: rooms[roomId].language,
            users: Object.values(rooms[roomId].users),
          },
        });

      // broadcast updated user list to all in room
      io.to(roomId).emit("collab:user_list", Object.values(rooms[roomId].users));
    });

    // Code changes
    socket.on("collab:code_change", ({ roomId, code }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.code = code;
      socket.to(roomId).emit("collab:code_change", { code });
    });

    // Language changes
    socket.on("collab:language_change", ({ roomId, language }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.language = language;
      io.to(roomId).emit("collab:language_change", { language });
    });

    // Cursor presence
    socket.on("collab:cursor", ({ roomId, cursor }) => {
      socket.to(roomId).emit("collab:cursor", { socketId: socket.id, cursor });
    });

    // sockets/collab.js (inside io.on("connection"))
socket.on("collab:message", ({ roomId, text }) => {
  const { username } = socket.data || {};
  if (!roomId || !rooms[roomId]) return;

  const msg = {
    username: username || "user",
    text,
    time: new Date().toISOString(),
  };

  // Send to everyone in room
  io.to(roomId).emit("collab:message", msg);
});


    // Run code (shared output)
    socket.on("collab:run_code", async ({ roomId, code, language }) => {
      try {
        const RUN_API =
  process.env.RUN_API_URL || "http://localhost:5000/api/run";

const { data } = await axios.post(RUN_API, {
  code,
  language,
  languageId: mapLanguage(language),
  stdin: "",
});


        let out = "";
        if (data.stdout) out += `✅ Output:\n${data.stdout}\n`;
        if (data.stderr) out += `⚠️ Runtime Error:\n${data.stderr}\n`;
        if (data.compile_output) out += `❌ Compilation Error:\n${data.compile_output}\n`;
        if (!out.trim()) out = "No output";

        io.to(roomId).emit("collab:run_result", { output: out });
      } catch (err) {
        console.error("Run failed:", err.message);
        io.to(roomId).emit("collab:run_result", { output: "Execution failed ❌" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const { roomId, username } = socket.data || {};
      if (!roomId || !rooms[roomId]) return;

      delete rooms[roomId].users[socket.id];

      io.to(roomId).emit("collab:user_list", Object.values(rooms[roomId].users));

      if (Object.keys(rooms[roomId].users).length === 0) {
        delete rooms[roomId];
        console.log(`🗑 Room ${roomId} deleted (empty)`);
      } else {
        console.log(`👋 ${username} left room ${roomId}`);
      }
    });
  });
};

// Helper: frontend language → Judge0 ID
function mapLanguage(lang) {
  const judge0LanguageMap = {
    javascript: 63,
    python: 71,
    cpp: 54,
    java: 62,
  };
  return judge0LanguageMap[lang] || 63;
}
