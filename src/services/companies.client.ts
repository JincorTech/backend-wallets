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

    const result = await request.json<{data: Array<Employee>}>(`/employee/query-logins`, {
      baseUrl: config.companies.baseUrl,
      auth: {
        bearer: jwtToken
      },
      method: 'post',
      body: {
        items
      }
    });

    return result.data;
  }
}
