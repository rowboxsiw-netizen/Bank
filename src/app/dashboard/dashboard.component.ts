
import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { TransactionService } from '../core/services/transaction.service';
import { UiService } from '../core/services/ui.service';
import { ThreeBgComponent } from '../shared/components/three-bg/three-bg.component';
import { CreditCardComponent } from '../components/credit-card/credit-card.component';
import { TiltDirective } from '../shared/directives/tilt.directive';
import { TransferModalComponent } from '../components/transfer-modal/transfer-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    CurrencyPipe, 
    DatePipe, 
    ThreeBgComponent, 
    CreditCardComponent, 
    TiltDirective, 
    TransferModalComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  authService = inject(AuthService);
  txService = inject(TransactionService);
  uiService = inject(UiService);

  // Signals
  user = this.authService.currentUser;
  transactions = this.txService.transactions;
  
  // UI State
  showTransferModal = signal(false);
  isCardFlipped = signal(false);

  // Computed
  balance = computed(() => this.user()?.balance ?? 0);
  
  toggleCardFlip() {
    this.isCardFlipped.update(v => !v);
  }

  openTransfer() {
    this.showTransferModal.set(true);
  }

  async onTransferSubmit(data: { amount: number; receiverUpi: string }) {
    this.showTransferModal.set(false);
    const success = await this.txService.sendMoney(data.amount, data.receiverUpi);
    if (success) {
      this.uiService.showToast('Funds Transferred Successfully', 'success');
      // Play Audio Effect
      new Audio('assets/sounds/coin.mp3').play().catch(() => {}); // Optional polish
    }
  }
}
