import {
	CallHandler,
	ExecutionContext,
	Injectable,
	Logger,
	NestInterceptor
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { X_CORRELATION_ID } from '../constants/headers.constant'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger('HTTP')

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const ctx = context.switchToHttp()
		const request = ctx.getRequest<Request>()
		const response = ctx.getResponse<Response>()

		const { method, url } = request
		const correlationId =
			request.correlationId ||
			(request.headers[X_CORRELATION_ID] as string) ||
			'unknown-correlation-id'
		const startTime = Date.now()

		return next.handle().pipe(
			tap({
				next: () => {
					const duration = Date.now() - startTime
					const statusCode = response.statusCode
					this.logger.log(
						`[${correlationId}] ${method} ${url} ${statusCode} +${duration}ms`
					)
				},
				error: () => {
					const duration = Date.now() - startTime
					this.logger.warn(
						`[${correlationId}] ${method} ${url} failed after +${duration}ms`
					)
				}
			})
		)
	}
}
