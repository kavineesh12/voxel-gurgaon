import * as THREE from 'three'

/*
 * Voxel Gurgaon through time — 1920 to today in 20-year steps.
 * Coordinates: x → east, z → south, 1 unit ≈ 10 m, plate spans ±300.
 * Real geography: the old railway town in the south-west, the Delhi–Jaipur
 * road (NH-8/48) cutting diagonally, MG Road and DLF/CyberCity in the
 * north-east, the Aravalli ridge along the east.
 */

export const ERAS = [1920, 1940, 1960, 1980, 2000, 2025] as const
export type EraIndex = 0 | 1 | 2 | 3 | 4 | 5

export const ERA_CAPTIONS: string[] = [
  'A dusty tehsil town of British Punjab. Gurgaon is a huddle of mud-brick homes around Sadar Bazaar and the railway station, ringed by wheat fields and Aravalli scrub. Population ≈ 5,000.',
  'Civil-lines bungalows and a busier bazaar. Lorries now share the dirt Delhi–Jaipur road with tongas and bullock carts; the district town administers a farming countryside.',
  "Independent India's district headquarters. Grain markets hum, a water tower rises, villages like Jharsa and Sikanderpur grow — but Gurgaon is still farmland to the horizon.",
  "The turning point. HUDA (1977) starts carving sectors from the fields and Maruti's car plant (1983) rises off the Delhi road, which is finally paved. The first planned colonies appear.",
  "DLF City rises on village land — gated phases, Udyog Vihar's factory sheds, Signature Towers at IFFCO Chowk, and the first malls on MG Road. The 'Millennium City' takes shape.",
  "CyberCity's glass skyline, the Yellow Line and Rapid Metro, Cyber Hub, Kingdom of Dreams and the Golf Course Road towers — some 2.5 million people live where the fields were.",
]

/* ------------------------------------------------------------------ */
/* shared road & rail geometry (painted onto the ground + used by movers) */
/* ------------------------------------------------------------------ */

export interface Road {
  pts: [number, number][]
  /** width (world units) per era index; 0 = not built yet */
  width: number[]
  /** style per era: d=dirt p=paved x=expressway */
  style: ('d' | 'p' | 'x' | '-')[]
}

export const ROADS: Road[] = [
  {
    // Delhi–Jaipur road → NH-8 → NH-48
    pts: [
      [146, -294],
      [3, -174],
      [-93, 65],
      [-240, 146],
      [-300, 180],
    ],
    width: [8, 8, 9, 14, 20, 22],
    style: ['d', 'd', 'd', 'p', 'x', 'x'],
  },
  {
    // Old Railway Road: station/old town → Delhi road
    pts: [
      [-190, 160],
      [-93, 65],
    ],
    width: [5, 5, 6, 10, 12, 12],
    style: ['d', 'd', 'd', 'p', 'p', 'p'],
  },
  {
    // Sadar Bazaar cross streets
    pts: [
      [-222, 132],
      [-158, 188],
    ],
    width: [4, 4, 5, 7, 8, 8],
    style: ['d', 'd', 'd', 'p', 'p', 'p'],
  },
  {
    pts: [
      [-222, 188],
      [-158, 132],
    ],
    width: [4, 4, 5, 7, 8, 8],
    style: ['d', 'd', 'd', 'p', 'p', 'p'],
  },
  {
    // MG Road (Mehrauli–Gurgaon)
    pts: [
      [-93, 65],
      [103, -36],
      [190, -117],
      [235, -160],
    ],
    width: [0, 0, 5, 10, 14, 15],
    style: ['-', '-', 'd', 'p', 'p', 'p'],
  },
  {
    // Golf Course Road
    pts: [
      [103, -36],
      [170, 30],
      [240, 95],
    ],
    width: [0, 0, 0, 0, 12, 14],
    style: ['-', '-', '-', '-', 'p', 'p'],
  },
  {
    // HUDA corridor (Jharsa road, south from IFFCO)
    pts: [
      [-93, 65],
      [-90, 210],
      [-88, 290],
    ],
    width: [0, 0, 4, 10, 12, 12],
    style: ['-', '-', 'd', 'p', 'p', 'p'],
  },
  {
    // sector grid east (1980+)
    pts: [
      [100, -140],
      [100, 130],
    ],
    width: [0, 0, 0, 8, 10, 10],
    style: ['-', '-', '-', 'p', 'p', 'p'],
  },
  {
    pts: [
      [-20, -30],
      [-16, 230],
    ],
    width: [0, 0, 0, 8, 10, 10],
    style: ['-', '-', '-', 'p', 'p', 'p'],
  },
  {
    pts: [
      [-20, 120],
      [100, 124],
    ],
    width: [0, 0, 0, 0, 9, 9],
    style: ['-', '-', '-', '-', 'p', 'p'],
  },
  {
    // CyberCity loop road (2000+)
    pts: [
      [3, -174],
      [30, -205],
      [80, -195],
      [90, -150],
      [40, -132],
      [3, -174],
    ],
    width: [0, 0, 0, 0, 8, 10],
    style: ['-', '-', '-', '-', 'p', 'p'],
  },
]

