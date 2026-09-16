import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Res
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import { AuthResponse } from './auth.interface'
import { AuthService } from './auth.service'
import { Cookies, CurrentUserId, Public } from './decorators'
import {
	ApiLogin,
	ApiLogout,
	ApiRefresh,
	ApiRegister
} from './docs/auth.swagger'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Public()
	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	@ApiRegister()
	async register(
		@Body() dto: RegisterDto,
		@Res({ passthrough: true }) res: Response
	): Promise<AuthResponse> {
		return this.authService.register(dto, res)
	}

	@Public()
	@Post('login')
	@HttpCode(HttpStatus.OK)
	@ApiLogin()
	async login(
		@Body() dto: LoginDto,
		@Res({ passthrough: true }) res: Response
	): Promise<AuthResponse> {
		return this.authService.login(dto, res)
	}

	@Public()
	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	@ApiRefresh()
	async refresh(
		@Cookies('refreshToken') refreshToken: string | undefined,
		@Res({ passthrough: true }) res: Response
	): Promise<AuthResponse> {
		return this.authService.refresh(refreshToken, res)
	}

	@Post('logout')
	@HttpCode(HttpStatus.OK)
	@ApiLogout()
	async logout(
		@CurrentUserId() userId: string,
		@Cookies('refreshToken') refreshToken: string | undefined,
		@Res({ passthrough: true }) res: Response
	): Promise<{ message: string }> {
		return this.authService.logout(refreshToken, userId, res)
	}
}



