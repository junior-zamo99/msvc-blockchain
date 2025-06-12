import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BlockchainService } from './blockchain.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroHash } from '../entities/registrohash';

@Injectable()
export class BlockchainSchedulerService {
  private readonly logger = new Logger(BlockchainSchedulerService.name);
  
  constructor(
    private blockchainService: BlockchainService,
    @InjectRepository(RegistroHash)
    private registroHashRepository: Repository<RegistroHash>
  ) {
    this.logger.log('🕰️ Servicio de programación blockchain iniciado');
  }

  
  @Cron(CronExpression.EVERY_HOUR)
  async crearBloqueHorario() {
    this.logger.log('⏰ Verificando necesidad de crear bloque (programación horaria)');
    await this.verificarYCrearBloque('programación_horaria');
  }

  
  @Cron(CronExpression.EVERY_5_MINUTES)
  async verificarTransaccionesPendientes() {
    const UMBRAL_TRANSACCIONES = 10; 
    
    const pendientes = await this.contarTransaccionesPendientes();
    this.logger.log(`🔍 Verificando transacciones pendientes: ${pendientes}`);
    
    if (pendientes >= UMBRAL_TRANSACCIONES) {
      this.logger.log(`✅ Se alcanzó el umbral de transacciones (${pendientes})`);
      await this.verificarYCrearBloque('umbral_transacciones');
    }
  }

  
  private async verificarYCrearBloque(origen: string): Promise<void> {
    try {
      
      const pendientes = await this.contarTransaccionesPendientes();
      
      if (pendientes === 0) {
        this.logger.log('⏭️ No hay transacciones pendientes, saltando creación de bloque');
        return;
      }
      
     
      this.logger.log(`🔨 Iniciando minado de bloque (origen: ${origen})`);
      const bloque = await this.blockchainService.crearBloque();
      
      this.logger.log(`✅ Bloque #${bloque.altura} creado exitosamente con ${bloque.numeroTransacciones} transacciones`);
    } catch (error) {
      this.logger.error(`❌ Error al crear bloque programado: ${error.message}`);
    }
  }

 
  private async contarTransaccionesPendientes(): Promise<number> {
    return this.registroHashRepository.count({
      where: { 
        bloqueId: null, 
        estado: 'CONFIRMADO' 
      }
    });
  }
}