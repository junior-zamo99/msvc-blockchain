import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HashService } from './hash.service';
import { RegistroHash } from '../entities/registrohash';
import { 
  HashType, 
  HashGenerationResult, 
  HashVerificationResult,
  RestaurantHashStats,
  HashDebugInfo,
  DatabaseVerification
} from '../graphql/types/hash.types';
import { 
  GenerateHashInput, 
  VerifyHashInput,
  DatosVentaInput
} from '../graphql/types/hash.inputs';
import { VentaVerificationService } from './venta-verification.service';
import { VentaVerificationResult } from 'src/graphql/types/venta-verification.types';

@Resolver(() => HashType)
export class HashResolver {

  constructor(
    private readonly hashService: HashService,
     private readonly ventaVerificationService: VentaVerificationService,
    @InjectRepository(RegistroHash)
    private registroHashRepository: Repository<RegistroHash>
  ) {}

 
  @Mutation(() => HashGenerationResult)
  async generateHash(
    @Args('input') input: GenerateHashInput
  ): Promise<HashGenerationResult> {
    try {
      console.log('🔐 GraphQL: Generando hash para venta:', input.ventaId);

      if (!input.ventaId || !input.tenantId || !input.datosVenta) {
        throw new Error('Faltan campos requeridos: ventaId, tenantId, datosVenta');
      }

    
      const existing = await this.registroHashRepository.findOne({
        where: { 
          ventaId: input.ventaId,
          tenantId: input.tenantId 
        }
      });

      if (existing) {
        console.log(`✅ GraphQL: Hash ya existe para venta ${input.ventaId}`);
        const hashType = this.mapToHashType(existing);
        
        return {
          success: true,
          hash: hashType,
          message: 'Hash ya existía en blockchain',
          databaseId: existing.id
        };
      }

   
      const hashDetails = this.hashService.getHashDetails(input.datosVenta);
      
      const newRecord = this.registroHashRepository.create({
        ventaId: input.ventaId,
        tenantId: input.tenantId,
        valorHash: hashDetails.hash,
        algoritmoHash: 'SHA-256',
        datosOriginales: JSON.stringify(input.datosVenta),
        entradaHash: hashDetails.hashInput,
        tamañoDatos: hashDetails.inputLength,
        estado: 'CONFIRMADO',
        esValido: true,
        verificadoPor: 'graphql_mutation'
      });
      
      const saved = await this.registroHashRepository.save(newRecord);
      const hashType = this.mapToHashType(saved);

      console.log(`✅ GraphQL: Hash generado exitosamente (ID: ${saved.id})`);

      return {
        success: true,
        hash: hashType,
        message: 'Hash generado y guardado en blockchain',
        databaseId: saved.id
      };

    } catch (error) {
      console.error('❌ GraphQL Error:', error.message);
      
      if (error.code === 'ER_DUP_ENTRY') {
        throw new HttpException(
          'Ya existe un hash para esta venta', 
          HttpStatus.CONFLICT
        );
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }
 
  @Mutation(() => HashVerificationResult)
  async verifyHash(
    @Args('input') input: VerifyHashInput
  ): Promise<HashVerificationResult> {
    try {
      
      const isValidCalculated = this.hashService.verifyHash(
        input.datosVenta, 
        input.hashEsperado
      );

      let databaseVerification: DatabaseVerification | null = null;
      
      if (input.datosVenta.ventaId) {
        const record = await this.registroHashRepository.findOne({
          where: { ventaId: input.datosVenta.ventaId }
        });
        
        if (record) {
          databaseVerification = {
            hashEnBD: record.valorHash,
            coincideConBD: record.valorHash === input.hashEsperado,
            fechaCreacion: record.fechaCreacion,
            estadoEnBD: record.estado
          };
          
         
          await this.registroHashRepository.update(
            { ventaId: input.datosVenta.ventaId },
            { 
              ultimaVerificacion: new Date(),
              esValido: isValidCalculated,
              verificadoPor: 'graphql_verification'
            }
          );
        }
      }

      
      const verificationResult = {
        isValid: isValidCalculated,
        message: isValidCalculated ? 
          '✅ Hash válido - datos íntegros' : 
          '❌ Hash inválido - datos alterados',
        timestamp: new Date(),
        databaseVerification
      };

      return verificationResult;

    } catch (error) {
      return {
        isValid: false,
        message: `Error: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  // ✅ QUERY: Obtener hash por venta
  @Query(() => HashType, { nullable: true })
  async ventaHash(
    @Args('ventaId', { type: () => ID }) ventaId: number
  ): Promise<HashType | null> {
    try {
      const record = await this.registroHashRepository.findOne({
        where: { ventaId: Number(ventaId) }
      });
      
      if (!record) {
        throw new HttpException(
          `No se encontró hash para la venta ${ventaId}`, 
          HttpStatus.NOT_FOUND
        );
      }
      
      return this.mapToHashType(record);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error consultando hash: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  
  @Query(() => RestaurantHashStats)
  async restaurantHashes(
    @Args('tenantId', { type: () => ID }) tenantId: number,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number
  ): Promise<RestaurantHashStats> {
    try {
      const records = await this.registroHashRepository.find({
        where: { tenantId: Number(tenantId) },
        order: { fechaCreacion: 'DESC' },
        take: limit
      });

      const totalRecords = await this.registroHashRepository.count({
        where: { tenantId: Number(tenantId) }
      });

      const validHashes = await this.registroHashRepository.count({
        where: { tenantId: Number(tenantId), esValido: true }
      });

      return {
        tenantId: Number(tenantId),
        totalRecords,
        validHashes,
        invalidHashes: totalRecords - validHashes,
        recentHashes: records.map(record => this.mapToHashType(record))
      };
    } catch (error) {
      throw new HttpException(
        `Error consultando hashes: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Query(() => HashDebugInfo)
  async debugHash(
    @Args('datosVenta') datosVenta: DatosVentaInput
  ): Promise<HashDebugInfo> {
    try {
      console.log('🔍 GraphQL Debug para venta:', datosVenta.ventaId);
      const hashDetails = this.hashService.getHashDetails(datosVenta);
      
      return {
        hash: hashDetails.hash,
        hashInput: hashDetails.hashInput,
        inputLength: hashDetails.inputLength,
        algorithm: hashDetails.algorithm,
        timestamp: new Date(hashDetails.timestamp)
      };
    } catch (error) {
      throw new HttpException(
        `Error en debug: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private mapToHashType(record: RegistroHash): HashType {
    const hashType = {
      id: record.id,
      ventaId: record.ventaId,
      tenantId: record.tenantId,
      hash: record.valorHash,
      hashAlgorithm: record.algoritmoHash || 'SHA-256',
      createdAt: record.fechaCreacion,
      lastVerification: record.ultimaVerificacion,
      isValid: record.esValido ?? true,
      dataSize: record.tamañoDatos || 0,
      status: record.estado || 'CONFIRMADO',
      verifiedBy: record.verificadoPor,
      hashInput: record.entradaHash
    };
    
 
    console.log('🏗️ HashType creado:', JSON.stringify(hashType, null, 2));
    
    return hashType;
  }



  @Query(() => VentaVerificationResult)
  async verificarIntegridadVenta(
    @Args('ventaId', { type: () => ID }) ventaId: number,
    @Args('tenantId', { type: () => ID, nullable: true }) tenantId: number,
    @Args('ventaServiceUrl', { nullable: true }) ventaServiceUrl: string
  ): Promise<VentaVerificationResult> {
    try {
      console.log(`🔍 Verificando integridad completa de venta: ${ventaId}`);
      
      
      const resultado = await this.ventaVerificationService.verificarVentaCompleta(
        ventaId, 
        tenantId, 
        ventaServiceUrl
      );
      
      return resultado;
    } catch (error) {
      console.error('❌ Error en verificación completa:', error);
      throw new HttpException(
        `Error verificando venta: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


  

}