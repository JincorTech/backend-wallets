import { injectable, inject } from 'inversify';
import { MongoDbConnector } from './mongodb.connector.service';
import { EmploymentAgreementContract } from '../../entities/employment.contract';
import { ObjectID } from 'mongodb';
import { CONTRACT_STATUS_DEPLOY_PENDING, CONTRACT_STATUS_SIGN_PENDING } from '../contracts.deployer';

export interface ContractRepository {
  save(contract: EmploymentAgreementContract): Promise<any>;

  findOneById(id: string): Promise<any>;

  getByContractAddress(address: string): Promise<EmploymentAgreementContract>;

  getByEmployerAddresses(addresses: string[]): Promise<EmploymentAgreementContract[]>;

  getByEmployeeAddresses(addresses: string[]): Promise<EmploymentAgreementContract[]>;

  getByTxHash(txHash: string): Promise<EmploymentAgreementContract>;

  getByIdAndEmployeeWallets(id: string, wallets: string[]): Promise<EmploymentAgreementContract>;

  getByIdAndEmployerWallets(id: string, wallets: string[]): Promise<EmploymentAgreementContract>;

  getAllSignedContracts(): Promise<EmploymentAgreementContract[]>;

  getSignPendingContracts(): Promise<EmploymentAgreementContract[]>;

  getDeployPendingContracts(): Promise<EmploymentAgreementContract[]>;
}

@injectable()
export class MongoContractRepository implements ContractRepository {
  constructor(
    @inject('MongoDbConnector') private mongoConnector: MongoDbConnector
  ) { }

  /**
   * @param contract
   */
  async save(contract: EmploymentAgreementContract): Promise<any> {
    return ((await this.mongoConnector.getDb()).collection('contracts').save(contract));
  }

  /**
   * @param id string
   */
  async findOneById(id: string): Promise<any> {
    return ((await this.mongoConnector.getDb()).collection('contracts').findOne({
      _id: new ObjectID(id)
    }));
  }

  async getByEmployerAddresses(addresses: string[]): Promise<EmploymentAgreementContract[]> {
    const cursor = (await this.mongoConnector.getDb()).collection('contracts').find({
      'wallets.employer': {
        '$in': addresses
      }
    });

    return cursor.toArray();
  }

  async getByEmployeeAddresses(addresses: string[]): Promise<EmploymentAgreementContract[]> {
    const cursor = (await this.mongoConnector.getDb()).collection('contracts').find({
      'wallets.employee': {
        '$in': addresses
      }
    });

    return cursor.toArray();
  }

  async getByTxHash(txHash: string): Promise<EmploymentAgreementContract> {
    return (await this.mongoConnector.getDb()).collection('contracts').findOne({
      txHash
    });
  }

  async getByContractAddress(contractAddress: string): Promise<EmploymentAgreementContract> {
    return (await this.mongoConnector.getDb()).collection('contracts').findOne({
      contractAddress
    });
  }

  async getByIdAndEmployeeWallets(id: string, wallets: string[]): Promise<EmploymentAgreementContract> {
    return (await this.mongoConnector.getDb()).collection('contracts').findOne({
      '$and': [
        {
          _id: new ObjectID(id)
        },
        {
          'wallets.employee': {
            '$in': wallets
          }
        }
      ]
    });
  }

  async getByIdAndEmployerWallets(id: string, wallets: string[]): Promise<EmploymentAgreementContract> {
    return (await this.mongoConnector.getDb()).collection('contracts').findOne({
      '$and': [
        {
          _id: new ObjectID(id)
        },
        {
          'wallets.employer': {
            '$in': wallets
          }
        }
      ]
    });
  }

  async getAllSignedContracts(): Promise<EmploymentAgreementContract[]> {
    const cursor = (await this.mongoConnector.getDb()).collection('contracts').find({
      isSignedByEmployee: true
    });

    return cursor.toArray();
  }

  async getSignPendingContracts(): Promise<EmploymentAgreementContract[]> {
    const cursor = (await this.mongoConnector.getDb()).collection('contracts').find({
      status: CONTRACT_STATUS_SIGN_PENDING
    });

    return cursor.toArray();
  }

  async getDeployPendingContracts(): Promise<EmploymentAgreementContract[]> {
    const cursor = (await this.mongoConnector.getDb()).collection('contracts').find({
      status: CONTRACT_STATUS_DEPLOY_PENDING
    });

    return cursor.toArray();
  }
}
