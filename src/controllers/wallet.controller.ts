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
      created_at: ~~(w.createdAt / 1000),
      transactions: (w.transactions || []).filter(t => t.status !== 'unconfirmed').map(t => {
        return {
          id: t.id,
          employee: employeeMap[t.login],
          status: t.status,
          details: t.details,
          amount: t.amount,
          currency: t.currency,
          date: t.date
        };
      })
    };
  }

  private async getEmployeeMap(jwtToken: string, wallets: Array<Wallet>) {
    const logins = lodash.uniq(lodash.flatten(wallets.map(w => w.transactions)).filter(w => w).map(t => t.login));
    return lodash.keyBy(await this.companies.queryEmployeesByLogins(jwtToken, logins), 'id');
  }

  @httpGet(
    ''
  )
  async listAllWallets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [companyId, userId] = req.user.login.split(':');
      let wallets = await this.walletRepository.getAllByUserIdAndCompanyId(userId, companyId);
      const employeeMap = await this.getEmployeeMap(req.token, wallets);

      const isCorporate = req.params.type === 'corporate';
      if (isCorporate) {
        wallets = wallets.concat(await this.walletRepository.getAllCorparateByCompanyId(companyId));
      }

      let ethWallets = wallets.filter(w => w.currency === 'ETH');
      let jcrWallets = wallets.filter(w => w.currency === 'JCR');

      // get balances
      const [ethBalances, jcrBalances] = await Promise.all([
        Promise.all(ethWallets.map(w => this.web3.getEthBalance(w.address))),
        Promise.all(jcrWallets.map(w => this.contracts.getBalance(req.token, w.address)))
      ]);

      ethWallets.forEach((w, i) => {
        w.balance = ethBalances[i];
      });
      jcrWallets.forEach((w, i) => {
        w.balance = jcrBalances[i];
      });

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
      const [companyId, userId] = req.user.login.split(':');

      if (!companyId || !userId) {
        throw new Error('Invalid user login, format must be companyId:userEmail');
      }

      const isCorporate = req.params.type === 'corporate';

      let walletEth: Wallet;
      let walletJcr: Wallet;
      let wallets: Wallet[] = [];

      // check if was created
      if (isCorporate) {
        if (req.user.scope !== 'company-admin') {
          throw new Error('User isn\'t company admin');
        }
        wallets = await this.walletRepository.getAllCorparateByCompanyId(companyId);
        if (wallets.length && wallets.length !== 2) {
          throw new Error('Already exists, but damaged data');
        }
      } else {
        wallets = await this.walletRepository.getAllByUserIdAndCompanyId(userId, companyId);
        if (wallets.length && wallets.length !== 2) {
          throw new Error('Already exists, but damaged data');
        }
      }

      // create new
      if (!wallets.length) {
        const mnemonic = this.web3.generateMnemonic();
        const salt = this.web3.getSalt();

        const ethAccount = this.web3.getAccountByMnemonicAndSalt(mnemonic, salt);
        const hlfAccount = await this.contracts.registerUser(req.token,
          isCorporate ? companyId : req.user.login,
          mnemonic);

        walletEth = new Wallet();
        walletEth.transactions = [];
        walletEth.address = ethAccount.address;
        walletEth.balance = '0';
        walletEth.ownerId = isCorporate ? '' : userId;
        walletEth.companyId = companyId;
        walletEth.type = isCorporate ? 'corporate' : 'personal';
        walletEth.currency = 'ETH';
        walletEth.mnemonics = mnemonic;
        walletEth.salt = salt;
        walletEth.createdAt = +new Date();

        await this.walletRepository.save(walletEth);

        walletJcr = new Wallet();
        Object.assign(walletJcr, lodash.omit(walletEth, ['_id']));
        walletJcr.address = '0x' + hlfAccount.address;
        walletJcr.currency = 'JCR';

        await this.walletRepository.save(walletJcr);
      } else {
        walletEth = wallets.filter(w => w.currency === 'ETH').pop();
        walletJcr = wallets.filter(w => w.currency === 'JCR').pop();
      }

      res.json([walletEth, walletJcr].map(w => this.transWallet(w, {})));
    } catch (error) {
      responseAsUnbehaviorError(res, error);
    }
  }
}
