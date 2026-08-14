'use client'

import { Loader } from '@googlemaps/js-api-loader'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

// Single shared loader instance with all required libraries
let loaderInstance: Loader | null = null
let loadPromise: Promise<typeof google> | null = null

/**
 * Get the shared Google Maps loader instance.
 * This ensures all components use the same loader with all required libraries.
 */
export function getGoogleMapsLoader(): Loader {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'marker', 'geocoding', 'maps'], // All libraries needed across the app
    })
  }
  return loaderInstance
}

/**
 * Load Google Maps API. Returns a promise that resolves when the API is loaded.
 * Safe to call multiple times - will return the same promise.
 */
export async function loadGoogleMaps(): Promise<typeof google> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured')
  }

  if (!loadPromise) {
    const loader = getGoogleMapsLoader()
    loadPromise = loader.load()
  }

  return loadPromise
}

/**
 * Check if Google Maps API is already loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return typeof google !== 'undefined' && typeof google.maps !== 'undefined'
}

/**
 * Reset the loader (mainly for testing purposes)
 */
export function resetLoader(): void {
  loaderInstance = null
  loadPromise = null
}
