import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    try {
      const result = await this.usersService.getUserById(id);
      return {
        data: {
          user: result.user
        }
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    try {
      const result = await this.usersService.getUserByEmail(email);
      return {
        data: {
          user: result.user
        }
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 