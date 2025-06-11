export interface LoginDto {
    email: string;
    password: string;
}
export interface SignupDto extends LoginDto {
    first_name: string;
    last_name: string;
}
export interface AuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
    };
}
