import { applyDecorators, HttpStatus } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse
} from '@nestjs/swagger'

export function ApiRegister() {
	return applyDecorators(
		ApiOperation({
			summary: 'Register new user',
			description:
				'Creates a new user account, returns JWT access token in response body and sets HttpOnly refresh token cookie.'
		}),
		ApiResponse({
			status: HttpStatus.CREATED,
			description: 'User successfully registered',
			schema: {
				example: {
					accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
					user: {
						id: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
						email: 'alex@hermex.dev',
						fullName: 'Alex Smirnov',
						role: 'user',
						createdAt: '2026-09-08T14:46:46.453Z'
					}
				}
			}
		}),
		ApiResponse({
			status: HttpStatus.BAD_REQUEST,
			description: 'Validation failed',
			schema: {
				example: {
					statusCode: 400,
					timestamp: '2026-09-08T14:46:46.453Z',
					path: '/api/v1/auth/register',
					method: 'POST',
					correlationId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
					message: [
						'Invalid email address',
						'Password must be at least 6 characters long'
					],
					error: 'BadRequestException'
				}
			}
		}),
		ApiResponse({
			status: HttpStatus.CONFLICT,
			description: 'User with this email already exists',
			schema: {
				example: {
					statusCode: 409,
					timestamp: '2026-09-08T14:46:46.453Z',
					path: '/api/v1/auth/register',
					method: 'POST',
					correlationId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
					message: 'User with this email already exists',
					error: 'ConflictException'
				}
			}
		})
	)
}

export function ApiLogin() {
	return applyDecorators(
		ApiOperation({
			summary: 'User login',
			description:
				'Authenticates user, returns JWT access token in response body and sets HttpOnly refresh token cookie.'
		}),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Successfully authenticated',
			schema: {
				example: {
					accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
					user: {
						id: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
						email: 'alex@hermex.dev',
						fullName: 'Alex Smirnov',
						role: 'user',
						createdAt: '2026-09-08T14:46:46.453Z'
					}
				}
			}
		}),
		ApiResponse({
			status: HttpStatus.UNAUTHORIZED,
			description: 'Invalid email or password',
			schema: {
				example: {
					statusCode: 401,
					timestamp: '2026-09-08T14:46:46.453Z',
					path: '/api/v1/auth/login',
					method: 'POST',
					correlationId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
					message: 'Invalid email or password',
					error: 'UnauthorizedException'
				}
			}
		})
	)
}

export function ApiRefresh() {
	return applyDecorators(
		ApiOperation({
			summary: 'Refresh access token',
			description:
				'Reads refreshToken from HttpOnly cookie, returns new access token and refreshes the HttpOnly cookie.'
		}),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Tokens successfully refreshed',
			schema: {
				example: {
					accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
					user: {
						id: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
						email: 'alex@hermex.dev',
						fullName: 'Alex Smirnov',
						role: 'user',
						createdAt: '2026-09-08T14:46:46.453Z'
					}
				}
			}
		}),
		ApiResponse({
			status: HttpStatus.UNAUTHORIZED,
			description: 'Invalid or missing refresh token',
			schema: {
				example: {
					statusCode: 401,
					timestamp: '2026-09-08T14:46:46.453Z',
					path: '/api/v1/auth/refresh',
					method: 'POST',
					correlationId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
					message: 'Refresh token is required',
					error: 'UnauthorizedException'
				}
			}
		})
	)
}

export function ApiLogout() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({
			summary: 'User logout',
			description: 'Revokes the refresh token and clears the HttpOnly cookie.'
		}),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Successfully logged out',
			schema: {
				example: {
					message: 'Logged out successfully'
				}
			}
		})
	)
}
