import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSexoDto {
  @IsNotEmpty()
  @IsString()
  descripcion: string;
}