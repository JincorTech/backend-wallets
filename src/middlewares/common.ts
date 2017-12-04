import { Response, Request, NextFunction, Application } from 'express';
import { inject, injectable } from 'inversify';
import * as expressBearerToken from 'express-bearer-token';
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED } from 'http-status';
import * as LRU from 'lru-cache';
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

let jwtCache: any = LRU({
  max: 1 << 15,
  maxAge: 1200
});

/**
 * JwtThrottlingMiddleware middleware.
 */
@injectable()
export class JwtThrottlingMiddleware extends BaseMiddleware {
  private expressBearer;

  /**
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
        const token = (r.token || '') + r.url + r.method;
        if (jwtCache.has(token)) {
          return responseWithError(res, 429, { error: 'Too many requests from current user' });
        }
        jwtCache.set(token, '1');
        next();
      } catch (error) {
        return responseWithError(res, INTERNAL_SERVER_ERROR, { error });
      }
    });
  }
}
