import { Employee } from './employee';

export class Transaction {
  id: string;
  from: string;
  to: string;
  status: string;
  details: string;
  amount: string;
  currency: string;
  date: number;

  verificationId: string;
  verificationExpiredAt: number;
  verificationMethod: string;
}
