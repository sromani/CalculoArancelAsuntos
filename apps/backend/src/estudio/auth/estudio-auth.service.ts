import { Injectable, OnModuleInit, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as bcryptNative from 'bcrypt';
import type { RolSesion } from '@shared/types';
import { PrismaEstudioService } from '../../prisma/prisma-estudio.service';
import { PrismaAuthService } from '../../prisma/prisma-auth.service';
import { crearTokenEstudio } from './estudio-session';
import { EstudioLoginDto } from './estudio-auth.dto';
import { asegurarUsuarioAdmin } from './bootstrap-admin';
import { asegurarUsuarioEstudioPorEmail } from './estudio-usuario.helper';

@Injectable()
export class EstudioAuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaEstudioService,
    private prismaAuth: PrismaAuthService,
  ) {}

  async onModuleInit() {
    await asegurarUsuarioAdmin(this.prisma);
  }

  async login(dto: EstudioLoginDto) {
    const usuario = dto.usuario.trim().toLowerCase();
    const password = dto.password.trim();

    if (!usuario || !password) {
      throw new UnauthorizedException('Usuario y clave son obligatorios.');
    }

    let registro;
    try {
      registro = await this.prisma.usuario.findUnique({ where: { usuario } });
    } catch {
      throw new ServiceUnavailableException('No se pudo conectar a la base del estudio.');
    }

    if (registro?.activo) {
      const match = await bcrypt.compare(password, registro.passwordHash);
      if (match) {
        return this.emitirSesion(registro);
      }
    }

    // Mismas credenciales que el login del sitio (email + contraseña Nest)
    if (usuario.includes('@')) {
      try {
        const siteUser = await this.prismaAuth.user.findUnique({ where: { email: usuario } });
        if (siteUser) {
          let siteOk = false;
          try {
            siteOk = await bcryptNative.compare(password, siteUser.password);
          } catch {
            siteOk = await bcrypt.compare(password, siteUser.password);
          }
          if (siteOk) {
            registro = await asegurarUsuarioEstudioPorEmail(this.prisma, usuario, password);
            if (registro.activo) {
              return this.emitirSesion(registro);
            }
          }
        }
      } catch {
        /* BD sitio no disponible: seguir con error estándar */
      }
    }

    throw new UnauthorizedException(
      registro && !registro.activo
        ? 'Credenciales inválidas o usuario inactivo.'
        : 'Credenciales inválidas.',
    );
  }

  private async emitirSesion(registro: {
    id: string;
    usuario: string;
    nombre: string;
    rol: string;
  }) {
    const rol = registro.rol as unknown as RolSesion;
    const token = await crearTokenEstudio({
      sub: registro.id,
      usuario: registro.usuario,
      rol,
    });

    return {
      token,
      usuario: registro.usuario,
      nombre: registro.nombre,
      rol,
    };
  }
}
