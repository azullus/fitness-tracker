/**
 * Tests for lib/rate-limit.ts
 * Tests the sliding window rate limiting algorithm
 */

// Mock NextResponse BEFORE importing the module under test
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => {
      const headers = new Map<string, string>();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          headers.set(key, value as string);
        });
      }
      return {
        body,
        status: init?.status || 200,
        headers: {
          get: (key: string) => headers.get(key),
          set: jest.fn((key: string, value: string) => headers.set(key, value)),
        },
      };
    }),
  },
}));

import {
  checkRateLimit,
  rateLimit,
  RateLimitPresets,
  clearRateLimit,
  clearAllRateLimits,
  getRateLimitStatus,
  createRateLimitResponse,
  addRateLimitHeaders,
  applyRateLimit,
} from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

/**
 * Helper to create a mock Request object
 */
function createMockRequest(headers: Record<string, string> = {}): Request {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] || null,
    },
  } as unknown as Request;
}

describe('Rate Limiting', () => {
  // Clean up rate limit store before each test
  beforeEach(() => {
    clearAllRateLimits();
  });

  describe('checkRateLimit', () => {
    const config = { limit: 3, windowMs: 60000 }; // 3 requests per minute

    it('should allow requests under the limit', () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      const result1 = checkRateLimit(request, config);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = checkRateLimit(request, config);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = checkRateLimit(request, config);
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should block requests over the limit', () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.2' });

      // Make 3 requests (the limit)
      checkRateLimit(request, config);
      checkRateLimit(request, config);
      checkRateLimit(request, config);

      // 4th request should be blocked
      const result = checkRateLimit(request, config);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track different clients separately', () => {
      const request1 = createMockRequest({ 'x-forwarded-for': '192.168.1.3' });
      const request2 = createMockRequest({ 'x-forwarded-for': '192.168.1.4' });

      // Exhaust limit for client 1
      checkRateLimit(request1, config);
      checkRateLimit(request1, config);
      checkRateLimit(request1, config);
      const blocked = checkRateLimit(request1, config);
      expect(blocked.success).toBe(false);

      // Client 2 should still be allowed
      const result = checkRateLimit(request2, config);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should use x-real-ip when x-forwarded-for is not present', () => {
      const request = createMockRequest({ 'x-real-ip': '10.0.0.1' });

      const result = checkRateLimit(request, config);
      expect(result.success).toBe(true);
    });

    it('should use default identifier when no IP headers present', () => {
      const request = createMockRequest({});

      const result = checkRateLimit(request, config);
      expect(result.success).toBe(true);
    });

    it('should handle x-forwarded-for with multiple IPs', () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.5, 10.0.0.1, 172.16.0.1' });

      const result = checkRateLimit(request, config);
      expect(result.success).toBe(true);
    });

    it('should return correct reset time', () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.6' });
      const now = Date.now();

      const result = checkRateLimit(request, config);

      // Reset time should be approximately now + windowMs (in seconds)
      const expectedReset = Math.ceil((now + config.windowMs) / 1000);
      expect(result.reset).toBeGreaterThanOrEqual(expectedReset - 1);
      expect(result.reset).toBeLessThanOrEqual(expectedReset + 1);
    });

    it('should support custom identifier function', () => {
      const customConfig = {
        ...config,
        getIdentifier: () => 'custom-user-123',
      };

      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.7' });

      // Should use custom identifier, not IP
      const result = checkRateLimit(request, customConfig);
      expect(result.success).toBe(true);

      // Clear the custom identifier
      clearRateLimit('custom-user-123');

      // Should allow again (proving it used the custom identifier)
      const result2 = checkRateLimit(request, customConfig);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(2); // Fresh start
    });
  });

  describe('rateLimit factory function', () => {
    it('should create a reusable rate limiter', () => {
      const limiter = rateLimit({ limit: 2, windowMs: 60000 });
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.8' });

      const result1 = limiter(request);
      expect(result1.success).toBe(true);

      const result2 = limiter(request);
      expect(result2.success).toBe(true);

      const result3 = limiter(request);
      expect(result3.success).toBe(false);
    });
  });

  describe('RateLimitPresets', () => {
    it('should have GENERAL preset (100/minute)', () => {
      expect(RateLimitPresets.GENERAL.limit).toBe(100);
      expect(RateLimitPresets.GENERAL.windowMs).toBe(60000);
    });

    it('should have AUTH preset (10/minute)', () => {
      expect(RateLimitPresets.AUTH.limit).toBe(10);
      expect(RateLimitPresets.AUTH.windowMs).toBe(60000);
    });

    it('should have SEED preset (5/hour)', () => {
      expect(RateLimitPresets.SEED.limit).toBe(5);
      expect(RateLimitPresets.SEED.windowMs).toBe(3600000);
    });
  });

  describe('clearRateLimit', () => {
    it('should clear rate limit for a specific identifier', () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.9' });
      const config = { limit: 1, windowMs: 60000 };

      // Exhaust limit
      checkRateLimit(request, config);
      let result = checkRateLimit(request, config);
      expect(result.success).toBe(false);

      // Clear and try again
      clearRateLimit('192.168.1.9');
      result = checkRateLimit(request, config);
      expect(result.success).toBe(true);
    });
  });

  describe('clearAllRateLimits', () => {
    it('should clear all rate limits', () => {
      const request1 = createMockRequest({ 'x-forwarded-for': '192.168.1.10' });
      const request2 = createMockRequest({ 'x-forwarded-for': '192.168.1.11' });
      const config = { limit: 1, windowMs: 60000 };

      // Exhaust limits for both clients
      checkRateLimit(request1, config);
      checkRateLimit(request2, config);

      // Both should be blocked
      expect(checkRateLimit(request1, config).success).toBe(false);
      expect(checkRateLimit(request2, config).success).toBe(false);

      // Clear all and try again
      clearAllRateLimits();

      expect(checkRateLimit(request1, config).success).toBe(true);
      expect(checkRateLimit(request2, config).success).toBe(true);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return current status without counting as a request', () => {
      const config = { limit: 3, windowMs: 60000 };
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.12' });

      // Make one request
      checkRateLimit(request, config);

      // Check status (should not count as a request)
      const status1 = getRateLimitStatus('192.168.1.12', config);
      expect(status1.success).toBe(true);
      expect(status1.remaining).toBe(2);

      // Check again - remaining should still be 2
      const status2 = getRateLimitStatus('192.168.1.12', config);
      expect(status2.remaining).toBe(2);
    });

    it('should return correct status for unknown identifier', () => {
      const config = { limit: 5, windowMs: 60000 };

      const status = getRateLimitStatus('unknown-client', config);
      expect(status.success).toBe(true);
      expect(status.remaining).toBe(5);
    });
  });

  describe('createRateLimitResponse', () => {
    it('should create a 429 response with proper headers', () => {
      const result = {
        success: false,
        limit: 100,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 60,
      };

      const response = createRateLimitResponse(result);

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Too many requests');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
  });

  describe('addRateLimitHeaders', () => {
    it('should add rate limit headers to a response', () => {
      const mockResponse = {
        headers: new Map<string, string>(),
        set: function (key: string, value: string) {
          this.headers.set(key, value);
          return this;
        },
      } as unknown as NextResponse;

      // Mock the headers.set method
      mockResponse.headers = {
        set: jest.fn(),
      } as unknown as Headers;

      const result = {
        success: true,
        limit: 100,
        remaining: 95,
        reset: 1234567890,
      };

      addRateLimitHeaders(mockResponse, result);

      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '95');
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-RateLimit-Reset', '1234567890');
    });
  });

  describe('applyRateLimit', () => {
    it('should return null when under limit', () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.13' });
      const config = { limit: 10, windowMs: 60000 };

      const response = applyRateLimit(request, config);
      expect(response).toBeNull();
    });

    it('should return 429 response when over limit', () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.14' });
      const config = { limit: 1, windowMs: 60000 };

      // First request should pass
      expect(applyRateLimit(request, config)).toBeNull();

      // Second request should be blocked
      const response = applyRateLimit(request, config);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(429);
    });
  });
});
