import * as request from 'web-request';
import { injectable } from 'inversify';

import config from '../config';

// @TODO: Make details
export interface Employee {
  id: string;
  email: string;
  wallet: string;
}

/* istanbul ignore next */
@injectable()
export class CompaniesClient {

  async queryEmployeesByLogins(jwtToken: string, items: Array<string>): Promise<Array<Employee>> {
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
