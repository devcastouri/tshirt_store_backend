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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let AuthService = class AuthService {
    constructor(configService) {
        this.configService = configService;
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseKey = this.configService.get('SUPABASE_SERVICE_KEY');
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase configuration');
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    async login(loginDto) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: loginDto.email,
            password: loginDto.password,
        });
        if (error) {
            throw new common_1.UnauthorizedException(error.message);
        }
        const { user, session } = data;
        const { data: userData, error: dbError } = await this.supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();
        if (dbError) {
            throw new common_1.UnauthorizedException('Failed to get user data');
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
    async signup(signupDto) {
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
            throw new common_1.UnauthorizedException(error.message);
        }
        const { user, session } = data;
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
            throw new common_1.UnauthorizedException('Failed to create user record');
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
    async validateToken(token) {
        const { data, error } = await this.supabase.auth.getUser(token);
        if (error || !data.user) {
            return false;
        }
        return true;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map