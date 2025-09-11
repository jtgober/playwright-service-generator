#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname hack
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Grab the Swagger URL from CLI arguments
const args = process.argv.slice(2);
if (!args[0]) {
  console.error('Usage: generate-services <swagger-url>');
  process.exit(1);
}

const SWAGGER_URL = args[0];
const OUTPUT_DIR = path.resolve(process.cwd(), 'services'); // <-- use current working dir

async function generateServices() {
  const res = await fetch(SWAGGER_URL);
  const swagger = await res.json();

  const services: Record<string, any[]> = {};

  for (const [route, methods] of Object.entries<any>(swagger.paths)) {
    for (const [method, details] of Object.entries<any>(methods)) {
      const tag = details.tags?.[0] || 'Default';
      if (!services[tag]) services[tag] = [];
      services[tag].push({ route, method, operationId: details.operationId });
    }
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  for (const [tag, endpoints] of Object.entries(services)) {
    let content = `
import { APIRequestContext, APIResponse } from '@playwright/test';

export class ${tag}Service {
  constructor(private request: APIRequestContext) {}
`;

    for (const ep of endpoints) {
      const methodName = ep.operationId || `${ep.method}${ep.route.replace(/[\/{}]/g, '_')}`;
      content += `
  async ${methodName}(data?: any): Promise<APIResponse> {
    return this.request.${ep.method}(\`${ep.route.replace(/{/g, '${')}\`, data ? { data } : {});
  }
`;
    }

    content += `}
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, `${tag}Service.ts`), content, 'utf8');
  }

  console.log('✅ Services generated in', OUTPUT_DIR);
}

generateServices().catch(console.error);
