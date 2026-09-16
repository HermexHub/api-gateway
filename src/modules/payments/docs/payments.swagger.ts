import { applyDecorators, HttpStatus } from '@nestjs/common'
import {
	ApiOperation,
	ApiParam,
	ApiResponse
} from '@nestjs/swagger'

export function ApiGetPaymentSession() {
	return applyDecorators(
		ApiOperation({
			summary: 'Get payment session details by Order ID',
			description:
				'Retrieves the current payment session for the specified order, including amount, currency, and status (PENDING, SUCCEEDED, FAILED).'
		}),
		ApiParam({
			name: 'orderId',
			type: String,
			description: 'Order UUID',
			example: 'b782fcd8-38b8-4c91-9e23-74b6fa72d312'
		}),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Payment session retrieved successfully',
			schema: {
				example: {
					paymentId: '6fa85f64-5717-4562-b3fc-2c963f66afa6',
					orderId: 'b782fcd8-38b8-4c91-9e23-74b6fa72d312',
					userId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
					amount: 99.99,
					currency: 'USD',
					status: 'PENDING',
					createdAt: '2026-09-16T12:00:00.000Z'
				}
			}
		}),
		ApiResponse({
			status: HttpStatus.NOT_FOUND,
			description: 'Payment session for order not found'
		})
	)
}

export function ApiConfirmPayment() {
	return applyDecorators(
		ApiOperation({
			summary: 'Confirm payment for an order (Hosted Checkout)',
			description:
				'Simulates payment processing. You can test success (4242...) or failure scenarios (INSUFFICIENT_FUNDS, CARD_EXPIRED, DECLINED_BY_BANK) to trigger Saga rollback.'
		}),
		ApiParam({
			name: 'orderId',
			type: String,
			description: 'Order UUID',
			example: 'b782fcd8-38b8-4c91-9e23-74b6fa72d312'
		}),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Payment processed and Saga finalized',
			schema: {
				example: {
					paymentId: '6fa85f64-5717-4562-b3fc-2c963f66afa6',
					orderId: 'b782fcd8-38b8-4c91-9e23-74b6fa72d312',
					status: 'SUCCEEDED',
					amount: 99.99,
					currency: 'USD',
					processedAt: '2026-09-16T12:00:01.000Z'
				}
			}
		}),
		ApiResponse({
			status: HttpStatus.BAD_REQUEST,
			description: 'Payment failed or declined'
		})
	)
}
