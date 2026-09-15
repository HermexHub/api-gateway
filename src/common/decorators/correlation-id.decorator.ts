import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'
import { X_CORRELATION_ID } from '../constants/headers.constant'

export const CorrelationId = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): string => {
		const request = ctx.switchToHttp().getRequest<Request>()
		return (
			request.correlationId ||
			(request.headers[X_CORRELATION_ID] as string) ||
			''
		)
	}
)
