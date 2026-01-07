/**
 * Tests for Weight API validation logic
 *
 * These tests focus on validation functions that are used by the weight API
 * without testing the full route handler, avoiding complex mocking issues.
 */

import {
  validateDateRange,
  validateWeightEntryData,
  validatePersonExists,
  formatValidationErrors,
  NumericValidators,
} from '@/lib/validation';

// Mock the modules that validatePersonExists depends on
jest.mock('@/lib/supabase', () => ({
  getSupabase: jest.fn(),
  isSupabaseConfigured: jest.fn().mockReturnValue(false),
}));

jest.mock('@/lib/database', () => ({
  isSQLiteEnabled: jest.fn().mockReturnValue(false),
  getPersonById: jest.fn().mockReturnValue(null),
}));

jest.mock('@/lib/demo-data', () => ({
  DEMO_PERSONS: [
    { id: 'demo-person-taylor', name: 'Taylor' },
    { id: 'demo-person-dylan', name: 'Dylan' },
  ],
}));

describe('Weight API - Validation Logic', () => {
  describe('Weight Entry Data Validation', () => {
    it('should accept valid weight entry data', () => {
      const errors = validateWeightEntryData({
        weight_lbs: 175,
      });
      expect(errors).toHaveLength(0);
    });

    it('should reject weight below minimum (50 lbs)', () => {
      const errors = validateWeightEntryData({
        weight_lbs: 30,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('weight_lbs');
      expect(errors[0].message).toContain('between 50 and 1000');
    });

    it('should reject weight above maximum (1000 lbs)', () => {
      const errors = validateWeightEntryData({
        weight_lbs: 1500,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('weight_lbs');
      expect(errors[0].message).toContain('between 50 and 1000');
    });

    it('should accept weight at minimum boundary', () => {
      const errors = validateWeightEntryData({
        weight_lbs: 50,
      });
      expect(errors).toHaveLength(0);
    });

    it('should accept weight at maximum boundary', () => {
      const errors = validateWeightEntryData({
        weight_lbs: 1000,
      });
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid date format', () => {
      const errors = validateWeightEntryData({
        date: 'not-a-date',
        weight_lbs: 175,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('date');
      expect(errors[0].message).toContain('Invalid date format');
    });
  });

  describe('NumericValidators.weight', () => {
    it('should validate typical weight values', () => {
      expect(NumericValidators.weight(150).valid).toBe(true);
      expect(NumericValidators.weight(200).valid).toBe(true);
      expect(NumericValidators.weight(100).valid).toBe(true);
    });

    it('should reject non-numeric values', () => {
      expect(NumericValidators.weight('150' as any).valid).toBe(false);
      expect(NumericValidators.weight(null as any).valid).toBe(false);
      expect(NumericValidators.weight(undefined as any).valid).toBe(false);
    });

    it('should reject NaN', () => {
      expect(NumericValidators.weight(NaN).valid).toBe(false);
    });
  });

  describe('Date Range Validation for Weight', () => {
    it('should reject invalid date format strings', () => {
      const result = validateDateRange('01-15-2024'); // Wrong format
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid date format');
    });

    it('should reject dates with wrong separator', () => {
      const result = validateDateRange('2024/01/15');
      expect(result.valid).toBe(false);
    });

    it('should reject empty string', () => {
      const result = validateDateRange('');
      expect(result.valid).toBe(false);
    });

    it('should reject gibberish', () => {
      const result = validateDateRange('abc123');
      expect(result.valid).toBe(false);
    });
  });

  describe('Person ID Validation', () => {
    it('should accept demo person IDs', async () => {
      const result = await validatePersonExists('demo-person-taylor');
      expect(result.valid).toBe(true);
    });

    it('should accept other demo person IDs', async () => {
      const result = await validatePersonExists('demo-person-dylan');
      expect(result.valid).toBe(true);
    });

    it('should reject non-existent person IDs', async () => {
      const result = await validatePersonExists('non-existent-person');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject empty person ID', async () => {
      const result = await validatePersonExists('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('Error Formatting', () => {
    it('should format single error', () => {
      const errors = [{ field: 'weight_lbs', message: 'Weight is required' }];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toBe('Weight is required');
    });

    it('should format multiple errors', () => {
      const errors = [
        { field: 'weight_lbs', message: 'Weight is required' },
        { field: 'date', message: 'Invalid date' },
      ];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toContain('Multiple validation errors');
      expect(formatted).toContain('Weight is required');
      expect(formatted).toContain('Invalid date');
    });

    it('should return empty string for no errors', () => {
      const formatted = formatValidationErrors([]);
      expect(formatted).toBe('');
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle decimal weight values', () => {
      const result = NumericValidators.weight(175.5);
      expect(result.valid).toBe(true);
    });

    it('should handle weight at boundary decimals', () => {
      expect(NumericValidators.weight(49.9).valid).toBe(false);
      expect(NumericValidators.weight(50.0).valid).toBe(true);
      expect(NumericValidators.weight(1000.0).valid).toBe(true);
      expect(NumericValidators.weight(1000.1).valid).toBe(false);
    });

    it('should handle optional weight validator', () => {
      const result = NumericValidators.weightOptional(undefined);
      expect(result.valid).toBe(true);
    });
  });
});
