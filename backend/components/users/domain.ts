import * as dataAccess from "./data-access";
import { usersAttributes } from "../../db/models/users";

export const createUser = async (userData: usersAttributes) => {
  return await dataAccess.createUser(userData);
};

export const getUser = async (userId: number) => {
  return await dataAccess.getUserById(userId);
};

export const getUserByEmail = async (email: string) => {
  return await dataAccess.getUserByEmail(email);
};

export const getUserById = async (id: number) => {
  return await dataAccess.getUserById(id);
};

export const getUserByProviderId = async (provider_id: string) => {
  return await dataAccess.getUserByProviderId(provider_id);
};
