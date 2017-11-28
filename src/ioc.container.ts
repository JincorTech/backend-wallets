import { VerificationClient } from './services/verify.client';
import { WalletRepository, MongoWalletRepository } from './services/repositories/wallet.repository';
import { interfaces as InversifyInterfaces, Container } from 'inversify';
import { interfaces, TYPE } from 'inversify-express-utils';
import * as express from 'express';

import * as auths from './services/auth.service';
import * as validation from './middlewares/request.validation';
import { WalletController } from './controllers/wallet.controller';
import { TransactionController } from './controllers/transaction.controller';
import { TransactionRepository, MongoTransactionRepository } from './services/repositories/transaction.repository';
import { MongoDbConnector } from './services/repositories/mongodb.connector.service';
import { MailjetService } from './services/mailjet.service';
import { MailgunService } from './services/mailgun.service';

let container = new Container();

// services
container.bind<auths.AuthenticationService>('AuthMiddleware')
.toDynamicValue((context: InversifyInterfaces.Context): auths.AuthenticationService => {
  return new auths.CachedAuthenticationDecorator(
    context.container.resolve(auths.ExternalHttpJwtAuthenticationService)
  );
}).inSingletonScope();

if (process.env.MAIL_DRIVER === 'mailjet') {
  container.bind<EmailServiceInterface>('EmailService').to(MailjetService).inSingletonScope();
} else {
  container.bind<EmailServiceInterface>('EmailService').to(MailgunService).inSingletonScope();
}
container.bind<VerificationClient>('VerificationClient').to(VerificationClient).inSingletonScope();

container.bind<MongoDbConnector>('MongoDbConnector').to(MongoDbConnector).inSingletonScope();
container.bind<WalletRepository>('WalletRepository').to(MongoWalletRepository).inSingletonScope();
container.bind<TransactionRepository>('TransactionRepository').to(MongoTransactionRepository).inSingletonScope();

container.bind<express.RequestHandler>('TransactionInitiateRequestValidator').toConstantValue(
  (req: any, res: any, next: any) => validation.TransactionInitiateRequestValidator(req, res, next)
);
container.bind<express.RequestHandler>('TransactionVerifyRequestValidator').toConstantValue(
  (req: any, res: any, next: any) => validation.TransactionVerifyRequestValidator(req, res, next)
);

// controllers
container.bind<interfaces.Controller>(TYPE.Controller).to(WalletController).whenTargetNamed('Wallet');
container.bind<interfaces.Controller>(TYPE.Controller).to(TransactionController).whenTargetNamed('Transaction');

export { container };
