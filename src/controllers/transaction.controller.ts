import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { interfaces, controller, httpGet, httpPost } from 'inversify-express-utils';
import 'reflect-metadata';

import { VerificationClient, EMAIL_VERIFICATION } from '../services/verify.client';
import { Transaction } from '../entities/transaction';
import initVerificationEmail from '../emails/init_verification';
import successTransactionEmail from '../emails/success';
import { responseAsUnbehaviorError } from '../helpers/responses';
import { TransactionRepository } from '../services/repositories/transaction.repository';
import { AuthenticatedRequest } from '../interfaces';

/**
 * Transaction resource
 */
@controller(
  '/tx',
  'AuthMiddleware'
)
export class TransactionController implements interfaces.Controller {
  constructor(
    @inject('TransactionRepository') private transactionRepository: TransactionRepository,
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

      const transaction = new Transaction();
      transaction.amount = req.params.amount;
      transaction.currency = req.params.currency;
      // transaction.employee = req.params.employee;
      transaction.id = '';
      transaction.status = 'unconfirmed';
      transaction.date = ~~(+new Date() / 1000);

      /* {
        consumer: userId,
        issuer: 'Jincor',
        policy: {
          expiredOn: '01:00:00'
        } */
      this.verificationClient.initiateVerification(EMAIL_VERIFICATION, {
        consumer: userId,
        issuer: 'Jincor',
        template: {
          fromEmail: 'support@jincor.com',
          subject: 'Here’s the Code to Verify your Jincor.com transaction',
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

      transaction.verificationMethod = 'email';
      transaction.verificationExpiredAt = 0;
      transaction.verificationId = '';

      await this.transactionRepository.save(transaction, false);
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

      const transaction = await this.transactionRepository.getByVerificationId(req.params.verification.verificationId);

      // if (!transaction && transaction.status !== 'unconfirmed') { }

      transaction.status = 'pending';

      await this.transactionRepository.save(transaction, false);

      res.json({
        transactionHash: '0x' + transaction.id,
        status: transaction.status
      });
    } catch (error) {
      responseAsUnbehaviorError(res, error);
    }
  }
}
