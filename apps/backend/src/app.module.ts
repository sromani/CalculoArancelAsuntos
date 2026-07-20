import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { GastosModule } from './estudio/gastos/gastos.module';
import { EstudioAuthModule } from './estudio/auth/estudio-auth.module';
import { ClientesModule } from './estudio/clientes/clientes.module';
import { PresupuestosModule } from './estudio/presupuestos/presupuestos.module';
import { SimuladorModule } from './simulador/simulador.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    SimuladorModule,
    EstudioAuthModule,
    GastosModule,
    ClientesModule,
    PresupuestosModule,
  ],
})
export class AppModule {}
