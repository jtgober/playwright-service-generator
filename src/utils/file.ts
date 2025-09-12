import fs from 'fs';
import path from 'path';
import { toCamelCase } from './naming.js';

export const generateBaseFile = (services: string[], testsDir: string) => {
    const outputPath = path.resolve(process.cwd(), testsDir);
    if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });

    let imports = `import { test as base } from '@playwright/test';\n`;
    imports += services.map(s => `import { ${s} } from '../services/${s}.js';`).join('\n') + '\n\n';

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
