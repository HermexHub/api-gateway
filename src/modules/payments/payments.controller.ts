import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Post
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import {
	ConfirmPaymentResponse,
	GetPaymentSessionResponse
} from '@hermex/contracts'
import { CorrelationId } from '@hermex/core'
import { Public } from '../auth/decorators/public.decorator'
import {
	ApiConfirmPayment,
	ApiGetPaymentSession
} from './docs/payments.swagger'
import { ConfirmPaymentDto } from './dto/confirm-payment.dto'
import { PaymentsService } from './payments.service'

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
	constructor(private readonly paymentsService: PaymentsService) {}

	@Public()
	@Get(':orderId')
	@ApiGetPaymentSession()
	async getPaymentSession(
		@Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
		@CorrelationId() correlationId: string
	): Promise<GetPaymentSessionResponse> {
		return this.paymentsService.getPaymentSession(orderId, correlationId)
	}

	@Public()
	@Post(':orderId/confirm')
	@HttpCode(HttpStatus.OK)
	@ApiConfirmPayment()
	async confirmPayment(
		@Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
		@Body() dto: ConfirmPaymentDto,
		@CorrelationId() correlationId: string
	): Promise<ConfirmPaymentResponse> {
		return this.paymentsService.confirmPayment(orderId, dto, correlationId)
	}
}
