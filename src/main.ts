import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
 
 
  app.enableCors({
    origin: true,  
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  

  await app.listen(3000); 
  console.log('🔗 Blockchain Hash Service running on http://localhost:3000');
}
bootstrap();