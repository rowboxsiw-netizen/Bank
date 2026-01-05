
import { Component, ChangeDetectionStrategy, input, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../core/models/user.model';
import { UiService } from '../../core/services/ui.service';
import { TiltGlareDirective } from '../../shared/directives/tilt-glare.directive';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-credit-card',
  standalone: true,
  imports: [CommonModule, TiltGlareDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="perspective-1000 w-full max-w-[400px] mx-auto h-[250px]" appTiltGlare [tiltMaxAngle]="20" [glareEnabled]="true">
      
      <!-- 3D Wrapper that rotates -->
      <div class="w-full h-full transition-transform duration-700 transform-style-3d cursor-pointer relative"
           [class.rotate-y-180]="isFlipped()"
           [style.transform]="'rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg))' + (isFlipped() ? ' rotateY(180deg)' : '')">
        
        <!-- FRONT FACE -->
        <div class="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-dark-metal">
            
            <!-- Dynamic Glare Overlay -->
            <div class="absolute inset-0 pointer-events-none z-50 mix-blend-overlay transition-opacity duration-300"
                 style="background: radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.4) 0%, transparent 50%); opacity: var(--glare-opacity, 0);">
            </div>

            <!-- Holographic Foil Noise -->
            <div class="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-soft-light pointer-events-none"></div>
            
            <!-- Metallic Sheen -->
            <div class="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/40 pointer-events-none"></div>

            <!-- Content Container -->
            <div class="relative z-10 p-6 flex flex-col justify-between h-full" (click)="toggleFlip()">
                
                <!-- Header -->
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-3">
                        <!-- Holographic Chip -->
                        <div class="w-12 h-9 rounded-md relative overflow-hidden bg-gradient-to-tr from-yellow-200 via-yellow-400 to-yellow-600 border border-yellow-300/50 shadow-md">
                            <div class="absolute inset-0 opacity-50 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#000_2px,#000_3px)] mix-blend-overlay"></div>
                            <div class="absolute top-1/2 left-0 w-full h-[1px] bg-black/30"></div>
                            <div class="absolute top-0 left-1/2 h-full w-[1px] bg-black/30"></div>
                        </div>
                        <svg class="w-6 h-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
                    </div>
                    <!-- Foil Visa Logo -->
                    <svg class="w-16 h-auto text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" viewBox="0 0 48 16" fill="currentColor">
                         <path d="M19.346 15.656h-2.918l1.822-11.31h2.917l-1.821 11.31zM31.396 0.998c-1.077 0-1.993 0.605-2.392 1.564l-8.47 13.094h3.064l1.218-3.376h3.75l0.354 1.565 0.395 1.811h2.706l-2.422-11.332c-0.088-0.457-0.456-0.785-0.92-0.785l-10.743-0.003-0.001 0.004h0.002c0.238 0 0.448 0.147 0.528 0.366l3.056 10.978h3.313l5.053-11.968c0.126-0.297 0.407-0.489 0.722-0.489h3.696l-0.344 1.621-0.245 1.144zM26.476 10.158l2.128-5.895 1.215 5.895h-3.343zM47.24 15.656l2.76-15.656h-2.825c-0.975 0-1.782 0.583-2.148 1.446l-7.611 14.21h3.047l1.181-3.277h0.038l6.812 3.277h3.746z"></path>
                    </svg>
                </div>

                <!-- Number -->
                <div class="mt-4 flex items-center gap-4 group/copy">
                    <p class="font-ocr text-2xl tracking-widest text-white drop-shadow-[1px_1px_2px_rgba(0,0,0,0.8)]" 
                       style="text-shadow: 0px 1px 1px rgba(0,0,0,0.5)">
                        {{ formattedNumber() }}
                    </p>
                     <button (click)="copyNumber($event)" class="opacity-0 group-hover/copy:opacity-100 transition-opacity p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                     </button>
                </div>

                <!-- Footer -->
                <div class="flex justify-between items-end text-white/90">
                    <div>
                        <p class="text-[9px] uppercase tracking-widest text-white/60 mb-0.5">Card Holder</p>
                        <p class="font-ocr text-sm uppercase tracking-wider">{{ card()?.holder || 'Valued Member' }}</p>
                    </div>
                     <div class="text-right">
                        <p class="text-[9px] uppercase tracking-widest text-white/60 mb-0.5">Expires</p>
                        <p class="font-ocr text-sm tracking-wider">{{ card()?.expiry || '00/00' }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- BACK FACE -->
        <div class="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#1a1a1a]">
             <!-- Magstripe -->
             <div class="mt-6 h-12 w-full bg-[#000] relative overflow-hidden">
                <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:4px_100%]"></div>
             </div>

             <!-- Signature & CVV -->
             <div class="px-6 mt-6">
                <div class="flex items-center">
                    <div class="h-10 flex-1 bg-white/80 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-80 flex items-center px-2">
                        <span class="font-handwriting text-black text-lg opacity-70 transform -rotate-2 ml-4">Authorized Signature</span>
                    </div>
                    <div class="h-10 w-16 bg-white flex items-center justify-center border-l border-gray-300">
                        <span class="font-mono font-bold text-black text-lg italic">{{ card()?.cvv || '***' }}</span>
                    </div>
                </div>
             </div>

             <!-- Controls -->
             <div class="p-6 flex justify-between items-center mt-auto">
                 <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg class="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <span class="text-xs text-zinc-500 font-mono tracking-wider">SECURE</span>
                 </div>
                 
                 <button (click)="toggleFreeze($event)"
                         class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border"
                         [ngClass]="card()?.status === 'frozen' ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'">
                    {{ card()?.status === 'frozen' ? 'Unfreeze' : 'Freeze Card' }}
                 </button>
             </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .perspective-1000 { perspective: 1000px; }
    .transform-style-3d { transform-style: preserve-3d; }
    .backface-hidden { backface-visibility: hidden; }
    .rotate-y-180 { transform: rotateY(180deg); }
    .bg-dark-metal {
        background: 
            radial-gradient(circle at 50% 0%, #2d2d35 0%, #151517 60%),
            repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 4px);
    }
    .font-ocr { font-family: 'Courier New', Courier, monospace; font-weight: 700; }
    .font-handwriting { font-family: 'Brush Script MT', cursive; }
  `]
})
export class CreditCardComponent {
  card = input<Card | undefined>();
  private uiService = inject(UiService);
  private authService = inject(AuthService);
  
  isFlipped = signal(false);

  formattedNumber = computed(() => {
    const num = this.card()?.number || '0000000000000000';
    // Format as 0000 0000 0000 0000
    return num.replace(/(\d{4})/g, '$1 ').trim();
  });

  toggleFlip() {
    this.isFlipped.update(v => !v);
  }

  copyNumber(event: Event) {
    event.stopPropagation();
    const num = this.card()?.number;
    if (num) {
      navigator.clipboard.writeText(num.replace(/\s/g, '')).then(() => {
        this.uiService.showToast('Card number copied', 'success');
      });
    }
  }

  toggleFreeze(event: Event) {
    event.stopPropagation();
    const isFrozen = this.card()?.status === 'frozen';
    this.authService.toggleCardFreeze(!isFrozen);
  }
}
