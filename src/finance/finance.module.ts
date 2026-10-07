import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infra/database/database.module';
import { FinanceController } from './finance.controller';
import { FinanceRepository } from './finance.repository';

@Module({ imports: [DatabaseModule], controllers: [FinanceController], providers: [FinanceRepository] })
export class FinanceModule {}
