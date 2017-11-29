import * as LRU from 'lru-cache';
import * as request from 'web-request';
import * as fs from 'fs';
import { injectable } from 'inversify';
import 'reflect-metadata';

import config from '../config';
import { AuthenticationException } from './exceptions';
import { VerificationResult } from '../interfaces';
import { Logger } from '../logger';

/**
 * AuthenticationService interface
 */
export interface AuthenticationService {

  validate(jwtToken: string): Promise<VerificationResult>;

}

/**
 * ExternalHttpJwtAuthenticationService class
 */
@injectable()
export class ExternalHttpJwtAuthenticationService implements AuthenticationService {
  private logger: Logger = Logger.getInstance('EXTERNAL_HTTP_JWT_AUTH');

  private apiUrl: string = config.auth.verifyUrl;
  private timeout: number = config.auth.timeout;
  private agentOptions: any;

  constructor() {
    if (!config.auth.accessJwt) {
      throw new Error('AUTH jwt token is empty');
    }
  }

  /**
   * Validate JWT token
   * @param jwtToken
   */
  async validate(jwtToken: string): Promise<VerificationResult> {
    this.logger.verbose('Validate token');

    if (!jwtToken) {
      return null;
    }

    return this.callVerifyJwtTokenMethodEndpoint(jwtToken);
  }

  /**
   * Make HTTP/HTTPS request
   * @param jwtToken
   */
  private async callVerifyJwtTokenMethodEndpoint(jwtToken: string): Promise<VerificationResult> {
    try {
      /* istanbul ignore next */
      const response = await request.json<{decoded: any}>(this.apiUrl, {
        timeout: this.timeout,
        auth: {
          bearer: config.auth.accessJwt
        },
        body: { token: jwtToken },
        method: 'post'
      });

      return response.decoded;
    } catch (e) {
      if (e.statusCode !== 200 || !e.content.decoded) {
        throw new AuthenticationException('Invalid token');
      }

      if (!e.content.decoded.login || !e.content.decoded.jti) {
        throw new AuthenticationException('JWT has invalid format');
      }

      throw new AuthenticationException(e.content);
    }
  }
}

/**
 * Cache decorator for only successfully request
 */
export class CachedAuthenticationDecorator implements AuthenticationService {
  private logger: Logger = Logger.getInstance('CAHCED_AUTH_DECORATOR');

  private lruCache: any;

  /**
   * @param authenticationService
   * @param maxAgeInSeconds
   * @param maxLength
   */
  constructor(private authenticationService: AuthenticationService, maxAgeInSeconds: number = 20, maxLength: number = 8192) {
    this.lruCache = LRU({
      max: maxLength,
      maxAge: maxAgeInSeconds * 1000
    });
  }

  /**
   * @inheritdoc
   */
  async validate(jwtToken: string): Promise<VerificationResult> {
    try {
      if (this.lruCache.has(jwtToken)) {
        return this.lruCache.get(jwtToken);
      }

      this.logger.verbose('Cache token', jwtToken);

      const result = await this.authenticationService.validate(jwtToken);
      this.lruCache.set(jwtToken, result);
      return result;
    } catch (err) {
      throw err;
    }
  }
}
