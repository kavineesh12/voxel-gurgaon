import { METRO_PTS, ROADS } from './world'

/*
 * Directions engine — routes over the real road network at real scale
 * (1 unit ≈ 10 m), with typical-traffic timing for the current IST hour.
 * Live traffic would need a maps API; this uses time-of-day speed factors.
 */

/* ------------------------------------------------------------------ */
/* places gazetteer                                                    */
/* ------------------------------------------------------------------ */

export interface Place {
  name: string
  x: number
  z: number
  aliases?: string[]
}

export const PLACES: Place[] = [
  { name: 'CyberCity', x: 50, z: -170, aliases: ['cyber city', 'dlf cybercity'] },
  { name: 'Cyber Hub', x: 90, z: -205, aliases: ['cyberhub'] },
  { name: 'Udyog Vihar', x: -100, z: -180 },
  { name: 'Ambience Mall', x: 122, z: -268, aliases: ['ambience'] },
  { name: 'Maruti Plant', x: 46, z: -108, aliases: ['maruti', 'maruti udyog'] },
  { name: 'Sikanderpur', x: 100, z: -44, aliases: ['sikanderpur metro'] },
  { name: 'MG Road Malls', x: 55, z: -15, aliases: ['mg road', 'sahara mall', 'mgf'] },
  { name: 'DLF Phase 1', x: 120, z: -10, aliases: ['dlf 1'] },
  { name: 'Galleria Market', x: 140, z: 45, aliases: ['galleria', 'dlf phase 4'] },
  { name: 'Golf Course Road', x: 170, z: 30, aliases: ['gcr'] },
  { name: 'Sector 56', x: 238, z: 93 },
  { name: 'Wazirabad', x: 150, z: 122 },
  { name: 'Sector 44', x: 60, z: 180 },
  { name: 'IFFCO Chowk', x: -93, z: 65, aliases: ['iffco'] },
  { name: 'Signature Towers', x: -109, z: 96 },
  { name: 'Sector 14', x: -45, z: 100 },
  { name: 'Sector 15', x: -55, z: 145 },
  { name: 'Sector 29', x: -118, z: 140, aliases: ['sector 29 market'] },
  { name: 'Kingdom of Dreams', x: -134, z: 172, aliases: ['kod'] },
  { name: 'Jharsa', x: -60, z: 182 },
  { name: 'Sector 31', x: -40, z: 205 },
  { name: 'HUDA City Centre', x: -90, z: 210, aliases: ['huda', 'millennium city centre'] },
  { name: 'Sadar Bazaar', x: -190, z: 160, aliases: ['old gurgaon', 'old town'] },
  { name: 'Railway Station', x: -196, z: 173, aliases: ['gurgaon railway station'] },
  { name: 'Civil Lines', x: -245, z: 100 },
  { name: 'Sector 4', x: -222, z: 66, aliases: ['sector 4/7', 'new colony'] },
  { name: 'Sector 5', x: -252, z: 82 },
  { name: 'Aravalli Park', x: 225, z: -120, aliases: ['aravalli biodiversity park', 'aravalli'] },
]

export function findPlace(query: string): Place | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  let best: Place | null = null
  for (const p of PLACES) {
    const names = [p.name.toLowerCase(), ...(p.aliases ?? [])]
    if (names.some((n) => n === q)) return p
    if (!best && names.some((n) => n.includes(q) || q.includes(n))) best = p
  }
  return best
}

/* ------------------------------------------------------------------ */
/* road graph (built from the NOW-era road network)                    */
/* ------------------------------------------------------------------ */

type RoadClass = 'x' | 'p' | 'd'

interface GNode {
  id: number
  x: number
  z: number
  edges: GEdge[]
}

interface GEdge {
  to: number
  len: number // world units (1 u = 10 m)
  cls: RoadClass
  road: string
}

interface Seg {
  ax: number
  az: number
  bx: number
  bz: number
  cls: RoadClass
  road: string
}

const ERA_NOW = 7

function buildSegments(): Seg[] {
  const segs: Seg[] = []
  for (const r of ROADS) {
    if (!r.width[ERA_NOW]) continue
    const cls = r.style[ERA_NOW] as RoadClass
    for (let i = 0; i < r.pts.length - 1; i++) {
      segs.push({ ax: r.pts[i][0], az: r.pts[i][1], bx: r.pts[i + 1][0], bz: r.pts[i + 1][1], cls, road: r.name })
    }
  }
  return segs
}

