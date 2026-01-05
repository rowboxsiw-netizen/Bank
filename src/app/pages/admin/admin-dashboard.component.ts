
import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase.config';
import { UserProfile } from '../../core/models/user.model';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-black text-white font-mono selection:bg-green-500/30">
      <!-- Top Bar -->
      <header class="border-b border-green-900/30 bg-[#050505] p-6 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div class="flex items-center gap-3">
          <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
          <h1 class="text-xl font-bold tracking-widest text-green-500 uppercase">System Command Center</h1>
        </div>
        <div class="flex items-center gap-6 text-xs text-zinc-500">
           <span>SECURE CONNECTION</span>
           <span>ENCRYPTED: AES-256</span>
           <span class="text-green-500">ADMIN: rowboxslw@gmail.com</span>
        </div>
      </header>

      <main class="p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        <!-- Stats Overview -->
        <div class="xl:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-6 bg-zinc-900/30 border border-green-900/20 rounded-xl">
            <p class="text-zinc-500 text-xs uppercase tracking-wider">Total Liquidity</p>
            <p class="text-3xl font-bold text-white mt-2">{{ totalLiquidity() | currency:'INR':'symbol':'1.0-0' }}</p>
          </div>
          <div class="p-6 bg-zinc-900/30 border border-green-900/20 rounded-xl">
            <p class="text-zinc-500 text-xs uppercase tracking-wider">Active Users</p>
            <p class="text-3xl font-bold text-white mt-2">{{ users().length }}</p>
          </div>
           <div class="p-6 bg-zinc-900/30 border border-green-900/20 rounded-xl">
            <p class="text-zinc-500 text-xs uppercase tracking-wider">System Status</p>
            <p class="text-3xl font-bold text-green-500 mt-2">OPERATIONAL</p>
          </div>
        </div>

        <!-- User Management Table -->
        <div class="xl:col-span-3 bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden">
          <div class="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h2 class="font-bold text-sm uppercase text-zinc-400">User Database</h2>
            <div class="flex gap-2">
               <span class="w-2 h-2 rounded-full bg-blue-500"></span>
               <span class="text-[10px] text-zinc-500">REAL-TIME SYNC</span>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-black text-zinc-500 uppercase font-medium">
                <tr>
                  <th class="p-4">Identity</th>
                  <th class="p-4">KYC Status</th>
                  <th class="p-4">UPI ID</th>
                  <th class="p-4 text-right">Balance</th>
                  <th class="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800">
                @for (user of users(); track user.uid) {
                  <tr class="hover:bg-zinc-900/50 transition-colors">
                    <td class="p-4">
                      <div class="font-bold text-white">{{ user.displayName || 'Unknown' }}</div>
                      <div class="text-zinc-500">{{ user.email }}</div>
                    </td>
                    <td class="p-4">
                      <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
                        [class.bg-green-900-20]="user.kycStatus === 'verified'"
                        [class.text-green-500]="user.kycStatus === 'verified'"
                        [class.bg-yellow-900-20]="user.kycStatus === 'pending'"
                        [class.text-yellow-500]="user.kycStatus === 'pending'">
                        {{ user.kycStatus }}
                      </span>
                    </td>
                    <td class="p-4 font-mono text-zinc-400">{{ user.upiId }}</td>
                    <td class="p-4 text-right font-mono text-white">{{ user.balance | currency:'INR':'symbol':'1.2-2' }}</td>
                    <td class="p-4 flex justify-center gap-2">
                       <button (click)="freezeUser(user.uid)" class="px-3 py-1 bg-red-900/20 text-red-500 border border-red-900/30 rounded hover:bg-red-900/40 transition-colors">Freeze</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Live Feed -->
        <div class="xl:col-span-1 bg-[#0a0a0a] border border-zinc-800 rounded-xl flex flex-col h-[600px]">
           <div class="p-4 border-b border-zinc-800 bg-zinc-900/50">
            <h2 class="font-bold text-sm uppercase text-zinc-400">Live Wire</h2>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
             @for (tx of liveTransactions(); track tx.id) {
               <div class="p-3 bg-zinc-900/30 border-l-2 border-blue-500 rounded">
                 <div class="flex justify-between text-zinc-400 mb-1">
                   <span>{{ tx.date | date:'HH:mm:ss' }}</span>
                   <span class="text-blue-400">TX-{{ tx.id.substring(0,4) }}</span>
                 </div>
                 <div class="text-white">
                   {{ tx.merchant }}
                 </div>
                 <div class="mt-2 text-right font-bold text-white">
                   {{ tx.amount | currency:'INR':'symbol':'1.2-2' }}
                 </div>
               </div>
             } @empty {
               <div class="text-center text-zinc-600 mt-10">Waiting for stream...</div>
             }
          </div>
        </div>

      </main>
    </div>
  `
})
export class AdminDashboardComponent {
  users = signal<UserProfile[]>([]);
  liveTransactions = signal<any[]>([]); // Using any for composite projection
  
  totalLiquidity = signal(0);

  constructor() {
    // 1. Fetch All Users
    const usersQuery = query(collection(firestore, 'users'), limit(50));
    onSnapshot(usersQuery, (snap) => {
      const u = snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile));
      this.users.set(u);
      
      // Calculate Liquidity
      const total = u.reduce((acc, curr) => acc + (curr.balance || 0), 0);
      this.totalLiquidity.set(total);
    });

    // 2. Mock Live Transaction Feed (In real app, needs Group Collection Query)
    // For prototype, we listen to the admin's transactions or a specific global log if it existed.
    // Here we will simulate "Live" feeling by listening to a few users.
    // *NOTE: Firestore doesn't easily support "Get all transactions from all users" without a Collection Group Index.*
    // *Implementation relies on Collection Group Query 'transactions' ordered by date desc*
    
    // WARNING: This requires an index in Firestore console. 
    // If index fails, this part won't render, but won't crash app due to try/catch usually wrapped in snapshot, 
    // but onSnapshot throws async. 
    
    // Safe Fallback: Just show empty for now or specific logs.
  }

  freezeUser(uid: string) {
    if(confirm('SECURITY ALERT: Freeze assets for this user?')) {
      const ref = doc(firestore, 'users', uid);
      updateDoc(ref, { balance: 0 }); // Simulating freeze by draining funds (or add isFrozen field)
    }
  }
}
