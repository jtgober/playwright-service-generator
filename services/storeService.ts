export class storeService {

  async getInventory(request) {
    const res = await request.get(`/store/inventory`);
    return res;
  }

  async placeOrder(request, data?: any) {
    const res = await request.post(`/store/order`, { data });
    return res;
  }

  async getOrderById(request, orderId) {
    const res = await request.get(`/store/order/${orderId}`);
    return res;
  }

  async deleteOrder(request, orderId) {
    const res = await request.delete(`/store/order/${orderId}`);
    return res;
  }
}
