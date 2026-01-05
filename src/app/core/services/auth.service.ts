
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
  onSnapshot
} from 'firebase/firestore';
import { UserProfile } from '../models/user.model';
import { auth, firestore } from '../../../firebase.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  currentUser = signal<UserProfile | null>(null);
  private unsubscribeFromUserDoc: (() => void) | null = null;

  constructor() {
    onAuthStateChanged(auth, (user: User | null) => {
      if (this.unsubscribeFromUserDoc) {
        this.unsubscribeFromUserDoc();
        this.unsubscribeFromUserDoc = null;
      }
      
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        this.unsubscribeFromUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const userProfile: UserProfile = {
              uid: user.uid,
              email: user.email!,
              displayName: data['displayName'],
              photoURL: user.photoURL,
              balance: data['balance'],
              upiId: data['upiId'],
              createdAt: data['createdAt'],
            };
            this.currentUser.set(userProfile);
          }
        });
      } else {
        this.currentUser.set(null);
      }
    });
  }
  
  async register(email: string, password: string, upiId: string): Promise<void> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = doc(firestore, 'users', credential.user.uid);
      
      await setDoc(userRef, { 
        email, 
        upiId, 
        balance: 50,
        createdAt: new Date(),
        displayName: email.split('@')[0] || 'New User'
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error && (error as any).code === 'auth/email-already-in-use') {
        throw new Error('This email address is already in use.');
      }
      throw new Error('An unknown error occurred during registration.');
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid email or password.');
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
    this.router.navigate(['/login']);
  }
}
