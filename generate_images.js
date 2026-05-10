import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

// Get API key from environment variable
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Please set the GEMINI_API_KEY environment variable.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&q=80&w=600";

async function generateWithRetry(name, retries = 3, baseDelay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              text: `A hyper-realistic studio photography of a luxury bottle of ${name}. Only the bottle is shown. The background is a sophisticated 3D environment with deep black and elegant gold accents, dramatic lighting, and cinematic atmosphere. High-end product photography style, 8k resolution, detailed glass and liquid textures. No glasses or other objects.`,
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
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
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
  { name: "Baileys Original Irish Cream 750ml", category: "Licor Crema" },
  { name: "Johnnie Walker Blue Label 750ml", category: "Whisky Escocés" },
  { name: "Johnnie Walker Gold Reserve 750ml", category: "Whisky Escocés" },
  { name: "Johnnie Walker Green Label 750ml", category: "Whisky Escocés" },
  { name: "Johnnie Walker Aged 18 Años 750ml", category: "Whisky Escocés" },
  { name: "Johnnie Walker Swing 750ml", category: "Whisky Escocés" },
  { 
    name: "Johnnie Walker Double Black", 
    category: "Whisky Escocés",
    variants: [
      { name: "750ml" },
      { name: "1L" }
    ]
  },
  { 
    name: "Johnnie Walker Black Label", 
    category: "Whisky Escocés",
    variants: [
      { name: "750ml" },
      { name: "1L" }
    ]
  },
  { 
    name: "Johnnie Walker Red Label", 
    category: "Whisky Escocés",
    variants: [
      { name: "750ml" },
      { name: "1L" }
    ]
  },
  { name: "Old Parr 1L", category: "Whisky Escocés" },
  { 
    name: "Vodka Smirnoff Red", 
    category: "Vodka",
    variants: [
      { name: "750ml" },
      { name: "1L" }
    ]
  },
  { 
    name: "Gin Tanqueray", 
    category: "Gin",
    variants: [
      { name: "750ml" },
      { name: "1L" }
    ]
  },
  { name: "Fernet 1882", category: "Fernet" },
  { name: "Ron Añejo Carta Vieja 1L", category: "Ron" },
  { name: "Terruño Blanco 700ml", category: "Vinos" },
  { name: "Terruño Tinto 700ml", category: "Vinos" },
  { name: "Terruño Oporto", category: "Vinos" },
  { name: "Vino Rosado Alma de Tannat 750ml", category: "Vinos" },
  { name: "Vino Cabernet Franc 750ml", category: "Vinos" },
  { name: "Singani Insignia Platinum 750ml", category: "Singani" },
  { name: "Cuba Libre F.O. Pet 500ml", category: "Cuba" }
];

async function generateImages() {
  const images = {};
  const filePath = 'public/generated_images.json';
  
  // Load existing images if any
  if (fs.existsSync(filePath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      Object.assign(images, existing);
    } catch (e) {
      console.error("Error reading existing images:", e);
    }
  }

  for (const product of products) {
    const baseName = product.name;
    const category = product.category || "";
    
    // Process base product
    if (!images[baseName]) {
      console.log(`Processing base product: ${baseName}...`);
      try {
        const imageData = await generateWithRetry(`${baseName} ${category}`);
        images[baseName] = imageData;
        console.log(`Successfully generated image for ${baseName}`);
      } catch (e) {
        console.error(`Final failure for ${baseName}: ${e.message}. Using fallback image.`);
        images[baseName] = FALLBACK_IMAGE;
      }
      
      // Save state after each base product
      fs.writeFileSync(filePath, JSON.stringify(images, null, 2));
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log(`Image for base product ${baseName} already exists, skipping...`);
    }

    // Process variants if they exist
    if (product.variants) {
      for (const variant of product.variants) {
        const variantFullName = `${baseName} ${variant.name}`;
        
        if (!images[variantFullName]) {
          console.log(`Processing variant: ${variantFullName}...`);
          try {
            const imageData = await generateWithRetry(`${variantFullName} ${category}`);
            images[variantFullName] = imageData;
            console.log(`Successfully generated image for ${variantFullName}`);
          } catch (e) {
            console.error(`Final failure for ${variantFullName}: ${e.message}. Using fallback image.`);
            images[variantFullName] = FALLBACK_IMAGE;
          }
          
          // Save state after each variant
          fs.writeFileSync(filePath, JSON.stringify(images, null, 2));
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.log(`Image for variant ${variantFullName} already exists, skipping...`);
        }
      }
    }
  }
  
  console.log('Done! All images and variants processed and saved to public/generated_images.json');
}

generateImages();
