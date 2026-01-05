
import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { UserProfile } from '../models/user.model';
import { auth, db } from '../firebase.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  currentUser = signal<UserProfile | null>(null);
  private unsubscribeFromUserDoc: (() => void) | null = null;

  constructor() {
    onAuthStateChanged(auth, (user: User | null) => {
      // Clean up previous real-time listener
      if (this.unsubscribeFromUserDoc) {
        this.unsubscribeFromUserDoc();
        this.unsubscribeFromUserDoc = null;
      }
      
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        // Listen for real-time updates to the user document
        this.unsubscribeFromUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const userProfile: UserProfile = {
              uid: user.uid,
              email: user.email,
              displayName: data['displayName'] || user.email?.split('@')[0] || 'User',
              photoURL: user.photoURL,
              balance: data['balance'],
              upiId: data['upiId'],
            };
            this.currentUser.set(userProfile);
          } else {
             // This case might happen if user exists in Auth but not Firestore.
             // For this app, we assume they are always created together.
             console.error("User document not found in Firestore!");
             this.currentUser.set(null);
          }
        });
      } else {
        this.currentUser.set(null);
      }
    });
  }
  
  async registerUser(email: string, password: string, upiId: string): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        email: user.email,
        upiId: upiId,
        balance: 50.00, // Sign-up bonus
        createdAt: new Date(),
        displayName: user.email?.split('@')[0] || 'New User',
      });
      // The onAuthStateChanged listener will automatically pick up the new user and their data.
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        const firebaseError = error as any;
        if (firebaseError.code === 'auth/email-already-in-use') {
          throw new Error('This email address is already in use.');
        }
      }
      throw new Error('An unknown error occurred during registration.');
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        const firebaseError = error as any; // Cast to access 'code'
        switch (firebaseError.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            throw new Error('Invalid email or password.');
          default:
            throw new Error('An unknown error occurred during login.');
        }
      }
      throw new Error('An unknown error occurred during login.');
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
    this.router.navigate(['/login']);
  }
}
