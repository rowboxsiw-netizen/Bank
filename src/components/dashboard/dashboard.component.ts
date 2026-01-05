
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule]
})
export class DashboardComponent {
  authService = inject(AuthService);
  transactionService = inject(TransactionService);
  fb = inject(FormBuilder);

  currentUser = this.authService.currentUser;
  transactions = this.transactionService.transactions;
  sortColumn = this.transactionService.sortColumn;
  sortDirection = this.transactionService.sortDirection;

  transferError = signal<string | null>(null);

  quickTransferForm = this.fb.group({
    recipient: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    memo: ['']
  });

  get aDate(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  getStatusClass(status: Transaction['status']): string {
    switch (status) {
      case 'Completed': return 'text-green-400 bg-green-900/50';
      case 'Pending': return 'text-yellow-400 bg-yellow-900/50';
      case 'Failed': return 'text-red-400 bg-red-900/50';
      default: return 'text-zinc-400 bg-zinc-800';
    }
  }

  async handleTransfer() {
    if (this.quickTransferForm.invalid) {
      return;
    }
    this.transferError.set(null); // Reset error on new attempt

    const formValue = this.quickTransferForm.value;
    const amount = Number(formValue.amount);

    const newTransaction: Omit<Transaction, 'id'> = {
      merchant: formValue.recipient || 'Unknown Recipient',
      amount: amount,
      date: new Date().toISOString().split('T')[0], // Today's date as 'YYYY-MM-DD'
      status: 'Completed',
      type: 'debit',
    };

    try {
      await this.transactionService.addTransaction(newTransaction);
      this.quickTransferForm.reset();
    } catch (error: any) {
      console.error('Failed to send money:', error);
      this.transferError.set(error.message); // Display error to the user
    }
  }

  logout() {
    this.authService.logout();
  }

  // --- Event handlers for filtering and sorting ---

  onSearchTermChange(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.transactionService.updateSearchTerm(term);
  }

  onStatusChange(event: Event): void {
    const status = (event.target as HTMLSelectElement).value as 'All' | 'Completed' | 'Pending' | 'Failed';
    this.transactionService.updateStatusFilter(status);
  }
  
  changeSort(column: 'date' | 'amount'): void {
    this.transactionService.updateSort(column);
  }
}
