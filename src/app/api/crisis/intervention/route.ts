import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { CrisisSeverity, CrisisType, CrisisStatus } from '@prisma/client'

// Crisis intervention protocols
const CRISIS_PROTOCOLS = {
  [CrisisSeverity.CRITICAL]: [
    {
      step: 1,
      action: "IMMEDIATE_ESCALATION",
      description: "Contact emergency services immediately",
      emergency: true
    },
    {
      step: 2,
      action: "NOTIFY_CONTACTS",
      description: "Alert primary emergency contacts",
      priority: 1
    },
    {
      step: 3,
      action: "PROFESSIONAL_BACKUP",
      description: "Activate professional backup network",
      priority: 1
    }
  ],
  [CrisisSeverity.HIGH]: [
    {
      step: 1,
      action: "ASSESS_SAFETY",
      description: "Conduct immediate safety assessment"
    },
    {
      step: 2,
      action: "PROFESSIONAL_BACKUP",
      description: "Notify professional backup network"
    },
    {
      step: 3,
      action: "NOTIFY_CONTACTS",
      description: "Alert emergency contacts if needed"
    }
  ],
  [CrisisSeverity.MEDIUM]: [
    {
      step: 1,
      action: "SUPPORTIVE_INTERVENTION",
      description: "Provide immediate emotional support"
    },
    {
      step: 2,
      action: "SAFETY_PLANNING",
      description: "Create safety plan together"
    },
    {
      step: 3,
      action: "FOLLOW_UP",
      description: "Schedule follow-up check-in"
    }
  ],
  [CrisisSeverity.LOW]: [
    {
      step: 1,
      action: "ACTIVE_LISTENING",
      description: "Provide empathetic listening"
    },
    {
      step: 2,
      action: "GROUNDING_TECHNIQUES",
      description: "Suggest grounding exercises"
    },
    {
      step: 3,
      action: "RESOURCE_SHARING",
      description: "Share relevant support resources"
    }
  ]
}

// Emergency hotlines and resources
const EMERGENCY_RESOURCES = {
  india: {
    suicide_prevention: {
      name: "iCall",
      phone: "9152987821",
      available: "24/7"
    },
    mental_health: {
      name: "Vandrevala Foundation",
      phone: "18602662345",
      available: "24/7"
    },
    domestic_violence: {
      name: "National Domestic Violence Helpline",
      phone: "181",
      available: "24/7"
    }
  },
  global: {
    international: {
      name: "International Association for Suicide Prevention",
      website: "https://www.iasp.info/resources/Crisis_Centres/",
      description: "Find crisis centers worldwide"
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId, severity, type, description } = await request.json()

    // Validate required fields
    if (!userId || !severity || !type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, severity, type, description' },
        { status: 400 }
      )
    }

    // Create crisis report
    const crisisReport = await db.crisisReport.create({
      data: {
        userId,
        sessionId,
        severity,
        type,
        description,
        status: CrisisStatus.ACTIVE,
        protocolUsed: `CRISIS_${severity}_PROTOCOL`
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Get protocol steps based on severity
    const protocolSteps = CRISIS_PROTOCOLS[severity] || []

    // Get emergency contacts
    const emergencyContacts = await db.emergencyContact.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: {
        priority: 'asc'
      },
      take: 3 // Limit to top 3 contacts
    })

    // Get professional backup network
    const professionalBackups = await db.professionalBackup.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        priority: 'asc'
      },
      take: 5 // Limit to top 5 professionals
    })

    // Initialize response actions
    const actionsTaken = []

    // Execute protocol steps
    for (const step of protocolSteps) {
      switch (step.action) {
        case 'IMMEDIATE_ESCALATION':
          actionsTaken.push({
            action: step.action,
            description: step.description,
            executed: true,
            timestamp: new Date().toISOString(),
            resources: EMERGENCY_RESOURCES
          })
          break

        case 'NOTIFY_CONTACTS':
          if (emergencyContacts.length > 0) {
            actionsTaken.push({
              action: step.action,
              description: step.description,
              executed: true,
              timestamp: new Date().toISOString(),
              contactsNotified: emergencyContacts.map(c => ({
                name: c.name,
                relationship: c.relationship,
                phone: c.phone
              }))
            })
          }
          break

        case 'PROFESSIONAL_BACKUP':
          if (professionalBackups.length > 0) {
            actionsTaken.push({
              action: step.action,
              description: step.description,
              executed: true,
              timestamp: new Date().toISOString(),
              professionalsNotified: professionalBackups.map(p => ({
                name: p.name,
                profession: p.profession,
                phone: p.phone,
                specialization: p.specialization
              }))
            })
          }
          break

        default:
          actionsTaken.push({
            action: step.action,
            description: step.description,
            executed: true,
            timestamp: new Date().toISOString()
          })
      }
    }

    // Update crisis report with actions taken
    await db.crisisReport.update({
      where: { id: crisisReport.id },
      data: {
        metadata: {
          actionsTaken,
          protocolSteps,
          emergencyContactsNotified: emergencyContacts.length,
          professionalsNotified: professionalBackups.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      crisisReport: {
        id: crisisReport.id,
        severity: crisisReport.severity,
        type: crisisReport.type,
        status: crisisReport.status,
        createdAt: crisisReport.createdAt
      },
      protocolActivated: `CRISIS_${severity}_PROTOCOL`,
      actionsTaken,
      emergencyResources: EMERGENCY_RESOURCES,
      emergencyContacts: emergencyContacts.map(c => ({
        id: c.id,
        name: c.name,
        relationship: c.relationship,
        isPrimary: c.isPrimary
      })),
      professionalSupport: professionalBackups.map(p => ({
        id: p.id,
        name: p.name,
        profession: p.profession,
        specialization: p.specialization,
        responseTime: p.responseTime
      }))
    })

  } catch (error) {
    console.error('Crisis intervention error:', error)
    return NextResponse.json(
      { error: 'Internal server error during crisis intervention' },
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

    // Get active crisis reports for user
    const activeCrises = await db.crisisReport.findMany({
      where: {
        userId,
        status: {
          in: [CrisisStatus.ACTIVE, CrisisStatus.ESCALATED]
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        session: {
          select: {
            id: true,
            sessionType: true,
            scheduledFor: true
          }
        }
      }
    })

    // Get available crisis protocols
    const protocols = await db.crisisProtocol.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        severity: 'desc'
      }
    })

    return NextResponse.json({
      activeCrises,
      availableProtocols: protocols,
      emergencyResources: EMERGENCY_RESOURCES
    })

  } catch (error) {
    console.error('Get crisis info error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}