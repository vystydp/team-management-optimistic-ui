/**
 * Environments Service
 * Handles API communication for team environments
 * 
 * Phase 2.8: Real backend integration with conditional MSW fallback
 */

import type { TeamEnvironment } from '../types/aws';

const USE_REAL_BACKEND = import.meta.env.VITE_USE_REAL_BACKEND === 'true';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface CreateEnvironmentRequest {
  name: string;
  teamId: string;
  templateType: 'sandbox' | 'development' | 'staging' | 'production';
  size: 'small' | 'medium' | 'large' | 'xlarge';
  ttlDays?: number;
  enableDatabase?: boolean;
  databaseEngine?: 'postgres' | 'mysql';
  enableCache?: boolean;
}

export interface UpdateEnvironmentRequest {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  status?: 'READY' | 'PAUSED';
}

export interface EnvironmentListResponse {
  environments: TeamEnvironment[];
  total: number;
}

/**
 * List all environments
 */
export async function listEnvironments(): Promise<EnvironmentListResponse> {
  if (!USE_REAL_BACKEND) {
    // Fallback to MSW handlers (Phase 1 mock)
    const response = await fetch('/api/environments');
    if (!response.ok) throw new Error('Failed to fetch environments');
    return response.json();
  }

  // Phase 2: Real backend API
  const response = await fetch(`${BACKEND_URL}/api/environments`);
  if (!response.ok) {
    throw new Error(`Failed to fetch environments: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get a single environment by ID
 */
export async function getEnvironment(id: string): Promise<TeamEnvironment | null> {
  if (!USE_REAL_BACKEND) {
    const response = await fetch(`/api/environments/${id}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Environment not found');
    return response.json();
  }

  const response = await fetch(`${BACKEND_URL}/api/environments/${id}`);
  if (response.status === 404) {
    // Environment not yet created in K8s - this is expected during CREATING status
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch environment: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Create a new environment
 * Returns the created environment with CREATING status
 */
export async function createEnvironment(
  data: CreateEnvironmentRequest
): Promise<TeamEnvironment> {
  if (!USE_REAL_BACKEND) {
    const response = await fetch('/api/environments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create environment');
    return response.json();
  }

  const response = await fetch(`${BACKEND_URL}/api/environments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to create environment');
  }
  
  return response.json();
}

/**
 * Update an environment (e.g., change size)
 */
export async function updateEnvironment(
  id: string,
  data: UpdateEnvironmentRequest
): Promise<TeamEnvironment> {
  if (!USE_REAL_BACKEND) {
    const response = await fetch(`/api/environments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update environment');
    return response.json();
  }

  const response = await fetch(`${BACKEND_URL}/api/environments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update environment: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Delete an environment
 */
export async function deleteEnvironment(id: string): Promise<void> {
  if (!USE_REAL_BACKEND) {
    const response = await fetch(`/api/environments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete environment');
    return;
  }

  const response = await fetch(`${BACKEND_URL}/api/environments/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete environment: ${response.statusText}`);
  }
}

/**
 * Pause an environment (scale to zero)
 */
export async function pauseEnvironment(id: string): Promise<TeamEnvironment> {
  return updateEnvironment(id, { status: 'PAUSED' });
}

/**
 * Resume a paused environment
 */
export async function resumeEnvironment(id: string): Promise<TeamEnvironment> {
  return updateEnvironment(id, { status: 'READY' });
}
