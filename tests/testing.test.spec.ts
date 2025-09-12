import { test, expect } from './base';

test('Sample test to verify setup', async ({ request, usersService }) => {
    const response = await usersService.getUsers(request);
    expect(response.status()).toBe(200);
    const users = await response.json();
    console.log(users);
});