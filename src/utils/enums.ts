export enum AuthErrorCode {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  MISING_DATA = 'MISING_DATA',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  GOOGLE_AUTH_FAILED = 'GOOGLE_AUTH_FAILED',
  AUTH_FAILED = 'AUTH_FAILED',
  ACCOUNT_NOT_VERIFIED = 'ACCOUNT_NOT_VERIFIED',
  ACCOUNT_RESTRICTED = 'ACCOUNT_RESTRICTED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
  
}

export enum UserType {
  admin = 'admin',
  doctor = 'doctor',
  patient = 'patient'
}

export enum UserStatus {
  active  = 'active',
  restricted = 'restricted',
  deleted = 'deleted'
}

export enum VerificationStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected'
}
