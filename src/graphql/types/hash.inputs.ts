
import { InputType, Field, ID, Float, Int } from '@nestjs/graphql';

@InputType()
export class ProductoInput {
  @Field(() => ID)
  productoId: number;

  @Field()
  nombre: string;

  @Field(() => Int)
  cantidad: number;

  @Field(() => Float)
  precio: number;

  @Field(() => Float)
  subtotal: number;
}

@InputType()
export class ClienteInput {
  @Field(() => ID, { nullable: true })
  clienteId?: number;

  @Field({ nullable: true })
  nombre?: string;

  @Field({ nullable: true })
  email?: string;
}

@InputType()
export class MesaInput {
  @Field(() => Int)
  numero: number;

  @Field(() => Int)
  capacidad: number;
}

@InputType()
export class DatosVentaInput {
  @Field(() => ID)
  ventaId: number;

  @Field(() => ID)
  tenantId: number;

  @Field()
  fechaVenta: string;

  @Field(() => Float)
  total: number;

  @Field()
  estado: string;

  @Field(() => ID)
  cuentaMesaId: number;

  @Field(() => MesaInput)
  mesa: MesaInput;

  @Field(() => ClienteInput, { nullable: true })
  cliente?: ClienteInput;

  @Field(() => [ProductoInput])
  productos: ProductoInput[];
}

@InputType()
export class GenerateHashInput {
  @Field(() => ID)
  ventaId: number;

  @Field(() => ID)
  tenantId: number;

  @Field(() => DatosVentaInput)
  datosVenta: DatosVentaInput;
}

@InputType()
export class VerifyHashInput {
  @Field(() => DatosVentaInput)
  datosVenta: DatosVentaInput;

  @Field()
  hashEsperado: string;
}