import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { interfaces, controller, httpGet, httpPost } from 'inversify-express-utils';
import 'reflect-metadata';

import { ContractsClient } from '../services/contracts.client';
import { Web3Client } from '../services/web3.client';
import { VerificationClient, EMAIL_VERIFICATION } from '../services/verify.client';
import { Transaction } from '../entities/transaction';
import initVerificationEmail from '../emails/init_verification';
import successTransactionEmail from '../emails/success';
import { Wallet } from '../entities/wallet';
import { responseAsUnbehaviorError } from '../helpers/responses';
import { AuthenticatedRequest } from '../interfaces';
import { WalletRepository } from '../services/repositories/wallet.repository';
import * as lodash from 'lodash';
import { TransactionRepository } from '../services/repositories/transaction.repository';

/**
 * Transaction resource
 */
@controller(
  '/tx',
  'AuthMiddleware'
)
export class TransactionController implements interfaces.Controller {
  constructor(
    @inject('Web3Client') private web3: Web3Client,
    @inject('EmailService') private emailService: EmailServiceInterface,
    @inject('WalletRepository') private walletRepository: WalletRepository,
    @inject('TransactionRepository') private transactionRepository: TransactionRepository,
    @inject('ContractsClient') private contracts: ContractsClient,
    @inject('VerificationClient') private verificationClient: VerificationClient
  ) {
  }

  @httpPost(
    '',
    'TransactionInitiateRequestValidator'
  )
  async initiateTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [companyId, userId] = req.user.login.split(':');

      const verifyResponse = await this.verificationClient.initiateVerification(EMAIL_VERIFICATION, {
        /* google_auth
          {
            consumer: userId,
            issuer: 'Jincor',
            policy: {
              expiredOn: '01:00:00'
            }
          }
        */
        consumer: userId,
        issuer: 'Jincor',
        template: {
          fromEmail: 'support@jincor.com',
          subject: 'Here’s the Code to Verify your Beta.Jincor.com transaction',
          body: initVerificationEmail('body')
        },
        generateCode: {
          length: 6,
          symbolSet: ['DIGITS']
        },
        policy: {
          expiredOn: '24:00:00'
        }
      });

      let wallet: Wallet;
      if (req.user.scope === 'company-admin') {
        wallet = (await this.walletRepository.getAllCorparateByCompanyId(companyId))
          .filter(w => w.currency === req.body.currency).pop();
      } else {
        wallet = (await this.walletRepository.getAllByUserIdAndCompanyId(userId, companyId))
          .filter(w => w.currency === req.body.currency).pop();
      }

      if (!wallet) {
        throw new Error('Wallet not found, please register wallet first');
      }

      this.transactionRepository.save({
        id: '',
        walletAddress: wallet.address,
        login: req.user.login,
        status: 'unconfirmed',
        details: '',
        amount: req.body.amount,
        currency: req.body.currency,
        date: ~~(+new Date() / 1000),

        verificationId: verifyResponse.verificationId,
        verificationExpiredAt: verifyResponse.expiredOn,
        verificationMethod: 'email'
      });

      await this.walletRepository.save(wallet);

      res.json({
        verification: {
          verificationId: verifyResponse.verificationId,
          expiredOn: verifyResponse.expiredOn,
          status: 200,
          method: 'email'
        }
      });
    } catch (error) {
      responseAsUnbehaviorError(res, error);
    }
  }

  @httpPost(
    '/verify',
    'TransactionVerifyRequestValidator'
  )
  async verifyTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [companyId, userId] = req.user.login.split(':');

      let wallet: Wallet;

      if (req.user.scope === 'company-admin') {
        wallet = (await this.walletRepository.getAllCorparateByCompanyId(companyId))
          .filter(w => w.currency === req.body.currency).pop();
      } else {
        wallet = (await this.walletRepository.getAllByUserIdAndCompanyId(userId, companyId))
          .filter(w => w.currency === req.body.currency).pop();
      }

      if (!wallet) {
        throw new Error('Wallet not found, please register wallet first');
      }

      const verification = req.body.verification;

      const transaction = await this.transactionRepository.getByVerificationId(verification.verificationId);

      if (!transaction || transaction.status !== 'unconfirmed' || transaction.login !== req.user.login) {
        throw new Error('Transaction not found');
      }

      const verificationResult = await this.verificationClient.validateVerification('email', verification.verificationId, {
        code: verification.code
      });

      transaction.status = 'pending';

      try {
        let transactionId = '';
        if (req.body.currency === 'JCR') {
          const hlfTransaction = await this.contracts.transferJcrToken(req.token, req.body.receiver, req.body.amount);
          transaction.id = hlfTransaction.transaction;
        } else {
          const ethTransaction = await this.web3.sendTransactionByMnemonic({
            from: req.body.sender,
            to: req.body.receiver,
            amount: req.body.amount,
            gas: 2000,
            gasPrice: '1'
          }, wallet.mnemonics, wallet.salt);
          transaction.id = ethTransaction;
        }
      } catch (error) {
        transaction.status = 'error';
        transaction.details = error.message;
      }

      await this.transactionRepository.save(transaction);

      res.json({
        transactionHash: '0x' + transaction.id,
        status: transaction.status
      });
    } catch (error) {
      responseAsUnbehaviorError(res, error);
    }
  }
}
