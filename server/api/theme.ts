import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const THEME_PROMPT = `
Generate a color palette for a user interface based on the following mood or atmosphere: "{mood}".
The palette should include colors suitable for a modern web application, including:
- A primary color
- Background colors
- Text colors
- Accent colors
- Border colors

Return the response in a JSON format with hex color codes, structured like this:
{
  "primary": "#hexcode",
  "variant": "professional" | "tint" | "vibrant",
  "appearance": "light" | "dark" | "system",
  "radius": number (between 0.5 and 1.5)
}

Consider color theory and accessibility guidelines when generating the palette.
`;

router.post("/generate", async (req, res) => {
  try {
    const { mood } = req.body;
    
    if (!mood) {
      return res.status(400).json({ error: "Mood is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = THEME_PROMPT.replace("{mood}", mood);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response format");
    }
    
    const themeData = JSON.parse(jsonMatch[0]);
    
    // Validate the theme data
    if (!themeData.primary || !themeData.variant || !themeData.appearance || !themeData.radius) {
      throw new Error("Invalid theme data structure");
    }
    
    // Update theme.json
    const themePath = path.resolve(__dirname, "../../theme.json");
    await fs.writeFile(themePath, JSON.stringify(themeData, null, 2));
    
    res.json({ success: true, theme: themeData });
  } catch (error) {
    console.error("Theme generation error:", error);
    res.status(500).json({ error: "Failed to generate theme" });
  }
});

export default router;
