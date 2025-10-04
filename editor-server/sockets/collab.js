const { v4: uuid } = require("uuid");
const axios = require("axios");

const rooms = {};
const userSockets = {}; 

module.exports = function attachCollab(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    socket.on("auth:register", ({ userId, username }) => {
      socket.data.userId = userId;
      socket.data.username = username;

      if (!userSockets[userId]) userSockets[userId] = new Set();
      userSockets[userId].add(socket.id);

      console.log(`🟢 Registered ${username} (${userId}) on ${socket.id}`);
    });

    socket.on("collab:invite_friend", ({ fromUser, toUserId, roomId }) => {
      const targets = userSockets[toUserId];
      if (!targets) {
        console.log(`⚠️ Friend ${toUserId} is offline, invite skipped`);
        return;
      }

      for (const sid of targets) {
        io.to(sid).emit("collab:invite", {
          fromUser,
          roomId,
          time: new Date().toISOString(),
        });
      }

      console.log(`💌 ${fromUser} invited ${toUserId} to join room ${roomId}`);
    });

    socket.on("collab:create_room", (_, cb) => {
      const roomId = uuid().slice(0, 8);
      rooms[roomId] = {
        code: "// Start collaborating…",
        language: "javascript",
        users: {},
      };
      cb && cb({ roomId });
      console.log(`🆕 Room created: ${roomId}`);
    });

    socket.on("collab:join_room", ({ roomId, username }, cb) => {
      if (!rooms[roomId]) {
        cb && cb({ ok: false, error: "Room not found" });
        return;
      }

      socket.join(roomId);
      rooms[roomId].users[socket.id] = username || "user";

      socket.data.roomId = roomId;
      socket.data.username = username || "user";

      cb &&
        cb({
          ok: true,
          state: {
            code: rooms[roomId].code,
            language: rooms[roomId].language,
            users: Object.values(rooms[roomId].users),
          },
        });

      io.to(roomId).emit("collab:user_list", Object.values(rooms[roomId].users));
      console.log(`👥 ${username} joined room ${roomId}`);
    });

    socket.on("collab:code_change", ({ roomId, code }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.code = code;
      socket.to(roomId).emit("collab:code_change", { code });
    });

    socket.on("collab:language_change", ({ roomId, language }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.language = language;
      io.to(roomId).emit("collab:language_change", { language });
    });

    socket.on("collab:cursor", ({ roomId, position }) => {
      socket.to(roomId).emit("collab:cursor", {
        socketId: socket.id,
        username: socket.data.username,
        position,
      });
    });

    socket.on("collab:typing", ({ roomId, isTyping }) => {
      socket.to(roomId).emit("collab:typing", {
        username: socket.data.username,
        isTyping,
      });
    });

    socket.on("collab:message", ({ roomId, text }) => {
      const { username } = socket.data || {};
      if (!roomId || !rooms[roomId]) return;

      const msg = {
        username: username || "user",
        text,
        time: new Date().toISOString(),
      };

      io.to(roomId).emit("collab:message", msg);
    });

    socket.on("collab:run_code", async ({ roomId, code, language }) => {
      try {
        const judge0Map = { javascript: 63, python: 71, cpp: 54, java: 62 };

        const { data } = await axios.post(
          "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
          {
            source_code: code,
            language_id: judge0Map[language] || 63,
            stdin: "",
          },
          {
            headers: {
              "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );

        let out = "";
        if (data.stdout) out += `✅ Output:\n${data.stdout}\n`;
        if (data.stderr) out += `⚠️ Runtime Error:\n${data.stderr}\n`;
        if (data.compile_output)
          out += `❌ Compilation Error:\n${data.compile_output}\n`;
        if (!out.trim()) out = "No output";

        io.to(roomId).emit("collab:run_result", { output: out });
      } catch (err) {
        console.error("Run failed:", err.message);
        io.to(roomId).emit("collab:run_result", { output: "Execution failed ❌" });
      }
    });

    socket.on("disconnect", () => {
      const { roomId, username, userId } = socket.data || {};

      if (userId && userSockets[userId]) {
        userSockets[userId].delete(socket.id);
        if (userSockets[userId].size === 0) delete userSockets[userId];
      }

      if (roomId && rooms[roomId]) {
        delete rooms[roomId].users[socket.id];
        io.to(roomId).emit("collab:user_list", Object.values(rooms[roomId].users));

        if (Object.keys(rooms[roomId].users).length === 0) {
          delete rooms[roomId];
          console.log(`🗑 Room ${roomId} deleted (empty)`);
        } else {
          console.log(`👋 ${username} left room ${roomId}`);
        }
      }

      console.log(`🔴 Socket disconnected: ${socket.id}`);
    });
  });
};

function mapLanguage(lang) {
  const judge0LanguageMap = {
    javascript: 63,
    python: 71,
    cpp: 54,
    java: 62,
  };
  return judge0LanguageMap[lang] || 63;
}
