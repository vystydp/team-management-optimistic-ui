import request from 'supertest';
import express, { Application } from 'express';
import accountRequestRoutes from '../../routes/account-request.routes';
import { accountRequestStorage } from '../../services/account-request.storage';
import { User } from '../../types/user';

describe('Account Request Routes', () => {
  let app: Application;
  
  const mockUser: User = {
    id: 'user-1',
    githubId: '12345',
    login: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Attach mock user to all requests
    app.use((req, _res, next) => {
      req.user = mockUser;
      next();
    });
    
    app.use('/api/aws/account-requests', accountRequestRoutes);
  });

  beforeEach(() => {
    accountRequestStorage.clear();
  });

  describe('POST /api/aws/account-requests', () => {
    it('should create new account request', async () => {
      const response = await request(app)
        .post('/api/aws/account-requests')
        .send({
          accountName: 'dev-account',
          ownerEmail: 'dev@example.com',
          purpose: 'development',
          primaryRegion: 'us-west-2',
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.userId).toBe('user-1');
      expect(response.body.accountName).toBe('dev-account');
      expect(response.body.ownerEmail).toBe('dev@example.com');
      expect(response.body.purpose).toBe('development');
      expect(response.body.primaryRegion).toBe('us-west-2');
      expect(response.body.status).toBe('REQUESTED');
    });

    it('should create request with optional guardrail settings', async () => {
      const response = await request(app)
        .post('/api/aws/account-requests')
        .send({
          accountName: 'prod-account',
          ownerEmail: 'prod@example.com',
          purpose: 'production',
          primaryRegion: 'us-east-1',
          budgetAmountUSD: 5000,
          budgetThresholdPercent: 90,
          allowedRegions: ['us-east-1', 'us-west-2'],
        });

      expect(response.status).toBe(201);
      expect(response.body.budgetAmountUSD).toBe(5000);
      expect(response.body.budgetThresholdPercent).toBe(90);
      expect(response.body.allowedRegions).toEqual(['us-east-1', 'us-west-2']);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/aws/account-requests')
        .send({
          accountName: 'test-account',
          // Missing ownerEmail, purpose, primaryRegion
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 if purpose is invalid', async () => {
      const response = await request(app)
        .post('/api/aws/account-requests')
        .send({
          accountName: 'test-account',
          ownerEmail: 'test@example.com',
          purpose: 'invalid-purpose',
          primaryRegion: 'us-west-2',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid purpose');
    });

    it('should return 400 if email format is invalid', async () => {
      const response = await request(app)
        .post('/api/aws/account-requests')
        .send({
          accountName: 'test-account',
          ownerEmail: 'not-an-email',
          purpose: 'development',
          primaryRegion: 'us-west-2',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid email format');
    });
  });

  describe('GET /api/aws/account-requests', () => {
    beforeEach(() => {
      // Create test data for user-1
      accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'account-1',
        ownerEmail: 'a1@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'account-2',
        ownerEmail: 'a2@example.com',
        purpose: 'staging',
        primaryRegion: 'us-east-1',
      });

      // Create request for different user
      accountRequestStorage.create({
        userId: 'user-2',
        accountName: 'account-3',
        ownerEmail: 'a3@example.com',
        purpose: 'production',
        primaryRegion: 'eu-west-1',
      });
    });

    it('should list all requests for current user', async () => {
      const response = await request(app)
        .get('/api/aws/account-requests');

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.requests).toHaveLength(2);
      expect(response.body.requests.every((r: any) => r.userId === 'user-1')).toBe(true);
    });

    it('should filter by status', async () => {
      const req1 = accountRequestStorage.findByUserId('user-1')[0];
      accountRequestStorage.updateStatus(req1.id, 'CREATING');

      const response = await request(app)
        .get('/api/aws/account-requests')
        .query({ status: 'CREATING' });

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.requests[0].status).toBe('CREATING');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/aws/account-requests')
        .query({ limit: 1, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.requests).toHaveLength(1);
    });
  });

  describe('GET /api/aws/account-requests/:id', () => {
    it('should get single account request', async () => {
      const created = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const response = await request(app)
        .get(`/api/aws/account-requests/${created.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(created.id);
      expect(response.body.accountName).toBe('test-account');
    });

    it('should return 404 if request not found', async () => {
      const response = await request(app)
        .get('/api/aws/account-requests/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should return 403 if request belongs to different user', async () => {
      const created = accountRequestStorage.create({
        userId: 'user-2',
        accountName: 'other-account',
        ownerEmail: 'other@example.com',
        purpose: 'production',
        primaryRegion: 'us-east-1',
      });

      const response = await request(app)
        .get(`/api/aws/account-requests/${created.id}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Access denied');
    });
  });

  describe('DELETE /api/aws/account-requests/:id', () => {
    it('should delete account request in REQUESTED state', async () => {
      const created = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const response = await request(app)
        .delete(`/api/aws/account-requests/${created.id}`);

      expect(response.status).toBe(204);

      const found = accountRequestStorage.findById(created.id);
      expect(found).toBeUndefined();
    });

    it('should delete request in CREATING state', async () => {
      const created = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      accountRequestStorage.updateStatus(created.id, 'CREATING');

      const response = await request(app)
        .delete(`/api/aws/account-requests/${created.id}`);

      expect(response.status).toBe(204);
    });

    it('should return 400 if trying to delete READY request', async () => {
      const created = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      accountRequestStorage.updateStatus(created.id, 'READY');

      const response = await request(app)
        .delete(`/api/aws/account-requests/${created.id}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot delete');
    });

    it('should return 400 if trying to delete FAILED request', async () => {
      const created = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      accountRequestStorage.updateStatus(created.id, 'FAILED', 'Test error');

      const response = await request(app)
        .delete(`/api/aws/account-requests/${created.id}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot delete');
    });

    it('should return 404 if request not found', async () => {
      const response = await request(app)
        .delete('/api/aws/account-requests/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should return 403 if request belongs to different user', async () => {
      const created = accountRequestStorage.create({
        userId: 'user-2',
        accountName: 'other-account',
        ownerEmail: 'other@example.com',
        purpose: 'production',
        primaryRegion: 'us-east-1',
      });

      const response = await request(app)
        .delete(`/api/aws/account-requests/${created.id}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Access denied');
    });
  });
});
