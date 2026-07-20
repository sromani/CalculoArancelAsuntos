import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { EstudioAuthGuard } from '../auth/estudio-auth.guard';
import { EstudioSessionUser } from '../auth/estudio-session.decorator';
import type { EstudioSession } from '@shared/types';
import { GastosService } from './gastos.service';

@Controller('estudio/gastos')
@UseGuards(EstudioAuthGuard)
export class GastosController {
  constructor(private gastosService: GastosService) {}

  @Get()
  listar(@Query() query: Record<string, string | undefined>) {
    return this.gastosService.listar(query);
  }

  @Post()
  crear(@EstudioSessionUser() sesion: EstudioSession, @Body() body: unknown) {
    return this.gastosService.crear(sesion, body);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.gastosService.obtener(id);
  }

  @Patch(':id')
  actualizar(
    @EstudioSessionUser() sesion: EstudioSession,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.gastosService.actualizar(sesion, id, body);
  }

  @Delete(':id')
  eliminar(@EstudioSessionUser() sesion: EstudioSession, @Param('id') id: string) {
    return this.gastosService.eliminar(sesion, id);
  }
}
