import { applyDecorators, HttpStatus } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse
} from '@nestjs/swagger'

export function ApiCreateOrder() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({
			summary: 'Create a new order',
			description:
				'Creates an order in PENDING status and triggers the Saga workflow (inventory reservation, payment processing). The authenticated user ID is automatically linked to the order.'
		}),
		ApiResponse({
			status: HttpStatus.CREATED,
			description: 'Order successfully created and Saga initiated',
			schema: {
				example: {
					orderId: 'b782fcd8-38b8-4c91-9e23-74b6fa72d312',
					status: 'PENDING',
					totalAmount: 59.98,
					currency: 'USD',
					createdAt: '2026-09-15T12:30:00.000Z'
				}
			}
		}),
		ApiResponse({
			status: HttpStatus.BAD_REQUEST,
			description: 'Validation failed or invalid order payload',
			schema: {
				example: {
					statusCode: 400,
					timestamp: '2026-09-15T12:30:00.000Z',
					path: '/api/v1/orders',
					method: 'POST',
					correlationId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
					message: [
						'Order must contain at least one item',
						'quantity must be greater than 0'
					],
					error: 'BadRequestException'
				}
			}
		}),
		ApiResponse({
			status: HttpStatus.UNAUTHORIZED,
			description: 'User is not authenticated (missing or expired JWT)',
			schema: {
				example: {
					statusCode: 401,
					timestamp: '2026-09-15T12:30:00.000Z',
					path: '/api/v1/orders',
					method: 'POST',
					correlationId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
					message: 'Unauthorized',
					error: 'UnauthorizedException'
				}
			}
		}),
		ApiResponse({
			status: HttpStatus.INTERNAL_SERVER_ERROR,
			description: 'Internal server error or gRPC Order Service unavailable',
			schema: {
				example: {
					statusCode: 500,
					timestamp: '2026-09-15T12:30:00.000Z',
					path: '/api/v1/orders',
					method: 'POST',
					correlationId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
					message: 'Order service is currently unavailable',
					error: 'InternalServerErrorException'
				}
			}
		})
	)
}

export function ApiGetOrder() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({
			summary: 'Get order details by ID',
			description:
				'Retrieves complete order information, current status (PENDING, CONFIRMED, CANCELLED), items, and amounts.'
		}),
		ApiParam({
			name: 'id',
			type: String,
			description: 'Order UUID',
			example: 'b782fcd8-38b8-4c91-9e23-74b6fa72d312'
		}),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Order found and returned successfully',
			schema: {
				example: {
					orderId: 'b782fcd8-38b8-4c91-9e23-74b6fa72d312',
					userId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
					status: 'CONFIRMED',
					totalAmount: 59.98,
					currency: 'USD',
					items: [
						{
							productId: 'prod-001',
							quantity: 2,
							price: 29.99
						}
					],
					deliveryAddress: '123 Main Street, Suite 400, New York, NY 10001',
					createdAt: '2026-09-15T12:30:00.000Z',
					updatedAt: '2026-09-15T12:30:05.000Z'
				}
			}
		}),
		ApiResponse({
			status: HttpStatus.NOT_FOUND,
			description: 'Order with specified ID not found',
			schema: {
				example: {
					statusCode: 404,
					timestamp: '2026-09-15T12:30:00.000Z',
					path: '/api/v1/orders/b782fcd8-38b8-4c91-9e23-74b6fa72d312',
					method: 'GET',
					correlationId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
					message: 'Order with ID b782fcd8-38b8-4c91-9e23-74b6fa72d312 not found',
					error: 'NotFoundException'
				}
			}
		}),
		ApiResponse({
			status: HttpStatus.UNAUTHORIZED,
			description: 'User is not authenticated (missing or expired JWT)',
			schema: {
				example: {
					statusCode: 401,
					timestamp: '2026-09-15T12:30:00.000Z',
					path: '/api/v1/orders/b782fcd8-38b8-4c91-9e23-74b6fa72d312',
					method: 'GET',
					correlationId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
					message: 'Unauthorized',
					error: 'UnauthorizedException'
				}
			}
		})
	)
}
