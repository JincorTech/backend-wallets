import * as lodash from 'lodash';
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { interfaces, controller, httpGet, httpPost } from 'inversify-express-utils';
import 'reflect-metadata';

import { responseAsUnbehaviorError } from '../helpers/responses';
import { WalletRepository } from '../services/repositories/wallet.repository';
import { AuthenticatedRequest } from '../interfaces';

/**
 * Wallet resource
 */
@controller(
  '/wallets',
  'AuthMiddleware'
)
export class WalletController implements interfaces.Controller {
  constructor(
    @inject('WalletRepository') private walletRepository: WalletRepository
  ) {
  }

  @httpGet(
    ''
  )
  async listAllWallets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [companyId, userId] = req.user.login.split(':');
      const wallets = await this.walletRepository.getAllByUserIdAndCompanyId(userId, companyId);
      res.json(wallets.map(w => {
        return {
          type: w.type,
          address: w.address,
          balance: +w.balance,
          currrency: w.currency,
          created_at: w.createdAt,
          transactions: w.transactions.filter(t => t.status !== 'unconfirmed').map(t => {
            return {
              id: t.id,
              employee: t.employee,
              status: t.status,
              amount: t.amount,
              currency: t.currency,
              date: t.date
            };
          })
        };
      }));
    } catch (error) {
      responseAsUnbehaviorError(res, error);
    }
  }

  @httpPost(
    '',
    'WalletRegisterRequestValidator'
  )
  async registerWallets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [companyId, userId] = req.params.login;

      res.json({});
    } catch (error) {
      responseAsUnbehaviorError(res, error);
    }
  }
}
