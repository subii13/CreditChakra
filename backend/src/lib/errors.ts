// Structured error codes (Section 41). Route handlers throw AppError;
// middleware/errorHandler.ts turns it into { success: false, error }
// and never leaks stack traces, SQL errors, or file paths to the client.
export type ErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "NO_EVIDENCE"
  | "LLM_UNAVAILABLE"
  | "INSUFFICIENT_PROFILE_DATA"
  | "SERVER_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  INVALID_INPUT: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  NO_EVIDENCE: 404,
  LLM_UNAVAILABLE: 503,
  INSUFFICIENT_PROFILE_DATA: 422,
  SERVER_ERROR: 500,
};

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}
