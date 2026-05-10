import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyDUiyYyvwgLPqduWGqfptBSDha5U4Yf8t8" });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: 'A realistic bottle of Johnnie Walker Blue Label',
    });
    console.log("Success! Parts:", response.candidates[0].content.parts.length);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
