import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to verify admin token
async function verifyAdminToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId, role] = decoded.split(':')
    
    const admin = await db.user.findFirst({
      where: {
        id: userId,
        role: {
          in: ['ADMIN', 'MODERATOR']
        }
      }
    })

    return admin
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req)
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get dashboard statistics
    const [
      totalUsers,
      totalSessions,
      activeUsers,
      totalRevenue,
      pendingModeration,
      activeCrisisReports,
      recentLogs
    ] = await Promise.all([
      db.user.count(),
      db.session.count(),
      db.user.count({ where: { isAvailable: true } }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      }),
      db.contentModeration.count({ 
        where: { status: 'PENDING' }
      }),
      db.crisisReport.count({ 
        where: { status: 'ACTIVE' }
      }),
      db.systemLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Get user growth data (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const userGrowth = await db.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      _count: true
    })

    // Get session statistics
    const sessionStats = await db.session.groupBy({
      by: ['status'],
      _count: true
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalSessions,
          activeUsers,
          totalRevenue: totalRevenue._sum.amount || 0,
          pendingModeration,
          activeCrisisReports
        },
        userGrowth,
        sessionStats,
        recentLogs,
        adminInfo: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      }
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}