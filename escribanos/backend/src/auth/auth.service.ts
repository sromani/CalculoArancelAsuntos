import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  PrismaClientKnownRequestError,
  PrismaClientInitializationError,
} from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

const MSG_DB_API =
  'La base del API (tabla users) no está creada o la conexión falló. En escribanos/backend, con DATABASE_URL apuntando a sistema_escribanos_db, ejecutá: npx prisma db push';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /** Convierte fallos de Prisma en 503 con mensaje claro (evita "Internal server error" opaco). */
  private rethrowPrismaDb(e: unknown): never {
    if (e instanceof PrismaClientKnownRequestError) {
      if (['P2021', 'P2022', 'P2010', 'P1003'].includes(e.code)) {
        throw new ServiceUnavailableException(MSG_DB_API);
      }
    }
    if (e instanceof PrismaClientInitializationError) {
      throw new ServiceUnavailableException(
        'No se pudo conectar a PostgreSQL. Revisá DATABASE_URL en escribanos/backend/.env y que el servidor esté en marcha.',
      );
    }
    throw e;
  }

  async register(registerDto: RegisterDto) {
    const { email, password, nombre, apellido, ci } = registerDto;

    let existingUser;
    try {
      existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { ci }],
        },
      });
    } catch (e) {
      this.rethrowPrismaDb(e);
    }

    if (existingUser) {
      throw new ConflictException('El email o CI ya están registrados');
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nombre,
          apellido,
          ci,
        },
      });
    } catch (e) {
      this.rethrowPrismaDb(e);
    }

    // Generar token
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
      user = await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (e) {
      this.rethrowPrismaDb(e);
    }

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar token
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

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // No revelar si el usuario existe o no
      return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
    }

    // Generar token de reseteo
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    await this.prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: Enviar email con el token
    console.log('Reset token:', resetToken);

    return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Contraseña restablecida exitosamente' };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
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

    return user;
  }

  private generateToken(userId: string, email: string) {
    return this.jwtService.sign({ sub: userId, email });
  }
}