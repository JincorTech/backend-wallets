import * as express from 'express';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import 'reflect-metadata';
// tslint:disable-next-line:no-duplicate-imports
import { Response, Request, NextFunction, Application } from 'express';
import * as bodyParser from 'body-parser';
import { InversifyExpressServer } from 'inversify-express-utils';
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import { NOT_ACCEPTABLE } from 'http-status';

import handle from './middlewares/error.handler';
import config from './config';
import { Logger, newConsoleTransport } from './logger';
import { container } from './ioc.container';
import { PendingTransactionProcessor } from './services/transactions.service';

winston.configure({
  level: config.logging.level,
  transports: [newConsoleTransport()]
});

const serverLogger = Logger.getInstance('SERVER');
serverLogger.verbose('Configurating...');

export const app: Application = express();

app.disable('x-powered-by');
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  }
  const acceptHeader = req.header('Accept') || '';

  if (req.method !== 'OPTIONS' && acceptHeader !== 'application/json' && acceptHeader.indexOf('application/vnd.jincor+json;') !== 0) {
    return res.status(NOT_ACCEPTABLE).json({
      error: 'Unsupported "Accept" header'
    });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'deny');
  res.setHeader('Content-Security-Policy', 'default-src \'none\'');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, Origin, X-Requested-With, Content-Type, Accept');
  return next();
});

app.all('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'OPTIONS' && (
    !req.header('Content-Type') ||
    (req.header('Content-Type') !== 'application/json' && !req.header('Content-Type').includes('application/x-www-form-urlencoded'))
  )) {
    return res.status(406).json({
      error: 'Unsupported "Content-Type"'
    });
  }

  return next();
});

const defaultExpressLoggerConfig = {
  transports: [newConsoleTransport()],
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: true,
  ignoreRoute: (req, res) => false
};

app.use(expressWinston.logger(defaultExpressLoggerConfig));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

export const serverApp = (new InversifyExpressServer(container, null, null, app));

serverApp.setErrorConfig((app) => {
  app.use(expressWinston.errorLogger(defaultExpressLoggerConfig));

  // 404 handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).send({
      statusCode: 404,
      error: 'Route is not found'
    });
  });

  // exceptions handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => handle(err, req, res, next));
});

const server = serverApp.build();

if (!config.server.http && !config.server.https) {
  serverLogger.error('There is no configured HTTP(S) server');
  throw new Error('No servers configured');
}

if (!process.env.NO_WAIT_TRANSACTION) {
  const transactionProcessor = container.get<PendingTransactionProcessor>('PendingTransactionProcessor');
  transactionProcessor.connectContractsWs();
  transactionProcessor.connectEthereumBus();
}

/**
 * Create HTTP server.
 */
if (config.server.http) {
  serverLogger.verbose('Create HTTP server...');
  const httpServer = http.createServer(server);

  httpServer.listen(config.server.httpPort, config.server.httpIp);
  serverLogger.info('Listen HTTP on %s:%s', config.server.httpIp, config.server.httpPort);
}

/**
 * Create HTTPS server.
 */
if (config.server.https) {
  winston.log('verbose', 'Create HTTPS server...');
  const httpsOptions = {
    requestCert: config.server.httpsRequestClientCert,
    ca: fs.readFileSync(config.server.httpsCa),
    key: fs.readFileSync(config.server.httpsPrivKey),
    cert: fs.readFileSync(config.server.httpsPubKey)
  };
  const httpsServer = https.createServer(httpsOptions, server);

  httpsServer.listen(config.server.httpsPort, config.server.httpsIp);
  winston.log('info', 'Listen HTTPS on %s:%s', config.server.httpsIp, config.server.httpsPort);
}
