import { ConfigService } from '@nestjs/config';
export declare class UsersService {
    private configService;
    private supabase;
    constructor(configService: ConfigService);
    getUserById(id: string): Promise<{
        user: any;
    }>;
    getUserByEmail(email: string): Promise<{
        user: any;
    }>;
}
