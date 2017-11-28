export class Transaction {
  id: string;
  employee: {
    id: string;
    wallet: string;
    firstName: string;
    lastName: string;
    avatar: string
  };
  status: string;
  amount: string;
  currency: string;
  date: number;

  verificationId: string;
  verificationExpiredAt: number;
  verificationMethod: string;
}
