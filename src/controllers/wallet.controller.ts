import { Web3Client } from '../services/web3.client';
import { ContractsClient } from '../services/contracts.client';
import * as lodash from 'lodash';
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { interfaces, controller, httpGet, httpPost } from 'inversify-express-utils';
import 'reflect-metadata';

import { responseAsUnbehaviorError } from '../helpers/responses';
import { Wallet } from '../entities/wallet';
import { WalletRepository } from '../services/repositories/wallet.repository';
import { AuthenticatedRequest } from '../interfaces';
import { CompaniesClient } from '../services/companies.client';

/**
 * Wallet resource
 */
@controller(
  '/wallets',
  'AuthMiddleware'
)
export class WalletController implements interfaces.Controller {
  constructor(
    @inject('Web3Client') private web3: Web3Client,
    @inject('CompaniesClient') private companies: CompaniesClient,
    @inject('ContractsClient') private contracts: ContractsClient,
    @inject('WalletRepository') private walletRepository: WalletRepository
  ) {
  }

  private transWallet(w: Wallet, employeeMap: any) {
    return {
      type: w.type,
      address: w.address,
      balance: +w.balance,
      currrency: w.currency,
      created_at: w.createdAt,
      transactions: w.transactions.filter(t => t.status !== 'unconfirmed').map(t => {
        return {
          id: t.id,
          employee: employeeMap[t.login],
          status: t.status,
          amount: t.amount,
          currency: t.currency,
          date: t.date
        };
      })
    };
  }

  private async getEmployeeMap(jwtToken: string, wallets: Array<Wallet>) {
    const logins = lodash.uniq(lodash.flatten(wallets.map(w => w.transactions)).map(t => t.login));
    return lodash.keyBy(await this.companies.queryEmployeesByLogins(jwtToken, logins), 'login');
  }

  @httpGet(
    ''
  )
  async listAllWallets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [companyId, userId] = req.user.login.split(':');
      const wallets = await this.walletRepository.getAllByUserIdAndCompanyId(userId, companyId);
      const employeeMap = await this.getEmployeeMap(req.token, wallets);
      res.json(wallets.map(w => this.transWallet(w, employeeMap)));
    } catch (error) {
      responseAsUnbehaviorError(res, error);
    }
  }

  @httpPost(
    '/:type',
    'WalletRegisterRequestValidator'
  )
  async registerEmployeeWallets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [companyId, userId] = req.user.login;

      const mnemonic = this.web3.generateMnemonic();
      const salt = this.web3.getSalt();

      const ethAccount = this.web3.getAccountByMnemonicAndSalt(mnemonic, salt);
      const hlfAccount = await this.contracts.registerUser(req.token, mnemonic);

      const walletEth = new Wallet();
      walletEth.address = ethAccount.address;
      walletEth.balance = '0';
      walletEth.ownerId = userId;
      walletEth.companyId = companyId;
      walletEth.type = req.params.type === 'corporate' ? 'corporate' : 'personal';
      walletEth.currency = 'ETH';
      walletEth.mnemonics = mnemonic;
      walletEth.salt = salt;
      walletEth.createdAt = +new Date();

      await this.walletRepository.save(walletEth);

      const walletJcr = new Wallet();
      Object.assign(walletJcr, walletEth);
      walletJcr.address = hlfAccount.address;
      walletJcr.currency = 'ETH';

      await this.walletRepository.save(walletJcr);

      res.json([walletEth, walletJcr].map(w => this.transWallet(w, {})));
    } catch (error) {
      responseAsUnbehaviorError(res, error);
    }
  }
}
