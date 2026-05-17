import { GoogleGenerativeAI } from "@google/generative-ai";

const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
    return new GoogleGenerativeAI(apiKey);
};

export const thinkDeeply = async (query: string, identity?: { why: string; vision: string; constraints: string }): Promise<string> => {
  const genAI = getAi();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp" });
  
  let systemPrompt = "You are Inklo, a high-velocity business strategist AI. Your goal is to provide elite strategy for a solo founder.";
  if (identity) {
    systemPrompt += `\n\nGROUNDING_CONTEXT (Founder Identity Core):\n- WHY: ${identity.why}\n- VISION: ${identity.vision}\n- CONSTRAINTS: ${identity.constraints}`;
  }
  
  const result = await model.generateContent(`${systemPrompt}\n\nUSER_QUERY: ${query}`);
  return result.response.text() || "No results found.";
};

export const quickPolish = async (content: string, identity?: { why: string; vision: string; constraints: string }): Promise<string> => {
  const genAI = getAi();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  
  let identityContext = "";
  if (identity) {
    identityContext = `Ground the polish in original vision: ${identity.vision} and why: ${identity.why}. `;
  }

  const prompt = `Perform a quick polish on this business strategist document. ${identityContext}Keep the tone professional but high-energy for a founder. Fix errors and improve flow. Markdown output ONLY:\n\n${content}`;
  const result = await model.generateContent(prompt);
  return result.response.text() || content;
};
