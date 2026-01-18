/**
 * Validation Utilities
 * For cell value validation
 */

import type { CellValue, ValidationResult } from '../types';

export type ValidatorFn = (value: CellValue) => ValidationResult;

/**
 * Create a required validator
 */
export function required(message = 'This field is required'): ValidatorFn {
  return (value: CellValue): ValidationResult => {
    const isEmpty = value === null || value === undefined || value === '';
    return {
      isValid: !isEmpty,
      message: isEmpty ? message : undefined,
    };
  };
}

/**
 * Create a min length validator
 */
export function minLength(min: number, message?: string): ValidatorFn {
  return (value: CellValue): ValidationResult => {
    const str = String(value ?? '');
    const isValid = str.length >= min;
    return {
      isValid,
      message: isValid ? undefined : (message ?? `Minimum ${min} characters required`),
    };
  };
}

/**
 * Create a max length validator
 */
export function maxLength(max: number, message?: string): ValidatorFn {
  return (value: CellValue): ValidationResult => {
    const str = String(value ?? '');
    const isValid = str.length <= max;
    return {
      isValid,
      message: isValid ? undefined : (message ?? `Maximum ${max} characters allowed`),
    };
  };
}

/**
 * Create a numeric range validator
 */
export function range(min: number, max: number, message?: string): ValidatorFn {
  return (value: CellValue): ValidationResult => {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) {
      return { isValid: false, message: 'Must be a number' };
    }
    const isValid = num >= min && num <= max;
    return {
      isValid,
      message: isValid ? undefined : (message ?? `Value must be between ${min} and ${max}`),
    };
  };
}

/**
 * Create a pattern validator
 */
export function pattern(regex: RegExp, message = 'Invalid format'): ValidatorFn {
  return (value: CellValue): ValidationResult => {
    const str = String(value ?? '');
    const isValid = regex.test(str);
    return {
      isValid,
      message: isValid ? undefined : message,
    };
  };
}

/**
 * Email validator
 */
export const email: ValidatorFn = pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address');

/**
 * Compose multiple validators
 */
export function compose(...validators: ValidatorFn[]): ValidatorFn {
  return (value: CellValue): ValidationResult => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };
}

/**
 * Async validation wrapper (simulates API validation)
 */
export async function validateAsync(
  value: CellValue,
  validator: ValidatorFn,
  delay = 300
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(validator(value));
    }, delay);
  });
}
