import api from './api.service';

const BASE_PATH = '/api/planning';

export const PlanningService = {
  // CREATE
  create: async (resource: string, data: any) => {
    const response = await api.post(`${BASE_PATH}/${resource}`, data);
    return response.data;
  },
  
  // READ ALL
  getAll: async (resource: string, params?: any) => {
    const response = await api.get(`${BASE_PATH}/${resource}`, { params });
    return response.data;
  },
  
  // READ ONE
  getById: async (resource: string, id: string | number) => {
    const response = await api.get(`${BASE_PATH}/${resource}/${id}`);
    return response.data;
  },
  
  // UPDATE
  update: async (resource: string, id: string | number, data: any) => {
    const response = await api.put(`${BASE_PATH}/${resource}/${id}`, data);
    return response.data;
  },
  
  // DELETE
  delete: async (resource: string, id: string | number) => {
    const response = await api.delete(`${BASE_PATH}/${resource}/${id}`);
    return response.data;
  }
};
