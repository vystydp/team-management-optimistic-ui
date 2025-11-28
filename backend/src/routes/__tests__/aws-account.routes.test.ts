/**
 * Unit tests for AWS account API routes
 * Tests HTTP endpoints and request validation
 */

import request from 'supertest';
import express from 'express';
import awsAccountRoutes from '../aws-account.routes';
import { awsAccountService } from '../../services/aws-account.service';

// Mock the service
jest.mock('../../services/aws-account.service');

describe('AWS Account Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req, _res, next) => {
      req.user = {
        id: 'test-user-123',
        githubId: 'github-123',
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      next();
    });

    app.use('/api/aws', awsAccountRoutes);
  });

  describe('POST /api/aws/link-account', () => {
    const validRequest = {
      accountId: '123456789012',
      accountName: 'Test Account',
      roleArn: 'arn:aws:iam::123456789012:role/CrossplaneRole',
      ownerEmail: 'test@example.com',
    };

    it('should link account successfully', async () => {
      const mockAccount = {
        id: 'acc-123',
        ...validRequest,
        type: 'linked' as const,
        status: 'linked' as const,
        userId: 'test-user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (awsAccountService.linkAccount as jest.Mock).mockResolvedValue(mockAccount);

      const response = await request(app)
        .post('/api/aws/link-account')
        .send(validRequest)
        .expect(201);

      expect(response.body).toMatchObject({
        account: expect.objectContaining({
          id: 'acc-123',
          accountId: '123456789012',
        }),
        message: 'AWS account linked successfully',
      });
    });

    it('should return 400 for duplicate account', async () => {
      (awsAccountService.linkAccount as jest.Mock).mockRejectedValue(
        new Error('Account with ID 123456789012 is already linked')
      );

      await request(app)
        .post('/api/aws/link-account')
        .send(validRequest)
        .expect(400);
    });

    it('should return 400 for validation errors', async () => {
      (awsAccountService.linkAccount as jest.Mock).mockRejectedValue(
        new Error('Validation failed: Invalid account ID')
      );

      await request(app)
        .post('/api/aws/link-account')
        .send({ ...validRequest, accountId: '12345' })
        .expect(400);
    });

    it('should return 500 for server errors', async () => {
      (awsAccountService.linkAccount as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await request(app)
        .post('/api/aws/link-account')
        .send(validRequest)
        .expect(500);
    });
  });

  describe('GET /api/aws/accounts', () => {
    it('should return list of accounts', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          accountId: '111111111111',
          accountName: 'Account 1',
          status: 'linked' as const,
        },
        {
          id: 'acc-2',
          accountId: '222222222222',
          accountName: 'Account 2',
          status: 'guardrailed' as const,
        },
      ];

      (awsAccountService.listAccounts as jest.Mock).mockResolvedValue(mockAccounts);

      const response = await request(app)
        .get('/api/aws/accounts')
        .expect(200);

      expect(response.body.accounts).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should return empty array when no accounts', async () => {
      (awsAccountService.listAccounts as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/aws/accounts')
        .expect(200);

      expect(response.body.accounts).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('POST /api/aws/secure-account', () => {
    it('should start guardrailing process', async () => {
      const mockAccount = {
        id: 'acc-123',
        accountId: '123456789012',
        status: 'guardrailing' as const,
        guardrailClaimName: 'guardrailed-aws-123456789012',
      };

      (awsAccountService.secureAccount as jest.Mock).mockResolvedValue(mockAccount);

      const response = await request(app)
        .post('/api/aws/secure-account')
        .send({ accountId: '123456789012' })
        .expect(200);

      expect(response.body).toMatchObject({
        account: expect.objectContaining({
          status: 'guardrailing',
        }),
        claimName: 'guardrailed-aws-123456789012',
        message: expect.stringContaining('Guardrails are being applied'),
      });
    });

    it('should return 400 for already secured account', async () => {
      (awsAccountService.secureAccount as jest.Mock).mockRejectedValue(
        new Error('Account is already being secured or is secured')
      );

      await request(app)
        .post('/api/aws/secure-account')
        .send({ accountId: '123456789012' })
        .expect(400);
    });
  });

  describe('GET /api/aws/accounts/:id/status', () => {
    it('should return guardrail status', async () => {
      (awsAccountService.checkGuardrailStatus as jest.Mock).mockResolvedValue({
        status: 'guardrailed',
      });

      const response = await request(app)
        .get('/api/aws/accounts/acc-123/status')
        .expect(200);

      expect(response.body.status).toBe('guardrailed');
    });

    it('should return error status', async () => {
      (awsAccountService.checkGuardrailStatus as jest.Mock).mockResolvedValue({
        status: 'error',
        errorMessage: 'Failed to create CloudTrail',
      });

      const response = await request(app)
        .get('/api/aws/accounts/acc-123/status')
        .expect(200);

      expect(response.body.status).toBe('error');
      expect(response.body.errorMessage).toBe('Failed to create CloudTrail');
    });
  });

  describe('DELETE /api/aws/accounts/:id', () => {
    it('should unlink account successfully', async () => {
      (awsAccountService.unlinkAccount as jest.Mock).mockResolvedValue(true);

      await request(app)
        .delete('/api/aws/accounts/acc-123')
        .expect(204);
    });

    it('should return 404 if account not found', async () => {
      (awsAccountService.unlinkAccount as jest.Mock).mockResolvedValue(false);

      await request(app)
        .delete('/api/aws/accounts/acc-999')
        .expect(404);
    });
  });

  describe('DELETE /api/aws/accounts/:id/guardrails', () => {
    it('should remove guardrails successfully', async () => {
      (awsAccountService.removeGuardrails as jest.Mock).mockResolvedValue(true);

      await request(app)
        .delete('/api/aws/accounts/acc-123/guardrails')
        .expect(204);
    });

    it('should return 404 if guardrails not found', async () => {
      (awsAccountService.removeGuardrails as jest.Mock).mockResolvedValue(false);

      await request(app)
        .delete('/api/aws/accounts/acc-123/guardrails')
        .expect(404);
    });

    it('should return 403 for unauthorized access', async () => {
      (awsAccountService.removeGuardrails as jest.Mock).mockRejectedValue(
        new Error('Unauthorized')
      );

      await request(app)
        .delete('/api/aws/accounts/acc-123/guardrails')
        .expect(403);
    });
  });
});
