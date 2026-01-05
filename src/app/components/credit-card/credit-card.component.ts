
import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../core/models/user.model';
import { UiService } from '../../core/services/ui.service';

@Component({
  selector: 'app-credit-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full max-w-sm mx-auto group perspective-1000">
      
      <!-- Card Container -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#4c1d95] p-6 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(124,58,237,0.4)] border border-white/10">
        
        <!-- Noise Texture Overlay -->
        <div class="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        
        <!-- Glass Shimmer -->
        <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none"></div>

        <!-- Top Row: Chip & Logo -->
        <div class="relative z-10 flex justify-between items-start mb-8">
          <!-- EMV Chip & Contactless -->
          <div class="flex items-center gap-4">
            <div class="w-12 h-9 bg-gradient-to-tr from-yellow-200 to-yellow-500 rounded-md border border-yellow-400/50 shadow-inner relative overflow-hidden">
               <div class="absolute top-1/2 left-0 w-full h-[1px] bg-black/20"></div>
               <div class="absolute top-0 left-1/2 h-full w-[1px] bg-black/20"></div>
               <div class="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 border border-black/20 rounded-sm"></div>
            </div>
            <svg class="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <!-- Visa Logo -->
          <svg class="w-12 h-auto text-white" viewBox="0 0 48 16" fill="currentColor">
            <path d="M19.346 15.656h-2.918l1.822-11.31h2.917l-1.821 11.31zM31.396 0.998c-1.077 0-1.993 0.605-2.392 1.564l-8.47 13.094h3.064l1.218-3.376h3.75l0.354 1.565 0.395 1.811h2.706l-2.422-11.332c-0.088-0.457-0.456-0.785-0.92-0.785l-10.743-0.003-0.001 0.004h0.002c0.238 0 0.448 0.147 0.528 0.366l3.056 10.978h3.313l5.053-11.968c0.126-0.297 0.407-0.489 0.722-0.489h3.696l-0.344 1.621-0.245 1.144zM26.476 10.158l2.128-5.895 1.215 5.895h-3.343zM47.24 15.656l2.76-15.656h-2.825c-0.975 0-1.782 0.583-2.148 1.446l-7.611 14.21h3.047l1.181-3.277h0.038l6.812 3.277h3.746z"></path>
          </svg>
        </div>

        <!-- Middle Row: Number -->
        <div class="relative z-10 mb-8 group/number">
          <div class="flex items-center gap-3">
             <p class="font-mono text-xl sm:text-2xl font-bold tracking-widest text-white drop-shadow-md">
                •••• •••• •••• {{ card()?.number?.slice(-4) || '0000' }}
             </p>
             <button (click)="copyNumber()" class="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all opacity-0 group-hover/number:opacity-100 focus:opacity-100" title="Copy Card Number">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
             </button>
          </div>
        </div>

        <!-- Bottom Row: Holder & Expiry -->
        <div class="relative z-10 flex justify-between items-end">
          <div>
            <p class="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-1">Card Holder</p>
            <p class="font-medium text-white tracking-widest uppercase text-sm sm:text-base truncate max-w-[180px]">
              {{ card()?.holder || 'Valued Member' }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-1">Expires</p>
            <p class="font-medium text-white tracking-widest">{{ card()?.expiry || '12/30' }}</p>
          </div>
        </div>

      </div>

      <!-- Status Pill -->
      <div class="mt-4 flex justify-center">
        @if (card()?.status === 'active') {
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span class="text-xs font-bold text-green-400 tracking-wider">ACTIVE</span>
          </div>
        } @else {
           <div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <span class="h-2 w-2 rounded-full bg-blue-500"></span>
            <span class="text-xs font-bold text-blue-400 tracking-wider">FROZEN</span>
          </div>
        }
      </div>
    </div>
  `
})
export class CreditCardComponent {
  card = input<Card | undefined>();
  private uiService = inject(UiService);

  copyNumber() {
    const num = this.card()?.number;
    if (num) {
      navigator.clipboard.writeText(num.replace(/\s/g, '')).then(() => {
        this.uiService.showToast('Card number copied!', 'success');
      }).catch(() => {
        this.uiService.showToast('Failed to copy', 'error');
      });
    }
  }
}
