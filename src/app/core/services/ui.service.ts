
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  isLoading = signal<boolean>(false);
  showSkeleton = signal<boolean>(true);
  
  // Simple toast signal
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  constructor() {
    // Turn off skeleton after a minimal delay to simulate "instant" feel but allow animations
    setTimeout(() => this.showSkeleton.set(false), 800);
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }
}
