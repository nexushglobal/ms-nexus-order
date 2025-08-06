import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export const convertToBuffer = (bufferData: any): Buffer => {
  if (Buffer.isBuffer(bufferData)) {
    return bufferData;
  } else if (Array.isArray(bufferData)) {
    return Buffer.from(bufferData);
  } else if (typeof bufferData === 'string') {
    return Buffer.from(bufferData, 'base64');
  } else {
    throw new RpcException({
      status: HttpStatus.BAD_REQUEST,
      message: 'Formato de buffer no soportado',
    });
  }
};
