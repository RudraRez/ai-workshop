import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TutorModule } from './modules/tutor/tutor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          rootPath: resolve(config.get<string>('UPLOAD_DIR', './uploads')),
          serveRoot: '/uploads',
          serveStaticOptions: { maxAge: 3600_000 },
        },
      ],
    }),
    TutorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
