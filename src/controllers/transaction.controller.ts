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
  'AuthMiddleware',
  'JwtThrottlingMiddleware'
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
      let ip = req.header('cf-connecting-ip') || req.ip;

      if (ip.substr(0, 7) === '::ffff:') {
        ip = ip.substr(7);
      }

      const splitted = req.user.login.split(':');
      const [companyId, userId] = [splitted[0], splitted.slice(1).join('')];

      req.body.sender = req.body.sender.toLowerCase();
      req.body.receiver = req.body.receiver.toLowerCase();

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
          body: initVerificationEmail(ip)
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
      let corporateWallet: Wallet;
      let personalWallet: Wallet;

      if (req.user.scope === 'company-admin') {
        corporateWallet = (await this.walletRepository.getAllCorporateByCompanyId(companyId))
          .filter(w => w.currency === req.body.currency).pop();
      }
      wallet = (await this.walletRepository.getAllByUserIdAndCompanyId(userId, companyId))
        .filter(w => w.currency === req.body.currency).pop();

      if (corporateWallet && corporateWallet.address === req.body.sender) {
        wallet = corporateWallet;
      }

      if (!wallet) {
        throw new Error('Wallet not found, please register wallet first');
      }

      this.transactionRepository.save({
        id: '',
        sender: wallet.address,
        login: req.user.login,
        status: 'unconfirmed',
        details: '',
        receiver: req.body.receiver,
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
      const splitted = req.user.login.split(':');
      const [companyId, userId] = [splitted[0], splitted.slice(1).join('')];

      const verification = req.body.verification;

      const transaction = await this.transactionRepository.getByVerificationId(verification.verificationId);

      if (!transaction || transaction.status !== 'unconfirmed' || transaction.login !== req.user.login) {
        throw new Error('Transaction not found');
      }

      let wallet: Wallet;
      let corporateWallet: Wallet;
      let personalWallet: Wallet;

      if (req.user.scope === 'company-admin') {
        corporateWallet = (await this.walletRepository.getAllCorporateByCompanyId(companyId))
          .filter(w => w.currency === transaction.currency).pop();
      }
      wallet = (await this.walletRepository.getAllByUserIdAndCompanyId(userId, companyId))
        .filter(w => w.currency === transaction.currency).pop();

      let isCorporate = false;
      if (corporateWallet && corporateWallet.address === transaction.sender) {
        isCorporate = true;
        wallet = corporateWallet;
      }

      if (!wallet) {
        throw new Error('Wallet not found, please register wallet first');
      }

      const verificationResult = await this.verificationClient.validateVerification('email', verification.verificationId, {
        code: verification.code
      });

      transaction.status = 'pending';

      try {
        if (transaction.currency === 'JCR') {
          const hlfTransaction = await this.contracts.transferJcrToken(req.token, isCorporate, transaction.receiver, transaction.amount);
          transaction.id = '0x' + hlfTransaction.result.transaction;
        } else {
          transaction.id = await this.web3.sendTransactionByMnemonic({
            from: wallet.address,
            to: transaction.receiver,
            amount: '' + transaction.amount,
            gas: 40000,
            gasPrice: '21'
          }, wallet.mnemonics, wallet.salt);
        }
      } catch (error) {
        transaction.status = 'failure';
        transaction.details = error.message;
      }

      await this.transactionRepository.save(transaction);

      res.json({
        transactionHash: transaction.id || '',
        status: transaction.status,
        details: transaction.details
      });
    } catch (error) {
      responseAsUnbehaviorError(res, error);
    }
  }
}
