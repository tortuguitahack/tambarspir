import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&q=80&w=600";

async function generateWithRetry(name, retries = 3, baseDelay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              text: `A hyper-realistic studio photography of a luxury bottle of ${name}. No glasses. Pure white background, professional studio lighting. High-end product photography.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: "1K"
          }
        },
      });
      
      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("No image data in response");
    } catch (e) {
      const isRateLimit = e.message?.includes('429') || e.status === 429;
      if (i === retries - 1) throw e;
      
      const waitTime = isRateLimit ? baseDelay * Math.pow(2, i) : baseDelay;
      console.warn(`Attempt ${i + 1} failed for ${name}: ${e.message}. Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

const products = [
  "Johnnie Walker Blue Label",
  "Johnnie Walker Gold Reserve",
  "Johnnie Walker Green Label",
  "Johnnie Walker Aged 18 Years",
  "Johnnie Walker Swing",
  "Johnnie Walker Double Black",
  "Johnnie Walker Black Label",
  "Johnnie Walker Red Label",
  "Old Parr 12 Years",
  "Baileys Original Irish Cream",
  "Smirnoff Red Label",
  "Tanqueray London Dry Gin",
  "Fernet 1882",
  "Ron Añejo Carta Vieja",
  "Don Julio 1942",
  "Hennessy X.O"
];

async function generateImages() {
  const images = {};
  for (const name of products) {
    console.log(`Processing ${name}...`);
    try {
      const imageData = await generateWithRetry(name);
      images[name] = imageData;
      console.log(`Successfully generated image for ${name}`);
    } catch (e) {
      console.error(`Final failure for ${name}: ${e.message}. Using fallback image.`);
      images[name] = FALLBACK_IMAGE;
    }
  }
  
  fs.writeFileSync('generated_images.json', JSON.stringify(images, null, 2));
  console.log('Done!');
}

generateImages();
