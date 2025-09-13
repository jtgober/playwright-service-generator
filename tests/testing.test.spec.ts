import { test, expect } from './base';

test('Sample test to verify setup', async ({ usersService }) => {
    const response = await usersService.getUsers();
    expect(response.status()).toBe(200);
    const users = await response.json();
    console.log(users);
});