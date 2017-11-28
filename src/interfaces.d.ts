import { Request } from 'express';

/**
 * @internal helper interface
 */
export interface AuthenticatedRequest extends Request {
  token: string;
  user: VerificationResult;
}

export interface VerificationResult {
  id: string;
  login: string;
  scope: string;
  deviceId: string;
  jti: string;
  iat: string;
  sub: string;
  aud: string;
}
