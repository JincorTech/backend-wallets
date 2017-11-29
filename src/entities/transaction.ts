import { Employee } from './employee';
import { ObjectID } from 'bson';

export class Transaction {
  id: string;

  walletAddress: string;
  receiver: string;
  login: string;
  status: string;
  details: string;
  amount: string;
  currency: string;
  date: number;

  verificationId: string;
  verificationExpiredAt: number;
  verificationMethod: string;
}
