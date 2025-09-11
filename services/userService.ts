export class userService {

  async createUsersWithListInput(request, data?: any) {
    const res = await request.post(`/user/createWithList`, { data });
    return res;
  }

  async getUserByName(request, username) {
    const res = await request.get(`/user/${username}`);
    return res;
  }

  async updateUser(request, username, data?: any) {
    const res = await request.put(`/user/${username}`, { data });
    return res;
  }

  async deleteUser(request, username) {
    const res = await request.delete(`/user/${username}`);
    return res;
  }

  async loginUser(request) {
    const res = await request.get(`/user/login`);
    return res;
  }

  async logoutUser(request) {
    const res = await request.get(`/user/logout`);
    return res;
  }

  async createUsersWithArrayInput(request, data?: any) {
    const res = await request.post(`/user/createWithArray`, { data });
    return res;
  }

  async createUser(request, data?: any) {
    const res = await request.post(`/user`, { data });
    return res;
  }
}
