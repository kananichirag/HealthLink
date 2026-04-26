import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = 500;
    let message = 'Internal server error';

    // Handle HttpException (includes validation errors, auth errors, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      // For HttpException, use the provided message
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      // For other errors, log the full error with stack trace
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      // For unknown error types
      this.logger.error(`Unhandled exception: ${JSON.stringify(exception)}`);
    }

    // Log error-level message with stack trace for unhandled exceptions
    if (!(exception instanceof HttpException)) {
      const errorMessage = exception instanceof Error ? exception.message : 'Unknown error';
      const stackTrace = exception instanceof Error ? exception.stack : '';
      this.logger.error(`${errorMessage}\n${stackTrace}`);
    }

    // Return generic error response for 500 errors
    response.status(status).json({
      message: status === 500 ? 'Internal server error' : message,
      statusCode: status,
    });
  }
}
