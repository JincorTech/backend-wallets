import { WorkQueue } from '../services/work.queue';
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
import { requestDataThroughCache } from '../helpers/helpers';

/**
 * Wallet resource
 */
@controller(
  '/wallets',
  'AuthMiddleware',
  'JwtThrottlingMiddleware'
)
export class WalletController implements interfaces.Controller {
  private sendEthTestCoins = new WorkQueue('WALLET_SEND_TEST_COINS_ETH');
  private sendJcrTestCoins = new WorkQueue('WALLET_SEND_TEST_COINS_JCR');

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
        const employee = employeeMap[t.login] || { profile: {} };
        return {
          id: t.id,
          employee: {
            id: employee.id,
            'wallet': t.sender,
            'firstName': employee.profile.firstName,
            'lastName': employee.profile.lastName,
            'avatar': employee.profile.avatar
          },
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
    return this.companies.queryEmployeesByLogins(jwtToken, logins);
  }

  @httpGet(
    ''
  )
  async listAllWallets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const splitted = req.user.login.split(':');
      const [companyId, userId] = [splitted[0], splitted.slice(1).join('')];

      let wallets = await this.walletRepository.getAllByUserIdAndCompanyId(userId, companyId);

      const isCorporate = req.user.scope === 'company-admin';
      if (isCorporate) {
        wallets = wallets.concat(await this.walletRepository.getAllCorparateByCompanyId(companyId));
      }

      const employeeMap = await this.getEmployeeMap(req.token, wallets);

      let ethWallets = wallets.filter(w => w.currency === 'ETH');
      let jcrWallets = wallets.filter(w => w.currency === 'JCR');

      // get balances
      const [ethBalances, jcrBalances] = await Promise.all([
        Promise.all(ethWallets.map(w => requestDataThroughCache('balances', 4000, 4096, 'ETH' + w.address, () => this.web3.getEthBalance(w.address)))),
        Promise.all(jcrWallets.map(w => requestDataThroughCache('balances', 4000, 4096, 'JCR' + w.address, () => this.contracts.getBalance(req.token, w.type === 'corporate', w.address))))
      ]);

      ethWallets.forEach((w, i) => {
        w.balance = ethBalances[i];
        this.walletRepository.save(w).then((data) => data, (error) => error); // its too dirty
      });

      jcrWallets.forEach((w, i) => {
        w.balance = jcrBalances[i];
        this.walletRepository.save(w).then((data) => data, (error) => error); // its too dirty
      });

      res.json(wallets.map(w => this.transWallet(w, employeeMap)));
    } catch (error) {
      console.log('Error occurred', error);
      responseAsUnbehaviorError(res, error);
    }
  }

  @httpPost(
    '/:type',
    'WalletRegisterRequestValidator'
  )
  async registerEmployeeWallets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const splitted = req.user.login.split(':');
      const [companyId, userId] = [splitted[0], splitted.slice(1).join('')];

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
        walletEth = new Wallet();
        walletEth.transactions = [];
        walletEth.balance = '0';
        walletEth.ownerId = isCorporate ? '' : userId;
        walletEth.companyId = companyId;
        walletEth.type = isCorporate ? 'corporate' : 'personal';
        walletEth.currency = 'ETH';
        walletEth.createdAt = +new Date();

        walletJcr = new Wallet();
        Object.assign(walletJcr, lodash.omit(walletEth, ['_id']));
        walletJcr.currency = 'JCR';

        const [walletEthId, walletJcrId] = await Promise.all([
          this.walletRepository.save(walletEth),
          this.walletRepository.save(walletJcr)
        ]);

        const mnemonic = this.web3.generateMnemonic();
        const salt = this.web3.getSalt();

        const ethAccount = this.web3.getAccountByMnemonicAndSalt(mnemonic, salt);

        walletEth.address = ethAccount.address.toLowerCase();
        walletEth.mnemonics = mnemonic;
        walletEth.salt = salt;

        const hlfAccount = await this.contracts.registerUser(req.token,
          req.user.login, mnemonic, isCorporate);

        walletJcr.mnemonics = mnemonic;
        walletJcr.salt = salt;
        walletJcr.address = '0x' + hlfAccount.address.toLowerCase();

        walletEth._id = walletEthId;
        walletJcr._id = walletJcrId;

        await Promise.all([
          this.walletRepository.save(walletEth),
          this.walletRepository.save(walletJcr)
        ]);

        this.sendEthTestCoins.publish({ id: walletEth._id.toHexString(), data: walletEth });
        this.sendJcrTestCoins.publish({ id: walletJcr._id.toHexString(), data: walletJcr });
      } else {
        walletEth = wallets.filter(w => w.currency === 'ETH').pop();
        walletJcr = wallets.filter(w => w.currency === 'JCR').pop();
      }

      res.json([walletEth, walletJcr].map(w => this.transWallet(w, {})));
    } catch (error) {
      console.log('Error occurred', error);
      responseAsUnbehaviorError(res, error);
    }
  }
}
