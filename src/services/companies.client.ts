import * as request from 'web-request';
import { injectable } from 'inversify';

import config from '../config';
import { Logger } from '../logger';

export interface Employee {
  id: string;
  contacts: {
    email: string;
  };
  profile: {
    firstName: string;
    lastName: string;
    role: string;
    avatar: string;
  };
}

/* istanbul ignore next */
@injectable()
export class CompaniesClient {
  private logger: Logger = Logger.getInstance('COMPANIES_CLIENT');

  async queryEmployeesByLogins(jwtToken: string, items: Array<string>): Promise<{[key: string]: Employee}> {
    this.logger.verbose('Query employees by logins', items.slice(0, 100), '...');

    // @TODO: Mock data
    // return {
    //   'b0784179-1573-4bbd-b749-26d1c1eb4d8c:client1@test1.com': {
    //     'id': 'id1',
    //     'contacts': {
    //       'email': 'client1@test1.com'
    //     },
    //     'profile': {
    //       'firstName': 'Client1FistName',
    //       'lastName': 'Client1LastName',
    //       'role': 'employee',
    //       'avatar': 'http://image1'
    //     }
    //   },
    //   'b0784179-1573-4bbd-b749-26d1c1eb4d8c:client2@test1.com': {
    //     'id': 'id2',
    //     'contacts': {
    //       'email': 'client2@test1.com'
    //     },
    //     'profile': {
    //       'firstName': 'Client2FistName',
    //       'lastName': 'Client2LastName',
    //       'role': 'employee',
    //       'avatar': 'http://image2'
    //     }
    //   },
    //   'b0784179-1573-4bbd-b749-26d1c1eb4d8c:client3@test1.com': {
    //     'id': 'id3',
    //     'contacts': {
    //       'email': 'client3@test1.com'
    //     },
    //     'profile': {
    //       'firstName': 'Client3FistName',
    //       'lastName': 'Client3LastName',
    //       'role': 'employee',
    //       'avatar': 'http://image3'
    //     }
    //   },
    //   'b0784179-1573-4bbd-b749-26d1c1eb4d8c:client4@test1.com': {
    //     'id': 'id4',
    //     'contacts': {
    //       'email': 'client4@test1.com'
    //     },
    //     'profile': {
    //       'firstName': 'Client4FistName',
    //       'lastName': 'Client4LastName',
    //       'role': 'employee',
    //       'avatar': 'http://image4'
    //     }
    //   }
    // };
    const result = await request.json<{data: {[key: string]: Employee}}>(`/employee/query-logins`, {
      baseUrl: config.companies.baseUrl,
      auth: {
        bearer: jwtToken
      },
      method: 'put',
      body: {
        items
      }
    });

    return result.data;
  }
}
