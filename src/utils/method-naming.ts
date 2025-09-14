import { describe, it, expect } from 'vitest';
import { toCamelCaseMethodName, toCamelCase } from '../src/utils/method-naming.js';

describe('method-naming', () => {
  describe('toCamelCase', () => {
    it('should convert PascalCase to camelCase', () => {
      expect(toCamelCase('UsersService')).toBe('usersService');
      expect(toCamelCase('ProductsService')).toBe('productsService');
    });

    it('should handle already camelCase strings', () => {
      expect(toCamelCase('usersService')).toBe('usersService');
    });

    it('should handle single character strings', () => {
      expect(toCamelCase('A')).toBe('a');
      expect(toCamelCase('a')).toBe('a');
    });

    it('should handle empty strings', () => {
      expect(toCamelCase('')).toBe('');
    });
  });

  describe('toCamelCaseMethodName', () => {
    it('should use operationId when provided', () => {
      const result = toCamelCaseMethodName('get', '/users/{id}', 'getUserById');
      expect(result).toBe('getUserById');
    });

    it('should generate method name from route when no operationId', () => {
      const result = toCamelCaseMethodName('get', '/users/{id}');
      expect(result).toBe('getUsersById');
    });

    it('should handle POST method', () => {
      const result = toCamelCaseMethodName('post', '/users');
      expect(result).toBe('postUsers');
    });

    it('should handle PUT method with path parameter', () => {
      const result = toCamelCaseMethodName('put', '/users/{id}');
      expect(result).toBe('putUsersById');
    });

    it('should handle DELETE method', () => {
      const result = toCamelCaseMethodName('delete', '/users/{id}');
      expect(result).toBe('deleteUsersById');
    });

    it('should handle complex routes with multiple path parameters', () => {
      const result = toCamelCaseMethodName('get', '/users/{userId}/orders/{orderId}');
      expect(result).toBe('getUsersByUserIdOrdersByOrderId');
    });

    it('should handle routes with hyphens', () => {
      const result = toCamelCaseMethodName('get', '/user-profiles/{id}');
      expect(result).toBe('getUserprofilesById');
    });

    it('should handle routes with underscores', () => {
      const result = toCamelCaseMethodName('get', '/user_profiles/{id}');
      expect(result).toBe('getUserprofilesById');
    });

    it('should handle routes with query parameters', () => {
      const result = toCamelCaseMethodName('get', '/users?limit=10&offset=0');
      expect(result).toBe('getUsers');
    });

    it('should handle empty route', () => {
      const result = toCamelCaseMethodName('get', '');
      expect(result).toBe('get');
    });

    it('should handle undefined route', () => {
      const result = toCamelCaseMethodName('get');
      expect(result).toBe('get');
    });

    it('should handle route with only slashes', () => {
      const result = toCamelCaseMethodName('get', '///');
      expect(result).toBe('get');
    });

    it('should handle versioned routes', () => {
      const result = toCamelCaseMethodName('get', '/v1/users/{id}');
      expect(result).toBe('getV1UsersById');
    });

    it('should handle nested resources', () => {
      const result = toCamelCaseMethodName('get', '/companies/{companyId}/employees/{employeeId}/benefits');
      expect(result).toBe('getCompaniesByCompanyIdEmployeesByEmployeeIdBenefits');
    });

    it('should handle camelCase in path parameters', () => {
      const result = toCamelCaseMethodName('get', '/users/{userId}');
      expect(result).toBe('getUsersByUserId');
    });
  });
});
