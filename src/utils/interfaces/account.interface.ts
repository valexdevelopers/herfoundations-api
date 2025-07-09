import { $Enums, Admin, AuthProvider, Doctor, Patient, PersonalAccessToken, Prisma } from "../../../@prisma/client";
import { UserStatus } from "../../../@prisma/client";
import { UserType } from "../enums";

export interface IAuthRepository {
    create(data:any): Promise<any>
    // login(data:any): Promise<any>
    findOneByEmail(email:string): Promise<any>
}

export interface IAuthProviderRepository {
    findOneByIdProvider(userId: string, provider: $Enums.AuthenticationProviders): Promise<AuthProvider>
    connectUser(data:any): Promise<AuthProvider>
    googleAuthProvider(idToken:string): Promise<any>
}

export interface IPatientRepository {
    create(data: Prisma.PatientCreateInput): Promise<Patient>

}

export interface IAdminRepository {
    create(data: Prisma.AdminCreateInput): Promise<Admin>

}

export interface IDoctorRepository {
    create(data: Prisma.DoctorCreateInput): Promise<Doctor>
    // connectUser(data:any): Promise<AuthProvider>
    // googleAuthProvider(idToken:string): Promise<any>
}

export interface IPersonalAccessRepository {
    create(data: Prisma.PersonalAccessTokenCreateInput): Promise<PersonalAccessToken>
    
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