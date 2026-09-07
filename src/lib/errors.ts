// ═══════════════════════════════════════════════════════════════
// BASE APPLICATION ERROR
// ═══════════════════════════════════════════════════════════════

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    options: {
      code?: string;
      statusCode?: number;
      isOperational?: boolean;
      details?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = options.code ?? "INTERNAL_ERROR";
    this.statusCode = options.statusCode ?? 500;
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;
    this.timestamp = new Date();

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION ERRORS
// ═══════════════════════════════════════════════════════════════

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, {
      code: "AUTHENTICATION_ERROR",
      statusCode: 401,
      isOperational: true,
    });
    this.name = "AuthenticationError";
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = "Invalid email or password") {
    super(message, {
      code: "INVALID_CREDENTIALS",
      statusCode: 401,
      isOperational: true,
    });
    this.name = "InvalidCredentialsError";
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = "Token has expired") {
    super(message, {
      code: "TOKEN_EXPIRED",
      statusCode: 401,
      isOperational: true,
    });
    this.name = "TokenExpiredError";
  }
}

export class InvalidTokenError extends AppError {
  constructor(message = "Invalid token") {
    super(message, {
      code: "INVALID_TOKEN",
      statusCode: 401,
      isOperational: true,
    });
    this.name = "InvalidTokenError";
  }
}

export class AccountDeactivatedError extends AppError {
  constructor(message = "Account has been deactivated") {
    super(message, {
      code: "ACCOUNT_DEACTIVATED",
      statusCode: 403,
      isOperational: true,
    });
    this.name = "AccountDeactivatedError";
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTHORIZATION ERRORS
// ═══════════════════════════════════════════════════════════════

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, {
      code: "AUTHORIZATION_ERROR",
      statusCode: 403,
      isOperational: true,
    });
    this.name = "AuthorizationError";
  }
}

export class PermissionDeniedError extends AppError {
  constructor(
    message = "Permission denied",
    details?: { permission?: string; resource?: string }
  ) {
    super(message, {
      code: "PERMISSION_DENIED",
      statusCode: 403,
      isOperational: true,
      details: details as Record<string, unknown>,
    });
    this.name = "PermissionDeniedError";
  }
}

export class OwnershipRequiredError extends AppError {
  constructor(message = "You must be the owner to perform this action") {
    super(message, {
      code: "OWNERSHIP_REQUIRED",
      statusCode: 403,
      isOperational: true,
    });
    this.name = "OwnershipRequiredError";
  }
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION ERRORS
// ═══════════════════════════════════════════════════════════════

export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message = "Validation failed",
    fieldErrors: Record<string, string[]> = {}
  ) {
    super(message, {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      isOperational: true,
      details: { fieldErrors },
    });
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }

  static fromZodError(error: {
    issues: Array<{
      path: (string | number)[];
      message: string;
    }>;
  }): ValidationError {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of error.issues) {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    }

    return new ValidationError("Validation failed", fieldErrors);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fieldErrors: this.fieldErrors,
    };
  }
}

export class RequiredFieldError extends AppError {
  constructor(field: string) {
    super(`${field} is required`, {
      code: "REQUIRED_FIELD",
      statusCode: 400,
      isOperational: true,
      details: { field },
    });
    this.name = "RequiredFieldError";
  }
}

export class InvalidFormatError extends AppError {
  constructor(field: string, expected: string) {
    super(`Invalid format for ${field}. Expected: ${expected}`, {
      code: "INVALID_FORMAT",
      statusCode: 400,
      isOperational: true,
      details: { field, expected },
    });
    this.name = "InvalidFormatError";
  }
}

// ═══════════════════════════════════════════════════════════════
// NOT FOUND ERRORS
// ═══════════════════════════════════════════════════════════════

export class NotFoundError extends AppError {
  constructor(
    resource: string,
    identifier?: string | number
  ) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, {
      code: "NOT_FOUND",
      statusCode: 404,
      isOperational: true,
      details: { resource, identifier: identifier as string },
    });
    this.name = "NotFoundError";
  }
}

export class FarmNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super("Farm", identifier);
    this.name = "FarmNotFoundError";
    this.code = "FARM_NOT_FOUND";
  }
}

export class CropNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super("Crop", identifier);
    this.name = "CropNotFoundError";
    this.code = "CROP_NOT_FOUND";
  }
}

