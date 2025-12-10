/**
 * Minimal, mockable wrapper around AWS Organizations createAccount flow.
 * The real implementation can delegate to @aws-sdk/client-organizations.
 */
export interface CreateAccountResult {
  createRequestId: string;
}

export interface DescribeCreateAccountStatusResult {
  createRequestId: string;
  state: 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
  accountId?: string;
  failureReason?: string;
}

export interface IOrganizationsClient {
  createAccount(accountName: string, accountEmail: string): Promise<CreateAccountResult>;
  describeCreateAccountStatus(createRequestId: string): Promise<DescribeCreateAccountStatusResult>;
}

/**
 * A simple in-memory mock that simulates async account creation. Useful for tests.
 */
export class MockOrganizationsClient implements IOrganizationsClient {
  private seq = 0;
  private records: Map<string, { readyAt: number; accountId?: string; fail?: boolean }> = new Map();

  async createAccount(_accountName: string, _accountEmail: string): Promise<CreateAccountResult> {
    const createRequestId = `mock-${++this.seq}`;
    // simulate that account will be ready in ~2 seconds
    this.records.set(createRequestId, { readyAt: Date.now() + 2000, accountId: `acct-${this.seq}` });
    return { createRequestId };
  }

  async describeCreateAccountStatus(createRequestId: string): Promise<DescribeCreateAccountStatusResult> {
    const rec = this.records.get(createRequestId);
    if (!rec) {
      return { createRequestId, state: 'FAILED', failureReason: 'not_found' };
    }
    if (Date.now() >= rec.readyAt) {
      return { createRequestId, state: 'SUCCEEDED', accountId: rec.accountId };
    }
    return { createRequestId, state: 'IN_PROGRESS' };
  }
}

// Real client implementation using AWS SDK v3. This is lazy-imported so tests that
// use the mock won't require the SDK to be installed.
export class RealOrganizationsClient implements IOrganizationsClient {
  private client: any;

  constructor(options?: { region?: string }) {
    // Import lazily so unit tests that don't have AWS SDK won't fail to import this file
    // at test time. In production the dependency is present in package.json.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { OrganizationsClient } = require('@aws-sdk/client-organizations');
    this.client = new OrganizationsClient({ region: options?.region || process.env.AWS_REGION || 'us-east-1' });
  }

  async createAccount(accountName: string, accountEmail: string): Promise<CreateAccountResult> {
    // Use @aws-sdk/client-organizations CreateAccountCommand
    // Lazy require to avoid import-time issues in tests
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CreateAccountCommand } = require('@aws-sdk/client-organizations');
    const cmd = new CreateAccountCommand({ AccountName: accountName, Email: accountEmail });
    const resp = await this.client.send(cmd);
    const createId = resp?.CreateAccountStatus?.Id ?? resp?.CreateAccountStatus?.Id;
    if (!createId) throw new Error('Failed to create account: missing createRequestId');
    return { createRequestId: createId };
  }

  async describeCreateAccountStatus(createRequestId: string): Promise<DescribeCreateAccountStatusResult> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DescribeCreateAccountStatusCommand } = require('@aws-sdk/client-organizations');
    const cmd = new DescribeCreateAccountStatusCommand({ CreateAccountRequestId: createRequestId });
    const resp = await this.client.send(cmd);
    const status = resp?.CreateAccountStatus;
    if (!status) {
      return { createRequestId, state: 'FAILED', failureReason: 'not_found' };
    }
    const awsState = (status.State ?? '').toUpperCase();
    let mapped: 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' = 'IN_PROGRESS';
    if (awsState.includes('IN_PROGRESS')) mapped = 'IN_PROGRESS';
    if (awsState.includes('SUCCEEDED')) mapped = 'SUCCEEDED';
    if (awsState.includes('FAILED')) mapped = 'FAILED';
    return {
      createRequestId,
      state: mapped,
      accountId: status?.AccountId,
      failureReason: status?.FailureReason,
    };
  }
}
