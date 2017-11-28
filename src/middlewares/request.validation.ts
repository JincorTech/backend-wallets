import * as Joi from 'joi';
import { Response, Request, NextFunction } from 'express';

const options = {
  allowUnknown: true
};

export function TransactionInitiateRequestValidator(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object().keys({
    sender: Joi.string().hex().required(),
    receiver: Joi.string().hex().required(),
    amount: Joi.integer().min(0).required(), // @TODO: Check, it's maybe number overflow
    currency: Joi.string.valid('ETH', 'JCR').required()
    // verificationMethod: Joi.string().valid('email' /*, 'google_auth'*/).required()
  });

  const result = Joi.validate(req.body, schema, options);

  if (result.error) {
    return res.status(422).json(result);
  } else {
    return next();
  }
}

export function TransactionVerifyRequestValidator(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object().keys({
    verification: Joi.object().keys({
      verificationId: Joi.string().required(),
      code: Joi.string().required(),
      method: Joi.string().valid('email' /*, 'google_auth'*/).required()
    }).required()
  });

  const result = Joi.validate(req.body, schema, options);

  if (result.error) {
    return res.status(422).json(result);
  } else {
    return next();
  }
}
