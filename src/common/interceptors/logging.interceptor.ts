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
import { X_CORRELATION_ID } from '@hermex/core'
import { MetricsService } from '../../modules/metrics/metrics.service'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger('HTTP')

	constructor(private readonly metricsService?: MetricsService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const ctx = context.switchToHttp()
		const request = ctx.getRequest<Request>()
		const response = ctx.getResponse<Response>()

		const { method, originalUrl, url } = request
		const requestPath = originalUrl || url
		const isMetricsRequest = requestPath.startsWith('/metrics')
		const correlationId =
			request.correlationId ||
			(request.headers[X_CORRELATION_ID] as string) ||
			'unknown-correlation-id'
		const startTime = Date.now()

		if (!isMetricsRequest) {
			this.logger.log(`[${correlationId}] --> ${method} ${requestPath}`)
		}

		return next.handle().pipe(
			tap({
				next: () => {
					const duration = Date.now() - startTime
					const statusCode = response.statusCode

					if (!isMetricsRequest) {
						this.logger.log(
							`[${correlationId}] <-- ${method} ${requestPath} ${statusCode} +${duration}ms`
						)
					}

					if (this.metricsService && !isMetricsRequest) {
						const route = request.route?.path || requestPath.split('?')[0]
						this.metricsService.recordHttpRequest(
							method,
							route,
							statusCode,
							duration / 1000
						)
					}
				},
				error: (err: any) => {
					const duration = Date.now() - startTime
					const statusCode = err?.status || err?.statusCode || 500
					this.logger.warn(
						`[${correlationId}] <-- ${method} ${requestPath} failed with ${statusCode} after +${duration}ms`
					)

					if (this.metricsService && !isMetricsRequest) {
						const route = request.route?.path || requestPath.split('?')[0]
						this.metricsService.recordHttpRequest(
							method,
							route,
							statusCode,
							duration / 1000
						)
					}
				}
			})
		)
	}
}
