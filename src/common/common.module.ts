import { Module } from '@nestjs/common';
import { ApiFetchAdapter } from './adapters/api-fetch.adapter';
import { HttpAdapter } from './interfaces/http-adapter.interface';
import { FilesService } from './services/files.service';
import { UsersService } from './services/users.service';

@Module({
  providers: [
    {
      provide: HttpAdapter,
      useClass: ApiFetchAdapter,
    },
    UsersService,
    FilesService,
  ],
  exports: [HttpAdapter, UsersService, FilesService],
})
export class CommonModule {}
