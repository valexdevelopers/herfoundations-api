import { IsOptional, IsString, IsDateString, IsInt, IsEnum, IsArray, IsNotEmpty, IsNumber, IsJSON } from "class-validator";
import { CyclePattern, CyclePhase, HormoneTrend, HormoneType, Remark } from "../../../../@prisma/client";




export class HormoneLogDto {
  @IsOptional()
  @IsString()
  id?: string;
  
  @IsOptional()
  @IsString()
  phaseId?: string;
  
  @IsOptional()
  @IsEnum(HormoneType)
  hormoneType?: HormoneType;
  
  @IsOptional()
  @IsNumber()
  level?: number;
  
  @IsOptional()
  @IsString()
  unit?: string;
  
  @IsOptional()
  @IsEnum(HormoneTrend)
  trend?: HormoneTrend;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mood?: string[];
  
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  cyclephase?: string;
}


export class PhaseLogDto {
  @IsOptional()
  @IsString()
  cycleId?: string;
  
  @IsNotEmpty()
  @IsEnum(CyclePhase)
  phase!: CyclePhase;
  
  @IsNotEmpty()
  @IsDateString()
  startDate!: string;
  
  @IsNotEmpty()
  @IsDateString()
  endDate!: string;
  
  @IsOptional()
  @IsString()
  notes?: string;
  
  @IsOptional()
  @IsArray()
  hormoneLogs?: HormoneLogDto[];
}

export class CycleDto {
  @IsNotEmpty()
  @IsString()
  patientId!: string;

  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @IsNotEmpty()
  @IsInt()
  lenghtOfCircle!: number;

  @IsNotEmpty()
  @IsInt()
  lengthOfPeriod!: number;

  @IsNotEmpty()
  @IsDateString()
  ovulationDate!: string;

  @IsNotEmpty()
  @IsDateString()
  periodStartDate!: string;

  @IsNotEmpty()
  @IsDateString()
  periodEndDate!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @IsOptional()
  @IsEnum(Remark)
  remark?: Remark;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(CyclePattern)
  pattern?: CyclePattern;

  // phases is a relation, so you may want to handle it separately or as an array of IDs
  @IsOptional()
  @IsArray()
  @IsJSON({ each: true })
  phases?: PhaseLogDto[];
}