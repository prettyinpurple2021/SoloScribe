import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

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

  app.use(express.json({ limit: "10mb" }));

  // Helper to construct GoogleGenAI instance with telemetry headers
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // API Routes
  // 1. Complex Tasks: Deep Thinking Mode using gemini-3.1-pro-preview & ThinkingLevel.HIGH
  app.post("/api/thinkDeeply", async (req, res) => {
    try {
      const { query, identity, context } = req.body;
      const ai = getAiClient();

      let systemInstruction = "You are Inklo, an elite high-velocity business strategist AI for solo founders. You generate structured, deeply reasoned, board-level strategic analyses.";
      if (identity) {
        systemInstruction += `\n\nGROUNDING_CONTEXT (Founder Core):\n- WHY: ${identity.why}\n- VISION: ${identity.vision}\n- CONSTRAINTS: ${identity.constraints}`;
      }
      if (context) {
        systemInstruction += `\n\nADDITIONAL_CONTEXT:\n${context}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: query,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      res.json({ text: response.text || "No response generated." });
    } catch (error: any) {
      console.error("Error in thinkDeeply:", error);
      res.status(500).json({ error: error.message || "An error occurred during deep thinking." });
    }
  });

  // 2. General Tasks: Quick Polish / Content Edit using gemini-3.5-flash
  app.post("/api/quickPolish", async (req, res) => {
    try {
      const { content, identity, instruction } = req.body;
      const ai = getAiClient();

      let identityContext = "";
      if (identity) {
        identityContext = `Ground the polish in original vision: ${identity.vision} and why: ${identity.why}. `;
      }

      const prompt = instruction
        ? `${instruction}\n\n${identityContext}\n\nDocument Content:\n${content}`
        : `Perform a quick polish on this business document. ${identityContext}Keep the tone professional, crisp, and high-energy for a founder. Fix errors and improve flow. Return Markdown format ONLY:\n\n${content}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ text: response.text || content });
    } catch (error: any) {
      console.error("Error in quickPolish:", error);
      res.status(500).json({ error: error.message || "An error occurred during content polish." });
    }
  });

  // 3. Fast Tasks: Ultra-fast analysis / tags / categorization using gemini-3.1-flash-lite
  app.post("/api/fastAnalyze", async (req, res) => {
    try {
      const { prompt } = req.body;
      const ai = getAiClient();

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });

      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Error in fastAnalyze:", error);
      res.status(500).json({ error: error.message || "An error occurred during fast analysis." });
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
