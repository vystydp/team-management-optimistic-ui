import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
import {
  listEnvironments,
  getEnvironment,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
} from './environments.service';
import type {
  CreateEnvironmentRequest,
  UpdateEnvironmentRequest,
  EnvironmentListResponse,
} from './types';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/environments - List all environments
app.get('/api/environments', async (req: Request, res: Response) => {
  try {
    const environments = await listEnvironments();
    const response: EnvironmentListResponse = {
      environments,
      total: environments.length,
    };
    res.json(response);
  } catch (error: any) {
    console.error('Error listing environments:', error);
    res.status(500).json({
      error: 'Failed to list environments',
      message: error.message,
    });
  }
});

// GET /api/environments/:id - Get single environment
app.get('/api/environments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const environment = await getEnvironment(id);

    if (!environment) {
      res.status(404).json({ error: 'Environment not found' });
      return;
    }

    res.json(environment);
  } catch (error: any) {
    console.error(`Error getting environment ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to get environment',
      message: error.message,
    });
  }
});

// POST /api/environments - Create new environment
app.post('/api/environments', async (req: Request, res: Response) => {
  try {
    const createReq: CreateEnvironmentRequest = req.body;

    // Validation
    if (!createReq.name || !createReq.teamId || !createReq.templateType) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'teamId', 'templateType'],
      });
      return;
    }

    const environment = await createEnvironment(createReq);
    res.status(201).json(environment);
  } catch (error: any) {
    console.error('Error creating environment:', error);
    res.status(500).json({
      error: 'Failed to create environment',
      message: error.message,
    });
  }
});

// PATCH /api/environments/:id - Update environment
app.patch('/api/environments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: UpdateEnvironmentRequest = req.body;

    const environment = await updateEnvironment(id, updates);

    if (!environment) {
      res.status(404).json({ error: 'Environment not found' });
      return;
    }

    res.json(environment);
  } catch (error: any) {
    console.error(`Error updating environment ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to update environment',
      message: error.message,
    });
  }
});

// DELETE /api/environments/:id - Delete environment
app.delete('/api/environments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteEnvironment(id);

    if (!deleted) {
      res.status(404).json({ error: 'Environment not found' });
      return;
    }

    res.status(204).send();
  } catch (error: any) {
    console.error(`Error deleting environment ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to delete environment',
      message: error.message,
    });
  }
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Team Management Backend running on http://localhost:${PORT}`);
  console.log(`   Kubernetes context: ${process.env.KUBE_CONTEXT || 'default'}`);
  console.log(`   App namespace: ${process.env.APP_NAMESPACE || 'team-environments'}`);
  console.log(`\n📡 API Endpoints:`);
  console.log(`   GET    /health`);
  console.log(`   GET    /api/environments`);
  console.log(`   GET    /api/environments/:id`);
  console.log(`   POST   /api/environments`);
  console.log(`   PATCH  /api/environments/:id`);
  console.log(`   DELETE /api/environments/:id`);
});

export default app;