export class EquipmentNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super("Equipment", identifier);
    this.name = "EquipmentNotFoundError";
    this.code = "EQUIPMENT_NOT_FOUND";
  }
}

export class OrderNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super("Order", identifier);
    this.name = "OrderNotFoundError";
    this.code = "ORDER_NOT_FOUND";
  }
}

export class ContractNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super("Contract", identifier);
    this.name = "ContractNotFoundError";
    this.code = "CONTRACT_NOT_FOUND";
  }
}

export class MarketNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super("Market", identifier);
    this.name = "MarketNotFoundError";
    this.code = "MARKET_NOT_FOUND";
  }
}

export class SensorNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super("Sensor", identifier);
    this.name = "SensorNotFoundError";
    this.code = "SENSOR_NOT_FOUND";
  }
}

// ═══════════════════════════════════════════════════════════════
// CONFLICT ERRORS
// ═══════════════════════════════════════════════════════════════

export class ConflictError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, {
      code: "CONFLICT",
      statusCode: 409,
      isOperational: true,
      details,
    });
    this.name = "ConflictError";
  }
}

export class DuplicateEmailError extends ConflictError {
  constructor(email: string) {
    super(`An account with email '${email}' already exists`, {
      email,
    });
    this.name = "DuplicateEmailError";
    this.code = "DUPLICATE_EMAIL";
  }
}

export class DuplicateResourceError extends ConflictError {
  constructor(resource: string, field: string, value: string) {
    super(`${resource} with ${field} '${value}' already exists`, {
      resource,
      field,
      value,
    });
    this.name = "DuplicateResourceError";
    this.code = "DUPLICATE_RESOURCE";
  }
}

// ═══════════════════════════════════════════════════════════════
// STATE ERRORS
// ═══════════════════════════════════════════════════════════════

export class StateError extends AppError {
  constructor(
    message: string,
    current: string,
    required: string | string[]
  ) {
    super(message, {
      code: "INVALID_STATE",
      statusCode: 422,
      isOperational: true,
      details: { current, required },
    });
    this.name = "StateError";
  }
}

export class InvalidOrderStateError extends StateError {
  constructor(currentStatus: string, allowedStatuses: string[]) {
    super(
      `Cannot transition order from '${currentStatus}' to the requested state`,
      currentStatus,
      allowedStatuses
    );
    this.name = "InvalidOrderStateError";
    this.code = "INVALID_ORDER_STATE";
  }
}

export class InvalidContractStateError extends StateError {
  constructor(currentStatus: string, allowedStatuses: string[]) {
    super(
      `Cannot transition contract from '${currentStatus}' to the requested state`,
      currentStatus,
      allowedStatuses
    );
    this.name = "InvalidContractStateError";
    this.code = "INVALID_CONTRACT_STATE";
  }
}

export class CropNotHarvestableError extends StateError {
  constructor(cropId: string, currentStage: string) {
    super(
      `Crop is not ready for harvest. Current stage: ${currentStage}`,
      currentStage,
      ["MATURING", "READY_FOR_HARVEST"]
    );
    this.name = "CropNotHarvestableError";
    this.code = "CROP_NOT_HARVESTABLE";
  }
}

// ═══════════════════════════════════════════════════════════════
// QUOTA & LIMIT ERRORS
// ═══════════════════════════════════════════════════════════════

export class QuotaExceededError extends AppError {
  constructor(
    resource: string,
    limit: number,
    current: number
  ) {
    super(`Quota exceeded for ${resource}. Limit: ${limit}, Current: ${current}`, {
      code: "QUOTA_EXCEEDED",
      statusCode: 429,
      isOperational: true,
      details: { resource, limit, current },
    });
    this.name = "QuotaExceededError";
  }
}

export class RateLimitError extends AppError {
  constructor(
    retryAfter: number,
    message = "Too many requests"
  ) {
    super(message, {
      code: "RATE_LIMITED",
      statusCode: 429,
      isOperational: true,
      details: { retryAfter },
    });
    this.name = "RateLimitError";
  }
}

export class FileSizeLimitError extends AppError {
  constructor(maxSizeMb: number) {
    super(`File size exceeds the limit of ${maxSizeMb}MB`, {
      code: "FILE_SIZE_LIMIT",
      statusCode: 413,
      isOperational: true,
      details: { maxSizeMb },
    });
    this.name = "FileSizeLimitError";
  }
}

