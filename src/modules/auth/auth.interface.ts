export interface JwtPayload {
	sub: string
	email: string
	role: string
	fullName?: string
}

export interface UserResponse {
	id: string
	email: string
	fullName?: string
	role: string
	createdAt: string
}

export interface AuthResponse {
	accessToken: string
	user: UserResponse
}
