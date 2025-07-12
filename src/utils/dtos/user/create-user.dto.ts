import { IsEmail, IsOptional, IsString, IsIn, IsBoolean, IsNotEmpty, ValidateIf } from 'class-validator';

export class CreateUserDto {
    @ValidateIf((o) => !o.authToken)
    @IsOptional()
    @IsEmail({}, { message: 'Invalid email format' })
    email?: string;

    @ValidateIf((o) => !o.authToken)
    @IsOptional()
    @IsString({ message: 'Password must be a string' })
    password?: string;

    @IsNotEmpty()
    @IsIn(['self', 'google'], { message: 'authProvider must be either self or google' })
    authProvider!: 'self' | 'google';

    @ValidateIf((o) => !o.email && !o.password)
    @IsOptional()
    @IsString({ message: 'authToken must be a string' })
    authToken?: string;

    @IsString({ message: 'userType is required and must be a string' })
    userType!: string;

    @IsOptional()
    @IsString({ message: 'providerUserId must be a string' })
    providerUserId?: string;

    @IsOptional()
    @IsBoolean({ message: 'isEmailVerified must be a boolean' })
    isEmailVerified?: boolean;
}



export class CreateAuthProviderDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email format' })
  userId!: string;

  @IsNotEmpty()
  @IsString({ message: 'Password must be a string' })
  providerUserId!: string;

  @IsNotEmpty()
  @IsIn(['self', 'google'], { message: 'authProvider must be either self or google' })
  provider!: 'self' | 'google';
}
