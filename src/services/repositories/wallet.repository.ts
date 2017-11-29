import { injectable, inject } from 'inversify';

import { Logger } from '../../logger';
import { MongoDbConnector } from './mongodb.connector.service';
import { Wallet } from '../../entities/wallet';
import { Transaction } from '../../entities/transaction';
import { TransactionRepository } from './transaction.repository';

export interface WalletRepository {
  save(wallet: Wallet & {_id?: any}): Promise<number>;
  getAllCorparateByCompanyId(companyId: string): Promise<Array<Wallet>>;
  getAllByUserIdAndCompanyId(userId: string, companyId: string): Promise<Array<Wallet>>;
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
  async save(wallet: Wallet): Promise<number> {
    this.logger.debug('Save', wallet);

    const storeTrans = wallet.transactions;
    delete wallet.transactions;
    const result = (await (await this.mongoConnector.getDb()).collection('wallets').save(wallet));
    wallet.transactions = storeTrans;

    return result.result.ok;
  }

  /**
   * @param userId
   * @param companyId
   */
  async getAllCorparateByCompanyId(companyId: string): Promise<Array<Wallet>> {
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

  private async joinTransactions(wallets: Array<Wallet>) {
    // join with trans
    if (wallets.length) {
      this.logger.verbose('Join with transactions...');
      let walletsAddressToIndex = {};
      wallets.forEach((w, i) => walletsAddressToIndex[w.address] = i);

      const transactions: Array<Transaction> = await this.transactionRepository.getAllByWalletAddresses(wallets.map(w => w.address));
      this.logger.verbose('Transactions count', transactions.length);
      transactions.forEach(t => {
        const walletIndex = walletsAddressToIndex[t.walletAddress];
        if (!wallets[walletIndex].transactions) {
          wallets[walletIndex].transactions = [];
        }
        wallets[walletIndex].transactions.push(t);
      });
    }
  }
}
