'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface TimeGiver {
  id: string
  name: string
  avatar?: string
  presenceRating?: number
  totalSessions: number
  latitude?: number
  longitude?: number
  city?: string
  distance?: number
  hourlyRate?: number
}

interface MapComponentProps {
  userLocation?: { lat: number; lng: number }
  timeGivers: TimeGiver[]
  selectedGiver?: TimeGiver | null
  onGiverSelect: (giver: TimeGiver) => void
}

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export default function MapComponent({
  userLocation,
  timeGivers,
  selectedGiver,
  onGiverSelect
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize map
    const map = L.map('map').setView(
      userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629], // Default to India center
      userLocation ? 12 : 5
    )

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    mapRef.current = map

    return () => {
      // Cleanup
      if (mapRef.current) {
        mapRef.current.remove()
      }
    }
  }, [userLocation])

  // Update markers when givers change
  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add user location marker
    if (userLocation) {
      const userIcon = L.divIcon({
        html: `
          <div style="
            background-color: #3b82f6;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
          ">
            YOU
          </div>
        `,
        className: 'user-location-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapRef.current)
        .bindPopup('<strong>Your Location</strong>')

      markersRef.current.push(userMarker)
    }

    // Add time giver markers
    timeGivers.forEach(giver => {
      if (giver.latitude && giver.longitude) {
        const isSelected = selectedGiver?.id === giver.id
        
        const giverIcon = L.divIcon({
          html: `
            <div style="
              background-color: ${isSelected ? '#10b981' : '#22c55e'};
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 12px;
              position: relative;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
            </div>
          `,
          className: 'giver-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })

        const marker = L.marker([giver.latitude, giver.longitude], { icon: giverIcon })
          .addTo(mapRef.current)
          .bindPopup(createPopupContent(giver))

        // Add click handler
        marker.on('click', () => {
          onGiverSelect(giver)
        })

        markersRef.current.push(marker)
      }
    })

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const group = new L.FeatureGroup(markersRef.current)
      mapRef.current.fitBounds(group.getBounds().pad(0.1))
    }
  }, [timeGivers, userLocation, selectedGiver, onGiverSelect])

  const createPopupContent = (giver: TimeGiver) => {
    return `
      <div style="min-width: 200px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <img src="${giver.avatar || '/default-avatar.png'}" 
               style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" 
               alt="${giver.name}" />
          <div>
            <h3 style="margin: 0; font-weight: bold;">${giver.name}</h3>
            <p style="margin: 4px 0; color: #666; font-size: 14px;">${giver.bio || 'Available for presence sessions'}</p>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
          <div>
            <strong>Rating:</strong><br/>
            ⭐ ${giver.presenceRating?.toFixed(1) || 'New'}
          </div>
          <div>
            <strong>Sessions:</strong><br/>
            ${giver.totalSessions}
          </div>
          <div>
            <strong>Rate:</strong><br/>
            ₹${giver.hourlyRate || 299}/hr
          </div>
          ${giver.distance ? `
          <div>
            <strong>Distance:</strong><br/>
            ${giver.distance < 1 ? Math.round(giver.distance * 1000) + 'm' : giver.distance.toFixed(1) + 'km'}
          </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 8px;">
          <button onclick="window.selectGiver('${giver.id}')" 
                  style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">
            Select This Giver
          </button>
        </div>
      </div>
    `
  }

  return (
    <div className="relative">
      <div 
        id="map" 
        style={{ 
          height: '500px', 
          width: '100%', 
          borderRadius: '8px',
          zIndex: 1
        }} 
      />
      
      {/* Map Legend */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'white',
        padding: '10px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000,
        fontSize: '14px'
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Legend</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              backgroundColor: '#3b82f6',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: '2px solid white'
            }} />
            <span>Your Location</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              backgroundColor: '#22c55e',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: '2px solid white'
            }} />
            <span>Time Givers</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              backgroundColor: '#10b981',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: '2px solid white'
            }} />
            <span>Selected</span>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {timeGivers.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>🗺️</div>
          <p style={{ margin: 0, color: '#666' }}>Finding time givers near you...</p>
        </div>
      )}
    </div>
  )
}