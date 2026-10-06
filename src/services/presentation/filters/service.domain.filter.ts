import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';
import { ServiceValidationError } from '../../domain/service.entity';

@Catch(ServiceValidationError)
export class ServiceDomainFilter implements ExceptionFilter {
  catch(exception: ServiceValidationError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const error = new BadRequestException(exception.message);
    response.status(error.getStatus()).json(error.getResponse());
  }
}
