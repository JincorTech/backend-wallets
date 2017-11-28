import { Transaction } from './transaction';

export class Wallet {
  ownerId: string;
  companyId: string;
  type: string;
  address: string;
  balance: string;
  currency: string;
  createdAt: number;
  transactions: Array<Transaction>;
}
