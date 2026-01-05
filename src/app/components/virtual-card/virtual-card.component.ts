
import { Component, ChangeDetectionStrategy, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Card } from '../../core/models/user.model';
import { TiltDirective } from '../../shared/directives/tilt.directive';

@Component({
  selector: 'app-virtual-card',
  imports: [CommonModule, TiltDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="perspective-1000 w-full max-w-md mx-auto h-[260px] cursor-pointer group" (click)="flipCard()">
      <!-- Card Container with 3D Transform -->
      <div class="relative w-full h-full transition-transform duration-700 transform-style-3d"
           [class.rotate-y-180]="isFlipped()">
        
        <!-- FRONT -->
        <div appTilt class="absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between backface-hidden shadow-2xl border border-white/10 overflow-hidden"
             [ngClass]="cardStatusClass()">
             
           <!-- Texture/Noise Overlay -->
           <div class="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
           <!-- Glass Reflection -->
           <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

           <!-- Card Header -->
           <div class="relative flex justify-between items-center z-10">
             <div class="font-bold italic text-2xl tracking-tighter text-white">Neo-Bank</div>
             <img src="https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/visa.png" class="h-10 object-contain" alt="Visa">
           </div>

           <!-- Chip -->
           <div class="relative z-10 flex items-center gap-4">
             <div class="w-12 h-9 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md border border-yellow-600/50 shadow-inner flex items-center justify-center overflow-hidden relative">
                <div class="absolute inset-0 border-[0.5px] border-black/20 rounded-md"></div>
                <!-- Chip Details -->
                <svg class="w-8 h-8 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 8h16M4 16h16M8 4v16M16 4v16" stroke-width="1"/></svg>
             </div>
             <svg class="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
           </div>

           <!-- Card Number -->
           <div class="relative z-10 mt-2">
             <div class="flex items-center gap-4 font-mono text-2xl tracking-widest text-white drop-shadow-md">
               <span>{{ displayNumber() }}</span>
               <button (click)="copyNumber($event)" class="text-xs p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Copy Number">
                 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
               </button>
             </div>
           </div>

           <!-- Footer info -->
           <div class="relative z-10 flex justify-between items-end">
             <div>
               <p class="text-[10px] uppercase text-white/60 tracking-wider">Card Holder</p>
               <p class="font-medium text-white tracking-wide uppercase">{{ card()?.holder || 'LOADING...' }}</p>
             </div>
             <div class="text-right">
               <p class="text-[10px] uppercase text-white/60 tracking-wider">Expires</p>
               <p class="font-medium text-white tracking-widest">{{ card()?.expiry }}</p>
             </div>
           </div>
        </div>

        <!-- BACK -->
        <div appTilt class="absolute inset-0 w-full h-full rounded-2xl bg-zinc-800 flex flex-col justify-between backface-hidden rotate-y-180 shadow-2xl border border-white/10 overflow-hidden">
           
           <div class="mt-6 h-12 bg-black w-full relative">
              <!-- Magstripe effect -->
              <div class="absolute inset-0 bg-gradient-to-b from-black via-gray-800 to-black opacity-80"></div>
           </div>

           <div class="px-6 relative">
             <div class="bg-white/20 h-10 w-full flex items-center justify-end px-4 rounded">
                <span class="font-mono text-black font-bold text-lg italic pr-2">CVV</span>
                <span class="font-mono text-black font-bold text-lg">{{ card()?.cvv }}</span>
             </div>
             <p class="text-[10px] text-zinc-400 mt-2 text-right">Authorized Signature - Not Valid Unless Signed</p>
           </div>
           
           <div class="p-6 flex justify-between items-center">
             <img src="https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/visa.png" class="h-8 opacity-50 grayscale" alt="Visa">
             
             <!-- Controls inside back of card -->
             <button (click)="toggleFreeze($event)" 
                     class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                     [class]="card()?.status === 'frozen' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'">
               {{ card()?.status === 'frozen' ? 'Unfreeze Card' : 'Freeze Card' }}
             </button>
           </div>
        </div>

      </div>
    </div>
    
    <!-- Status Indicator below card -->
    <div class="text-center mt-4">
      @if(card()?.status === 'frozen') {
         <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-500/30">
           <svg class="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
           CARD FROZEN - TRANSACTIONS DISABLED
         </span>
      } @else {
         <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300 border border-green-500/30">
           <svg class="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           ACTIVE
         </span>
      }
    </div>
  `,
  styles: [`
    .perspective-1000 { perspective: 1000px; }
    .transform-style-3d { transform-style: preserve-3d; }
    .backface-hidden { backface-visibility: hidden; }
    .rotate-y-180 { transform: rotateY(180deg); }
  `]
})
export class VirtualCardComponent {
  authService = inject(AuthService);
  card = input<Card | undefined>();
  
  isFlipped = signal(false);

  displayNumber = computed(() => {
    const num = this.card()?.number;
    if (!num) return '•••• •••• •••• ••••';
    // Always masked on front
    return `•••• •••• •••• ${num.slice(-4)}`;
  });

  cardStatusClass = computed(() => {
    const isFrozen = this.card()?.status === 'frozen';
    if (isFrozen) {
      // Ice Effect: Grayscale, Blue tint, Desaturated
      return 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 grayscale opacity-90 border-blue-300/50 shadow-[0_0_30px_rgba(147,197,253,0.3)]';
    }
    // Premium Active Effect: Deep rich gradient
    return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black border-white/10';
  });

  flipCard() {
    this.isFlipped.update(v => !v);
  }

  copyNumber(event: Event) {
    event.stopPropagation(); // Prevent flip
    const num = this.card()?.number;
    if (num) {
      navigator.clipboard.writeText(num.replace(/\s/g, '')); // Copy raw digits
      // Could show toast here
    }
  }

  toggleFreeze(event: Event) {
    event.stopPropagation(); // Prevent flip
    const currentStatus = this.card()?.status === 'frozen';
    this.authService.toggleCardFreeze(!currentStatus);
  }
}
