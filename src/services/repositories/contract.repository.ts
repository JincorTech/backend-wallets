import { injectable, inject } from 'inversify';
import { MongoDbConnector } from './mongodb.connector.service';
import { EmploymentAgreementContract } from '../../entities/employment.contract';
import { ObjectID } from 'mongodb';

export interface ContractRepository {
  save(contract: EmploymentAgreementContract): Promise<any>;

  findOneById(id: string): Promise<any>;
}

@injectable()
export class MongoContractRepository {
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
}
