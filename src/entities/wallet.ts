import { Transaction } from './transaction';
import { ObjectID } from 'bson';

export class Wallet {
  _id?: ObjectID;

  ownerId: string;
  companyId: string;
  type: string;
  mnemonics: string;
  salt: string;
  address: string;
  balance: string;
  currency: string;
  createdAt: number;

  transactions: Array<Transaction>;
}
