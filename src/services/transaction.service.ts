import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
// FIX: Changed import from 'db' to 'firestore' to match the export from firebase.config.ts
import { firestore } from '../firebase.config';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private authService = inject(AuthService);
  private currentUser = this.authService.currentUser;
  private unsubscribeFromTransactions: (() => void) | null = null;

  // Private state for all transactions from Firestore
  private allTransactions = signal<Transaction[]>([]);

  // Public signals for controlling state
  searchTerm = signal<string>('');
  filterStatus = signal<'All' | 'Completed' | 'Pending' | 'Failed'>('All');
  sortColumn = signal<'date' | 'amount'>('date');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Public computed signal that reacts to changes in filters and sorting
  transactions = computed(() => {
    let filteredTxs = this.allTransactions();

    // 1. Filter by status
    const status = this.filterStatus();
    if (status !== 'All') {
      filteredTxs = filteredTxs.filter((tx) => tx.status === status);
    }

    // 2. Filter by search term (merchant)
    const term = this.searchTerm().toLowerCase();
    if (term) {
      filteredTxs = filteredTxs.filter((tx) =>
        tx.merchant.toLowerCase().includes(term)
      );
    }

    // 3. Sort the results
    const column = this.sortColumn();
    const direction = this.sortDirection();

    return [...filteredTxs].sort((a, b) => {
      let comparison = 0;
      if (column === 'date') {
        comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        // amount
        comparison = a.amount - b.amount;
      }

      // Reverse if ascending
      return direction === 'asc' ? -comparison : comparison;
    });
  });

  constructor() {
    effect((onCleanup) => {
      const user = this.currentUser();

      // Clean up previous listener
      if (this.unsubscribeFromTransactions) {
        this.unsubscribeFromTransactions();
      }

      if (user) {
        const q = query(
          // FIX: Use 'firestore' instead of 'db'
          collection(firestore, 'users', user.uid, 'transactions'),
          orderBy('date', 'desc')
        );
        this.unsubscribeFromTransactions = onSnapshot(q, (querySnapshot) => {
          const transactions = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              date: (data['date'] as Timestamp).toDate().toISOString().split('T')[0],
              merchant: data['merchant'],
              amount: data['amount'],
              status: data['status'],
              type: data['type'],
            } as Transaction;
          });
          this.allTransactions.set(transactions);
        });

        onCleanup(() => {
          if (this.unsubscribeFromTransactions) {
            this.unsubscribeFromTransactions();
            this.unsubscribeFromTransactions = null;
          }
        });
      } else {
        // No user, clear transactions
        this.allTransactions.set([]);
      }
    });
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('User not logged in.');
    if (transaction.amount <= 0) throw new Error('Transaction amount must be positive.');

    // FIX: Use 'firestore' instead of 'db'
    const userDocRef = doc(firestore, 'users', user.uid);

    try {
      // FIX: Use 'firestore' instead of 'db'
      await runTransaction(firestore, async (tx) => {
        const userDoc = await tx.get(userDocRef);
        if (!userDoc.exists()) {
          throw new Error('User document does not exist!');
        }

        const currentBalance = userDoc.data()['balance'];
        let newBalance;

        if (transaction.type === 'debit') {
          if (currentBalance < transaction.amount) {
            throw new Error('Insufficient funds.');
          }
          newBalance = currentBalance - transaction.amount;
        } else { // credit
          newBalance = currentBalance + transaction.amount;
        }

        // 1. Update user's balance
        tx.update(userDocRef, { balance: newBalance });

        // 2. Add the new transaction record
        // FIX: Use 'firestore' instead of 'db'
        const newTransactionRef = doc(collection(firestore, 'users', user.uid, 'transactions'));
        tx.set(newTransactionRef, {
          ...transaction,
          date: new Date(transaction.date), // Store as Firestore Timestamp
        });
      });
    } catch (e) {
      console.error('Transaction failed: ', e);
      if (e instanceof Error) {
        throw e; // Re-throw the specific error message (e.g., "Insufficient funds.")
      }
      throw new Error('An unknown error occurred during the transaction.');
    }
  }

  // --- Public methods to update state ---

  updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  updateStatusFilter(
    status: 'All' | 'Completed' | 'Pending' | 'Failed'
  ): void {
    this.filterStatus.set(status);
  }

  updateSort(column: 'date' | 'amount'): void {
    if (this.sortColumn() === column) {
      // If same column, toggle direction
      this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      // If new column, set it and default to descending
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
  }
}