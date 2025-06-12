import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainService } from './blockchain.service';
import { Bloque } from '../entities/bloque';
import { RegistroHash } from '../entities/registrohash';
import { HashModule } from '../hash/hash.module';
import { BlockchainResolver } from './blockchain.resolver';
import { BlockchainSchedulerService } from './blockchain-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bloque, RegistroHash]),
    HashModule
  ],
  providers: [BlockchainService,BlockchainResolver,BlockchainSchedulerService ],
  exports: [BlockchainService]
})
export class BlockchainModule {}