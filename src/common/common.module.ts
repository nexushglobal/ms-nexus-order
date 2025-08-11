import { Module } from '@nestjs/common';
import { ApiFetchAdapter } from './adapters/api-fetch.adapter';
import { HttpAdapter } from './interfaces/http-adapter.interface';
import { FilesService } from './services/files.service';
import { MembershipService } from './services/memberships.service';
import { UsersService } from './services/users.service';

@Module({
  providers: [
    {
      provide: HttpAdapter,
      useClass: ApiFetchAdapter,
    },
    UsersService,
    MembershipService,
    FilesService,
  ],
  exports: [HttpAdapter, UsersService, FilesService, MembershipService],
})
export class CommonModule {}
