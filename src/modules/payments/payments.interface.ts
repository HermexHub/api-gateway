import { Metadata } from '@grpc/grpc-js'
import { Observable } from 'rxjs'
import {
	ConfirmPaymentRequest,
	ConfirmPaymentResponse,
	GetPaymentSessionRequest,
	GetPaymentSessionResponse
} from '@hermex/contracts'

export interface PaymentGrpcServiceClient {
	getPaymentSession(
		request: GetPaymentSessionRequest,
		metadata?: Metadata
	): Observable<GetPaymentSessionResponse>

	confirmPayment(
		request: ConfirmPaymentRequest,
		metadata?: Metadata
	): Observable<ConfirmPaymentResponse>
}
