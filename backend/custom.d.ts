import { usersAttributes } from "./db/models";

export interface PassportUser extends Express.User, usersAttributes {}
