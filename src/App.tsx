/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  MessageCircle, 
  Share2, 
  Menu, 
  X, 
  ChevronRight, 
  Wine, 
  GlassWater, 
  Beer,
  ChevronLeft,
  Filter,
  Sparkles,
  Star,
  Loader2,
  Rotate3d,
  MoveHorizontal,
  Image as ImageIcon,
  Eye,
  FileText,
  Heart,
  User as UserIcon,
  LogOut,
  LogIn,
  Send,
  Trash2,
  AlertCircle,
  Globe,
  Tag,
  MapPin,
  Clock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowUpDown
} from "lucide-react";
import { useState, useMemo, MouseEvent, TouchEvent, useEffect, useRef, ReactNode, FormEvent } from "react";
import * as React from "react";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  handleFirestoreError,
  OperationType,
  Timestamp,
  testConnection,
  onAuthStateChanged
} from "./firebase";
import { getExpertImage } from "./services/imageService";
import type { User as FirebaseUser } from "firebase/auth";

// Initialize Gemini
// Actualizado a 16 de Abril de 2026
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.965 1.406-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.261 7.929-7.261 4.162 0 7.398 2.967 7.398 6.93 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.62 0 11.988-5.367 11.988-11.987C24.005 5.367 18.637 0 12.017 0z"/>
  </svg>
);


interface Variant {
  id: string;
  name: string;
  price: string;
  price_numeric: number;
  images?: string[];
}

interface Product {
  id: number;
  name: string;
  category: string;
  type: string;
  notes: string[];
  description: string;
  images: string[];
  featured: boolean;
  threeSixtyImages?: string[];
  price?: string;
  price_numeric?: number;
  origin?: string;
  variants?: Variant[];
}

interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: 'user' | 'admin';
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  productId: number;
  rating: number;
  comment: string;
  createdAt: any;
}

interface Favorite {
  id: string;
  userId: string;
  productId: number;
  productName: string;
}

/**
 * Componente para mostrar imágenes expertas generadas por IA
 */
