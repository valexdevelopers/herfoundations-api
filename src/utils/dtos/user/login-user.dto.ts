import { IsEmail, IsOptional, IsString, IsIn, ValidateIf, IsNotEmpty} from 'class-validator';


export class LoginUserDto {
  @ValidateIf((o) => !o.authToken)
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ValidateIf((o) => !o.authToken)
  @IsString({ message: 'Password must be a string' })
  password?: string;

  @IsNotEmpty()
  @IsIn(['self', 'google'], {
    message: 'authProvider must be either self or google',
  })
  authProvider!: 'self' | 'google';

  @ValidateIf((o) => !o.email && !o.password)
  @IsString({ message: 'authToken must be a string' })
  authToken?: string;
}