import api from "./api";
import {
  ServiceFee,
  User,
  Product,
  CreateProductDto,
  UpdateProductDto,
} from "../types";

export const settingsService = {
  // Settings endpoints are intentionally thin wrappers so components stay declarative and transport details remain centralized.
  getServiceFees: async (): Promise<ServiceFee[]> => {
    const response = await api.get("/settings/service-fees");
    return response.data;
  },

  createServiceFee: async (data: Partial<ServiceFee>): Promise<ServiceFee> => {
    const response = await api.post("/settings/service-fees", data);
    return response.data;
  },

  updateServiceFee: async (
    id: string,
    data: Partial<ServiceFee>,
  ): Promise<ServiceFee> => {
    const response = await api.put(`/settings/service-fees/${id}`, data);
    return response.data;
  },

  deleteServiceFee: async (id: string): Promise<void> => {
    await api.delete(`/settings/service-fees/${id}`);
  },

  // Admin-facing user management lives here to keep it aligned with the settings surface instead of the auth bootstrap flow.
  getUsers: async (): Promise<User[]> => {
    const response = await api.get("/settings/users");
    return response.data;
  },

  updateProfile: async (profilePicture: string | null): Promise<User> => {
    const response = await api.put("/settings/profile", {
      profilePicture,
    });
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/settings/users/${id}`, data);
    return response.data;
  },

  createUser: async (
    email: string,
    fullName: string,
    password: string,
    role: string,
  ): Promise<User> => {
    const response = await api.post("/auth/admin/create-user", {
      email,
      fullName,
      password,
      role,
    });
    return response.data;
  },

  getProducts: async (): Promise<Product[]> => {
    const response = await api.get("/settings/products");
    return response.data;
  },

  createProduct: async (data: CreateProductDto): Promise<Product> => {
    const response = await api.post("/settings/products", data);
    return response.data;
  },

  updateProduct: async (
    id: string,
    data: UpdateProductDto,
  ): Promise<Product> => {
    const response = await api.put(`/settings/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/settings/products/${id}`);
  },

  sellProduct: async (id: string): Promise<Product> => {
    const response = await api.post(`/settings/products/${id}/sell`);
    return response.data;
  },
};
