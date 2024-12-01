import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface WindMapProps {
  location: { lat: number; lon: number } | null;
  windSpeed: number;
}

export const WindMap = ({ location, windSpeed }: WindMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!location) return;

    // Initialize map
    if (!map.current && mapContainer.current) {
      mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHNxOXBxbWowMDNqMmptbGVwOWs5NXd2In0.FhGwJMpU3K8mUgvZvh8VXw';
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [location.lon, location.lat],
        zoom: 9,
        pitch: 45
      });

      // Add marker for location
      new mapboxgl.Marker({
        color: "#39FF14"
      })
        .setLngLat([location.lon, location.lat])
        .addTo(map.current);

      // Add wind particles layer
      map.current.on('load', () => {
        // Add a source and layer for wind particles
        map.current?.addSource('wind', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        map.current?.addLayer({
          id: 'wind-layer',
          type: 'symbol',
          source: 'wind',
          layout: {
            'icon-image': 'wind',
            'icon-size': 1
          }
        });
      });
    }

    // Update map center when location changes
    if (map.current) {
      map.current.flyTo({
        center: [location.lon, location.lat],
        essential: true
      });
    }
  }, [location]);

  return (
    <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute bottom-4 left-4 bg-stalker-card/80 backdrop-blur-sm px-3 py-2 rounded text-sm">
        Wind Speed: {windSpeed} m/s
      </div>
    </div>
  );
};