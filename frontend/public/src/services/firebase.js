import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNqt2waMSJmX6lmcrd4DuNahNgOiEexzs",
  authDomain: "mathdom-48c30.firebaseapp.com",
  projectId: "mathdom-48c30",
  storageBucket: "mathdom-48c30.firebasestorage.app",
  messagingSenderId: "963205163767",
  appId: "1:963205163767:web:72cd27f237b866ed39c1f2",
  measurementId: "G-1P8505CQQV"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);