const ExpertImage = ({ productName, fallbackImage, className }: { productName: string, fallbackImage: string, className?: string }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Load slightly before it enters viewport
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let isMounted = true;
    const fetchImage = async () => {
      setLoading(true);
      const expertImg = await getExpertImage(productName);
      if (isMounted) {
        setImageUrl(expertImg);
        setLoading(false);
      }
    };
    fetchImage();
    return () => { isMounted = false; };
  }, [productName, isVisible]);

  if (loading || !isVisible) {
    return (
      <div ref={containerRef} className={`relative bg-obsidian animate-pulse flex items-center justify-center ${className}`}>
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <motion.img
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      src={imageUrl || fallbackImage}
      alt={productName}
      className={className}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
};
const products: Product[] = [
  {
    id: 1,
    name: "Baileys Original Irish Cream 750ml",
    category: "Licor Crema",
    type: "Licor Crema",
    notes: ["Cacao", "Vainilla", "Crema Irlandesa"],
    description: "Una sinfonía aterciopelada que entrelaza la pureza de la crema láctea irlandesa con el carácter indomable del whisky añejo. Cada gota es un susurro de indulgencia, revelando capas profundas de cacao tostado y vainas de vainilla de Madagascar. Un tributo a la tradición celta, diseñado para acariciar el paladar y transformar cualquier instante en una celebración de puro lujo.",
    images: ["/imagenestambar/download.jpeg"],
    featured: false,
    price: "Bs 280.00",
    price_numeric: 280,
    origin: "Irlanda"
  },
  {
    id: 2,
    name: "Johnnie Walker Blue Label 750ml",
    category: "Whisky Escocés",
    type: "Whisky",
    notes: ["Ahumado", "Avellana", "Sándalo"],
    description: "El pináculo indiscutible del arte del ensamblaje. Nacido de barricas seleccionadas a mano, donde solo una de cada diez mil posee el carácter esquivo necesario para llevar esta etiqueta. Su perfil despliega un tapiz sensorial de avellanas tostadas, miel oscura y un humo de turba etéreo que se desvanece con la elegancia de la seda. Una obra maestra líquida reservada para los paladaales más eruditos.",
    images: ["/imagenestambar/download (1).jpeg"],
    featured: true,
    price: "Bs 2150.00",
    price_numeric: 2150,
    origin: "Escocia"
  },
  {
    id: 3,
    name: "Johnnie Walker Gold Reserve 750ml",
    category: "Whisky Escocés",
    type: "Whisky",
    notes: ["Miel", "Fruta Tropical", "Roble"],
    description: "Una oda dorada a la opulencia. Este blend extraordinario captura la esencia de las celebraciones más fastuosas. Su corazón late con maltas de Clynelish, aportando una textura cremosa inigualable que se funde con néctar de miel silvestre, frutas tropicales maduras y un eco sutil de roble tostado. Un destilado vibrante que brilla con luz propia en la copa.",
    images: ["/imagenestambar/download (2).jpeg"],
    featured: false,
    price: "Bs 650.00",
    price_numeric: 650,
    origin: "Escocia"
  },
  {
    id: 4,
    name: "Johnnie Walker Green Label 750ml",
    category: "Whisky Escocés",
    type: "Whisky",
    notes: ["Pino", "Sándalo", "Fruta Fresca"],
    description: "El secreto mejor guardado de Escocia. Un vatted malt excepcional que armoniza exclusivamente whiskies de malta madurados por un mínimo de 15 años. Su alma es un paseo por los bosques escoceses tras la lluvia: notas vibrantes de pino fresco, sándalo exótico y un final ahumado que recuerda a las fogatas en las Tierras Altas. Pura poesía botánica.",
    images: ["/imagenestambar/download (3).jpeg"],
    featured: false,
    price: "Bs 720.00",
    price_numeric: 720,
    origin: "Escocia"
  },
  {
    id: 5,
    name: "Johnnie Walker Aged 18 Años 750ml",
    category: "Whisky Escocés",
    type: "Whisky",
    notes: ["Cítricos", "Almendras", "Vainilla"],
    description: "La culminación de la paciencia y el tiempo. Durante 18 largos años, este destilado ha reposado en la oscuridad de las bodegas, forjando un carácter de sofisticación inigualable. Despliega un abanico de compota de frutas oscuras, almendras garrapiñadas y una estela de cítricos confitados que danzan sobre un fondo de vainilla cálida. Un lujo maduro y reflexivo.",
    images: ["/imagenestambar/download (4).jpeg"],
    featured: true,
    price: "Bs 890.00",
    price_numeric: 890,
    origin: "Escocia"
  },
  {
    id: 6,
    name: "Johnnie Walker Swing 750ml",
    category: "Whisky Escocés",
    type: "Whisky",
    notes: ["Caramelo", "Especias", "Fruta Dulce"],
    description: "Una reliquia de la era dorada de los viajes transatlánticos. Creado en 1932 por Sir Alexander Walker, su icónica botella fue diseñada para mecerse con el movimiento de las olas sin derramarse. En su interior, aguarda un blend suntuoso y profundo, rico en notas de caramelo fundido, especias cálidas y un dulzor frutal que evoca la opulencia de los cruceros de lujo de antaño.",
    images: ["/imagenestambar/download (5).jpeg"],
    featured: false,
    price: "Bs 580.00",
    price_numeric: 580,
    origin: "Escocia"
  },
  {
    id: 7,
    name: "Johnnie Walker Double Black",
    category: "Whisky Escocés",
    type: "Whisky",
    notes: ["Turba", "Humo", "Frutos Secos"],
    description: "La oscuridad elevada a su máxima expresión. Inspirado en el icónico Black Label, este blend audaz se adentra en territorios inexplorados al madurar en barricas de roble profundamente carbonizadas. El resultado es un torbellino de humo de turba intenso, ceniza de hoguera y frutos secos tostados, diseñado para aquellos que buscan emociones fuertes y un carácter indomable.",
    images: ["/imagenestambar/download (6).jpeg"],
    featured: false,
    price: "Bs 420.00",
    price_numeric: 420,
    origin: "Escocia",
    variants: [
      { id: "7-750", name: "750ml", price: "Bs 420.00", price_numeric: 420, images: ["/imagenestambar/download (7).jpeg"] },
      { id: "7-1000", name: "1L", price: "Bs 480.00", price_numeric: 480, images: ["/imagenestambar/download (6).jpeg"] }
    ]
  },
  {
    id: 9,
    name: "Johnnie Walker Black Label",
    category: "Whisky Escocés",
    type: "Whisky",
    notes: ["Vainilla", "Humo Suave", "Fruta Oscura"],
    description: "El estándar de oro por el cual se miden todos los demás blends de lujo. Una sinfonía magistral de más de 40 whiskies, cada uno añejado por un mínimo de 12 años. Su perfil es un viaje sensorial a través de las cuatro esquinas de Escocia: notas de vainilla sedosa, frutas oscuras compotadas y el inconfundible y elegante final ahumado de la casa Walker.",
    images: ["/imagenestambar/download (8).jpeg"],
    featured: false,
    price: "Bs 390.00",
    price_numeric: 390,
    origin: "Escocia",
    variants: [
      { id: "9-750", name: "750ml", price: "Bs 390.00", price_numeric: 390, images: ["/imagenestambar/download (9).jpeg"] },
      { id: "9-1000", name: "1L", price: "Bs 450.00", price_numeric: 450, images: ["/imagenestambar/download (8).jpeg"] }
    ]
  },
  {
    id: 11,
    name: "Johnnie Walker Red Label",
    category: "Whisky Escocés",
    type: "Whisky",
    notes: ["Manzana Fresca", "Canela", "Pimienta"],
    description: "El pionero que llevó el whisky escocés a todos los rincones del globo. Un blend vibrante, audaz y lleno de carácter, que estalla en el paladar con la frescura de la manzana verde, el calor de la canela y un final picante de pimienta negra. La chispa perfecta para encender cualquier celebración con energía inagotable.",
    images: ["/imagenestambar/download (10).jpeg"],
    featured: false,
    price: "Bs 220.00",
    price_numeric: 220,
    origin: "Escocia",
    variants: [
      { id: "11-750", name: "750ml", price: "Bs 220.00", price_numeric: 220, images: ["/imagenestambar/download (11).jpeg"] },
      { id: "11-1000", name: "1L", price: "Bs 280.00", price_numeric: 280, images: ["/imagenestambar/download (10).jpeg"] }
    ]
  },
  {
    id: 13,
    name: "Old Parr 1L",
    category: "Whisky Escocés",
    type: "Whisky",
    notes: ["Miel", "Malta Tostada", "Roble"],
    description: "Un tributo a la longevidad y la sabiduría, nombrado en honor a Thomas Parr. Su icónica botella craquelada guarda un líquido de color ámbar profundo, donde la malta tostada se abraza con la miel de brezo y un sutil especiado de roble. Un whisky clásico, redondo y reconfortante, ideal para compartir historias al calor del hogar.",
    images: ["/imagenestambar/download (12).jpeg"],
    featured: false,
    price: "Bs 410.00",
    price_numeric: 410,
    origin: "Escocia"
  },
  {
    id: 14,
    name: "Vodka Smirnoff Red",
    category: "Vodka",
    type: "Vodka",
    notes: ["Puro", "Neutro", "Cristalino"],
    description: "La quintaesencia de la pureza. Nacido de una receta tradicional rusa, este vodka es sometido a una triple destilación y filtrado diez veces a través de carbón vegetal. El resultado es un lienzo en blanco de claridad cristalina y suavidad inmaculada, la base perfecta para elevar cualquier cóctel a la categoría de arte.",
    images: ["/imagenestambar/download (13).jpeg"],
    featured: false,
    price: "Bs 120.00",
    price_numeric: 120,
    origin: "Estados Unidos",
    variants: [
      { id: "14-750", name: "750ml", price: "Bs 120.00", price_numeric: 120, images: ["/imagenestambar/download (14).jpeg"] },
      { id: "14-1000", name: "1L", price: "Bs 150.00", price_numeric: 150, images: ["/imagenestambar/download (13).jpeg"] }
    ]
  },
  {
    id: 16,
    name: "Gin Tanqueray",
    category: "Gin",
    type: "Gin",
    notes: ["Enebro", "Cilantro", "Angélica"],
    description: "El epítome del London Dry Gin. Destilado con una receta inalterada desde 1830, su perfil es una explosión botánica donde el enebro de la Toscana lidera una danza aromática con semillas de cilantro picante, raíz de angélica terrosa y regaliz dulce. Un espíritu crujiente y sofisticado que define la elegancia británica en cada sorbo.",
    images: ["/imagenestambar/download (15).jpeg"],
    featured: true,
    price: "Bs 310.00",
    price_numeric: 310,
    origin: "Reino Unido",
    variants: [
      { id: "16-750", name: "750ml", price: "Bs 310.00", price_numeric: 310, images: ["/imagenestambar/download (16).jpeg"] },
      { id: "16-1000", name: "1L", price: "Bs 380.00", price_numeric: 380, images: ["/imagenestambar/download (15).jpeg"] }
    ]
  },
  {
    id: 18,
    name: "Fernet 1882",
    category: "Fernet",
    type: "Fernet",
    notes: ["Hierbas Amargas", "Especias", "Balsámico"],
    description: "El alma rebelde de la coctelería. Un elixir oscuro y misterioso, macerado con una sinfonía secreta de hierbas, raíces y especias de todo el mundo. Su perfil es un viaje audaz: un amargor profundo y herbáceo que se entrelaza con notas balsámicas y un final mentolado que despierta los sentidos. La esencia de la pasión en una botella.",
    images: ["/imagenestambar/download (17).jpeg"],
    featured: false,
    price: "Bs 180.00",
    price_numeric: 180,
    origin: "Argentina"
  },
  {
    id: 19,
    name: "Ron Añejo Carta Vieja 1L",
    category: "Ron",
    type: "Ron",
    notes: ["Caramelo Tostado", "Vainilla", "Roble"],
    description: "El tesoro líquido del Caribe. Añejado pacientemente bajo el sol tropical en barricas de roble blanco, este ron adquiere un tono ámbar profundo y un carácter seductor. Sus notas de caramelo tostado, vainilla dulce y un eco sutil de madera lo convierten en un destilado cálido y envolvente, perfecto para saborear lentamente.",
    images: ["/imagenestambar/download (18).jpeg"],
    featured: false,
    price: "Bs 190.00",
    price_numeric: 190,
    origin: "Panamá"
  },
  {
    id: 20,
    name: "Terruño Blanco 700ml",
    category: "Vinos",
    type: "Vino",
    notes: ["Fruta Blanca", "Cítricos", "Mineral"],
    description: "La expresión más pura de la tierra. Un vino blanco luminoso y vibrante que captura la esencia de viñedos bañados por el sol. En nariz, despliega un bouquet de frutas blancas frescas y flores silvestres, mientras que en boca ofrece una acidez crujiente, notas cítricas y un final mineral elegante que invita a otro sorbo.",
    images: ["/imagenestambar/download (19).jpeg"],
    featured: false,
    price: "Bs 150.00",
    price_numeric: 150,
    origin: "Bolivia"
  },
  {
    id: 21,
    name: "Terruño Tinto 700ml",
    category: "Vinos",
    type: "Vino",
    notes: ["Frutos Rojos", "Especias", "Tierra"],
    description: "Un abrazo cálido en forma de vino. Este tinto robusto y estructurado es un reflejo fiel de su terruño de origen. Sus aromas a frutos rojos maduros se entrelazan con sutiles toques de especias y tierra húmeda. En el paladar, sus taninos aterciopelados y su final persistente lo convierten en el compañero ideal para veladas inolvidables.",
    images: ["https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&q=80&w=600"],
    featured: false,
    price: "Bs 140.00",
    price_numeric: 140,
    origin: "Bolivia"
  },
  {
    id: 22,
    name: "Terruño Oporto",
    category: "Vinos",
    type: "Vino",
    notes: ["Higos", "Nueces", "Chocolate"],
    description: "La indulgencia embotellada. Un vino fortificado de riqueza incomparable, donde el tiempo ha concentrado sus sabores hasta la perfección. Notas decadentes de higos secos, nueces tostadas y chocolate negro se funden en una textura almibarada y suntuosa. El broche de oro definitivo para cualquier banquete de lujo.",
    images: ["https://images.unsplash.com/photo-1559564484-e48b3e040ff4?auto=format&fit=crop&q=80&w=600"],
    featured: false,
    price: "Bs 220.00",
    price_numeric: 220,
    origin: "Bolivia"
  },
  {
    id: 23,
    name: "Vino Rosado Alma de Tannat 750ml",
    category: "Vinos",
    type: "Vino",
    notes: ["Fresas Frescas", "Pétalos de Rosa", "Cítricos"],
    description: "La elegancia en tono rubor. Un rosado cautivador que extrae la delicadeza oculta de la uva Tannat. Su perfil es una brisa primaveral: aromas a fresas recién recolectadas, sutiles notas de pétalos de rosa y una acidez cítrica refrescante que baila en el paladar. Una obra de arte líquida, vibrante y llena de vida.",
    images: ["https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?auto=format&fit=crop&q=80&w=600"],
    featured: false,
    price: "Bs 180.00",
    price_numeric: 180,
    origin: "Bolivia"
  },
  {
    id: 24,
    name: "Vino Cabernet Franc 750ml",
    category: "Vinos",
    type: "Vino",
    notes: ["Pimiento Asado", "Cereza Negra", "Grafito"],
    description: "La sofisticación rebelde. Un tinto de carácter distintivo y seductor, donde la elegancia del Cabernet Franc brilla con luz propia. Notas intrigantes de pimiento rojo asado se entrelazan con jugosas cerezas negras y un toque mineral de grafito. Sus taninos finos y su estructura impecable lo convierten en una joya enológica.",
    images: ["https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&q=80&w=600"],
    featured: false,
    price: "Bs 200.00",
    price_numeric: 200,
    origin: "Bolivia"
  },
  {
    id: 25,
    name: "Singani Insignia Platinum 750ml",
    category: "Singani",
    type: "Singani",
    notes: ["Uva Moscatel", "Flores Blancas", "Durazno"],
    description: "El destilado de altura elevado a la perfección. Nacido de uvas Moscatel de Alejandría cultivadas en los valles andinos más puros. Su destilación magistral captura la esencia floral de la uva, desplegando un bouquet embriagador de flores blancas, durazno maduro y un toque cítrico. Un espíritu cristalino, suave y de una elegancia sin parangón.",
    images: ["https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&q=80&w=600"],
    featured: true,
    price: "Bs 450.00",
    price_numeric: 450,
    origin: "Bolivia"
  },
  {
    id: 26,
    name: "Singani Insignia Etiqueta Negra 750ml",
    category: "Singani",
    type: "Singani",
    notes: ["Intenso", "Aromático", "Frutal"],
    description: "La tradición andina en su máxima expresión. Un singani de carácter robusto y profundamente aromático, que rinde homenaje a siglos de herencia vitivinícola en la altura. Su perfil es una explosión de notas frutales intensas y un final largo y cálido que acaricia el alma.",
    images: ["https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&q=80&w=600"],
    featured: false,
    price: "Bs 320.00",
    price_numeric: 320,
    origin: "Bolivia"
  },
  {
    id: 27,
    name: "Singani Insignia Etiqueta Roja 750ml",
    category: "Singani",
    type: "Singani",
    notes: ["Vibrante", "Cítrico", "Floral"],
    description: "La pasión embotellada. Un destilado vibrante y lleno de energía, diseñado para encender los sentidos. Sus notas cítricas brillantes se equilibran con un fondo floral delicado, creando una experiencia de degustación dinámica y refrescante, ideal para la coctelería de autor.",
    images: ["https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&q=80&w=600"],
    featured: false,
    price: "Bs 280.00",
    price_numeric: 280,
    origin: "Bolivia"
  },
  {
    id: 28,
    name: "Singani Insignia Etiqueta Azul 750ml",
    category: "Singani",
    type: "Singani",
    notes: ["Suave", "Equilibrado", "Uva Fresca"],
    description: "La armonía perfecta. Un singani que destaca por su suavidad excepcional y su equilibrio impecable. Cada sorbo revela la pureza de la uva fresca, con una textura sedosa que se desliza por el paladar, dejando una estela de elegancia sutil y refinada.",
    images: ["https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&q=80&w=600"],
    featured: false,
    price: "Bs 250.00",
    price_numeric: 250,
    origin: "Bolivia"
  },
  {
    id: 29,
    name: "Cuba Libre F.O. Pet 250ml",
    category: "Cuba",
    type: "Cuba",
    notes: ["Cola", "Ron", "Limón"],
    description: "El clásico caribeño, listo para disfrutar. Una mezcla efervescente y perfectamente equilibrada de ron añejo, refresco de cola premium y un toque cítrico de limón fresco. La libertad y la fiesta encapsuladas en un formato práctico para cualquier ocasión.",
    images: ["https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?auto=format&fit=crop&q=80&w=600"],
    featured: false,
    price: "Bs 15.00",
    price_numeric: 15,
    origin: "Bolivia"
  },
  {
    id: 30,
    name: "Cuba Libre F.O. Lata 350ml",
    category: "Cuba",
    type: "Cuba",
    notes: ["Cola", "Ron", "Limón"],
    description: "El clásico caribeño, listo para disfrutar. Una mezcla efervescente y perfectamente equilibrada de ron añejo, refresco de cola premium y un toque cítrico de limón fresco. La libertad y la fiesta encapsuladas en un formato práctico para cualquier ocasión.",
    images: ["https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?auto=format&fit=crop&q=80&w=600"],
    featured: false,
    price: "Bs 18.00",
    price_numeric: 18,
    origin: "Bolivia"
  },
  {
    id: 31,
    name: "Cuba Libre F.O. Pet 500ml",
    category: "Cuba",
    type: "Cuba",
    notes: ["Cola", "Ron", "Limón"],
    description: "El clásico caribeño, listo para disfrutar. Una mezcla efervescente y perfectamente equilibrada de ron añejo, refresco de cola premium y un toque cítrico de limón fresco. La libertad y la fiesta encapsuladas en un formato práctico para cualquier ocasión.",
    images: ["https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?auto=format&fit=crop&q=80&w=600"],
    featured: false,
    price: "Bs 25.00",
    price_numeric: 25,
    origin: "Bolivia"
  }
];

const types = ["Todos", "Whisky", "Vodka", "Gin", "Fernet", "Ron", "Vinos", "Singani", "Cuba", "Licor Crema"];
const allNotes = ["Todas", "Ahumado", "Especiado", "Afrutado", "Floral", "Dulce", "Cremoso", "Amargo", "Herbáceo", "Cítrico", "Vainilla", "Madera", "Crema Irlandesa", "Avellana", "Sándalo", "Fruta Tropical", "Roble", "Pino", "Fruta Fresca", "Almendras", "Caramelo", "Turba", "Humo", "Frutos Secos", "Humo Suave", "Fruta Oscura", "Manzana Fresca", "Canela", "Pimienta", "Miel", "Malta Tostada", "Puro", "Neutro", "Cristalino", "Enebro", "Cilantro", "Angélica", "Hierbas Amargas", "Balsámico", "Caramelo Tostado", "Fruta Blanca", "Mineral", "Frutos Rojos", "Tierra", "Higos", "Nueces", "Chocolate", "Fresas Frescas", "Pétalos de Rosa", "Pimiento Asado", "Cereza Negra", "Grafito", "Uva Moscatel", "Flores Blancas", "Durazno", "Intenso", "Aromático", "Frutal", "Vibrante", "Suave", "Equilibrado", "Uva Fresca", "Cola", "Limón"];
const origins = ["Todos", "Escocia", "Bolivia", "Irlanda", "Estados Unidos", "Reino Unido", "Argentina", "Panamá"];

function ProductCarousel({ images, name, isHovered }: { images: string[], name: string, isHovered: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current || !isHovered) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const next = (e: any) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e: any) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative aspect-[3/4] mb-8 overflow-hidden bg-obsidian group/carousel" 
      style={{ perspective: "1000px" }}
    >
      {/* Blurred background with parallax */}
      <motion.div
        className="absolute inset-0 z-0 opacity-30"
        animate={{
          x: isHovered ? mousePos.x * -10 : 0,
          y: isHovered ? mousePos.y * -10 : 0,
          scale: 1.1,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
      >
        <img 
          src={images[currentIndex]} 
          alt="" 
          className="w-full h-full object-cover blur-2xl"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 w-full h-full p-6 flex items-center justify-center"
        >
          <motion.div
            animate={{
              rotateY: isHovered ? mousePos.x * 12 : 0,
              rotateX: isHovered ? mousePos.y * -12 : 0,
              z: isHovered ? 50 : 0,
            }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            className="w-full h-full"
          >
            <ExpertImage 
              productName={name}
              fallbackImage={images[currentIndex]} 
              className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-obsidian/50 backdrop-blur-md flex items-center justify-center text-white/50 hover:text-gold opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 z-20"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-obsidian/50 backdrop-blur-md flex items-center justify-center text-white/50 hover:text-gold opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 z-20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {images.map((_, i) => (
              <div 
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-gold w-4' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ThreeSixtyModal({ product, isOpen, onClose }: { product: Product | null, isOpen: boolean, onClose: () => void }) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generation Settings
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageSize, setImageSize] = useState("1K");
  const [model, setModel] = useState("gemini-3.1-flash-image-preview");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (isOpen && product) {
      setPrompt(`A hyper-realistic studio photography of a luxury bottle of ${product.name} ${product.category}. No glasses. Pure white background, professional studio lighting. High-end product photography.`);
      if (product.threeSixtyImages) {
        setImages(product.threeSixtyImages);
      }
    } else {
      setImages([]);
      setCurrentIndex(0);
    }
  }, [isOpen, product]);

  const generateSequence = async () => {
    if (!product) return;
    setLoading(true);
    setProgress(0);
    setStatusMessage("Iniciando generación...");
    
    try {
      const angles = [0, 45, 90, 135, 180, 225, 270, 315];
      const validImages: string[] = [];
      
      for (let i = 0; i < angles.length; i++) {
        const angle = angles[i];
        setStatusMessage(`Generando imagen ${i + 1} de ${angles.length} (${angle}°)...`);
        
        let success = false;
        let retries = 0;
        const maxRetries = 3;
        let baseDelay = 2000;
        
        while (!success && retries < maxRetries) {
          try {
            const response = await genAI.models.generateContent({
              model: model,
              contents: {
                parts: [{ text: `${prompt} View from ${angle} degrees angle.` }]
              },
              config: {
                imageConfig: { aspectRatio: aspectRatio, imageSize: imageSize }
              }
            });
            
            for (const part of response.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                validImages.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                success = true;
                break;
              }
            }
            
            if (!success) {
              throw new Error("No image data in response");
            }
            
            setProgress(((i + 1) / angles.length) * 100);
            
            // Add a small delay between successful calls to avoid hitting rate limits
            if (i < angles.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
          } catch (error: any) {
            retries++;
            console.error(`Error generating angle ${angle} (attempt ${retries}):`, error);
            
            if (retries >= maxRetries) {
              setStatusMessage(`No se pudo generar la imagen ${i + 1} tras varios intentos. Se usará una imagen de referencia. Por favor, verifica tu conexión.`);
              // Use a placeholder if all retries fail
              validImages.push("https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&q=80&w=600");
              setProgress(((i + 1) / angles.length) * 100);
              success = true; // Move to the next angle
            } else {
              // Exponential backoff: 2s, 4s, 8s...
              const delay = baseDelay * Math.pow(2, retries - 1);
              setStatusMessage(`Reintentando imagen ${i + 1} en ${delay/1000}s...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
      }

      setImages(validImages);
      setStatusMessage("¡Secuencia generada con éxito!");
      
      // Cache the images in the product object (in-memory for this session)
      product.threeSixtyImages = validImages;
    } catch (error: any) {
      console.error("Error generating 360 sequence:", error);
      if (error?.message?.includes("quota") || error?.message?.includes("limit")) {
        setStatusMessage("Límite de generación alcanzado. Por favor, intenta de nuevo más tarde.");
      } else if (!navigator.onLine) {
        setStatusMessage("Sin conexión a internet. No se puede generar la secuencia 360°.");
      } else {
        setStatusMessage("Ocurrió un error inesperado al generar la secuencia. Verifica tu conexión e intenta de nuevo.");
      }
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMessage(""), 3000); // Clear message after 3s
    }
  };

  const handleMouseDown = (e: MouseEvent | TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
    setStartX(clientX);
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || images.length === 0) return;
    const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
    const deltaX = clientX - startX;
    
    if (Math.abs(deltaX) > 10) {
      const direction = deltaX > 0 ? -1 : 1;
      setCurrentIndex((prev) => (prev + direction + images.length) % images.length);
      setStartX(clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (images.length === 0) return;
    const delta = e.deltaY;
    const newZoom = Math.min(Math.max(zoom - delta * 0.001, 1), 5);
    setZoom(newZoom);
  };

  const adjustZoom = (amount: number) => {
    setZoom(prev => Math.min(Math.max(prev + amount, 1), 5));
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-4xl aspect-square md:aspect-[16/10] bg-obsidian border border-gold/30 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <span className="text-gold text-[10px] uppercase tracking-[0.5em] font-bold mb-1 block">Experiencia 360°</span>
                <h2 className="font-serif text-2xl text-white">{product.name}</h2>
              </div>
              <div className="flex items-center gap-4">
                {images.length > 0 && (
                  <button 
                    onClick={() => setImages([])}
                    className="text-gold text-[10px] uppercase tracking-widest font-bold hover:underline"
                  >
                    Nueva Generación
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-gold hover:text-obsidian transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div 
              ref={containerRef}
              className={`flex-grow relative flex items-center justify-center overflow-hidden ${images.length > 0 ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
              onMouseDown={images.length > 0 ? handleMouseDown : undefined}
              onMouseMove={images.length > 0 ? handleMouseMove : undefined}
              onMouseUp={images.length > 0 ? handleMouseUp : undefined}
              onMouseLeave={images.length > 0 ? handleMouseUp : undefined}
              onTouchStart={images.length > 0 ? handleMouseDown : undefined}
              onTouchMove={images.length > 0 ? handleMouseMove : undefined}
              onTouchEnd={images.length > 0 ? handleMouseUp : undefined}
              onWheel={images.length > 0 ? handleWheel : undefined}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-4 text-gold w-full max-w-xs mx-auto">
                  <Loader2 className="w-12 h-12 animate-spin" />
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-center">{statusMessage || "Renderizando Ángulos..."}</p>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                    <motion.div 
                      className="h-full bg-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-[10px] text-white/40">{Math.round(progress)}% Completado</p>
                </div>
              ) : images.length > 0 ? (
                <>
                  <motion.img 
                    src={images[currentIndex]} 
                    alt="360 View" 
                    className="h-[80%] object-contain pointer-events-none origin-center"
                    animate={{ scale: zoom }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Zoom Controls Overlay */}
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
                    <button 
                      onClick={() => adjustZoom(0.5)}
                      disabled={zoom >= 5}
                      className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-gold hover:text-obsidian transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-xl"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <div className="w-10 text-center text-[10px] text-white/40 font-bold bg-black/40 py-1 rounded-full border border-white/5">
                      {zoom.toFixed(1)}x
                    </div>
                    <button 
                      onClick={() => adjustZoom(-0.5)}
                      disabled={zoom <= 1}
                      className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-gold hover:text-obsidian transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-xl"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setZoom(1)}
                      className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-gold hover:text-obsidian transition-all shadow-xl"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4 text-white/40">
                      <MoveHorizontal className="w-4 h-4 animate-pulse" />
                      <span className="text-[10px] uppercase tracking-widest">Arrastra para rotar</span>
                      <MoveHorizontal className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gold"
                        animate={{ width: `${((currentIndex + 1) / images.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-8 w-full max-w-md px-6 py-8 overflow-y-auto custom-scrollbar max-h-full">
                  <div className="text-center">
                    <Rotate3d className="w-12 h-12 text-gold mx-auto mb-4" />
                    <h3 className="text-white font-serif text-xl mb-2">Generar Vista 360°</h3>
                    <p className="text-white/40 text-xs leading-relaxed">
                      Configura los parámetros para generar una secuencia de 8 imágenes de alta calidad utilizando IA para una experiencia inmersiva.
                    </p>
                  </div>

                  <div className="w-full space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2 font-bold">Prompt de Generación</label>
                      <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white text-sm p-3 rounded-none focus:outline-none focus:border-gold transition-colors custom-scrollbar resize-none"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2 font-bold">Modelo de IA</label>
                      <select 
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white text-sm p-3 rounded-none focus:outline-none focus:border-gold transition-colors"
                      >
                        <option value="gemini-3.1-flash-image-preview">Flash (Rápido)</option>
                        <option value="gemini-3-pro-image-preview">Pro (Calidad de Estudio)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2 font-bold">Relación de Aspecto</label>
                        <select 
                          value={aspectRatio}
                          onChange={(e) => setAspectRatio(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 text-white text-sm p-3 rounded-none focus:outline-none focus:border-gold transition-colors"
                        >
                          <option value="1:1">1:1 (Cuadrado)</option>
                          <option value="2:3">2:3 (Retrato Clásico)</option>
                          <option value="3:2">3:2 (Paisaje Clásico)</option>
                          <option value="3:4">3:4 (Retrato)</option>
                          <option value="4:3">4:3 (Paisaje)</option>
                          <option value="9:16">9:16 (Vertical)</option>
                          <option value="16:9">16:9 (Panorámico)</option>
                          <option value="21:9">21:9 (Cinemático)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2 font-bold">Resolución</label>
                        <select 
                          value={imageSize}
                          onChange={(e) => setImageSize(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 text-white text-sm p-3 rounded-none focus:outline-none focus:border-gold transition-colors"
                        >
                          <option value="1K">1K (Estándar)</option>
                          <option value="2K">2K (Alta Definición)</option>
                          <option value="4K">4K (Ultra HD)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={generateSequence}
                    className="w-full bg-gold text-obsidian py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generar Secuencia
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function QuickViewModal({ product, isOpen, onClose, reviews, user, onAddReview, onLogin }: { 
  product: Product | null, 
  isOpen: boolean, 
  onClose: () => void,
  reviews: Review[],
  user: AppUser | null,
  onAddReview: (productId: number, rating: number, comment: string) => Promise<void>,
  onLogin: () => void
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Reset variant selection when product changes
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariantId(product.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
  }, [product?.id]);

  if (!isOpen || !product) return null;

  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId) || null;
  const displayPrice = selectedVariant ? selectedVariant.price : (product.price || "Consultar precio");
  const displayImages = selectedVariant?.images || product.images;

  const productReviews = reviews.filter(r => r.productId === product.id);
  const avgRating = productReviews.length > 0 
    ? (productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length).toFixed(1)
    : "Nuevo";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;
    setSubmitting(true);
    await onAddReview(product.id, rating, comment);
    setSubmitting(false);
    setComment("");
    setRating(5);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-obsidian/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-6xl bg-obsidian border border-gold/20 overflow-hidden flex flex-col md:flex-row max-h-[95vh]"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-[130] w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-gold hover:text-obsidian transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Left: Product Image */}
            <div className="w-full md:w-5/12 aspect-square md:aspect-auto bg-black flex items-center justify-center relative overflow-hidden h-full min-h-[400px]">
              <ExpertImage 
                productName={selectedVariant ? `${product.name} ${selectedVariant.name}` : product.name}
                fallbackImage={displayImages[0]} 
                className="w-full h-full object-contain p-12"
              />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-obsidian to-transparent" />
              
              <div className="absolute top-10 left-10 flex items-center gap-4 bg-obsidian/40 backdrop-blur-md p-4 border border-white/5">
                <div className="text-center">
                  <div className="text-gold text-2xl font-serif">{avgRating}</div>
                  <div className="text-[8px] text-white/40 uppercase tracking-widest">Puntuación</div>
                </div>
                <div className="w-[1px] h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-white text-2xl font-serif">{productReviews.length}</div>
                  <div className="text-[8px] text-white/40 uppercase tracking-widest">Reseñas</div>
                </div>
              </div>
            </div>

            {/* Right: Info and Reviews */}
            <div className="w-full md:w-7/12 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-obsidian/50 flex flex-col h-full">
              <div className="mb-8">
                <div className="flex items-center gap-3 text-gold mb-4">
                  <Eye className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-[0.4em] font-bold">Detalles de Curaduría</span>
                </div>

                <h2 className="font-serif text-4xl text-white mb-4">{product.name}</h2>
                
                <div className="flex items-center gap-6 mb-8">
                  <span className="text-gold text-sm uppercase tracking-[0.3em] font-medium border-r border-white/10 pr-6">
                    {product.category}
                  </span>
                  <span className="text-white text-xl font-serif">
                    {displayPrice}
                  </span>
                </div>

                {product.variants && product.variants.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold mb-4">Seleccionar Edición / Tamaño</h4>
                    <div className="flex flex-wrap gap-4">
                      {product.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`flex flex-col items-center p-4 border transition-all duration-300 min-w-[100px] ${
                            selectedVariantId === v.id
                              ? 'bg-gold text-obsidian border-gold shadow-[0_5px_20px_rgba(212,175,55,0.2)]'
                              : 'bg-white/5 border-white/10 text-white/60 hover:border-gold/30 hover:text-gold hover:bg-white/10'
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-widest font-bold mb-1">{v.name}</span>
                          <span className={`text-xs font-serif ${selectedVariantId === v.id ? 'opacity-80' : 'text-white/40'}`}>
                            {v.price}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-white/60 text-lg font-light leading-relaxed mb-8 italic">
                  "{product.description}"
                </p>
                
                <div className="grid grid-cols-1 gap-6 mb-12">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold mb-4">Perfiles de Sabor</h4>
                    <div className="flex flex-wrap gap-3">
                      {product.notes.map(note => (
                        <span key={note} className="text-[10px] px-4 py-2 bg-white/5 text-white/60 border border-white/5 uppercase tracking-widest hover:border-gold/30 hover:text-gold transition-colors">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-white/5">
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold mb-4">Compartir Selección</h4>
                    <div className="flex items-center gap-4">
                      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#1877F2] transition-colors" title="Compartir en Facebook">
                        <Facebook className="w-5 h-5" />
                      </a>
                      <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Descubre ${product.name} en Licorería TAMBAR - La casa de licores premium más exclusiva.`)}`} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#1DA1F2] transition-colors" title="Compartir en X (Twitter)">
                        <Twitter className="w-5 h-5" />
                      </a>
                      <a href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(product.images[0])}&description=${encodeURIComponent(`Descubre ${product.name} en Licorería TAMBAR - La casa de licores premium más exclusiva.`)}`} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#E60023] transition-colors" title="Compartir en Pinterest">
                        <PinterestIcon className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews System */}
              <div className="pt-12 border-t border-white/10">
                <h3 className="font-serif text-2xl mb-8">Comunidad Tambar</h3>
                
                {/* Review Form */}
                {user ? (
                  <form onSubmit={handleSubmit} className="mb-12 bg-white/5 p-6 border border-white/5">
                    <h4 className="text-[10px] uppercase tracking-widest text-gold font-bold mb-6">Deja tu apreciación</h4>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-xs text-white/40">Calificación:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button 
                            key={s}
                            type="button"
                            onClick={() => setRating(s)}
                            className={`p-1 transition-all ${s <= rating ? 'text-gold' : 'text-white/20'}`}
                          >
                            <Star className={`w-5 h-5 ${s <= rating ? 'fill-gold' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative mb-6">
                      <textarea 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Escribe tus notas de cata o experiencia..."
                        className="w-full bg-obsidian border border-white/10 text-white p-4 text-sm focus:outline-none focus:border-gold/50 min-h-[100px] resize-none"
                        required
                        maxLength={1000}
                      />
                      <div className="absolute bottom-2 right-2 text-[8px] text-white/20 font-mono">
                        {comment.length} / 1000
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gold text-obsidian py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Publicar Reseña
                    </button>
                  </form>
                ) : (
                  <div className="mb-12 bg-gold/5 p-8 text-center border border-gold/10">
                    <p className="text-sm text-gold/80 mb-4">Inicia sesión para compartir tu experiencia con este licor.</p>
                    <button onClick={onLogin} className="text-gold uppercase text-[10px] font-bold tracking-widest hover:underline">Entrar ahora</button>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-8">
                  {productReviews.length > 0 ? (
                    productReviews.map((rev) => (
                      <div key={rev.id} className="group/review">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {rev.userPhoto ? (
                               <img src={rev.userPhoto} alt="" className="w-8 h-8 rounded-full border border-white/10" />
                            ) : (
                               <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                                 <UserIcon className="w-4 h-4" />
                               </div>
                            )}
                            <div>
                              <div className="text-xs text-white group-hover/review:text-gold transition-colors">{rev.userName}</div>
                              <div className="text-[8px] text-white/20 font-mono">
                                {rev.createdAt instanceof Timestamp ? rev.createdAt.toDate().toLocaleDateString() : 'Reciente'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-gold fill-gold' : 'text-white/10'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed pl-11">
                          {rev.comment}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-white/20 italic text-sm">
                      Aún no hay reseñas para este producto. Sé el primero en compartir tu opinión.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ExpertModal({ product, isOpen, onClose }: { product: Product | null, isOpen: boolean, onClose: () => void }) {
  const [review, setReview] = useState<string>("");
  const [artwork, setArtwork] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      generateExpertContent();
    } else {
      setReview("");
      setArtwork("");
    }
  }, [isOpen, product]);

  const generateExpertContent = async () => {
    if (!product) return;
    setLoading(true);
    try {
      // Generate Review
      const reviewResponse = await genAI.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Como un sommelier experto de clase mundial, escribe una reseña poética y técnica de 100 palabras para el licor "${product.name}" (${product.category}). Incluye notas de cata profundas, sugerencia de maridaje y el "alma" de la bebida. En español.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });
      setReview(reviewResponse.text || "");

      // Generate Artwork
      const artworkResponse = await genAI.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: {
          parts: [{ text: `A cinematic, hyper-realistic conceptual artwork of a luxury bottle of ${product.name} ${product.category}. No glasses, only the authentic bottle. Dark moody lighting, golden accents, floating in a void with liquid splashes and botanical elements representing its notes: ${product.notes.join(", ")}. 4k, professional photography style.` }]
        },
        config: {
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
        }
      });

      for (const part of artworkResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setArtwork(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
    } catch (error) {
      console.error("Error generating expert content:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-obsidian/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-obsidian border border-gold/20 overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-gold hover:text-obsidian transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full md:w-1/2 aspect-square bg-black flex items-center justify-center relative overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center gap-4 text-gold">
                  <Loader2 className="w-12 h-12 animate-spin" />
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold">Invocando al Sommelier...</p>
                </div>
              ) : artwork ? (
                <motion.img 
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={artwork} 
                  alt="Expert Artwork" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-white/20 flex flex-col items-center gap-4">
                  <ImageIcon className="w-16 h-16" />
                  <p className="text-xs uppercase tracking-widest">Visualización no disponible</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8">
                <span className="text-gold text-[10px] uppercase tracking-[0.5em] font-bold mb-2 block">Visión del Experto</span>
                <h2 className="font-serif text-3xl text-white">{product.name}</h2>
              </div>
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-3 text-gold mb-8">
                <Star className="w-5 h-5 fill-gold" />
                <span className="text-xs uppercase tracking-[0.4em] font-bold">Reseña del Sommelier</span>
              </div>

              {loading ? (
                <div className="space-y-4">
                  <div className="h-4 bg-white/5 animate-pulse w-full" />
                  <div className="h-4 bg-white/5 animate-pulse w-5/6" />
                  <div className="h-4 bg-white/5 animate-pulse w-4/6" />
                  <div className="h-4 bg-white/5 animate-pulse w-full" />
                </div>
              ) : (
                <div className="space-y-8">
                  <p className="font-serif text-xl md:text-2xl text-white/90 leading-relaxed italic">
                    "{review || "El alma de este destilado se revela en cada gota, una sinfonía de herencia y maestría."}"
                  </p>
                  
                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
                    <div>
                      <h4 className="text-gold text-[10px] uppercase tracking-widest font-bold mb-4">Notas de Cata</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.notes.map(note => (
                          <span key={note} className="text-[9px] px-2 py-1 bg-white/5 text-white/60 border border-white/10 uppercase tracking-widest">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-gold text-[10px] uppercase tracking-widest font-bold mb-4">Categoría</h4>
                      <p className="text-white/60 text-sm font-light">{product.category}</p>
                    </div>
                  </div>

                  <div className="pt-8">
                    <h4 className="text-gold text-[10px] uppercase tracking-widest font-bold mb-4">Maridaje Sugerido</h4>
                    <p className="text-white/40 text-sm font-light leading-relaxed">
                      Este ejemplar alcanza su máxima expresión acompañado de chocolate amargo al 70% o habanos de fortaleza media, permitiendo que las notas de {product.notes[0]} se expandan en el paladar.
                    </p>
                  </div>

                  <div className="pt-8 border-t border-white/5 mt-8">
                    <h4 className="text-gold text-[10px] uppercase tracking-widest font-bold mb-4">Compartir Experiencia</h4>
                    <div className="flex items-center gap-3">
                      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-[#1877F2] hover:bg-white/10 border border-white/5 hover:border-[#1877F2]/30 transition-all group" title="Compartir en Facebook">
                        <Facebook className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </a>
                      <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Descubre ${product.name} en Licorería TAMBAR - La casa de licores premium más exclusiva.`)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-[#1DA1F2] hover:bg-white/10 border border-white/5 hover:border-[#1DA1F2]/30 transition-all group" title="Compartir en X (Twitter)">
                        <Twitter className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </a>
                      <a href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(product.images[0])}&description=${encodeURIComponent(`Descubre ${product.name} en Licorería TAMBAR - La casa de licores premium más exclusiva.`)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-[#E60023] hover:bg-white/10 border border-white/5 hover:border-[#E60023]/30 transition-all group" title="Compartir en Pinterest">
                        <PinterestIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </a>
                      <button 
                        onClick={() => navigator.clipboard.writeText(window.location.href)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-gold hover:bg-white/10 border border-white/5 hover:border-gold/30 transition-all group" 
                        title="Copiar enlace"
                      >
                        <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Wine className="text-gold w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">TAMBAR SELECTION</span>
                </div>
                <button 
                  onClick={onClose}
                  className="text-gold text-[10px] uppercase tracking-widest font-bold hover:underline"
                >
                  Cerrar Galería
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface TechnicalDetails {
  abv: string;
  origen: string;
  anejamiento: string;
  ingredientes: string;
  temperatura: string;
  maridaje: string;
  curiosidad: string;
}

function TechnicalDetailsModal({ product, isOpen, onClose }: { product: Product | null, isOpen: boolean, onClose: () => void }) {
  const [details, setDetails] = useState<TechnicalDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      generateDetails();
    } else {
      setDetails(null);
    }
  }, [isOpen, product]);

  const generateDetails = async () => {
    if (!product) return;
    setLoading(true);
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Genera detalles técnicos para la bebida "${product.name}" (${product.category}). Devuelve un JSON con las siguientes claves: abv (ej. 40%), origen (país/región), anejamiento (ej. 12 años, sin añejar), ingredientes (principales), temperatura (ej. 18°C), maridaje (ej. Quesos fuertes, chocolate), curiosidad (un dato curioso corto).`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              abv: { type: Type.STRING },
              origen: { type: Type.STRING },
              anejamiento: { type: Type.STRING },
              ingredientes: { type: Type.STRING },
              temperatura: { type: Type.STRING },
              maridaje: { type: Type.STRING },
              curiosidad: { type: Type.STRING }
            },
            required: ["abv", "origen", "anejamiento", "ingredientes", "temperatura", "maridaje", "curiosidad"]
          }
        }
      });
      
      if (response.text) {
        setDetails(JSON.parse(response.text));
      }
    } catch (error) {
      console.error("Error generating technical details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-obsidian/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-obsidian border border-gold/20 overflow-hidden flex flex-col max-h-[90vh] p-8"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-gold hover:text-obsidian transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 text-gold mb-6">
              <FileText className="w-5 h-5" />
              <span className="text-xs uppercase tracking-[0.4em] font-bold">Ficha Técnica</span>
            </div>

            <h2 className="font-serif text-3xl text-white mb-8">{product.name}</h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-gold">
                <Loader2 className="w-12 h-12 animate-spin" />
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold">Analizando composición...</p>
              </div>
            ) : details ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pr-4">
                <DetailItem label="ABV" value={details.abv} />
                <DetailItem label="Origen" value={details.origen} />
                <DetailItem label="Añejamiento" value={details.anejamiento} />
                <DetailItem label="Ingredientes" value={details.ingredientes} />
                <DetailItem label="Temp. de Servicio" value={details.temperatura} />
                <DetailItem label="Maridaje" value={details.maridaje} />
                <div className="col-span-1 md:col-span-2 mt-4 p-4 bg-white/5 border border-white/10">
                  <h4 className="text-gold text-[10px] uppercase tracking-widest font-bold mb-2">Dato Curioso</h4>
                  <p className="text-white/80 text-sm font-light leading-relaxed">{details.curiosidad}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-white/40">
                <p>No se pudieron cargar los detalles técnicos.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="border-b border-white/10 pb-4">
      <h4 className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">{label}</h4>
      <p className="text-white text-sm">{value}</p>
    </div>
  );
}

function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar",
  isDestructive = false
}: { 
  isOpen: boolean, 
  title: string, 
  message: string, 
  onConfirm: () => void, 
  onCancel: () => void,
  confirmText?: string,
  cancelText?: string,
  isDestructive?: boolean
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-obsidian/90 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-obsidian border border-gold/20 p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 text-gold mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-serif text-2xl">{title}</h3>
            </div>
            <p className="text-white/60 text-sm mb-8 leading-relaxed">
              {message}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-3 border border-white/10 text-white/60 text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={`flex-1 px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-all ${
                  isDestructive 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-gold text-obsidian hover:bg-white'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}

function AppContent() {
  const shareProduct = (platform: string, product: Product) => {
    const url = window.location.href;
    const text = `Descubre ${product.name} en Licorería TAMBAR - La casa de licores premium más exclusiva.`;
    
    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "x":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "pinterest":
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(product.images[0])}&description=${encodeURIComponent(text)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<number, string>>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("Todos");
  const [selectedNote, setSelectedNote] = useState("Todas");
  const [selectedOrigin, setSelectedOrigin] = useState("Todos");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selected360Product, setSelected360Product] = useState<Product | null>(null);
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<Product | null>(null);
  const [selectedTechProduct, setSelectedTechProduct] = useState<Product | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [productList, setProductList] = useState<Product[]>(products);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  // Connection Test
  useEffect(() => {
    const checkConnection = async () => {
      const result = await testConnection();
      if (!result.success) {
        setConnectionError(result.message);
      } else {
        setConnectionError(null);
      }
    };
    checkConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDoc = await getDoc(doc(db, "users", fbUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as AppUser);
        } else {
          const newUser: AppUser = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || "Usuario",
            email: fbUser.email || "",
            photoURL: fbUser.photoURL || "",
            role: 'user'
          };
          await setDoc(doc(db, "users", fbUser.uid), {
            ...newUser,
            createdAt: serverTimestamp()
          });
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Favorites Listener
  useEffect(() => {
    if (!user) {
      setFavorites({});
      return;
    }

    const q = query(collection(db, "favorites"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favs: Record<number, string> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        favs[data.productId] = doc.id;
      });
      setFavorites(favs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "favorites"));

    return unsubscribe;
  }, [user]);

  // Global Reviews Listener
  useEffect(() => {
    const q = query(collection(db, "reviews"), where("createdAt", "!=", null));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs: Review[] = [];
      snapshot.docs.forEach(doc => {
        revs.push({ id: doc.id, ...doc.data() } as Review);
      });
      // Sort by date manually if needed or update rules for index
      setReviews(revs.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "reviews"));

    return unsubscribe;
  }, []);

  // Personalized Recommendations
  useEffect(() => {
    if (user && Object.keys(favorites).length > 0) {
      generateRecommendations();
    } else {
      setRecommendations([]);
    }
  }, [user, favorites]);

  const generateRecommendations = async () => {
    if (isRecommending) return;
    setIsRecommending(true);
    try {
      const favoriteProducts = products.filter(p => favorites[p.id]);
      const favoriteNames = favoriteProducts.map(p => p.name).join(", ");
      
      const response = await genAI.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Basado en los licores favoritos del usuario: [${favoriteNames}], recomienda 3 productos de esta lista: [${products.map(p => p.name).join(", ")}]. No repitas los favoritos. Devuelve solo los IDs de los productos recomendados como un JSON array de números.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER }
          }
        }
      });

      if (response.text) {
        const recommendedIds = JSON.parse(response.text);
        const recs = products.filter(p => recommendedIds.includes(p.id));
        setRecommendations(recs);
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
    } finally {
      setIsRecommending(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const toggleFavorite = async (e: MouseEvent, productId: number, productName: string) => {
    e.stopPropagation();
    if (!user) {
      handleLogin();
      return;
    }

    if (favorites[productId]) {
      showConfirmation(
        "Eliminar de favoritos",
        `¿Estás seguro de que deseas eliminar "${productName}" de tu lista de favoritos?`,
        async () => {
          try {
            await deleteDoc(doc(db, "favorites", favorites[productId]));
          } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, "favorites");
          }
        },
        true
      );
    } else {
      try {
        await setDoc(doc(db, "favorites", `${user.uid}_${productId}`), {
          userId: user.uid,
          productId,
          productName,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "favorites");
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return `Bs ${amount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const postReview = async (productId: number, rating: number, comment: string) => {
    if (!user) return;
    
    showConfirmation(
      "Publicar reseña",
      "¿Deseas publicar esta reseña? Otros usuarios podrán ver tu apreciación sobre este licor.",
      async () => {
        try {
          await setDoc(doc(collection(db, "reviews")), {
            userId: user.uid,
            userName: user.displayName,
            userPhoto: user.photoURL,
            productId,
            rating,
            comment,
            createdAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, "reviews");
        }
      }
    );
  };

  const filteredProducts = useMemo(() => {
    const filtered = productList.filter(product => {
      const typeMatch = selectedType === "Todos" || product.type === selectedType;
      const noteMatch = selectedNote === "Todas" || product.notes.includes(selectedNote);
      const favoriteMatch = !showFavoritesOnly || !!favorites[product.id];
      const originMatch = selectedOrigin === "Todos" || product.origin === selectedOrigin;
      const priceMatch = (product.price_numeric || 0) >= priceRange[0] && (product.price_numeric || 0) <= priceRange[1];
      
      return typeMatch && noteMatch && favoriteMatch && originMatch && priceMatch;
    });

    switch (sortBy) {
      case "price-low-high":
        return [...filtered].sort((a, b) => (a.price_numeric || 0) - (b.price_numeric || 0));
      case "price-high-low":
        return [...filtered].sort((a, b) => (b.price_numeric || 0) - (a.price_numeric || 0));
      case "name-a-z":
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case "name-z-a":
        return [...filtered].sort((a, b) => b.name.localeCompare(a.name));
      default:
        return filtered;
    }
  }, [selectedType, selectedNote, selectedOrigin, priceRange, productList, showFavoritesOnly, favorites, sortBy]);

  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showConfirmation = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDestructive
    });
  };

  const generateAllImages = async () => {
    if (!confirm("This will generate images for all products using your Gemini API key. It may take a few minutes. Continue?")) return;
    
    setIsGeneratingAll(true);
    const newImages: Record<string, string> = {};
    
    try {
      for (const product of products) {
        console.log(`Generating image for ${product.name}...`);
        try {
          const response = await genAI.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: {
              parts: [
                {
                  text: `A hyper-realistic studio photography of a luxury bottle of ${product.name} ${product.category}. No glasses. Pure white background, professional studio lighting. High-end product photography.`,
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
          
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              newImages[product.name] = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              break;
            }
          }
          
          // Wait a bit to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
          console.error(`Error generating image for ${product.name}:`, e);
          
          try {
            console.log(`Attempting to generate abstract fallback for ${product.name}...`);
            const fallbackResponse = await genAI.models.generateContent({
              model: 'gemini-3.1-flash-image-preview',
              contents: {
                parts: [
                  {
                    text: `Abstract artistic background, fluid shapes, luxurious textures, inspired by the tasting notes: ${product.notes.join(", ")}. Dark moody atmosphere with subtle golden accents. High resolution, elegant, minimalist.`,
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
            
            let fallbackSuccess = false;
            for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                newImages[product.name] = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                fallbackSuccess = true;
                break;
              }
            }
            
            if (!fallbackSuccess) {
              throw new Error("No image data in fallback response");
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (fallbackError) {
            console.error(`Error generating fallback image for ${product.name}:`, fallbackError);
            // Use a static placeholder if even the fallback generation fails
            newImages[product.name] = "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&q=80&w=600";
          }
        }
      }
      
      // Create a blob and download it
      const blob = new Blob([JSON.stringify(newImages, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated_images.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert("Images generated and downloaded! Please place the downloaded file in the public folder as 'generated_images.json'.");
    } catch (e: any) {
      console.error("Error in generateAllImages:", e);
      let errorMsg = "Ocurrió un error inesperado durante la generación masiva.";
      if (e?.message?.includes("quota") || e?.message?.includes("limit")) {
        errorMsg = "Has alcanzado el límite de cuota de la API de Gemini. Por favor, espera a que se restablezca e intenta de nuevo.";
      } else if (!navigator.onLine) {
        errorMsg = "Sin conexión a internet. La generación masiva requiere una conexión activa.";
      }
      alert(`${errorMsg}\n\nConsulta la consola para más detalles técnicos.`);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const socialLinks = [
    { icon: Facebook, label: "Facebook", color: "#1877F2" },
    { icon: Instagram, label: "Instagram", color: "#E4405F" },
    { icon: Twitter, label: "X (Twitter)", color: "#000000" },
    { icon: MessageCircle, label: "WhatsApp", color: "#25D366" },
    { icon: Share2, label: "Pinterest", color: "#BD081C" }
  ];

  return (
    <div className="min-h-screen bg-obsidian text-white selection:bg-gold/30">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDestructive={confirmModal.isDestructive}
      />
      {/* Connection Warning Banner */}
      <AnimatePresence>
        {connectionError && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed top-[80px] left-0 right-0 z-[45] bg-red-600/90 backdrop-blur-md text-white py-2 px-6 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold">
                {connectionError} <span className="opacity-60 ml-2 italic">Modo offline activado. Notarás funciones limitadas.</span>
              </p>
            </div>
            <button 
              onClick={() => {
                setConnectionError(null);
                testConnection().then(res => {
                  if (!res.success) setConnectionError(res.message);
                });
              }}
              className="text-[10px] uppercase tracking-widest font-bold border-b border-white hover:border-gold transition-all"
            >
              Reintentar Conexión
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-obsidian/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/LOGO TAMBAR.png" 
              alt="TAMBAR" 
              className="h-12 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.logo-text')?.classList.remove('hidden');
              }}
            />
            <div className="flex items-center gap-2 logo-text hidden">
              <Wine className="text-gold w-6 h-6" />
              <span className="font-serif text-2xl tracking-widest gold-text-gradient font-bold uppercase">TAMBAR</span>
            </div>
            {/* Connection Indicator */}
            <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 group cursor-help relative">
              <div 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                  connectionError ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)] animate-pulse'
                }`} 
              />
              <span className={`text-[7px] uppercase tracking-widest font-bold hidden sm:inline-block ${connectionError ? 'text-red-400' : 'text-emerald-400'}`}>
                {connectionError ? 'Offline' : 'Online'}
              </span>
              
              {/* Tooltip */}
              <div className="absolute top-full left-0 mt-2 p-2 bg-obsidian border border-white/10 rounded-md shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 w-40 backdrop-blur-xl">
                <p className="text-[9px] text-white/60 leading-tight">
                  {connectionError 
                    ? "Conexión limitada con la base de datos." 
                    : "Sincronización activa con Licorería TAMBAR."}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-10 text-sm uppercase tracking-[0.2em] font-medium text-white/60">
              <a href="#hero" className="hover:text-gold transition-colors">Inicio</a>
              <a href="#catalog" className="hover:text-gold transition-colors">Catálogo</a>
              {user && (
                <button 
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`flex items-center gap-2 transition-colors ${showFavoritesOnly ? 'text-gold' : 'hover:text-gold'}`}
                >
                  <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-gold' : ''}`} />
                  Mis Selecciones
                </button>
              )}
              <a href="#experience" className="hover:text-gold transition-colors">Experiencia</a>
            </nav>

            <div className="h-6 w-[1px] bg-white/10" />

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">{user.role}</span>
                  <span className="text-xs font-serif text-white">{user.displayName}</span>
                </div>
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-gold/30" />
                <button 
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-gold hover:bg-white/10 transition-all"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 bg-gold text-obsidian px-6 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </button>
            )}
          </div>

          <button 
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 z-40 bg-obsidian pt-24 px-6 md:hidden"
        >
          <nav className="flex flex-col gap-8 text-xl font-serif">
            <a href="#hero" onClick={() => setIsMenuOpen(false)} className="text-gold">Inicio</a>
            <a href="#catalog" onClick={() => setIsMenuOpen(false)}>Catálogo</a>
            <a href="#experience" onClick={() => setIsMenuOpen(false)}>Experiencia</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)}>Contacto</a>
          </nav>
        </motion.div>
      )}

      {/* Hero Section */}
      <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Bar Background"
            className="w-full h-full object-cover opacity-40 scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-transparent to-obsidian" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-gold text-sm tracking-[0.5em] uppercase mb-6 block font-medium">Licores de Clase Mundial</span>
            <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl mb-8 leading-tight">
              TAMBAR
            </h1>
            <div className="w-24 h-[1px] bg-gold mx-auto mb-8" />
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed mb-12">
              Donde cada copa es una celebración. Descubre nuestra curaduría exclusiva de los licores más finos del mundo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a href="#catalog" className="px-10 py-4 bg-gold text-obsidian font-bold uppercase tracking-widest text-sm hover:bg-white transition-all duration-300">
                Explorar Catálogo
              </a>
              <a href="#experience" className="px-10 py-4 border border-white/20 text-white font-bold uppercase tracking-widest text-sm hover:border-gold hover:text-gold transition-all duration-300">
                Ver Experiencia
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30"
        >
          <div className="w-[1px] h-16 bg-gradient-to-b from-gold to-transparent mx-auto" />
        </motion.div>
      </section>

      {/* Recommendations Section */}
      {user && recommendations.length > 0 && !showFavoritesOnly && (
        <section className="pt-32 pb-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-[1px] bg-gold" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold animate-pulse" />
              <h3 className="font-serif text-2xl uppercase tracking-widest">Recomendaciones para ti</h3>
            </div>
            <div className="flex-grow h-[1px] bg-white/5" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recommendations.map((product) => (
              <motion.div 
                key={`rec-${product.id}`}
                whileHover={{ y: -10 }}
                className="glass-card p-6 border-gold/20 flex flex-col items-center text-center group relative overflow-hidden"
              >
                <div className="absolute top-2 left-2 z-10">
                   <span className="bg-gold text-obsidian text-[8px] px-2 py-0.5 font-bold uppercase tracking-widest rounded-full">AI Match</span>
                </div>
                <div className="w-32 h-32 aspect-square relative mb-4">
                  <ExpertImage 
                    productName={product.name}
                    fallbackImage={product.images[0]} 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <h4 className="font-serif text-lg mb-2">{product.name}</h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-4">{product.category}</p>
                <button 
                  onClick={() => setSelectedQuickViewProduct(product)}
                  className="text-gold text-[10px] uppercase tracking-widest font-bold hover:underline"
                >
                  Descubrir ahora
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Section */}
      <section id="catalog" className={`${user && recommendations.length > 0 ? 'py-16' : 'py-32'} px-6 max-w-7xl mx-auto`}>
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl mb-6">
            {showFavoritesOnly ? "Mis Selecciones" : "Colección Premium"}
          </h2>
          <p className="text-white/40 max-w-xl mx-auto font-light">
            {showFavoritesOnly 
              ? "Tu curaduría personal de licores exquisitos guardados para momentos memorables." 
              : "Una selección meticulosa de licores que definen el estándar del lujo y la sofisticación."}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-16 space-y-8">
          <div className="flex flex-col md:flex-row items-start justify-center gap-12 border-b border-white/5 pb-12">
            <div className="flex flex-col items-center md:items-start gap-4 flex-1">
              <div className="flex items-center gap-2 text-gold text-[10px] uppercase tracking-widest font-bold">
                <Filter className="w-3 h-3" />
                Tipo de Licor
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {types.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all duration-300 border ${
                      selectedType === type 
                        ? 'bg-gold text-obsidian border-gold' 
                        : 'border-white/10 text-white/40 hover:border-gold/50 hover:text-gold'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center md:items-start gap-4 flex-1">
              <div className="flex items-center gap-2 text-gold text-[10px] uppercase tracking-widest font-bold">
                <Globe className="w-3 h-3" />
                Origen
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {origins.map((origin) => (
                  <button
                    key={origin}
                    onClick={() => setSelectedOrigin(origin)}
                    className={`px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all duration-300 border ${
                      selectedOrigin === origin 
                        ? 'bg-gold text-obsidian border-gold' 
                        : 'border-white/10 text-white/40 hover:border-gold/50 hover:text-gold'
                    }`}
                  >
                    {origin}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 justify-center">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-2 text-gold text-[10px] uppercase tracking-widest font-bold">
                <Tag className="w-3 h-3" />
                Rango de Precio ($)
              </div>
              <div className="flex items-center gap-4 w-full max-w-sm">
                <input 
                  type="range" 
                  min="0" 
                  max="3000" 
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-gold bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-white font-mono text-sm min-w-[100px] text-right">
                  Hasta ${priceRange[1]}
                </span>
              </div>
            </div>

            <div className="w-[1px] h-10 bg-white/10 hidden lg:block" />

            <div className="flex flex-col items-center md:items-start gap-4 overflow-x-auto w-full pb-4">
              <div className="flex items-center gap-2 text-gold text-[10px] uppercase tracking-widest font-bold">
                <Wine className="w-3 h-3" />
                Notas de Cata
              </div>
              <div className="flex gap-2 min-w-max">
                {allNotes.slice(0, 15).map((note) => (
                  <button
                    key={note}
                    onClick={() => setSelectedNote(note)}
                    className={`px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all duration-300 border ${
                      selectedNote === note 
                        ? 'bg-gold text-obsidian border-gold' 
                        : 'border-white/10 text-white/40 hover:border-gold/50 hover:text-gold'
                    }`}
                  >
                    {note}
                  </button>
                ))}
                {allNotes.length > 15 && (
                  <select 
                    onChange={(e) => setSelectedNote(e.target.value)}
                    className="bg-obsidian border border-white/10 text-white/40 text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 focus:border-gold outline-none"
                    value={allNotes.includes(selectedNote) ? selectedNote : "Otras"}
                  >
                    <option value="" disabled>Más notas...</option>
                    {allNotes.slice(15).map(note => (
                      <option key={note} value={note}>{note}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex justify-center">
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex items-center gap-2 text-gold text-[10px] uppercase tracking-widest font-bold">
                <ArrowUpDown className="w-3 h-3" />
                Ordenar Colección
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { id: 'default', label: 'Predeterminado' },
                  { id: 'price-low-high', label: 'Precio: Menor a Mayor' },
                  { id: 'price-high-low', label: 'Precio: Mayor a Menor' },
                  { id: 'name-a-z', label: 'Nombre: A-Z' },
                  { id: 'name-z-a', label: 'Nombre: Z-A' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    className={`px-4 py-2 text-[9px] uppercase tracking-widest font-bold transition-all duration-300 border-b-2 overflow-hidden relative group ${
                      sortBy === option.id 
                        ? 'bg-gold text-obsidian border-gold shadow-[0_5px_20px_rgba(212,175,55,0.2)]' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-gold/50 hover:text-gold hover:bg-white/10'
                    }`}
                  >
                    <span className="relative z-10">{option.label}</span>
                    {sortBy === option.id && (
                      <motion.div 
                        layoutId="activeSort"
                        className="absolute inset-0 bg-gold"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                onMouseEnter={() => setHoveredCard(product.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group"
              >
                <div className="glass-card p-6 h-full flex flex-col transition-all duration-500 hover:border-gold/60 hover:-translate-y-3 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                  <ProductCarousel 
                    images={product.images} 
                    name={product.name} 
                    isHovered={hoveredCard === product.id} 
                  />
                  
                  <div className="relative">
                    <button 
                      onClick={(e) => toggleFavorite(e, product.id, product.name)}
                      className="absolute -top-12 right-0 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-obsidian/40 backdrop-blur-md group-hover:bg-gold/20 transition-all border border-white/5"
                    >
                      <Heart className={`w-5 h-5 transition-transform ${favorites[product.id] ? 'fill-gold text-gold' : 'text-white/60 group-hover:scale-110'}`} />
                    </button>

                    <div className="flex justify-between items-start mb-2">
                      <span className="text-gold text-[10px] uppercase tracking-[0.3em] font-medium">
                        {product.category}
                      </span>
                      {product.featured && (
                        <span className="text-[8px] px-2 py-0.5 border border-gold text-gold uppercase tracking-widest font-bold">
                          Exclusivo
                        </span>
                      )}
                    </div>
                  </div>
                  
                      <h3 className="font-serif text-2xl mb-2 group-hover:text-gold transition-colors">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-white text-lg font-serif">
                          {product.variants && product.variants.length > 0 
                            ? `Desde Bs ${product.variants.reduce((min, v) => v.price_numeric < min ? v.price_numeric : min, product.variants[0].price_numeric).toLocaleString('es-BO')}`
                            : (product.price || "Consultar")}
                        </span>
                        {product.variants && product.variants.length > 0 && (
                          <span className="text-[8px] px-2 py-0.5 bg-white/5 text-white/40 uppercase tracking-widest font-bold border border-white/5">
                            {product.variants.length} Opciones
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                    {product.notes.map(note => (
                      <span key={note} className="text-[9px] px-2 py-1 bg-white/5 text-white/40 uppercase tracking-widest">
                        {note}
                      </span>
                    ))}
                  </div>

                  <p className="text-white/40 text-sm font-light leading-relaxed mb-4 flex-grow">
                    {product.description}
                  </p>

                  <div className="flex items-center gap-4 mb-8 py-3 border-y border-white/5">
                    <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold">Compartir</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => shareProduct("facebook", product)}
                        className="text-white/30 hover:text-gold transition-colors p-1"
                        title="Compartir en Facebook"
                      >
                        <Facebook className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => shareProduct("x", product)}
                        className="text-white/30 hover:text-gold transition-colors p-1"
                        title="Compartir en X (Twitter)"
                      >
                        <Twitter className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => shareProduct("pinterest", product)}
                        className="text-white/30 hover:text-gold transition-colors p-1"
                        title="Compartir en Pinterest"
                      >
                        <PinterestIcon className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          // Opcional: mostrar un toast o mensaje de "Copiado"
                        }}
                        className="text-white/30 hover:text-gold transition-colors p-1"
                        title="Copiar enlace"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setSelectedProduct(product)}
                          className="flex items-center gap-2 text-gold text-xs uppercase tracking-widest font-bold group/btn"
                        >
                          <Sparkles className="w-4 h-4" />
                          Reseña
                          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                        
                        <button 
                          onClick={() => setSelected360Product(product)}
                          className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-bold hover:text-gold transition-colors group/360"
                        >
                          <Rotate3d className="w-4 h-4 group-hover/360:rotate-180 transition-transform duration-700" />
                          Vista 360°
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setSelectedTechProduct(product)}
                          className="flex items-center gap-2 text-white/30 text-[10px] uppercase tracking-widest font-bold hover:text-white transition-colors group/tech"
                        >
                          <FileText className="w-4 h-4 group-hover/tech:scale-110 transition-transform" />
                          Detalles Técnicos
                        </button>
                        <button 
                          onClick={() => setSelectedQuickViewProduct(product)}
                          className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-bold hover:text-gold transition-colors group/quickview"
                        >
                          <Eye className="w-4 h-4 group-hover/quickview:scale-110 transition-transform" />
                          Vista Rápida
                        </button>
                      </div>
                    </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <ExpertModal 
          product={selectedProduct} 
          isOpen={!!selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />

        <ThreeSixtyModal 
          product={selected360Product} 
          isOpen={!!selected360Product} 
          onClose={() => setSelected360Product(null)} 
        />

        <QuickViewModal 
          product={selectedQuickViewProduct} 
          isOpen={!!selectedQuickViewProduct} 
          onClose={() => setSelectedQuickViewProduct(null)} 
          reviews={reviews}
          user={user}
          onAddReview={postReview}
          onLogin={handleLogin}
        />

        <TechnicalDetailsModal 
          product={selectedTechProduct} 
          isOpen={!!selectedTechProduct} 
          onClose={() => setSelectedTechProduct(null)} 
        />

        {filteredProducts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-white/40 font-serif text-2xl italic">No se encontraron licores con estos criterios.</p>
            <button 
              onClick={() => { setSelectedType("Todos"); setSelectedNote("Todas"); }}
              className="mt-6 text-gold text-xs uppercase tracking-widest font-bold hover:underline"
            >
              Restablecer Filtros
            </button>
          </motion.div>
        )}
      </section>

      {/* Experience Section */}
      <section id="experience" className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000" 
            alt="Experience Background"
            className="w-full h-full object-cover opacity-10"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-4xl md:text-6xl mb-8 leading-tight">
                El Arte de la <br /> <span className="gold-text-gradient">Celebración</span>
              </h2>
              <p className="text-white/60 text-lg font-light leading-relaxed mb-10">
                En TAMBAR, creemos que cada botella cuenta una historia de herencia, paciencia y maestría. Nuestra misión es elevar tus momentos más especiales a través de una experiencia sensorial sin precedentes.
              </p>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <Wine className="text-gold w-8 h-8" />
                  <h4 className="font-serif text-xl">Curaduría Experta</h4>
                  <p className="text-white/40 text-sm font-light">Solo los destilados más excepcionales entran en nuestra cava.</p>
                </div>
                <div className="flex flex-col gap-4">
                  <GlassWater className="text-gold w-8 h-8" />
                  <h4 className="font-serif text-xl">Cata Privada</h4>
                  <p className="text-white/40 text-sm font-light">Sesiones exclusivas guiadas por sommeliers certificados.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square border border-gold/20 p-4">
                <img 
                  src="https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&q=80&w=1000" 
                  alt="Luxury Pour"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gold/5 blur-3xl rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section id="location" className="py-32 bg-black/40 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl mb-4">Nuestra Casa</h2>
            <div className="flex items-center justify-center gap-2 text-gold text-sm uppercase tracking-[0.3em]">
              <MapPin className="w-4 h-4" />
              Santa Cruz de la Sierra, Bolivia
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch h-[500px]">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card overflow-hidden h-full"
            >
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3799.309062332152!2d-63.217227!3d-17.751771!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x93f1dd6f1821162b%3A0x44cb4bde62c490dd!2sIN+TOWERS!5e0!3m2!1sen!2sbo!4v1713458820000!5m2!1sen!2sbo" 
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'grayscale(1) contrast(1.2) invert(0.9) opacity(0.8)' }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col justify-center p-12 glass-card border-gold/20"
            >
              <h3 className="font-serif text-3xl mb-8">Visítanos</h3>
              <div className="space-y-3 mb-8 font-light leading-relaxed">
                <p className="text-white/80">Av. Cuarta #12 (Frente al ingreso del Sector 1 de Colinas del Urubó), Santa Cruz de la Sierra</p>
                <p className="text-white/60 text-sm italic">CONDOMINIO IN TOWERS PLANTA BAJA LICORERIA TAMBAR</p>
                <div className="flex items-center gap-2 text-gold/80 text-[11px] uppercase tracking-widest font-bold bg-gold/5 w-fit px-3 py-1 border border-gold/10">
                  <MapPin className="w-3 h-3" />
                  Plus Code: 6QXM+74 Santa Cruz de la Sierra
                </div>
              </div>
              
              <p className="text-white/60 mb-8 font-light leading-relaxed">
                Nuestra cava exclusiva te espera en una ubicación privilegiada de la ciudad. Un espacio diseñado para los amantes de la sofisticación.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full border border-gold/40 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-bold uppercase tracking-widest mb-1">Horarios</div>
                    <div className="text-white/40 text-xs font-light">Lunes a Sábado: 10:00 AM - 10:00 PM</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full border border-gold/40 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-bold uppercase tracking-widest mb-1">Citas Privadas</div>
                    <div className="text-white/40 text-xs font-light">Reserva una cata personalizada guiada por nuestros expertos.</div>
                  </div>
                </div>
              </div>

              <a 
                href="https://www.google.com/maps/place/IN+TOWERS/@-17.7517712,-63.217227,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-12 inline-block w-fit px-8 py-4 bg-gold text-obsidian font-bold text-xs uppercase tracking-[0.3em] hover:bg-white transition-all duration-500"
              >
                Cómo Llegar
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Section */}
      <section className="py-24 bg-white/5 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-gold text-sm tracking-[0.5em] uppercase mb-12 font-medium">Comparte la Experiencia</h3>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {socialLinks.map((social, index) => (
              <motion.a
                key={index}
                href="#"
                whileHover={{ y: -5, scale: 1.1 }}
                className="flex flex-col items-center gap-4 group"
              >
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:border-gold transition-colors duration-300">
                  <social.icon className="w-6 h-6 text-white/40 group-hover:text-gold transition-colors" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">
                  {social.label}
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-8">
                <img 
                  src="/LOGO TAMBAR.png" 
                  alt="TAMBAR" 
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.logo-text-footer')?.classList.remove('hidden');
                  }}
                />
                <div className="flex items-center gap-2 logo-text-footer hidden">
                  <Wine className="text-gold w-6 h-6" />
                  <span className="font-serif text-2xl tracking-widest gold-text-gradient font-bold uppercase">TAMBAR</span>
                </div>
              </div>
              <p className="text-white/40 max-w-sm font-light leading-relaxed mb-8">
                La casa de licores premium más exclusiva de Santa Cruz. Dedicados a la excelencia en cada gota y a la sofisticación en cada brindis.
              </p>
              <div className="flex items-center gap-4">
                {socialLinks.slice(0, 3).map((social, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:text-gold hover:border-gold transition-all">
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="font-serif text-lg mb-8 uppercase tracking-widest">Navegación</h5>
              <ul className="flex flex-col gap-4 text-sm text-white/40 font-light">
                <li><a href="#hero" className="hover:text-gold transition-colors">Inicio</a></li>
                <li><a href="#catalog" className="hover:text-gold transition-colors">Catálogo Exclusive</a></li>
                <li><a href="#experience" className="hover:text-gold transition-colors">La Experiencia</a></li>
                <li><a href="#location" className="hover:text-gold transition-colors">Nuestra Casa</a></li>
                <li><a href="#contact" className="hover:text-gold transition-colors">Contacto Directo</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-serif text-lg mb-8 uppercase tracking-widest">Atención</h5>
              <ul className="flex flex-col gap-4 text-sm text-white/40 font-light">
                <li className="flex flex-col gap-1">
                  <span className="text-gold text-[10px] uppercase tracking-widest font-bold">Dirección</span>
                  <span>Av. Cuarta #12, Cond. IN TOWERS, PB. Santa Cruz, Bolivia</span>
                </li>
                <li className="flex flex-col gap-1">
                  <span className="text-gold text-[10px] uppercase tracking-widest font-bold">Horarios</span>
                  <span>Lunes a Sábado: 10:00 - 22:00</span>
                </li>
                <li className="flex flex-col gap-1">
                  <span className="text-gold text-[10px] uppercase tracking-widest font-bold">Teléfono / WhatsApp</span>
                  <span>+591 760 00000</span>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-serif text-lg mb-8 uppercase tracking-widest">Ubicación</h5>
              <div className="w-full aspect-video mb-4 border border-white/10 overflow-hidden relative group">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3799.309062332152!2d-63.217227!3d-17.751771!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x93f1dd6f1821162b%3A0x44cb4bde62c490dd!2sIN+TOWERS!5e0!3m2!1sen!2sbo!4v1713458820000!5m2!1sen!2sbo" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, filter: 'grayscale(1) contrast(1.2) invert(0.9) opacity(0.8)' }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="absolute inset-0 bg-gold/0 group-hover:bg-gold/5 transition-colors pointer-events-none" />
              </div>
              <a 
                href="https://www.google.com/maps/place/IN+TOWERS/@-17.7517712,-63.217227,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold font-bold hover:text-white transition-colors"
              >
                <MapPin className="w-3 h-3" />
                Cómo llegar con Google Maps
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-white/5 gap-6">
            <p className="text-[10px] uppercase tracking-widest text-white/20">
              © 2026 TAMBAR PREMIUM LIQUOR HOUSE. TODOS LOS DERECHOS RESERVADOS.
            </p>
            <div className="flex gap-8 text-[10px] uppercase tracking-widest text-white/20">
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Términos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
