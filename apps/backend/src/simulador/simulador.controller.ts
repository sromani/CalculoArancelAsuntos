import { Body, Controller, Get, Post } from '@nestjs/common';
import { SimuladorService, type SimuladorCalcularDto } from './simulador.service';

@Controller('simulador')
export class SimuladorController {
  constructor(private simulador: SimuladorService) {}

  @Get('actos')
  actos() {
    return this.simulador.listarActos();
  }

  @Post('calcular')
  calcular(@Body() body: SimuladorCalcularDto) {
    return this.simulador.calcular(body);
  }
}
