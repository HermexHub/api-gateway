import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'
import {
	ConfirmPaymentResponse,
	GetPaymentSessionResponse,
	PAYMENT_SERVICE_NAME
} from '@hermex/contracts'
import { createGrpcMetadata } from '@hermex/core'
import { ConfirmPaymentDto } from './dto/confirm-payment.dto'
import { PAYMENT_GRPC_CLIENT } from './payments.constants'
import { PaymentGrpcServiceClient } from './payments.interface'

@Injectable()
export class PaymentsService implements OnModuleInit {
	private paymentGrpcService!: PaymentGrpcServiceClient

	constructor(
		@Inject(PAYMENT_GRPC_CLIENT)
		private readonly client: ClientGrpc
	) {}

	onModuleInit(): void {
		this.paymentGrpcService =
			this.client.getService<PaymentGrpcServiceClient>(PAYMENT_SERVICE_NAME)
	}

	async getPaymentSession(
		orderId: string,
		correlationId: string
	): Promise<GetPaymentSessionResponse> {
		return firstValueFrom(
			this.paymentGrpcService.getPaymentSession(
				{ orderId },
				createGrpcMetadata(correlationId)
			)
		)
	}

	async confirmPayment(
		orderId: string,
		dto: ConfirmPaymentDto,
		correlationId: string
	): Promise<ConfirmPaymentResponse> {
		return firstValueFrom(
			this.paymentGrpcService.confirmPayment(
				{
					orderId,
					cardNumber: dto.cardNumber,
					cardHolder: dto.cardHolder,
					expiry: dto.expiry,
					cvv: dto.cvv,
					scenario: dto.scenario,
					idempotencyKey: dto.idempotencyKey
				},
				createGrpcMetadata(correlationId)
			)
		)
	}
}

