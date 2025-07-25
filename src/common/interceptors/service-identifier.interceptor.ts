import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RpcError } from '../interfaces/rpc-error.interface';

@Injectable()
export class ServiceIdentifierInterceptor implements NestInterceptor {
  constructor(private readonly serviceName: string) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof RpcException) {
          const originalError = error.getError() as RpcError;
          // Solo agregar service si no existe
          if (
            typeof originalError === 'object' &&
            originalError &&
            !originalError.service
          ) {
            const enhancedError = {
              ...originalError,
              service: this.serviceName,
            };

            throw new RpcException(enhancedError);
          }
        }
        throw error;
      }),
    );
  }
}
