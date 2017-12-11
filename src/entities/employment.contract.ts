export interface EmploymentAgreementContract {
  id: string;
  startDate: string;
  contractNumber: number;
  employeeId: string;
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
  jobDescription: string;
  additionalClauses: string;
  txHash: string;
  contractAddress: string;
}
