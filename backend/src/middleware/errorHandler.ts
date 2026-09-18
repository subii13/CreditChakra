import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Resource not found." } });
}

// Centralized error handler. Never forward err.message from unexpected
// (non-AppError) exceptions to the client — that's where stack traces,
// SQL text, and file paths leak from. Log the full error server-side
// only.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error({ requestId: req.requestId, err }, "AppError");
    }
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_INPUT", message: "Request failed validation.", details: err.flatten() },
    });
    return;
  }

  logger.error({ requestId: req.requestId, err }, "Unhandled error");
  res.status(500).json({
    success: false,
    error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
  });
}
