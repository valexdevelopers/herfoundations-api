import { UserStatus, UserType, VerificationStatus } from "../../enums";

export interface UserDto {
  id: string;
  email: string;
  isEmailVerified: boolean;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  avatar: string | null;
  dateOfBirth: Date | null  ;
  gender: string | null;
  address: string | null;
  languagePreference: string | null;
  lastLoginAt: Date | null ;
  userType: UserType;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  doctor?: DoctorDto | null;
  patient?: PatientDto | null;
  admin?: AdminDto | null;
}


export interface DoctorDto {
  id: string;
  specialization?: string;
  yearsOfExperience?: number;
  hospitalAffiliation?: string;
  consultationFee?: number;
  bio?: string;
  availableTimeSlots?: any; // JSON
  facialVerificationImage?: string;
  idCardType?: string;
  idNumber?: string;
  idExpiryDate?: Date;
  facialVerificationStatus?: VerificationStatus;
  idVerificationStatus?: VerificationStatus;
  license?: string;
  licenseVerificationStatus?: VerificationStatus;
  licenseExpiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientDto {
  id: string;
  emergencyContact?: any; // JSON
  bloodType?: string;
  genotype?: string;
  allergies: string[];
  chronicConditions: string[];
  cycleHistory: any[];
  hormoneLogs: any[];
}

export interface AdminDto {
  id: string;
}

// export interface  Cycle {
//   id        String   @id @default(uuid())
//   patient   Patient  @relation(fields: [patientId], references: [id])
//   patientId String
//   startDate DateTime
//   endDate   DateTime
//   symptoms  String[] // e.g., ["cramps", "headache"]
//   notes     String?
// }

// export interface  HormoneLog {
//   id          String   @id @default(uuid())
//   patient     Patient  @relation(fields: [patientId], references: [id])
//   patientId   String
//   date        DateTime
//   hormoneType String // e.g., "estrogen", "progesterone"
//   level       Float
//   unit        String // e.g., "ng/dL"
// }