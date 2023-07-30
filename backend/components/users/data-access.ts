import { users, usersAttributes } from "../../db/models/users";

export const createUser = async (userData: usersAttributes): Promise<users> => {
  return await users.create(userData);
};

export const getUserByProviderId = async (
  providerId: string
): Promise<users | null> => {
  return await users.findOne({ where: { providerId } });
};

export const getUserById = async (id: number): Promise<users | null> => {
  return await users.findOne({ where: { id } });
};

export const getUserByEmail = async (email: string): Promise<users | null> => {
  return await users.findOne({ where: { email } });
};
