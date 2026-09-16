import {
	registerDecorator,
	ValidationOptions,
	ValidationArguments
} from 'class-validator'

export function IsNotExpiredCard(validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			name: 'isNotExpiredCard',
			target: object.constructor,
			propertyName: propertyName,
			options: {
				message:
					'expiry must be a valid future expiration date in MM/YY format (e.g. 12/28)',
				...validationOptions
			},
			validator: {
				validate(value: unknown, _args: ValidationArguments) {
					if (typeof value !== 'string') return false
					const match = value.trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/)
					if (!match) return false

					const month = parseInt(match[1], 10)
					const year = 2000 + parseInt(match[2], 10)

					const now = new Date()
					const currentYear = now.getFullYear()
					const currentMonth = now.getMonth() + 1 // 1-12

					if (year < currentYear) return false
					if (year === currentYear && month < currentMonth) return false
					if (year > currentYear + 20) return false

					return true
				}
			}
		})
	}
}
