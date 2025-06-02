import { UserStatus } from "../../../prisma/generated";
import { UserType } from "../enums";

export interface IAuthRepository {
    create(data:any): Promise<any>
    login(data:any): Promise<any>
    findOneByEmail(email:string): Promise<any>
}

export interface FindManyUsers{
   isEmailVerified?: boolean;
   status?: UserStatus;
   userType?: UserType; 
   deleted?: boolean; 
   gender?: "male" | "female";
   age?: number;
   languagePreference?: string;
   authProvider?: 'self' | 'google';
   date?: {
    start: Date;
    end: Date
   }
   all: boolean; // find all deleted and not deleted, active and inactive
}

export interface JwtPayload {
  userId: string;
  email: string;
}