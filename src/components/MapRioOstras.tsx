/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MapPin, Navigation, Truck, RefreshCw } from 'lucide-react';
import { Cliente } from '../types';

interface MapRioOstrasProps {
  clientes: Cliente[];
  activeRouteIds?: string[];
  vendedorMode?: boolean;
  onOptimizeClick?: () => void;
  isOptimizing?: boolean;
}

export default function MapRioOstras({
  clientes,
  activeRouteIds = [],
  vendedorMode = false,
  onOptimizeClick,
  isOptimizing = false,
}: MapRioOstrasProps) {
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

  // Center coordinates around Rio das Ostras coastline
  // Let's map coordinates (latitude -22.51 to -22.53, longitude -41.92 to -41.96)
  // to an SVG viewport of width 400, height 300
  const mapCoordsToSvg = (lat: number, lng: number) => {
    // Lat range: -22.532 (bottom, Costazul) to -22.510 (top, Mariléa)
    // Lng range: -41.960 (left, Mariléa) to -41.925 (right, Costazul area)
    const latMin = -22.532;
    const latMax = -22.510;
    const lngMin = -41.960;
    const lngMax = -41.925;

    // Map long to X (0 to 400)
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 400;
    // Map lat to Y (300 to 0 because SVG 0 is top)
    const y = 300 - ((lat - latMin) / (latMax - latMin)) * 300;

    return { x, y };
  };

  // Base coordinates for the factory (Base)
  const factoryCoords = { lat: -22.5180, lng: -41.9480 }; // Zone near Amaral Peixoto
  const basePos = mapCoordsToSvg(factoryCoords.lat, factoryCoords.lng);

  // Map other customers
  const mappedClients = clientes.map(c => ({
    client: c,
    pos: mapCoordsToSvg(c.latitude, c.longitude),
  }));

  // Build the route coordinates sequence
  const routePoints: { x: number; y: number; label: string }[] = [];
  
  if (activeRouteIds.length > 0) {
    // Starts at base
    routePoints.push({ x: basePos.x, y: basePos.y, label: 'Fábrica' });
    
    // Add clients in active route order
    activeRouteIds.forEach((id, index) => {
      const found = mappedClients.find(mc => mc.client.id === id);
      if (found) {
        routePoints.push({ x: found.pos.x, y: found.pos.y, label: `${index + 1}°` });
      }
    });
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Navigation className="h-5 w-5 text-sky-500 animate-pulse" />
            Mapa Operacional de Rio das Ostras - RJ
          </h3>
          <p className="text-xs text-slate-500">Localização e rotas de entrega inteligentes</p>
        </div>
        {vendedorMode && onOptimizeClick && (
          <button
            onClick={onOptimizeClick}
            disabled={isOptimizing}
            className="flex items-center gap-1 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-all shadow-sm shadow-sky-100 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isOptimizing ? 'animate-spin' : ''}`} />
            {isOptimizing ? 'Otimizando...' : 'Otimizar Rota (IA)'}
          </button>
        )}
      </div>

      {/* SVG Map Container */}
      <div className="relative w-full aspect-[4/3] bg-sky-50 border border-slate-100 rounded-xl overflow-hidden shadow-inner">
        {/* Ocean Background Pattern / Coastline representation */}
        <svg viewBox="0 0 400 300" className="w-full h-full select-none">
          {/* Blue background is the ocean, let's draw land (green/yellowish gray) */}
          {/* Land path separating coast from ocean */}
          <path
            d="M 0 0 L 400 0 L 400 120 Q 350 140 280 180 T 150 250 T 0 280 Z"
            fill="#f1f5f9" // Land color (gray slate)
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          
          {/* Atlantic Ocean Label */}
          <text x="280" y="260" fill="#38bdf8" fontSize="10" fontWeight="600" opacity="0.6">
            Oceano Atlântico
          </text>
          
          {/* Main Road: Rodovia Amaral Peixoto (RJ-106) cutting through Rio das Ostras */}
          <path
            d="M 10 30 Q 120 70 200 120 T 380 200"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="5"
            strokeDasharray="4 2"
            opacity="0.8"
          />
          <text x="60" y="42" fill="#64748b" fontSize="8" transform="rotate(15, 60, 42)" fontWeight="500">
            Rod. Amaral Peixoto
          </text>
          
          {/* Orla da Praia de Costazul & Centro */}
          <path
            d="M 180 140 Q 240 160 300 190"
            fill="none"
            stroke="#fdba74"
            strokeWidth="3"
            opacity="0.7"
          />
          <text x="220" y="152" fill="#d97706" fontSize="7" fontWeight="500">
            Orla de Costazul
          </text>

          {/* Active Route Delivery Path Line */}
          {routePoints.length > 1 && (
            <>
              {/* Animated stroke for route path */}
              <path
                d={`M ${routePoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-[dash_5s_linear_infinite]"
                style={{
                  strokeDasharray: '8 4',
                }}
              />
              <path
                d={`M ${routePoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
            </>
          )}

          {/* Factory / Base Marker */}
          <g transform={`translate(${basePos.x}, ${basePos.y})`} className="cursor-pointer">
            <circle r="14" fill="#0369a1" opacity="0.2" className="animate-ping" />
            <circle r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            <Truck className="h-3.5 w-3.5 text-white absolute" style={{ transform: 'translate(-7px, -7px)' }} />
          </g>

          {/* Client Markers */}
          {mappedClients.map(({ client, pos }) => {
            const isActiveInRoute = activeRouteIds.includes(client.id);
            const routeIndex = activeRouteIds.indexOf(client.id);
            
            return (
              <g
                key={client.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedClient(client)}
                className="cursor-pointer group"
              >
                {isActiveInRoute ? (
                  <>
                    <circle r="12" fill="#f43f5e" opacity="0.3" className="animate-pulse" />
                    <circle r="8" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                    <text
                      y="2.5"
                      fill="#ffffff"
                      fontSize="7"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {routeIndex + 1}
                    </text>
                  </>
                ) : (
                  <>
                    <circle r="10" fill="#64748b" opacity="0.1" className="group-hover:opacity-30 transition-all" />
                    <circle r="6" fill="#475569" stroke="#ffffff" strokeWidth="1" />
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Legend */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs p-2 rounded-lg border border-slate-100 text-[10px] space-y-1 shadow-sm">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 bg-sky-600 rounded-full inline-block border border-white"></span>
            Fábrica Gelo (Base)
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block border border-white"></span>
            Pedido em Rota (Ordenado)
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 bg-slate-500 rounded-full inline-block border border-white"></span>
            Outros Clientes
          </div>
        </div>

        {/* Selected Client Info Overlay */}
        {selectedClient && (
          <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-100 shadow-lg flex items-start justify-between">
            <div className="flex gap-2">
              <div className="p-1.5 bg-slate-50 rounded-lg text-slate-600 self-center">
                <MapPin className="h-4 w-4 text-sky-500" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">{selectedClient.nome_estabelecimento}</h4>
                <p className="text-[10px] text-slate-500 line-clamp-1">{selectedClient.endereco}</p>
                <div className="flex gap-1.5 mt-0.5">
                  <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full font-semibold capitalize">
                    {selectedClient.tipo}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Tel: {selectedClient.telefone}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-1 rounded-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
