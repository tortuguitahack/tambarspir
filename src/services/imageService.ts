import { GoogleGenAI } from "@google/genai";
import { db, auth, doc, getDoc, setDoc, serverTimestamp } from '../firebase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface GeneratedImage {
  productName: string;
  imageUrl: string;
  style: string;
  updatedAt: any;
}

const LUXURY_STYLE_PROMPT = "A hyper-realistic studio photography of a luxury bottle of [PRODUCT]. Only the bottle is shown, standing elegantly in the center. The background is a sophisticated 3D environment with deep matte black and polished gold architectural accents, dramatic cinematic lighting with subtle lens flares, and a feeling of pure luxury. High-end advertising style, 8k resolution, razor-sharp details on glass, liquid, and metallic labels. No glasses or extra props.";

/**
 * Normaliza el nombre del producto para usarlo como ID en Firestore
 */
const normalizeId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '_');

export async function getExpertImage(productName: string): Promise<string | null> {
  const imageId = normalizeId(productName);
  const docRef = doc(db, 'product_images', imageId);

  try {
    // 1. Intentar obtener de Firestore primero (Caché)
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().imageUrl;
      }
    } catch (e: any) {
      // Si falla por estar offline, simplemente procedemos a la generación sin caché
      if (e.message?.includes('offline') || e.code === 'unavailable') {
        console.warn("Firestore offline, skipping cache check.");
      } else {
        throw e;
      }
    }

    // 2. Si no existe, generamos una nueva imagen.
    // Intentamos con el modelo de alta calidad primero, y fallamos hacia el estable si hay errores RPC o de permisos.
    const modelsToTry = [
      'gemini-3.1-flash-image-preview',
      'gemini-3-pro-image-preview',
      'gemini-2.5-flash-image'
    ];

    const prompt = LUXURY_STYLE_PROMPT.replace('[PRODUCT]', productName);
    let lastError = null;

    for (const modelName of modelsToTry) {
      // Loop de reintentos con retroceso exponencial para cada modelo
      const retries = 2;
      const baseDelay = 2000;
      
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`Generating expert image for ${productName} (Attempt ${i+1}) using ${modelName}...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [{ text: prompt }],
            },
            config: {
              imageConfig: {
                aspectRatio: "3:4",
                ...(modelName.includes('3') ? { imageSize: "1K" } : {})
              }
            },
          });

          const part = response.candidates?.[0]?.content?.parts?.find(p => (p as any).inlineData);
          if ((part as any)?.inlineData) {
            const base64Data = (part as any).inlineData.data;
            const imageUrl = `data:${(part as any).inlineData.mimeType};base64,${base64Data}`;

            // 3. Guardar en Firestore solo si el usuario está autenticado
            if (auth.currentUser) {
              try {
                await setDoc(docRef, {
                  productName,
                  imageUrl,
                  style: 'luxury_black_gold_3d',
                  modelUsed: modelName,
                  updatedAt: serverTimestamp()
                });
              } catch (e) {
                console.warn("Could not cache image in Firestore (unauthorized).");
              }
            }

            return imageUrl;
          }
          break; // Si no hay datos pero no hubo error, pasamos al siguiente modelo
        } catch (e: any) {
          lastError = e;
          const isRateLimit = e.message?.includes('429') || e.status === 429;
          
          if (isRateLimit && i < retries - 1) {
            const waitTime = baseDelay * Math.pow(2, i);
            console.warn(`Rate limit hit on ${modelName} for ${productName}. Retrying in ${waitTime}ms...`);
            await new Promise(r => setTimeout(r, waitTime));
            continue;
          }
          
          console.warn(`${modelName} failing with: ${e.message || 'Unknown error'}. Trying next strategy...`);
          break; // Salir del bucle de reintentos y probar el siguiente modelo
        }
      }
    }

    if (lastError) {
      if (lastError.message?.includes('429')) {
        console.warn("Gemini API Quota exhausted. Using premium fallback placeholder.");
        // Fallback a una imagen de alta calidad que encaje con la estética del sitio
        // Usamos un seed basado en el producto para que sea consistente
        const seed = productName.replace(/\s+/g, '').toLowerCase();
        return `https://picsum.photos/seed/${seed}/800/1067?blur=1`;
      }
      throw lastError;
    }
    return null;
  } catch (error: any) {
    console.error("Critical error in getExpertImage:", error);
    // Retornamos un fallback genérico ante cualquier error crítico para evitar estados rotos en la UI
    const seed = productName.replace(/\s+/g, '').toLowerCase();
    return `https://picsum.photos/seed/${seed}/800/1067?grayscale&blur=2`;
  }
}
