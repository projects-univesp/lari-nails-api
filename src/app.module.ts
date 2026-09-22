import { Module } from '@nestjs/common';
import { DatabaseModule } from './infra/database/database.module';
import { SecurityModule } from './infra/security/security.module';
import { HttpModule } from './infra/http/http.module';
import { ClientModule } from './clients/client.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    DatabaseModule,
    SecurityModule,
    HttpModule,
    ClientModule,
    UsersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
