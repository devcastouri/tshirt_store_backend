import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getUserById(id: string): Promise<{
        data: {
            user: any;
        };
    }>;
    getUserByEmail(email: string): Promise<{
        data: {
            user: any;
        };
    }>;
}
