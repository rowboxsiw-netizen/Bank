
import { Component, ChangeDetectionStrategy, output, inject, signal, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';

type ModalStatus = 'idle' | 'verifying' | 'verified' | 'loading' | 'success';

@Component({
  selector: 'app-transfer-modal',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="relative w-full max-w-md m-4 bg-gray-800/50 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 shadow-2xl">

        @switch (status()) {
          @case ('idle') { <ng-container [ngTemplateOutlet]="formTmpl"></ng-container> }
          @case ('verifying') { <ng-container [ngTemplateOutlet]="formTmpl"></ng-container> }
          @case ('verified') { <ng-container [ngTemplateOutlet]="formTmpl"></ng-container> }
          
          @case ('loading') {
            <div class="flex flex-col items-center justify-center h-56">
              <svg class="w-12 h-12 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="mt-4 text-white/80">Processing transaction...</p>
            </div>
          }
           @case ('success') {
            <div class="flex flex-col items-center justify-center h-56">
                <svg class="w-16 h-16 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              <p class="mt-4 text-xl font-semibold text-green-300">Transfer Successful!</p>
            </div>
          }
        }
      </div>
    </div>

    <ng-template #formTmpl>
        <h2 class="text-2xl font-bold text-white mb-6">Send Money</h2>
        <form [formGroup]="transferForm" (ngSubmit)="onSubmit()">
          <div class="space-y-6">
            <div>
              <label for="upiId" class="block text-sm font-medium text-white/80">Receiver UPI ID</label>
              <input id="upiId" formControlName="upiId" type="text"
                      class="mt-1 block w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="recipient@TEST">
              @if (upiId?.hasError('pattern') && upiId?.touched) {
                <p class="mt-2 text-xs text-red-400">UPI ID must end with @TEST</p>
              }
              @if(status() === 'verifying'){ <p class="mt-2 text-xs text-blue-400">Verifying receiver...</p> }
              @if(status() === 'verified' && receiverName()){ <p class="mt-2 text-xs text-green-400">✓ Verified: {{ receiverName() }}</p> }
              @if(upiIdInvalid()){ <p class="mt-2 text-xs text-red-400">Receiver not found.</p> }
            </div>
            <div>
              <label for="amount" class="block text-sm font-medium text-white/80">Amount</label>
              <input id="amount" formControlName="amount" type="number"
                      class="mt-1 block w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00">
            </div>
          </div>
          <div class="mt-8 flex justify-end space-x-4">
            <button type="button" (click)="close.emit()" class="px-6 py-2.5 text-sm font-semibold bg-white/10 rounded-lg hover:bg-white/20">Cancel</button>
            <button type="submit" [disabled]="transferForm.invalid || status() !== 'verified'" class="px-6 py-2.5 text-sm font-semibold bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed">Send</button>
          </div>
        </form>
    </ng-template>
  `,
})
export class TransferModalComponent {
  close = output<void>();
  transfer = output<{ amount: number; receiverUpi: string }>();

  private transactionService = inject(TransactionService);

  status = signal<ModalStatus>('idle');
  receiverName = signal<string | null>(null);
  upiIdInvalid = signal(false);

  // FIX: Explicitly cast the result of inject(FormBuilder) to FormBuilder to resolve a type inference issue where it was being treated as 'unknown'. This ensures the 'group' method is available and the form is correctly typed.
  transferForm = (inject(FormBuilder) as FormBuilder).group({
    upiId: ['', [Validators.required, Validators.pattern(/^.+@TEST$/)]],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  get upiId() { return this.transferForm.get('upiId'); }

  constructor() {
    this.upiId!.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => {
        this.receiverName.set(null);
        this.upiIdInvalid.set(false);
        if (this.upiId?.valid) {
          this.status.set('verifying');
        } else {
          this.status.set('idle');
        }
      }),
      switchMap(upi => {
        if (!this.upiId?.valid) return Promise.resolve(null);
        return this.transactionService.findReceiverByUpi(upi!);
      })
    ).subscribe(receiver => {
      if (receiver) {
        this.receiverName.set(receiver.displayName);
        this.status.set('verified');
      } else if (this.upiId?.valid) {
        this.upiIdInvalid.set(true);
        this.status.set('idle');
      }
    });
  }

  onSubmit() {
    if (this.transferForm.invalid || this.status() !== 'verified') {
      return;
    }

    this.status.set('loading');
    const { amount, upiId } = this.transferForm.value;
    
    // Emit event for parent to handle optimistic update
    this.transfer.emit({ amount: amount!, receiverUpi: upiId! });

    // The modal will just close itself after emitting. 
    // The parent dashboard handles success/failure UI (toast).
  }
}