/** split segments at mutual intersections, then build the node graph */
function buildGraph(): GNode[] {
  const segs = buildSegments()
  // collect split points per segment (parameter t)
  const cuts: number[][] = segs.map(() => [0, 1])
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const s = segs[i]
      const t = segs[j]
      const d1x = s.bx - s.ax
      const d1z = s.bz - s.az
      const d2x = t.bx - t.ax
      const d2z = t.bz - t.az
      const denom = d1x * d2z - d1z * d2x
      if (Math.abs(denom) < 1e-6) continue
      const u = ((t.ax - s.ax) * d2z - (t.az - s.az) * d2x) / denom
      const v = ((t.ax - s.ax) * d1z - (t.az - s.az) * d1x) / denom
      if (u > -0.001 && u < 1.001 && v > -0.001 && v < 1.001) {
        cuts[i].push(Math.max(0, Math.min(1, u)))
        cuts[j].push(Math.max(0, Math.min(1, v)))
      }
    }
  }
  const nodes: GNode[] = []
  const key2id = new Map<string, number>()
  function nodeAt(x: number, z: number): number {
    const key = `${Math.round(x / 2)}|${Math.round(z / 2)}`
    const hit = key2id.get(key)
    if (hit !== undefined) return hit
    const id = nodes.length
    nodes.push({ id, x, z, edges: [] })
    key2id.set(key, id)
    return id
  }
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]
    const ts = [...new Set(cuts[i])].sort((a, b) => a - b)
    for (let k = 0; k < ts.length - 1; k++) {
      const ax = s.ax + (s.bx - s.ax) * ts[k]
      const az = s.az + (s.bz - s.az) * ts[k]
      const bx = s.ax + (s.bx - s.ax) * ts[k + 1]
      const bz = s.az + (s.bz - s.az) * ts[k + 1]
      const len = Math.hypot(bx - ax, bz - az)
      if (len < 0.5) continue
      const a = nodeAt(ax, az)
      const b = nodeAt(bx, bz)
      if (a === b) continue
      nodes[a].edges.push({ to: b, len, cls: s.cls, road: s.road })
      nodes[b].edges.push({ to: a, len, cls: s.cls, road: s.road })
    }
  }
  return nodes
}

const GRAPH = buildGraph()

function nearestNode(x: number, z: number): { id: number; dist: number } {
  let best = { id: 0, dist: Infinity }
  for (const n of GRAPH) {
    const d = Math.hypot(n.x - x, n.z - z)
    if (d < best.dist) best = { id: n.id, dist: d }
  }
  return best
}

/* ------------------------------------------------------------------ */
/* timing model — typical traffic for the current IST time             */
/* ------------------------------------------------------------------ */

export interface TrafficState {
  label: string
  factor: number // multiplier on road travel time
}

export function trafficNow(): TrafficState {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  })
  const parts = fmt.formatToParts(new Date())
  const get = (t: string): string => parts.find((p) => p.type === t)?.value ?? ''
  const hour = Number(get('hour'))
  const weekday = get('weekday')
  const weekend = weekday === 'Sat' || weekday === 'Sun'
  let factor: number
  let desc: string
  if (hour >= 7 && hour < 11) {
    factor = weekend ? 1.15 : 1.75
    desc = weekend ? 'light morning' : 'morning rush'
  } else if (hour >= 16 && hour < 21) {
    factor = weekend ? 1.35 : 1.85
    desc = weekend ? 'weekend evening' : 'evening rush'
  } else if (hour >= 11 && hour < 16) {
    factor = 1.25
    desc = 'midday'
  } else if (hour >= 21 && hour < 24) {
    factor = 1.0
    desc = 'late evening'
  } else {
    factor = 0.75
    desc = 'night, roads clear'
  }
  return {
    label: `typical ${desc} traffic · ${weekday} ${get('hour')}:${get('minute')} IST`,
    factor,
  }
}

// free-flow speeds in km/h by mode and road class
const SPEED: Record<'car' | 'auto', Record<RoadClass, number>> = {
  car: { x: 55, p: 32, d: 14 },
  auto: { x: 28, p: 20, d: 12 },
}
const WALK_KMH = 4.5
const METRO_KMH = 34

const U2KM = 0.01 // 1 unit = 10 m

function edgeMinutes(e: GEdge, mode: 'car' | 'auto', factor: number): number {
  const km = e.len * U2KM
  return (km / SPEED[mode][e.cls]) * 60 * factor
}

/* ------------------------------------------------------------------ */
/* routing                                                             */
/* ------------------------------------------------------------------ */

export interface RouteResult {
  mode: 'car' | 'auto' | 'metro'
  title: string
  minutes: number
  km: number
  via: string
  /** polyline in world coords, [x, y, z] */
  path: [number, number, number][]
  note?: string
}