/** railway: Delhi–Rewari line through Gurgaon station (all eras) */
export const RAILWAY: [number, number][] = [
  [-300, 40],
  [-215, 130],
  [-185, 200],
  [-160, 300],
]

/* ------------------------------------------------------------------ */
/* pixel textures (NearestFilter = voxel look)                         */
/* ------------------------------------------------------------------ */

type TexKind = 'glass' | 'concrete' | 'brick' | 'mud' | 'shop' | 'shed'

interface FacadeTex {
  map: THREE.CanvasTexture
  emissiveMap: THREE.CanvasTexture
}

const texCache = new Map<string, FacadeTex>()

function facadeTexture(kind: TexKind, base: string, floors: number): FacadeTex {
  const key = `${kind}|${base}|${floors}`
  const hit = texCache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = 32
  c.height = 32
  const ctx = c.getContext('2d')!
  const e = document.createElement('canvas')
  e.width = 32
  e.height = 32
  const ectx = e.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 32, 32)
  ectx.fillStyle = '#000'
  ectx.fillRect(0, 0, 32, 32)
  const rows = Math.max(1, Math.min(8, floors))
  const rh = 32 / rows
  for (let r = 0; r < rows; r++) {
    const y = Math.round(r * rh + rh * 0.25)
    const h = Math.max(2, Math.round(rh * 0.45))
    if (kind === 'glass') {
      for (let x = 1; x < 31; x += 4) {
        ctx.fillStyle = (x / 4 + r) % 2 ? '#9fc9e8' : '#7fb2d8'
        ctx.fillRect(x, y, 3, h)
        if (Math.random() < 0.5) {
          ectx.fillStyle = '#ffe9a8'
          ectx.fillRect(x, y, 3, h)
        }
      }
    } else if (kind === 'mud') {
      // one small dark window + door row at base
      ctx.fillStyle = '#4a3826'
      ctx.fillRect(6, y, 4, h)
      ctx.fillRect(22, y, 4, h)
    } else if (kind === 'shed') {
      // corrugated verticals
      for (let x = 0; x < 32; x += 3) {
        ctx.fillStyle = x % 6 ? base : 'rgba(0,0,0,0.15)'
        ctx.fillRect(x, 0, 2, 32)
      }
      ctx.fillStyle = '#3a4750'
      ctx.fillRect(4, 22, 8, 10)
      break
    } else {
      for (let x = 2; x < 30; x += 5) {
        ctx.fillStyle = kind === 'shop' && r === rows - 1 ? '#ffd27f' : '#bcd6e8'
        ctx.fillRect(x, y, 3, h)
        if (Math.random() < 0.45) {
          ectx.fillStyle = '#ffdf8f'
          ectx.fillRect(x, y, 3, h)
        }
      }
    }
  }
  if (kind === 'brick') {
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    for (let y = 0; y < 32; y += 4) ctx.fillRect(0, y, 32, 1)
  }
  const mk = (cv: HTMLCanvasElement): THREE.CanvasTexture => {
    const t = new THREE.CanvasTexture(cv)
    t.magFilter = THREE.NearestFilter
    t.minFilter = THREE.NearestFilter
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  const out = { map: mk(c), emissiveMap: mk(e) }
  texCache.set(key, out)
  return out
}

/* ------------------------------------------------------------------ */
/* ground painter — fields, roads and urban fabric per era             */
/* ------------------------------------------------------------------ */

const GROUND_PX = 1024
const WORLD = 600 // plate spans ±300

