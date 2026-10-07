import { FinanceValidationError } from '../domain/finance.errors';
import {
  FinanceTransaction,
  IFinanceRepository,
} from '../domain/finance.repository.interface';

const MS_PER_DAY = 86400000;

export class ListTransactionsUseCase {
  constructor(private readonly repository: IFinanceRepository) {}

  async execute(from: string, to: string): Promise<FinanceTransaction[]> {
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start.toISOString().slice(0, 10) !== from ||
      end.toISOString().slice(0, 10) !== to
    ) {
      throw new FinanceValidationError(
        'Informe datas válidas no formato YYYY-MM-DD',
      );
    }

    end.setUTCDate(end.getUTCDate() + 1);
    const days = (end.getTime() - start.getTime()) / MS_PER_DAY;
    if (days < 1 || days > 366) {
      throw new FinanceValidationError('Consulte um período de 1 a 366 dias');
    }

    return this.repository.listByPeriod(start, end);
  }
}
