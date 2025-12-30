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

// PATCH /api/sessions/[id] - Update session status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenData = verifyToken(request)
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, startedAt, endedAt } = await request.json()
    const sessionId = params.id

    // Check if session exists and belongs to the user
    const session = await db.session.findFirst({
      where: {
        id: sessionId,
        OR: [
          { seekerId: tokenData.userId },
          { giverId: tokenData.userId }
        ]
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Update session
    const updatedSession = await db.session.update({
      where: { id: sessionId },
      data: {
        ...(status && { status }),
        ...(startedAt && { startedAt: new Date(startedAt) }),
        ...(endedAt && { endedAt: new Date(endedAt) })
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
      message: 'Session updated successfully',
      session: updatedSession
    })
  } catch (error) {
    console.error('Update session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/sessions/[id] - Get specific session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenData = verifyToken(request)
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.id

    const session = await db.session.findFirst({
      where: {
        id: sessionId,
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
            email: true
          }
        },
        giver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            presenceRating: true,
            email: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}