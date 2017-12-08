import { injectable, inject } from 'inversify';
import { MongoDbConnector } from './mongodb.connector.service';
import { EmploymentAgreementContract } from '../../entities/employment.contract';

export interface ContractRepository {
  save(contract: EmploymentAgreementContract): Promise<any>;
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
}
