import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaAuthService } from '../prisma/prisma-auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';

const MSG_DB_API =
  'La base del API (tabla users) no está creada o la conexión falló. Ejecutá: npm run db:push:auth -w backend-api';

const PRISMA_UNAVAILABLE = new Set(['P2021', 'P2022', 'P2010', 'P1003']);

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaAuthService,
    private jwtService: JwtService,
  ) {}

  private rethrowPrismaDb(e: unknown): never {
    const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: string }).code) : '';
    if (PRISMA_UNAVAILABLE.has(code)) {
      throw new ServiceUnavailableException(MSG_DB_API);
    }
    const name = typeof e === 'object' && e && 'name' in e ? String((e as { name: string }).name) : '';
    if (name.includes('PrismaClientInitializationError')) {
      throw new ServiceUnavailableException(
        'No se pudo conectar a PostgreSQL. Revisá DATABASE_URL en apps/backend/.env',
      );
    }
    throw e;
  }

  async register(registerDto: RegisterDto) {
    const { email, password, nombre, apellido, ci } = registerDto;

    let existingUser;
    try {
      existingUser = await this.prisma.user.findFirst({
        where: { OR: [{ email }, { ci }] },
      });
    } catch (e) {
      this.rethrowPrismaDb(e);
    }

    if (existingUser) {
      throw new ConflictException('El email o CI ya están registrados');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    try {
      user = await this.prisma.user.create({
        data: { email, password: hashedPassword, nombre, apellido, ci },
      });
    } catch (e) {
      this.rethrowPrismaDb(e);
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        ci: user.ci,
        planType: user.planType,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    let user;
    try {
      user = await this.prisma.user.findUnique({ where: { email } });
    } catch (e) {
      this.rethrowPrismaDb(e);
    }

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        ci: user.ci,
        planType: user.planType,
        calculosRealizados: user.calculosRealizados,
      },
      token,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await this.prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });

    return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
    });

    return { message: 'Contraseña restablecida exitosamente' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const { currentPassword, newPassword } = dto;

    let user;
    try {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });
    } catch (e) {
      this.rethrowPrismaDb(e);
    }

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('La nueva contraseña debe ser distinta de la actual');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        ci: true,
        planType: true,
        calculosRealizados: true,
      },
    });
  }

  private generateToken(userId: string, email: string) {
    return this.jwtService.sign({ sub: userId, email });
  }
}
