import { Module } from '@nestjs/common';
import { EstudioAuthController } from './estudio-auth.controller';
import { EstudioAuthService } from './estudio-auth.service';

@Module({
  controllers: [EstudioAuthController],
  providers: [EstudioAuthService],
})
export class EstudioAuthModule {}
