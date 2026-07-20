import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { EstudioAuthGuard } from '../auth/estudio-auth.guard';
import { EstudioSessionUser } from '../auth/estudio-session.decorator';
import type { EstudioSession } from '@shared/types';
import { CreateClienteDto, UpdateClienteDto } from './clientes.dto';
import { ClientesService } from './clientes.service';

@Controller('estudio/clientes')
@UseGuards(EstudioAuthGuard)
export class ClientesController {
  constructor(private clientes: ClientesService) {}

  @Get()
  listar(@Query() query: Record<string, string | undefined>) {
    return this.clientes.listar(query);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.clientes.obtener(id);
  }

  @Post()
  crear(@EstudioSessionUser() sesion: EstudioSession, @Body() dto: CreateClienteDto) {
    return this.clientes.crear(sesion, dto);
  }

  @Patch(':id')
  actualizar(
    @EstudioSessionUser() sesion: EstudioSession,
    @Param('id') id: string,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clientes.actualizar(sesion, id, dto);
  }

  @Delete(':id')
  eliminar(@EstudioSessionUser() sesion: EstudioSession, @Param('id') id: string) {
    return this.clientes.eliminar(sesion, id);
  }
}
