export interface EmploymentAgreementContract {
  id: string;
  startDate: string;
  contractNumber: number;
  wallets: {
    employer: string;
    employee: string;
  };
  jobTitle: string;
  typeOfEmployment: string;
  periodOfAgreement: string;
  periodStartDate: string;
  periodEndDate: string;
  compensation: {
    salaryAmount: {
      currency: string;
      amount: string;
    };
    dayOfPayments: number;
  };
  additionalClauses: string;
}
