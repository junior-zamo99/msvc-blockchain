import { Module } from '@nestjs/common';

import { HashModule } from './hash/hash.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroHash } from './entities/registrohash';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
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
      password: process.env.DB_PASS || 'juniorzamo1999',
      database: process.env.DB_NAME || 'msvc_blockchain',
      entities: [RegistroHash],
      synchronize: true,
      charset: 'utf8mb4',
      timezone: '+00:00',
      logging: true,
    }),
    
    HashModule,
  ],
})
export class AppModule {}