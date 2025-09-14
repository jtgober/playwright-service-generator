import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generateBaseFile, generateSkeletonTest } from '../src/utils/file-generator.js';

// Mock fs module
vi.mock('fs');
const mockFs = vi.mocked(fs);

describe('file-generator', () => {
  const mockTestsDir = '/test/tests';
  const mockOutputDir = '/test/services';
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);
    mockFs.readFileSync.mockReturnValue('');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateBaseFile', () => {
    it('should generate base file without merge', () => {
      const services = ['UsersService', 'ProductsService'];
      
      generateBaseFile(services, mockTestsDir, mockOutputDir, false);
      
      expect(mockFs.writeFileSync).toHaveBeenCalledOnce();
      const [filePath, content] = mockFs.writeFileSync.mock.calls[0];
      expect(filePath).toContain('base.ts');
      expect(content).toContain('import { test as base } from \'@playwright/test\';');
      expect(content).toContain('import { UsersService } from \'../services/UsersService.js\';');
      expect(content).toContain('import { ProductsService } from \'../services/ProductsService.js\';');
      expect(content).toContain('usersService: UsersService;');
      expect(content).toContain('productsService: ProductsService;');
    });

    it('should generate base file with merge when existing file exists', () => {
      const services = ['ProductsService'];
      const existingContent = `import { test as base } from '@playwright/test';
import { UsersService } from '../services/v1/UsersService.js';`;
      
      mockFs.readFileSync.mockReturnValue(existingContent);
      
      generateBaseFile(services, mockTestsDir, mockOutputDir, true);
      
      expect(mockFs.readFileSync).toHaveBeenCalledOnce();
      expect(mockFs.writeFileSync).toHaveBeenCalledOnce();
      const [, content] = mockFs.writeFileSync.mock.calls[0];
      expect(content).toContain('import { UsersService } from \'../services/v1/UsersService.js\';');
      expect(content).toContain('import { ProductsService } from \'../services/ProductsService.js\';');
    });

    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      const services = ['UsersService'];
      
      generateBaseFile(services, mockTestsDir, mockOutputDir, false);
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('tests'),
        { recursive: true }
      );
    });

    it('should handle custom output directory paths', () => {
      const services = ['UsersService'];
      const customOutputDir = '/test/api/v2';
      
      generateBaseFile(services, mockTestsDir, customOutputDir, false);
      
      const [, content] = mockFs.writeFileSync.mock.calls[0];
      expect(content).toContain('import { UsersService } from \'../api/v2/UsersService.js\';');
    });

    it('should preserve existing import paths during merge', () => {
      const services = ['ProductsV2Service'];
      const existingContent = `import { test as base } from '@playwright/test';
import { UsersV1Service } from '../services/v1/UsersV1Service.js';
import { ProductsV1Service } from '../services/v1/ProductsV1Service.js';`;
      
      mockFs.readFileSync.mockReturnValue(existingContent);
      
      generateBaseFile(services, mockTestsDir, '/test/services/v2', true);
      
      const [, content] = mockFs.writeFileSync.mock.calls[0];
      expect(content).toContain('import { UsersV1Service } from \'../services/v1/UsersV1Service.js\';');
      expect(content).toContain('import { ProductsV1Service } from \'../services/v1/ProductsV1Service.js\';');
      expect(content).toContain('import { ProductsV2Service } from \'../services/v2/ProductsV2Service.js\';');
    });

    it('should not duplicate services during merge', () => {
      const services = ['UsersService', 'ProductsService'];
      const existingContent = `import { test as base } from '@playwright/test';
import { UsersService } from '../services/UsersService.js';`;
      
      mockFs.readFileSync.mockReturnValue(existingContent);
      
      generateBaseFile(services, mockTestsDir, mockOutputDir, true);
      
      const [, content] = mockFs.writeFileSync.mock.calls[0];
      const contentStr = content as string;
      const usersImportCount = (contentStr.match(/import { UsersService }/g) || []).length;
      expect(usersImportCount).toBe(1);
    });
  });

  describe('generateSkeletonTest', () => {
    it('should generate skeleton test file', () => {
      generateSkeletonTest(mockTestsDir);
      
      expect(mockFs.writeFileSync).toHaveBeenCalledOnce();
      const [filePath, content] = mockFs.writeFileSync.mock.calls[0];
      expect(filePath).toContain('skeleton-test.ts');
      expect(content).toContain('// This file was auto-generated by playwright-service-generator');
      expect(content).toContain('import { test, expect } from \'./base\';');
      expect(content).toContain('Creating and updating a person should be successful');
      expect(content).toContain('@smoke');
      expect(content).toContain('expect(true).toBe(true);');
    });

    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      generateSkeletonTest(mockTestsDir);
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('tests'),
        { recursive: true }
      );
    });
  });
});
