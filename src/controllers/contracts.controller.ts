import { Request, Response } from 'express';
import { inject } from 'inversify';
import { controller, httpGet, httpPost } from 'inversify-express-utils';
import 'reflect-metadata';
import { AuthenticatedRequest } from '../interfaces';
import { CompanyAdminOnly } from '../exceptions/exceptions';
import { WalletRepository } from '../services/repositories/wallet.repository';
import { ContractsDeployerInterface, ContractsDeployerType } from '../services/contracts.deployer';
import { EMAIL_VERIFICATION, VerificationClient } from '../services/verify.client';
import initVerificationEmail from '../emails/init_verification';
import { ContractRepository } from '../services/repositories/contract.repository';
import * as moment from 'moment';

@controller('/contracts')
export class ContractsController {
  constructor(
    @inject(ContractsDeployerType) private deployer: ContractsDeployerInterface,
    @inject('WalletRepository') private walletRepository: WalletRepository,
    @inject('VerificationClient') private verificationClient: VerificationClient,
    @inject('ContractRepository') private contractRepository: ContractRepository
  ) { }

  @httpPost(
    '/',
    'AuthMiddleware',
    'JwtThrottlingMiddleware',
    'EmploymentScCreateValidator'
  )
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.user.scope !== 'company-admin') {
      throw new CompanyAdminOnly('Only company admin is allowed to perform this operation');
    }

    const splitted = req.user.login.split(':');
    const [companyId, userId] = [splitted[0], splitted.slice(1).join('')];

    let corporateWallet = (await this.walletRepository.getAllCorporateByCompanyId(companyId))
      .filter((w) => w.address === req.body.wallets.employer).pop();

    if (!corporateWallet) {
      throw Error('Incorrect employer wallet address');
    }

    req.body.createdAt = moment().format('MM/DD/YYYY');
    req.body.signedAt = null;
    req.body.isSignedByEmployee = false;
    const id = (await this.contractRepository.save(req.body)).ops[0]._id;

    let ip = req.header('cf-connecting-ip') || req.ip;

    if (ip.substr(0, 7) === '::ffff:') {
      ip = ip.substr(7);
    }

    const verifyResponse = await this.verificationClient.initiateVerification(EMAIL_VERIFICATION, {
      consumer: userId,
      issuer: 'Jincor',
      template: {
        fromEmail: 'support@jincor.com',
        subject: 'Here’s the Code to Verify contract creation',
        body: initVerificationEmail(ip)
      },
      generateCode: {
        length: 6,
        symbolSet: ['DIGITS']
      },
      policy: {
        expiredOn: '24:00:00'
      },
      payload: {
        contractId: id
      }
    });

    res.json({
      status: 200,
      data: {
        contractId: id,
        verificationId: verifyResponse.verificationId,
        createdAt: req.body.createdAt
      }
    });
  }

  @httpPost(
    '/:contractId/actions/verify',
    'AuthMiddleware',
    'JwtThrottlingMiddleware',
    'VerificationRequiredValidator'
  )
  async verifyAndDeploy(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.user.scope !== 'company-admin') {
      throw new CompanyAdminOnly('Only company admin is allowed to perform this operation');
    }

    const splitted = req.user.login.split(':');
    const [companyId, userId] = [splitted[0], splitted.slice(1).join('')];

    await this.verificationClient.validateVerification(EMAIL_VERIFICATION, req.body.verificationId, {
      code: req.body.verificationCode
    });

    const contract = await this.contractRepository.findOneById(req.params.contractId);

    if (!contract) {
      throw Error('Contract is not found');
    }

    if (contract.txHash) {
      throw Error('Contract was already deployed');
    }

    let corporateWallet = (await this.walletRepository.getAllCorporateByCompanyId(companyId))
      .filter((w) => w.address === contract.wallets.employer).pop();

    if (!corporateWallet) {
      throw Error('Incorrect employer wallet address');
    }

    contract.txHash = await this.deployer.deployEmploymentAgreement(contract, corporateWallet);
    await this.contractRepository.save(contract);

    res.json({
      status: 200,
      data: {
        contractId: contract._id,
        employeeId: contract.employeeId,
        signedAt: moment().format('MM/DD/YYYY')
      }
    });
  }

  @httpGet(
    '/:contractId',
    'AuthMiddleware',
    'JwtThrottlingMiddleware'
  )
  async getContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    let wallets;
    let contract;

    const splitted = req.user.login.split(':');
    const [companyId, userId] = [splitted[0], splitted.slice(1).join('')];

    if (req.user.scope === 'company-admin') {
      wallets = (await this.walletRepository.getAllCorporateByCompanyId(companyId)).map((item) => {
        return item.address;
      });
      contract = await this.contractRepository.getByIdAndEmployerWallets(req.params.contractId, wallets);
    } else {
      wallets = (await this.walletRepository.getAllByUserIdAndCompanyId(userId, companyId)).map((item) => {
        return item.address;
      });
      contract = await this.contractRepository.getByIdAndEmployeeWallets(req.params.contractId, wallets);
    }

    if (!contract) {
      throw Error('Contract is not found');
    }

    res.json({
      status: 200,
      data: contract
    });
  }

  @httpGet(
    '/',
    'AuthMiddleware',
    'JwtThrottlingMiddleware'
  )
  async getAllContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
    let wallets;
    let contracts;

    const splitted = req.user.login.split(':');
    const [companyId, userId] = [splitted[0], splitted.slice(1).join('')];

    if (req.user.scope === 'company-admin') {
      wallets = (await this.walletRepository.getAllCorporateByCompanyId(companyId)).map((item) => {
        return item.address;
      });
      contracts = await this.contractRepository.getByEmployerAddresses(wallets);
    } else {
      wallets = (await this.walletRepository.getAllByUserIdAndCompanyId(userId, companyId)).map((item) => {
        return item.address;
      });
      contracts = await this.contractRepository.getByEmployeeAddresses(wallets);
    }

    res.json({
      status: 200,
      data: contracts.map((item) => {
        return {
          contractId: item._id,
          employeeId: item.employeeId,
          createdAt: item.createdAt,
          signedAt: item.signedAt
        };
      })
    });
  }

  @httpPost(
    '/:contractId/actions/sign/initiate',
    'AuthMiddleware',
    'JwtThrottlingMiddleware'
  )
  async initiateSign(req: AuthenticatedRequest, res: Response): Promise<void> {
    const splitted = req.user.login.split(':');
    const [companyId, userId] = [splitted[0], splitted.slice(1).join('')];
    const wallets = (await this.walletRepository.getAllByUserIdAndCompanyId(userId, companyId)).map((item) => {
      return item.address;
    });

    const contract = await this.contractRepository.getByIdAndEmployeeWallets(req.params.contractId, wallets);

    if (!contract) {
      throw Error('Contract is not found');
    }

    let ip = req.header('cf-connecting-ip') || req.ip;

    if (ip.substr(0, 7) === '::ffff:') {
      ip = ip.substr(7);
    }

    const verifyResponse = await this.verificationClient.initiateVerification(EMAIL_VERIFICATION, {
      consumer: userId,
      issuer: 'Jincor',
      template: {
        fromEmail: 'support@jincor.com',
        subject: 'Here’s the Code to sign contract',
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

    res.json({
      status: 200,
      data: {
        contractId: contract._id,
        verificationId: verifyResponse.verificationId,
        employeeId: contract.employeeId
      }
    });
  }

  @httpPost(
    '/:contractId/actions/sign/verify',
    'AuthMiddleware',
    'JwtThrottlingMiddleware',
    'VerificationRequiredValidator'
  )
  async verifyAndSign(req: AuthenticatedRequest, res: Response): Promise<void> {
    const splitted = req.user.login.split(':');
    const [companyId, userId] = [splitted[0], splitted.slice(1).join('')];
    const wallets = await this.walletRepository.getAllByUserIdAndCompanyId(userId, companyId);

    const addresses = wallets.map((item) => {
      return item.address;
    });
    const contract = await this.contractRepository.getByIdAndEmployeeWallets(req.params.contractId, addresses);

    if (!contract) {
      throw Error('Contract is not found');
    }

    if (!contract.contractAddress) {
      throw Error('Contract is not deployed yet');
    }

    await this.verificationClient.validateVerification(EMAIL_VERIFICATION, req.body.verificationId, {
      code: req.body.verificationCode
    });

    const walletToSign = wallets.filter((item) => {
      return item.address === contract.wallets.employee;
    }).pop();

    res.json({
      status: 200,
      data: {
        contractId: contract._id,
        employeeId: contract.employeeId,
        txHash: await this.deployer.signEmploymentAgreement(contract, walletToSign)
      }
    });
  }
}
