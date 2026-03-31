import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDL2ORnOXHoRugZg2-v4MZSh2QHUg1622M",
  authDomain: "debate-platform-aaec3.firebaseapp.com",
  projectId: "debate-platform-aaec3",
  storageBucket: "debate-platform-aaec3.firebasestorage.app",
  messagingSenderId: "721145925856",
  appId: "1:721145925856:web:8760004f0f17defe9bc085",
  measurementId: "G-MRQ1BZ6F7T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
