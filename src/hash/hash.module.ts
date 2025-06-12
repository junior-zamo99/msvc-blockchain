import { Module } from '@nestjs/common';
import { HashService } from './hash.service';
import { RegistroHash } from 'src/entities/registrohash';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HashResolver } from './hash.resolver';
import { VentaVerificationService } from './venta-verification.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([RegistroHash]),
HttpModule ],
  controllers: [],
  providers: [HashService,HashResolver,VentaVerificationService],
  exports: [HashService,VentaVerificationService] 
})
export class HashModule {}