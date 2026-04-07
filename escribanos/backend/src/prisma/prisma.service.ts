import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  /** Sin conexión en el arranque: Nest escucha aunque Postgres esté abajo; Prisma conecta al primer query. */

  async onModuleDestroy() {
    await this.$disconnect();
  }
}