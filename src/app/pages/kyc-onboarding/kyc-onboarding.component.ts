
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { KycModalComponent } from '../../components/kyc-modal/kyc-modal.component';

@Component({
  selector: 'app-kyc-onboarding',
  imports: [KycModalComponent],
  template: `
    <!-- This component provides a blurred background for the KYC modal -->
    <div class="fixed inset-0 h-screen w-screen bg-black/50 backdrop-blur-sm"></div>
    <app-kyc-modal />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KycOnboardingComponent {}
