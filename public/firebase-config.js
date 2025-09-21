// public/firebase-config.js

// Importa las funciones que necesitas de los SDKs usando las URLs completas
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-functions.js"; // <-- La función que faltaba

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAlaj7dOw2Vo-w9jSq_8ZeEIVcFR0VBDGo",
  authDomain: "groddys-lab.firebaseapp.com",
  projectId: "groddys-lab",
  storageBucket: "groddys-lab.firebasestorage.app",
  messagingSenderId: "815003938529",
  appId: "1:815003938529:web:ae4ee3c709fea4eba011a0",
  measurementId: "G-4H2DG81B7K"
};

// Inicializa Firebase
export const app = initializeApp(firebaseConfig);

// Exporta los servicios de Firebase para usarlos en tu app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app); // <-- La exportación que faltaba