import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { controller, httpGet, httpPost } from 'inversify-express-utils';
import 'reflect-metadata';
import { AuthenticatedRequest } from '../interfaces';
import { CompanyAdminOnly } from '../exceptions/exceptions';
import { WalletRepository } from '../services/repositories/wallet.repository';
import { ContractsDeployerInterface, ContractsDeployerType } from '../services/contracts.deployer';

@controller('/contracts')
export class ContractsController {
  constructor(
    @inject(ContractsDeployerType) private deployer: ContractsDeployerInterface,
    @inject('WalletRepository') private walletRepository: WalletRepository
  ) { }

  @httpPost(
    '/',
    'AuthMiddleware',
    'JwtThrottlingMiddleware',
    'EmploymentScDeployValidator'
  )
  async deploy(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.user.scope !== 'company-admin') {
      throw new CompanyAdminOnly('Only company admin is allowed to perform this operation');
    }

    const splitted = req.user.login.split(':');
    const [companyId, userId] = [splitted[0], splitted.slice(1).join('')];

    let corporateWallet = (await this.walletRepository.getAllCorporateByCompanyId(companyId))
      .filter(w => w.currency === req.body.compensation.salaryAmount.currency).pop();

    if (!corporateWallet) {
      throw Error('Wallet not found, please register wallet first');
    }

    res.json({
      txHash: await this.deployer.deployEmploymentAgreement(req.body, corporateWallet)
    });
  }
}
