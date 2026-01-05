import { Timestamp } from 'firebase/firestore';

export interface Transaction {
  id?: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'pending' | 'completed' | 'failed' | 'Completed' | 'Pending' | 'Failed'; // Allow both for compatibility
  merchant?: string;
  receiverUpi?: string;
  senderUpi?: string;
  date: Timestamp | Date;
  description?: string;
}
