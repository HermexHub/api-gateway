import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { JwtPayload } from '../auth.interface'

export type UserField = keyof JwtPayload | 'id' | 'userId'

export const CurrentUser = createParamDecorator(
	(data: UserField | undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest()
		const user = request.user as JwtPayload

		if (!user) {
			return null
		}

		if (data === 'id' || data === 'userId') {
			return user.sub
		}

		return data ? user[data as keyof JwtPayload] : user
	}
)
