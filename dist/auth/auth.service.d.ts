import { ConfigService } from '@nestjs/config';
import { LoginDto, SignupDto, AuthResponse } from './auth.types';
export declare class AuthService {
    private configService;
    private supabase;
    constructor(configService: ConfigService);
    login(loginDto: LoginDto): Promise<AuthResponse>;
    signup(signupDto: SignupDto): Promise<AuthResponse>;
    validateToken(token: string): Promise<boolean>;
}
