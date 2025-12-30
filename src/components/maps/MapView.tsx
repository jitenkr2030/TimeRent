'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { 
  MapPin, 
  Users, 
  Search, 
  Filter, 
  Star,
  Navigation,
  Clock,
  IndianRupee
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import Leaflet to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>
})

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
  latitude?: number
  longitude?: number
  city?: string
  state?: string
  distance?: number
  hourlyRate?: number
}

interface MapViewProps {
  userLocation?: { lat: number; lng: number }
  timeGivers: TimeGiver[]
  onGiverSelect: (giver: TimeGiver) => void
  onLocationUpdate: (location: { lat: number; lng: number }) => void
  selectedGiver?: TimeGiver | null
}

export default function MapView({
  userLocation,
  timeGivers,
  onGiverSelect,
  onLocationUpdate,
  selectedGiver
}: MapViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [maxDistance, setMaxDistance] = useState(50)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [mapView, setMapView] = useState<'list' | 'map'>('map')
  const [giversWithDistance, setGiversWithDistance] = useState<TimeGiver[]>([])

  // Calculate distances and filter givers
  useEffect(() => {
    if (!userLocation) return

    const giversWithDist = timeGivers.map(giver => {
      if (giver.latitude && giver.longitude) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          giver.latitude,
          giver.longitude
        )
        return { ...giver, distance }
      }
      return giver
    }).filter(giver => {
      // Apply filters
      if (maxDistance && giver.distance && giver.distance > maxDistance) return false
      if (selectedFilter !== 'all') {
        if (selectedFilter === 'available' && !giver.isAvailable) return false
        if (selectedFilter === 'top-rated' && !giver.presenceRating) return false
        if (selectedFilter === 'nearby' && (!giver.distance || giver.distance > 10)) return false
      }
      return true
    }).sort((a, b) => {
      // Sort by distance primarily
      if (a.distance && b.distance) {
        return a.distance - b.distance
      }
      return 0
    })

    setGiversWithDistance(giversWithDist)
  }, [timeGivers, userLocation, maxDistance, selectedFilter])

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationUpdate({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
    return R * c
  }

  const formatDistance = (distance?: number) => {
    if (!distance) return null
    if (distance < 1) return `${Math.round(distance * 1000)}m`
    return `${distance.toFixed(1)}km`
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

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Time Givers Near You
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search by name or location</Label>
              <Input
                id="search"
                placeholder="Search time givers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="distance">Maximum distance: {maxDistance}km</Label>
              <Slider
                id="distance"
                min={[1]}
                max={[100]}
                step={[1]}
                value={[maxDistance]}
                onValueChange={(value) => setMaxDistance(value[0])}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('all')}
            >
              All Givers
            </Button>
            <Button
              variant={selectedFilter === 'available' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('available')}
            >
              Available Now
            </Button>
            <Button
              variant={selectedFilter === 'top-rated' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('top-rated')}
            >
              Top Rated
            </Button>
            <Button
              variant={selectedFilter === 'nearby' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('nearby')}
            >
              Nearby (≤10km)
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={mapView === 'map' ? 'default' : 'outline'}
              onClick={() => setMapView('map')}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Map View
            </Button>
            <Button
              variant={mapView === 'list' ? 'default' : 'outline'}
              onClick={() => setMapView('list')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              List View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map or List View */}
      {mapView === 'map' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MapComponent
              userLocation={userLocation}
              timeGivers={giversWithDistance}
              selectedGiver={selectedGiver}
              onGiverSelect={onGiverSelect}
            />
          </div>
          
          {/* Selected Giver Details */}
          {selectedGiver && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Time Giver</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    {selectedGiver.avatar ? (
                      <img src={selectedGiver.avatar} alt={selectedGiver.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-gray-600">{selectedGiver.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedGiver.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedGiver.bio}</p>
                    {selectedGiver.distance && (
                      <p className="text-sm text-blue-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {formatDistance(selectedGiver.distance)} away
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{selectedGiver.presenceRating?.toFixed(1) || 'New'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Sessions:</span>
                    <span>{selectedGiver.totalSessions}</span>
                  </div>
                  <div>
                    <span className="font-medium">Rate:</span>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      <span>{selectedGiver.hourlyRate || 299}/hr</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Location:</span>
                    <span>{selectedGiver.city || 'Remote'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => onGiverSelect(selectedGiver)}
                  >
                    Book Session
                  </Button>
                  <Button variant="outline" className="w-full">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {giversWithDistance.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No time givers found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or increasing the distance range
                </p>
              </CardContent>
            </Card>
          ) : (
            giversWithDistance.map((giver) => (
              <Card key={giver.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onGiverSelect(giver)}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      {giver.avatar ? (
                        <img src={giver.avatar} alt={giver.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-gray-600">{giver.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
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
                        {giver.distance && (
                          <Badge variant="outline" className="ml-auto">
                            {formatDistance(giver.distance)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Energy:</span>
                      <p className="text-muted-foreground capitalize">{giver.energyLevel}</p>
                    </div>
                    <div>
                      <span className="font-medium">Silence Comfort:</span>
                      <p className="text-muted-foreground">{giver.silenceComfort}/10</p>
                    </div>
                    <div>
                      <span className="font-medium">Rate:</span>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        <span>{giver.hourlyRate || 299}/hr</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Location:</span>
                      <p className="text-muted-foreground">{giver.city || 'Remote'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" className="flex-1">
                      <Clock className="h-4 w-4 mr-2" />
                      Book 30min
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Clock className="h-4 w-4 mr-2" />
                      Book 60min
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}