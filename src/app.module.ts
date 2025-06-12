import { Module } from '@nestjs/common';

import { HashModule } from './hash/hash.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroHash } from './entities/registrohash';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { Bloque } from './entities/bloque';
import { BlockchainModule } from './Blockchain/blockchain.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health.controller';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    ScheduleModule.forRoot(),
    
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ req, res }) => ({ req, res })
    }),
    
     TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'juniorzamo1999', // 🔧 CAMBIO AQUÍ
      database: process.env.DB_NAME || 'msvc-blockchain',     // 🔧 CAMBIO AQUÍ
      entities: [RegistroHash, Bloque],
      synchronize: true,
      charset: 'utf8mb4',
      timezone: '+00:00',
      logging: true,
      retryAttempts: 10,
      retryDelay: 3000,
      autoLoadEntities: true,
    }),
    
    HashModule,
    BlockchainModule
  ],

  controllers: [HealthController],
})
export class AppModule {}