import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { analyzeModule } from './analyze/analyze.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ayush'),
    analyzeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
