export interface IAuthRepository {
    create(data:any): Promise<any>
    login(data:any): Promise<any>
    findOneByEmail(email:string): Promise<any>
}

export interface JwtPayload {
  userId: string;
  email: string;
}