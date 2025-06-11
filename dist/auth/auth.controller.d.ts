import { AuthService } from './auth.service';
import { LoginDto, SignupDto, AuthResponse } from './auth.types';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<AuthResponse>;
    signup(signupDto: SignupDto): Promise<AuthResponse>;
}
