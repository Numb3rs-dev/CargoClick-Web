/**
 * SedeMap — Mapa interactivo para una sede de cliente.
 *
 * Usa react-leaflet + tiles OpenStreetMap (gratis, sin API key).
 * Se importa con dynamic({ ssr: false }) porque Leaflet usa window/document.
 *
 * CSS: declarado en globals.css con @import 'leaflet/dist/leaflet.css'
 * para que Tailwind no lo pise y esté disponible antes del primer render.
 */

'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Fix icono marcador ───────────────────────────────────────────────────── */
/*  Debe ejecutarse a nivel de MÓDULO (fuera del componente) — si se hace      */
/*  dentro de useEffect puede llegar tarde y el marcador queda roto.           */
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

/* ── Subcomponente: re-centra el mapa cuando cambian coords ──────────────── */
function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom(), { animate: true });
  }, [lat, lon, map]);
  return null;
}

/* ── Props ───────────────────────────────────────────────────────────────── */
export interface SedeMapProps {
  lat:        number;
  lon:        number;
  nombre?:    string;
  direccion?: string;
}

/* ── Componente ──────────────────────────────────────────────────────────── */
export function SedeMap({ lat, lon, nombre, direccion }: SedeMapProps) {
  const center: LatLngExpression = [lat, lon];

  return (
    /*
     * El div wrapper con height EXPLÍCITA es crítico.
     * Leaflet calcula las dimensiones del contenedor al montar —
     * si el elemento no tiene altura definida, el mapa queda en blanco.
     * MapContainer con height:'100%' hereda la altura del wrapper.
     */
    <div style={{
      width:     '100%',
      height:    220,
      position:  'relative',
      overflow:  'hidden',
      isolation: 'isolate',
      borderRadius: 'inherit',
    }}>
      {/*
        * Estos overrides deben vivir aquí (no en globals.css) porque:
        * - SedeMap se carga sólo en cliente via dynamic() → el <style> se
        *   inyecta después de que Tailwind preflight ya procesó todo.
        * - Tailwind resetea img { max-width:100%; height:auto; display:block }
        *   lo que parte las imágenes de tile de 256px en cuadritos pequeños.
        * - Un <style> con !important en el mismo shadow-DOM gana siempre.
        */}
      <style>{`
        .leaflet-container img {
          display:    inline !important;
          max-width:  none   !important;
          max-height: none   !important;
          height:     auto   !important;
          box-shadow: none   !important;
          border:     none   !important;
          padding:    0      !important;
          margin:     0      !important;
        }
        .leaflet-tile-container {
          pointer-events: none;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
        /*
         * key fuerza remount completo al cambiar coords.
         * MapContainer NO es reactivo al prop `center` tras el primer render.
         */
        key={`${lat},${lon}`}
      >
        <RecenterMap lat={lat} lon={lon} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={center}>
          {(nombre || direccion) && (
            <Popup>
              {nombre    && <strong style={{ display: 'block', marginBottom: 2 }}>{nombre}</strong>}
              {direccion && <span style={{ fontSize: 12, color: '#555' }}>{direccion}</span>}
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
}
