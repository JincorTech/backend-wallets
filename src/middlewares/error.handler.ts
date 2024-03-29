import { Request, Response, NextFunction } from 'express';
import * as Err from '../exceptions/exceptions';

export default function handle(err: Error, req: Request, res: Response, next: NextFunction): void {
  let status;

  switch (err.constructor) {
    case Err.AuthenticatorError:
      status = 400;
      break;
    case Err.InvalidPassword:
      // no break
    case Err.UserNotActivated:
      status = 403;
      break;
    case Err.VerificationIsNotFound:
      // no break
    case Err.UserNotFound:
      status = 404;
      break;
    case Err.UserExists:
      // no break
    case Err.NotCorrectVerificationCode:
      // no break
      status = 422;
      break;
    default:
      status = 500;
      console.error(err.message);
      console.error(err.stack);
  }

  res.status(status).send({
    statusCode: status,
    error: err.message
  });
}
