import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';
import { AgendaValidationError } from '../../../agenda/domain/agenda.rules';
import {
  AppointmentConflictError,
  AppointmentValidationError,
} from '../../domain/appointment.entity';

@Catch(
  AgendaValidationError,
  AppointmentValidationError,
  AppointmentConflictError,
)
export class AppointmentDomainFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const error =
      exception instanceof AppointmentConflictError
        ? new ConflictException(exception.message)
        : new BadRequestException(exception.message);
    response.status(error.getStatus()).json(error.getResponse());
  }
}
