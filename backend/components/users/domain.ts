import * as dataAccess from "./data-access";
import { usersAttributes } from "../../db/models";

export const createUser = async (userData: usersAttributes) => {
  return await dataAccess.createUser(userData);
};

export const getUser = async (userId: number) => {
  return await dataAccess.getUserById(userId);
};

export const getUserByEmail = async (email: string) => {
  return await dataAccess.getUserByEmail(email);
};

export const getUserByProviderId = async (providerId: string) => {
  return await dataAccess.getUserByProviderId(providerId);
};
