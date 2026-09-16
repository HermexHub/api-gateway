import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches
} from 'class-validator'
import { PaymentScenario } from '@hermex/contracts'
import { IsNotExpiredCard } from '../../../common/validators/is-not-expired-card.decorator'

export class ConfirmPaymentDto {
	@ApiProperty({
		example: '4242 4242 4242 4242',
		description:
			'Test Card Number (4242... = Success, ...0116 = Insufficient funds, ...0069 = Expired, ...0002 = Bank declined, ...9999 = Timeout)'
	})
	@IsString()
	@IsNotEmpty()
	@Matches(/^(?:\d{4}[ -]?){3}\d{4}$/, {
		message: 'cardNumber must be a valid 16-digit card number'
	})
	cardNumber!: string

	@ApiProperty({
		example: 'ALEXANDER TEST',
		description: 'Cardholder Full Name (Latin letters)'
	})
	@IsString()
	@IsNotEmpty()
	@Matches(/^[A-Za-z]{2,26}(?:[ '-][A-Za-z]{2,26})+$/, {
		message:
			'cardHolder must contain first and last name in Latin letters (e.g. ALEXANDER TEST)'
	})
	cardHolder!: string

	@ApiProperty({
		example: '12/28',
		description: 'Card Expiry (MM/YY)'
	})
	@IsString()
	@IsNotEmpty()
	@IsNotExpiredCard()
	expiry!: string

	@ApiProperty({
		example: '123',
		description: 'CVC / CVV code (3 or 4 digits)'
	})
	@IsString()
	@IsNotEmpty()
	@Matches(/^\d{3,4}$/, {
		message: 'cvv must be a 3 or 4 digit security code'
	})
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
