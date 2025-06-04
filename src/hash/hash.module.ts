import { Module } from '@nestjs/common';
import { hashController } from './hash.controller';
import { HashService } from './hash.service';
import { RegistroHash } from 'src/entities/registrohash';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HashResolver } from './hash.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([RegistroHash])],
  controllers: [hashController],
  providers: [HashService,HashResolver],
  exports: [HashService] 
})
export class HashModule {}