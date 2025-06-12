import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { HashType } from './hash.types';

@ObjectType()
export class BloqueType {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  altura: number;

  @Field()
  hashBloque: string;

  @Field()
  hashBloqueAnterior: string;

  @Field()
  merkleRoot: string;

  @Field(() => Int)
  timestamp: number;

  @Field(() => Int)
  nonce: number;

  @Field(() => Int)
  numeroTransacciones: number;

  @Field()
  fechaCreacion: Date;

  @Field()
  esValido: boolean;

  @Field()
  estado: string;

  @Field(() => [HashType], { nullable: true })
  registrosHash: HashType[];
}

@ObjectType()
export class CrearBloqueResult {
  @Field()
  success: boolean;

  @Field(() => BloqueType, { nullable: true })
  bloque?: BloqueType;

  @Field({ nullable: true })
  mensaje?: string;

  @Field({ nullable: true })
  error?: string;
}

@ObjectType()
export class VerificacionBloqueResult {
  @Field()
  esValido: boolean;

  @Field(() => Int)
  altura: number;

  @Field()
  hashBloque: string;

  @Field({ nullable: true })
  motivo?: string;

  @Field(() => Int)
  numeroTransacciones: number;
}

@ObjectType()
export class EstadisticasBlockchain {
  @Field(() => Int)
  totalBloques: number;

  @Field(() => Int)
  totalTransacciones: number;

  @Field(() => Int)
  transaccionesPendientes: number;

  @Field(() => Int, { nullable: true })
  ultimaAltura?: number;

  @Field({ nullable: true })
  ultimoBloqueFecha?: Date;
}

@ObjectType()
export class ErrorVerificacion {
  @Field(() => Int)
  altura: number;

  @Field()
  motivo: string;
}

@ObjectType()
export class VerificacionCadenaResult {
  @Field()
  esValida: boolean;

  @Field(() => Int)
  totalBloques: number;

  @Field(() => Int)
  bloquesValidos: number;
  
  @Field(() => Int)
  altura: number;

  @Field()
  fechaVerificacion: Date;

  @Field(() => [ErrorVerificacion])
  errores: ErrorVerificacion[];
}