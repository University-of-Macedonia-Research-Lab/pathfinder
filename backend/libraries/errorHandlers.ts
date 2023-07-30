import { Request, Response, NextFunction } from "express";

// Not Found Handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).send({
    error: "Not Found",
    message: `Resource not found at ${req.originalUrl}`,
  });
};

// Error Handler
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);

  res.status(statusCode).json({
    error: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? {} : err.stack,
  });
};
