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

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const contentType = searchParams.get('contentType') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (contentType) {
      where.contentType = contentType
    }

    const [content, total] = await Promise.all([
      db.contentModeration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          moderator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      db.contentModeration.count({ where })
    ])

    // Get content details for each moderation item
    const contentWithDetails = await Promise.all(
      content.map(async (item) => {
        let contentDetails = null
        
        try {
          switch (item.contentType) {
            case 'FORUM_POST':
              contentDetails = await db.forumPost.findUnique({
                where: { id: item.contentId },
                select: {
                  id: true,
                  title: true,
                  content: true,
                  author: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              })
              break
            case 'EXPERIENCE_SHARE':
              contentDetails = await db.sharedExperience.findUnique({
                where: { id: item.contentId },
                select: {
                  id: true,
                  title: true,
                  content: true,
                  isAnonymous: true,
                  author: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              })
              break
            // Add more content types as needed
          }
        } catch (error) {
          console.error('Error fetching content details:', error)
        }

        return {
          ...item,
          contentDetails
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        content: contentWithDetails,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Content moderation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req)
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { contentId, contentType, action, reason, adminNotes } = await req.json()

    if (!contentId || !contentType || !action) {
      return NextResponse.json(
        { error: 'Content ID, content type, and action are required' },
        { status: 400 }
      )
    }

    // Update or create moderation record
    const moderation = await db.contentModeration.upsert({
      where: {
        contentType_contentId: {
          contentType,
          contentId
        }
      },
      update: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        moderatorId: admin.id,
        reason,
        adminNotes,
        updatedAt: new Date()
      },
      create: {
        contentType,
        contentId,
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        moderatorId: admin.id,
        reason,
        adminNotes
      }
    })

    // Log admin action
    await db.adminAction.create({
      data: {
        adminId: admin.id,
        actionType: action === 'approve' ? 'CONTENT_APPROVE' : 'CONTENT_DELETE',
        targetId: contentId,
        targetType: contentType.toLowerCase(),
        description: `${action}d ${contentType.toLowerCase()} ${contentId}`,
        metadata: { 
          action, 
          reason, 
          adminNotes, 
          performedBy: admin.email 
        }
      }
    })

    // If rejected, consider removing the content
    if (action === 'reject') {
      try {
        switch (contentType) {
          case 'FORUM_POST':
            await db.forumPost.update({
              where: { id: contentId },
              data: { isDeleted: true, deletedAt: new Date() }
            })
            break
          case 'EXPERIENCE_SHARE':
            await db.sharedExperience.update({
              where: { id: contentId },
              data: { isDeleted: true, deletedAt: new Date() }
            })
            break
        }
      } catch (error) {
        console.error('Error removing content:', error)
      }
    }

    return NextResponse.json({
      success: true,
      data: moderation
    })

  } catch (error) {
    console.error('Moderate content error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}