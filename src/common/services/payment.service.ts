import { Injectable } from '@nestjs/common';
import { MessagingService } from 'src/messaging/messaging.service';

@Injectable()
export class PaymentService {
  constructor(private readonly client: MessagingService) {}

  async createPayment(data: any): Promise<any> {
    return await this.client.send({ cmd: 'payment.createPayment' }, data);
  }
}
