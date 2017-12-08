import { CompaniesClient } from './services/companies.client';
import { Web3Client } from './services/web3.client';
import { VerificationClient } from './services/verify.client';
import { WalletRepository, MongoWalletRepository } from './services/repositories/wallet.repository';
import { interfaces as InversifyInterfaces, Container } from 'inversify';
import { interfaces, TYPE } from 'inversify-express-utils';
import * as express from 'express';

import * as auths from './services/auth.service';
import * as validation from './middlewares/request.validation';
import { WalletController } from './controllers/wallet.controller';
import { TransactionController } from './controllers/transaction.controller';
import { MongoDbConnector } from './services/repositories/mongodb.connector.service';
import { MailjetService } from './services/mailjet.service';
import { MailgunService } from './services/mailgun.service';
import { ContractsClient } from './services/contracts.client';
import { AuthMiddleware, JwtThrottlingMiddleware } from './middlewares/common';
import { DummyMailService } from './services/dummymail.service.';
import { TransactionRepository, MongoTransactionRepository } from './services/repositories/transaction.repository';
import { PendingTransactionProcessor } from './services/transactions.service';
import { ContractsController } from './controllers/contracts.controller';
import { ContractsDeployer, ContractsDeployerInterface, ContractsDeployerType } from './services/contracts.deployer';
import { ContractRepository, MongoContractRepository } from './services/repositories/contract.repository';

let container = new Container();

// services
container.bind<auths.AuthenticationService>('AuthenticationService')
.toDynamicValue((context: InversifyInterfaces.Context): auths.AuthenticationService => {
  return new auths.CachedAuthenticationDecorator(
    context.container.resolve(auths.ExternalHttpJwtAuthenticationService)
  );
}).inSingletonScope();

switch (process.env.MAIL_DRIVER) {
  case 'mailjet':
    container.bind<EmailServiceInterface>('EmailService').to(MailjetService).inSingletonScope();
    break;
  case 'mailgun':
    container.bind<EmailServiceInterface>('EmailService').to(MailgunService).inSingletonScope();
    break;
  default:
    container.bind<EmailServiceInterface>('EmailService').to(DummyMailService).inSingletonScope();
}

container.bind<VerificationClient>('VerificationClient').to(VerificationClient).inSingletonScope();
container.bind<Web3Client>('Web3Client').to(Web3Client).inSingletonScope();
container.bind<ContractsClient>('ContractsClient').to(ContractsClient).inSingletonScope();
container.bind<MongoDbConnector>('MongoDbConnector').to(MongoDbConnector).inSingletonScope();
container.bind<WalletRepository>('WalletRepository').to(MongoWalletRepository).inSingletonScope();
container.bind<TransactionRepository>('TransactionRepository').to(MongoTransactionRepository).inSingletonScope();
container.bind<ContractRepository>('ContractRepository').to(MongoContractRepository).inSingletonScope();
container.bind<CompaniesClient>('CompaniesClient').to(CompaniesClient).inSingletonScope();
container.bind<PendingTransactionProcessor>('PendingTransactionProcessor').to(PendingTransactionProcessor).inSingletonScope();

container.bind<AuthMiddleware>('AuthMiddleware').to(AuthMiddleware);
container.bind<JwtThrottlingMiddleware>('JwtThrottlingMiddleware').to(JwtThrottlingMiddleware);

container.bind<ContractsDeployerInterface>(ContractsDeployerType).to(ContractsDeployer).inSingletonScope();

container.bind<express.RequestHandler>('TransactionInitiateRequestValidator').toConstantValue(
  (req: any, res: any, next: any) => validation.TransactionInitiateRequestValidator(req, res, next)
);
container.bind<express.RequestHandler>('TransactionVerifyRequestValidator').toConstantValue(
  (req: any, res: any, next: any) => validation.TransactionVerifyRequestValidator(req, res, next)
);
container.bind<express.RequestHandler>('WalletRegisterRequestValidator').toConstantValue(
  (req: any, res: any, next: any) => validation.WalletRegisterRequestValidator(req, res, next)
);
container.bind<express.RequestHandler>('EmploymentScDeployValidator').toConstantValue(
  (req: any, res: any, next: any) => validation.EmploymentScDeployValidator(req, res, next)
);

// controllers
container.bind<interfaces.Controller>(TYPE.Controller).to(WalletController).whenTargetNamed('Wallet');
container.bind<interfaces.Controller>(TYPE.Controller).to(TransactionController).whenTargetNamed('Transaction');
container.bind<interfaces.Controller>(TYPE.Controller).to(ContractsController).whenTargetNamed('Contracts');

export { container };
