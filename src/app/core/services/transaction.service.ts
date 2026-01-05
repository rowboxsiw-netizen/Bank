import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { 
  collection, 
  doc, 
  runTransaction, 
  query, 
  where, 
  getDocs, 
  limit, 
  onSnapshot, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { firestore } from '../../../firebase.config';
import { AuthService } from './auth.service';
import { Transaction } from '../../models/transaction.model';
import { UiService } from './ui.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private authService = inject(AuthService);
  private uiService = inject(UiService);
  
  // The Source of Truth for the UI
  // Note: We maintain a local signal that matches Firestore, but can be optimistically updated
  private _transactions = signal<Transaction[]>([]);
  readonly transactions = this._transactions.asReadonly();

  constructor() {
    // Real-time listener for the transaction feed
    effect((onCleanup) => {
      const user = this.authService.currentUser();
      if (!user) {
        this._transactions.set([]);
        return;
      }

      const q = query(
        collection(firestore, 'users', user.uid, 'transactions'),
        orderBy('date', 'desc'),
        limit(20)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const txs = snapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                date: (data['date'] as Timestamp).toDate()
            } as Transaction;
        });
        // When server data arrives, it overwrites our optimistic state
        // This confirms the transaction to the user invisibly
        this._transactions.set(txs);
      });

      onCleanup(() => unsubscribe());
    });
  }

  async findReceiverByUpi(upiId: string): Promise<{ displayName: string } | null> {
    const docSnap = await this.getReceiverDoc(upiId);
    if (!docSnap) return null;
    return { displayName: docSnap.data()['displayName'] || 'Valued Member' };
  }

  /**
   * ZERO LATENCY TRANSFER LOGIC
   * 1. Validate locally
   * 2. Update UI Balance IMMEDIATELY (Optimistic)
   * 3. Send to Server (Async)
   * 4. Rollback if Server Fails
   */
  async sendMoney(amount: number, receiverUpi: string, note: string = ''): Promise<boolean> {
    const sender = this.authService.currentUser();
    if (!sender) throw new Error("Not logged in");
    if (amount <= 0) throw new Error("Invalid amount");
    if (sender.balance < amount) throw new Error("Insufficient funds");

    // --- STEP 1: SNAPSHOT STATE FOR ROLLBACK ---
    const previousBalance = sender.balance;

    // --- STEP 2: OPTIMISTIC UPDATE (Zero Latency) ---
    // We manually update the AuthService's signal to reflect the deduction instantly.
    // The user sees the balance drop 0ms after clicking send.
    this.authService.currentUser.update(u => u ? ({ ...u, balance: u.balance - amount }) : null);

    try {
      // --- STEP 3: PERFORM ACID TRANSACTION ---
      const receiverSnapshot = await this.getReceiverDoc(receiverUpi);
      if (!receiverSnapshot) throw new Error("Receiver not found");

      await runTransaction(firestore, async (transaction) => {
        const senderRef = doc(firestore, 'users', sender.uid);
        const receiverRef = doc(firestore, 'users', receiverSnapshot.id);

        // Read (Lock)
        const sDoc = await transaction.get(senderRef);
        const rDoc = await transaction.get(receiverRef);

        if (!sDoc.exists() || !rDoc.exists()) throw new Error("Document missing");
        
        const serverSenderBalance = sDoc.data()['balance'];
        
        // Double Check on Server Side
        if (serverSenderBalance < amount) {
            throw new Error("Insufficient funds (Server Validation)");
        }

        // Write
        transaction.update(senderRef, { balance: serverSenderBalance - amount });
        transaction.update(receiverRef, { balance: rDoc.data()['balance'] + amount });

        // Generate Logs
        const timestamp = new Date();
        const senderTxRef = doc(collection(firestore, 'users', sender.uid, 'transactions'));
        transaction.set(senderTxRef, {
            amount,
            type: 'debit',
            status: 'Completed',
            merchant: receiverSnapshot.data()['displayName'] || receiverUpi,
            receiverUpi,
            senderUpi: sender.upiId,
            date: timestamp,
            description: note
        });
        
        const receiverTxRef = doc(collection(firestore, 'users', receiverSnapshot.id, 'transactions'));
        transaction.set(receiverTxRef, {
            amount,
            type: 'credit',
            status: 'Completed',
            merchant: sender.displayName || sender.upiId,
            receiverUpi,
            senderUpi: sender.upiId,
            date: timestamp,
            description: note
        });
      });

      // Success! The onSnapshot listener in constructor will eventually 
      // pull the official new state, confirming our optimistic update.
      return true;

    } catch (error: any) {
      // --- STEP 4: ROLLBACK (Time Travel) ---
      console.error("Transaction Failed, Rolling Back", error);
      
      // Revert the balance to what it was before the click
      this.authService.currentUser.update(u => u ? ({ ...u, balance: previousBalance }) : null);
      
      this.uiService.showToast(error.message || 'Transfer Failed', 'error');
      return false;
    }
  }

  private async getReceiverDoc(upiId: string) {
    const q = query(collection(firestore, 'users'), where('upiId', '==', upiId), limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : snapshot.docs[0];
  }
}