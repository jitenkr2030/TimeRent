import Razorpay from 'razorpay'
import { createHmac } from 'crypto'

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1234567890',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret_1234567890'
})

export interface PaymentOrder {
  amount: number // in rupees
  currency: string
  receipt: string
  notes?: Record<string, any>
}

export interface PaymentCapture {
  paymentId: string
  amount: number
}

export class PaymentService {
  // Create a payment order
  static async createOrder(order: PaymentOrder) {
    try {
      const options = {
        amount: order.amount * 100, // Razorpay expects amount in paise
        currency: order.currency || 'INR',
        receipt: order.receipt,
        notes: order.notes || {},
        payment_capture: 1 // Auto capture
      }

      const razorpayOrder = await razorpay.orders.create(options)
      return {
        success: true,
        order: razorpayOrder
      }
    } catch (error) {
      console.error('Error creating Razorpay order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment order'
      }
    }
  }

  // Verify payment signature
  static verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_1234567890'
      
      const body = orderId + '|' + paymentId
      const expectedSignature = createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex')

      return expectedSignature === signature
    } catch (error) {
      console.error('Error verifying payment:', error)
      return false
    }
  }

  // Get payment details
  static async getPayment(paymentId: string) {
    try {
      const payment = await razorpay.payments.fetch(paymentId)
      return {
        success: true,
        payment
      }
    } catch (error) {
      console.error('Error fetching payment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment'
      }
    }
  }

  // Capture payment (if not auto-captured)
  static async capturePayment(captureData: PaymentCapture) {
    try {
      const payment = await razorpay.payments.capture(captureData.paymentId, captureData.amount * 100)
      return {
        success: true,
        payment
      }
    } catch (error) {
      console.error('Error capturing payment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to capture payment'
      }
    }
  }

  // Refund payment
  static async refundPayment(paymentId: string, amount?: number) {
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: amount ? amount * 100 : undefined // Amount in paise
      })
      return {
        success: true,
        refund
      }
    } catch (error) {
      console.error('Error processing refund:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process refund'
      }
    }
  }

  // Calculate platform fees and giver earnings
  static calculateEarnings(amount: number, platformFeePercent: number = 20) {
    const platformFee = Math.round(amount * (platformFeePercent / 100))
    const giverEarnings = amount - platformFee
    
    return {
      totalAmount: amount,
      platformFee,
      giverEarnings,
      platformFeePercent
    }
  }
}

export default PaymentService