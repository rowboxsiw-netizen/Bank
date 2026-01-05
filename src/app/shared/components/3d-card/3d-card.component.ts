
import { Component, ChangeDetectionStrategy, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Card } from '../../../core/models/user.model';
import { TiltDirective } from '../../directives/tilt.directive';

@Component({
  selector: 'app-3d-card',
  imports: [CommonModule, TiltDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="perspective-1000 w-full max-w-md mx-auto h-[260px] cursor-pointer group" (click)="flipCard()">
      <div class="relative w-full h-full transition-transform duration-700 transform-style-3d"
           [class.rotate-y-180]="isFlipped()">
        
        <!-- FRONT -->
        <div appTilt class="absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between backface-hidden shadow-2xl border overflow-hidden"
             [ngClass]="cardStyle()">
             
           <div class="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
           <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

           <div class="relative flex justify-between items-center z-10">
             <div class="font-bold italic text-2xl tracking-tighter text-white">Neo-Bank</div>
             <img src="https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/visa.png" class="h-10 object-contain" alt="Visa">
           </div>

           <div class="relative z-10 flex items-center gap-4">
              <div class="w-12 h-9 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md border border-yellow-600/50 shadow-inner"></div>
           </div>

           <div class="relative z-10 mt-2">
             <div class="font-mono text-2xl tracking-widest text-white drop-shadow-md">
                {{ card()?.number || '4532 •••• •••• ••••' }}
             </div>
           </div>

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
           <div class="mt-6 h-12 bg-black w-full"></div>
           <div class="px-6 relative">
             <div class="bg-white/20 h-10 w-full flex items-center justify-end px-4 rounded">
                <span class="font-mono text-black font-bold text-lg italic pr-2">CVV</span>
                <span class="font-mono text-black font-bold text-lg">{{ card()?.cvv }}</span>
             </div>
           </div>
           <div class="p-6">
             <button (click)="toggleFreeze($event)" 
                     class="w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all"
                     [ngClass]="card()?.status === 'frozen' ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'bg-red-500/10 text-red-300 hover:bg-red-500/20'">
               {{ card()?.status === 'frozen' ? 'Unfreeze Card' : 'Freeze Card' }}
             </button>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .perspective-1000 { perspective: 1000px; }
    .transform-style-3d { transform-style: preserve-3d; }
    .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    .rotate-y-180 { transform: rotateY(180deg); }
  `]
})
export class ThreeDCardComponent {
  authService = inject(AuthService);
  card = input<Card | undefined>();
  
  isFlipped = signal(false);

  cardStyle = computed(() => {
    if (this.card()?.status === 'frozen') {
      return 'bg-slate-500/10 border-blue-300/20 backdrop-blur-sm filter grayscale';
    }
    return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black border-white/10';
  });

  flipCard() {
    this.isFlipped.update(v => !v);
  }

  toggleFreeze(event: Event) {
    event.stopPropagation(); // Prevent card from flipping when button is clicked
    const isFrozen = this.card()?.status === 'frozen';
    this.authService.toggleCardFreeze(!isFrozen);
  }
}
