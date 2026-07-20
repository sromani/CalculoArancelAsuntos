import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class EstudioLoginDto {
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @IsString()
  @MinLength(1)
  password: string;
}
