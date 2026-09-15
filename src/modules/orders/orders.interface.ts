import type { Metadata } from '@grpc/grpc-js'
import type { Observable } from 'rxjs'
import type {
	CreateOrderRequest,
	CreateOrderResponse,
	GetOrderRequest,
	GetOrderResponse
} from '@hermex/contracts'

export interface OrderGrpcServiceClient {
	createOrder(
		request: CreateOrderRequest,
		metadata?: Metadata
	): Observable<CreateOrderResponse>

	getOrder(
		request: GetOrderRequest,
		metadata?: Metadata
	): Observable<GetOrderResponse>
}
