import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

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

// GET /api/wallet - Get user wallet balance and transactions
export async function GET(request: NextRequest) {
  try {
    const tokenData = verifyToken(request)
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get wallet details
    const wallet = await db.wallet.findUnique({
      where: { userId: tokenData.userId }
    })

    // Get recent transactions
    const transactions = await db.transaction.findMany({
      where: { userId: tokenData.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        session: {
          select: {
            id: true,
            sessionType: true,
            seeker: { select: { name: true } },
            giver: { select: { name: true } }
          }
        }
      }
    })

    return NextResponse.json({
      wallet: wallet || {
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0
      },
      transactions
    })
  } catch (error) {
    console.error('Get wallet error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/wallet/withdraw - Request withdrawal
export async function POST(request: NextRequest) {
  try {
    const tokenData = verifyToken(request)
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, bankDetails } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid withdrawal amount is required' },
        { status: 400 }
      )
    }

    // Check wallet balance
    const wallet = await db.wallet.findUnique({
      where: { userId: tokenData.userId }
    })

    if (!wallet || wallet.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Check minimum withdrawal amount (₹100)
    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is ₹100' },
        { status: 400 }
      )
    }

    // Create withdrawal transaction
    const transaction = await db.transaction.create({
      data: {
        userId: tokenData.userId,
        type: 'WITHDRAWAL',
        amount: -amount,
        status: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        description: `Withdrawal request for ₹${amount}`,
        metadata: bankDetails
      }
    })

    // Update wallet balance (temporarily deduct)
    await db.wallet.update({
      where: { userId: tokenData.userId },
      data: {
        balance: {
          decrement: amount
        },
        totalWithdrawn: {
          increment: amount
        },
        lastUpdated: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      transaction
    })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}