// frontend/src/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAlaj7dOw2Vo-w9jSq_8ZeEIVcFR0VBDGo",
  authDomain: "groddys-lab.firebaseapp.com",
  projectId: "groddys-lab",
  storageBucket: "groddys-lab.firebasestorage.app",
  messagingSenderId: "815003938529",
  appId: "1:815003938529:web:ae4ee3c709fea4eba011a0",
  measurementId: "G-4H2DG81B7K",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
