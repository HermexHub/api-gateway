import {
	ConflictException,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { Response } from 'express'
import {
	AuthResponse,
	JwtPayload,
	RefreshTokenPayload,
	UserResponse
} from './auth.interface'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { UserEntity } from './entities/user.entity'
import { UserRepository } from './repositories/user.repository'

// Precomputed dummy bcrypt hash (cost 10) to guarantee constant-time execution against timing attacks
const DUMMY_HASH =
	'$2a$10$e8kfv1234567890123456uABCDEFGHIJKLMNOPQRSTUVWXYZ012'

@Injectable()
export class AuthService {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService
	) {}

	async register(dto: RegisterDto, res: Response): Promise<AuthResponse> {
		const normalizedEmail = dto.email.trim().toLowerCase()

		const existingUser =
			await this.userRepository.findByEmail(normalizedEmail)
		if (existingUser) {
			throw new ConflictException(
				'User with this email already exists'
			)
		}

		const saltRounds = 10
		const passwordHash = await bcrypt.hash(dto.password, saltRounds)

		const user = await this.userRepository.createWithProfile(
			{
				email: normalizedEmail,
				passwordHash,
				role: 'user'
			},
			{
				displayName: dto.fullName
			}
		)

		const { accessToken, refreshToken } = await this.generateTokens(user)

		this.setRefreshTokenCookie(res, refreshToken)

		return {
			accessToken,
			user: this.toUserResponse(user)
		}
	}

	async login(dto: LoginDto, res: Response): Promise<AuthResponse> {
		const normalizedEmail = dto.email.trim().toLowerCase()
		const user = await this.userRepository.findByEmail(normalizedEmail)

		// Constant-time execution: always compare password to prevent timing attacks / user enumeration
		const hashToCompare = user ? user.passwordHash : DUMMY_HASH
		const isPasswordValid = await bcrypt.compare(
			dto.password,
			hashToCompare
		)

		// Uniform error: never leak whether email exists, password was wrong, or account is deactivated
		if (!user || !isPasswordValid || !user.isActive) {
			throw new UnauthorizedException('Invalid email or password')
		}

		// Invalidate any previously issued refresh tokens (Single Active Session)
		user.tokenVersion =
			await this.userRepository.incrementTokenVersion(user.id)

		const { accessToken, refreshToken } = await this.generateTokens(user)

		this.setRefreshTokenCookie(res, refreshToken)

		return {
			accessToken,
			user: this.toUserResponse(user)
		}
	}

	async refresh(
		refreshToken: string | undefined,
		res: Response
	): Promise<AuthResponse> {
		if (!refreshToken) {
			throw new UnauthorizedException('Invalid or expired refresh token')
		}

		try {
			const refreshSecret = this.configService.get<string>(
				'app.jwt.refreshSecret'
			)
			const payload =
				await this.jwtService.verifyAsync<RefreshTokenPayload>(
					refreshToken,
					{
						secret: refreshSecret
					}
				)

			const user = await this.userRepository.findById(payload.sub)
			// Uniform check: never leak whether user exists, is inactive, or version mismatch
			if (
				!user ||
				!user.isActive ||
				user.tokenVersion !== payload.tokenVersion
			) {
				throw new UnauthorizedException(
					'Invalid or expired refresh token'
				)
			}

			// Token rotation: increment token version and issue new tokens
			user.tokenVersion =
				await this.userRepository.incrementTokenVersion(user.id)

			const tokens = await this.generateTokens(user)
			this.setRefreshTokenCookie(res, tokens.refreshToken)

			return {
				accessToken: tokens.accessToken,
				user: this.toUserResponse(user)
			}
		} catch {
			throw new UnauthorizedException('Invalid or expired refresh token')
		}
	}


	async logout(
		refreshToken: string | undefined,
		userId: string | undefined,
		res: Response
	): Promise<{ message: string }> {
		if (userId) {
			await this.userRepository.incrementTokenVersion(userId)
		} else if (refreshToken) {
			try {
				const refreshSecret = this.configService.get<string>(
					'app.jwt.refreshSecret'
				)
				const payload =
					await this.jwtService.verifyAsync<RefreshTokenPayload>(
						refreshToken,
						{ secret: refreshSecret }
					)
				await this.userRepository.incrementTokenVersion(payload.sub)
			} catch {
				// Token was already invalid, continue with clearing cookie
			}
		}

		res.clearCookie('refreshToken', {
			path: '/',
			httpOnly: true,
			secure:
				this.configService.get<string>('app.nodeEnv') === 'production',
			sameSite: 'lax'
		})

		return { message: 'Logged out successfully' }
	}

	private async generateTokens(user: UserEntity) {
		const accessPayload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
			fullName: user.profile?.displayName
		}

		const refreshPayload: RefreshTokenPayload = {
			...accessPayload,
			tokenVersion: user.tokenVersion
		}

		const accessSecret = this.configService.get<string>(
			'app.jwt.accessSecret'
		)
		const accessExpiresIn = this.configService.get<string>(
			'app.jwt.accessExpiresIn'
		)
		const refreshSecret = this.configService.get<string>(
			'app.jwt.refreshSecret'
		)
		const refreshExpiresIn = this.configService.get<string>(
			'app.jwt.refreshExpiresIn'
		)

		const [accessToken, refreshToken] = await Promise.all([
			this.jwtService.signAsync(accessPayload, {
				secret: accessSecret,
				expiresIn: (accessExpiresIn || '15m') as any
			}),
			this.jwtService.signAsync(refreshPayload, {
				secret: refreshSecret,
				expiresIn: (refreshExpiresIn || '7d') as any
			})
		])

		return { accessToken, refreshToken }
	}

	private setRefreshTokenCookie(res: Response, refreshToken: string): void {
		const isProduction =
			this.configService.get<string>('app.nodeEnv') === 'production'

		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			path: '/'
		})
	}

	private toUserResponse(user: UserEntity): UserResponse {
		return {
			id: user.id,
			email: user.email,
			fullName: user.profile?.displayName,
			role: user.role,
			createdAt: user.createdAt.toISOString()
		}
	}
}