function dijkstra(
  from: number,
  to: number,
  mode: 'car' | 'auto',
  factor: number,
  penalty?: Map<string, number>,
): { nodes: number[]; minutes: number; km: number } | null {
  const dist = new Array<number>(GRAPH.length).fill(Infinity)
  const prev = new Array<number>(GRAPH.length).fill(-1)
  const done = new Array<boolean>(GRAPH.length).fill(false)
  dist[from] = 0
  for (;;) {
    let cur = -1
    let best = Infinity
    for (let i = 0; i < GRAPH.length; i++) {
      if (!done[i] && dist[i] < best) {
        best = dist[i]
        cur = i
      }
    }
    if (cur === -1) break
    if (cur === to) break
    done[cur] = true
    for (const e of GRAPH[cur].edges) {
      let w = edgeMinutes(e, mode, factor)
      const pKey = `${Math.min(cur, e.to)}|${Math.max(cur, e.to)}`
      if (penalty?.has(pKey)) w *= penalty.get(pKey)!
      if (dist[cur] + w < dist[e.to]) {
        dist[e.to] = dist[cur] + w
        prev[e.to] = cur
      }
    }
  }
  if (!isFinite(dist[to])) return null
  const nodes: number[] = [to]
  while (nodes[0] !== from) {
    const p = prev[nodes[0]]
    if (p === -1) return null
    nodes.unshift(p)
  }
  let km = 0
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = GRAPH[nodes[i]]
    const b = GRAPH[nodes[i + 1]]
    km += Math.hypot(a.x - b.x, a.z - b.z) * U2KM
  }
  return { nodes, minutes: dist[to], km }
}

function viaLabel(nodes: number[]): string {
  const byRoad = new Map<string, number>()
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = GRAPH[nodes[i]]
    const e = a.edges.find((k) => k.to === nodes[i + 1])
    if (e) byRoad.set(e.road, (byRoad.get(e.road) ?? 0) + e.len)
  }
  const sorted = [...byRoad.entries()].sort((a, b) => b[1] - a[1])
  return sorted
    .slice(0, 2)
    .map(([r]) => r.split(' · ')[0].split(' (')[0])
    .join(' & ')
}

function nodesToPath(nodes: number[], startP: Place, endP: Place): [number, number, number][] {
  const path: [number, number, number][] = [[startP.x, 1.6, startP.z]]
  for (const id of nodes) path.push([GRAPH[id].x, 1.6, GRAPH[id].z])
  path.push([endP.x, 1.6, endP.z])
  return path
}

/* ---------- metro ---------- */

interface Station {
  name: string
  x: number
  z: number
  arc: number
}

function metroStations(): Station[] {
  // stations projected onto the yellow line polyline
  const raw: [string, number, number][] = [
    ['Guru Dronacharya', 190, -117],
    ['Sikanderpur', 103, -36],
    ['MG Road', -3, 14],
    ['IFFCO Chowk', -93, 65],
    ['HUDA City Centre', -90, 210],
  ]
  const cum: number[] = [0]
  for (let i = 1; i < METRO_PTS.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(METRO_PTS[i][0] - METRO_PTS[i - 1][0], METRO_PTS[i][1] - METRO_PTS[i - 1][1]))
  }
  return raw.map(([name, x, z]) => {
    let bestArc = 0
    let bestD = Infinity
    for (let i = 0; i < METRO_PTS.length - 1; i++) {
      const [ax, az] = METRO_PTS[i]
      const [bx, bz] = METRO_PTS[i + 1]
      const dx = bx - ax
      const dz = bz - az
      const len = Math.hypot(dx, dz)
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (len * len)))
      const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t))
      if (d < bestD) {
        bestD = d
        bestArc = cum[i] + t * len
      }
    }
    return { name, x, z, arc: bestArc }
  })
}

const STATIONS = metroStations()

function metroPathBetween(a: Station, b: Station): [number, number, number][] {
  const lo = Math.min(a.arc, b.arc)
  const hi = Math.max(a.arc, b.arc)
  const pts: [number, number, number][] = []
  let acc = 0
  for (let i = 0; i < METRO_PTS.length - 1; i++) {
    const [ax, az] = METRO_PTS[i]
    const [bx, bz] = METRO_PTS[i + 1]
    const len = Math.hypot(bx - ax, bz - az)
    const segLo = Math.max(lo, acc)
    const segHi = Math.min(hi, acc + len)
    if (segLo < segHi) {
      const t0 = (segLo - acc) / len
      const t1 = (segHi - acc) / len
      if (pts.length === 0) pts.push([ax + (bx - ax) * t0, 10.5, az + (bz - az) * t0])
      pts.push([ax + (bx - ax) * t1, 10.5, az + (bz - az) * t1])
    }
    acc += len
  }
  if (a.arc > b.arc) pts.reverse()
  return pts
}

