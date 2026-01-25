
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getVertexAI } from "firebase/vertexai-preview";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcZLk7TJT75P12a3ssow9T6bq4BGqAhDE",
  authDomain: "studio-9381016045-4d625.firebaseapp.com",
  projectId: "studio-9381016045-4d625",
  storageBucket: "studio-9381016045-4d625.firebasestorage.app",
  messagingSenderId: "733431756980",
  appId: "1:733431756980:web:554b0e145b4268a4ed7fe1",
  measurementId: "G-62509FQ7JL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export services for app usage
const db = getFirestore(app);
const storage = getStorage(app);
const vertexAI = getVertexAI(app);
const auth = getAuth(app);
const functions = getFunctions(app, "us-central1");

// Connect to Emulators if running locally
// Connect to Emulators if running locally
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  console.log("Using Local Firebase Emulators (Auth Disabled to prevent spam)");
  // connectAuthEmulator(auth, "http://127.0.0.1:9099");
  // connectFirestoreEmulator(db, "127.0.0.1", 8080);
  // connectStorageEmulator(storage, "127.0.0.1", 9199);
  // connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

export { app, db, storage, vertexAI, auth, functions, analytics };
