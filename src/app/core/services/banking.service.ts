
import { Injectable, inject } from '@angular/core';
import {
  doc,
  runTransaction,
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { firestore } from '../../../firebase.config';
import { AuthService } from './auth.service';

export type TransferStatus = 'SUCCESS' | 'INSUFFICIENT_FUNDS' | 'RECEIVER_NOT_FOUND' | 'CARD_FROZEN' | 'SENDER_BANNED' | 'ERROR';

@Injectable({
  providedIn: 'root',
})
export class BankingService {
  private authService = inject(AuthService);

  private async findReceiverByUpi(upiId: string): Promise<{ id: string; displayName: string; upiId: string } | null> {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('upiId', '==', upiId), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }
    const receiverDoc = querySnapshot.docs[0];
    const data = receiverDoc.data();
    return { 
        id: receiverDoc.id, 
        displayName: data['displayName'] || 'Valued Member',
        upiId: data['upiId']
    };
  }

  async transferFunds(senderUid: string, receiverUpi: string, amount: number): Promise<TransferStatus> {
    if (amount <= 0) return 'ERROR';

    try {
      const receiverData = await this.findReceiverByUpi(receiverUpi);
      if (!receiverData) return 'RECEIVER_NOT_FOUND';

      const senderDocRef = doc(firestore, 'users', senderUid);
      const receiverDocRef = doc(firestore, 'users', receiverData.id);

      await runTransaction(firestore, async (transaction) => {
        const senderDoc = await transaction.get(senderDocRef);
        const receiverDoc = await transaction.get(receiverDocRef);

        if (!senderDoc.exists() || !receiverDoc.exists()) {
          throw new Error('User document not found');
        }

        const senderData = senderDoc.data();
        
        // Pre-transaction security checks
        if (senderData['isBanned']) throw new Error('SENDER_BANNED');
        if (senderData['card']?.status === 'frozen') throw new Error('CARD_FROZEN');
        if (senderData['balance'] < amount) throw new Error('INSUFFICIENT_FUNDS');

        const receiverData = receiverDoc.data();

        // Perform the atomic updates
        const newSenderBalance = senderData['balance'] - amount;
        const newReceiverBalance = receiverData['balance'] + amount;

        transaction.update(senderDocRef, { balance: newSenderBalance });
        transaction.update(receiverDocRef, { balance: newReceiverBalance });
        
        // Log transactions for both parties
        const timestamp = new Date();
        const senderTxRef = doc(collection(firestore, 'users', senderUid, 'transactions'));
        transaction.set(senderTxRef, {
            merchant: `To: ${receiverData['displayName']}`,
            amount,
            date: timestamp,
            status: 'Completed',
            type: 'debit',
            description: `P2P Transfer to ${receiverUpi}`
        });

        const receiverTxRef = doc(collection(firestore, 'users', receiverDoc.id, 'transactions'));
        transaction.set(receiverTxRef, {
            merchant: `From: ${senderData['displayName']}`,
            amount,
            date: timestamp,
            status: 'Completed',
            type: 'credit',
            description: `P2P Transfer from ${senderData['upiId']}`
        });
      });

      return 'SUCCESS';
    } catch (e: any) {
      console.error('BankingService Error:', e.message);
      switch(e.message) {
        case 'INSUFFICIENT_FUNDS': return 'INSUFFICIENT_FUNDS';
        case 'CARD_FROZEN': return 'CARD_FROZEN';
        case 'SENDER_BANNED': return 'SENDER_BANNED';
        default: return 'ERROR';
      }
    }
  }
}