// ═══════════════════════════════════════════════════════════════
// EXTERNAL SERVICE ERRORS
// ═══════════════════════════════════════════════════════════════

export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string,
    options?: { cause?: Error; statusCode?: number }
  ) {
    super(`External service error (${service}): ${message}`, {
      code: "EXTERNAL_SERVICE_ERROR",
      statusCode: options?.statusCode ?? 502,
      isOperational: true,
      details: { service },
      cause: options?.cause,
    });
    this.name = "ExternalServiceError";
  }
}

export class WeatherServiceError extends ExternalServiceError {
  constructor(message: string, cause?: Error) {
    super("WeatherAPI", message, { cause });
    this.name = "WeatherServiceError";
    this.code = "WEATHER_SERVICE_ERROR";
  }
}

export class SatelliteServiceError extends ExternalServiceError {
  constructor(message: string, cause?: Error) {
    super("SatelliteAPI", message, { cause });
    this.name = "SatelliteServiceError";
    this.code = "SATELLITE_SERVICE_ERROR";
  }
}

export class PaymentServiceError extends ExternalServiceError {
  constructor(message: string, cause?: Error) {
    super("PaymentGateway", message, { cause });
    this.name = "PaymentServiceError";
    this.code = "PAYMENT_SERVICE_ERROR";
  }
}

export class EmailServiceError extends ExternalServiceError {
  constructor(message: string, cause?: Error) {
    super("EmailService", message, { cause });
    this.name = "EmailServiceError";
    this.code = "EMAIL_SERVICE_ERROR";
  }
}

// ═══════════════════════════════════════════════════════════════
// FILE & UPLOAD ERRORS
// ═══════════════════════════════════════════════════════════════

export class FileUploadError extends AppError {
  constructor(message: string, details?: { fileName?: string; mimeType?: string }) {
    super(message, {
      code: "FILE_UPLOAD_ERROR",
      statusCode: 400,
      isOperational: true,
      details: details as Record<string, unknown>,
    });
    this.name = "FileUploadError";
  }
}

export class InvalidFileTypeError extends FileUploadError {
  constructor(fileName: string, allowedTypes: string[]) {
    super(`Invalid file type for '${fileName}'. Allowed: ${allowedTypes.join(", ")}`, {
      fileName,
      mimeType: allowedTypes.join(", "),
    });
    this.name = "InvalidFileTypeError";
    this.code = "INVALID_FILE_TYPE";
  }
}

// ═══════════════════════════════════════════════════════════════
// DATABASE ERRORS
// ═══════════════════════════════════════════════════════════════

export class DatabaseError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, {
      code: "DATABASE_ERROR",
      statusCode: 500,
      isOperational: false,
      cause,
    });
    this.name = "DatabaseError";
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(cause?: Error) {
    super("Failed to connect to database", cause);
    this.name = "DatabaseConnectionError";
    this.code = "DATABASE_CONNECTION_ERROR";
  }
}

export class DatabaseQueryError extends DatabaseError {
  constructor(query: string, cause?: Error) {
    super(`Database query failed: ${query}`, cause);
    this.name = "DatabaseQueryError";
    this.code = "DATABASE_QUERY_ERROR";
  }
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL ERRORS
// ═══════════════════════════════════════════════════════════════

export class InternalError extends AppError {
  constructor(message = "An unexpected error occurred", cause?: Error) {
    super(message, {
      code: "INTERNAL_ERROR",
      statusCode: 500,
      isOperational: false,
      cause,
    });
    this.name = "InternalError";
  }
}

export class NotImplementedError extends AppError {
  constructor(feature: string) {
    super(`Feature '${feature}' is not yet implemented`, {
      code: "NOT_IMPLEMENTED",
      statusCode: 501,
      isOperational: true,
    });
    this.name = "NotImplementedError";
  }
}

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLING UTILITIES
// ═══════════════════════════════════════════════════════════════

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message, error);
  }

  if (typeof error === "string") {
    return new InternalError(error);
  }

  return new InternalError("An unknown error occurred");
}

export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}

export function getErrorResponse(error: unknown) {
  const appError = toAppError(error);

  return {
    success: false as const,
    error: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    details: appError.details,
    timestamp: appError.timestamp.toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// ERROR RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

export type ErrorResponse = {
  success: false;
  error: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp: string;
};

export type SuccessResponse<T = unknown> = {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
};

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
