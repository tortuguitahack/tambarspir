import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  initializeFirestore, 
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
  getDocFromServer, 
  Timestamp,
  terminate,
  clearIndexedDbPersistence
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Configuración de Firestore optimizada para entornos con proxies/sandboxed
const firestoreSettings = {
  experimentalForceLongPolling: true,
  useFetchStreams: false // Deshabilitar fetch streams puede ayudar en algunos entornos restringidos
};

export const db = initializeFirestore(app, firestoreSettings, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validation test
export async function testConnection() {
  try {
    console.log("Testing Firestore connection...");
    // Intentar leer un documento inexistente forzando servidor
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful.");
    return { success: true };
  } catch (error: any) {
    let message = "Unknown error";
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      message = "La base de datos no está disponible (posiblemente estés sin conexión o haya un firewall restrictivo).";
      console.warn("Firestore backend unreachable. This might be a temporary network issue or a strict firewall.");
    } else {
      message = `Error de conectividad: ${error.message || error.code}`;
      console.error("Firestore connectivity issue:", error);
    }
    return { success: false, message, error };
  }
}

export { 
  onAuthStateChanged,
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
  Timestamp,
  terminate,
  clearIndexedDbPersistence
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
