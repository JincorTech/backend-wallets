import * as dotenv from 'dotenv';

dotenv.config();

import * as request from 'web-request';

request.defaults({
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  throwResponseError: true
});

const {
  LOGGING_LEVEL,
  LOGGING_FORMAT,
  LOGGING_COLORIZE,

  HTTP,
  HTTP_PORT,
  HTTP_IP,

  HTTPS,
  HTTPS_PORT,
  HTTPS_IP,
  HTTPS_CA,
  HTTPS_PUB_KEY,
  HTTPS_PRIV_KEY,
  HTTPS_CLIENT_REQ,

  THROTTLER_WHITE_LIST,
  THROTTLER_INTERVAL,
  THROTTLER_MAX,
  THROTTLER_MIN_DIFF,

  MONGO_URL,
  ORM_ENTITIES_DIR,
  ORM_SUBSCRIBER_DIR,
  ORM_MIGRATIONS_DIR,

  API_URL,
  FRONTEND_URL,

  AUTH_VERIFY_URL,
  AUTH_ACCESS_JWT,
  AUTH_TIMEOUT,

  VERIFY_BASE_URL,
  VERIFY_TIMEOUT,

  WEB3_RESTORE_START_BLOCK
} = process.env;

export default {
  logging: {
    level: LOGGING_LEVEL,
    format: LOGGING_FORMAT,
    colorize: LOGGING_COLORIZE === 'true'
  },
  server: {
    http: HTTP === 'true',
    httpPort: parseInt(HTTP_PORT, 10) || 8080,
    httpIp: HTTP_IP || '0.0.0.0',

    https: HTTPS === 'true',
    httpsPort: parseInt(HTTPS_PORT, 10) || 8443,
    httpsIp: HTTPS_IP || '0.0.0.0',
    httpsCa: HTTPS_CA,
    httpsPubKey: HTTPS_PUB_KEY,
    httpsPrivKey: HTTPS_PRIV_KEY,
    httpsRequestClientCert: HTTPS_CLIENT_REQ === 'true',

    apiUrl: API_URL,
    frontendUrl: FRONTEND_URL
  },
  web3: {
    startBlock: WEB3_RESTORE_START_BLOCK || 1
  },
  contracts: {
    wsUrl: process.env.CONTRACTS_WS_URL,
    baseUrl: process.env.CONTRACTS_BASE_URL,
    peers: ['peer0.network.jincor.com','peer1.network.jincor.com'],
    network: 'jincormetanet',
    jincorToken: {
      address: '0001020304050607080900010203040506070809',
      abi: '[]'
    }
  },
  companies: {
    baseUrl: process.env.COMPANIES_BASE_URL || 'http://companies/api/v1'
  },
  throttler: {
    prefix: 'request_throttler_',
    interval: THROTTLER_INTERVAL || 1000, // time window in milliseconds
    maxInInterval: THROTTLER_MAX || 5, // max number of allowed requests from 1 IP in "interval" time window
    minDifference: THROTTLER_MIN_DIFF || 0, // optional, minimum time between 2 requests from 1 IP
    whiteList: THROTTLER_WHITE_LIST ? THROTTLER_WHITE_LIST.split(',') : [] // requests from these IPs won't be throttled
  },
  auth: {
    verifyUrl: AUTH_VERIFY_URL || 'http://auth:3000/auth/verify',
    accessJwt: AUTH_ACCESS_JWT,
    timeout: parseInt(AUTH_TIMEOUT, 10) || 10000
  },
  verify: {
    baseUrl: VERIFY_BASE_URL || 'http://verify:3000',
    accessJwt: AUTH_ACCESS_JWT,
    timeout: parseInt(VERIFY_TIMEOUT, 10) || 10000
  },
  ethRpc: {
    type: process.env.RPC_TYPE,
    address: process.env.RPC_ADDRESS,
    reconnectTimeout: 5000 // in milliseconds
  },
  email: {
    domain: 'jincor.com',
    mailgun: {
      secret: process.env.MAILGUN_API_KEY
    },
    mailjet: {
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_API_SECRET
    },
    from: {
      general: 'noreply@jincor.com',
      referral: 'partners@jincor.com'
    }
  },
  mongo: {
    url: MONGO_URL || 'mongodb://mongo:27017/wallets'
  }
};
