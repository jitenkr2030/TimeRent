export interface Location {
  lat: number
  lng: number
  accuracy?: number
  timestamp: number
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

class GeolocationService {
  private static instance: GeolocationService | null = null

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService()
    }
    return GeolocationService.instance
  }

  // Get current user location
  async getCurrentPosition(options?: GeolocationOptions): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        ...options
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }
          resolve(location)
        },
        (error) => {
          let errorMessage = 'Unknown error occurred'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'User denied the request for Geolocation'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'The request to get user location timed out'
              break
            case error.UNKNOWN_ERROR:
              errorMessage = 'An unknown error occurred'
              break
          }
          
          reject(new Error(errorMessage))
        },
        defaultOptions
      )
    })
  }

  // Watch user location changes
  watchPosition(callback: (location: Location) => void, options?: GeolocationOptions): number {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser')
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
      ...options
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        }
        callback(location)
      },
      (error) => {
        console.error('Error watching position:', error)
      },
      defaultOptions
    )
  }

  // Stop watching position changes
  clearWatch(watchId: number): void {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
    }
  }

  // Check if geolocation is available
  isGeolocationSupported(): boolean {
    return 'geolocation' in navigator
  }

  // Request permission for geolocation
  async requestPermission(): Promise<PermissionState> {
    if (!navigator.geolocation) {
      return 'denied'
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve('granted'),
        () => resolve('denied'),
        () => resolve('prompt')
      )
    })
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

  // Convert address to coordinates using Nominatim (free geocoding)
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        return { lat, lng: lon }
      }
      return null
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      const data = await response.json()
      
      if (data && data.address) {
        const { city, state, country } = data.address
        return `${city || ''}, ${state || ''}, ${country || ''}`
      }
      return null
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return null
    }
  }

  // Get user's timezone
  getTimezone(lat: number, lng: number): string {
    try {
      // Simple timezone approximation based on longitude
      const timezoneOffset = Math.round(lng / 15) // Each timezone roughly 15 degrees
      const timezones = [
        'UTC', 'Europe/London', 'Europe/Paris', 'Asia/Kolkata', 'Asia/Tokyo',
        'America/New_York', 'America/Los_Angeles', 'America/Chicago'
      ]
      
      return timezones[Math.abs(timezoneOffset) % timezones.length] || 'UTC'
    } catch (error) {
      console.error('Timezone detection error:', error)
      return 'UTC'
    }
  }
}

type PermissionState = 'granted' | 'denied' | 'prompt'

export default GeolocationService