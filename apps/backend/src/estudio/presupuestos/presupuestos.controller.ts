import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { EstudioAuthGuard } from '../auth/estudio-auth.guard';
import { EstudioSessionUser } from '../auth/estudio-session.decorator';
import type { EstudioSession } from '@shared/types';
import { CreatePresupuestoDto, UpdatePresupuestoDto } from './presupuestos.dto';
import { PresupuestosService } from './presupuestos.service';

@Controller('estudio/presupuestos')
@UseGuards(EstudioAuthGuard)
export class PresupuestosController {
  constructor(private presupuestos: PresupuestosService) {}

  @Get()
  listar(@Query() query: Record<string, string | undefined>) {
    return this.presupuestos.listar(query);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.presupuestos.obtener(id);
  }

  @Post()
  crear(@EstudioSessionUser() sesion: EstudioSession, @Body() dto: CreatePresupuestoDto) {
    return this.presupuestos.crear(sesion, dto);
  }

  @Patch(':id')
  actualizar(
    @EstudioSessionUser() sesion: EstudioSession,
    @Param('id') id: string,
    @Body() dto: UpdatePresupuestoDto,
  ) {
    return this.presupuestos.actualizar(sesion, id, dto);
  }

  @Delete(':id')
  eliminar(@EstudioSessionUser() sesion: EstudioSession, @Param('id') id: string) {
    return this.presupuestos.eliminar(sesion, id);
  }
}
