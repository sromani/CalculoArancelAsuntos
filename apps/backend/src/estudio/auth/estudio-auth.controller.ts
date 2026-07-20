import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { EstudioAuthService } from './estudio-auth.service';
import { EstudioLoginDto } from './estudio-auth.dto';
import { EstudioAuthGuard } from './estudio-auth.guard';
import { EstudioSessionUser } from './estudio-session.decorator';
import type { EstudioSession } from '@shared/types';

@Controller('estudio/auth')
export class EstudioAuthController {
  constructor(private auth: EstudioAuthService) {}

  @Post('login')
  login(@Body() dto: EstudioLoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(EstudioAuthGuard)
  @Get('me')
  me(@EstudioSessionUser() sesion: EstudioSession) {
    return sesion;
  }
}
