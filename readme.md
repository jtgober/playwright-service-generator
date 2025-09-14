# Playwright Service Generator

Generate **Playwright API service classes** from your OpenAPI specification.  
This package converts your API endpoints into clean, camelCase methods.

## 🚀 Features

- 🛠 Generates Playwright service classes directly from an OpenAPI spec  
- 🐫 Creates clean camelCase method names (`getUsersById`, `postOrders`)  
- 🧩 Automatically generates **custom Playwright fixtures** for each service, so you can inject them directly into your tests  
- ⚡ Works seamlessly with Playwright’s built-in `request` fixture 

## 📦 Installation

```bash
npm install @jtgober/playwright-service-generator
```
## 📖 Usage
1. Generate services from your OpenAPI spec

```bash
npx generate-services  --swaggerUrl YOUR-SWAGGER-JSON
# or alias
npx generate-services  --s YOUR-SWAGGER-JSON
```

2. Example generated service

Given this swagger.json: 

```
https://fakerestapi.azurewebsites.net/swagger/v1/swagger.json
```

You’ll get a services like:

```ts
//services/ActivitiesService.ts
import { APIRequestContext } from '@playwright/test';

export class ActivitiesService {

  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async getActivities() {
    const res = this.request.get(`/api/v1/Activities`);
    return res;
  }

  async postActivities(data?: any) {
    const res = this.request.post(`/api/v1/Activities`, { data });
    return res;
  }

  async getActivitiesById(id) {
    const res = this.request.get(`/api/v1/Activities/${id}`);
    return res;
  }

  async putActivitiesById(id, data?: any) {
    const res = this.request.put(`/api/v1/Activities/${id}`, { data });
    return res;
  }

  async deleteActivitiesById(id) {
    const res = this.request.delete(`/api/v1/Activities/${id}`);
    return res;
  }
}
```

3. They are also added as custom fixtures - creating a `base.ts` class

```ts
//base.ts
import { test as base } from '@playwright/test';
import { ActivitiesService } from '../services/ActivitiesService.js';
import { AuthorsService } from '../services/AuthorsService.js';
 //... all other imports

type MyFixtures = {
  activitiesService: ActivitiesService;
  authorsService: AuthorsService;
 //... all other typed fixtures
};

export const test = base.extend<MyFixtures>({
  activitiesService: async ({ request }, use) => {
    const service = new ActivitiesService(request);
    await use(service);
  },
  authorsService: async ({ request }, use) => {
    const service = new AuthorsService(request);
    await use(service);
  },
  //... all other services
});

export { expect } from '@playwright/test';
```

4. Tests can now use any fixture

```ts
//my-test.spec.ts
import { test, expect } from './base';

test('Sample test to verify setup', async ({ usersService }) => {
    const response = await usersService.getUsers();
    expect(response.status()).toBe(200);
});

```

## Additional Option: output-dir

You can specify where you want your services to go by using
```bash
--output-dir MY-SERVICES-FOLDER
## or alias
--o MY-SERVICES-FOLDER
```

Example:
```bash
npx generate-services  --s https://fakerestapi.azurewebsites.net/swagger/v1/swagger.json --o new/folder/location
```

## Additional Option: merge

When working with APIs that have multiple versions (v1, v2, etc.), you can use the merge option to preserve existing service files and create versioned service names.

```bash
--merge
## or alias
-m
```

**Without merge (default behavior):**
- Routes like `/v1/users` and `/v2/users` both create `UsersService`
- Later versions overwrite earlier ones
- Only the last version's service file remains

**With merge:**
- Routes like `/v1/users` create `UsersV1Service` 
- Routes like `/v2/users` create `UsersV2Service`
- Routes without versions (like `/orders`) create `OrdersService`
- All service files are preserved
- Existing `base.ts` file is preserved and updated with new services

Example:
```bash
npx generate-services --s https://api.example.com/swagger.json --m
```

This is particularly useful when:
- Your API has multiple versions you want to test
- You have existing service files you don't want to overwrite
- You want to maintain backward compatibility with older API versions
