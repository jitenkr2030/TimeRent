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

// POST /api/ratings - Create a presence rating
export async function POST(request: NextRequest) {
  try {
    const tokenData = verifyToken(request)
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, rating, feltLessAlone, timeFeltHeavy, wouldSitAgain, feedback } = await request.json()

    // Validate input
    if (!sessionId || rating === undefined || feltLessAlone === undefined || timeFeltHeavy === undefined || wouldSitAgain === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if session exists and belongs to the user
    const session = await db.session.findFirst({
      where: {
        id: sessionId,
        OR: [
          { seekerId: tokenData.userId },
          { giverId: tokenData.userId }
        ],
        status: 'COMPLETED'
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or not completed' },
        { status: 404 }
      )
    }

    // Check if rating already exists
    const existingRating = await db.presenceRating.findFirst({
      where: {
        sessionId,
        userId: tokenData.userId
      }
    })

    if (existingRating) {
      return NextResponse.json(
        { error: 'Rating already submitted' },
        { status: 400 }
      )
    }

    // Create rating
    const presenceRating = await db.presenceRating.create({
      data: {
        sessionId,
        userId: tokenData.userId,
        rating,
        feltLessAlone,
        timeFeltHeavy,
        wouldSitAgain,
        feedback
      }
    })

    // Update giver's average rating
    const giverRatings = await db.presenceRating.findMany({
      where: {
        session: {
          giverId: session.giverId
        }
      }
    })

    const averageRating = giverRatings.reduce((sum, r) => sum + r.rating, 0) / giverRatings.length

    await db.user.update({
      where: { id: session.giverId },
      data: {
        presenceRating: averageRating,
        totalSessions: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      message: 'Rating submitted successfully',
      rating: presenceRating
    })
  } catch (error) {
    console.error('Create rating error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/ratings - Get user's ratings
export async function GET(request: NextRequest) {
  try {
    const tokenData = verifyToken(request)
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    let ratings

    if (sessionId) {
      // Get ratings for a specific session
      ratings = await db.presenceRating.findMany({
        where: { sessionId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })
    } else {
      // Get all ratings for the user
      ratings = await db.presenceRating.findMany({
        where: { userId: tokenData.userId },
        include: {
          session: {
            select: {
              id: true,
              sessionType: true,
              duration: true,
              scheduledFor: true,
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
                  avatar: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    return NextResponse.json({ ratings })
  } catch (error) {
    console.error('Get ratings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}