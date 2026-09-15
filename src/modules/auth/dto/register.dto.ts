import { ApiProperty } from '@nestjs/swagger'
import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	MinLength
} from 'class-validator'

export class RegisterDto {
	@ApiProperty({
		example: 'alex@hermex.dev',
		description: 'User email address'
	})
	@IsEmail({}, { message: 'Invalid email address' })
	@IsNotEmpty({ message: 'Email is required' })
	email!: string

	@ApiProperty({
		example: 'secretPassword123',
		description: 'User password (minimum 6 characters)',
		minLength: 6
	})
	@IsString()
	@MinLength(6, { message: 'Password must be at least 6 characters long' })
	password!: string

	@ApiProperty({
		example: 'Alex Smirnov',
		description: 'User full name',
		required: false
	})
	@IsOptional()
	@IsString()
	fullName?: string
}
