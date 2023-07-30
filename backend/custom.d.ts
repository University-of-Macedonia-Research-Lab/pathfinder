import { usersAttributes } from "./db/models";

export interface PassportUser extends Express.User, usersAttributes {}
declare global {
  namespace Express {
    interface User extends usersAttributes {}
  }
}
declare module "express-serve-static-core" {
  interface Request {
    flash: (type: string, message: any) => void;
  }
}
