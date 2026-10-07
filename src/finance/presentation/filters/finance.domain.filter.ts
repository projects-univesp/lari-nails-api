import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  FinanceConflictError,
  FinanceNotFoundError,
  FinanceValidationError,
} from '../../domain/finance.errors';
import { PaymentValidationError } from '../../domain/payment.entity';

/**
 * Traduz os erros de domínio do módulo financeiro em respostas HTTP,
 * preservando os códigos de status do comportamento original:
 * - FinanceNotFoundError  -> 404
 * - FinanceConflictError  -> 409
 * - FinanceValidationError / PaymentValidationError -> 409
 */
@Catch(
  FinanceValidationError,
  FinanceConflictError,
  FinanceNotFoundError,
  PaymentValidationError,
)
export class FinanceDomainFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const error = this.toHttpException(exception);
    response.status(error.getStatus()).json(error.getResponse());
  }

  private toHttpException(exception: Error): HttpException {
    if (exception instanceof FinanceNotFoundError) {
      return new NotFoundException(exception.message);
    }
    return new ConflictException(exception.message);
  }
}
