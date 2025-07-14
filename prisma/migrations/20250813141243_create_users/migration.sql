-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('admin', 'doctor', 'patient');

-- CreateEnum
CREATE TYPE "AuthenticationProviders" AS ENUM ('google', 'apple', 'facebook');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('passwordReset', 'deleteAccount', 'verifyEmail', 'verifyPhone');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "EmailVerificationStatus" AS ENUM ('pending', 'verified');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'restricted', 'deleted');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "phoneNumber" TEXT,
    "avatar" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "languagePreference" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "userType" "UserType" NOT NULL,
    "password" TEXT,
    "refreshToken" TEXT,
    "status" "UserStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "deleteReason" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthenticationProviders" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "user_id" TEXT NOT NULL,
    "specialization" TEXT,
    "yearsOfExperience" INTEGER,
    "hospitalAffiliation" TEXT,
    "consultationFee" DOUBLE PRECISION,
    "bio" TEXT,
    "availableTimeSlots" JSONB,
    "facialVerificationImage" TEXT,
    "idCardType" TEXT,
    "idNumber" TEXT,
    "idExpiryDate" TIMESTAMP(3),
    "facialVerificationStatus" "VerificationStatus",
    "idVerificationStatus" "VerificationStatus",
    "license" TEXT,
    "licenseVerificationStatus" "VerificationStatus",
    "licenseExpiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "user_id" TEXT NOT NULL,
    "emergencyContact" JSONB,
    "bloodType" TEXT,
    "genotype" TEXT,
    "allergies" TEXT[],
    "chronicConditions" TEXT[],

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "PersonalAccessToken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cycle" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "symptoms" TEXT[],
    "notes" TEXT,

    CONSTRAINT "Cycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HormoneLog" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hormoneType" TEXT NOT NULL,
    "level" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "HormoneLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationalMaterial" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT[],
    "tags" TEXT[],
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EducationalMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "imageUrls" TEXT[],

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthProvider_provider_providerUserId_key" ON "AuthProvider"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthProvider_userId_provider_providerUserId_key" ON "AuthProvider"("userId", "provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthProvider_userId_provider_key" ON "AuthProvider"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalAccessToken_token_key" ON "PersonalAccessToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalAccessToken_user_id_type_key" ON "PersonalAccessToken"("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalAccessToken_type_token_key" ON "PersonalAccessToken"("type", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalAccessToken_user_id_type_token_key" ON "PersonalAccessToken"("user_id", "type", "token");

-- AddForeignKey
ALTER TABLE "AuthProvider" ADD CONSTRAINT "AuthProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalAccessToken" ADD CONSTRAINT "PersonalAccessToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cycle" ADD CONSTRAINT "Cycle_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HormoneLog" ADD CONSTRAINT "HormoneLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
