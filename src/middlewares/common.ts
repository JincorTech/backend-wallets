import { Response, Request, NextFunction, Application } from 'express';
import { inject, injectable } from 'inversify';
import * as expressBearerToken from 'express-bearer-token';
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED } from 'http-status';
import 'reflect-metadata';

import { responseWithError } from '../helpers/responses';
import { AuthenticatedRequest } from '../interfaces';
import { AuthenticationService } from '../services/auth.service';
import { AuthenticationException } from '../services/exceptions';
import { BaseMiddleware } from 'inversify-express-utils';

/**
 * Authentication middleware.
 */
@injectable()
export class AuthMiddleware extends BaseMiddleware {
  private expressBearer;
  @inject('AuthenticationService') private authenticationService: AuthenticationService;

  /**
   * Execute authentication
   *
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  public handler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (!this.expressBearer) {
      this.expressBearer = expressBearerToken();
    }
    this.expressBearer(req, res, async() => {
      const r = req as AuthenticatedRequest;
      try {
        r.user = await this.authenticationService.validate(r.token);
        if (!r.user) {
          throw new AuthenticationException('Invalid token');
        }
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
