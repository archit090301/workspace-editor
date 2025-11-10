import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";


dotenv.config();

const router = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/chat", async (req, res) => {
  try {
    const { messages = [], context = {} } = req.body;

    const sysPrompt = [
      "You are an AI assistant embedded inside a browser code editor.",
      "Be concise. If asked to change code, output full replacement or focused snippet.",
      "User context may include code, input, output, and execution history."
    ].join(" ");

    const compiledMessages = [
      { role: "system", content: sysPrompt },
      {
        role: "system",
        content:
          `Context:\nLanguage: ${context.language}\n` +
          `File: ${context.fileName}\nProject: ${context.projectId}\n\n` +
          (context.code ? `Code:\n${context.code.slice(0, 8000)}\n\n` : "") +
          (context.stdin ? `Stdin:\n${context.stdin.slice(0, 2000)}\n\n` : "") +
          (context.output ? `Output:\n${context.output.slice(0, 2000)}\n\n` : "") +
          (context.history?.length
            ? "History:\n" + context.history.slice(0, 5).map(h => `- ${h.language} ${h.status} @ ${h.timestamp}`).join("\n")
            : "")
      },
      ...messages
    ];

    if (!process.env.OPENAI_API_KEY) {
      return res.json({ assistant: "🤖 (mock) AI response — no API key set." });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: compiledMessages,
      temperature: 0.2,
    });

    const assistant =
      completion.choices?.[0]?.message?.content || "⚠️ No response generated.";
    return res.json({ assistant });

  } catch (err) {
    console.error("AI error:", err.response?.status, err.response?.data || err.message);

    let assistantMessage = "❌ AI request failed (server error).";

    if (err.response?.status === 401) {
      assistantMessage = "❌ Invalid or missing OpenAI API key.";
    } else if (err.response?.status === 429) {
      assistantMessage = "⚠️ OpenAI quota exceeded. Please check your billing/plan.";
    } else if (err.response?.data?.error?.message) {
      assistantMessage = `❌ ${err.response.data.error.message}`;
    }

    return res.json({ assistant: assistantMessage });
  }
});

export default router;
