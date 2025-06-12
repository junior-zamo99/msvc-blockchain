import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class VentaVerificationResult {
  @Field()
  integra: boolean;

  @Field()
  ventaId: number;

  @Field({ nullable: true })
  tenantId: number;

  @Field()
  mensaje: string;

  @Field()
  fechaVerificacion: Date;

  @Field({ nullable: true })
  hashAlmacenado: string;

  @Field({ nullable: true })
  hashCalculado: string;

  @Field({ nullable: true })
  estado: string;

  @Field({ nullable: true })
  coinciden: boolean;
  
  @Field({ nullable: true })
  detalles: string;
}

@ObjectType()
export class VentaData {
  @Field(() => ID)
  ventaId: number;

  @Field(() => ID)
  tenantId: number;

  @Field()
  fechaVenta: string;
  
  @Field()
  estado: string;

  @Field(() => Float)
  total: number;
}