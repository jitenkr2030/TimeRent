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

// GET /api/sessions - Get user's sessions
export async function GET(request: NextRequest) {
  try {
    const tokenData = verifyToken(request)
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await db.session.findMany({
      where: {
        OR: [
          { seekerId: tokenData.userId },
          { giverId: tokenData.userId }
        ]
      },
      include: {
        seeker: {
          select: {
            id: true,
            name: true,
            avatar: true,
            presenceRating: true
          }
        },
        giver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            presenceRating: true
          }
        }
      },
      orderBy: {
        scheduledFor: 'desc'
      }
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const tokenData = verifyToken(request)
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { giverId, sessionType, duration, scheduledFor } = await request.json()

    // Validate input
    if (!giverId || !sessionType || !duration || !scheduledFor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if giver exists and is available
    const giver = await db.user.findUnique({
      where: { id: giverId }
    })

    if (!giver || !giver.isAvailable) {
      return NextResponse.json(
        { error: 'Giver not available' },
        { status: 400 }
      )
    }

    // Create session
    const session = await db.session.create({
      data: {
        seekerId: tokenData.userId,
        giverId,
        sessionType,
        duration,
        scheduledFor: new Date(scheduledFor),
        status: 'SCHEDULED',
        meetingLink: `https://meet.jit.si/TimeRent-${Date.now()}`,
        paymentStatus: 'PENDING',
        amount: duration === 10 ? 99 : duration === 30 ? 249 : 399
      },
      include: {
        seeker: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        giver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            presenceRating: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Session created successfully',
      session
    })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}