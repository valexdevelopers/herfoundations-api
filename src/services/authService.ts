import authrepository from "../repositories/authRepository"
import { CreateUserDto, IAuthRepository } from "../utils/interfaces/account.interface"

class AuthService {
    #authReposiory: IAuthRepository
    constructor(
        authRepository: IAuthRepository
    ){
        this.#authReposiory = authRepository
    }

    public async creatAccount (data: CreateUserDto) {
        await this.#authReposiory.create(data)
                    //  emit a email verification - notification event
                    // this.notificationClient.emit(NOTIFICATIONPATTERN.SEND, {
                    //     type: 'EMAIL',
                    //     recipientId: account.user.id,
                    //     data: {
                    //         subject: 'Email Verification Notice!',
                    //         message: `Thank you for signing up! here is your verification code ${account.personalaAccessTokens.token}`,
                    //         recipientEmail: account.user.email,
                    //     },
                    // });
    }

    public async login () {
        
    }
}

export const authService = new AuthService(authrepository)