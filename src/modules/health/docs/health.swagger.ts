import { applyDecorators, HttpStatus } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

export function ApiHealthCheck() {
	return applyDecorators(
		ApiOperation({
			summary: 'Health check',
			description: 'Returns service health status and current server timestamp'
		}),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Service is healthy',
			schema: {
				example: {
					status: 'ok',
					timestamp: '2026-09-08T14:46:46.453Z'
				}
			}
		})
	)
}
