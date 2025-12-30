import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { PaymentService } from '@/lib/payments/razorpay'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string }
  } catch {
    return null
  }
}

// POST /api/payments/create-order - Create payment order
export async function POST(request: NextRequest) {
  try {
    const tokenData = verifyToken(request)
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, amount } = await request.json()

    if (!sessionId || !amount) {
      return NextResponse.json(
        { error: 'Session ID and amount are required' },
        { status: 400 }
      )
    }

    // Get session details
    const session = await db.session.findFirst({
      where: {
        id: sessionId,
        seekerId: tokenData.userId,
        paymentStatus: 'PENDING'
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or already paid' },
        { status: 404 }
      )
    }

    // Calculate earnings
    const earnings = PaymentService.calculateEarnings(amount)

    // Create Razorpay order
    const orderResult = await PaymentService.createOrder({
      amount,
      currency: 'INR',
      receipt: `session_${sessionId}`,
      notes: {
        sessionId,
        userId: tokenData.userId,
        type: 'SESSION_PAYMENT'
      }
    })

    if (!orderResult.success) {
      return NextResponse.json(
        { error: 'Failed to create payment order' },
        { status: 500 }
      )
    }

    // Update session with payment info
    await db.session.update({
      where: { id: sessionId },
      data: {
        amount,
        platformFee: earnings.platformFee,
        giverEarnings: earnings.giverEarnings
      }
    })

    return NextResponse.json({
      success: true,
      order: orderResult.order,
      key_id: process.env.RAZORPAY_KEY_ID
    })
  } catch (error) {
    console.error('Create payment order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}