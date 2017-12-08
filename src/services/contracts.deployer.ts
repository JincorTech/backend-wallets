import { injectable, inject } from 'inversify';
import { EmploymentAgreementContract } from '../entities/employment.contract';
import { Web3Client } from './web3.client';
import config from '../config';
import * as moment from 'moment';
import { Wallet } from '../entities/wallet';
import { ContractRepository } from './repositories/contract.repository';
const Web3 = require('web3');

export interface ContractsDeployerInterface {
  deployEmploymentAgreement(input: EmploymentAgreementContract, wallet: Wallet): Promise<string>;
}

@injectable()
export class ContractsDeployer implements ContractsDeployerInterface {
  constructor(
    @inject('Web3Client') private web3: Web3Client,
    @inject('ContractRepository') private contractRepository: ContractRepository
  ) { }

  async deployEmploymentAgreement(input: EmploymentAgreementContract, wallet: Wallet): Promise<string> {
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

    const txHash = await this.web3.deployContract(deployInput);
    await this.contractRepository.save(input);
    return txHash;
  }
}

const ContractsDeployerType = Symbol('ContractsDeployerInterface');
export { ContractsDeployerType };
