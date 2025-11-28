import type { 
  AccountRequest, 
  CreateAccountRequestInput, 
  ListAccountRequestsResponse 
} from '../types/account-request';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Helper to create authenticated request headers
 */
function getAuthHeaders(): HeadersInit {
  const token = authService.getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Account Request API service
 */
export const accountRequestService = {
  /**
   * Create a new AWS account request
   */
  async createAccountRequest(input: CreateAccountRequestInput): Promise<AccountRequest> {
    const response = await fetch(`${API_BASE_URL}/api/aws/account-requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create account request' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Get all account requests for current user
   */
  async listAccountRequests(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ListAccountRequestsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${API_BASE_URL}/api/aws/account-requests${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Get single account request by ID
   */
  async getAccountRequest(id: string): Promise<AccountRequest> {
    const response = await fetch(`${API_BASE_URL}/api/aws/account-requests/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Account request not found');
      }
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Cancel/delete account request (only if not completed)
   */
  async deleteAccountRequest(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/aws/account-requests/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete account request' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
  },

  /**
   * Poll for account request status updates
   * Returns the updated request or null if not found
   */
  async pollAccountRequestStatus(id: string): Promise<AccountRequest | null> {
    try {
      return await this.getAccountRequest(id);
    } catch (error) {
      if (error instanceof Error && error.message === 'Account request not found') {
        return null;
      }
      throw error;
    }
  },
};
