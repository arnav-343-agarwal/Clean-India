'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Link from 'next/link';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function ExplorePage() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch reports
  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        const res = await fetch('/api/report?limit=100');
        const data = await res.json();
        setReports(data.reports || []);
      } catch (err) {
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  // Initialize Mapbox map and clustering
  useEffect(() => {
    if (!mapContainer.current || !reports.length) return;
    if (mapRef.current) return; // Only initialize once

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [77.209, 28.6139], // Default: New Delhi
      zoom: 4
    });
    mapRef.current = map;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl());

    map.on('load', () => {
      // Prepare GeoJSON features
      const features = reports.map(report => ({
        type: 'Feature',
        properties: {
          id: report._id,
          title: report.title,
          thumbnail: report.thumbnail,
          status: report.status
        },
        geometry: {
          type: 'Point',
          coordinates: [report.location.lng, report.location.lat]
        }
      }));

      map.addSource('reports', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'reports',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#34d399', // green-400
            10, '#fbbf24', // yellow-400
            30, '#f87171' // red-400
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            10, 24,
            30, 32
          ]
        }
      });

      // Cluster count labels
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'reports',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14
        }
      });

      // Unclustered points
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'reports',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#2563eb', // blue-600
          'circle-radius': 10,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Popup on click
      map.on('click', 'unclustered-point', (e) => {
        const feature = e.features[0];
        const { id, title } = feature.properties;
        const coordinates = feature.geometry.coordinates.slice();
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`<div><strong>${title}</strong><br/><a href="/report/${id}" class="text-blue-600 underline">View Report</a></div>`)
          .addTo(map);
      });

      // Change cursor on hover
      map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
      });

      // Zoom on cluster click
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('reports').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      });
    });

    // Cleanup on unmount
    return () => map.remove();
  }, [reports]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Explore Civic Reports</h1>
      <div className="w-full h-[400px] rounded-lg overflow-hidden mb-8 border border-gray-200">
        <div ref={mapContainer} className="w-full h-full" />
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Loading reports...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto space-y-4">
          {reports.map((report) => (
            <Link
              key={report._id}
              href={`/report/${report._id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition p-4 border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <img
                  src={report.thumbnail}
                  alt={report.title}
                  className="w-20 h-20 object-cover rounded-md border"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg text-gray-900">{report.title}</span>
                    <span className={`text-xs px-2 py-1 rounded ${report.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{report.status}</span>
                  </div>
                  <div className="text-gray-600 text-sm truncate">
                    {report.description || 'No description.'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 