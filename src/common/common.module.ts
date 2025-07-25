import { Module } from '@nestjs/common';
import { ApiFetchAdapter } from './adapters/api-fetch.adapter';
import { HttpAdapter } from './interfaces/http-adapter.interface';

@Module({
  providers: [
    {
      provide: HttpAdapter,
      useClass: ApiFetchAdapter,
    },
  ],
  exports: [HttpAdapter],
})
export class CommonModule {}
