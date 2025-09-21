// firebase-config.js

// Importa las funciones que necesitas de los SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Reemplaza esto con la configuración de tu proyecto de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAJw...", // Tu API Key real
  authDomain: "groddys-lab.firebaseapp.com",
  projectId: "groddys-lab",
  storageBucket: "groddys-lab.appspot.com",
  messagingSenderId: "815809388520",
  appId: "1:815809388520:web:ae4ae3e7b9fea4eba811a0",
  measurementId: "G-4H2DG8187K"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios de Firebase para usarlos en tu app
export const auth = getAuth(app);
export const db = getFirestore(app);