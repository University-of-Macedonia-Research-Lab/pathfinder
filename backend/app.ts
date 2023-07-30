// app.ts
import express from "express";
import { json } from "body-parser";
import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") dotenv.config();

import morgan from "morgan";

// Import any cross-cutting middleware
import { errorHandler, notFoundHandler } from "./libraries/errorHandlers";
import { authMiddleware } from "./libraries/authMiddleware";
import { dbMiddleware } from "./libraries/db";
import userRouter from "./components/users/api";
import cors from "cors";
// Load the .env file synchronously for local development
if (process.env.NODE_ENV !== "production") dotenv.config();

// Create the express app
const app = express();

// Use middleware
app.use(json());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.set("trust proxy", 1); // trust first proxy

app.use(morgan("dev"));

// Initialize auth middleware
authMiddleware(app);

// Use the custom middleware to initialize the database
app.use(dbMiddleware);

app.use(userRouter);
// Error handlers - these should come last
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running in http://localhost:${PORT}`);
});
