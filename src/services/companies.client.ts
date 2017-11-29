import * as request from 'web-request';
import { injectable } from 'inversify';

import config from '../config';
import { Logger } from '../logger';

// @TODO: Make details
export interface Employee {
  id: string;
  email: string;
  wallet: string;
}

/* istanbul ignore next */
@injectable()
export class CompaniesClient {
  private logger: Logger = Logger.getInstance('COMPANIES_CLIENT');

  async queryEmployeesByLogins(jwtToken: string, items: Array<string>): Promise<Array<Employee>> {
    this.logger.verbose('Query employees by logins', items.slice(0, 100), '...');

    return [
      { id: 'b0784179-1573-4bbd-b749-26d1c1eb4d8c:client1@test1.com', email: 'client1@test1.com', wallet: 'wallet' },
      { id: 'b0784179-1573-4bbd-b749-26d1c1eb4d8c:client2@test1.com', email: 'client2@test1.com', wallet: 'wallet' },
      { id: 'b0784179-1573-4bbd-b749-26d1c1eb4d8c:client3@test1.com', email: 'client3@test1.com', wallet: 'wallet' },
      { id: 'b0784179-1573-4bbd-b749-26d1c1eb4d8c:client4@test1.com', email: 'client4@test1.com', wallet: 'wallet' }
    ];
    // const result = await request.json<{data: Array<Employee>}>(`/employee/query-logins`, {
    //   baseUrl: config.companies.baseUrl,
    //   auth: {
    //     bearer: jwtToken
    //   },
    //   method: 'post',
    //   body: {
    //     items
    //   }
    // });

    // return result.data;
  }
}
