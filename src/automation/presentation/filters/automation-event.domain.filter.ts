import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  AutomationNotConfiguredError,
  AutomationNotFoundError,
  AutomationUnauthorizedError,
} from '../../domain/automation.errors';

/**
 * Traduz os erros de domínio da automação em respostas HTTP, preservando os
 * status originais:
 * - AutomationNotConfiguredError -> 503
 * - AutomationUnauthorizedError  -> 401
 * - AutomationNotFoundError      -> 404
 */
@Catch(
  AutomationNotConfiguredError,
  AutomationUnauthorizedError,
  AutomationNotFoundError,
)
export class AutomationDomainFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const error = this.toHttpException(exception);
    response.status(error.getStatus()).json(error.getResponse());
  }

  private toHttpException(exception: Error): HttpException {
    if (exception instanceof AutomationNotConfiguredError) {
      return new ServiceUnavailableException(exception.message);
    }
    if (exception instanceof AutomationNotFoundError) {
      return new NotFoundException(exception.message);
    }
    return new UnauthorizedException(exception.message);
  }
}
