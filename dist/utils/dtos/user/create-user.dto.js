"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAuthProviderDto = exports.CreateUserDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("../../../../@prisma/client");
class CreateUserDto {
    email;
    password;
    authProvider;
    authToken;
    userType;
    providerUserId;
    isEmailVerified;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, class_validator_1.ValidateIf)((o) => !o.authToken),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => !o.authToken),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Password must be a string' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(['self', 'google'], { message: 'authProvider must be either self or google' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "authProvider", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => !o.email && !o.password),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'authToken must be a string' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "authToken", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.$Enums.UserType, { message: 'userType is required and must be a string' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "userType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'providerUserId must be a string' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "providerUserId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'isEmailVerified must be a boolean' }),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "isEmailVerified", void 0);
class CreateAuthProviderDto {
    userId;
    providerUserId;
    provider;
}
exports.CreateAuthProviderDto = CreateAuthProviderDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
    __metadata("design:type", String)
], CreateAuthProviderDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)({ message: 'Password must be a string' }),
    __metadata("design:type", String)
], CreateAuthProviderDto.prototype, "providerUserId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(['self', 'google'], { message: 'authProvider must be either self or google' }),
    __metadata("design:type", String)
], CreateAuthProviderDto.prototype, "provider", void 0);
