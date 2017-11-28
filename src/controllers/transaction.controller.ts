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
    @inject('Web3Client') private web3: Web3Client,
    @inject('ContractsClient') private contracts: ContractsClient,
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
      transaction.amount = req.body.amount;
      transaction.currency = req.body.currency;
      // transaction.employee = req.body.employee;
      transaction.id = '';
      transaction.status = 'unconfirmed';
      transaction.date = ~~(+new Date() / 1000);

      /* {
        consumer: userId,
        issuer: 'Jincor',
        policy: {
          expiredOn: '01:00:00'
        } */
      const verifyResponse = await this.verificationClient.initiateVerification(EMAIL_VERIFICATION, {
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

      transaction.verificationMethod = 'email';
      transaction.verificationExpiredAt = verifyResponse.expiredOn;
      transaction.verificationId = verifyResponse.verificationId;

      await this.transactionRepository.save(transaction, false);

      res.json({
        verification: {
          verificationId: verifyResponse.verificationId,
          expiredOn: verifyResponse.expiredOn,
          status: 200,
          method: transaction.verificationMethod
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

      const verification = req.body.verification;
      const transaction = await this.transactionRepository.getByVerificationId(verification.verificationId);

      if (!transaction && transaction.status !== 'unconfirmed') {
        // throw error
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
          }, '', '');
          transaction.id = ethTransaction;
        }
      } catch (error) {
        transaction.status = 'error';
        transaction.details = error.message;
      }

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
