import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';
import { CatalogItemValidationError } from '../../domain/catalog-item.entity';

@Catch(CatalogItemValidationError)
export class CatalogItemDomainFilter implements ExceptionFilter {
  catch(exception: CatalogItemValidationError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const error = new BadRequestException(exception.message);
    response.status(error.getStatus()).json(error.getResponse());
  }
}
