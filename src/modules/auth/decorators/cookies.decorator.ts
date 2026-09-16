import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

export const Cookies = createParamDecorator(
	(cookieName: string | undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest<Request>()
		return cookieName ? request.cookies?.[cookieName] : request.cookies
	}
)
