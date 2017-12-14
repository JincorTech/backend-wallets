import { injectable, inject } from 'inversify';

import { Logger } from '../../logger';
import { MongoDbConnector } from './mongodb.connector.service';
import { Wallet } from '../../entities/wallet';
import { Transaction } from '../../entities/transaction';
import { TransactionRepository } from './transaction.repository';

export interface WalletRepository {
  save(wallet: Wallet & {_id?: any}): Promise<any>;
  getAllCorporateByCompanyId(companyId: string): Promise<Wallet[]>;
  getAllByUserIdAndCompanyId(userId: string, companyId: string): Promise<Wallet[]>;
  getByAddress(address: string): Promise<Wallet>;
}

@injectable()
export class MongoWalletRepository implements WalletRepository {
  private logger = Logger.getInstance('MONGO_WALLET_REPOSITORY');
  constructor(
    @inject('TransactionRepository') private transactionRepository: TransactionRepository,
    @inject('MongoDbConnector') private mongoConnector: MongoDbConnector
  ) {
  }

  /**
   * @param wallet
   */
  async save(wallet: Wallet): Promise<any> {
    this.logger.debug('Save', wallet.address);

    const result = (await (await this.mongoConnector.getDb()).collection('wallets').save({ ...wallet, transactions: undefined }));
    if (result.ops) {
      return result.ops[0]._id;
    }
    return wallet._id;
  }

  /**
   * @param userId
   * @param companyId
   */
  async getAllCorporateByCompanyId(companyId: string): Promise<Array<Wallet>> {
    this.logger.debug('Query all corporate by company', companyId);

    const wallets: Array<Wallet> = await (await this.mongoConnector.getDb()).collection('wallets').find({
      type: 'corporate',
      companyId: companyId
    }).toArray();

    await this.joinTransactions(wallets);

    return wallets;
  }

  /**
   * @param userId
   * @param companyId
   */
  async getAllByUserIdAndCompanyId(userId: string, companyId: string): Promise<Array<Wallet>> {
    this.logger.debug('Query all by user and company', userId, companyId);

    const wallets: Array<Wallet> = await (await this.mongoConnector.getDb()).collection('wallets').find({
      ownerId: userId,
      companyId: companyId
    }).toArray();

    await this.joinTransactions(wallets);

    return wallets;
  }

  private async joinTransactions(wallets: Array<Wallet>): Promise<void> {
    // join with trans
    if (wallets.length) {
      this.logger.verbose('Join with transactions...');
      let walletsAddressToIndex = {};
      wallets.forEach((w, i) => walletsAddressToIndex[w.currency + w.address] = i);

      const transactions: Array<Transaction> = await this.transactionRepository.getAllByWalletAddresses(wallets.map(w => w.address));

      this.logger.verbose('Transactions count', transactions.length);
      transactions.forEach(t => {
        let walletIndex = walletsAddressToIndex[t.currency + t.sender];
        let isSending = true;
        if (typeof walletIndex === 'undefined') {
          walletIndex = walletsAddressToIndex[t.currency + t.receiver];
          isSending = false;
        }

        if (typeof walletIndex === 'undefined') {
          return;
        }

        if (!wallets[walletIndex].transactions) {
          wallets[walletIndex].transactions = [];
        }

        t.amount = (isSending ? '-' : '') + t.amount;

        // hiding failed transactions for receiver
        if (!isSending && t.status !== 'success') {
          return;
        }

        wallets[walletIndex].transactions.push(t);
      });
    }
  }

  async getByAddress(address: string): Promise<Wallet> {
    return (await this.mongoConnector.getDb()).collection('wallets').findOne({
      address
    });
  }
}
