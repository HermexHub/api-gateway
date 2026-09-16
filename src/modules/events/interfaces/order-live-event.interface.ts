export interface OrderLiveEvent {
	orderId: string
	status: string
	eventType: string
	title: string
	message: string
	timestamp: string
	correlationId?: string
	metadata?: Record<string, unknown>
}
