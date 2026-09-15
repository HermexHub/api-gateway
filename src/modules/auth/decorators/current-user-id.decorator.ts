import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { JwtPayload } from '../auth.interface'

export const CurrentUserId = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): string => {
		const request = ctx.switchToHttp().getRequest()
		const user = request.user as JwtPayload

		return user?.sub || ''
	}
)
