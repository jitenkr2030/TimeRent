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

// POST /api/payments/verify - Verify payment and update records
export async function POST(request: NextRequest) {
  try {
    const tokenData = verifyToken(request)
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      sessionId 
    } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Payment verification details are required' },
        { status: 400 }
      )
    }

    // Verify payment signature
    const isValidSignature = PaymentService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Get payment details from Razorpay
    const paymentResult = await PaymentService.getPayment(razorpay_payment_id)
    if (!paymentResult.success) {
      return NextResponse.json(
        { error: 'Failed to fetch payment details' },
        { status: 500 }
      )
    }

    const payment = paymentResult.payment

    // Get session details
    const session = await db.session.findFirst({
      where: { id: sessionId },
      include: {
        seeker: true,
        giver: true
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Update session payment status
    const updatedSession = await db.session.update({
      where: { id: sessionId },
      data: {
        paymentStatus: 'PAID',
        paymentId: razorpay_payment_id
      }
    })

    // Create transaction record for seeker
    await db.transaction.create({
      data: {
        userId: session.seekerId,
        sessionId: sessionId,
        type: 'SESSION_PAYMENT',
        amount: session.amount,
        status: 'COMPLETED',
        paymentMethod: 'RAZORPAY',
        paymentId: razorpay_payment_id,
        description: `Payment for ${session.sessionType} session with ${session.giver.name}`,
        metadata: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        }
      }
    })

    // Credit earnings to giver's wallet
    await db.wallet.upsert({
      where: { userId: session.giverId },
      update: {
        balance: {
          increment: session.giverEarnings
        },
        totalEarned: {
          increment: session.giverEarnings
        },
        lastUpdated: new Date()
      },
      create: {
        userId: session.giverId,
        balance: session.giverEarnings,
        totalEarned: session.giverEarnings,
        totalWithdrawn: 0
      }
    })

    // Create transaction record for giver
    await db.transaction.create({
      data: {
        userId: session.giverId,
        sessionId: sessionId,
        type: 'EARNINGS_CREDIT',
        amount: session.giverEarnings,
        status: 'COMPLETED',
        paymentMethod: 'WALLET',
        description: `Earnings from ${session.sessionType} session with ${session.seeker.name}`,
        metadata: {
          sessionId,
          seekerId: session.seekerId,
          platformFee: session.platformFee
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment verified and processed successfully',
      session: updatedSession
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}