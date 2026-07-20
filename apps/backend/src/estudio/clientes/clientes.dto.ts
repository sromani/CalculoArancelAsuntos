import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  documento: string;

  @IsOptional()
  @IsIn(['CI', 'PASAPORTE', 'RUT', 'OTRO'])
  tipoDocumento?: string;

  @IsOptional()
  @IsIn(['FISICA', 'JURIDICA'])
  tipoPersona?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  domicilio?: string;
}

export class UpdateClienteDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsIn(['CI', 'PASAPORTE', 'RUT', 'OTRO'])
  tipoDocumento?: string;

  @IsOptional()
  @IsIn(['FISICA', 'JURIDICA'])
  tipoPersona?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  domicilio?: string;
}
