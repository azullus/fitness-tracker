/**
 * Tests for DELETE /api/persons
 *
 * Tests person deletion authorization in different modes:
 * - SQLite mode: authenticated users can delete any person
 * - Demo mode: all deletions allowed
 * - Supabase mode: only household members can delete
 */

import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/persons/route';

// Mock dependencies
jest.mock('@/lib/database', () => ({
  isSQLiteEnabled: jest.fn(),
  deletePerson: jest.fn(),
  getPersonById: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(),
  getSupabase: jest.fn(),
}));

jest.mock('@/lib/csrf', () => ({
  withCSRFProtection: jest.fn(() => ({ shouldSetToken: false })),
}));

jest.mock('@/lib/rate-limit', () => ({
  applyRateLimit: jest.fn(() => null),
  RateLimitPresets: {
    DELETE: { limit: 20, windowMs: 60000 },
  },
}));

jest.mock('@/lib/api-auth', () => ({
  authenticateRequest: jest.fn(),
  authorizePersonAccess: jest.fn(),
}));

import { isSQLiteEnabled, deletePerson, getPersonById } from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import { authenticateRequest, authorizePersonAccess } from '@/lib/api-auth';

describe('DELETE /api/persons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SQLite Mode - Authenticated User', () => {
    beforeEach(() => {
      (isSQLiteEnabled as jest.Mock).mockReturnValue(true);
      (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
      (authenticateRequest as jest.Mock).mockResolvedValue({
        auth: {
          authenticated: true,
          isDemoMode: false,
          userId: 'user-123',
          householdId: 'household-123',
        },
      });
      (authorizePersonAccess as jest.Mock).mockResolvedValue({ authorized: true });
    });

    it('should allow authenticated user to delete person in SQLite mode', async () => {
      (deletePerson as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/persons?id=person-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Person deleted successfully');
      expect(deletePerson).toHaveBeenCalledWith('person-1');
    });

    it('should return 404 if person not found in SQLite', async () => {
      (deletePerson as jest.Mock).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/persons?id=person-999', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Person not found');
    });

    it('should return 400 if person ID is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/persons', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('id query parameter is required');
    });
  });

  describe('Demo Mode', () => {
    beforeEach(() => {
      (isSQLiteEnabled as jest.Mock).mockReturnValue(false);
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
      (authenticateRequest as jest.Mock).mockResolvedValue({
        auth: {
          authenticated: true,
          isDemoMode: true,
        },
      });
      (authorizePersonAccess as jest.Mock).mockResolvedValue({ authorized: true });
    });

    it('should return 503 when trying to delete in demo mode', async () => {
      const request = new NextRequest('http://localhost:3000/api/persons?id=person-demo', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database not configured. Running in demo mode.');
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      (isSQLiteEnabled as jest.Mock).mockReturnValue(true);
      (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    });

    it('should deny deletion if user is not authenticated', async () => {
      (authenticateRequest as jest.Mock).mockResolvedValue({
        error: {
          json: async () => ({ success: false, error: 'Unauthorized' }),
          status: 401,
        },
      });

      const request = new NextRequest('http://localhost:3000/api/persons?id=person-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should deny deletion if authorization fails', async () => {
      (authenticateRequest as jest.Mock).mockResolvedValue({
        auth: {
          authenticated: true,
          isDemoMode: false,
          userId: 'user-123',
        },
      });
      (authorizePersonAccess as jest.Mock).mockResolvedValue({
        error: {
          json: async () => ({ success: false, error: 'Access denied' }),
          status: 403,
        },
      });

      const request = new NextRequest('http://localhost:3000/api/persons?id=person-other', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Access denied');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting for DELETE requests', async () => {
      const mockRateLimitResponse = {
        json: async () => ({ success: false, error: 'Too many requests' }),
        status: 429,
      };

      const { applyRateLimit } = require('@/lib/rate-limit');
      (applyRateLimit as jest.Mock).mockReturnValueOnce(mockRateLimitResponse);

      const request = new NextRequest('http://localhost:3000/api/persons?id=person-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Too many requests');
      expect(applyRateLimit).toHaveBeenCalled();
    });
  });

  describe('CSRF Protection', () => {
    it('should validate CSRF token on DELETE requests', async () => {
      const { withCSRFProtection } = require('@/lib/csrf');
      (withCSRFProtection as jest.Mock).mockReturnValueOnce({
        response: {
          json: async () => ({ success: false, error: 'CSRF validation failed' }),
          status: 403,
        },
      });

      const request = new NextRequest('http://localhost:3000/api/persons?id=person-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('CSRF validation failed');
      expect(withCSRFProtection).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (isSQLiteEnabled as jest.Mock).mockReturnValue(true);
      (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
      (authenticateRequest as jest.Mock).mockResolvedValue({
        auth: {
          authenticated: true,
          isDemoMode: false,
          userId: 'user-123',
        },
      });
      (authorizePersonAccess as jest.Mock).mockResolvedValue({ authorized: true });
    });

    it('should handle unexpected errors gracefully', async () => {
      (deletePerson as jest.Mock).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new NextRequest('http://localhost:3000/api/persons?id=person-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});
