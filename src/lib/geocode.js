'use server';

import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

const geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_API_KEY });

/**
 * Forward geocode an address using Mapbox SDK
 * @param {string} placeName - The address/place name to geocode
 * @returns {Promise<Array|null>} Array with [lng, lat] or null if not found
 */
export async function forwardGeocode(placeName) {
  try {
    if (!process.env.MAPBOX_API_KEY) {
      throw new Error('Mapbox API key is not configured');
    }

    if (!placeName || typeof placeName !== 'string' || placeName.trim().length === 0) {
      throw new Error('Valid place name is required');
    }

    const response = await geocodingClient
      .forwardGeocode({ query: placeName.trim(), limit: 1 })
      .send();

    const match = response.body.features[0];
    return match ? match.center : null; // [lng, lat]
  } catch (error) {
    console.error('Error forward geocoding:', error);
    throw new Error(`Failed to geocode place: ${error.message}`);
  }
}

/**
 * Reverse geocode coordinates using Mapbox SDK
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @returns {Promise<Object|null>} Place information or null if not found
 */
export async function reverseGeocode(lng, lat) {
  try {
    if (!process.env.MAPBOX_API_KEY) {
      throw new Error('Mapbox API key is not configured');
    }

    if (typeof lng !== 'number' || typeof lat !== 'number') {
      throw new Error('Valid longitude and latitude are required');
    }

    const response = await geocodingClient
      .reverseGeocode({ query: [lng, lat], limit: 1 })
      .send();

    const match = response.body.features[0];
    return match || null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw new Error(`Failed to reverse geocode coordinates: ${error.message}`);
  }
}

/**
 * Geocode an address and return formatted coordinates
 * @param {string} address - The address to geocode
 * @returns {Promise<Object>} Object containing lat and lng coordinates
 */
export async function geocodeAddress(address) {
  try {
    const coordinates = await forwardGeocode(address);
    
    if (!coordinates) {
      throw new Error('No coordinates found for the given address');
    }

    const [lng, lat] = coordinates;
    
    return {
      lat: lat,
      lng: lng
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
} 