import api from './api.service';

const BASE_PATH = '/api/core';

export const CoreService = {
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

  getSubjectsByClass: async (classId: string | number) => {
    const response = await api.get(`${BASE_PATH}/subjects`, { params: { classId } });
    return response.data;
  },

  getTeachersByClass: async (classId: string | number) => {
    const response = await api.get(`${BASE_PATH}/staff`, { params: { classId } });
    return response.data;
  },

  getSubjectsByTeacher: async (teacherId: string | number) => {
    const response = await api.get(`${BASE_PATH}/subjects`, { params: { teacherId } });
    return response.data;
  },

  getClassesByTeacher: async (teacherId: string | number) => {
    const response = await api.get(`${BASE_PATH}/classes`, { params: { teacherId } });
    return response.data;
  },

  getTeachersBySubject: async (subjectId: string | number) => {
    const response = await api.get(`${BASE_PATH}/staff`, { params: { subjectId } });
    return response.data;
  },

  getClassesBySubject: async (subjectId: string | number) => {
    const response = await api.get(`${BASE_PATH}/classes`, { params: { subjectId } });
    return response.data;
  },

  // NEW: TeacherSubjectClass specific endpoints for accurate dynamic filtering
  getTeachersByClassV2: async (classId: string | number) => {
    const response = await api.get(`${BASE_PATH}/teacher-subject-class/teachers-by-class/${classId}`);
    return response.data;
  },

  getSubjectsByClassV2: async (classId: string | number) => {
    const response = await api.get(`${BASE_PATH}/teacher-subject-class/subjects-by-class/${classId}`);
    return response.data;
  },

  getClassesByTeacherV2: async (staffId: string | number) => {
    const response = await api.get(`${BASE_PATH}/teacher-subject-class/classes-by-teacher/${staffId}`);
    return response.data;
  },

  getSubjectsByTeacherV2: async (staffId: string | number) => {
    const response = await api.get(`${BASE_PATH}/teacher-subject-class/subjects-by-teacher/${staffId}`);
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
