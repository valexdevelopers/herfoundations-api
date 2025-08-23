import { IsArray, IsBoolean, IsDate, IsDateString, IsEnum, IsInt, IsJSON, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { Type } from "class-transformer";
import { $Enums } from "../../../../@prisma/client";

export class UpdateUserDto {
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;


  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: "female" | "male"; 

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  languagePreference?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastLoginAt?: Date;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsEnum($Enums.UserStatus)
  status?: $Enums.UserStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deletedAt?: Date;

  @IsOptional()
  @IsUUID()
  deletedBy?: string;

  @IsOptional()
  @IsString()
  deleteReason?: string;
}

enum CyclePattern {
  regular = "regular",
  irregular = "irregular",
  unknown = "unknown"
}

export class UpdatePatientDto {
  @IsOptional()
  @IsJSON()
  emergencyContact?: any;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  height?: number; // kg only

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  weight?: number; // in cm only

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  bmi?: number;

  @IsOptional()
  @IsString()
  bloodType?: string; // e.g., "A+", "O-"

  @IsOptional()
  @IsString()
  genotype?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicConditions?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  averagePeriodLength?: number;

  @IsOptional()
  @IsJSON()
  cyclePattern?: Record<string, string>; //  stores time range and the cycle pattern, e.g. {"2025-08-01_2025-12-31": "regular"}
}

export class PatientOnboardingDto {
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  middleName!: string;

  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @IsNotEmpty()
  @IsDateString()
  dateOfBirth!: string;

  @IsNotEmpty()
  @IsString()
  gender!: "female" | "male";

  @IsNotEmpty()
  @IsInt()
  lengthOfPeriod!: number;

  @IsNotEmpty()
  @IsEnum(CyclePattern)
  pattern!: CyclePattern;

  @IsNotEmpty()
  @IsDateString()
  periodStartDate!: string;

  @IsNotEmpty()
  @IsDateString()
  periodEndDate!: string;

  @IsNotEmpty()
  @IsString({ each: true })
  symptoms!: string[];

  @IsNotEmpty()
  @IsString()
  mood!: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 }, { message: 'Height must be a number with up to 1 decimal place.' })
  height!: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 }, { message: 'Weight must be a number with up to 1 decimal place.' })
  weight!: number;
}
