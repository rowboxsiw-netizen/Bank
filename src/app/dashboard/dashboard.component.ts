
import { Component, ChangeDetectionStrategy, inject, computed, signal, effect, EffectRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { TransactionService } from '../core/services/transaction.service';
import { TransferModalComponent } from '../components/transfer-modal/transfer-modal.component';
import { KycModalComponent } from '../components/kyc-modal/kyc-modal.component';
import { VirtualCardComponent } from '../components/virtual-card/virtual-card.component';
import { TiltDirective } from '../shared/directives/tilt.directive';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CurrencyPipe, DatePipe, TransferModalComponent, KycModalComponent, VirtualCardComponent, TiltDirective],
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
        <div class="w-full max-w-4xl mx-auto space-y-12">
            
            <!-- Balance & Card Module -->
            <div class="flex flex-col md:flex-row gap-8 items-center justify-center">
                
                <!-- Account Summary -->
                <div class="flex-1 space-y-2 text-center md:text-left">
                   <p class="text-zinc-400 text-sm font-medium uppercase tracking-widest">Total Balance</p>
                   <h1 class="text-5xl font-bold text-white tracking-tight">{{ userBalance() | currency:'INR':'symbol':'1.2-2' }}</h1>
                   <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mt-2">
                      <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span class="text-xs text-zinc-400 font-mono">{{ userUPI() }}</span>
                   </div>
                   
                   <div class="pt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                       <button [disabled]="currentUser()?.kycStatus === 'pending'" (click)="showTransferModal.set(true)" class="flex-1 min-w-[140px] px-6 py-3 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
                         Send Money
                       </button>
                       <button class="flex-1 min-w-[140px] px-6 py-3 font-semibold text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors">
                         Add Funds
                       </button>
                   </div>
                </div>

                <!-- Virtual Card Component -->
                <div class="flex-1 w-full max-w-md">
                   <app-virtual-card [card]="currentUser()?.card" />
                </div>
            </div>


            <!-- Recent Transactions -->
            @defer (on viewport) {
              <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h3 class="text-lg font-semibold mb-6 flex items-center gap-2">
                   <svg class="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   Transaction History
                </h3>
                <div class="space-y-1 max-h-80 overflow-y-auto pr-2">
                  @for (tx of transactions(); track tx.id) {
                    <div class="group flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10">
                      <div class="flex items-center gap-4">
                         <div class="w-10 h-10 rounded-full flex items-center justify-center" 
                              [class]="tx.type === 'credit' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'">
                            @if(tx.type === 'credit'){ <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg> }
                            @else { <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg> }
                         </div>
                         <div>
                            <p class="font-medium text-white">{{ tx.merchant }}</p>
                            <p class="text-xs text-zinc-500">{{ tx.date | date:'mediumDate' }} • {{ tx.date | date:'shortTime' }}</p>
                         </div>
                      </div>
                      <p class="font-mono font-medium text-lg" [class]="tx.type === 'credit' ? 'text-green-400' : 'text-white'">
                         {{ tx.type === 'credit' ? '+' : '-' }}{{ tx.amount | currency:'INR':'symbol':'1.2-2' }}
                      </p>
                    </div>
                  } @empty {
                    <div class="flex flex-col items-center justify-center py-12 text-zinc-500">
                       <svg class="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                       <p>No transactions found</p>
                    </div>
                  }
                </div>
              </div>
            } @placeholder {
               <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 h-48 flex items-center justify-center">
                 <p class="text-white/50 animate-pulse">Loading activity...</p>
               </div>
            }
        </div>
      </main>
    </div>

    @if (showTransferModal()) {
      <app-transfer-modal (close)="showTransferModal.set(false)" (transfer)="handleTransfer($event)"></app-transfer-modal>
    }
    
    @if(toastMessage()){
      <div class="fixed bottom-8 right-8 bg-zinc-800 text-white px-6 py-4 rounded-xl shadow-2xl border border-white/10 flex items-center gap-3 animate-fade-in-up z-50">
        @if(toastMessage()?.includes('failed') || toastMessage()?.includes('error')) {
           <svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } @else {
           <svg class="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        }
        <span class="font-medium">{{ toastMessage() }}</span>
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
        
        let msg = 'Transfer failed';
        if (result === 'CARD_FROZEN') msg = 'Transaction Blocked: Card is Frozen';
        else if (result === 'INSUFFICIENT_FUNDS') msg = 'Insufficient Funds';
        else if (result === 'RECEIVER_NOT_FOUND') msg = 'Receiver UPI not found';
        
        this.showToast(msg);
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
    setTimeout(() => this.toastMessage.set(null), 4000);
  }

  logout() {
    this.authService.logout();
  }
}
