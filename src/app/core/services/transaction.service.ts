
import { Injectable, signal, inject, effect } from '@angular/core';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  runTransaction,
  Timestamp,
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { firestore } from '../../../firebase.config';
import { AuthService } from './auth.service';
import { Transaction } from '../../../models/transaction.model';

export type TransferStatus = 'SUCCESS' | 'INSUFFICIENT_FUNDS' | 'RECEIVER_NOT_FOUND' | 'CARD_FROZEN' | 'ERROR';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private authService = inject(AuthService);
  private currentUser = this.authService.currentUser;
  private unsubscribeFromTransactions: (() => void) | null = null;

  public transactions = signal<Transaction[]>([]);

  constructor() {
    effect((onCleanup) => {
      const user = this.currentUser();

      if (this.unsubscribeFromTransactions) {
        this.unsubscribeFromTransactions();
      }

      if (user) {
        const q = query(
          collection(firestore, 'users', user.uid, 'transactions'),
          orderBy('date', 'desc'),
          limit(10)
        );
        this.unsubscribeFromTransactions = onSnapshot(q, (querySnapshot) => {
          const userTransactions = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              date: (data['date'] as Timestamp).toDate(),
              merchant: data['merchant'],
              amount: data['amount'],
              status: data['status'],
              type: data['type'],
            } as Transaction;
          });
          this.transactions.set(userTransactions);
        });

        onCleanup(() => {
          if (this.unsubscribeFromTransactions) this.unsubscribeFromTransactions();
        });
      } else {
        this.transactions.set([]);
      }
    });
  }
  
  async findReceiverByUpi(upiId: string): Promise<{ id: string; displayName: string } | null> {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('upiId', '==', upiId), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }
    const receiverDoc = querySnapshot.docs[0];
    return { id: receiverDoc.id, displayName: receiverDoc.data()['displayName'] || 'User' };
  }


  async transferFunds(amount: number, receiverUpi: string): Promise<TransferStatus> {
    const sender = this.currentUser();
    if (!sender) return 'ERROR';

    // STRICT CHECK: Card Freeze
    if (sender.card && sender.card.status === 'frozen') {
      return 'CARD_FROZEN';
    }

    try {
      const receiverData = await this.findReceiverByUpi(receiverUpi);
      if (!receiverData) return 'RECEIVER_NOT_FOUND';

      const senderDocRef = doc(firestore, 'users', sender.uid);
      const receiverDocRef = doc(firestore, 'users', receiverData.id);

      await runTransaction(firestore, async (transaction) => {
        const [senderDoc, receiverDoc] = await Promise.all([
          transaction.get(senderDocRef),
          transaction.get(receiverDocRef)
        ]);

        if (!senderDoc.exists() || !receiverDoc.exists()) throw new Error("User document not found");
        
        const senderBalance = senderDoc.data()['balance'];
        if (senderBalance < amount) throw new Error('INSUFFICIENT_FUNDS');

        // Debit sender, credit receiver
        transaction.update(senderDocRef, { balance: senderBalance - amount });
        transaction.update(receiverDocRef, { balance: receiverDoc.data()['balance'] + amount });

        // Create transaction logs for both parties
        const senderTxRef = doc(collection(firestore, 'users', sender.uid, 'transactions'));
        transaction.set(senderTxRef, {
          merchant: `Sent to ${receiverData.displayName} (${receiverUpi})`,
          amount,
          date: new Date(),
          status: 'Completed',
          type: 'debit',
        });

        const receiverTxRef = doc(collection(firestore, 'users', receiverData.id, 'transactions'));
        transaction.set(receiverTxRef, {
          merchant: `Received from ${sender.displayName} (${sender.upiId})`,
          amount,
          date: new Date(),
          status: 'Completed',
          type: 'credit',
        });
      });

      return 'SUCCESS';
    } catch (e: any) {
      console.error('Transaction failed:', e);
      if (e.message === 'INSUFFICIENT_FUNDS') return 'INSUFFICIENT_FUNDS';
      return 'ERROR';
    }
  }
}
