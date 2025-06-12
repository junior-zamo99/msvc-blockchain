import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as CryptoJS from 'crypto-js';
import { Bloque } from '../entities/bloque';
import { RegistroHash } from '../entities/registrohash';

@Injectable()
export class BlockchainService implements OnModuleInit  {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(
    @InjectRepository(Bloque)
    private bloqueRepository: Repository<Bloque>,
    @InjectRepository(RegistroHash)
    private registroHashRepository: Repository<RegistroHash>
  ) {}


   async onModuleInit() {
    await this.verificarBloqueGenesis();
  }
  

   private async verificarBloqueGenesis(): Promise<void> {
    try {
    
      const existenBloques = await this.bloqueRepository.count() > 0;
      
      if (existenBloques) {
        this.logger.log('✅ Blockchain inicializada correctamente - Bloque génesis encontrado');
        return;
      }
      
   
      this.logger.log('🌱 Creando bloque génesis...');
      
      const timestamp = Math.floor(Date.now() / 1000);
      const fechaCreacion = new Date();
      const genesisInfo = `Blockchain iniciada: ${fechaCreacion.toISOString()} por junior-zamo99si`;
      
     
      const genesis = this.bloqueRepository.create({
        altura: 1,
        hashBloqueAnterior: '0'.repeat(64), 
        merkleRoot: CryptoJS.SHA256(genesisInfo).toString(),
        timestamp,
        nonce: 0,
        numeroTransacciones: 0,
        estado: 'CONFIRMADO',
        esValido: true,
        fechaCreacion
      });
      
      
      genesis.hashBloque = this.calcularHashBloque(genesis);
      
      
      await this.bloqueRepository.save(genesis);
      
      this.logger.log(`✅ Bloque génesis creado con hash: ${genesis.hashBloque.substring(0, 8)}...`);
      this.logger.log(`🔗 Blockchain inicializada - ${new Date().toISOString()}`);
    } catch (error) {
      this.logger.error(`❌ Error creando bloque génesis: ${error.message}`);
    }
  }


 async obtenerUltimoBloque(): Promise<Bloque | null> {
  return this.bloqueRepository.findOne({
    where: {}, 
    order: { altura: 'DESC' }
  });
}

 
  calcularHashBloque(bloque: Partial<Bloque>): string {
   
    const dataString = `${bloque.altura}|${bloque.hashBloqueAnterior}|${bloque.merkleRoot}|${bloque.timestamp}|${bloque.nonce}`;
    return CryptoJS.SHA256(dataString).toString();
  }

  
  calcularMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return CryptoJS.SHA256('bloque_vacio').toString();
    if (hashes.length === 1) return hashes[0];
    
  
    const hashesTemp = [...hashes];
    if (hashesTemp.length % 2 !== 0) {
      hashesTemp.push(hashesTemp[hashesTemp.length - 1]);
    }
    
