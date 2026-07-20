import { Module, Global } from '@nestjs/common';
import { PrismaAuthService } from './prisma-auth.service';
import { PrismaEstudioService } from './prisma-estudio.service';

@Global()
@Module({
  providers: [PrismaAuthService, PrismaEstudioService],
  exports: [PrismaAuthService, PrismaEstudioService],
})
export class PrismaModule {}
