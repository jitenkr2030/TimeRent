'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, Users, Star, Calendar, Video, IndianRupee, Wallet } from 'lucide-react'
import PaymentForm from '@/components/payments/PaymentForm'
import WalletComponent from '@/components/payments/WalletComponent'
import MapView from '@/components/maps/MapView'

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  isAvailable?: boolean
  presenceRating?: number
  totalSessions?: number
}

interface Session {
  id: string
  sessionType: string
  duration: number
  status: string
  scheduledFor: string
  seeker: { name: string; avatar?: string }
  giver: { name: string; avatar?: string; presenceRating?: number }
  meetingLink?: string
}

interface TimeGiver {
  id: string
  name: string
  avatar?: string
  bio?: string
  presenceRating?: number
  totalSessions: number
  emotionalTempo?: string
  silenceComfort?: number
  energyLevel?: string
  matchScore: number
}

export default function Dashboard({ user }: { user: User }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [availableGivers, setAvailableGivers] = useState<TimeGiver[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingSession, setPendingSession] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>()
  const [selectedGiver, setSelectedGiver] = useState<TimeGiver | null>(null)

  useEffect(() => {
    fetchSessions()
    if (user.role === 'TIME_SEEKER' || user.role === 'BOTH') {
      fetchAvailableGivers()
    }
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [user])

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const fetchAvailableGivers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionType: 'SILENT_PRESENCE'
        })
      })
      const data = await response.json()
      setAvailableGivers(data.givers || [])
    } catch (error) {
      console.error('Error fetching givers:', error)
    } finally {
      setLoading(false)
    }
  }

  const bookSession = async (giverId: string, sessionType: string, duration: number) => {
    try {
      const token = localStorage.getItem('token')
      const scheduledFor = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          giverId,
          sessionType,
          duration,
          scheduledFor
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Show payment modal
        setShowPaymentModal(true)
        setPendingSession(data.session)
      } else {
        alert('Failed to book session')
      }
    } catch (error) {
      console.error('Error booking session:', error)
      alert('Failed to book session')
    }
  }

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    setPendingSession(null)
    fetchSessions()
    alert('Payment successful! Session booked.')
  }

  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`)
  }

  const getSessionTypeDisplay = (type: string) => {
    const types: { [key: string]: string } = {
      'SILENT_PRESENCE': 'Silent Presence',
      'OPEN_TALK': 'Open Talk',
      'MIRROR_MODE': 'Mirror Mode',
      'THINKING_ROOM': 'Thinking Room',
      'FOCUS_COMPANION': 'Focus Companion'
    }
    return types[type] || type
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
          <p className="text-muted-foreground">
            {user.role === 'TIME_SEEKER' && 'Find someone to sit with you'}
            {user.role === 'TIME_GIVER' && 'Your presence sessions'}
            {user.role === 'BOTH' && 'Manage your TimeRent experience'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sessions">My Sessions</TabsTrigger>
          {(user.role === 'TIME_SEEKER' || user.role === 'BOTH') && (
            <TabsTrigger value="find">Find Time Givers</TabsTrigger>
          )}
          {(user.role === 'TIME_SEEKER' || user.role === 'BOTH') && (
            <TabsTrigger value="map">Map View</TabsTrigger>
          )}
          {(user.role === 'TIME_GIVER' || user.role === 'BOTH') && (
            <TabsTrigger value="availability">Availability</TabsTrigger>
          )}
          {(user.role === 'TIME_GIVER' || user.role === 'BOTH') && (
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="sessions">
          <div className="grid gap-4">
            {sessions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
                  <p className="text-muted-foreground">
                    {user.role === 'TIME_SEEKER' || user.role === 'BOTH' 
                      ? 'Book your first session to get started'
                      : 'Your sessions will appear here'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              sessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.role === 'TIME_SEEKER' ? session.giver.avatar : session.seeker.avatar} />
                          <AvatarFallback>
                            {user.role === 'TIME_SEEKER' ? session.giver.name[0] : session.seeker.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {user.role === 'TIME_SEEKER' ? `With ${session.giver.name}` : `With ${session.seeker.name}`}
                          </CardTitle>
                          <CardDescription>
                            {getSessionTypeDisplay(session.sessionType)} • {session.duration} minutes
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                        {session.giver.presenceRating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{session.giver.presenceRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(session.scheduledFor).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(session.scheduledFor).toLocaleTimeString()}
                        </div>
                      </div>
                      {session.status === 'SCHEDULED' && session.meetingLink && (
                        <Button size="sm" asChild>
                          <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-2" />
                            Join Session
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {(user.role === 'TIME_SEEKER' || user.role === 'BOTH') && (
          <TabsContent value="map">
            <MapView
              userLocation={userLocation}
              timeGivers={availableGivers}
              selectedGiver={selectedGiver}
              onGiverSelect={setSelectedGiver}
              onLocationUpdate={setUserLocation}
            />
          </TabsContent>
        )}

        {(user.role === 'TIME_SEEKER' || user.role === 'BOTH') && (
          <TabsContent value="find">
            <div className="grid gap-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Find Your Time Giver</h2>
                <p className="text-muted-foreground">
                  Match with someone who can provide the presence you need
                </p>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading available time givers...</div>
              ) : availableGivers.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No available givers right now</h3>
                    <p className="text-muted-foreground">Check back later for available time givers</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {availableGivers.map((giver) => (
                    <Card key={giver.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={giver.avatar} />
                            <AvatarFallback>{giver.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{giver.name}</CardTitle>
                            <CardDescription>{giver.bio}</CardDescription>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{giver.presenceRating?.toFixed(1) || 'New'}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {giver.totalSessions} sessions
                              </span>
                              <Badge variant="outline">{giver.matchScore}% match</Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Tempo:</span>
                              <p className="text-muted-foreground capitalize">{giver.emotionalTempo}</p>
                            </div>
                            <div>
                              <span className="font-medium">Energy:</span>
                              <p className="text-muted-foreground capitalize">{giver.energyLevel}</p>
                            </div>
                            <div>
                              <span className="font-medium">Silence:</span>
                              <p className="text-muted-foreground">{giver.silenceComfort}/10</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => bookSession(giver.id, 'SILENT_PRESENCE', 30)}
                            >
                              <IndianRupee className="h-4 w-4 mr-1" />
                              249 (30min)
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => bookSession(giver.id, 'SILENT_PRESENCE', 60)}
                            >
                              <IndianRupee className="h-4 w-4 mr-1" />
                              399 (60min)
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {(user.role === 'TIME_GIVER' || user.role === 'BOTH') && (
          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Set Your Availability</CardTitle>
                <CardDescription>
                  Let seekers know when you're available to provide presence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Availability settings coming soon</h3>
                  <p className="text-muted-foreground">
                    You'll be able to set your weekly schedule and availability here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {(user.role === 'TIME_GIVER' || user.role === 'BOTH') && (
          <TabsContent value="wallet">
            <WalletComponent />
          </TabsContent>
        )}
      </Tabs>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          {pendingSession && (
            <PaymentForm
              sessionId={pendingSession.id}
              amount={pendingSession.duration === 30 ? 249 : pendingSession.duration === 60 ? 399 : 99}
              sessionType={pendingSession.sessionType}
              giverName={pendingSession.giver.name}
              duration={pendingSession.duration}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}