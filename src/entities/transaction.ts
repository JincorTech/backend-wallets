import { Employee } from './employee';

export class Transaction {
  id: string;
  employee: Employee;
  status: string;
  amount: string;
  currency: string;
  date: number;

  verificationId: string;
  verificationExpiredAt: number;
  verificationMethod: string;
}
