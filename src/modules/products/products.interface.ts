import { Metadata } from '@grpc/grpc-js'
import { Observable } from 'rxjs'
import {
	GetProductByIdRequest,
	GetProductByIdResponse,
	GetProductsRequest,
	GetProductsResponse,
	ValidateCartRequest,
	ValidateCartResponse
} from '@hermex/contracts'

export interface InventoryGrpcServiceClient {
	getProducts(
		data: GetProductsRequest,
		metadata?: Metadata
	): Observable<GetProductsResponse>

	getProductById(
		data: GetProductByIdRequest,
		metadata?: Metadata
	): Observable<GetProductByIdResponse>

	validateCart(
		data: ValidateCartRequest,
		metadata?: Metadata
	): Observable<ValidateCartResponse>
}