    const nivelSiguiente: string[] = [];
    
   
    for (let i = 0; i < hashesTemp.length; i += 2) {
      const hashCombinado = CryptoJS.SHA256(hashesTemp[i] + hashesTemp[i + 1]).toString();
      nivelSiguiente.push(hashCombinado);
    }
    
   
    return this.calcularMerkleRoot(nivelSiguiente);
  }


  async verificarBloque(bloque: Bloque): Promise<{ esValido: boolean, motivo?: string }> {
  
 if (bloque.altura === 1) {
      
      return { esValido: true };
    }

    const hashCalculado = this.calcularHashBloque(bloque);
    if (hashCalculado !== bloque.hashBloque) {
      return { 
        esValido: false, 
        motivo: 'Hash del bloque no coincide con datos' 
      };
    }
    
   
    const registrosDelBloque = await this.registroHashRepository.find({
      where: { bloqueId: bloque.id }
    });
    
    if (registrosDelBloque.length !== bloque.numeroTransacciones) {
      return {
        esValido: false,
        motivo: `Número de transacciones incorrecto (${registrosDelBloque.length} vs ${bloque.numeroTransacciones} esperadas)`
      };
    }
    
   
    const hashes = registrosDelBloque.map(registro => registro.valorHash);
    const merkleRootCalculado = this.calcularMerkleRoot(hashes);
    
    if (merkleRootCalculado !== bloque.merkleRoot) {
      return {
        esValido: false,
        motivo: 'Merkle Root calculado no coincide'
      };
    }
    
    return { esValido: true };
  }


  async crearBloque(): Promise<Bloque> {
    
    const ultimoBloque = await this.obtenerUltimoBloque();
    const nuevaAltura = ultimoBloque ? ultimoBloque.altura + 1 : 1;
    const hashAnterior = ultimoBloque ? ultimoBloque.hashBloque : '0'.repeat(64);
    
    const transaccionesPendientes = await this.registroHashRepository.find({
      where: { bloqueId: null, estado: 'CONFIRMADO' },
      take: 100 
    });
    
    if (transaccionesPendientes.length === 0) {
      this.logger.log('No hay transacciones pendientes para crear un nuevo bloque');
      throw new Error('No hay transacciones pendientes');
    }
    

    const hashes = transaccionesPendientes.map(tx => tx.valorHash);
    const merkleRoot = this.calcularMerkleRoot(hashes);
    
    
    const timestamp = Math.floor(Date.now() / 1000);
    const nuevoBloque = this.bloqueRepository.create({
      altura: nuevaAltura,
      hashBloqueAnterior: hashAnterior,
      merkleRoot: merkleRoot,
      timestamp: timestamp,
      nonce: 0, 
      numeroTransacciones: transaccionesPendientes.length,
      estado: 'PENDIENTE',
      esValido: true
    });
    
 
    const dificultad = 1; 
    let nonce = 0;
    let hashBloque = '';
    
    while (true) {
      nuevoBloque.nonce = nonce;
      hashBloque = this.calcularHashBloque(nuevoBloque);
      
      if (hashBloque.startsWith('0'.repeat(dificultad))) {
        break;
      }
      
      nonce++;
      
     
      if (nonce > 100000) {
        this.logger.warn('Se alcanzó el límite de intentos para encontrar nonce');
        break;
      }
    }
    

    nuevoBloque.hashBloque = hashBloque;
    nuevoBloque.estado = 'CONFIRMADO';
    const bloqueGuardado = await this.bloqueRepository.save(nuevoBloque);
    
    
    await Promise.all(
      transaccionesPendientes.map(tx => 
        this.registroHashRepository.update(
          { id: tx.id },
          { bloqueId: bloqueGuardado.id, estado: 'EN_BLOQUE' }
        )
      )
    );
    
    this.logger.log(`Bloque #${nuevaAltura} creado con ${transaccionesPendientes.length} transacciones`);
    return bloqueGuardado;
  }


  async verificarCadenaCompleta(): Promise<{
  esValida: boolean;
  totalBloques: number;
  bloquesValidos: number;
  altura: number;
  errores: Array<{ altura: number; motivo: string }>;
}> {
  try {
    this.logger.log('🔍 Iniciando verificación completa de la cadena...');
    const start = Date.now();
    
    // Obtener todos los bloques ordenados por altura
    const bloques = await this.bloqueRepository.find({
      order: { altura: 'ASC' }
    });
    
    if (bloques.length === 0) {
      return {
        esValida: true,
        totalBloques: 0,
        bloquesValidos: 0,
        altura: 0,
        errores: []
      };
    }

    const errores: Array<{ altura: number; motivo: string }> = [];
    let bloquesValidos = 0;
    let hashAnteriorEsperado = '0'.repeat(64); // El primer bloque debe enlazar con ceros
    
    // Verificar cada bloque y su conexión con el anterior
    for (const bloque of bloques) {
      // 1. Verificar que el bloque enlace correctamente con el anterior
      if (bloque.hashBloqueAnterior !== hashAnteriorEsperado) {
        errores.push({
          altura: bloque.altura,
          motivo: `Enlace incorrecto: El bloque apunta a hash ${bloque.hashBloqueAnterior.substring(0, 8)}... pero debería apuntar a ${hashAnteriorEsperado.substring(0, 8)}...`
        });
      }
      
      // 2. Verificar la integridad del propio bloque
      const verificacion = await this.verificarBloque(bloque);
      if (!verificacion.esValido) {
        errores.push({
          altura: bloque.altura,
          motivo: verificacion.motivo || 'Bloque inválido'
        });
      } else {
        bloquesValidos++;
      }
      
      // Actualizar el hash esperado para el siguiente bloque
      hashAnteriorEsperado = bloque.hashBloque;
    }
    
    // Verificar que no haya saltos en las alturas
    for (let i = 1; i < bloques.length; i++) {
      if (bloques[i].altura !== bloques[i-1].altura + 1) {
        errores.push({
          altura: bloques[i].altura,
          motivo: `Salto de altura detectado: De ${bloques[i-1].altura} a ${bloques[i].altura}`
        });
      }
    }
    
    const esValida = errores.length === 0;
    const tiempoVerificacion = Date.now() - start;
    
    this.logger.log(`✅ Verificación completa finalizada en ${tiempoVerificacion}ms - ${esValida ? 'VÁLIDA' : 'INVÁLIDA'}`);
    if (!esValida) {
      this.logger.warn(`⚠️ Se encontraron ${errores.length} errores en la cadena`);
    }
    
    return {
      esValida,
      totalBloques: bloques.length,
      bloquesValidos,
      altura: bloques[bloques.length - 1].altura,
      errores
    };
  } catch (error) {
    this.logger.error(`❌ Error verificando la cadena: ${error.message}`);
    return {
      esValida: false,
      totalBloques: 0,
      bloquesValidos: 0,
      altura: 0,
      errores: [{ altura: 0, motivo: `Error: ${error.message}` }]
    };
  }
}




}