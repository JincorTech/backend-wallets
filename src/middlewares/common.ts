import { Response, Request, NextFunction, Application } from 'express';
import { inject, injectable } from 'inversify';
import * as expressBearerToken from 'express-bearer-token';
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED } from 'http-status';
import 'reflect-metadata';

import { responseWithError } from '../helpers/responses';
import { AuthenticatedRequest } from '../interfaces';
import { AuthenticationServiceType, AuthenticationService } from '../services/auth.service';
import { AuthenticationException } from '../services/exceptions';

// IoC
export const AuthMiddlewareType = Symbol('AuthMiddlewareType');

/**
 * Authentication middleware.
 */
@injectable()
export class AuthMiddleware {
  private expressBearer;

  constructor(
    @inject(AuthenticationServiceType) private authenticationService: AuthenticationService
  ) {
    this.expressBearer = expressBearerToken();
  }

  /**
   * Execute authentication
   *
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async execute(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    this.expressBearer(req, res, async() => {
      try {
        req.user = await this.authenticationService.validate(req.token);
        next();
      } catch (error) {
        if (error instanceof AuthenticationException) {
          return responseWithError(res, UNAUTHORIZED, { error: error.message });
        }
        return responseWithError(res, INTERNAL_SERVER_ERROR, { error });
      }
    });
  }
}
