import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';
import { AgendaValidationError } from '../../domain/agenda.rules';

@Catch(AgendaValidationError)
export class AgendaDomainFilter implements ExceptionFilter {
  catch(exception: AgendaValidationError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const error = new BadRequestException(exception.message);
    response.status(error.getStatus()).json(error.getResponse());
  }
}
