
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDKSy9SaXRnVobkINfO9a5A0habVx056PQ",
  authDomain: "dj-car-rental.firebaseapp.com",
  projectId: "dj-car-rental",
  storageBucket: "dj-car-rental.firebasestorage.app",
  messagingSenderId: "437276540873",
  appId: "1:437276540873:web:5a0b72df2845f01afaf218"
};

let app;
let auth: any;
let db: any;
let storage: any;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { auth, db, storage };
export default app;
