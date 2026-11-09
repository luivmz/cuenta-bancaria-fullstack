export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const invalid = (message) => new AppError(400, 'INVALID_INPUT', message);
export const notFound = () => new AppError(404, 'ACCOUNT_NOT_FOUND', 'La cuenta no existe.');
