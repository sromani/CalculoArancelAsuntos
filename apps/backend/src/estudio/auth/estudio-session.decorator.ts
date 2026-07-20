import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { EstudioSession } from '@shared/types';

export const EstudioSessionUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): EstudioSession => {
    const request = ctx.switchToHttp().getRequest();
    return request.estudioSession;
  },
);
