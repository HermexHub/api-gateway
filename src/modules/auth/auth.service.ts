import {
	ConflictException,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import { Response } from 'express'
import { AuthResponse, JwtPayload, UserResponse } from './auth.interface'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { UserEntity } from './entities/user.entity'
import { RefreshTokenRepository } from './repositories/refresh-token.repository'
import { UserRepository } from './repositories/user.repository'

@Injectable()
export class AuthService {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly refreshTokenRepository: RefreshTokenRepository,
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

		const { accessToken, refreshToken, expiresAt } =
			await this.generateTokens(user)

		const tokenHash = this.hashToken(refreshToken)
		await this.refreshTokenRepository.createToken(
			user.id,
			tokenHash,
			expiresAt
		)

		this.setRefreshTokenCookie(res, refreshToken)

		return {
			accessToken,
			user: this.toUserResponse(user)
		}
	}

	async login(dto: LoginDto, res: Response): Promise<AuthResponse> {
		const normalizedEmail = dto.email.trim().toLowerCase()
		const user = await this.userRepository.findByEmail(normalizedEmail)

		if (!user) {
			throw new UnauthorizedException('Invalid email or password')
		}

		const isPasswordValid = await bcrypt.compare(
			dto.password,
			user.passwordHash
		)
		if (!isPasswordValid) {
			throw new UnauthorizedException('Invalid email or password')
		}

		const { accessToken, refreshToken, expiresAt } =
			await this.generateTokens(user)

		const tokenHash = this.hashToken(refreshToken)
		await this.refreshTokenRepository.createToken(
			user.id,
			tokenHash,
			expiresAt
		)

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
			throw new UnauthorizedException('Refresh token is required')
		}

		try {
			const refreshSecret = this.configService.get<string>(
				'app.jwt.refreshSecret'
			)
			const payload = await this.jwtService.verifyAsync<JwtPayload>(
				refreshToken,
				{
					secret: refreshSecret
				}
			)

			const tokenHash = this.hashToken(refreshToken)
			const validToken =
				await this.refreshTokenRepository.findValidToken(
					payload.sub,
					tokenHash
				)

			if (!validToken) {
				throw new UnauthorizedException(
					'Invalid or revoked refresh token'
				)
			}

			// Revoke previous token (Token rotation pattern)
			await this.refreshTokenRepository.revokeToken(tokenHash)

			const user = await this.userRepository.findById(payload.sub)
			if (!user) {
				throw new UnauthorizedException('User not found')
			}

			const tokens = await this.generateTokens(user)
			const newTokenHash = this.hashToken(tokens.refreshToken)
			await this.refreshTokenRepository.createToken(
				user.id,
				newTokenHash,
				tokens.expiresAt
			)

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
		res: Response
	): Promise<{ message: string }> {
		if (refreshToken) {
			const tokenHash = this.hashToken(refreshToken)
			await this.refreshTokenRepository.revokeToken(tokenHash)
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
		const payload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
			fullName: user.profile?.displayName
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
			this.jwtService.signAsync(payload, {
				secret: accessSecret,
				expiresIn: (accessExpiresIn || '15m') as any
			}),
			this.jwtService.signAsync(payload, {
				secret: refreshSecret,
				expiresIn: (refreshExpiresIn || '7d') as any
			})
		])

		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

		return { accessToken, refreshToken, expiresAt }
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

	private hashToken(token: string): string {
		return crypto.createHash('sha256').update(token).digest('hex')
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
