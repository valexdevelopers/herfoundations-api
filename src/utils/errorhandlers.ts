export class AuthError extends Error {
  public statusCode: number
  public code?: string

  constructor(message: string, statusCode = 400, code?: string) {
    super(message)
    this.name = 'AuthError'
    this.statusCode = statusCode
    this.code = code
    Error.captureStackTrace(this, this.constructor)
  }
}