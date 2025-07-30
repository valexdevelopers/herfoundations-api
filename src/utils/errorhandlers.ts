import { ErrorCodes } from "./enums";

export class AppError extends Error {
	public statusCode: number
	public message: string
	public code?: string

	constructor(message: string, statusCode = 400, code?: string, name?: string) {
		super(message)
		this.name = name || this.constructor.name
		this.statusCode = statusCode
		this.code = code
		this.message = message
		Error.captureStackTrace(this, this.constructor)
	}
}


export class AuthError extends AppError {
	constructor(message: string, statusCode = 400, code?: string, name = "Auth Error") {
		super(message, statusCode, code, name)
	}
}


export class ValidationsError extends AppError {
	constructor(message: string, statusCode = 400, code?: string, name = "Validation Error") {
		super(message, statusCode, code, name)
	}
}

export class DatabaseError extends AppError {
	constructor(message: string, statusCode = 500, code?: string, error?: any) {
		let name = "Database Error"
		switch (error!.constructor.name) {
			case "PrismaClientInitializationError":
				name="Database Error"
				message = `Database connection failed. Authentication failed against database server, the provided database credentials are not valid`;
				code = "PrismaClientInitializationError";
				statusCode = 503;
				break;

			case "PrismaClientKnownRequestError":
				name="Database Error PrismaClientKnownRequestError"
				switch (error!.code) {
					case "P2002":
						message = `Duplicate model detected, model already exists (duplicate)`;
						code = "DB_DUPLICATE";
						statusCode = 409;
						break;

					case "P2025":
						message = `model not found`;
						code = "DB_NOT_FOUND";
						statusCode = 404;
						break;
					default:
						message = `Database request error (${error.code}) detected`;
						code = `DB_${error.code}`;
						break;
				}
				break;

			case "PrismaClientRustPanicError":
				name=error.constructor.name
				message = `Database engine crashed. Contact server administrator`;
				code = "DB_ENGINE_PANIC";
				statusCode = 500;
				break;

			case "PrismaClientInitializationError":
				name=error.constructor.name
				message = `Database Validation error. Request is missing non nullable data`;
				code = ErrorCodes.MISING_DATA;
				statusCode = 403;
				break;

			default:
				message = error.message;
				name = error.constructor.name || name;
				code = ErrorCodes.INTERNAL_ERROR;
				break;
		}
		super(message, statusCode, code, name)
	}
}


export class RetryError extends AppError {
	constructor(message: string, statusCode = 400, code?: string, name = "Retry Error") {
		super(message, statusCode, code, name)
	}
}

