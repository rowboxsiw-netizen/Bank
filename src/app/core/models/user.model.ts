
export interface UserProfile {
  uid: string;
  email: string;
  upiId: string;
  balance: number;
  createdAt: Date;
  role: 'admin' | 'user';
  kycStatus: 'pending' | 'verified';
  displayName?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
}
