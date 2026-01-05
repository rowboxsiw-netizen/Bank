
export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  type: 'debit' | 'credit';
}
