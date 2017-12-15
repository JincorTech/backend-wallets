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
      byteCode: '0x606060405260008060146101000a81548160ff021916908315150217905550341561002957600080fd5b60405160e080610faf83398101604052808051906020019091908051906020019091908051906020019091908051906020019091908051906020019091908051906020019091908051906020019091905050336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060018560ff16111515156100ce57600080fd5b60045482101515156100df57600080fd5b816008819055508460ff1660018111156100f557fe5b600360146101000a81548160ff0219169083600181111561011257fe5b02179055508660018190555033600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555085600360006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506001600960003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055508360048190555082600581905550806007819055506000600a8190555050505050505050610d848061022b6000396000f300606060405260043610610107576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680630b97bc861461034d5780632ca15122146103765780632f9d44391461038b578063399db8e9146103b45780633ccfd60b146103e157806340d5ff58146103f65780634e83d9e91461041f5780635ed7ca5b1461044857806384bcefd41461045d5780638862cca1146104865780638da5cb5b146104bd578063a0a1a7d714610512578063ae200e7914610567578063b146e129146105bc578063b9b8af0b146105e9578063c24a0f8b14610616578063c792f36d1461063f578063cb3e64fd14610690578063f2fde38b146106a5575b42806008541115151561011957600080fd5b60018081111561012557fe5b600360149054906101000a900460ff16600181111561014057fe5b148061015c5750600454811015801561015b57506005548111155b5b151561016757600080fd5b6006548111151561017757600080fd5b60006006541415156101a657601c62015180600654830381151561019757fe5b04101515156101a557600080fd5b5b60096000600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16151561021d57fe5b60096000600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16151561029457fe5b60075434101515156102a557600080fd5b426006819055506007543411156102e6576102df6102ce600754346106de90919063ffffffff16565b600a546106f790919063ffffffff16565b600a819055505b600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166108fc6007549081150290604051600060405180830381858888f19350505050151561034a57600080fd5b50005b341561035857600080fd5b610360610715565b6040518082815260200191505060405180910390f35b341561038157600080fd5b61038961071b565b005b341561039657600080fd5b61039e61084c565b6040518082815260200191505060405180910390f35b34156103bf57600080fd5b6103c7610852565b604051808215151515815260200191505060405180910390f35b34156103ec57600080fd5b6103f46108c8565b005b341561040157600080fd5b610409610998565b6040518082815260200191505060405180910390f35b341561042a57600080fd5b61043261099e565b6040518082815260200191505060405180910390f35b341561045357600080fd5b61045b6109a4565b005b341561046857600080fd5b610470610a38565b6040518082815260200191505060405180910390f35b341561049157600080fd5b610499610a3e565b604051808260018111156104a957fe5b60ff16815260200191505060405180910390f35b34156104c857600080fd5b6104d0610a51565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b341561051d57600080fd5b610525610a76565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b341561057257600080fd5b61057a610a9c565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b34156105c757600080fd5b6105cf610ac2565b604051808215151515815260200191505060405180910390f35b34156105f457600080fd5b6105fc610b38565b604051808215151515815260200191505060405180910390f35b341561062157600080fd5b610629610b4b565b6040518082815260200191505060405180910390f35b341561064a57600080fd5b610676600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050610b51565b604051808215151515815260200191505060405180910390f35b341561069b57600080fd5b6106a3610b71565b005b34156106b057600080fd5b6106dc600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050610c03565b005b60008282111515156106ec57fe5b818303905092915050565b600080828401905083811015151561070b57fe5b8091505092915050565b60045481565b60096000600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff1615151561079657600080fd5b600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161415156107f257600080fd5b6001600960003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff021916908315150217905550565b60085481565b600060096000600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16905090565b6000600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561092657600080fd5b600a5490506000600a81905550600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166108fc829081150290604051600060405180830381858888f19350505050151561099557600080fd5b50565b60075481565b60015481565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161415156109ff57600080fd5b600060149054906101000a900460ff16151515610a1b57600080fd5b6001600060146101000a81548160ff021916908315150217905550565b600a5481565b600360149054906101000a900460ff1681565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600060096000600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16905090565b600060149054906101000a900460ff1681565b60055481565b60096020528060005260406000206000915054906101000a900460ff1681565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141515610bcc57600080fd5b600060149054906101000a900460ff161515610be757600080fd5b60008060146101000a81548160ff021916908315150217905550565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141515610c5e57600080fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614151515610c9a57600080fd5b8073ffffffffffffffffffffffffffffffffffffffff166000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a3806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550505600a165627a7a723058205514257aaeb8114be95a5e284d4cfc0562fb5c58f820f0a93466deb17c7555940029'
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
