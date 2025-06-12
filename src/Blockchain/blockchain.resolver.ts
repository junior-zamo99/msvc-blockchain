import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { BlockchainService } from './blockchain.service';
import { BloqueType, CrearBloqueResult, VerificacionBloqueResult, EstadisticasBlockchain, VerificacionCadenaResult } from '../graphql/types/blockchain.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bloque } from '../entities/bloque';
import { RegistroHash } from '../entities/registrohash';
import { HashType } from '../graphql/types/hash.types';
import { Not, IsNull } from 'typeorm';

@Resolver(() => BloqueType)
export class BlockchainResolver {
  constructor(
    private readonly blockchainService: BlockchainService,
    @InjectRepository(Bloque)
    private bloqueRepository: Repository<Bloque>,
    @InjectRepository(RegistroHash)
    private registroHashRepository: Repository<RegistroHash>,
  ) {}

  @Query(() => BloqueType, { nullable: true })
  async bloquePorAltura(@Args('altura', { type: () => Int }) altura: number): Promise<BloqueType | null> {
    const bloque = await this.bloqueRepository.findOne({
      where: { altura },
      relations: ['registrosHash']
    });
    
    if (!bloque) return null;
    
    const registrosHash = await this.registroHashRepository.find({
      where: { bloqueId: bloque.id }
    });
    
    return this.mapToBlockType(bloque, registrosHash);
  }

  @Query(() => [BloqueType])
  async bloques(
    @Args('limite', { type: () => Int, defaultValue: 10 }) limite: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number
  ): Promise<BloqueType[]> {
    const bloques = await this.bloqueRepository.find({
      skip: offset,
      take: limite,
      order: { altura: 'DESC' }
    });
    
  
    const resultados = [];
    for (const bloque of bloques) {
      const registrosHash = await this.registroHashRepository.find({
        where: { bloqueId: bloque.id }
      });
      resultados.push(this.mapToBlockType(bloque, registrosHash));
    }
    
    return resultados;
  }

  @Query(() => EstadisticasBlockchain)
   async estadisticasBlockchain(): Promise<EstadisticasBlockchain> {
    const totalBloques = await this.bloqueRepository.count();
    
    const ultimoBloque = await this.bloqueRepository.findOne({
      order: { altura: 'DESC' }
    });
    
   
    const totalTransacciones = await this.registroHashRepository.count({
      where: { bloqueId: Not(IsNull()) } 
    });
    
    const transaccionesPendientes = await this.registroHashRepository.count({
      where: { bloqueId: IsNull(), estado: 'CONFIRMADO' }  
    });
    
    return {
      totalBloques,
      totalTransacciones,
      transaccionesPendientes,
      ultimaAltura: ultimoBloque?.altura,
      ultimoBloqueFecha: ultimoBloque?.fechaCreacion
    };
  }

  @Mutation(() => CrearBloqueResult)
  async crearBloque(@Args('creadoPor', { nullable: true }) creadoPor?: string): Promise<CrearBloqueResult> {
    try {
      const autorBloque = creadoPor || 'junior-zamo99'; 
      console.log(`Iniciando creación de bloque por: ${autorBloque} - ${new Date().toISOString()}`);
      
      const bloque = await this.blockchainService.crearBloque();
      const registrosHash = await this.registroHashRepository.find({ 
        where: { bloqueId: bloque.id } 
      });
      
      return {
        success: true,
        bloque: this.mapToBlockType(bloque, registrosHash),
        mensaje: `Bloque #${bloque.altura} creado exitosamente con ${bloque.numeroTransacciones} transacciones`
      };
    } catch (error) {
      console.error('Error al crear bloque:', error);
      return {
        success: false,
        error: error.message || 'Error al crear bloque'
      };
    }
  }

  @Query(() => VerificacionBloqueResult)
  async verificarBloque(@Args('altura', { type: () => Int }) altura: number): Promise<VerificacionBloqueResult> {
    try {
      const bloque = await this.bloqueRepository.findOne({
        where: { altura }
      });
      
      if (!bloque) {
        return {
          esValido: false,
          altura: altura,
          hashBloque: '',
          motivo: `No existe bloque con altura ${altura}`,
          numeroTransacciones: 0
        };
      }
      
      const verificacion = await this.blockchainService.verificarBloque(bloque);
      
      return {
        esValido: verificacion.esValido,
        altura: bloque.altura,
        hashBloque: bloque.hashBloque,
        motivo: verificacion.motivo,
        numeroTransacciones: bloque.numeroTransacciones
      };
    } catch (error) {
      return {
        esValido: false,
        altura: altura,
        hashBloque: '',
        motivo: `Error al verificar: ${error.message}`,
        numeroTransacciones: 0
      };
    }
  }

  @Query(() => String)
async estadoScheduler(): Promise<string> {
  const pendientes = await this.registroHashRepository.count({
    where: { bloqueId: null, estado: 'CONFIRMADO' }
  });
  
  return `Scheduler activo. Próximo bloque programado a la hora en punto. Transacciones pendientes: ${pendientes}`;
}

  
  private mapToBlockType(bloque: Bloque, registrosHash: RegistroHash[]): BloqueType {
    return {
      id: bloque.id,
      altura: bloque.altura,
      hashBloque: bloque.hashBloque,
      hashBloqueAnterior: bloque.hashBloqueAnterior,
      merkleRoot: bloque.merkleRoot,
      timestamp: bloque.timestamp,
      nonce: bloque.nonce,
      numeroTransacciones: bloque.numeroTransacciones,
      fechaCreacion: bloque.fechaCreacion,
      esValido: bloque.esValido,
      estado: bloque.estado,
      registrosHash: registrosHash.map(registro => this.mapToHashType(registro))
    };
  }

  private mapToHashType(registro: RegistroHash): HashType {
    return {
      id: registro.id,
      ventaId: registro.ventaId,
      tenantId: registro.tenantId,
      hash: registro.valorHash,
      hashAlgorithm: registro.algoritmoHash,
      createdAt: registro.fechaCreacion,
      lastVerification: registro.ultimaVerificacion,
      isValid: registro.esValido,
      dataSize: registro.tamañoDatos,
      status: registro.estado,
      verifiedBy: registro.verificadoPor,
      hashInput: registro.entradaHash
    };
  }

  @Query(() => VerificacionCadenaResult)
async verificarCadenaCompleta(): Promise<VerificacionCadenaResult> {
  try {
    console.log(`🔍 Iniciando verificación completa de la cadena blockchain`);
    
    const resultado = await this.blockchainService.verificarCadenaCompleta();
    
    return {
      ...resultado,
      fechaVerificacion: new Date()
    };
  } catch (error) {
    console.error('❌ Error en verificación de cadena:', error);
    return {
      esValida: false,
      totalBloques: 0,
      bloquesValidos: 0,
      altura: 0,
      fechaVerificacion: new Date(),
      errores: [{ 
        altura: 0, 
        motivo: `Error en el servidor: ${error.message}` 
      }]
    };
  }
}

}