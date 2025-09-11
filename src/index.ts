#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import { toCamelCaseMethodName } from './cleaner-method-names.js'

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

// Parse command line arguments
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

async function generateServices({ swaggerUrl, outputDir, baseUrl }: GenerateOptions) {
  try {
    console.log(`🔍 Fetching Swagger spec from ${swaggerUrl}...`);
    const res = await fetch(swaggerUrl);

    if (!res.ok) {
      throw new Error(`Failed to fetch Swagger spec: ${res.statusText}`);
    }

    const swagger = await res.json();
    console.log('✅ Successfully fetched Swagger spec');

    const services: Record<string, any[]> = {};

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
      let content = `export class ${tag}Service {
`;

      for (const ep of endpoints) {
        // Sanitize method name
        const methodName = toCamelCaseMethodName(ep.method, ep.route, ep.operationId);


        // Detect path params
        const pathParamsMatches = [...ep.route.matchAll(/{(.*?)}/g)];
        const pathParams = pathParamsMatches.map(m => m[1]);

        // Decide if this method needs a data parameter
        const needsData = ['post', 'put', 'patch'].includes(ep.method.toLowerCase());

        // Build function parameter string
        const paramsList = ['request', ...pathParams];
        if (needsData) paramsList.push('data?: any');

        const paramsString = paramsList.join(', ');

        // Replace {param} with ${param} for template literals
        let routeWithTemplate = ep.route.replace(/{(.*?)}/g, (_: any, p: any) => `\${${p}}`);

        // Build method body conditionally
        const secondArg = needsData ? '{ data }' : '';

        // Construct method
        content += `
  async ${methodName}(${paramsString}) {
    const res = await request.${ep.method}(\`${routeWithTemplate}\`${secondArg ? `, ${secondArg}` : ''});
    return res;
  }
`;
      }

      content += `}
`;
      const outputPath = path.join(absoluteOutputDir, `${tag}Service.ts`);
      fs.writeFileSync(outputPath, content, 'utf8');
      console.log(`✅ Generated ${tag}Service in ${outputPath}`);
    }

  } catch (error) {
    console.error('❌ Error generating services:', error);
    throw error;
  }
}

// Get options from command line arguments
const options: GenerateOptions = {
  swaggerUrl: argv['swagger-url'] as string,
  outputDir: argv['output-dir'] as string,
  baseUrl: argv['base-url'] as string
};

generateServices(options).catch(console.error);
