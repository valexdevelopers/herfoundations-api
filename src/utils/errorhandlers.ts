export class AuthError extends Error {
  public statusCode: number
  public message: string
  public code?: string

  constructor(message: string, statusCode = 400, code?: string, ) {
    super(message)
    this.name = 'AuthError'
    this.statusCode = statusCode
    this.code = code
    this.message = message
    Error.captureStackTrace(this, this.constructor)
  }
}