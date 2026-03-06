import api from './api.service';

const BASE_PATH = '/api/core/system-options';

export interface SystemOption {
  id: string;
  category: string;
  value: string;
  label: string;
  isActive: boolean;
}

export const SystemOptionsService = {
  getAll: async () => {
    const response = await api.get(BASE_PATH);
    return response.data;
  },
  getByCategory: async (category: string) => {
    const response = await api.get(`${BASE_PATH}/category/${category}`);
    return response.data;
  },
  create: async (data: Omit<SystemOption, 'id'>) => {
    const response = await api.post(BASE_PATH, data);
    return response.data;
  },
  update: async (id: string, data: Partial<SystemOption>) => {
    const response = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`${BASE_PATH}/${id}`);
    return response.data;
  }
};
