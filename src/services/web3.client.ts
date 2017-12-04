import { injectable } from 'inversify';
import * as bcrypt from 'bcrypt-nodejs';

const Web3 = require('web3');
const net = require('net');

const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
import config from '../config';
import 'reflect-metadata';
import * as lodash from 'lodash';

export interface TransactionsGrouppedByStatuses {
  success?: Array<string>;
  failure?: Array<string>;
}

/* istanbul ignore next */
@injectable()
export class Web3Client {
  web3: any;

  constructor() {
    switch (config.ethRpc.type) {
      case 'ipc':
        this.web3 = new Web3(new Web3.providers.IpcProvider(config.ethRpc.address, net));
        break;
      case 'ws':
        const webSocketProvider = new Web3.providers.WebsocketProvider(config.ethRpc.address);

        webSocketProvider.connection.onclose = () => {
          console.log(new Date().toUTCString() + ':Web3 socket connection closed');
          this.onWsClose();
        };

        this.web3 = new Web3(webSocketProvider);
        break;
      case 'http':
        this.web3 = new Web3(config.ethRpc.address);
        break;
      default:
        throw Error('Unknown Web3 RPC type!');
    }
  }

  sendTransactionByMnemonic(input: TransactionInput, mnemonic: string, salt: string): Promise<string> {
    const privateKey = this.getPrivateKeyByMnemonicAndSalt(mnemonic, salt);

    const params = {
      value: this.web3.utils.toWei(input.amount.toString()),
      from: input.from,
      to: input.to,
      gas: input.gas,
      gasPrice: this.web3.utils.toWei(input.gasPrice, 'gwei')
    };

    return new Promise<string>((resolve, reject) => {
      this.sufficientBalance(input).then((sufficient) => {
        if (!sufficient) {
          reject({
            message: 'Insufficient funds to perform this operation and pay tx fee'
          });
        }

        this.web3.eth.accounts.signTransaction(params, privateKey).then(transaction => {
          this.web3.eth.sendSignedTransaction(transaction.rawTransaction)
            .on('transactionHash', transactionHash => {
              resolve(transactionHash);
            })
            .on('error', (error) => {
              reject(error);
            })
            .catch((error) => {
              reject(error);
            });
        });
      });
    });
  }

  getSalt(): string {
    return bcrypt.genSaltSync();
  }

  generateMnemonic(): string {
    return bip39.generateMnemonic();
  }

  getAccountByMnemonicAndSalt(mnemonic: string, salt: string): any {
    const privateKey = this.getPrivateKeyByMnemonicAndSalt(mnemonic, salt);
    return this.web3.eth.accounts.privateKeyToAccount(privateKey);
  }

  getPrivateKeyByMnemonicAndSalt(mnemonic: string, salt: string) {
    // get seed
    const hdWallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic, salt));

    // get first of available wallets
    const path = 'm/44\'/60\'/0\'/0/0';

    // get wallet
    const wallet = hdWallet.derivePath(path).getWallet();

    // get private key
    return '0x' + wallet.getPrivateKey().toString('hex');
  }

  async getEthBalance(address: string): Promise<string> {
    return this.web3.utils.fromWei(
      await this.web3.eth.getBalance(address)
    );
  }

  sufficientBalance(input: TransactionInput): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.web3.eth.getBalance(input.from)
        .then((balance) => {
          const BN = this.web3.utils.BN;
          const txFee = new BN(input.gas).mul(new BN(this.web3.utils.toWei(input.gasPrice, 'gwei')));
          const total = new BN(this.web3.utils.toWei(input.amount)).add(txFee);
          resolve(total.lte(new BN(balance)));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async getTransactionGrouppedStatuses(transactionIds: string[]): Promise<TransactionsGrouppedByStatuses> {
    const parts = lodash.chunk(transactionIds, 5);
    let data = [];

    for (let i = 0; i < parts.length; i++) {
      data = data.concat(
        await Promise.all(parts[i].map(txId => this.web3.eth.getTransactionReceipt(txId)))
      ).filter(t => t).map(t => ({
        status: t.status,
        txId: t.transactionHash
      }));
    }

    return {
      success: data.filter(t => t.status === '0x1').map(t => t.txId),
      failure: data.filter(t => t.status !== '0x1').map(t => t.txId)
    };
  }

  onWsClose() {
    console.error(new Date().toUTCString() + ': Web3 socket connection closed. Trying to reconnect');
    const webSocketProvider = new Web3.providers.WebsocketProvider(config.ethRpc.address);
    webSocketProvider.connection.onclose = () => {
      console.log(new Date().toUTCString() + ':Web3 socket connection closed');
      setTimeout(() => {
        this.onWsClose();
      }, config.ethRpc.reconnectTimeout);
    };

    this.web3.setProvider(webSocketProvider);
  }
}

const Web3ClientType = Symbol('Web3ClientInterface');
export { Web3ClientType };
