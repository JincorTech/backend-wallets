import * as Joi from 'joi';
import { Response, Request, NextFunction } from 'express';

const options = {
  allowUnknown: true
};

export function WalletRegisterRequestValidator(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object().keys({
    //
  });

  const result = Joi.validate(req.body, schema, options);

  if (result.error) {
    return res.status(422).json(result);
  } else {
    return next();
  }
}

export function TransactionInitiateRequestValidator(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object().keys({
    sender: Joi.string().regex(/^0x[\da-fA-F]{40,40}$/).required(),
    receiver: Joi.string().regex(/^0x[\da-fA-F]{40,40}$/).required(),
    amount: Joi.number().min(0).required(), // @TODO: Check, it's maybe number overflow
    currency: Joi.string().valid('ETH', 'JCR').required()
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

export function EmploymentScCreateValidator(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object().keys({
    startDate: Joi.string().required(),
    contractNumber: Joi.number().min(1).required(),
    employeeId: Joi.string().required(),
    wallets: Joi.object().keys({
      employer: Joi.string().required(),
      employee: Joi.string().required()
    }).required(),
    jobTitle: Joi.string().required(),
    typeOfEmployment: Joi.string().required(),
    periodOfAgreement: Joi.string().required(),
    periodStartDate: Joi.string(),
    periodEndDate: Joi.string(),
    compensation: Joi.object().keys({
      salaryAmount: Joi.object().keys({
        currency: Joi.string().required(),
        amount: Joi.string().required()
      }).required(),
      dayOfPayments: Joi.number().min(1).max(28).required()
    }).required(),
    jobDescription: Joi.string(),
    additionalClauses: Joi.string()
  });

  const result = Joi.validate(req.body, schema, options);

  if (result.error) {
    return res.status(422).json(result);
  } else {
    return next();
  }
}

export function VerificationRequiredValidator(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object().keys({
    verificationId: Joi.string().required(),
    verificationCode: Joi.string().required()
  });

  const result = Joi.validate(req.body, schema, options);

  if (result.error) {
    return res.status(422).json(result);
  } else {
    return next();
  }
}
