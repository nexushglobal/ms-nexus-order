import { Injectable } from '@nestjs/common';
import { MessagingService } from 'src/messaging/messaging.service';
import { GetUserByIdInfoResponse } from '../interfaces/get-user-by-id-info-response.interface';

@Injectable()
export class UsersService {
  constructor(private readonly client: MessagingService) {}

  async getUser(userId: string): Promise<GetUserByIdInfoResponse> {
    return await this.client.send({ cmd: 'user.getUserBasicInfo' }, { userId });
  }
}
