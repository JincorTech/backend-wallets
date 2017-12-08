import * as dotenv from 'dotenv';

dotenv.config();

import * as request from 'web-request';
import * as fs from 'fs';

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

  REDIS_URL,

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
  redis: {
    url: REDIS_URL
  },
  web3: {
    startBlock: WEB3_RESTORE_START_BLOCK || 1
  },
  contracts: {
    wsUrl: process.env.CONTRACTS_WS_URL,
    baseUrl: process.env.CONTRACTS_BASE_URL,
    maintainUser: process.env.CONTRACTS_MAINTAIN_USER,
    peers: ['peer0.network.jincor.com','peer1.network.jincor.com'],
    network: 'jincormetanet',
    jincorToken: {
      address: process.env.CONTRACTS_JCR_ADDRESS,
      abi: fs.readFileSync(process.env.CONTRACTS_JCR_ABI_PATH).toString()
    },
    employmentAgreement: {
      abi: [{ 'constant': true,'inputs': [],'name': 'startDate','outputs': [{ 'name': '','type': 'uint256' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': false,'inputs': [],'name': 'sign','outputs': [],'payable': false,'stateMutability': 'nonpayable','type': 'function' },{ 'constant': true,'inputs': [],'name': 'startCompensation','outputs': [{ 'name': '','type': 'uint256' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': true,'inputs': [],'name': 'signedByEmployee','outputs': [{ 'name': '','type': 'bool' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': false,'inputs': [],'name': 'withdraw','outputs': [],'payable': false,'stateMutability': 'nonpayable','type': 'function' },{ 'constant': true,'inputs': [],'name': 'compensation','outputs': [{ 'name': '','type': 'uint256' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': true,'inputs': [],'name': 'contractDate','outputs': [{ 'name': '','type': 'uint256' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': false,'inputs': [],'name': 'halt','outputs': [],'payable': false,'stateMutability': 'nonpayable','type': 'function' },{ 'constant': true,'inputs': [],'name': 'collected','outputs': [{ 'name': '','type': 'uint256' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': true,'inputs': [],'name': 'contractPeriod','outputs': [{ 'name': '','type': 'uint8' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': true,'inputs': [],'name': 'owner','outputs': [{ 'name': '','type': 'address' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': true,'inputs': [],'name': 'employee','outputs': [{ 'name': '','type': 'address' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': true,'inputs': [],'name': 'employer','outputs': [{ 'name': '','type': 'address' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': true,'inputs': [],'name': 'signedByEmployer','outputs': [{ 'name': '','type': 'bool' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': true,'inputs': [],'name': 'halted','outputs': [{ 'name': '','type': 'bool' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': true,'inputs': [],'name': 'endDate','outputs': [{ 'name': '','type': 'uint256' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': true,'inputs': [{ 'name': '','type': 'address' }],'name': 'signatures','outputs': [{ 'name': '','type': 'bool' }],'payable': false,'stateMutability': 'view','type': 'function' },{ 'constant': false,'inputs': [],'name': 'unhalt','outputs': [],'payable': false,'stateMutability': 'nonpayable','type': 'function' },{ 'constant': false,'inputs': [{ 'name': 'newOwner','type': 'address' }],'name': 'transferOwnership','outputs': [],'payable': false,'stateMutability': 'nonpayable','type': 'function' },{ 'inputs': [{ 'name': 'date','type': 'uint256' },{ 'name': '_employee','type': 'address' },{ 'name': 'period','type': 'uint8' },{ 'name': 'start','type': 'uint256' },{ 'name': 'end','type': 'uint256' },{ 'name': '_startCompensation','type': 'uint256' },{ 'name': '_compensation','type': 'uint256' }],'payable': false,'stateMutability': 'nonpayable','type': 'constructor' },{ 'payable': true,'stateMutability': 'payable','type': 'fallback' }],
      byteCode: '0x60606040526000805460a060020a60ff0219169055341561001f57600080fd5b60405160e0806108298339810160405280805191906020018051919060200180519190602001805191906020018051919060200180519190602001805160008054600160a060020a03191633600160a060020a0316179055915050600160ff8616111561008b57600080fd5b60045482101561009a57600080fd5b600882905560ff851660018111156100ae57fe5b6003805460a060020a60ff021916740100000000000000000000000000000000000000008360018111156100de57fe5b0217905550600196875560028054600160a060020a03338116600160a060020a03199283168117909355600380549990911698909116979097179096556000958652600960205260408620805460ff19169097179096555060049190915560055550600791909155600a556106d1806101586000396000f3006060604052600436106101065763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416630b97bc86811461022c5780632ca15122146102515780632f9d443914610266578063399db8e9146102795780633ccfd60b146102a057806340d5ff58146102b35780634e83d9e9146102c65780635ed7ca5b146102d957806384bcefd4146102ec5780638862cca1146102ff5780638da5cb5b14610336578063a0a1a7d714610365578063ae200e7914610378578063b146e1291461038b578063b9b8af0b1461039e578063c24a0f8b146103b1578063c792f36d146103c4578063cb3e64fd146103e3578063f2fde38b146103f6575b42806008541115151561011857600080fd5b60045481101561012757600080fd5b600654811161013557600080fd5b6006541561015657600654601e906201518090830304101561015657600080fd5b600254600160a060020a031660009081526009602052604090205460ff16151560011461017f57fe5b600354600160a060020a031660009081526009602052604090205460ff1615156001146101a857fe5b6007543410156101b757600080fd5b426006556007543411156101f0576101ec6101dd6007543461041590919063ffffffff16565b600a549063ffffffff61042716565b600a555b600354600754600160a060020a039091169080156108fc0290604051600060405180830381858888f19350505050151561022957600080fd5b50005b341561023757600080fd5b61023f61043d565b60405190815260200160405180910390f35b341561025c57600080fd5b610264610443565b005b341561027157600080fd5b61023f610483565b341561028457600080fd5b61028c610489565b604051901515815260200160405180910390f35b34156102ab57600080fd5b6102646104aa565b34156102be57600080fd5b61023f610508565b34156102d157600080fd5b61023f61050e565b34156102e457600080fd5b610264610514565b34156102f757600080fd5b61023f61056c565b341561030a57600080fd5b610312610572565b6040518082600181111561032257fe5b60ff16815260200191505060405180910390f35b341561034157600080fd5b610349610582565b604051600160a060020a03909116815260200160405180910390f35b341561037057600080fd5b610349610591565b341561038357600080fd5b6103496105a0565b341561039657600080fd5b61028c6105af565b34156103a957600080fd5b61028c6105d0565b34156103bc57600080fd5b61023f6105e0565b34156103cf57600080fd5b61028c600160a060020a03600435166105e6565b34156103ee57600080fd5b6102646105fb565b341561040157600080fd5b610264600160a060020a036004351661064e565b60008282111561042157fe5b50900390565b60008282018381101561043657fe5b9392505050565b60045481565b60035433600160a060020a0390811691161461045e57600080fd5b600160a060020a0333166000908152600960205260409020805460ff19166001179055565b60085481565b600354600160a060020a031660009081526009602052604090205460ff1690565b60025460009033600160a060020a039081169116146104c857600080fd5b50600a80546000909155600254600160a060020a031681156108fc0282604051600060405180830381858888f19350505050151561050557600080fd5b50565b60075481565b60015481565b60005433600160a060020a0390811691161461052f57600080fd5b60005460a060020a900460ff161561054657600080fd5b6000805474ff0000000000000000000000000000000000000000191660a060020a179055565b600a5481565b60035460a060020a900460ff1681565b600054600160a060020a031681565b600354600160a060020a031681565b600254600160a060020a031681565b600254600160a060020a031660009081526009602052604090205460ff1690565b60005460a060020a900460ff1681565b60055481565b60096020526000908152604090205460ff1681565b60005433600160a060020a0390811691161461061657600080fd5b60005460a060020a900460ff16151561062e57600080fd5b6000805474ff000000000000000000000000000000000000000019169055565b60005433600160a060020a0390811691161461066957600080fd5b600160a060020a038116156105055760008054600160a060020a03831673ffffffffffffffffffffffffffffffffffffffff19909116179055505600a165627a7a723058209df3c1df8d7b7f51b593d3607fa884b290d8e390450fb4b0b882ada6b05460c20029'
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
      general: 'noreply@jincor.com'
    }
  },
  mongo: {
    url: MONGO_URL || 'mongodb://mongo:27017/wallets'
  }
};
