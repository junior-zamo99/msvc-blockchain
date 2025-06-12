import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Bloque } from './bloque';

@Entity('registros_hash')
@Index('idx_venta_tenant_unico', ['ventaId', 'tenantId'], { unique: true })
@Index('idx_tenant', ['tenantId'])
@Index('idx_fecha_creacion', ['fechaCreacion'])
@Index('idx_estado', ['estado'])
export class RegistroHash {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ 
    type: 'bigint',
    comment: 'ID de la venta en el sistema ERP'
  })
  ventaId: number;

  @Column({ 
    type: 'bigint',
    comment: 'ID del tenant (restaurante)'
  })
  tenantId: number;

  @Column({ 
    type: 'varchar', 
    length: 64,
    comment: 'Hash SHA-256 generado de los datos de venta'
  })
  valorHash: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'SHA-256',
    comment: 'Algoritmo utilizado para generar el hash'
  })
  algoritmoHash: string;

  @Column({ 
    type: 'longtext',
    nullable: true,
    comment: 'Datos originales de la venta en formato JSON'
  })
  datosOriginales: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'CONFIRMADO',
    comment: 'Estado del registro: PENDIENTE, CONFIRMADO, EN_BLOQUE, VERIFICADO, ERROR'
  })
  estado: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Cadena de entrada utilizada para generar el hash'
  })
  entradaHash: string;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Tamaño en bytes de los datos procesados'
  })
  tamañoDatos: number;

  @CreateDateColumn({
    type: 'datetime',
    comment: 'Fecha y hora de creación del registro hash'
  })
  fechaCreacion: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'Fecha y hora de la última verificación realizada'
  })
  ultimaVerificacion: Date;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Usuario o sistema que realizó la última verificación'
  })
  verificadoPor: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indica si el hash es válido según la última verificación'
  })
  esValido: boolean;
  
  
  @ManyToOne(() => Bloque, bloque => bloque.registrosHash, { nullable: true })
  @JoinColumn({ name: 'bloque_id' })
  bloque: Bloque;
  
  @Column({
    type: 'bigint',
    nullable: true,
    comment: 'ID del bloque al que pertenece este hash'
  })
  bloqueId: number;
}