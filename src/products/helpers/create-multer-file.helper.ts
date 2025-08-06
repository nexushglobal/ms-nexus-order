export const createMulterFile = (
  file: any,
  buffer: Buffer,
): Express.Multer.File => {
  return {
    fieldname: file.fieldname || 'file',
    originalname: file.originalname,
    encoding: file.encoding || '7bit',
    mimetype: file.mimetype,
    size: file.size,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
    buffer,
  };
};
