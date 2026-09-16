import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger
} from '@nestjs/common'
import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
	getGrpcStatusName,
	grpcStatusToHttpStatus,
	isGrpcError
} from '@hermex/contracts'
import { X_CORRELATION_ID } from '@hermex/core'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(GlobalExceptionFilter.name)

	catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()
		const request = ctx.getRequest<Request>()

		const correlationId =
			request.correlationId ||
			(request.headers[X_CORRELATION_ID] as string) ||
			uuidv4()

		// Ensure correlation header is set on response even for errors
		response.setHeader(X_CORRELATION_ID, correlationId)

		let status = HttpStatus.INTERNAL_SERVER_ERROR
		let message: string | object = 'Internal server error'
		let errorName = 'InternalServerError'

		if (exception instanceof HttpException) {
			status = exception.getStatus()
			const res = exception.getResponse()
			if (typeof res === 'object' && res !== null) {
				const responseObj = res as Record<string, any>
				message = responseObj.message || exception.message
				errorName = responseObj.error || exception.name
			} else {
				message = res
				errorName = exception.name
			}
		} else if (isGrpcError(exception)) {
			status = grpcStatusToHttpStatus(exception.code)
			message = exception.details || exception.message || 'gRPC error'
			errorName = getGrpcStatusName(exception.code)
		} else if (exception instanceof Error) {
			const isProduction = process.env.NODE_ENV === 'production'
			message = isProduction ? 'Internal server error' : exception.message
			errorName = 'InternalServerError'
		}

		// Status-aware logging: 5xx = error with stack trace; 4xx = warn/debug without stack trace
		const logMessage = `[${correlationId}] ${request.method} ${request.url} - ${status} ${errorName}: ${JSON.stringify(
			message
		)}`

		if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
			this.logger.error(
				logMessage,
				exception instanceof Error ? exception.stack : undefined
			)
		} else if (status === HttpStatus.NOT_FOUND) {
			const isProbe =
				request.url.includes('/.well-known/') ||
				request.url.includes('/favicon.ico')
			if (isProbe) {
				this.logger.debug(logMessage)
			} else {
				this.logger.warn(logMessage)
			}
		} else {
			this.logger.warn(logMessage)
		}

		response.status(status).json({
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.url,
			method: request.method,
			correlationId,
			message,
			error: errorName
		})
	}
}

