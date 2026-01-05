
export interface Card {
  number: string;
  cvv: string;
  expiry: string;
  status: 'active' | 'frozen';
  holder: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  upiId: string;
  balance: number;
  createdAt: Date;
  role: 'admin' | 'user';
  kycStatus: 'pending' | 'verified';
  card?: Card;
  displayName?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
  isBanned?: boolean;
}
