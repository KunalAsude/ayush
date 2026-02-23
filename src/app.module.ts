import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { analyzeModule } from './analyze/analyze.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://kunalasude_db_user:ThSELqVGgi0rYsIm@cluster0.czakey1.mongodb.net/ayush_knowledge'),
    analyzeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
