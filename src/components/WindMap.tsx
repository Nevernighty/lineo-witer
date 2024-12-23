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
    if (!location || !mapContainer.current) return;

    // Initialize map only if it hasn't been initialized yet
    if (!map.current) {
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
    } else {
      // If map exists, just update the center
      map.current.flyTo({
        center: [location.lon, location.lat],
        essential: true
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [location]);

  if (!location) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-stalker-dark/50 rounded-lg">
        <div className="text-stalker-muted animate-pulse">
          Waiting for location data...
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute bottom-4 left-4 bg-stalker-card/80 backdrop-blur-sm px-3 py-2 rounded text-sm">
        Wind Speed: {windSpeed.toFixed(1)} m/s
      </div>
    </div>
  );
};