import express, { Request, Response } from 'express';
import { awsAccountService } from '../services/aws-account.service';
import { LinkAccountRequest, SecureAccountRequest } from '../types/aws';
import { User } from '../types/user';

// Extend Express Request type to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

const router = express.Router();

// Mock user for testing when auth is disabled
const TEST_USER_ID = 'test-user-123';

/**
 * GET /api/aws/accounts
 * List all AWS accounts for the authenticated user
 */
router.get('/accounts', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const userId = user?.id || TEST_USER_ID; // Use test user if no auth

    const accounts = await awsAccountService.listAccounts(userId);
    res.json({ accounts, total: accounts.length });
  } catch (error) {
    console.error('Error listing AWS accounts:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to list accounts', details: message });
  }
});

/**
 * GET /api/aws/accounts/:id
 * Get a specific AWS account
 */
router.get('/accounts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const userId = user?.id || TEST_USER_ID; // Use test user if no auth

    const account = await awsAccountService.getAccount(userId, req.params.id);
    
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    res.json({ account });
  } catch (error) {
    console.error('Error getting AWS account:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to get account', details: message });
  }
});

/**
 * POST /api/aws/link-account
 * Link an existing AWS account
 */
router.post('/link-account', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const userId = user?.id || TEST_USER_ID; // Use test user if no auth

    const request: LinkAccountRequest = req.body;
    const account = await awsAccountService.linkAccount(userId, request);

    res.status(201).json({
      account,
      message: 'AWS account linked successfully',
    });
  } catch (error) {
    console.error('Error linking AWS account:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Return 400 for validation errors, 500 for server errors
    const status = message.includes('Validation failed') || message.includes('already linked') ? 400 : 500;
    res.status(status).json({ error: 'Failed to link account', details: message });
  }
});

/**
 * POST /api/aws/secure-account
 * Apply guardrails to a linked account (create GuardrailedAccountClaim)
 */
router.post('/secure-account', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const userId = user?.id || TEST_USER_ID; // Use test user if no auth

    const request: SecureAccountRequest = req.body;
    const account = await awsAccountService.secureAccount(userId, request);

    res.json({
      account,
      claimName: account.guardrailClaimName,
      message: 'Guardrails are being applied. This may take a few minutes.',
    });
  } catch (error) {
    console.error('Error securing AWS account:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    const status = message.includes('Unauthorized') || message.includes('already') ? 400 : 500;
    res.status(status).json({ error: 'Failed to secure account', details: message });
  }
});

/**
 * GET /api/aws/accounts/:id/status
 * Check guardrail status from Crossplane
 */
router.get('/accounts/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    // Status check doesn't need userId, just checking resource status
    const status = await awsAccountService.checkGuardrailStatus(req.params.id);
    res.json(status);
  } catch (error) {
    console.error('Error checking guardrail status:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to check status', details: message });
  }
});

/**
 * DELETE /api/aws/accounts/:id/guardrails
 * Remove guardrails from an account
 */
router.delete('/accounts/:id/guardrails', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const userId = user?.id || TEST_USER_ID; // Use test user if no auth

    const success = await awsAccountService.removeGuardrails(userId, req.params.id);
    
    if (!success) {
      res.status(404).json({ error: 'Guardrails not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error removing guardrails:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    const status = message.includes('Unauthorized') ? 403 : 500;
    res.status(status).json({ error: 'Failed to remove guardrails', details: message });
  }
});

/**
 * DELETE /api/aws/accounts/:id
 * Unlink an AWS account
 */
router.delete('/accounts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const userId = user?.id || TEST_USER_ID; // Use test user if no auth

    const success = await awsAccountService.unlinkAccount(userId, req.params.id);
    
    if (!success) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error unlinking AWS account:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    const status = message.includes('Unauthorized') ? 403 : 500;
    res.status(status).json({ error: 'Failed to unlink account', details: message });
  }
});

export default router;
