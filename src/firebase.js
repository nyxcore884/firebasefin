// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

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

export { app, analytics };
