import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { LoginDto, SignupDto, AuthResponse } from './auth.types';

@Injectable()
export class AuthService {
  private supabase;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    const { user, session } = data;

    // Get additional user data from our database
    const { data: userData, error: dbError } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (dbError) {
      throw new UnauthorizedException('Failed to get user data');
    }

    return {
      access_token: session.access_token,
      token_type: session.token_type,
      expires_in: session.expires_in,
      user: {
        id: user.id,
        email: user.email,
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
      },
    };
  }

  async signup(signupDto: SignupDto): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signUp({
      email: signupDto.email,
      password: signupDto.password,
      options: {
        data: {
          first_name: signupDto.first_name,
          last_name: signupDto.last_name,
        },
        emailRedirectTo: undefined,
        emailConfirm: false,
      },
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    const { user, session } = data;

    // Create user record in our database
    const { error: dbError } = await this.supabase
      .from('users')
      .insert([
        {
          email: signupDto.email,
          first_name: signupDto.first_name,
          last_name: signupDto.last_name,
          role: 'user'
        }
      ]);

    if (dbError) {
      throw new UnauthorizedException('Failed to create user record');
    }

    return {
      access_token: session.access_token,
      token_type: session.token_type,
      expires_in: session.expires_in,
      user: {
        id: user.id,
        email: user.email,
        first_name: signupDto.first_name,
        last_name: signupDto.last_name,
      },
    };
  }

  async validateToken(token: string): Promise<boolean> {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      return false;
    }

    return true;
  }
} 