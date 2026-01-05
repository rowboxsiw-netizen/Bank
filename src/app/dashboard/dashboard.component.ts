
import { Component, ChangeDetectionStrategy, inject, computed, signal, effect, EffectRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { TransactionService } from '../core/services/transaction.service';
import { TransferModalComponent } from '../components/transfer-modal/transfer-modal.component';
import { KycModalComponent } from '../components/kyc-modal/kyc-modal.component';
import { TiltDirective } from '../shared/directives/tilt.directive';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CurrencyPipe, DatePipe, TransferModalComponent, KycModalComponent, TiltDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Mandatory KYC Check -->
    @if (currentUser()?.kycStatus === 'pending') {
      <app-kyc-modal />
    }

    <div class="relative flex flex-col h-screen overflow-hidden bg-black text-white font-sans">
      <!-- Animated Gradient Background -->
      <div class="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-gray-900 to-black -z-10"></div>

      <!-- Header -->
      <header class="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-black/30 backdrop-blur-sm border-b border-white/10 z-10">
        <div class="flex items-center space-x-3">
          <svg class="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M2 7L12 12L22 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          <span class="text-xl font-semibold tracking-wider">Neo-Bank</span>
        </div>
        <div class="flex items-center space-x-4">
          @if (currentUser()) {
            <button (click)="logout()" class="px-4 py-2 text-sm font-medium bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
              Logout
            </button>
          }
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
        <div class="w-full max-w-4xl mx-auto space-y-8">
            <!-- 3D Card Section -->
            <div class="w-full max-w-md mx-auto">
              <div appTilt class="relative w-full aspect-[1.586] rounded-2xl p-6 flex flex-col justify-between
                          bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl
                          hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]">
                  <div class="flex justify-between items-start">
                    <span class="text-xl font-bold">{{ currentUser()?.displayName || 'User' }}</span>
                     @if(currentUser()?.kycStatus === 'verified') {
                        <span class="bg-green-500/20 text-green-400 text-[10px] px-2 py-1 rounded-full uppercase tracking-widest border border-green-500/30">Verified</span>
                     }
                  </div>
                  <div class="text-left">
                    <p class="text-sm text-white/70">Balance</p>
                    <p class="text-4xl font-semibold tracking-wider">{{ userBalance() | currency:'INR':'symbol':'1.2-2' }}</p>
                    <p class="mt-4 font-mono text-lg text-white/80 tracking-widest">{{ userUPI() }}</p>
                  </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-center space-x-4">
              <button [disabled]="currentUser()?.kycStatus === 'pending'" (click)="showTransferModal.set(true)" class="px-8 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">Send via UPI</button>
              <button class="px-8 py-3 font-semibold text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors">Add Money</button>
            </div>

            <!-- Recent Transactions -->
            @defer (on viewport) {
              <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                <h3 class="text-lg font-semibold mb-4">Recent Transactions</h3>
                <div class="space-y-3 max-h-64 overflow-y-auto">
                  @for (tx of transactions(); track tx.id) {
                    <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <div>
                        <p class="font-medium">{{ tx.merchant }}</p>
                        <p class="text-sm text-white/60">{{ tx.date | date:'mediumDate' }}</p>
                      </div>
                      <p class="font-mono" [class]="tx.type === 'credit' ? 'text-green-400' : 'text-red-400'">
                         {{ tx.type === 'credit' ? '+' : '-' }}{{ tx.amount | currency:'INR':'symbol':'1.2-2' }}
                      </p>
                    </div>
                  } @empty {
                    <p class="text-center text-white/50 py-4">No transactions yet.</p>
                  }
                </div>
              </div>
            } @placeholder {
               <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 h-48 flex items-center justify-center">
                 <p class="text-white/50">Loading transactions...</p>
               </div>
            }
        </div>
      </main>
    </div>

    @if (showTransferModal()) {
      <app-transfer-modal (close)="showTransferModal.set(false)" (transfer)="handleTransfer($event)"></app-transfer-modal>
    }
    
    @if(toastMessage()){
      <div class="fixed bottom-8 right-8 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
        {{ toastMessage() }}
      </div>
    }
  `
})
export class DashboardComponent {
  authService = inject(AuthService);
  private transactionService = inject(TransactionService);

  currentUser = this.authService.currentUser;
  userBalance = computed(() => this.authService.currentUser()?.balance ?? 0);
  userUPI = computed(() => this.authService.currentUser()?.upiId ?? 'Not Set');
  transactions = this.transactionService.transactions;

  showTransferModal = signal(false);
  toastMessage = signal<string | null>(null);

  async handleTransfer(data: { amount: number; receiverUpi: string }) {
    this.showTransferModal.set(false);
    const currentUser = this.currentUser();
    if (!currentUser) return;
    
    // --- Optimistic UI Update ---
    const originalBalance = currentUser.balance;
    const optimisticBalance = originalBalance - data.amount;
    this.authService.currentUser.update(user => user ? { ...user, balance: optimisticBalance } : null);

    try {
      const result = await this.transactionService.transferFunds(data.amount, data.receiverUpi);

      if (result !== 'SUCCESS') {
        // --- Rollback on Failure ---
        this.authService.currentUser.update(user => user ? { ...user, balance: originalBalance } : null);
        this.showToast(`Transfer failed: ${result.replace('_', ' ')}`);
      }
      // On success, do nothing. The real-time listener will confirm the new balance.
    } catch (error) {
       // --- Rollback on Error ---
      this.authService.currentUser.update(user => user ? { ...user, balance: originalBalance } : null);
      this.showToast('An unexpected error occurred.');
    }
  }

  showToast(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  logout() {
    this.authService.logout();
  }
}
