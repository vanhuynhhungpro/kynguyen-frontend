
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBb3tJLEN8JLfrMnfKONOAmHZ4x62AvYWo",
  authDomain: "ongchuvibecoding.firebaseapp.com",
  projectId: "ongchuvibecoding",
  storageBucket: "ongchuvibecoding.firebasestorage.app",
  messagingSenderId: "404701353874",
  appId: "1:404701353874:web:5778c25f491953f727934b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-west1");
