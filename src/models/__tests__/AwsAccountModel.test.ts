import { AwsAccountRefModel, AccountRequestModel } from '../AwsAccountModel';
import { AwsAccountRef, AccountRequest } from '../../types/aws';

describe('AwsAccountRefModel', () => {
  const validAccountData = {
    id: 'acc-123',
    accountId: '123456789012',
    accountName: 'Test Account',
    roleArn: 'arn:aws:iam::123456789012:role/CrossplaneRole',
    type: 'linked' as const,
    status: 'linked' as const,
    ownerEmail: 'test@example.com',
  };

  describe('validation', () => {
    it('should validate correct account data', () => {
      const model = new AwsAccountRefModel(validAccountData);
      const result = model.validate();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid account ID', () => {
      const model = new AwsAccountRefModel({
        ...validAccountData,
        accountId: '12345', // Too short
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Account ID must be exactly 12 digits');
    });

    it('should reject account name too short', () => {
      const model = new AwsAccountRefModel({
        ...validAccountData,
        accountName: 'ab',
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Account name must be at least 3 characters');
    });

    it('should reject account name too long', () => {
      const model = new AwsAccountRefModel({
        ...validAccountData,
        accountName: 'a'.repeat(101),
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Account name must not exceed 100 characters');
    });

    it('should reject invalid role ARN', () => {
      const model = new AwsAccountRefModel({
        ...validAccountData,
        roleArn: 'invalid-arn',
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid IAM role ARN format');
    });

    it('should reject invalid owner email', () => {
      const model = new AwsAccountRefModel({
        ...validAccountData,
        ownerEmail: 'not-an-email',
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid owner email address');
    });
  });

  describe('status management', () => {
    it('should update status to guardrailed', () => {
      const model = new AwsAccountRefModel(validAccountData);
      const updated = model.markAsGuardrailed();
      
      expect(updated.toJSON().status).toBe('guardrailed');
      expect(updated.isReady()).toBe(true);
      expect(updated.hasError()).toBe(false);
    });

    it('should mark as error with message', () => {
      const model = new AwsAccountRefModel(validAccountData);
      const errorMsg = 'Failed to apply guardrails';
      const updated = model.markAsError(errorMsg);
      
      expect(updated.toJSON().status).toBe('error');
      expect(updated.toJSON().errorMessage).toBe(errorMsg);
      expect(updated.hasError()).toBe(true);
      expect(updated.isReady()).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const model = new AwsAccountRefModel(validAccountData);
      const json = model.toJSON();
      
      expect(json.id).toBe(validAccountData.id);
      expect(json.accountId).toBe(validAccountData.accountId);
      expect(json.createdAt).toBeInstanceOf(Date);
      expect(json.updatedAt).toBeInstanceOf(Date);
    });

    it('should deserialize from JSON', () => {
      const accountData: AwsAccountRef = {
        ...validAccountData,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };
      
      const model = AwsAccountRefModel.fromJSON(accountData);
      const json = model.toJSON();
      
      expect(json.id).toBe(accountData.id);
      expect(json.createdAt).toEqual(new Date('2025-01-01'));
      expect(json.updatedAt).toEqual(new Date('2025-01-02'));
    });
  });
});

describe('AccountRequestModel', () => {
  const validRequestData = {
    id: 'req-123',
    requestedBy: 'user-456',
    accountName: 'Development Account',
    accountEmail: 'dev@example.com',
    purpose: 'Development environment for team alpha',
    region: 'us-east-1',
  };

  describe('validation', () => {
    it('should validate correct request data', () => {
      const model = new AccountRequestModel(validRequestData);
      const result = model.validate();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject account name too short', () => {
      const model = new AccountRequestModel({
        ...validRequestData,
        accountName: 'ab',
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Account name must be at least 3 characters');
    });

    it('should reject invalid account email', () => {
      const model = new AccountRequestModel({
        ...validRequestData,
        accountEmail: 'not-an-email',
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid account email address');
    });

    it('should reject purpose too short', () => {
      const model = new AccountRequestModel({
        ...validRequestData,
        purpose: 'Too short',
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Purpose must be at least 10 characters');
    });

    it('should reject invalid region', () => {
      const model = new AccountRequestModel({
        ...validRequestData,
        region: 'invalid-region',
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid AWS region');
    });

    it('should reject TTL in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const model = new AccountRequestModel({
        ...validRequestData,
        ttl: pastDate,
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('TTL must be a future date');
    });

    it('should reject TTL more than 90 days in future', () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 91);
      
      const model = new AccountRequestModel({
        ...validRequestData,
        ttl: farFuture,
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('TTL cannot be more than 90 days in the future');
    });
  });

  describe('state machine', () => {
    it('should start in REQUESTED state', () => {
      const model = new AccountRequestModel(validRequestData);
      expect(model.toJSON().status).toBe('REQUESTED');
    });

    it('should transition through valid states', () => {
      let model = new AccountRequestModel(validRequestData);
      
      // REQUESTED -> VALIDATING
      model = model.startValidation();
      expect(model.toJSON().status).toBe('VALIDATING');
      
      // VALIDATING -> CREATING
      model = model.startCreation();
      expect(model.toJSON().status).toBe('CREATING');
      
      // Set AWS account ID
      model = model.setAwsAccountId('123456789012');
      expect(model.toJSON().awsAccountId).toBe('123456789012');
      
      // CREATING -> GUARDRAILING
      model = model.startGuardrailing();
      expect(model.toJSON().status).toBe('GUARDRAILING');
      
      // GUARDRAILING -> READY
      const accountRef: AwsAccountRef = {
        id: 'acc-789',
        accountId: '123456789012',
        accountName: 'Test Account',
        roleArn: 'arn:aws:iam::123456789012:role/Role',
        type: 'managed',
        status: 'guardrailed',
        ownerEmail: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      model = model.markAsReady(accountRef);
      expect(model.toJSON().status).toBe('READY');
      expect(model.isComplete()).toBe(true);
      expect(model.isSuccessful()).toBe(true);
    });

    it('should fail from any state', () => {
      const model = new AccountRequestModel(validRequestData);
      const failed = model.markAsFailed('Test error');
      
      expect(failed.toJSON().status).toBe('FAILED');
      expect(failed.toJSON().errorMessage).toBe('Test error');
      expect(failed.isComplete()).toBe(true);
      expect(failed.hasFailed()).toBe(true);
    });

    it('should reject invalid state transitions', () => {
      const model = new AccountRequestModel(validRequestData);
      
      // Can't go directly from REQUESTED to CREATING
      expect(() => model.startCreation()).toThrow();
    });

    it('should reject guardrailing without AWS account ID', () => {
      let model = new AccountRequestModel(validRequestData);
      model = model.startValidation();
      model = model.startCreation();
      
      // Try to guardrail without setting account ID
      expect(() => model.startGuardrailing()).toThrow('Cannot start guardrailing without AWS account ID');
    });

    it('should reject invalid AWS account ID format', () => {
      const model = new AccountRequestModel(validRequestData);
      
      expect(() => model.setAwsAccountId('invalid')).toThrow('Invalid AWS account ID format');
    });
  });

  describe('progress tracking', () => {
    it('should calculate progress correctly', () => {
      let model = new AccountRequestModel(validRequestData);
      expect(model.getProgress()).toBe(0);
      
      model = model.startValidation();
      expect(model.getProgress()).toBe(20);
      
      model = model.startCreation();
      expect(model.getProgress()).toBe(40);
      
      model = model.setAwsAccountId('123456789012');
      model = model.startGuardrailing();
      expect(model.getProgress()).toBe(70);
    });

    it('should provide status messages', () => {
      let model = new AccountRequestModel(validRequestData);
      expect(model.getStatusMessage()).toContain('submitted');
      
      model = model.startValidation();
      expect(model.getStatusMessage()).toContain('Validating');
      
      model = model.startCreation();
      expect(model.getStatusMessage()).toContain('Creating');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const model = new AccountRequestModel(validRequestData);
      const json = model.toJSON();
      
      expect(json.id).toBe(validRequestData.id);
      expect(json.accountName).toBe(validRequestData.accountName);
      expect(json.status).toBe('REQUESTED');
      expect(json.createdAt).toBeInstanceOf(Date);
    });

    it('should deserialize from JSON', () => {
      const requestData: AccountRequest = {
        ...validRequestData,
        status: 'CREATING',
        awsAccountId: '123456789012',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };
      
      const model = AccountRequestModel.fromJSON(requestData);
      const json = model.toJSON();
      
      expect(json.status).toBe('CREATING');
      expect(json.awsAccountId).toBe('123456789012');
      expect(json.createdAt).toEqual(new Date('2025-01-01'));
    });
  });
});