function wx(x: number): number {
  return ((x + 300) / WORLD) * GROUND_PX
}
function wz(z: number): number {
  return ((z + 300) / WORLD) * GROUND_PX
}
function ww(u: number): number {
  return (u / WORLD) * GROUND_PX
}

/** deterministic pseudo-random so the fields don't reshuffle every era click */
function mulberry(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function paintGround(ctx: CanvasRenderingContext2D, era: EraIndex): void {
  // base earth
  ctx.fillStyle = era < 3 ? '#b5a074' : era === 3 ? '#b0a47e' : '#a8a294'
  ctx.fillRect(0, 0, GROUND_PX, GROUND_PX)

  // farmland patchwork — recedes with each era
  const rnd = mulberry(1947)
  const fieldGreens = ['#7f9f4f', '#93ac53', '#a9b163', '#87a24a', '#b8ab60', '#6f934a']
  for (let i = 0; i < 480; i++) {
    const fx = rnd() * 600 - 300
    const fz = rnd() * 600 - 300
    const fw = 14 + rnd() * 26
    const fh = 12 + rnd() * 22
    const g = fieldGreens[Math.floor(rnd() * fieldGreens.length)]
    // urbanisation frontier: fields survive only outside the developed zones
    const devel =
      era >= 5
        ? true
        : era === 4
          ? fx > -160 && fz < 180 && fx < 260
          : era === 3
            ? fx > -60 && fz < 60 && fx < 200 && fz > -220
            : false
    const nearTown = fx > -245 && fx < -135 && fz > 105 && fz < 215
    const inAravalli = fx > 180 && fz < -20
    if (inAravalli || nearTown) continue
    if (devel && rnd() < (era === 5 ? 0.97 : era === 4 ? 0.85 : 0.6)) continue
    ctx.fillStyle = g
    ctx.fillRect(wx(fx), wz(fz), ww(fw), ww(fh))
    ctx.strokeStyle = 'rgba(90,70,40,0.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(wx(fx), wz(fz), ww(fw), ww(fh))
  }

  // urban fabric blocks (plot grids) in developed zones
  const zonesPerEra: [number, number, number, number, number][][] = [
    [],
    [],
    [[-30, -80, 130, 40, 0.16]],
    [
      [-60, -100, 200, 120, 0.4],
      [-40, 120, 140, 160, 0.35],
    ],
    [
      [-120, -240, 380, 400, 0.62],
      [-260, 60, 200, 220, 0.4],
    ],
    [
      [-300, -300, 600, 600, 0.8],
    ],
  ]
  const rnd2 = mulberry(1981)
  for (const [zx, zz, zw, zh, density] of zonesPerEra[era]) {
    for (let i = 0; i < (zw * zh) / 260; i++) {
      const fx = zx + rnd2() * zw
      const fz = zz + rnd2() * zh
      if (fx > 180 && fz < -20) continue // Aravalli
      if (rnd2() > density) continue
      ctx.fillStyle = rnd2() < 0.5 ? '#b8b2a4' : '#c4bca8'
      ctx.fillRect(wx(fx), wz(fz), ww(9 + rnd2() * 14), ww(8 + rnd2() * 12))
    }
  }

  // Aravalli scrub belt (east)
  ctx.fillStyle = '#8a8a5e'
  ctx.beginPath()
  ctx.moveTo(wx(180), wz(-300))
  ctx.lineTo(wx(300), wz(-300))
  ctx.lineTo(wx(300), wz(30))
  ctx.lineTo(wx(215), wz(-40))
  ctx.closePath()
  ctx.fill()

  // parks in the modern eras
  if (era >= 4) {
    ctx.fillStyle = '#6da24f'
    ctx.fillRect(wx(118), wz(45), ww(66), ww(52)) // golf course
    ctx.fillRect(wx(-120), wz(92), ww(34), ww(40)) // leisure valley
  }

  // roads
  for (const road of ROADS) {
    const w = road.width[era]
    if (!w) continue
    const style = road.style[era]
    ctx.strokeStyle = style === 'd' ? '#9c7c4e' : style === 'p' ? '#5b5b60' : '#47474f'
    ctx.lineWidth = ww(w)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    road.pts.forEach(([x, z], i) => {
      if (i === 0) ctx.moveTo(wx(x), wz(z))
      else ctx.lineTo(wx(x), wz(z))
    })
    ctx.stroke()
    // center line on paved roads
    if (style !== 'd') {
      ctx.strokeStyle = style === 'x' ? '#d8c14a' : 'rgba(240,240,220,0.7)'
      ctx.lineWidth = Math.max(1.5, ww(0.6))
      ctx.setLineDash([ww(4), ww(4)])
      ctx.beginPath()
      road.pts.forEach(([x, z], i) => {
        if (i === 0) ctx.moveTo(wx(x), wz(z))
        else ctx.lineTo(wx(x), wz(z))
      })
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // railway
  ctx.strokeStyle = '#6e6152'
  ctx.lineWidth = ww(3.2)
  ctx.beginPath()
  RAILWAY.forEach(([x, z], i) => {
    if (i === 0) ctx.moveTo(wx(x), wz(z))
    else ctx.lineTo(wx(x), wz(z))
  })
  ctx.stroke()
  ctx.strokeStyle = '#3d372e'
  ctx.lineWidth = Math.max(1.5, ww(0.5))
  ctx.setLineDash([ww(1.2), ww(1.6)])
  ctx.beginPath()
  RAILWAY.forEach(([x, z], i) => {
    if (i === 0) ctx.moveTo(wx(x), wz(z))
    else ctx.lineTo(wx(x), wz(z))
  })
  ctx.stroke()
  ctx.setLineDash([])
}

/* ------------------------------------------------------------------ */
/* world builder                                                       */
/* ------------------------------------------------------------------ */

interface EraObject {
  obj: THREE.Object3D
  from: number // first era index present
  to: number // last era index present
  anim: number // current 0..1 grown state
}

export interface World {
  setEra: (era: EraIndex, instant?: boolean) => void
  setNight: (t: number) => void
  update: (dt: number) => void
  era: () => EraIndex
}

export function buildWorld(scene: THREE.Scene): World {
  const eraObjects: EraObject[] = []
  const nightMats: { mat: THREE.MeshStandardMaterial; night: number }[] = []
  let currentEra: EraIndex = 5

  function mat(color: number, rough = 0.85): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.02 })
  }

  function track(obj: THREE.Object3D, from: number, to: number): void {
    obj.visible = false
    eraObjects.push({ obj, from, to, anim: 0 })
    scene.add(obj)
  }

  /* ---------- ground ---------- */
  const groundCanvas = document.createElement('canvas')
  groundCanvas.width = groundCanvas.height = GROUND_PX
  const groundCtx = groundCanvas.getContext('2d')!
  const groundTex = new THREE.CanvasTexture(groundCanvas)
  groundTex.magFilter = THREE.NearestFilter
  groundTex.minFilter = THREE.LinearFilter
  groundTex.colorSpace = THREE.SRGBColorSpace
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(WORLD, 4, WORLD),
    new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.9 }),
  )
  ground.position.y = -2
  ground.receiveShadow = true
  scene.add(ground)

  /* ---------- voxel building helper ---------- */
  function bld(
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    kind: TexKind,
    base: string,
    roof: number,
    from: number,
    to = 5,
    rotY = 0,
  ): THREE.Group {
    const g = new THREE.Group()
    const floors = Math.max(1, Math.round(h / 3.2))
    const t = facadeTexture(kind, base, floors)
    const side = new THREE.MeshStandardMaterial({
      map: t.map,
      emissive: 0xffffff,
      emissiveMap: t.emissiveMap,
      emissiveIntensity: 0,
      roughness: kind === 'glass' ? 0.3 : 0.85,
      metalness: kind === 'glass' ? 0.2 : 0.02,
    })
    nightMats.push({ mat: side, night: 0.85 })
    const top = mat(roof)
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, top, side, side])
    box.position.y = h / 2
    box.castShadow = true
    box.receiveShadow = true
    g.add(box)
    g.position.set(x, 0, z)
    g.rotation.y = rotY
    track(g, from, to)
    return g
  }

  /** stepped voxel tower (setbacks) */
  function tower(
    x: number,
    z: number,
    w: number,
    h: number,
    kind: TexKind,
    base: string,
    roof: number,
    from: number,
    to = 5,
  ): void {
    const g = bld(x, z, w, h * 0.62, w, kind, base, roof, from, to)
    const floors = Math.max(1, Math.round(h / 3.2))
    const t = facadeTexture(kind, base, floors)
    const side = new THREE.MeshStandardMaterial({
      map: t.map,
      emissive: 0xffffff,
      emissiveMap: t.emissiveMap,
      emissiveIntensity: 0,
      roughness: kind === 'glass' ? 0.3 : 0.85,
    })
    nightMats.push({ mat: side, night: 0.85 })
    const upper = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.7, h * 0.38, w * 0.7),
      [side, side, mat(roof), mat(roof), side, side],
    )
    upper.position.y = h * 0.62 + h * 0.19
    upper.castShadow = true
    g.add(upper)
  }

  /* ---------- OLD GURGAON (south-west) ---------- */
  {
    const rnd = mulberry(1920)
    // Sadar Bazaar mud/brick town — grows each era
    const townSpots: [number, number, number][] = [] // x,z,firstEra
    for (let i = 0; i < 46; i++) townSpots.push([-215 + rnd() * 66, 128 + rnd() * 60, 0])
    for (let i = 0; i < 18; i++) townSpots.push([-235 + rnd() * 100, 116 + rnd() * 86, 1])
    for (let i = 0; i < 20; i++) townSpots.push([-245 + rnd() * 116, 108 + rnd() * 100, 2])
    for (const [hx, hz, from] of townSpots) {
      const w = 4 + rnd() * 3
      const h = 3 + rnd() * (from === 0 ? 2 : 4)
      const kinds: TexKind[] = ['mud', 'mud', 'brick']
      const kind = kinds[Math.floor(rnd() * (from === 0 ? 2 : 3))]
      const base = kind === 'mud' ? '#b08d5f' : '#a3563a'
      bld(hx, hz, w, h, w * (0.8 + rnd() * 0.5), kind, base, kind === 'mud' ? 0x8a6c48 : 0x7c4030, from, 5, rnd() * 0.8 - 0.4)
    }
    // upgrade: by 2000 the old town gets concrete mid-rises sprinkled in
    for (let i = 0; i < 14; i++) {
      bld(-238 + rnd() * 104, 112 + rnd() * 92, 6, 8 + rnd() * 8, 6, 'concrete', '#c9c2b2', 0x9a938a, 4)
    }
    // railway station (red brick, all eras; bigger from 1960)
    bld(-196, 173, 16, 6, 7, 'brick', '#933f2c', 0x6e2f22, 0)
    bld(-206, 173, 5, 9, 6, 'brick', '#933f2c', 0x6e2f22, 2)
    // platform
    const plat = new THREE.Mesh(new THREE.BoxGeometry(26, 1.2, 4), mat(0xb8ad98))
    plat.position.set(-196, 0.6, 166.5)
    track(plat, 0, 5)
    // mosque + temple + church in the old town
    {
      const mosque = new THREE.Group()
      const hall = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 6), mat(0xe8e0cc))
      hall.position.y = 2.5
      mosque.add(hall)
      const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 8), mat(0xd8f0e8, 0.4))
      dome.position.y = 6.2
      mosque.add(dome)
      const minar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 10, 1.4), mat(0xe8e0cc))
      minar.position.set(5.4, 5, 0)
      mosque.add(minar)
      mosque.position.set(-172, 150, 0)
      mosque.position.set(-172, 0, 150)
      track(mosque, 0, 5)

      const temple = new THREE.Group()
      const cell = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 5), mat(0xd8c294))
      cell.position.y = 2
      temple.add(cell)
      const shikhara = new THREE.Mesh(new THREE.ConeGeometry(2.6, 6, 4), mat(0xc9a45c))
      shikhara.position.y = 7
      shikhara.rotation.y = Math.PI / 4
      temple.add(shikhara)
      temple.position.set(-208, 0, 141)
      track(temple, 0, 5)

      const church = new THREE.Group()
      const nave = new THREE.Mesh(new THREE.BoxGeometry(5, 4.5, 9), mat(0xd9d2c0))
      nave.position.y = 2.25
      church.add(nave)
      const steeple = new THREE.Mesh(new THREE.BoxGeometry(2.2, 8, 2.2), mat(0xd9d2c0))
      steeple.position.set(0, 4, 5)
      church.add(steeple)
      const spire = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3, 4), mat(0x777777))
      spire.position.set(0, 9.5, 5)
      church.add(spire)
      church.position.set(-231, 0, 178)
      track(church, 0, 5)
    }
    // civil lines bungalows (1940+)
    for (let i = 0; i < 6; i++) {
      bld(-252 + i * 9, 96 - (i % 2) * 6, 6, 3.5, 5, 'brick', '#e0d6bc', 0xa04c34, 1)
    }
    // water tower (1960+)
    {
      const wt = new THREE.Group()
      const legs = new THREE.Mesh(new THREE.BoxGeometry(2.2, 10, 2.2), mat(0x9aa0a8))
      legs.position.y = 5
      wt.add(legs)
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 3.6, 10), mat(0xc7cdd4))
      tank.position.y = 11.5
      wt.add(tank)
      wt.position.set(-152, 0, 120)
      track(wt, 2, 5)
    }
    // grain market sheds (1960+)
    for (let i = 0; i < 3; i++) {
      bld(-148 + i * 10, 168, 8, 4.5, 12, 'shed', '#b8bcc2', 0x8e959c, 2)
    }
  }

  /* ---------- villages (pre-urban, absorbed later) ---------- */
  {
    const rnd = mulberry(7)
    const villages: [number, number, string, number][] = [
      // x, z, name, last era standing as a village cluster
      [-60, 182, 'Jharsa', 5],
      [100, -44, 'Sikanderpur', 3],
      [58, -182, 'Nathupur', 3],
      [28, 62, 'Chakkarpur', 3],
      [150, 122, 'Wazirabad', 4],
      [-30, -120, 'Dundahera', 3],
    ]
    for (const [vx, vz, , lastEra] of villages) {
      const n = 7 + Math.floor(rnd() * 4)
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2
        const r = 4 + rnd() * 10
        bld(
          vx + Math.cos(a) * r,
          vz + Math.sin(a) * r,
          3.2 + rnd() * 2,
          2.6 + rnd() * 1.6,
          3.2 + rnd() * 2,
          'mud',
          '#b08d5f',
          0x8a6c48,
          0,
          lastEra,
          rnd() * 1.2,
        )
      }
      // village well
      const well = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.2, 8), mat(0x8f8577))
      well.position.set(vx + 14, 0.6, vz + 2)
      track(well, 0, lastEra)
    }
  }

  /* ---------- Aravalli ridge (all eras) ---------- */
  {
    const rnd = mulberry(3)
    for (let i = 0; i < 16; i++) {
      const hx = 205 + rnd() * 85
      const hz = -280 + rnd() * 250
      if (hz > -30 && hx < 240) continue
      const hillH = 8 + rnd() * 18
      const hill = new THREE.Mesh(new THREE.ConeGeometry(10 + rnd() * 14, hillH, 5), mat(0x8a7a58))
      hill.position.set(hx, hillH / 2 - 1, hz)
      hill.rotation.y = rnd() * Math.PI
      hill.castShadow = true
      scene.add(hill) // permanent
    }
  }

  /* ---------- trees (instanced, era-band via three meshes) ---------- */
  {
    const rnd = mulberry(11)
    const trunkGeo = new THREE.BoxGeometry(0.7, 2.4, 0.7)
    const crownGeo = new THREE.BoxGeometry(3, 2.6, 3)
    const trunkMat = mat(0x6b4a2c)
    const crownMat = mat(0x4d7a35)
    function treeBand(count: number, from: number, to: number, area: () => [number, number]): void {
      const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count)
      const crowns = new THREE.InstancedMesh(crownGeo, crownMat, count)
      const m = new THREE.Matrix4()
      for (let i = 0; i < count; i++) {
        const [tx, tz] = area()
        const s = 0.7 + rnd() * 0.9
        m.makeScale(s, s, s)
        m.setPosition(tx, 1.2 * s, tz)
        trunks.setMatrixAt(i, m)
        m.setPosition(tx, (2.4 + 1.3) * s, tz)
        crowns.setMatrixAt(i, m)
      }
      trunks.castShadow = crowns.castShadow = true
      track(trunks, from, to)
      track(crowns, from, to)
    }
    // countryside trees, thinning as the city grows
    treeBand(150, 0, 3, () => [rnd() * 460 - 280, rnd() * 500 - 250])
    treeBand(60, 4, 5, () => {
      // survivors cluster in parks/aravalli
      const inParks = rnd() < 0.5
      return inParks ? [120 + rnd() * 60, 45 + rnd() * 50] : [200 + rnd() * 90, -260 + rnd() * 230]
    })
  }

  /* ---------- 1980: Maruti plant + first sectors ---------- */
  {
    for (let i = 0; i < 3; i++) {
      bld(46 + i * 15, -108, 13, 7, 26, 'shed', '#c8ccd2', 0x9aa2ab, 3)
    }
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 18, 8), mat(0xb04a38))
    stack.position.set(24, 9, -96)
    track(stack, 3, 5)
    // HUDA sector housing rows (south + center)
    const rnd = mulberry(1977)
    for (let i = 0; i < 40; i++) {
      const sx = -50 + rnd() * 120
      const sz = 130 + rnd() * 100
      bld(sx, sz, 5, 4 + rnd() * 3, 5, 'concrete', '#d8cfba', 0xa89a80, 3)
    }
    for (let i = 0; i < 24; i++) {
      bld(-10 + rnd() * 100, -20 + rnd() * 90, 5, 4 + rnd() * 4, 5, 'concrete', '#cfc6b4', 0xa89a80, 3)
    }
  }

  /* ---------- 2000: DLF City, Udyog Vihar, first CyberCity, malls ---------- */
  {
    const rnd = mulberry(2000)
    // DLF phases NE
    for (let i = 0; i < 46; i++) {
      bld(20 + rnd() * 150, -60 + rnd() * 150, 5.5, 5 + rnd() * 5, 5.5, 'concrete', '#e0d8c4', 0xb2a488, 4)
    }
    // Udyog Vihar factory sheds along the highway (north-west of NH)
    for (let i = 0; i < 10; i++) {
      bld(-140 + rnd() * 90, -220 + rnd() * 80, 10, 6 + rnd() * 3, 8, 'shed', '#c2c8ce', 0x939ba4, 4)
    }
    // Signature Towers at IFFCO
    tower(-116, 92, 10, 26, 'concrete', '#e4e0d2', 0xb03a30, 4)
    tower(-102, 100, 10, 26, 'concrete', '#e4e0d2', 0xb03a30, 4)
    // early CyberCity blocks
    tower(30, -180, 14, 22, 'glass', '#5f88a8', 0x3d5a72, 4, 4)
    tower(55, -170, 12, 18, 'glass', '#6f94b2', 0x3d5a72, 4, 4)
    // MG Road malls
    bld(30, -6, 16, 12, 13, 'shop', '#c8a06a', 0x8a6a42, 4)
    bld(58, -18, 15, 13, 13, 'shop', '#b06848', 0x7c4630, 4)
    bld(84, -30, 14, 11, 12, 'shop', '#7c98a6', 0x54707e, 4)
  }

  /* ---------- NOW: full skyline ---------- */
  {
    const rnd = mulberry(2025)
    // CyberCity glass cluster
    const cyber: [number, number, number, number][] = [
      [26, -184, 15, 40],
      [48, -192, 13, 52],
      [70, -178, 14, 46],
      [86, -160, 12, 38],
      [40, -158, 13, 44],
      [62, -145, 12, 36],
      [18, -160, 11, 30],
    ]
    for (const [x, z, w, h] of cyber) {
      tower(x, z, w, h, 'glass', rnd() < 0.5 ? '#4f7f9f' : '#5f93af', 0x2e4a5e, 5)
    }
    // Cyber Hub low strip
    bld(90, -205, 22, 5, 8, 'shop', '#c04030', 0x7c2820, 5)
    // gateway-ish curved tower suggestion
    tower(8, -186, 12, 34, 'glass', '#74a8c4', 0x2e4a5e, 5)
    // Golf Course Road condos
    for (let i = 0; i < 8; i++) {
      tower(150 + rnd() * 90, 15 + rnd() * 110, 9 + rnd() * 4, 26 + rnd() * 22, 'concrete', '#e6ddc8', 0x9a8c74, 5)
    }
    // sector high-rises spread across the plate
    for (let i = 0; i < 26; i++) {
      const hx = -220 + rnd() * 420
      const hz = -60 + rnd() * 320
      if (hx > 150 && hz < 130) continue
      tower(hx, hz, 8 + rnd() * 4, 18 + rnd() * 18, rnd() < 0.3 ? 'glass' : 'concrete', rnd() < 0.3 ? '#5f93af' : '#ddd2ba', 0x9a8c74, 5)
    }
    // dense low urban infill
    for (let i = 0; i < 90; i++) {
      const hx = -240 + rnd() * 460
      const hz = -160 + rnd() * 420
      if (hx > 170 && hz < 0) continue
      bld(hx, hz, 4.5 + rnd() * 3, 5 + rnd() * 7, 4.5 + rnd() * 3, 'concrete', rnd() < 0.5 ? '#d8cdb6' : '#c9c2b4', 0xa39882, 5)
    }
    // Kingdom of Dreams
    {
      const kod = new THREE.Group()
      const hall = new THREE.Mesh(new THREE.BoxGeometry(18, 7, 12), mat(0xf0e8d4))
      hall.position.y = 3.5
      kod.add(hall)
      const dome = new THREE.Mesh(new THREE.SphereGeometry(5.5, 12, 8), mat(0x3a6cb0, 0.5))
      dome.position.y = 9
      dome.scale.y = 0.7
      kod.add(dome)
      kod.position.set(-134, 0, 172)
      track(kod, 5, 5)
    }
    // Ambience mall NE on the highway
    bld(122, -268, 26, 10, 12, 'shop', '#e0d6c0', 0x9c8e76, 5)
    // metro line (yellow) along MG road + HUDA corridor
    const metroPts: [number, number][] = [
      [190, -117],
      [103, -36],
      [-93, 65],
      [-90, 210],
    ]
    const metroGroup = new THREE.Group()
    for (let i = 0; i < metroPts.length - 1; i++) {
      const [ax, az] = metroPts[i]
      const [bx, bz] = metroPts[i + 1]
      const len = Math.hypot(bx - ax, bz - az)
      const deck = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1, len + 2), mat(0xb5aea0))
      deck.position.set((ax + bx) / 2, 9, (az + bz) / 2)
      deck.rotation.y = Math.atan2(bx - ax, bz - az)
      deck.castShadow = true
      metroGroup.add(deck)
      const n = Math.floor(len / 18)
      for (let k = 1; k <= n; k++) {
        const t = k / (n + 1)
        const pil = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9, 1.2), mat(0x9a948a))
        pil.position.set(ax + (bx - ax) * t, 4.5, az + (bz - az) * t)
        metroGroup.add(pil)
      }
    }
    // stations
    for (const [sx, sz] of [
      [103, -36],
      [-3, 14],
      [-93, 65],
      [-90, 210],
    ] as [number, number][]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 6), mat(0xe8c840))
      st.position.set(sx, 10.5, sz)
      metroGroup.add(st)
    }
    track(metroGroup, 5, 5)
  }

  /* ---------- era switching ---------- */
  const transitions: { rec: EraObject; target: number; delay: number }[] = []

  function setEra(era: EraIndex, instant = false): void {
    currentEra = era
    paintGround(groundCtx, era)
    groundTex.needsUpdate = true
    transitions.length = 0
    let stagger = 0
    for (const rec of eraObjects) {
      const want = era >= rec.from && era <= rec.to ? 1 : 0
      if (instant) {
        rec.anim = want
        rec.obj.visible = want === 1
        rec.obj.scale.y = Math.max(0.0001, want)
        continue
      }
      if ((rec.anim === 1) !== (want === 1) || rec.anim !== want) {
        transitions.push({ rec, target: want, delay: (stagger += 0.004) })
      }
    }
  }

  function update(dt: number): void {
    for (let i = transitions.length - 1; i >= 0; i--) {
      const t = transitions[i]
      if (t.delay > 0) {
        t.delay -= dt
        continue
      }
      const dir = t.target > t.rec.anim ? 1 : -1
      t.rec.anim = THREE.MathUtils.clamp(t.rec.anim + dir * dt * 2.2, 0, 1)
      t.rec.obj.visible = t.rec.anim > 0.001
      t.rec.obj.scale.y = Math.max(0.0001, t.rec.anim)
      if (t.rec.anim === t.target) transitions.splice(i, 1)
    }
  }

  function setNight(t: number): void {
    for (const { mat: m, night } of nightMats) m.emissiveIntensity = night * t
  }

  return { setEra, setNight, update, era: () => currentEra }
}
