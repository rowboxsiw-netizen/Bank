
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
  updateDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { UserProfile } from '../models/user.model';
import { auth, firestore } from '../../../firebase.config';

const USER_CACHE_KEY = 'neo-bank-user-cache';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  currentUser = signal<UserProfile | null>(null);
  private unsubscribeFromUserDoc: (() => void) | null = null;

  constructor() {
    // 1. Optimistic load
    try {
      const cachedUser = localStorage.getItem(USER_CACHE_KEY);
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        if (parsedUser.createdAt) parsedUser.createdAt = new Date(parsedUser.createdAt);
        this.currentUser.set(parsedUser);
      }
    } catch (e) {
      localStorage.removeItem(USER_CACHE_KEY);
    }

    // 2. Real-time Auth
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
              phoneNumber: data['phoneNumber'],
              photoURL: user.photoURL,
              balance: data['balance'],
              upiId: data['upiId'],
              role: data['role'] || 'user',
              kycStatus: data['kycStatus'] || 'pending',
              createdAt: (data['createdAt'] as Timestamp).toDate(),
            };
            this.currentUser.set(userProfile);
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userProfile));
          }
        });
      } else {
        this.currentUser.set(null);
        localStorage.removeItem(USER_CACHE_KEY);
      }
    });
  }
  
  // UPDATED: Auto-Generate UPI, Default KYC Pending
  async register(email: string, password: string): Promise<void> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Auto-Generate Secure UPI
      const randomSegment = Math.floor(10000000 + Math.random() * 90000000); // 8 Random digits
      const autoUpiId = `3392${randomSegment}@Neo-Bank`;

      const userRef = doc(firestore, 'users', credential.user.uid);
      
      await setDoc(userRef, { 
        email, 
        upiId: autoUpiId,
        balance: 50,
        role: 'user',
        kycStatus: 'pending',
        createdAt: new Date(),
        displayName: null, 
        phoneNumber: null
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error && (error as any).code === 'auth/email-already-in-use') {
        throw new Error('This email address is already in use.');
      }
      throw new Error('An unknown error occurred during registration.');
    }
  }

  // NEW: KYC Submission
  async submitKYC(displayName: string, phoneNumber: string): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('No user logged in');

    const userRef = doc(firestore, 'users', user.uid);
    await updateDoc(userRef, {
      displayName,
      phoneNumber,
      kycStatus: 'verified'
    });
  }

  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw new Error('Invalid email or password.');
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
    this.router.navigate(['/login']);
  }
}
