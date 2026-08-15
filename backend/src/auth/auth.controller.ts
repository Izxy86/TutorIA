import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from '../../generated/prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('role') role: UserRole,
  ) {
    return this.authService.register(
      name,
      email,
      password,
      role,
    );
  }

  @Post('login')
  login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(email, password);
  }
}
