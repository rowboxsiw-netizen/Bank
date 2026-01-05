
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBUZfjP8iomzCRe0SUeHGVmLBz09B-Afr8",
  authDomain: "bank-90ddd.firebaseapp.com",
  databaseURL: "https://bank-90ddd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bank-90ddd",
  storageBucket: "bank-90ddd.firebasestorage.app",
  messagingSenderId: "289369752822",
  appId: "1:289369752822:web:a261ee652850b1b8e058d7",
  measurementId: "G-SHNTS4X7PG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with settings to improve reliability
export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
