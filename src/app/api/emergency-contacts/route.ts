import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, name, relationship, phone, email, isPrimary } = await request.json()

    // Validate required fields
    if (!userId || !name || !relationship || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, name, relationship, phone' },
        { status: 400 }
      )
    }

    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      await db.emergencyContact.updateMany({
        where: { userId },
        data: { isPrimary: false }
      })
    }

    // Create emergency contact
    const emergencyContact = await db.emergencyContact.create({
      data: {
        userId,
        name,
        relationship,
        phone,
        email,
        isPrimary: isPrimary || false,
        priority: isPrimary ? 1 : 2
      }
    })

    return NextResponse.json({
      success: true,
      emergencyContact
    })

  } catch (error) {
    console.error('Create emergency contact error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    const emergencyContacts = await db.emergencyContact.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: [
        { isPrimary: 'desc' },
        { priority: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      emergencyContacts
    })

  } catch (error) {
    console.error('Get emergency contacts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, relationship, phone, email, isPrimary, priority } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    // Get the contact to verify ownership
    const existingContact = await db.emergencyContact.findUnique({
      where: { id }
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Emergency contact not found' },
        { status: 404 }
      )
    }

    // If setting as primary, unset other primary contacts for this user
    if (isPrimary && !existingContact.isPrimary) {
      await db.emergencyContact.updateMany({
        where: { 
          userId: existingContact.userId,
          id: { not: id }
        },
        data: { isPrimary: false }
      })
    }

    // Update emergency contact
    const updatedContact = await db.emergencyContact.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(relationship && { relationship }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(priority && { priority })
      }
    })

    return NextResponse.json({
      success: true,
      emergencyContact: updatedContact
    })

  } catch (error) {
    console.error('Update emergency contact error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    // Soft delete by setting isActive to false
    const deletedContact = await db.emergencyContact.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Emergency contact removed successfully'
    })

  } catch (error) {
    console.error('Delete emergency contact error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}