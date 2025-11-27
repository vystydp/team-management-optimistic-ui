import { EnvironmentTemplateModel, TeamEnvironmentModel } from '../EnvironmentModel';
import { EnvironmentTemplate, TeamEnvironment } from '../../types/aws';

describe('EnvironmentTemplateModel', () => {
  const validTemplate: EnvironmentTemplate = {
    id: 'tpl-sandbox-1',
    name: 'Standard Sandbox',
    description: 'Basic sandbox environment for development and testing',
    type: 'sandbox',
    version: '1.0.0',
    parameters: {
      size: 'small',
      region: 'us-east-1',
    },
    allowedRegions: ['us-east-1', 'us-west-2', 'eu-west-1'],
    allowedSizes: ['small', 'medium'],
    estimatedCost: {
      hourly: 0.50,
      monthly: 365,
    },
    resources: ['VPC', 'ECS', 'RDS'],
    tags: ['sandbox', 'development'],
  };

  describe('validation', () => {
    it('should validate correct template data', () => {
      const model = new EnvironmentTemplateModel(validTemplate);
      const result = model.validate();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject template name too short', () => {
      const model = new EnvironmentTemplateModel({
        ...validTemplate,
        name: 'ab',
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template name must be at least 3 characters');
    });

    it('should reject description too short', () => {
      const model = new EnvironmentTemplateModel({
        ...validTemplate,
        description: 'Too short',
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template description must be at least 10 characters');
    });

    it('should reject invalid type', () => {
      const model = new EnvironmentTemplateModel({
        ...validTemplate,
        // @ts-expect-error Testing invalid type
        type: 'invalid',
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid type');
    });

    it('should reject invalid version format', () => {
      const model = new EnvironmentTemplateModel({
        ...validTemplate,
        version: '1.0',
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Version must follow semantic versioning (e.g., 1.0.0)');
    });

    it('should reject empty allowed regions', () => {
      const model = new EnvironmentTemplateModel({
        ...validTemplate,
        allowedRegions: [],
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one allowed region must be specified');
    });

    it('should reject empty allowed sizes', () => {
      const model = new EnvironmentTemplateModel({
        ...validTemplate,
        allowedSizes: [],
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one allowed size must be specified');
    });

    it('should reject invalid sizes', () => {
      const model = new EnvironmentTemplateModel({
        ...validTemplate,
        // @ts-expect-error Testing invalid size
        allowedSizes: ['small', 'invalid'],
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid sizes');
    });

    it('should reject negative costs', () => {
      const model = new EnvironmentTemplateModel({
        ...validTemplate,
        estimatedCost: { hourly: -1, monthly: 100 },
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Estimated costs cannot be negative');
    });

    it('should reject empty resources', () => {
      const model = new EnvironmentTemplateModel({
        ...validTemplate,
        resources: [],
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one resource must be specified');
    });
  });

  describe('utility methods', () => {
    it('should check if region is supported', () => {
      const model = new EnvironmentTemplateModel(validTemplate);
      
      expect(model.supportsRegion('us-east-1')).toBe(true);
      expect(model.supportsRegion('ap-southeast-1')).toBe(false);
    });

    it('should check if size is supported', () => {
      const model = new EnvironmentTemplateModel(validTemplate);
      
      expect(model.supportsSize('small')).toBe(true);
      expect(model.supportsSize('xlarge')).toBe(false);
    });

    it('should calculate estimated cost for different sizes', () => {
      const model = new EnvironmentTemplateModel(validTemplate);
      
      expect(model.getEstimatedCost('small')).toBe(365);
      expect(model.getEstimatedCost('medium')).toBe(730);
      expect(model.getEstimatedCost('large')).toBe(1460);
      expect(model.getEstimatedCost('xlarge')).toBe(2920);
    });

    it('should identify production templates', () => {
      const prodTemplate = { ...validTemplate, type: 'production' as const };
      const model = new EnvironmentTemplateModel(prodTemplate);
      
      expect(model.isProduction()).toBe(true);
      
      const sandboxModel = new EnvironmentTemplateModel(validTemplate);
      expect(sandboxModel.isProduction()).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const model = new EnvironmentTemplateModel(validTemplate);
      const json = model.toJSON();
      
      expect(json.id).toBe(validTemplate.id);
      expect(json.name).toBe(validTemplate.name);
      expect(json.type).toBe(validTemplate.type);
    });

    it('should deserialize from JSON', () => {
      const model = EnvironmentTemplateModel.fromJSON(validTemplate);
      const json = model.toJSON();
      
      expect(json).toEqual(validTemplate);
    });
  });
});

describe('TeamEnvironmentModel', () => {
  const validEnvironment = {
    id: 'env-123',
    name: 'Alpha Team Sandbox',
    teamId: 'team-456',
    templateId: 'tpl-sandbox-1',
    awsAccountId: '123456789012',
    parameters: {
      size: 'small' as const,
      region: 'us-east-1',
      enableAutoScaling: true,
      minInstances: 1,
      maxInstances: 5,
      enableMonitoring: true,
      enableBackups: false,
    },
    resourcesProvisioned: [],
    createdBy: 'user-789',
  };

  describe('validation', () => {
    it('should validate correct environment data', () => {
      const model = new TeamEnvironmentModel(validEnvironment);
      const result = model.validate();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject environment name too short', () => {
      const model = new TeamEnvironmentModel({
        ...validEnvironment,
        name: 'ab',
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Environment name must be at least 3 characters');
    });

    it('should reject invalid AWS account ID', () => {
      const model = new TeamEnvironmentModel({
        ...validEnvironment,
        awsAccountId: '12345', // Too short
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('AWS account ID must be exactly 12 digits');
    });

    it('should reject invalid size', () => {
      const model = new TeamEnvironmentModel({
        ...validEnvironment,
        // @ts-expect-error Testing invalid size
        parameters: { ...validEnvironment.parameters, size: 'invalid' },
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid size');
    });

    it('should reject invalid region', () => {
      const model = new TeamEnvironmentModel({
        ...validEnvironment,
        parameters: { ...validEnvironment.parameters, region: 'invalid-region' },
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid AWS region');
    });

    it('should reject TTL in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const model = new TeamEnvironmentModel({
        ...validEnvironment,
        parameters: { ...validEnvironment.parameters, ttl: pastDate },
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('TTL must be a future date');
    });

    it('should reject auto-scaling without min/max instances', () => {
      const model = new TeamEnvironmentModel({
        ...validEnvironment,
        parameters: {
          ...validEnvironment.parameters,
          enableAutoScaling: true,
          minInstances: undefined,
          maxInstances: undefined,
        },
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Auto-scaling requires minInstances and maxInstances');
    });

    it('should reject minInstances greater than maxInstances', () => {
      const model = new TeamEnvironmentModel({
        ...validEnvironment,
        parameters: {
          ...validEnvironment.parameters,
          minInstances: 10,
          maxInstances: 5,
        },
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('minInstances cannot exceed maxInstances');
    });

    it('should reject maxInstances over 100', () => {
      const model = new TeamEnvironmentModel({
        ...validEnvironment,
        parameters: {
          ...validEnvironment.parameters,
          maxInstances: 101,
        },
      });
      const result = model.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxInstances cannot exceed 100');
    });
  });

  describe('state machine', () => {
    it('should start in REQUESTED state', () => {
      const model = new TeamEnvironmentModel(validEnvironment);
      expect(model.toJSON().status).toBe('REQUESTED');
    });

    it('should transition through creation states', () => {
      let model = new TeamEnvironmentModel(validEnvironment);
      
      // REQUESTED -> VALIDATING
      model = model.startValidation();
      expect(model.toJSON().status).toBe('VALIDATING');
      
      // VALIDATING -> CREATING
      model = model.startCreation();
      expect(model.toJSON().status).toBe('CREATING');
      
      // CREATING -> READY
      model = model.markAsReady({ api: 'https://api.example.com' });
      expect(model.toJSON().status).toBe('READY');
      expect(model.toJSON().health).toBe('healthy');
      expect(model.toJSON().endpoints).toEqual({ api: 'https://api.example.com' });
      expect(model.isReady()).toBe(true);
    });

    it('should handle pause/resume cycle', () => {
      let model = new TeamEnvironmentModel({ ...validEnvironment, status: 'READY' });
      
      // READY -> PAUSING
      model = model.pause();
      expect(model.toJSON().status).toBe('PAUSING');
      
      // PAUSING -> PAUSED
      model = model.markAsPaused();
      expect(model.toJSON().status).toBe('PAUSED');
      expect(model.toJSON().health).toBeUndefined();
      expect(model.isPaused()).toBe(true);
      
      // PAUSED -> RESUMING
      model = model.resume();
      expect(model.toJSON().status).toBe('RESUMING');
      
      // RESUMING -> READY
      model = model.markAsReady();
      expect(model.toJSON().status).toBe('READY');
    });

    it('should handle update cycle', () => {
      let model = new TeamEnvironmentModel({ ...validEnvironment, status: 'READY' });
      
      // READY -> UPDATING
      model = model.startUpdate({ size: 'medium' });
      expect(model.toJSON().status).toBe('UPDATING');
      expect(model.toJSON().parameters.size).toBe('medium');
      
      // UPDATING -> READY
      model = model.markAsReady();
      expect(model.toJSON().status).toBe('READY');
    });

    it('should handle error states', () => {
      const model = new TeamEnvironmentModel(validEnvironment);
      const errorMsg = 'Failed to provision VPC';
      const failed = model.markAsError(errorMsg);
      
      expect(failed.toJSON().status).toBe('ERROR');
      expect(failed.toJSON().errorMessage).toBe(errorMsg);
      expect(failed.toJSON().health).toBe('unhealthy');
      expect(failed.hasError()).toBe(true);
    });

    it('should handle deletion', () => {
      let model = new TeamEnvironmentModel({ ...validEnvironment, status: 'READY' });
      
      // READY -> DELETING
      model = model.startDeletion();
      expect(model.toJSON().status).toBe('DELETING');
      
      // DELETING -> DELETED
      model = model.markAsDeleted();
      expect(model.toJSON().status).toBe('DELETED');
      expect(model.isDeleted()).toBe(true);
    });

    it('should reject invalid state transitions', () => {
      const model = new TeamEnvironmentModel(validEnvironment);
      
      // Can't go directly from REQUESTED to CREATING
      expect(() => model.startCreation()).toThrow();
    });

    it('should allow retry from ERROR state', () => {
      const model = new TeamEnvironmentModel({ ...validEnvironment, status: 'ERROR' });
      
      // ERROR -> UPDATING (retry)
      const updated = model.startUpdate({ size: 'small' });
      expect(updated.toJSON().status).toBe('UPDATING');
    });
  });

  describe('utility methods', () => {
    it('should check if environment can be modified', () => {
      const readyModel = new TeamEnvironmentModel({ ...validEnvironment, status: 'READY' });
      expect(readyModel.canModify()).toBe(true);
      
      const errorModel = new TeamEnvironmentModel({ ...validEnvironment, status: 'ERROR' });
      expect(errorModel.canModify()).toBe(true);
      
      const creatingModel = new TeamEnvironmentModel({ ...validEnvironment, status: 'CREATING' });
      expect(creatingModel.canModify()).toBe(false);
    });

    it('should calculate progress correctly', () => {
      expect(new TeamEnvironmentModel({ ...validEnvironment, status: 'REQUESTED' }).getProgress()).toBe(0);
      expect(new TeamEnvironmentModel({ ...validEnvironment, status: 'VALIDATING' }).getProgress()).toBe(10);
      expect(new TeamEnvironmentModel({ ...validEnvironment, status: 'CREATING' }).getProgress()).toBe(50);
      expect(new TeamEnvironmentModel({ ...validEnvironment, status: 'READY' }).getProgress()).toBe(100);
    });

    it('should provide status messages', () => {
      let model = new TeamEnvironmentModel(validEnvironment);
      expect(model.getStatusMessage()).toContain('requested');
      
      model = model.startValidation();
      expect(model.getStatusMessage()).toContain('Validating');
      
      model = model.startCreation();
      expect(model.getStatusMessage()).toContain('Creating');
    });

    it('should update reconciliation info', () => {
      const model = new TeamEnvironmentModel({ ...validEnvironment, status: 'READY' });
      const updated = model.updateReconciliation('healthy');
      
      expect(updated.toJSON().lastReconciled).toBeInstanceOf(Date);
      expect(updated.toJSON().health).toBe('healthy');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const model = new TeamEnvironmentModel(validEnvironment);
      const json = model.toJSON();
      
      expect(json.id).toBe(validEnvironment.id);
      expect(json.name).toBe(validEnvironment.name);
      expect(json.status).toBe('REQUESTED');
      expect(json.createdAt).toBeInstanceOf(Date);
      expect(json.updatedAt).toBeInstanceOf(Date);
    });

    it('should deserialize from JSON', () => {
      const envData: TeamEnvironment = {
        ...validEnvironment,
        status: 'READY',
        health: 'healthy',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        lastReconciled: new Date('2025-01-02'),
      };
      
      const model = TeamEnvironmentModel.fromJSON(envData);
      const json = model.toJSON();
      
      expect(json.status).toBe('READY');
      expect(json.health).toBe('healthy');
      expect(json.createdAt).toEqual(new Date('2025-01-01'));
      expect(json.lastReconciled).toEqual(new Date('2025-01-02'));
    });
  });
});
