
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
import { UserProfile, Card } from '../models/user.model';
import { auth, firestore } from '../../../firebase.config';

const USER_CACHE_KEY = 'neo-bank-user-cache-v2';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  currentUser = signal<UserProfile | null>(null);
  private unsubscribeFromUserDoc: (() => void) | null = null;

  constructor() {
    // 1. OPTIMISTIC LOAD (Zero Latency)
    // Immediately load data from local storage to paint the UI
    try {
      const cachedUser = localStorage.getItem(USER_CACHE_KEY);
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        // Re-hydrate Date objects
        if (parsedUser.createdAt) parsedUser.createdAt = new Date(parsedUser.createdAt);
        this.currentUser.set(parsedUser);
      }
    } catch (e) {
      console.warn('Cache corrupted', e);
      localStorage.removeItem(USER_CACHE_KEY);
    }

    // 2. REAL-TIME SYNC (Background)
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
            
            // Auto-Generate Card if missing (Self-healing data)
            if (!data['card']) {
               this.generateAndSaveCard(user.uid, data['displayName']);
               return; 
            }

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
              card: data['card'],
              createdAt: (data['createdAt'] as Timestamp).toDate(),
            };

            // Update Signal & Cache
            this.currentUser.set(userProfile);
            this.saveToCache(userProfile);
          }
        });
      } else {
        this.currentUser.set(null);
        localStorage.removeItem(USER_CACHE_KEY);
      }
    });
  }

  private saveToCache(user: UserProfile) {
    try {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } catch (e) {
      // Quota exceeded or private mode
    }
  }

  private async generateAndSaveCard(uid: string, displayName: string | null) {
     const generateNumber = () => {
        let num = '4532'; // Visa Prefix
        for(let i=0; i<3; i++) num += ' ' + Math.floor(1000 + Math.random() * 9000);
        return num;
     };

     const newCard: Card = {
        number: generateNumber(),
        cvv: Math.floor(100 + Math.random() * 900).toString(),
        expiry: `12/${new Date().getFullYear() + 5 - 2000}`,
        status: 'active',
        holder: displayName || 'VALUED MEMBER'
     };

     const userRef = doc(firestore, 'users', uid);
     await updateDoc(userRef, { card: newCard });
  }
  
  async toggleCardFreeze(isFrozen: boolean): Promise<void> {
    const user = this.currentUser();
    if (!user) return;
    
    // Optimistic Update
    const updatedUser = { ...user, card: { ...user.card!, status: isFrozen ? 'frozen' : 'active' } as Card };
    this.currentUser.set(updatedUser);
    this.saveToCache(updatedUser);

    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, { 'card.status': isFrozen ? 'frozen' : 'active' });
    } catch (e) {
      // Rollback
      this.currentUser.set(user); 
      throw e;
    }
  }

  async register(email: string, password: string): Promise<void> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      
      const randomSegment = Math.floor(10000000 + Math.random() * 90000000);
      const autoUpiId = `3392${randomSegment}@Neo-Bank`;

      const userRef = doc(firestore, 'users', credential.user.uid);
      
      // We set the data, but onAuthStateChanged will actually hydrate the app
      await setDoc(userRef, { 
        email, 
        upiId: autoUpiId,
        balance: 50,
        role: 'user',
        kycStatus: 'pending',
        createdAt: new Date(),
        displayName: null, 
        phoneNumber: null,
      });

      // Wait for profile sync before returning to ensure dashboard access
      await this.waitForUserProfile(credential.user.uid);

    } catch (error) {
      if (error instanceof Error && (error as any).code === 'auth/email-already-in-use') {
        throw new Error('This email address is already in use.');
      }
      throw new Error('Registration failed.');
    }
  }

  async submitKYC(displayName: string, phoneNumber: string): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('No user logged in');

    const userRef = doc(firestore, 'users', user.uid);
    const updates: any = {
      displayName,
      phoneNumber,
      kycStatus: 'verified'
    };
    
    if (user.card && user.card.holder === 'VALUED MEMBER') {
        updates['card.holder'] = displayName.toUpperCase();
    }

    await updateDoc(userRef, updates);
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // RACE CONDITION FIX:
      // AuthGuard checks 'currentUser()', but that is set asynchronously via Firestore snapshot.
      // We must wait until the signal matches the authenticated user UID before resolving.
      await this.waitForUserProfile(result.user.uid);
    } catch (error) {
      throw new Error('Invalid email or password.');
    }
  }

  private waitForUserProfile(uid: string): Promise<void> {
    return new Promise((resolve) => {
      // Check immediately
      if (this.currentUser()?.uid === uid) {
        return resolve();
      }

      // Check periodically (every 50ms)
      const interval = setInterval(() => {
        if (this.currentUser()?.uid === uid) {
          clearInterval(interval);
          resolve();
        }
      }, 50);

      // Timeout fallback (4s) to prevent infinite hanging
      setTimeout(() => {
        clearInterval(interval);
        resolve(); 
      }, 4000);
    });
  }

  async logout(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem(USER_CACHE_KEY);
    this.router.navigate(['/login']);
  }
}
