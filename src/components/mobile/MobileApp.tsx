'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, Users, Star, Calendar, Video, IndianRupee, Home, Search, PlusCircle, User, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  matchScore: number
}

export default function MobileApp({ user }: { user: any }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [availableGivers, setAvailableGivers] = useState<TimeGiver[]>([])
  const [activeTab, setActiveTab] = useState('home')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchSessions()
    if (user.role === 'TIME_SEEKER' || user.role === 'BOTH') {
      fetchAvailableGivers()
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

  const bookSession = async (giverId: string, duration: number) => {
    try {
      const token = localStorage.getItem('token')
      const scheduledFor = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          giverId,
          sessionType: 'SILENT_PRESENCE',
          duration,
          scheduledFor
        })
      })

      if (response.ok) {
        fetchSessions()
        alert('Session booked successfully!')
      } else {
        alert('Failed to book session')
      }
    } catch (error) {
      console.error('Error booking session:', error)
      alert('Failed to book session')
    }
  }

  const getSessionTypeDisplay = (type: string) => {
    const types: { [key: string]: string } = {
      'SILENT_PRESENCE': 'Silent',
      'OPEN_TALK': 'Talk',
      'MIRROR_MODE': 'Mirror',
      'THINKING_ROOM': 'Think',
      'FOCUS_COMPANION': 'Focus'
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-bold">TimeRent</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => router.push('/dashboard')}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16">
        {activeTab === 'home' && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-1">Welcome back, {user.name}</h2>
              <p className="text-sm opacity-90">
                {user.role === 'TIME_SEEKER' && 'Find someone to sit with you'}
                {user.role === 'TIME_GIVER' && 'Ready to provide presence'}
                {user.role === 'BOTH' && 'Your TimeRent experience'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{user.presenceRating || 'New'}</div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
              </Card>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Recent Sessions</h3>
              {sessions.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No sessions yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 3).map((session) => (
                    <Card key={session.id} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.role === 'TIME_SEEKER' ? session.giver.avatar : session.seeker.avatar} />
                            <AvatarFallback className="text-xs">
                              {user.role === 'TIME_SEEKER' ? session.giver.name[0] : session.seeker.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {user.role === 'TIME_SEEKER' ? session.giver.name : session.seeker.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getSessionTypeDisplay(session.sessionType)} • {session.duration}min
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(session.status)}`}>
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {new Date(session.scheduledFor).toLocaleDateString()}
                        </div>
                        {session.status === 'SCHEDULED' && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                              <Video className="h-3 w-3 mr-1" />
                              Join
                            </a>
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'search' && (user.role === 'TIME_SEEKER' || user.role === 'BOTH') && (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Find Time Givers</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Finding available givers...</p>
              </div>
            ) : availableGivers.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No available givers right now</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {availableGivers.map((giver) => (
                  <Card key={giver.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={giver.avatar} />
                        <AvatarFallback>{giver.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm">{giver.name}</h3>
                          <Badge variant="outline" className="text-xs">{giver.matchScore}%</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{giver.bio}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{giver.presenceRating?.toFixed(1) || 'New'}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {giver.totalSessions} sessions
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1 text-xs"
                            onClick={() => bookSession(giver.id, 30)}
                          >
                            <IndianRupee className="h-3 w-3 mr-1" />
                            249 (30min)
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs"
                            onClick={() => bookSession(giver.id, 60)}
                          >
                            <IndianRupee className="h-3 w-3 mr-1" />
                            399 (60min)
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">All Sessions</h2>
            {sessions.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No sessions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <Card key={session.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.role === 'TIME_SEEKER' ? session.giver.avatar : session.seeker.avatar} />
                          <AvatarFallback className="text-xs">
                            {user.role === 'TIME_SEEKER' ? session.giver.name[0] : session.seeker.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {user.role === 'TIME_SEEKER' ? session.giver.name : session.seeker.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getSessionTypeDisplay(session.sessionType)} • {session.duration}min
                          </p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(session.status)}`}>
                        {session.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {new Date(session.scheduledFor).toLocaleDateString()} at {new Date(session.scheduledFor).toLocaleTimeString()}
                      </div>
                      {session.status === 'SCHEDULED' && session.meetingLink && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                            <Video className="h-3 w-3 mr-1" />
                            Join
                          </a>
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Profile</h2>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Sessions:</span>
                    <p className="text-muted-foreground">{user.totalSessions || 0}</p>
                  </div>
                  <div>
                    <span className="font-medium">Rating:</span>
                    <p className="text-muted-foreground">{user.presenceRating || 'Not rated'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Star className="h-4 w-4 mr-2" />
                    My Ratings
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t px-4 py-2">
        <div className="flex justify-around">
          <Button
            variant={activeTab === 'home' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('home')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Home className="h-4 w-4" />
            <span className="text-xs">Home</span>
          </Button>
          
          {(user.role === 'TIME_SEEKER' || user.role === 'BOTH') && (
            <Button
              variant={activeTab === 'search' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('search')}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs">Find</span>
            </Button>
          )}
          
          <Button
            variant={activeTab === 'sessions' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('sessions')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Sessions</span>
          </Button>
          
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('profile')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <User className="h-4 w-4" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </nav>
    </div>
  )
}