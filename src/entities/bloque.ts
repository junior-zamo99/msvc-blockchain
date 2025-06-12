import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Index } from 'typeorm';
import { RegistroHash } from './registrohash';

@Entity('bloques')
@Index('idx_altura', ['altura'], { unique: true })
@Index('idx_fecha_creacion', ['fechaCreacion'])
export class Bloque {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ 
    type: 'int',
    comment: 'Altura/número del bloque en la cadena'
  })
  altura: number;

  @Column({ 
    type: 'varchar', 
    length: 64,
    comment: 'Hash SHA-256 del bloque actual'
  })
  hashBloque: string;

  @Column({ 
    type: 'varchar', 
    length: 64,
    comment: 'Hash del bloque anterior en la cadena'
  })
  hashBloqueAnterior: string;

  @Column({ 
    type: 'varchar', 
    length: 64,
    comment: 'Hash raíz del árbol de Merkle de las transacciones'
  })
  merkleRoot: string;

  @Column({
    type: 'bigint',
    comment: 'Timestamp Unix de creación del bloque'
  })
  timestamp: number;

  @Column({
    type: 'int',
    comment: 'Número usado una vez para encontrar un hash válido'
  })
  nonce: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de transacciones incluidas en este bloque'
  })
  numeroTransacciones: number;

  @CreateDateColumn({
    type: 'datetime',
    comment: 'Fecha y hora de creación del bloque'
  })
  fechaCreacion: Date;
  
  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indica si el bloque es válido en la cadena'
  })
  esValido: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'CONFIRMADO',
    comment: 'Estado del bloque: PENDIENTE, CONFIRMADO, VERIFICADO'
  })
  estado: string;

  // Relación inversa con RegistroHash
  @OneToMany(() => RegistroHash, registroHash => registroHash.bloque)
  registrosHash: RegistroHash[];
}