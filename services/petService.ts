export class petService {

  async uploadFile(request, petId, data?: any) {
    const res = await request.post(`/pet/${petId}/uploadImage`, { data });
    return res;
  }

  async addPet(request, data?: any) {
    const res = await request.post(`/pet`, { data });
    return res;
  }

  async updatePet(request, data?: any) {
    const res = await request.put(`/pet`, { data });
    return res;
  }

  async findPetsByStatus(request) {
    const res = await request.get(`/pet/findByStatus`);
    return res;
  }

  async findPetsByTags(request) {
    const res = await request.get(`/pet/findByTags`);
    return res;
  }

  async getPetById(request, petId) {
    const res = await request.get(`/pet/${petId}`);
    return res;
  }

  async updatePetWithForm(request, petId, data?: any) {
    const res = await request.post(`/pet/${petId}`, { data });
    return res;
  }

  async deletePet(request, petId) {
    const res = await request.delete(`/pet/${petId}`);
    return res;
  }
}
