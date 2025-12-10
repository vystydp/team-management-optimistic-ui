import express from 'express';
import { accountRequestStorage } from '../services/account-request.storage';
import type { CreateAccountRequestInput } from '../types/aws';
import type { User } from '../types/user';

const router = express.Router();

// Authentication is handled at the app level in server.ts
// req.user is available from requireAuth middleware

/**
 * POST /api/aws/account-request - Create new AWS account request
 * Body: { accountName, ownerEmail, purpose, primaryRegion, budgetAmountUSD?, budgetThresholdPercent?, allowedRegions? }
 */
router.post('/', (req, res) => {
  const user = req.user as User;
  const input = req.body as CreateAccountRequestInput;

  // Validation
  if (!input.accountName || !input.ownerEmail || !input.purpose || !input.primaryRegion) {
    res.status(400).json({ 
      error: 'Missing required fields: accountName, ownerEmail, purpose, primaryRegion' 
    });
    return;
  }

  // Validate purpose
  if (!['development', 'staging', 'production'].includes(input.purpose)) {
    res.status(400).json({ 
      error: 'Invalid purpose. Must be: development, staging, or production' 
    });
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.ownerEmail)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  try {
    const created = accountRequestStorage.create({
      ...input,
      userId: user.id,
    });
    
    res.status(201).json(created);
  } catch (err) {
    console.error('Failed to create account request:', err);
    res.status(500).json({ error: 'Failed to create account request' });
  }
});

/**
 * GET /api/aws/account-requests - List all account requests for current user
 * Query params: status?, limit?, offset?
 */
router.get('/', (req, res) => {
  const user = req.user as User;
  const status = req.query.status as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  try {
    const result = accountRequestStorage.list({
      userId: user.id,
      status: status as AccountRequestStatus | undefined,
      limit,
      offset,
    });
    
    res.json(result);
  } catch (err) {
    console.error('Failed to list account requests:', err);
    res.status(500).json({ error: 'Failed to list account requests' });
  }
});

/**
 * GET /api/aws/account-requests/:id - Get single account request
 */
router.get('/:id', (req, res) => {
  const user = req.user as User;
  const { id } = req.params;

  const request = accountRequestStorage.findById(id);
  
  if (!request) {
    res.status(404).json({ error: 'Account request not found' });
    return;
  }

  // Users can only see their own requests
  if (request.userId !== user.id) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  res.json(request);
});

/**
 * DELETE /api/aws/account-requests/:id - Cancel/delete account request (only if not yet completed)
 */
router.delete('/:id', (req, res) => {
  const user = req.user as User;
  const { id } = req.params;

  const request = accountRequestStorage.findById(id);
  
  if (!request) {
    res.status(404).json({ error: 'Account request not found' });
    return;
  }

  if (request.userId !== user.id) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Can only delete non-terminal states
  if (request.status === 'READY' || request.status === 'FAILED') {
    res.status(400).json({ 
      error: `Cannot delete request in ${request.status} state` 
    });
    return;
  }

  accountRequestStorage.delete(id);
  res.status(204).send();
});

export default router;
