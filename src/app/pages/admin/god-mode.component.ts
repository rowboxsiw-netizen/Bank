
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { collection, onSnapshot, query, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { firestore } from '../../../firebase.config';
import { UserProfile } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-god-mode',
  imports: [CommonModule, CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-black text-zinc-300 font-mono selection:bg-blue-500/30">
      <header class="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-black/80 p-4 backdrop-blur-lg">
        <h1 class="text-lg font-bold tracking-wider text-white uppercase">NEO-BANK // GOD MODE</h1>
        <div class="text-xs text-zinc-500">ADMIN: {{ adminEmail() }}</div>
      </header>

      <main class="p-6">
        <div class="overflow-hidden border border-zinc-800 rounded-lg">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-zinc-800">
              <thead class="bg-zinc-900/50">
                <tr>
                  <th scope="col" class="py-3.5 px-4 text-left text-sm font-semibold text-white">User</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-white">Status</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-white">Balance</th>
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800 bg-black">
                @for (user of users(); track user.uid) {
                  <tr class="hover:bg-zinc-900/50" [class.opacity-40]="user.isBanned">
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                      <div class="font-medium text-white">{{ user.displayName || user.email }}</div>
                      <div class="text-zinc-400">{{ user.upiId }}</div>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-zinc-400">
                      <div class="flex items-center gap-2">
                        @if (user.isBanned) {
                          <span class="inline-flex items-center rounded-md bg-red-900/50 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/30">BANNED</span>
                        }
                        <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                          [ngClass]="user.kycStatus === 'verified' ? 'bg-green-900/50 text-green-400 ring-green-500/30' : 'bg-yellow-900/50 text-yellow-400 ring-yellow-500/30'">
                          {{ user.kycStatus }}
                        </span>
                         <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                          [ngClass]="user.card?.status === 'active' ? 'bg-zinc-800 text-zinc-400 ring-zinc-700' : 'bg-blue-900/50 text-blue-400 ring-blue-500/30'">
                          Card: {{ user.card?.status }}
                        </span>
                      </div>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-white font-semibold">{{ user.balance | currency:'INR' }}</td>
                    <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                       <div class="flex items-center justify-end gap-2">
                         <button (click)="injectFunds(user.uid)" class="px-3 py-1.5 text-xs bg-green-900/50 text-green-400 rounded-md hover:bg-green-900">Inject</button>
                         <button (click)="toggleCardFreeze(user)" class="px-3 py-1.5 text-xs bg-blue-900/50 text-blue-400 rounded-md hover:bg-blue-900">
                           {{ user.card?.status === 'frozen' ? 'Unfreeze' : 'Freeze' }}
                         </button>
                         <button (click)="toggleBan(user)" class="px-3 py-1.5 text-xs bg-red-900/50 text-red-400 rounded-md hover:bg-red-900">
                           {{ user.isBanned ? 'Unban' : 'Ban' }}
                         </button>
                       </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `
})
export class GodModeComponent {
  authService = inject(AuthService);
  users = signal<UserProfile[]>([]);
  adminEmail = this.authService.currentUser()?.email;

  constructor() {
    const usersQuery = query(collection(firestore, 'users'));
    onSnapshot(usersQuery, (snap) => {
      this.users.set(snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile)));
    });
  }

  async toggleCardFreeze(user: UserProfile) {
    const isCurrentlyFrozen = user.card?.status === 'frozen';
    const newStatus = isCurrentlyFrozen ? 'active' : 'frozen';
    const userRef = doc(firestore, 'users', user.uid);
    await updateDoc(userRef, { 'card.status': newStatus });
  }

  async toggleBan(user: UserProfile) {
    const isCurrentlyBanned = user.isBanned ?? false;
    const userRef = doc(firestore, 'users', user.uid);
    await updateDoc(userRef, { isBanned: !isCurrentlyBanned });
  }

  async injectFunds(uid: string) {
    const amountStr = prompt('Enter amount to inject (e.g., 500):');
    if (!amountStr) return;
    
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Invalid amount.');
      return;
    }

    const userRef = doc(firestore, 'users', uid);
    const batch = writeBatch(firestore);

    // Use a transaction inside the batch logic if you need to read first
    const user = this.users().find(u => u.uid === uid);
    if (!user) return;

    const newBalance = user.balance + amount;
    batch.update(userRef, { balance: newBalance });

    // Also add a credit transaction log
    const txRef = doc(collection(firestore, 'users', uid, 'transactions'));
    batch.set(txRef, {
      merchant: 'ADMIN BONUS',
      amount: amount,
      date: new Date(),
      status: 'Completed',
      type: 'credit',
      description: 'Discretionary funds injected by Admin.'
    });

    await batch.commit();
  }
}
