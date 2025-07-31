import { JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    user?: string | JwtPayload; // or define your own custom User type
  }
}
