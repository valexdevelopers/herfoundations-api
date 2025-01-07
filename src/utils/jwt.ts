import jwt, { Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { JwtPayload } from './interfaces/account.interface';
import ms from 'ms';
dotenv.config();

const accessSecret:Secret = process.env.JWT_ACCESS_SECRET!;
const refreshSecret:Secret = process.env.JWT_REFRESH_SECRET!;
const rawAccess = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const rawRefresh = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const accessExpiresIn = ms(rawAccess as ms.StringValue); // converts to milliseconds (number)
const refreshExpiresIn = ms(rawRefresh as ms.StringValue); // fallback to string if needed


export const generateAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, accessSecret as Secret, { expiresIn: accessExpiresIn });
};

export const generateRefreshToken = (payload: JwtPayload) => {
  return jwt.sign(payload, refreshSecret as Secret, { expiresIn: refreshExpiresIn });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, accessSecret);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, refreshSecret);
};
