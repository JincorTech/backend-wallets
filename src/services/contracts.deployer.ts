import { injectable, inject } from 'inversify';
import { EmploymentAgreementContract } from '../entities/employment.contract';
import { Web3Client } from './web3.client';
import config from '../config';
import * as moment from 'moment';
import { Wallet } from '../entities/wallet';
import { ContractRepository } from './repositories/contract.repository';
const Web3 = require('web3');
import { EventEmitter } from 'events';
const abiDecoder = require('abi-decoder');

export interface ContractsDeployerInterface {
  deployEmploymentAgreement(input: EmploymentAgreementContract, wallet: Wallet): Promise<string>;
  signEmploymentAgreement(contract: EmploymentAgreementContract, wallet: Wallet): Promise<string>;
}

@injectable()
export class ContractsDeployer implements ContractsDeployerInterface {
  constructor(
    @inject('Web3Client') private web3: Web3Client,
    @inject('ContractRepository') private contractRepository: ContractRepository,
    @inject('Web3EventEmitter') private eventEmitter: EventEmitter
  ) {
    this.eventEmitter.on('newReceipt', async(receipt, txData) => {
      if (receipt.contractAddress) {
        await this.processContractDeployReceipt(receipt);
      } else {
        // now we just expect that we receive this event when contract is signed
        // need to refactor to properly handle events
        await this.processTxReceipt(receipt, txData);
      }
    });
  }

  deployEmploymentAgreement(input: EmploymentAgreementContract, wallet: Wallet): Promise<string> {
    let periodTypeNumerical;

    switch (input.periodOfAgreement) {
      case 'fixed':
        periodTypeNumerical = 0;
        break;
      case 'permanent':
        periodTypeNumerical = 1;
        break;
      default:
        throw Error('Unknown period type.');
    }

    const periodStartDate = input.periodStartDate ? moment(input.periodStartDate, 'MM/DD/YYYY').unix().toString() : 0;
    const periodEndDate = input.periodStartDate ? moment(input.periodStartDate, 'MM/DD/YYYY').unix().toString() : 0;

    const paymentDay = input.compensation.dayOfPayments || 1;
    let momentToStart = moment().date(paymentDay).hour(0).minute(0).second(0);

    // if payment day is already gone start to pay in next month
    if (momentToStart.diff(moment()) <= 0) {
      momentToStart.add(1, 'month');
    }
    const startCompensation = momentToStart.unix().toString();

    const constructorArguments = [
      moment(input.startDate, 'MM/DD/YYYY').unix().toString(),
      input.wallets.employee,
      periodTypeNumerical,
      periodStartDate,
      periodEndDate,
      startCompensation,
      Web3.utils.toWei(input.compensation.salaryAmount.amount)
    ];

    const deployInput: DeployContractInput = {
      from: wallet.address,
      abi: config.contracts.employmentAgreement.abi,
      byteCode: config.contracts.employmentAgreement.byteCode,
      mnemonic: wallet.mnemonics,
      salt: wallet.salt,
      constructorArguments
    };

    return this.web3.deployContract(deployInput);
  }

  async processContractDeployReceipt(receipt: any): Promise<void> {
    const contract = await this.contractRepository.getByTxHash(receipt.transactionHash);
    if (contract) {
      contract.contractAddress = receipt.contractAddress;
      await this.contractRepository.save(contract);
    }
  }

  async processTxReceipt(receipt: any, txData: any): Promise<void> {
    const checksumAddress = this.web3.getChecksumAddress(receipt.to);
    const contract = await this.contractRepository.getByContractAddress(checksumAddress);

    if (contract && receipt.status === '0x1') {
      abiDecoder.addABI(config.contracts.employmentAgreement.abi);
      const txInput = abiDecoder.decodeMethod(txData.input);
      if (txInput.name === 'sign') {
        contract.isSignedByEmployee = true;
        contract.signedAt = moment().format('MM/DD/YYYY');
        await this.contractRepository.save(contract);
      }
    }
  }

  async signEmploymentAgreement(contract: EmploymentAgreementContract, wallet: Wallet): Promise<string> {
    const isSignedInput = {
      methodName: 'signedByEmployee',
      address: contract.contractAddress,
      arguments: [],
      abi: config.contracts.employmentAgreement.abi
    };
    const signed = await this.web3.callConstantMethod(isSignedInput);
    if (signed === true) {
      throw Error('Contract is already signed!');
    }

    const input: ExecuteContractMethodInput = {
      methodName: 'sign',
      address: contract.contractAddress,
      from: wallet.address,
      arguments: [],
      abi: config.contracts.employmentAgreement.abi,
      mnemonic: wallet.mnemonics,
      salt: wallet.salt,
      amount: '0'
    };

    return this.web3.executeContractMethod(input);
  }
}

const ContractsDeployerType = Symbol('ContractsDeployerInterface');
export { ContractsDeployerType };
