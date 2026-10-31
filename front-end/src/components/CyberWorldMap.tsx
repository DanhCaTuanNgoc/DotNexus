import React, { useMemo, useState } from 'react';
import { geoEquirectangular, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
import worldData from 'world-atlas/countries-110m.json';

export interface PeerNode {
  peer_id: string;
  ip: string;
  location: string;
  client_version: string;
  protocol: string;
  latency_ms: number;
  role: string;
  status: string;
  is_malicious: boolean;
  anomaly?: string;
}

interface CyberWorldMapProps {
  peers: PeerNode[];
  selectedPeer: PeerNode | null;
  onSelectPeer: (peer: PeerNode) => void;
  className?: string;
}

// Coordinate resolution for known locations
export const getPeerCoordinates = (location: string, peerId: string): [number, number] => {
  const loc = (location || '').toLowerCase();
  let baseCoords: [number, number] | null = null;

  if (loc.includes('frankfurt') || loc.includes('germany')) baseCoords = [8.6821, 50.1109];
  else if (loc.includes('singapore')) baseCoords = [103.8198, 1.3521];
  else if (loc.includes('new york') || loc.includes('usa')) baseCoords = [-74.0060, 40.7128];
  else if (loc.includes('london') || loc.includes('uk')) baseCoords = [-0.1278, 51.5074];
  else if (loc.includes('tokyo') || loc.includes('japan')) baseCoords = [139.6503, 35.6762];
  else if (loc.includes('seoul') || loc.includes('korea')) baseCoords = [126.9780, 37.5665];
  else if (loc.includes('sydney') || loc.includes('australia')) baseCoords = [151.2093, -33.8688];
  else if (loc.includes('cloud') || loc.includes('live')) baseCoords = [13.4050, 52.5200];
  else if (loc.includes('tor') || loc.includes('unknown') || loc.includes('spammer')) baseCoords = [-19.0208, 64.9631];

  let hash = 0;
  for (let i = 0; i < (peerId || '').length; i++) {
    hash = (hash << 5) - hash + peerId.charCodeAt(i);
    hash |= 0;
  }

  if (baseCoords) {
    // Add deterministic micro-jitter so multiple peers in the same region/cloud cluster spread visibly
    const jitterX = ((Math.abs(hash) % 7) - 3) * 0.6;
    const jitterY = ((Math.abs(hash >> 3) % 7) - 3) * 0.6;
    return [baseCoords[0] + jitterX, baseCoords[1] + jitterY];
  }

  // Deterministic fallback based on peerId hash
  const lng = ((Math.abs(hash >> 3) % 320) - 160);
  const lat = ((Math.abs(hash) % 110) - 50);
  return [lng, lat];
};

// Local Validator Coordinates (Hanoi Central Ops: [105.8542, 21.0285])
const LOCAL_COORDS: [number, number] = [105.8542, 21.0285];

export const CyberWorldMap: React.FC<CyberWorldMapProps> = ({
  peers,
  selectedPeer,
  onSelectPeer,
  className = '',
}) => {
  const [hoveredPeer, setHoveredPeer] = useState<PeerNode | null>(null);

  // Set up d3 equirectangular projection fitted to 960x480 canvas
  const { projection, countryPaths, graticulePath, spherePath } = useMemo(() => {
    const proj = geoEquirectangular().fitSize([960, 480], { type: 'Sphere' });
    const pathGen = geoPath().projection(proj);

    // Extract TopoJSON countries
    const countriesGeo: any = feature(worldData as any, (worldData as any).objects.countries);
    const paths = (countriesGeo.features || []).map((f: any, idx: number) => ({
      id: f.id || idx,
      d: pathGen(f) || ''
    }));

    const graticule = geoGraticule10();
    const gratPath = pathGen(graticule) || '';
    const sphPath = pathGen({ type: 'Sphere' } as any) || '';

    return {
      projection: proj,
      countryPaths: paths,
      graticulePath: gratPath,
      spherePath: sphPath
    };
  }, []);

  const localPos = projection(LOCAL_COORDS) || [500, 240];

  return (
    <div className={`relative w-full bg-[#06040A] border border-[#1C142E] overflow-hidden select-none ${className}`}>
      {/* SVG Map Canvas: always fills 100% width of parent container */}
      <svg
        viewBox="0 0 960 480"
        className="w-full h-auto block"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Radial Glow Filters */}
          <radialGradient id="authorityGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00FF9D" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#00FF9D" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00FF9D" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="rpcGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="maliciousGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#EF4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="localGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>

          {/* Sync Arc Gradient */}
          <linearGradient id="syncArc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00FF9D" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* 1. Sphere Outline (Ocean Canvas) */}
        <path d={spherePath} fill="#06040F" stroke="#3B1D6B" strokeWidth="1" />

        {/* 2. Cyber Graticule Gridlines (10-deg intervals) */}
        <path
          d={graticulePath}
          fill="none"
          stroke="#1C1333"
          strokeWidth="0.6"
          strokeDasharray="2 3"
        />

        {/* 3. Authentic World Countries Vector Paths from Natural Earth (Distinct Deep Purple) */}
        <g stroke="#4C2889" strokeWidth="0.75" strokeLinejoin="round">
          {countryPaths.map((cp: { id: string | number; d: string }) => (
            <path
              key={cp.id}
              d={cp.d}
              fill="#1B1033"
              className="transition-colors hover:fill-[#2E1B5B]"
            />
          ))}
        </g>

        {/* 4. P2P Gossip Sync Arcs between Local Node and Peers */}
        <g fill="none">
          {peers.map((p) => {
            const coords = getPeerCoordinates(p.location, p.peer_id);
            const targetPos = projection(coords) || [0, 0];
            const midX = (localPos[0] + targetPos[0]) / 2;
            const midY = Math.min(localPos[1], targetPos[1]) - Math.min(45, Math.abs(localPos[0] - targetPos[0]) * 0.12);

            if (p.is_malicious) {
              return (
                <path
                  key={`arc-${p.peer_id}`}
                  d={`M ${localPos[0]} ${localPos[1]} Q ${midX} ${midY} ${targetPos[0]} ${targetPos[1]}`}
                  stroke="#EF4444"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  strokeOpacity="0.4"
                />
              );
            }

            return (
              <path
                key={`arc-${p.peer_id}`}
                d={`M ${localPos[0]} ${localPos[1]} Q ${midX} ${midY} ${targetPos[0]} ${targetPos[1]}`}
                stroke="url(#syncArc)"
                strokeWidth="1.2"
                strokeOpacity="0.6"
              />
            );
          })}
        </g>

        {/* 5. Local Validator Node Pin */}
        <g transform={`translate(${localPos[0]}, ${localPos[1]})`}>
          <circle r="16" fill="url(#localGlow)" />
          <circle r="4.5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
          {/* Target Reticle */}
          <circle r="8" fill="none" stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="2 2" />
          <text
            x="0"
            y="-10"
            textAnchor="middle"
            fill="#38BDF8"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            LOCAL VALIDATOR
          </text>
        </g>

        {/* 6. Peer Node Blips (Green, Purple, Red) */}
        {peers.map((p) => {
          const coords = getPeerCoordinates(p.location, p.peer_id);
          const pos = projection(coords) || [0, 0];
          const isSelected = selectedPeer?.peer_id === p.peer_id;
          const isAuthority = p.role.includes('Authority');

          let dotColor = '#8B5CF6'; // Purple for Full RPC
          let glowId = 'rpcGlow';
          if (p.is_malicious) {
            dotColor = '#EF4444'; // Red for Malicious
            glowId = 'maliciousGlow';
          } else if (isAuthority) {
            dotColor = '#00FF9D'; // Green for Authority
            glowId = 'authorityGlow';
          }

          return (
            <g
              key={p.peer_id}
              transform={`translate(${pos[0]}, ${pos[1]})`}
              className="cursor-pointer group"
              onClick={() => onSelectPeer(p)}
              onMouseEnter={() => setHoveredPeer(p)}
              onMouseLeave={() => setHoveredPeer(null)}
            >
              {/* Outer Glow Halo */}
              <circle r="18" fill={`url(#${glowId})`} />

              {/* Pulsating Ping Alert for Malicious Node */}
              {p.is_malicious && (
                <circle
                  r="14"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="1.5"
                  className="animate-ping"
                  opacity="0.8"
                />
              )}

              {/* Selection Reticle Ring */}
              {isSelected && (
                <circle
                  r="10"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                  strokeDasharray="2 2"
                />
              )}

              {/* Core Solid Pin Dot */}
              <circle
                r={p.is_malicious ? 5 : isAuthority ? 4.5 : 4}
                fill={dotColor}
                stroke="#0E091B"
                strokeWidth="1.2"
                className="transition-transform group-hover:scale-150"
              />

              {/* City & Latency Label on Canvas */}
              <text
                x="8"
                y="3"
                fill={dotColor}
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
                className="pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
              >
                {p.location.split(',')[0]} ({p.latency_ms}ms)
              </text>
            </g>
          );
        })}
      </svg>

      {/* Bottom Coordinates & Engine HUD */}
      <div className="absolute bottom-1.5 right-2 font-mono text-[9px] text-zinc-500 tracking-wider flex items-center gap-3">
        <span>PROJECTION: EQUIRECTANGULAR (D3-GEO &bull; NATURAL EARTH)</span>
        <span className="text-zinc-600">|</span>
        <span>PEERS: {peers.length}</span>
        <span className="text-zinc-600">|</span>
        <span>LIBP2P :30333</span>
      </div>
    </div>
  );
};
