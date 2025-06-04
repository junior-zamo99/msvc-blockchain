import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { HashService } from "./hash.service";
import { VentaHashRequest } from "src/models/venta-data.interface";
import { HashResponse } from "src/models/hash-response.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { RegistroHash } from "src/entities/registrohash";
import { Repository } from "typeorm";

@Controller('hash')
export class hashController {

  constructor(
    private readonly hashService: HashService,
    @InjectRepository(RegistroHash)
    private registroHashRepository: Repository<RegistroHash>
) {}

@Post('generate')
async generateHash(@Body() request: VentaHashRequest): Promise<HashResponse> {
  try {
    console.log('🔐 Generando hash para venta:', request.ventaId);
    
    if (!request.ventaId || !request.tenantId || !request.datosVenta) {
      throw new Error('Faltan campos requeridos: ventaId, tenantId, datosVenta');
    }

    // ✅ Verificar si ya existe
    const existingRecord = await this.registroHashRepository.findOne({
      where: { 
        ventaId: request.ventaId,
        tenantId: request.tenantId 
      }
    });

    if (existingRecord) {
      console.log(`✅ Hash ya existe para venta ${request.ventaId}`);
      return {
        success: true,
        ventaId: request.ventaId,
        tenantId: request.tenantId,
        hash: existingRecord.valorHash,
        hashAlgorithm: existingRecord.algoritmoHash,
        timestamp: existingRecord.fechaCreacion.toISOString(),
        dataSize: existingRecord.tamañoDatos,
        hashInput: existingRecord.entradaHash,
  
      };
    }

    // ✅ Generar nuevo hash
    const hashDetails = this.hashService.getHashDetails(request.datosVenta);
    
    // ✅ GUARDAR EN BASE DE DATOS
    const newRecord = this.registroHashRepository.create({
      ventaId: request.ventaId,
      tenantId: request.tenantId,
      valorHash: hashDetails.hash,
      algoritmoHash: 'SHA-256',
      datosOriginales: JSON.stringify(request.datosVenta),
      entradaHash: hashDetails.hashInput,
      tamañoDatos: hashDetails.inputLength,
      estado: 'CONFIRMADO',
      esValido: true,
      verificadoPor: 'sistema_automatico'
    });
    
    const savedRecord = await this.registroHashRepository.save(newRecord);
    
    console.log(`✅ Hash guardado exitosamente (ID: ${savedRecord.id})`);
    
    return {
      success: true,
      ventaId: request.ventaId,
      tenantId: request.tenantId,
      hash: hashDetails.hash,
      hashAlgorithm: 'SHA-256',
      timestamp: hashDetails.timestamp,
      dataSize: hashDetails.inputLength,
      hashInput: hashDetails.hashInput,
      
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return {
        success: false,
        ventaId: request?.ventaId || 0,
        tenantId: request?.tenantId || 0,
        hash: '',
        hashAlgorithm: 'SHA-256',
        timestamp: new Date().toISOString(),
        dataSize: 0,
        error: 'Hash ya existe para esta venta'
      };
    }
    
    return {
      success: false,
      ventaId: request?.ventaId || 0,
      tenantId: request?.tenantId || 0,
      hash: '',
      hashAlgorithm: 'SHA-256',
      timestamp: new Date().toISOString(),
      dataSize: 0,
      error: error.message 
    };
  }
}

@Post('verify')
async verifyHash(@Body() body: { datosVenta: any, hashEsperado: string }) {
  try {
    // ✅ Verificación por cálculo
    const isValidCalculated = this.hashService.verifyHash(body.datosVenta, body.hashEsperado);
    
    // ✅ Verificación contra base de datos
    let databaseVerification = null;
    if (body.datosVenta.ventaId) {
      const record = await this.registroHashRepository.findOne({
        where: { ventaId: body.datosVenta.ventaId }
      });
      
      if (record) {
        databaseVerification = {
          hashEnBD: record.valorHash,
          coincideConBD: record.valorHash === body.hashEsperado,
          fechaCreacion: record.fechaCreacion,
          estadoEnBD: record.estado
        };
        
        // Actualizar verificación
        await this.registroHashRepository.update(
          { ventaId: body.datosVenta.ventaId },
          { 
            ultimaVerificacion: new Date(),
            esValido: isValidCalculated,
            verificadoPor: 'verificacion_manual'
          }
        );
      }
    }
    
    return {
      isValid: isValidCalculated,
      timestamp: new Date().toISOString(),
      message: isValidCalculated ? 
        '✅ Hash válido - datos íntegros' : 
        '❌ Hash inválido - datos alterados',
      databaseVerification
    };
  } catch (error) {
    return {
      isValid: false,
      timestamp: new Date().toISOString(),
      message: 'Error: ' + error.message
    };
  }
}

@Get('venta/:ventaId')
async getVentaHash(@Param('ventaId') ventaId: number) {
  try {
    const record = await this.registroHashRepository.findOne({
      where: { ventaId: Number(ventaId) }
    });
    
    if (!record) {
      return {
        found: false,
        message: `No se encontró hash para la venta ${ventaId}`
      };
    }
    
    return {
      found: true,
      ventaId: record.ventaId,
      tenantId: record.tenantId,
      hash: record.valorHash,
      createdAt: record.fechaCreacion,
      status: record.estado,
      dataSize: record.tamañoDatos,
      lastVerification: record.ultimaVerificacion,
      isValid: record.esValido,
      verifiedBy: record.verificadoPor
    };
  } catch (error) {
    console.error('Error fetching venta hash:', error);
    
  }
}

@Get('restaurante/:tenantId')
async getRestaurantHashes(@Param('tenantId') tenantId: number) {
  try {
    const records = await this.registroHashRepository.find({
      where: { tenantId: Number(tenantId) },
      order: { fechaCreacion: 'DESC' },
      take: 100
    });
    
    return {
      tenantId: Number(tenantId),
      totalRecords: records.length,
      recentHashes: records.map(record => ({
        ventaId: record.ventaId,
        hash: record.valorHash,
        createdAt: record.fechaCreacion,
        status: record.estado,
        isValid: record.esValido
      }))
    };
  } catch (error) {
   console.error('Error fetching restaurant hashes:', error);
  }
}

@Post('debug')
getHashDebug(@Body() request: VentaHashRequest) {
  try {
    console.log('🔍 Debug para venta:', request.ventaId);
    return this.hashService.getHashDetails(request.datosVenta);
  } catch (error) {
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
 
  
}