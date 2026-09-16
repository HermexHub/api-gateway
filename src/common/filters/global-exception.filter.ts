import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger
} from '@nestjs/common'
import { Request, Response } from 'express'
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
			'unknown-correlation-id'

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
			message = exception.message
			errorName = exception.name
		}

		this.logger.error(
			`[${correlationId}] ${request.method} ${request.url} - ${status} ${errorName}: ${JSON.stringify(
				message
			)}`,
			exception instanceof Error ? exception.stack : undefined
		)

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
