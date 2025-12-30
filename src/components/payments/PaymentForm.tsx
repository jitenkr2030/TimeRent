'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IndianRupee, CreditCard, Smartphone, Wallet, Check, AlertCircle } from 'lucide-react'

interface PaymentFormProps {
  sessionId: string
  amount: number
  sessionType: string
  giverName: string
  duration: number
  onPaymentSuccess: () => void
  onPaymentError: (error: string) => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentForm({
  sessionId,
  amount,
  sessionType,
  giverName,
  duration,
  onPaymentSuccess,
  onPaymentError
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [orderCreated, setOrderCreated] = useState<any>(null)

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const createPaymentOrder = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          amount
        })
      })

      const data = await response.json()

      if (data.success) {
        setOrderCreated(data.order)
        return data.order
      } else {
        throw new Error(data.error || 'Failed to create payment order')
      }
    } catch (error) {
      console.error('Error creating payment order:', error)
      throw error
    }
  }

  const verifyPayment = async (paymentData: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...paymentData,
          sessionId
        })
      })

      const data = await response.json()

      if (data.success) {
        onPaymentSuccess()
      } else {
        throw new Error(data.error || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      throw error
    }
  }

  const handlePayment = async () => {
    setLoading(true)

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway')
      }

      // Create payment order
      const order = await createPaymentOrder()

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_1234567890',
        amount: order.amount,
        currency: order.currency,
        name: 'TimeRent',
        description: `${sessionType} session with ${giverName}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            await verifyPayment(response)
          } catch (error) {
            onPaymentError(error instanceof Error ? error.message : 'Payment verification failed')
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
            onPaymentError('Payment cancelled')
          }
        },
        prefill: {
          contact: '', // User can be pre-filled from profile
          email: '' // User email from profile
        },
        theme: {
          color: '#3b82f6'
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      onPaymentError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const getSessionTypeDisplay = (type: string) => {
    const types: { [key: string]: string } = {
      'SILENT_PRESENCE': 'Silent Presence',
      'OPEN_TALK': 'Open Talk',
      'MIRROR_MODE': 'Mirror Mode',
      'THINKING_ROOM': 'Thinking Room',
      'FOCUS_COMPANION': 'Focus Companion'
    }
    return types[type] || type
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Complete Payment
        </CardTitle>
        <CardDescription>
          Secure payment powered by Razorpay
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Session Type:</span>
              <span className="font-medium">{getSessionTypeDisplay(sessionType)}</span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span className="font-medium">{duration} minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Time Giver:</span>
              <span className="font-medium">{giverName}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total Amount:</span>
              <span className="flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                {amount}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <h3 className="font-semibold">Payment Methods</h3>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Credit/Debit Card</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard, Rupay</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Smartphone className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">UPI</p>
                <p className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Wallet className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-sm">Net Banking</p>
                <p className="text-xs text-muted-foreground">All major banks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            Your payment is secure and encrypted. TimeRent does not store your card details.
          </AlertDescription>
        </Alert>

        {/* Platform Fee Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Platform Fee:</strong> 20% of the session fee goes to TimeRent for maintaining the platform and ensuring safety.
          </AlertDescription>
        </Alert>

        {/* Pay Button */}
        <Button 
          onClick={handlePayment} 
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Pay ₹{amount}
            </div>
          )}
        </Button>

        {/* Terms */}
        <p className="text-xs text-muted-foreground text-center">
          By completing this payment, you agree to TimeRent's Terms of Service and Privacy Policy.
          Sessions are non-refundable once started.
        </p>
      </CardContent>
    </Card>
  )
}