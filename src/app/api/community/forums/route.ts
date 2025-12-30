import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ForumCategory } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const { title, content, category, isAnonymous, tags, authorId } = await request.json()

    // Validate required fields
    if (!title || !content || !category || !authorId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, category, authorId' },
        { status: 400 }
      )
    }

    // Validate category
    if (!Object.values(ForumCategory).includes(category)) {
      return NextResponse.json(
        { error: 'Invalid forum category' },
        { status: 400 }
      )
    }

    // Create forum post
    const forumPost = await db.forumPost.create({
      data: {
        title,
        content,
        category,
        isAnonymous: isAnonymous !== false, // default to true
        authorId,
        tags: tags ? tags.join(',') : null,
        metadata: {
          wordCount: content.split(' ').length,
          lastActivity: new Date().toISOString()
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      post: {
        id: forumPost.id,
        title: forumPost.title,
        content: forumPost.content,
        category: forumPost.category,
        isAnonymous: forumPost.isAnonymous,
        author: forumPost.isAnonymous ? null : {
          id: forumPost.author.id,
          name: forumPost.author.name,
          avatar: forumPost.author.avatar
        },
        replyCount: forumPost.replyCount,
        viewCount: forumPost.viewCount,
        likeCount: forumPost.likeCount,
        tags: forumPost.tags ? forumPost.tags.split(',') : [],
        createdAt: forumPost.createdAt,
        updatedAt: forumPost.updatedAt
      }
    })

  } catch (error) {
    console.error('Create forum post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'latest'
    const tags = searchParams.get('tags')?.split(',')

    const skip = (page - 1) * limit

    let whereClause: any = {
      isDeleted: false
    }

    if (category && category !== 'all') {
      whereClause.category = category
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (tags && tags.length > 0) {
      whereClause.tags = {
        contains: tags[0], // Simple tag search - can be enhanced
        mode: 'insensitive'
      }
    }

    let orderBy: any = {
      createdAt: 'desc'
    }

    switch (sortBy) {
      case 'popular':
        orderBy = [
          { likeCount: 'desc' },
          { replyCount: 'desc' },
          { createdAt: 'desc' }
        ]
        break
      case 'most_replies':
        orderBy = [
          { replyCount: 'desc' },
          { createdAt: 'desc' }
        ]
        break
      case 'pinned':
        orderBy = [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ]
        break
      default: // latest
        orderBy = { createdAt: 'desc' }
    }

    const [posts, total] = await Promise.all([
      db.forumPost.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          _count: {
            select: {
              replies: {
                where: { isDeleted: false }
              }
            }
          }
        }
      }),
      db.forumPost.count({ where: whereClause })
    ])

    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
      category: post.category,
      isAnonymous: post.isAnonymous,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      author: post.isAnonymous ? null : {
        id: post.author.id,
        name: post.author.name,
        avatar: post.author.avatar
      },
      replyCount: post._count.replies,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      tags: post.tags ? post.tags.split(',') : [],
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }))

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get forum posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { postId, userId, title, content, isAnonymous, tags } = await request.json()

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: postId, userId' },
        { status: 400 }
      )
    }

    // Verify post ownership
    const existingPost = await db.forumPost.findUnique({
      where: { id: postId },
      select: { authorId: true, isDeleted: true }
    })

    if (!existingPost || existingPost.isDeleted) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.authorId !== userId) {
      return NextResponse.json(
        { error: 'Only the author can edit this post' },
        { status: 403 }
      )
    }

    // Update post
    const updateData: any = {
      updatedAt: new Date()
    }

    if (title) updateData.title = title
    if (content) updateData.content = content
    if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous
    if (tags !== undefined) updateData.tags = tags ? tags.join(',') : null

    const updatedPost = await db.forumPost.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      post: {
        id: updatedPost.id,
        title: updatedPost.title,
        content: updatedPost.content,
        category: updatedPost.category,
        isAnonymous: updatedPost.isAnonymous,
        author: updatedPost.isAnonymous ? null : {
          id: updatedPost.author.id,
          name: updatedPost.author.name,
          avatar: updatedPost.author.avatar
        },
        tags: updatedPost.tags ? updatedPost.tags.split(',') : [],
        updatedAt: updatedPost.updatedAt
      }
    })

  } catch (error) {
    console.error('Update forum post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const userId = searchParams.get('userId')

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: postId, userId' },
        { status: 400 }
      )
    }

    // Verify post ownership
    const existingPost = await db.forumPost.findUnique({
      where: { id: postId },
      select: { authorId: true, isDeleted: true }
    })

    if (!existingPost || existingPost.isDeleted) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.authorId !== userId) {
      return NextResponse.json(
        { error: 'Only the author can delete this post' },
        { status: 403 }
      )
    }

    // Soft delete the post
    await db.forumPost.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    })

  } catch (error) {
    console.error('Delete forum post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}