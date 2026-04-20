declare module "paystack-node" {
  interface InitializeTransactionArgs {
    email: string;
    amount: number;
    currency?: string;
    metadata?: Record<string, unknown>;
    callbackUrl?: string;
  }

  interface InitializeTransactionResponse {
    status: boolean;
    message: string;
    data: {
      reference: string;
      authorization_url: string;
      access_code: string;
      amount: number;
      currency: string;
    };
  }

  interface VerifyTransactionResponse {
    status: boolean;
    message: string;
    data: {
      id: number;
      reference: string;
      amount: number;
      currency: string;
      status: string;
      metadata: Record<string, unknown>;
    };
  }

  class Paystack {
    constructor(secretKey: string);
    initializeTransaction(args: InitializeTransactionArgs): Promise<InitializeTransactionResponse>;
    verifyTransaction(reference: string): Promise<VerifyTransactionResponse>;
  }

  export = Paystack;
}