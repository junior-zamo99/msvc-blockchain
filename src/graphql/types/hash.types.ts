
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';


@ObjectType()
export class DatabaseVerification {
  @Field()
  hashEnBD: string;

  @Field()
  coincideConBD: boolean;

  @Field()
  fechaCreacion: Date;

  @Field()
  estadoEnBD: string;
}

// ✅ PASO 2: Luego declarar HashType
@ObjectType()
export class HashType {
  @Field(() => ID)
  id: number;

  @Field(() => ID)
  ventaId: number;

  @Field(() => ID)
  tenantId: number;

  @Field()
  hash: string;

  @Field()
  hashAlgorithm: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  lastVerification?: Date;

  @Field()
  isValid: boolean;

  @Field(() => Int)
  dataSize: number;

  @Field()
  status: string;

  @Field({ nullable: true })
  verifiedBy?: string;

  @Field({ nullable: true })
  hashInput?: string;
}

// ✅ PASO 3: HashGenerationResult
@ObjectType()
export class HashGenerationResult {
  @Field()
  success: boolean;

  @Field(() => HashType, { nullable: true })
  hash?: HashType;

  @Field({ nullable: true })
  message?: string;

  @Field({ nullable: true })
  error?: string;

  @Field(() => ID, { nullable: true })
  databaseId?: number;
}

// ✅ PASO 4: HashVerificationResult (ahora puede usar DatabaseVerification)
@ObjectType()
export class HashVerificationResult {
  @Field()
  isValid: boolean;

  @Field()
  message: string;

  @Field()
  timestamp: Date;

  @Field(() => DatabaseVerification, { nullable: true })
  databaseVerification?: DatabaseVerification;
}

// ✅ PASO 5: Resto de las clases
@ObjectType()
export class RestaurantHashStats {
  @Field(() => ID)
  tenantId: number;

  @Field(() => Int)
  totalRecords: number;

  @Field(() => Int)
  validHashes: number;

  @Field(() => Int)
  invalidHashes: number;

  @Field(() => [HashType])
  recentHashes: HashType[];
}

@ObjectType()
export class HashDebugInfo {
  @Field()
  hash: string;

  @Field()
  hashInput: string;

  @Field(() => Int)
  inputLength: number;

  @Field()
  algorithm: string;

  @Field()
  timestamp: Date;
}