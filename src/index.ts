#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GenerateOptions {
  swaggerUrl: string;
  outputDir: string;
  baseUrl?: string;
}

interface Arguments {
  'swagger-url': string;
  'output-dir': string;
  'base-url'?: string;
}

// -------------------
// Utility functions
// -------------------

function toCamelCase(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

export function toCamelCaseMethodName(
  method: string,
  route?: string,
  operationId?: string
): string {
  if (operationId) return operationId;
  if (!route) return method.toLowerCase(); // early return if route undefined

  const cleanRoute = route.split('?')[0] ?? ''; // safe fallback

  const parts = cleanRoute.split('/').filter(Boolean);

  const nameParts = parts.map(p =>
    p.startsWith('{') && p.endsWith('}') ? `By${p[1] ? p[1].toUpperCase() : ''}${p.slice(2, -1)}` :
      p.replace(/[^a-zA-Z0-9]/g, '').replace(/^\w/, c => c.toUpperCase())
  );

  const rawName = method.toLowerCase() + nameParts.join('');
  return rawName.charAt(0).toLowerCase() + rawName.slice(1);
}


// -------------------
// Generate base.ts
// -------------------

function generateBaseFile(services: string[], testsDir: string) {
  const outputPath = path.resolve(process.cwd(), testsDir);
  if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });

  let imports = `import { test as base } from '@playwright/test';\n`;
  imports += services.map(s => `import { ${s} } from '../services/${s}';`).join('\n') + '\n\n';

  let fixturesType = `type MyFixtures = {\n`;
  fixturesType += services.map(s => `  ${toCamelCase(s)}: ${s};`).join('\n');
  fixturesType += `\n};\n\n`;

  let extendBlock = `export const test = base.extend<MyFixtures>({\n`;
  extendBlock += services.map(s =>
    `  ${toCamelCase(s)}: async ({ request }, use) => {\n    const service = new ${s}(request);\n    await use(service);\n  }`
  ).join(',\n');
  extendBlock += `\n});\n\n`;

  extendBlock += `export { expect } from '@playwright/test';\n`;

  const content = imports + fixturesType + extendBlock;
  fs.writeFileSync(path.join(outputPath, 'base.ts'), content, 'utf8');
}


// -------------------
// Generate services
// -------------------

async function generateServices({ swaggerUrl, outputDir, baseUrl }: GenerateOptions): Promise<string[]> {
  try {
    console.log(`🔍 Fetching Swagger spec from ${swaggerUrl}...`);
    const res = await fetch(swaggerUrl);

    if (!res.ok) {
      throw new Error(`Failed to fetch Swagger spec: ${res.statusText}`);
    }

    const swagger = await res.json();
    console.log('✅ Successfully fetched Swagger spec');

    const services: Record<string, any[]> = {};
    const serviceNames: string[] = [];

    // Group endpoints by tags
    for (const [route, methods] of Object.entries<any>(swagger.paths)) {
      for (const [method, details] of Object.entries<any>(methods)) {
        const tag = details.tags?.[0] || 'Default';
        if (!services[tag]) services[tag] = [];
        services[tag].push({
          route,
          method,
          operationId: details.operationId,
          parameters: details.parameters,
          description: details.description || ''
        });
      }
    }

    // Create output directory
    const absoluteOutputDir = path.resolve(process.cwd(), outputDir);
    if (!fs.existsSync(absoluteOutputDir)) {
      fs.mkdirSync(absoluteOutputDir, { recursive: true });
    }

    // Generate service classes
    for (const [tag, endpoints] of Object.entries(services)) {
      const serviceName = `${tag}Service`;
      serviceNames.push(serviceName);

      let content = `import { APIRequestContext } from '@playwright/test';\n\n`;
      content += `export class ${serviceName} {\n  constructor(private request: APIRequestContext) {}\n`;

      for (const ep of endpoints) {
        const methodName = toCamelCaseMethodName(ep.method, ep.route, ep.operationId);

        // Detect path params
        const pathParamsMatches = [...ep.route.matchAll(/{(.*?)}/g)];
        const pathParams = pathParamsMatches.map(m => m[1]);

        const needsData = ['post', 'put', 'patch'].includes(ep.method.toLowerCase());

        const paramsList = [...pathParams];
        if (needsData) paramsList.push('data?: any');
        const paramsString = paramsList.join(', ');

        let routeWithTemplate = ep.route.replace(/{(.*?)}/g, (_: any, p: any) => `\${${p}}`);
        const secondArg = needsData ? '{ data }' : '';

        content += `
  async ${methodName}(${paramsString}) {
    const res = await this.request.${ep.method}(\`${routeWithTemplate}\`${secondArg ? `, ${secondArg}` : ''});
    return res;
  }
`;
      }

      content += `}
`;
      const outputPath = path.join(absoluteOutputDir, `${serviceName}.ts`);
      fs.writeFileSync(outputPath, content, 'utf8');
      console.log(`✅ Generated ${serviceName} in ${outputPath}`);
    }

    return serviceNames;
  } catch (error) {
    console.error('❌ Error generating services:', error);
    throw error;
  }
}

// -------------------
// CLI options
// -------------------

const argv = yargs(hideBin(process.argv))
  .option('swagger-url', {
    alias: 's',
    type: 'string',
    description: 'URL to the Swagger/OpenAPI specification',
    default: process.env.SWAGGER_URL || 'https://petstore.swagger.io/v2/swagger.json'
  })
  .option('output-dir', {
    alias: 'o',
    type: 'string',
    description: 'Output directory for generated services',
    default: './services'
  })
  .option('base-url', {
    alias: 'b',
    type: 'string',
    description: 'Base URL for the API (optional)',
    default: process.env.API_BASE_URL
  })
  .help()
  .parseSync() as Arguments;

const options: any = {
  swaggerUrl: argv['swagger-url'],
  outputDir: argv['output-dir'],
  baseUrl: argv['base-url']
};

// -------------------
// Run generator
// -------------------

async function main() {
  const serviceNames = await generateServices(options);

  const testsDir = path.resolve(process.cwd(), 'tests');
  generateBaseFile(serviceNames, testsDir);

  console.log(`✅ Generated base.ts in ${testsDir}`);
}

main().catch(console.error);