/* ---------- public API ---------- */

export function computeRoutes(from: Place, to: Place): { traffic: TrafficState; routes: RouteResult[] } {
  const traffic = trafficNow()
  const routes: RouteResult[] = []
  const nf = nearestNode(from.x, from.z)
  const nt = nearestNode(to.x, to.z)
  const walkFromMin = (nf.dist * U2KM) / WALK_KMH * 60
  const walkToMin = (nt.dist * U2KM) / WALK_KMH * 60

  // fastest drive
  const drive = dijkstra(nf.id, nt.id, 'car', traffic.factor)
  if (drive) {
    routes.push({
      mode: 'car',
      title: 'Drive — fastest',
      minutes: drive.minutes + walkFromMin + walkToMin,
      km: drive.km + (nf.dist + nt.dist) * U2KM,
      via: `via ${viaLabel(drive.nodes)}`,
      path: nodesToPath(drive.nodes, from, to),
    })
    // alternate drive: penalize the fastest route's edges
    const penalty = new Map<string, number>()
    for (let i = 0; i < drive.nodes.length - 1; i++) {
      const a = drive.nodes[i]
      const b = drive.nodes[i + 1]
      penalty.set(`${Math.min(a, b)}|${Math.max(a, b)}`, 2.6)
    }
    const alt = dijkstra(nf.id, nt.id, 'car', traffic.factor, penalty)
    if (alt) {
      const shared = alt.nodes.filter((n) => drive.nodes.includes(n)).length / alt.nodes.length
      if (shared < 0.75 && alt.minutes < drive.minutes * 2.2) {
        routes.push({
          mode: 'car',
          title: 'Drive — alternate',
          minutes: alt.minutes + walkFromMin + walkToMin,
          km: alt.km + (nf.dist + nt.dist) * U2KM,
          via: `via ${viaLabel(alt.nodes)}`,
          path: nodesToPath(alt.nodes, from, to),
        })
      }
    }
    // auto-rickshaw on the fastest alignment
    const autoR = dijkstra(nf.id, nt.id, 'auto', traffic.factor)
    if (autoR) {
      routes.push({
        mode: 'auto',
        title: 'Auto-rickshaw',
        minutes: autoR.minutes + walkFromMin + walkToMin,
        km: autoR.km + (nf.dist + nt.dist) * U2KM,
        via: `via ${viaLabel(autoR.nodes)}`,
        path: nodesToPath(autoR.nodes, from, to),
        note: `≈ ₹${Math.max(30, Math.round(autoR.km * 15 + 25))}`,
      })
    }
  }

  // metro option
  let sa: Station | null = null
  let sb: Station | null = null
  let da = Infinity
  let db = Infinity
  for (const s of STATIONS) {
    const d1 = Math.hypot(s.x - from.x, s.z - from.z)
    const d2 = Math.hypot(s.x - to.x, s.z - to.z)
    if (d1 < da) {
      da = d1
      sa = s
    }
    if (d2 < db) {
      db = d2
      sb = s
    }
  }
  if (sa && sb && sa !== sb && da < 160 && db < 160) {
    const rideKm = Math.abs(sa.arc - sb.arc) * U2KM
    const stops = Math.abs(STATIONS.indexOf(sa) - STATIONS.indexOf(sb))
    const rideMin = (rideKm / METRO_KMH) * 60 + stops * 0.8 + 4 // dwell + average wait
    const walkA = ((da * U2KM) / WALK_KMH) * 60
    const walkB = ((db * U2KM) / WALK_KMH) * 60
    const path: [number, number, number][] = [
      [from.x, 1.6, from.z],
      [sa.x, 1.6, sa.z],
      ...metroPathBetween(sa, sb),
      [sb.x, 1.6, sb.z],
      [to.x, 1.6, to.z],
    ]
    routes.push({
      mode: 'metro',
      title: 'Yellow Line Metro',
      minutes: rideMin + walkA + walkB,
      km: rideKm + (da + db) * U2KM,
      via: `${sa.name} → ${sb.name} (${stops} stop${stops > 1 ? 's' : ''})`,
      path,
      note: 'immune to traffic',
    })
  }

  routes.sort((a, b) => a.minutes - b.minutes)
  return { traffic, routes }
}
