import { $Enums, Admin, AuthProvider, Doctor, Patient, PersonalAccessToken, Prisma } from "../../../@prisma/client";
import { UserStatus } from "../../../@prisma/client";
import { UpdateUserDto } from "../dtos/user/update-user.dto";
import { UserType } from "../enums";

export type AtLeastOne<T, K extends keyof T = keyof T> =
  K extends keyof T
    ? Required<Pick<T, K>> & Partial<Omit<T, K>>
    : never;

export type FindUniqueUser = AtLeastOne<{
  email: string;
  id: string;
  refreshToken: string;
}>;

export interface IAuthRepository {
    createUser(data:any): Promise<any>
    updateUser(findBy: FindUniqueUser, data: UpdateUserDto): Promise<any>
    findOneByEmail(email:string): Promise<any>
    findOneById(id: string): Promise<any>
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