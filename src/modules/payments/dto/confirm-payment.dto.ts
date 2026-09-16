import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { PaymentScenario } from '@hermex/contracts'

export class ConfirmPaymentDto {
	@ApiProperty({
		example: '4242 4242 4242 4242',
		description:
			'Test Card Number (4242... = Success, ...0116 = Insufficient funds, ...0069 = Expired, ...0002 = Bank declined, ...9999 = Timeout)'
	})
	@IsString()
	@IsNotEmpty()
	cardNumber!: string

	@ApiProperty({
		example: 'ALEXANDER TEST',
		description: 'Cardholder Name'
	})
	@IsString()
	@IsNotEmpty()
	cardHolder!: string

	@ApiProperty({
		example: '12/28',
		description: 'Card Expiry (MM/YY)'
	})
	@IsString()
	@IsNotEmpty()
	expiry!: string

	@ApiProperty({
		example: '123',
		description: 'CVC / CVV code'
	})
	@IsString()
	@IsNotEmpty()
	cvv!: string

	@ApiPropertyOptional({
		enum: PaymentScenario,
		example: PaymentScenario.SUCCESS,
		description: 'Explicit simulation scenario for Saga testing'
	})
	@IsOptional()
	@IsEnum(PaymentScenario)
	scenario?: PaymentScenario

	@ApiPropertyOptional({
		example: 'idemp-123456',
		description: 'Optional Idempotency Key to prevent double charges'
	})
	@IsOptional()
	@IsString()
	idempotencyKey?: string
}
