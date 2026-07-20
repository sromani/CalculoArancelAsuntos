import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePresupuestoDto {
  @IsString()
  @IsNotEmpty()
  clienteId: string;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsIn(['BORRADOR', 'EMITIDO', 'ACEPTADO', 'RECHAZADO', 'ANULADO'])
  estado?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  honorarioArancel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  honorarioACobrar?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalGastos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPresupuesto?: number;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class UpdatePresupuestoDto extends CreatePresupuestoDto {}
