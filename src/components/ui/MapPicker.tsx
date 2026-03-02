'use client';

import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface Props {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

// Default center: Philippines
const DEFAULT_LAT = 12.8797;
const DEFAULT_LNG = 121.774;

export function MapPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep map and marker in refs so React re-renders don't rebuild them
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import to avoid SSR
    import('leaflet').then(L => {
      // Fix broken default icon paths bundled by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const centerLat = lat ?? DEFAULT_LAT;
      const centerLng = lng ?? DEFAULT_LNG;

      const map = L.map(containerRef.current!).setView([centerLat, centerLng], lat ? 16 : 6);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Place initial marker if coordinates exist
      if (lat !== null && lng !== null) {
        const m = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current = m;
        m.on('dragend', () => {
          const pos = m.getLatLng();
          onChange(+pos.lat.toFixed(6), +pos.lng.toFixed(6));
        });
      }

      // Click to place / move marker
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        const roundedLat = +clickLat.toFixed(6);
        const roundedLng = +clickLng.toFixed(6);

        if (markerRef.current) {
          markerRef.current.setLatLng([roundedLat, roundedLng]);
        } else {
          const m = L.marker([roundedLat, roundedLng], { draggable: true }).addTo(map);
          markerRef.current = m;
          m.on('dragend', () => {
            const pos = m.getLatLng();
            onChange(+pos.lat.toFixed(6), +pos.lng.toFixed(6));
          });
        }
        onChange(roundedLat, roundedLng);
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className="w-full h-64 rounded-sm border-2 border-gray-200 overflow-hidden z-0" />
      {lat !== null && lng !== null ? (
        <p className="text-xs font-body text-court-slate/50 flex items-center gap-1">
          <MapPin size={12} />
          {lat.toFixed(5)}, {lng.toFixed(5)} — drag the pin or click to reposition
        </p>
      ) : (
        <p className="text-xs font-body text-court-slate/40 flex items-center gap-1">
          <MapPin size={12} />
          Click on the map to pin your location
        </p>
      )}
    </div>
  );
}
