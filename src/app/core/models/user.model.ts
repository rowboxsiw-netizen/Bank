
export interface UserProfile {
  uid: string;
  email: string;
  upiId: string;
  balance: number;
  createdAt: any;
  displayName?: string | null;
  photoURL?: string | null;
}
