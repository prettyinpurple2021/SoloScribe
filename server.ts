import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Environment Validation
  if (!process.env.GEMINI_API_KEY) {
    console.error("=========================================");
    console.error("❌ ERROR: GEMINI_API_KEY is not set.");
    console.error("Please add it to your environment variables.");
    console.error("The application will not function correctly.");
    console.error("=========================================");
    if (process.env.NODE_ENV === "production") {
       process.exit(1); // Fail fast in production
    }
  }

  app.use(express.json());

  // API Routes
  app.post("/api/thinkDeeply", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set." });
      }

      const { query, identity } = req.body;
      const ai = new GoogleGenAI({ apiKey });

      let systemPrompt = "You are Inklo, a high-velocity business strategist AI. Your goal is to provide elite strategy for a solo founder.";
      if (identity) {
        systemPrompt += `\n\nGROUNDING_CONTEXT (Founder Identity Core):\n- WHY: ${identity.why}\n- VISION: ${identity.vision}\n- CONSTRAINTS: ${identity.constraints}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // updated to modern model
        contents: `${systemPrompt}\n\nUSER_QUERY: ${query}`,
      });

      res.json({ text: response.text || "No results found." });
    } catch (error: any) {
      console.error("Error in thinkDeeply:", error);
      res.status(500).json({ error: error.message || "An error occurred." });
    }
  });

  app.post("/api/quickPolish", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set." });
      }

      const { content, identity } = req.body;
      const ai = new GoogleGenAI({ apiKey });

      let identityContext = "";
      if (identity) {
        identityContext = `Ground the polish in original vision: ${identity.vision} and why: ${identity.why}. `;
      }

      const prompt = `Perform a quick polish on this business strategist document. ${identityContext}Keep the tone professional but high-energy for a founder. Fix errors and improve flow. Markdown output ONLY:\n\n${content}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ text: response.text || content });
    } catch (error: any) {
      console.error("Error in quickPolish:", error);
      res.status(500).json({ error: error.message || "An error occurred." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
