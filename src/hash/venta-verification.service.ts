import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroHash } from '../entities/registrohash';
import { HashService } from './hash.service';

@Injectable()
export class VentaVerificationService {
  constructor(
    @InjectRepository(RegistroHash)
    private registroHashRepository: Repository<RegistroHash>,
    private hashService: HashService,
    private httpService: HttpService
  ) {}

  /**
   * Verifica completamente una venta obteniendo sus datos y comparando su hash
   */
  async verificarVentaCompleta(ventaId: number, tenantId: number, ventaServiceUrl: string): Promise<any> {
    try {
      // 1. Buscar el hash almacenado en nuestro servicio
      const hashRegistro = await this.registroHashRepository.findOne({
        where: { ventaId, tenantId }
      });

      if (!hashRegistro) {
        return {
          integra: false,
          ventaId,
          tenantId,
          mensaje: '¡ALERTA! La venta ha sido alterada o no está registrada en blockchain',
          fechaVerificacion: new Date(),
          estado: 'NO_REGISTRADA'
        };
      }

      // 2. Opcional: Si se proporciona URL del servicio de ventas, obtener datos actuales
      let datosActuales = null;
      let hashCalculado = null;
      let coinciden = false;

      if (ventaServiceUrl) {
        try {
          const response = await this.httpService.get(`${ventaServiceUrl}/api/ventas/${ventaId}`).toPromise();
          datosActuales = response.data;
          
          // Calcular hash con datos actuales
          hashCalculado = this.hashService.getHashDetails(datosActuales).hash;
          coinciden = hashCalculado === hashRegistro.valorHash;
        } catch (error) {
          console.error(`Error obteniendo datos de venta: ${error.message}`);
        }
      }

      const esIntegra = coinciden || (!datosActuales && hashRegistro.esValido);
      const resultado = {
        integra: esIntegra,
        ventaId,
        tenantId,
        mensaje: esIntegra ? 
          '✅ Venta verificada - integridad confirmada' : 
          '❌ ¡ALERTA! La venta ha sido alterada - datos diferentes',
        fechaVerificacion: new Date(),
        hashAlmacenado: hashRegistro.valorHash,
        hashCalculado,
        estado: hashRegistro.estado,
        coinciden,
        detalles: datosActuales ? 'Verificación completa con datos actuales' : 'Verificación solo de existencia'
      };

      // 4. Actualizar fecha de verificación
      await this.registroHashRepository.update(
        { ventaId, tenantId },
        { 
          ultimaVerificacion: new Date(),
          verificadoPor: 'verificacion_completa'
        }
      );

      return resultado;
    } catch (error) {
      console.error('Error en verificación completa:', error);
      return {
        integra: false,
        ventaId,
        tenantId,
        mensaje: `Error en verificación: ${error.message}`,
        fechaVerificacion: new Date(),
        estado: 'ERROR'
      };
    }
  }
}