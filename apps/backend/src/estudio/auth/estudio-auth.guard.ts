import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verificarTokenEstudio } from './estudio-session';

@Injectable()
export class EstudioAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException('No autorizado. Inicia sesión.');
    }

    const sesion = await verificarTokenEstudio(token);
    if (!sesion) {
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }

    request.estudioSession = sesion;
    return true;
  }
}
