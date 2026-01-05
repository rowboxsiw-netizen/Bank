
export interface Transaction {
  id: string;
  date: Date;
  merchant: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  type: 'debit' | 'credit';
}
