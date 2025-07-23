import { IsBoolean, IsDate, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
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
