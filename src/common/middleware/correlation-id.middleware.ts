import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { X_CORRELATION_ID } from '../constants/headers.constant'

declare global {
	namespace Express {
		interface Request {
			correlationId?: string
		}
	}
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction): void {
		const incomingCorrelationId = req.header(X_CORRELATION_ID)
		const correlationId =
			incomingCorrelationId && incomingCorrelationId.trim().length > 0
				? incomingCorrelationId
				: uuidv4()

		req.correlationId = correlationId
		req.headers[X_CORRELATION_ID] = correlationId
		res.setHeader(X_CORRELATION_ID, correlationId)

		next()
	}
}
