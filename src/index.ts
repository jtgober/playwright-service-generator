#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import { toCamelCaseMethodName } from './utils/method-naming.js';
import { generateBaseFile } from './utils/file-generator.js';

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
}

const argv = yargs(hideBin(process.argv))
  .option('swagger-url', { alias: 's', type: 'string', default: process.env.SWAGGER_URL })
  .option('output-dir', { alias: 'o', type: 'string', default: './services' })
  .help()
  .parseSync() as Arguments;

const options: any = {
  swaggerUrl: argv['swagger-url'],
  outputDir: argv['output-dir'],
};

async function generateServices({ swaggerUrl, outputDir }: GenerateOptions): Promise<string[]> {
  console.log(`🔍 Fetching Swagger spec from ${swaggerUrl}...`);
  const res = await fetch(swaggerUrl);
  if (!res.ok) throw new Error(`Failed to fetch Swagger spec: ${res.statusText}`);
  const swagger = await res.json();
  console.log('✅ Successfully fetched Swagger spec');

  const services: Record<string, any[]> = {};
  const serviceNames: string[] = [];

  for (const [route, methods] of Object.entries<any>(swagger.paths)) {
    for (const [method, details] of Object.entries<any>(methods)) {
      const tag = details.tags?.[0] || 'Default';
      if (!services[tag]) services[tag] = [];
      services[tag].push({ route, method, operationId: details.operationId });
    }
  }

  const absoluteOutputDir = path.resolve(process.cwd(), outputDir);
  if (!fs.existsSync(absoluteOutputDir)) fs.mkdirSync(absoluteOutputDir, { recursive: true });

  for (const [tag, endpoints] of Object.entries(services)) {
    const serviceName = `${tag}Service`;
    serviceNames.push(serviceName);

    let content = `import { APIRequestContext } from '@playwright/test';\n\n`;
    content += `export class ${serviceName} {\n`;

    for (const ep of endpoints) {
      const methodName = toCamelCaseMethodName(ep.method, ep.route, ep.operationId);
      const pathParamsMatches = [...ep.route.matchAll(/{(.*?)}/g)];
      const pathParams = pathParamsMatches.map(m => m[1]);
      const needsData = ['post', 'put', 'patch'].includes(ep.method.toLowerCase());
      const paramsList = [...pathParams];
      if (needsData) paramsList.push('data?: any');
      const paramsString = paramsList.join(', ');

      const routeWithTemplate = ep.route.replace(/{(.*?)}/g, (_: any, p: any) => `\${${p}}`);
      const secondArg = needsData ? '{ data }' : '';

      content += `\n  async ${methodName}(request: APIRequestContext, ${paramsString}) {\n    const res = request.${ep.method}(\`${routeWithTemplate}\`${secondArg ? `, ${secondArg}` : ''});\n    return res;\n  }\n`;
    }

    content += `}\n`;
    fs.writeFileSync(path.join(absoluteOutputDir, `${serviceName}.ts`), content, 'utf8');
    console.log(`✅ Generated ${serviceName} in ${absoluteOutputDir}`);
  }

  return serviceNames;
}

async function main() {
  console.log(`
                 _..--+~/@-@--.
           _-=~      (  .    )
        _-~     _.--=.\\ \''''
      _~      _-       \\ \\_\\
     =      _=          '--'
    '      =                             .
   :      :                              '=_. ___
   |      ;                                  '~--.~.
   ;      ;                                       } |
   =       \\             __..-...__           ___/__/__
   :        =_     _.-~~          ~~--.__
__  \\         ~-+-~                   ___~=_______
     ~@#~~ == ...______ __ ___ _--~~--_

L             That'll be about tree fiddy....             L
`);


  const serviceNames = await generateServices(options);
  const testsDir = path.resolve(process.cwd(), 'tests');
  generateBaseFile(serviceNames, testsDir);
  console.log(`✅ Generated base.ts in ${testsDir}`);
}

main().catch(console.error);
