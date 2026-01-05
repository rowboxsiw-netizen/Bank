
import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { TransactionService } from '../core/services/transaction.service';
import { UiService } from '../core/services/ui.service';
import { TransferModalComponent } from '../components/transfer-modal/transfer-modal.component';
import { KycModalComponent } from '../components/kyc-modal/kyc-modal.component';
import { CreditCardComponent } from '../components/credit-card/credit-card.component';
import { TiltDirective } from '../shared/directives/tilt.directive';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CurrencyPipe, DatePipe, TransferModalComponent, KycModalComponent, CreditCardComponent, TiltDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (currentUser()?.kycStatus === 'pending') {
      <app-kyc-modal />
    }

    <!-- Main Shell: Deep Black -->
    <div class="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
      
      <!-- Top Navigation -->
      <nav class="fixed top-0 w-full z-40 border-b border-white/5 bg-black/50 backdrop-blur-xl h-16 flex items-center justify-between px-6 lg:px-8">
        <div class="flex items-center gap-2">
           <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
             <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
           <span class="font-bold text-lg tracking-tight">Neo-Bank</span>
        </div>
        
        <button (click)="logout()" class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 border border-white/10 rounded-lg hover:bg-white/5 hover:text-white transition-all">
          Logout
        </button>
      </nav>

      <!-- Dashboard Content -->
      <main class="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
        
        <!-- Top Section: Balance & Card -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <!-- Left: Balance & Actions -->
          <div class="space-y-8 animate-fade-in-up">
            <div>
              <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Balance</p>
              <h1 class="text-6xl sm:text-7xl font-bold text-white tracking-tighter mb-4">
                {{ userBalance() | currency:'INR':'symbol':'1.2-2' }}
              </h1>
              
              <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span class="text-xs font-mono text-gray-400">{{ userUPI() }}</span>
                <button (click)="copyUpi()" class="text-gray-500 hover:text-white transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-4">
              <button (click)="showTransferModal.set(true)" 
                      class="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]">
                 Send Money
              </button>
              <button class="flex-1 py-4 px-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl transition-all active:scale-[0.98]">
                 Add Funds
              </button>
            </div>
          </div>

          <!-- Right: The Purple Card -->
          <div appTilt class="flex justify-center lg:justify-end animate-fade-in-up [animation-delay:150ms]">
             <app-credit-card [card]="currentUser()?.card" />
          </div>
        </div>

        <!-- Bottom: Transactions -->
        <div class="animate-fade-in-up [animation-delay:300ms]">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold">Transactions</h2>
            <button class="text-xs text-blue-400 hover:text-blue-300 font-medium">View All</button>
          </div>

          <!-- Transaction List Container -->
          <div class="bg-[#111] border border-white/5 rounded-2xl overflow-hidden min-h-[300px]">
            @defer (on viewport) {
              <div class="divide-y divide-white/5">
                @for (tx of transactions(); track tx.id) {
                  <div class="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div class="flex items-center gap-4">
                      <!-- Icon -->
                      <div class="w-10 h-10 rounded-full flex items-center justify-center border border-white/5"
                           [class]="tx.type === 'credit' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'">
                        @if(tx.type === 'credit') {
                          <svg class="w-5 h-5 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                        } @else {
                          <svg class="w-5 h-5 transform rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        }
                      </div>
                      
                      <!-- Details -->
                      <div>
                        <p class="font-bold text-sm text-gray-200 group-hover:text-white transition-colors">
                          {{ tx.merchant }}
                        </p>
                        <p class="text-xs text-gray-500 mt-0.5 font-mono">
                          {{ tx.date | date:'MMM d, h:mm a' }}
                        </p>
                      </div>
                    </div>

                    <!-- Amount -->
                    <div class="text-right">
                      <p class="font-bold font-mono text-base tracking-tight" 
                         [class]="tx.type === 'credit' ? 'text-green-400' : 'text-red-400'">
                        {{ tx.type === 'credit' ? '+' : '-' }}{{ tx.amount | currency:'INR':'symbol':'1.0-0' }}
                      </p>
                      <p class="text-[10px] text-gray-600 uppercase tracking-wider font-bold mt-1">
                        {{ tx.status }}
                      </p>
                    </div>
                  </div>
                } @empty {
                  <div class="flex flex-col items-center justify-center h-64 text-gray-500">
                     <p>No recent activity</p>
                  </div>
                }
              </div>
            } @placeholder {
               <!-- Skeleton Loader -->
               <div class="p-5 space-y-6">
                 @for(i of [1,2,3]; track i) {
                   <div class="flex items-center justify-between animate-pulse">
                      <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-white/10"></div>
                        <div class="space-y-2">
                           <div class="h-4 w-32 bg-white/10 rounded"></div>
                           <div class="h-3 w-20 bg-white/5 rounded"></div>
                        </div>
                      </div>
                      <div class="h-6 w-24 bg-white/10 rounded"></div>
                   </div>
                 }
               </div>
            }
          </div>
        </div>
      </main>

      <!-- Modals & Toasts -->
      @if (showTransferModal()) {
        <app-transfer-modal (close)="showTransferModal.set(false)" (transfer)="handleTransfer($event)"></app-transfer-modal>
      }
      
      @if(uiService.toast()) {
        <div class="fixed top-24 right-8 z-50 animate-bounce-in">
           <div class="flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-md"
                [class]="uiService.toast()?.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'">
             <span class="font-bold text-sm">{{ uiService.toast()?.message }}</span>
           </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in-up {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      opacity: 0;
      transform: translateY(20px);
    }
    .animate-bounce-in {
      animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    @keyframes fadeInUp {
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes bounceIn {
      from { opacity: 0; transform: scale(0.9) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
  `]
})
export class DashboardComponent {
  authService = inject(AuthService);
  uiService = inject(UiService);
  private transactionService = inject(TransactionService);

  currentUser = this.authService.currentUser;
  userBalance = computed(() => this.authService.currentUser()?.balance ?? 0);
  userUPI = computed(() => this.authService.currentUser()?.upiId ?? 'Not Set');
  transactions = this.transactionService.transactions;

  showTransferModal = signal(false);

  copyUpi() {
    const upi = this.userUPI();
    if(upi) {
      navigator.clipboard.writeText(upi);
      this.uiService.showToast('UPI ID Copied to clipboard');
    }
  }

  async handleTransfer(data: { amount: number; receiverUpi: string }) {
    this.showTransferModal.set(false);
    const currentUser = this.currentUser();
    if (!currentUser) return;
    
    // Optimistic Update
    const originalBalance = currentUser.balance;
    const optimisticBalance = originalBalance - data.amount;
    this.authService.currentUser.update(user => user ? { ...user, balance: optimisticBalance } : null);

    try {
      const result = await this.transactionService.transferFunds(data.amount, data.receiverUpi);

      if (result !== 'SUCCESS') {
        // Rollback
        this.authService.currentUser.update(user => user ? { ...user, balance: originalBalance } : null);
        
        let msg = 'Transfer failed';
        if (result === 'CARD_FROZEN') msg = 'Transaction Blocked: Card is Frozen';
        else if (result === 'INSUFFICIENT_FUNDS') msg = 'Insufficient Funds';
        else if (result === 'RECEIVER_NOT_FOUND') msg = 'Receiver UPI not found';
        
        this.uiService.showToast(msg, 'error');
      } else {
        this.uiService.showToast('Transfer Successful');
      }
    } catch (error) {
      this.authService.currentUser.update(user => user ? { ...user, balance: originalBalance } : null);
      this.uiService.showToast('An unexpected error occurred', 'error');
    }
  }

  logout() {
    this.authService.logout();
  }
}
