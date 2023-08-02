import { NextFunction, Request, Response } from "express";
import { Sequelize } from "sequelize-typescript";
import { organisations, users } from "../db/models";
// Retrieve values from .env file or default values
const database = process.env.DB_NAME || "pathfinder";
const username = process.env.DB_USERNAME || "postgres";
const password = process.env.DB_PASSWORD || "postgres";
const port = process.env.DB_PORT || 5430;
const host = process.env.DB_HOST || "localhost";

// Setup sequelize instance
export const sequelize = new Sequelize({
  database: database,
  username: username,
  password: password,
  host: host,
  port: Number(port),
  dialect: "postgres",
  logging: false,
  models: [__dirname + "/models"], // assuming your models are in a folder named 'models' in the same directory
});

sequelize.addModels([users, organisations]);
// Sync all models with the database
sequelize
  .sync()
  .then(() => {
    console.log("All models were synchronized successfully.");
  })
  .catch((err) => {
    console.error("Unable to sync models with the database:", err);
  });

// Export custom middleware
export function dbMiddleware(req: Request, res: Response, next: NextFunction) {
  // You can perform any additional logic related to the database here if needed.
  next();
}
