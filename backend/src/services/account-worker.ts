import { IOrganizationsClient } from './aws-organizations.client';
import { accountRequestStorage } from './account-request.storage';

let intervalHandle: NodeJS.Timeout | null = null;

/**
 * Process all pending/in-flight account requests once.
 * This function implements the state machine:
 * REQUESTED → VALIDATING → CREATING → GUARDRAILING → READY/FAILED
 */
export const processAccountRequestsOnce = async (orgClient: IOrganizationsClient): Promise<void> => {
  // Get all non-terminal requests
  const requested = accountRequestStorage.findByStatus('REQUESTED');
  const validating = accountRequestStorage.findByStatus('VALIDATING');
  const creating = accountRequestStorage.findByStatus('CREATING');
  const guardrailing = accountRequestStorage.findByStatus('GUARDRAILING');
  
  const allPending = [...requested, ...validating, ...creating, ...guardrailing];

  for (const req of allPending) {
    try {
      // State: REQUESTED → VALIDATING
      if (req.status === 'REQUESTED') {
        // Pre-flight validation (in real implementation: check quotas, permissions, uniqueness)
        accountRequestStorage.updateStatus(req.id, 'VALIDATING');
        continue;
      }

      // State: VALIDATING → CREATING
      if (req.status === 'VALIDATING') {
        // Start AWS Organizations CreateAccount
        const create = await orgClient.createAccount(req.accountName, req.ownerEmail);
        accountRequestStorage.update(req.id, {
          status: 'CREATING',
          awsRequestId: create.createRequestId,
        });
        continue;
      }

      // State: CREATING → GUARDRAILING or FAILED
      if (req.status === 'CREATING' && req.awsRequestId) {
        const status = await orgClient.describeCreateAccountStatus(req.awsRequestId);
        
        if (status.state === 'SUCCEEDED' && status.accountId) {
          // Account created, now apply guardrails
          accountRequestStorage.update(req.id, {
            status: 'GUARDRAILING',
            awsAccountId: status.accountId,
          });
        } else if (status.state === 'FAILED') {
          accountRequestStorage.updateStatus(
            req.id,
            'FAILED',
            `AWS account creation failed: ${status.failureReason || 'unknown'}`
          );
        }
        // If IN_PROGRESS, stay in CREATING state
        continue;
      }

      // State: GUARDRAILING → READY or FAILED
      if (req.status === 'GUARDRAILING' && req.awsAccountId) {
        // In real implementation: apply CloudTrail, Config, Budgets, SCPs via Crossplane
        // For now, just mark as READY
        // TODO: Integrate with crossplane-guardrail.client.ts
        accountRequestStorage.updateStatus(req.id, 'READY');
        continue;
      }

    } catch (err) {
      // Any error transitions to FAILED state
      accountRequestStorage.updateStatus(
        req.id,
        'FAILED',
        `Worker error: ${(err as Error)?.message || String(err)}`
      );
    }
  }
};

/**
 * Start background worker that processes account requests
 */
export const startAccountWorker = (orgClient: IOrganizationsClient, intervalMs = 2000): void => {
  if (intervalHandle) {
    console.log('Account worker already running');
    return;
  }
  
  console.log(`Starting account provisioning worker (poll interval: ${intervalMs}ms)`);
  intervalHandle = setInterval(() => {
    processAccountRequestsOnce(orgClient).catch((e) => {
      console.error('Account worker error:', e);
    });
  }, intervalMs);
};

/**
 * Stop background worker
 */
export const stopAccountWorker = (): void => {
  if (!intervalHandle) return;
  clearInterval(intervalHandle);
  intervalHandle = null;
  console.log('Account worker stopped');
};
