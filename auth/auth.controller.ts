import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto, AuthResponse } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponse> {
    try {
      return await this.authService.signup(signupDto);
    } catch (error) {
      throw new UnauthorizedException('Unable to create account');
    }
  }
} 