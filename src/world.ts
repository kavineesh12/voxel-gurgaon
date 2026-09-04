import * as THREE from 'three'

/*
 * Voxel Gurgaon through time — 1920 to today.
 * Eras: 1920, 1940, 1960, 1980, 2000, 2010, 2020, NOW.
 * Coordinates: x → east, z → south, 1 unit ≈ 10 m, plate spans ±300.
 */

export const ERAS = [1920, 1940, 1960, 1980, 2000, 2010, 2020, 2025] as const
export type EraIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
export const LAST = 7

export const ERA_CAPTIONS: string[] = [
  'A dusty tehsil town of British Punjab — mud-brick homes around Sadar Bazaar and the railway station, wheat fields to the horizon. Men wear dhotis, kurtas and bright turbans; women in ghagras and odhnis fill the bazaar. Population ≈ 5,000.',
  'Civil-lines bungalows and a busier bazaar. Khadi and Gandhi caps appear in the crowd as the freedom movement grows; lorries share the dirt Delhi–Jaipur road with tongas and bullock carts.',
  "Independent India's district headquarters. Grain markets hum, a water tower rises. Cotton saris and kurta-pyjama in town, turbans in the fields — and Gurgaon is still farmland to the horizon.",
  "The turning point: HUDA (1977) carves the first sectors and Maruti's car plant (1983) rises off the newly-paved Delhi road. Polyester shirts, flared trousers and Bajaj scooters arrive.",
  'DLF City spreads over village land — gated phases, Udyog Vihar factories, Signature Towers, and the first malls on MG Road. Jeans and mall-culture arrive; call-centre cabs run all night.',
  'The Metro arrives (Yellow Line, 2010). Kingdom of Dreams opens, Ambience Mall anchors the border, CyberCity keeps climbing. Office lanyards, kurtis-with-jeans, the great commute begins.',
  'Millennium City at full tilt — Cyber Hub (2013), the Rapid Metro loop, high-rises in every sector. Athleisure, delivery riders and startup hoodies define the street.',
  "Gurgaon today: CyberCity's glass skyline, two metro systems, Golf Course Road's condo canyon — some 2.5 million people where the fields were a century ago.",
]

export interface Info {
  name: string
  sub: string
  story: string
}

/* ------------------------------------------------------------------ */
/* roads — geometry + history (click a road to read it)                */
/* ------------------------------------------------------------------ */

export interface Road {
  pts: [number, number][]
  width: number[] // per era, 0 = not built
  style: ('d' | 'p' | 'x' | '-')[]
  name: string
  story: string
}

export const ROADS: Road[] = [
  {
    pts: [
      [146, -294],
      [3, -174],
      [-93, 65],
      [-240, 146],
      [-300, 180],
    ],
    width: [8, 8, 9, 14, 18, 20, 22, 22],
    style: ['d', 'd', 'd', 'p', 'x', 'x', 'x', 'x'],
    name: 'NH-48 · Delhi–Jaipur Road',
    story:
      'The ancient Delhi–Jaipur route. A dusty camel-and-tonga track until the 1960s, paved as NH-8 in the 70s, and an eight-lane expressway with the IFFCO Chowk flyover today. Everything in new Gurgaon grew along this line.',
  },
  {
    pts: [
      [-190, 160],
      [-93, 65],
    ],
    width: [5, 5, 6, 10, 12, 12, 12, 12],
    style: ['d', 'd', 'd', 'p', 'p', 'p', 'p', 'p'],
    name: 'Old Railway Road',
    story:
      "Old Gurgaon's spine — it linked the 1873 railway station and Sadar Bazaar to the Delhi road. The old town still shops, marries and celebrates along it.",
  },
  {
    pts: [
      [-222, 132],
      [-158, 188],
    ],
    width: [4, 4, 5, 7, 8, 8, 8, 8],
    style: ['d', 'd', 'd', 'p', 'p', 'p', 'p', 'p'],
    name: 'Sadar Bazaar',
    story:
      'The original market street — cloth, bangles, grain and jewellery since the 1800s. Every era of Gurgaon has shopped here; it is still packed on festival days.',
  },
  {
    pts: [
      [-222, 188],
      [-158, 132],
    ],
    width: [4, 4, 5, 7, 8, 8, 8, 8],
    style: ['d', 'd', 'd', 'p', 'p', 'p', 'p', 'p'],
    name: 'Sadar Bazaar cross lane',
    story: 'A bazaar cross-lane of the old town — kirana shops below, family homes above, unchanged in plan for a century.',
  },
  {
    pts: [
      [-93, 65],
      [103, -36],
      [190, -117],
      [235, -160],
    ],
    width: [0, 0, 5, 10, 14, 15, 15, 15],
    style: ['-', '-', 'd', 'p', 'p', 'p', 'p', 'p'],
    name: 'MG Road (Mehrauli–Gurgaon Road)',
    story:
      "A village track to Mehrauli that became Gurgaon's first glamour street — the mall mile of the 2000s, with the Yellow Line running overhead since 2010.",
  },
  {
    pts: [
      [103, -36],
      [170, 30],
      [240, 95],
    ],
    width: [0, 0, 0, 0, 10, 12, 14, 14],
    style: ['-', '-', '-', '-', 'p', 'p', 'p', 'p'],
    name: 'Golf Course Road',
    story:
      "Laid through DLF's phases in the 1990s, named for the golf course beside it — now a canyon of luxury condos and the Rapid Metro's southern arm.",
  },
  {
    pts: [
      [-93, 65],
      [-90, 210],
      [-88, 290],
    ],
    width: [0, 0, 4, 10, 12, 12, 12, 12],
    style: ['-', '-', 'd', 'p', 'p', 'p', 'p', 'p'],
    name: 'Jharsa Road (HUDA corridor)',
    story:
      'From IFFCO Chowk south past Jharsa village toward Sohna. HUDA built its sectors along it in the 80s; the Yellow Line follows it to HUDA City Centre.',
  },
  {
    pts: [
      [100, -140],
      [100, 130],
    ],
    width: [0, 0, 0, 8, 10, 10, 10, 10],
    style: ['-', '-', '-', 'p', 'p', 'p', 'p', 'p'],
    name: 'Sector Road (east)',
    story: 'A HUDA master-plan sector road of the 1980s — straight lines drawn across old field boundaries.',
  },
  {
    pts: [
      [-20, -30],
      [-16, 230],
    ],
    width: [0, 0, 0, 8, 10, 10, 10, 10],
    style: ['-', '-', '-', 'p', 'p', 'p', 'p', 'p'],
    name: 'Sector Road (central)',
    story: 'A HUDA sector road of the 1980s, connecting the new colonies to MG Road and the old town.',
  },
  {
    pts: [
      [-20, 120],
      [100, 124],
    ],
    width: [0, 0, 0, 0, 9, 9, 9, 9],
    style: ['-', '-', '-', '-', 'p', 'p', 'p', 'p'],
    name: 'Sector connector',
    story: 'A 1990s connector stitching the HUDA sectors to DLF City.',
  },
  {
    pts: [
      [3, -174],
      [30, -205],
      [80, -195],
      [90, -150],
      [40, -132],
      [3, -174],
    ],
    width: [0, 0, 0, 0, 8, 9, 10, 10],
    style: ['-', '-', '-', '-', 'p', 'p', 'p', 'p'],
    name: 'CyberCity loop road',
    story:
      "The service loop around DLF CyberCity, built on Nathupur village's fields in the late 1990s. The Rapid Metro has circled above it since 2013.",
  },
]

/** Delhi–Rewari railway (1873) */
export const RAILWAY: [number, number][] = [
  [-300, 40],
  [-215, 130],
  [-185, 200],
  [-160, 300],
]

/** Yellow Line metro (2010+) */
export const METRO_PTS: [number, number][] = [
  [190, -117],
  [103, -36],
  [-93, 65],
  [-90, 210],
]

/** Rapid Metro loop (2013+) */
export const RAPID_PTS: [number, number][] = [
  [10, -170],
  [32, -198],
  [78, -190],
  [86, -152],
  [42, -138],
  [10, -170],
]

/* ------------------------------------------------------------------ */
/* areas — click open ground to learn the neighbourhood                */
/* ------------------------------------------------------------------ */

interface Area {
  x1: number
  z1: number
  x2: number
  z2: number
  from: number
  name: string
  sub: string
  story: string
}

const AREAS: Area[] = [
  {
    x1: -250, z1: 100, x2: -130, z2: 220, from: 0,
    name: 'Old Gurgaon',
    sub: 'the original town',
    story: 'The tehsil town that gave the city its name — bazaars, mohallas and the 1873 railway station. Everything east of here is younger than 1980.',
  },
  {
    x1: 180, z1: -300, x2: 300, z2: 0, from: 0,
    name: 'Aravalli Ridge',
    sub: 'the oldest thing on the map',
    story: 'A spur of the Aravalli range — among the oldest mountains on Earth. Scrub forest, nilgai and leopards; today partly protected as the Aravalli Biodiversity Park.',
  },
  {
    x1: -20, z1: -240, x2: 130, z2: -120, from: 4,
    name: 'DLF CyberCity',
    sub: 'built on Nathupur village fields',
    story: "India's densest office district — 30 lakh sq ft of glass where mustard grew until the 1990s. Half of corporate Gurgaon badges in here every morning.",
  },
  {
    x1: -160, z1: -260, x2: -40, z2: -100, from: 4,
    name: 'Udyog Vihar',
    sub: 'industrial estate, 1980s–90s',
    story: 'Garment exporters, electronics units and startup lofts in HSIIDC sheds along the highway.',
  },
  {
    x1: 0, z1: -80, x2: 170, z2: 60, from: 4,
    name: 'DLF City (Phases 1–4)',
    sub: 'the colony that built new Gurgaon',
    story: "K.P. Singh's DLF assembled village land through the 1980s and sold plots to Delhi's middle class. These leafy phases are the template every later colony copied.",
  },
  {
    x1: -120, z1: 80, x2: 0, z2: 240, from: 3,
    name: 'HUDA Sectors',
    sub: 'the government-planned city',
    story: 'Numbered sectors laid out by the Haryana Urban Development Authority from 1977 — plots, parks and markets on a strict grid.',
  },
  {
    x1: 120, z1: 20, x2: 280, z2: 240, from: 4,
    name: 'Golf Course Road belt',
    sub: 'the condo canyon',
    story: "Gurgaon's most expensive addresses — golf-facing towers, private clubs and the Rapid Metro's southern arm.",
  },
  {
    x1: -300, z1: -300, x2: 300, z2: 300, from: 0,
    name: 'Farmland',
    sub: 'wheat, mustard and millet',
    story: 'For most of the century this was cropland worked by Jat, Ahir and Gujjar farming families from the surrounding villages. Every sector stands on someone’s old field.',
  },
]

export function areaAt(x: number, z: number, era: EraIndex): Info {
  for (const a of AREAS) {
    if (era >= a.from && x >= a.x1 && x <= a.x2 && z >= a.z1 && z <= a.z2) {
      return { name: a.name, sub: a.sub, story: a.story }
    }
  }
  const last = AREAS[AREAS.length - 1]
  return { name: last.name, sub: last.sub, story: last.story }
}

export function roadAt(x: number, z: number, era: EraIndex): Info | null {
  for (const r of ROADS) {
    const w = r.width[era]
    if (!w) continue
    for (let i = 0; i < r.pts.length - 1; i++) {
      const [ax, az] = r.pts[i]
      const [bx, bz] = r.pts[i + 1]
      const dx = bx - ax
      const dz = bz - az
      const len = Math.hypot(dx, dz)
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (len * len)))
      const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t))
      if (d < w / 2 + 2) {
        return { name: r.name, sub: r.style[era] === 'd' ? 'unpaved in this era' : 'road', story: r.story }
      }
    }
  }
  // railway?
  for (let i = 0; i < RAILWAY.length - 1; i++) {
    const [ax, az] = RAILWAY[i]
    const [bx, bz] = RAILWAY[i + 1]
    const dx = bx - ax
    const dz = bz - az
    const len = Math.hypot(dx, dz)
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (len * len)))
    const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t))
    if (d < 4) {
      return {
        name: 'Delhi–Rewari Railway',
        sub: 'opened 1873',
        story: 'The metre-gauge line that put Gurgaon on the map — grain out, cloth in, and the daily passenger to Delhi. The station made the old town.',
      }
    }
  }
  return null
}

/* ------------------------------------------------------------------ */
/* pixel textures                                                      */
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
      ctx.fillStyle = '#4a3826'
      ctx.fillRect(6, y, 4, h)
      ctx.fillRect(22, y, 4, h)
    } else if (kind === 'shed') {
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
/* ground painter                                                      */
/* ------------------------------------------------------------------ */

const GROUND_PX = 1024
const WORLD = 600

const wx = (x: number): number => ((x + 300) / WORLD) * GROUND_PX
const wz = (z: number): number => ((z + 300) / WORLD) * GROUND_PX
const ww = (u: number): number => (u / WORLD) * GROUND_PX

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
  ctx.fillStyle = era < 3 ? '#b5a074' : era === 3 ? '#b0a47e' : '#a8a294'
  ctx.fillRect(0, 0, GROUND_PX, GROUND_PX)

  const rnd = mulberry(1947)
  const fieldGreens = ['#7f9f4f', '#93ac53', '#a9b163', '#87a24a', '#b8ab60', '#6f934a']
  for (let i = 0; i < 480; i++) {
    const fx = rnd() * 600 - 300
    const fz = rnd() * 600 - 300
    const fw = 14 + rnd() * 26
    const fh = 12 + rnd() * 22
    const g = fieldGreens[Math.floor(rnd() * fieldGreens.length)]
    const devel =
      era >= 7
        ? true
        : era === 6
          ? !(fx < -180 && fz > 200)
          : era === 5
            ? fx > -180 && fz < 200 && fx < 270
            : era === 4
              ? fx > -160 && fz < 180 && fx < 260
              : era === 3
                ? fx > -60 && fz < 60 && fx < 200 && fz > -220
                : false
    const nearTown = fx > -245 && fx < -135 && fz > 105 && fz < 215
    const inAravalli = fx > 180 && fz < -20
    if (inAravalli || nearTown) continue
    const clearChance = era >= 7 ? 0.97 : era === 6 ? 0.93 : era === 5 ? 0.88 : era === 4 ? 0.85 : 0.6
    if (devel && rnd() < clearChance) continue
    ctx.fillStyle = g
    ctx.fillRect(wx(fx), wz(fz), ww(fw), ww(fh))
    ctx.strokeStyle = 'rgba(90,70,40,0.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(wx(fx), wz(fz), ww(fw), ww(fh))
  }

  const zonesPerEra: [number, number, number, number, number][][] = [
    [],
    [],
    [[-30, -80, 130, 40, 0.16]],
    [
      [-60, -100, 200, 120, 0.4],
      [-40, 120, 140, 160, 0.35],
    ],
    [
      [-120, -240, 380, 400, 0.55],
      [-260, 60, 200, 220, 0.35],
    ],
    [
      [-140, -260, 420, 440, 0.65],
      [-270, 60, 220, 230, 0.42],
    ],
    [[-300, -300, 600, 600, 0.72]],
    [[-300, -300, 600, 600, 0.8]],
  ]
  const rnd2 = mulberry(1981)
  for (const [zx, zz, zw, zh, density] of zonesPerEra[era]) {
    for (let i = 0; i < (zw * zh) / 260; i++) {
      const fx = zx + rnd2() * zw
      const fz = zz + rnd2() * zh
      if (fx > 180 && fz < -20) continue
      if (rnd2() > density) continue
      ctx.fillStyle = rnd2() < 0.5 ? '#b8b2a4' : '#c4bca8'
      ctx.fillRect(wx(fx), wz(fz), ww(9 + rnd2() * 14), ww(8 + rnd2() * 12))
    }
  }

  // Aravalli scrub
  ctx.fillStyle = '#8a8a5e'
  ctx.beginPath()
  ctx.moveTo(wx(180), wz(-300))
  ctx.lineTo(wx(300), wz(-300))
  ctx.lineTo(wx(300), wz(30))
  ctx.lineTo(wx(215), wz(-40))
  ctx.closePath()
  ctx.fill()

  if (era >= 4) {
    ctx.fillStyle = '#6da24f'
    ctx.fillRect(wx(118), wz(45), ww(66), ww(52))
    ctx.fillRect(wx(-120), wz(92), ww(34), ww(40))
  }

  for (const road of ROADS) {
    const w = road.width[era]
    if (!w) continue
    const style = road.style[era]
    ctx.strokeStyle = style === 'd' ? '#9c7c4e' : style === 'p' ? '#5b5b60' : '#47474f'
    ctx.lineWidth = ww(w)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    road.pts.forEach(([x, z], i) => (i === 0 ? ctx.moveTo(wx(x), wz(z)) : ctx.lineTo(wx(x), wz(z))))
    ctx.stroke()
    if (style !== 'd') {
      ctx.strokeStyle = style === 'x' ? '#d8c14a' : 'rgba(240,240,220,0.7)'
      ctx.lineWidth = Math.max(1.5, ww(0.6))
      ctx.setLineDash([ww(4), ww(4)])
      ctx.beginPath()
      road.pts.forEach(([x, z], i) => (i === 0 ? ctx.moveTo(wx(x), wz(z)) : ctx.lineTo(wx(x), wz(z))))
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // railway
  ctx.strokeStyle = '#6e6152'
  ctx.lineWidth = ww(3.2)
  ctx.beginPath()
  RAILWAY.forEach(([x, z], i) => (i === 0 ? ctx.moveTo(wx(x), wz(z)) : ctx.lineTo(wx(x), wz(z))))
  ctx.stroke()
  ctx.strokeStyle = '#3d372e'
  ctx.lineWidth = Math.max(1.5, ww(0.5))
  ctx.setLineDash([ww(1.2), ww(1.6)])
  ctx.beginPath()
  RAILWAY.forEach(([x, z], i) => (i === 0 ? ctx.moveTo(wx(x), wz(z)) : ctx.lineTo(wx(x), wz(z))))
  ctx.stroke()
  ctx.setLineDash([])
}

/* ------------------------------------------------------------------ */
/* world builder                                                       */
/* ------------------------------------------------------------------ */

interface EraObject {
  obj: THREE.Object3D
  from: number
  to: number
  anim: number
}

interface LabelRec {
  sprite: THREE.Sprite
  from: number
  to: number
}

export interface World {
  setEra: (era: EraIndex, instant?: boolean) => void
  setNight: (t: number) => void
  setLabels: (on: boolean) => void
  update: (dt: number) => void
  era: () => EraIndex
  ground: THREE.Mesh
}

export function buildWorld(scene: THREE.Scene): World {
  const eraObjects: EraObject[] = []
  const labels: LabelRec[] = []
  const nightMats: { mat: THREE.MeshStandardMaterial; night: number }[] = []
  let currentEra: EraIndex = LAST
  let labelsOn = true

  const mat = (color: number, rough = 0.85): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.02 })

  function track(obj: THREE.Object3D, from: number, to = LAST): void {
    obj.visible = false
    eraObjects.push({ obj, from, to, anim: 0 })
    scene.add(obj)
  }

  function setInfo(obj: THREE.Object3D, info: Info): void {
    obj.userData.info = info
  }

  function label(text: string, x: number, y: number, z: number, from: number, to = LAST): void {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 84
    const ctx = c.getContext('2d')!
    ctx.font = 'bold 44px Avenir Next, Trebuchet MS, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const w = ctx.measureText(text).width + 44
    ctx.fillStyle = 'rgba(10,16,30,0.72)'
    ctx.beginPath()
    ctx.roundRect((512 - w) / 2, 8, w, 68, 16)
    ctx.fill()
    ctx.strokeStyle = 'rgba(232,184,74,0.8)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#f5efe2'
    ctx.fillText(text, 256, 44)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true, transparent: true }))
    sprite.position.set(x, y, z)
    sprite.scale.set(40, 6.6, 1)
    sprite.renderOrder = 5
    scene.add(sprite)
    labels.push({ sprite, from, to })
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

  /* ---------- voxel building helpers ---------- */
  function facadeMat(kind: TexKind, base: string, floors: number): THREE.MeshStandardMaterial {
    const t = facadeTexture(kind, base, floors)
    const m = new THREE.MeshStandardMaterial({
      map: t.map,
      emissive: 0xffffff,
      emissiveMap: t.emissiveMap,
      emissiveIntensity: 0,
      roughness: kind === 'glass' ? 0.3 : 0.85,
      metalness: kind === 'glass' ? 0.2 : 0.02,
    })
    nightMats.push({ mat: m, night: 0.85 })
    return m
  }

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
    to = LAST,
    rotY = 0,
    info?: Info,
  ): THREE.Group {
    const g = new THREE.Group()
    const floors = Math.max(1, Math.round(h / 3.2))
    const side = facadeMat(kind, base, floors)
    const top = mat(roof)
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, top, side, side])
    box.position.y = h / 2
    box.castShadow = true
    box.receiveShadow = true
    g.add(box)
    g.position.set(x, 0, z)
    g.rotation.y = rotY
    if (info) setInfo(g, info)
    track(g, from, to)
    return g
  }

  function tower(
    x: number,
    z: number,
    w: number,
    h: number,
    kind: TexKind,
    base: string,
    roof: number,
    from: number,
    to = LAST,
    info?: Info,
  ): void {
    const g = bld(x, z, w, h * 0.62, w, kind, base, roof, from, to, 0, info)
    const floors = Math.max(1, Math.round(h / 3.2))
    const side = facadeMat(kind, base, floors)
    const upper = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.7, h * 0.38, w * 0.7),
      [side, side, mat(roof), mat(roof), side, side],
    )
    upper.position.y = h * 0.62 + h * 0.19
    upper.castShadow = true
    g.add(upper)
  }

  const genericInfo: Record<string, Info> = {
    townHouse: {
      name: 'Old-town home',
      sub: 'Sadar Bazaar mohalla',
      story: 'A courtyard house of the old town — shop or workshop at street level, family rooms above. Many stand on foundations older than the railway.',
    },
    village: {
      name: 'Village house',
      sub: 'mud brick and thatch',
      story: 'A farming household of one of Gurgaon’s villages — cattle in the courtyard, grain on the roof. The urban villages (Nathupur, Sikanderpur, Chakkarpur) still sit inside the modern city.',
    },
    sector: {
      name: 'HUDA plot house',
      sub: 'sector housing, 1980s+',
      story: 'A self-built family house on a HUDA plot — the classic Gurgaon middle-class home of the 80s and 90s.',
    },
    dlf: {
      name: 'DLF City residence',
      sub: 'private colony housing',
      story: 'A plotted house in DLF City — Delhi families bought these in the 90s when the address was still a gamble beside a highway.',
    },
    factory: {
      name: 'Udyog Vihar unit',
      sub: 'export factory',
      story: 'A garment-export or electronics shed — the industry that paid for Gurgaon’s first boom.',
    },
    office: {
      name: 'Office block',
      sub: 'corporate Gurgaon',
      story: 'One of hundreds of glass-and-concrete blocks that fill the sectors — BPOs in the 2000s, startups and GCCs today.',
    },
    condo: {
      name: 'High-rise condominium',
      sub: 'vertical Gurgaon',
      story: 'A gated tower with its own power, water and guards — the city privatised its services and moved into the sky.',
    },
    infill: {
      name: 'Urban infill',
      sub: 'builder floors',
      story: 'Four-storey builder floors — the default fabric of modern Gurgaon, replacing plot houses one at a time.',
    },
  }

  /* ---------- OLD GURGAON ---------- */
  {
    const rnd = mulberry(1920)
    const townSpots: [number, number, number][] = []
    for (let i = 0; i < 46; i++) townSpots.push([-215 + rnd() * 66, 128 + rnd() * 60, 0])
    for (let i = 0; i < 18; i++) townSpots.push([-235 + rnd() * 100, 116 + rnd() * 86, 1])
    for (let i = 0; i < 20; i++) townSpots.push([-245 + rnd() * 116, 108 + rnd() * 100, 2])
    for (const [hx, hz, from] of townSpots) {
      const w = 4 + rnd() * 3
      const h = 3 + rnd() * (from === 0 ? 2 : 4)
      const kinds: TexKind[] = ['mud', 'mud', 'brick']
      const kind = kinds[Math.floor(rnd() * (from === 0 ? 2 : 3))]
      const base = kind === 'mud' ? '#b08d5f' : '#a3563a'
      bld(hx, hz, w, h, w * (0.8 + rnd() * 0.5), kind, base, kind === 'mud' ? 0x8a6c48 : 0x7c4030, from, LAST, rnd() * 0.8 - 0.4, genericInfo.townHouse)
    }
    for (let i = 0; i < 14; i++) {
      bld(-238 + rnd() * 104, 112 + rnd() * 92, 6, 8 + rnd() * 8, 6, 'concrete', '#c9c2b2', 0x9a938a, 4, LAST, 0, genericInfo.infill)
    }
    bld(-196, 173, 16, 6, 7, 'brick', '#933f2c', 0x6e2f22, 0, LAST, 0, {
      name: 'Gurgaon Railway Station',
      sub: 'Delhi–Rewari line, 1873',
      story: 'The station that made the town. Grain and cotton left from here; officials, traders and soldiers arrived. Steam until the 1960s, diesel after — and it still runs.',
    })
    bld(-206, 173, 5, 9, 6, 'brick', '#933f2c', 0x6e2f22, 2)
    const plat = new THREE.Mesh(new THREE.BoxGeometry(26, 1.2, 4), mat(0xb8ad98))
    plat.position.set(-196, 0.6, 166.5)
    track(plat, 0)

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
      mosque.position.set(-172, 0, 150)
      setInfo(mosque, {
        name: 'Jama Masjid, Sadar Bazaar',
        sub: 'old-town mosque',
        story: 'The Friday mosque of the old town, serving traders of the bazaar for over a century.',
      })
      track(mosque, 0)

      const temple = new THREE.Group()
      const cell = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 5), mat(0xd8c294))
      cell.position.y = 2
      temple.add(cell)
      const shikhara = new THREE.Mesh(new THREE.ConeGeometry(2.6, 6, 4), mat(0xc9a45c))
      shikhara.position.y = 7
      shikhara.rotation.y = Math.PI / 4
      temple.add(shikhara)
      temple.position.set(-208, 0, 141)
      setInfo(temple, {
        name: 'Shiv Mandir',
        sub: 'bazaar temple',
        story: 'The old town’s temple — Gurgaon takes its name from Guru Dronacharya of the Mahabharata, said to have been granted this village (Guru-gram).',
      })
      track(temple, 0)

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
      setInfo(church, {
        name: 'Civil Lines Church',
        sub: 'colonial era',
        story: 'A small station church for the district officials of the Raj — Sunday services for the civil lines.',
      })
      track(church, 0)
    }
    for (let i = 0; i < 6; i++) {
      bld(-252 + i * 9, 96 - (i % 2) * 6, 6, 3.5, 5, 'brick', '#e0d6bc', 0xa04c34, 1, LAST, 0, {
        name: 'Civil Lines bungalow',
        sub: 'officers’ quarters, 1930s',
        story: 'Whitewashed bungalows with deep verandahs for the deputy commissioner’s staff — the government quarter of the district town.',
      })
    }
    {
      const wt = new THREE.Group()
      const legs = new THREE.Mesh(new THREE.BoxGeometry(2.2, 10, 2.2), mat(0x9aa0a8))
      legs.position.y = 5
      wt.add(legs)
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 3.6, 10), mat(0xc7cdd4))
      tank.position.y = 11.5
      wt.add(tank)
      wt.position.set(-152, 0, 120)
      setInfo(wt, {
        name: 'Municipal water tower',
        sub: '1960s',
        story: 'Piped water reached the town in the 60s — the tower was its tallest structure for two decades.',
      })
      track(wt, 2)
    }
    for (let i = 0; i < 3; i++) {
      bld(-148 + i * 10, 168, 8, 4.5, 12, 'shed', '#b8bcc2', 0x8e959c, 2, LAST, 0, {
        name: 'Anaj Mandi',
        sub: 'grain market, 1960s',
        story: 'The wholesale grain market — bullock carts, then tractors, queued here at every harvest.',
      })
    }
  }

  /* ---------- villages ---------- */
  {
    const rnd = mulberry(7)
    const villages: [number, number, string, number][] = [
      [-60, 182, 'Jharsa', LAST],
      [100, -44, 'Sikanderpur', 4],
      [58, -182, 'Nathupur', 4],
      [28, 62, 'Chakkarpur', 4],
      [150, 122, 'Wazirabad', 5],
      [-30, -120, 'Dundahera', 4],
    ]
    for (const [vx, vz, name, lastEra] of villages) {
      const n = 7 + Math.floor(rnd() * 4)
      const vInfo: Info = {
        name: `${name} village`,
        sub: 'farming settlement',
        story: `${name} — one of the villages whose fields became the new city. ${lastEra === LAST ? 'Its core survives inside modern Gurgaon.' : 'By the 2000s its lands were sold and built over; the village core became an "urban village" of tall narrow rentals.'}`,
      }
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
          vInfo,
        )
      }
      const well = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.2, 8), mat(0x8f8577))
      well.position.set(vx + 14, 0.6, vz + 2)
      track(well, 0, lastEra)
      // urban-village tall rentals replace the huts
      if (lastEra < LAST) {
        for (let i = 0; i < 5; i++) {
          bld(vx - 8 + i * 5, vz + (i % 2) * 6 - 3, 4, 9 + rnd() * 4, 4.5, 'concrete', '#cfc0a8', 0x9a8c74, lastEra + 1, LAST, 0, {
            name: 'Urban village rental',
            sub: 'built on village land',
            story: 'When the fields sold, village families built tall narrow rental blocks on their house plots — home to the drivers, guards and cooks who run the new city.',
          })
        }
      }
    }
  }

  /* ---------- Aravalli ---------- */
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
      setInfo(hill, {
        name: 'Aravalli Ridge',
        sub: 'ancient hills',
        story: 'Quartzite spurs of one of the world’s oldest ranges — mined for stone in the 80s, partly restored as the Aravalli Biodiversity Park since 2010.',
      })
      scene.add(hill)
    }
  }

  /* ---------- trees ---------- */
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
    treeBand(150, 0, 4, () => [rnd() * 460 - 280, rnd() * 500 - 250])
    treeBand(60, 5, LAST, () => {
      const inParks = rnd() < 0.5
      return inParks ? [120 + rnd() * 60, 45 + rnd() * 50] : [200 + rnd() * 90, -260 + rnd() * 230]
    })
  }

  /* ---------- 1980 ---------- */
  {
    const marutiInfo: Info = {
      name: 'Maruti Udyog plant',
      sub: 'opened 1983',
      story: 'The factory that changed everything — the Maruti 800 rolled out from here and Gurgaon became India’s car capital. Suppliers, jobs and migrants followed.',
    }
    for (let i = 0; i < 3; i++) {
      bld(46 + i * 15, -108, 13, 7, 26, 'shed', '#c8ccd2', 0x9aa2ab, 3, LAST, 0, marutiInfo)
    }
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 18, 8), mat(0xb04a38))
    stack.position.set(24, 9, -96)
    setInfo(stack, marutiInfo)
    track(stack, 3)
    const rnd = mulberry(1977)
    for (let i = 0; i < 40; i++) {
      bld(-50 + rnd() * 120, 130 + rnd() * 100, 5, 4 + rnd() * 3, 5, 'concrete', '#d8cfba', 0xa89a80, 3, LAST, 0, genericInfo.sector)
    }
    for (let i = 0; i < 24; i++) {
      bld(-10 + rnd() * 100, -20 + rnd() * 90, 5, 4 + rnd() * 4, 5, 'concrete', '#cfc6b4', 0xa89a80, 3, LAST, 0, genericInfo.sector)
    }
  }

  /* ---------- 2000 ---------- */
  {
    const rnd = mulberry(2000)
    for (let i = 0; i < 46; i++) {
      bld(20 + rnd() * 150, -60 + rnd() * 150, 5.5, 5 + rnd() * 5, 5.5, 'concrete', '#e0d8c4', 0xb2a488, 4, LAST, 0, genericInfo.dlf)
    }
    for (let i = 0; i < 10; i++) {
      bld(-140 + rnd() * 90, -220 + rnd() * 80, 10, 6 + rnd() * 3, 8, 'shed', '#c2c8ce', 0x939ba4, 4, LAST, 0, genericInfo.factory)
    }
    const sigInfo: Info = {
      name: 'Signature Towers',
      sub: 'completed 1995',
      story: 'The red-topped twins at IFFCO Chowk — new Gurgaon’s first landmark offices, and for years the proof the city was serious.',
    }
    tower(-116, 92, 10, 26, 'concrete', '#e4e0d2', 0xb03a30, 4, LAST, sigInfo)
    tower(-102, 100, 10, 26, 'concrete', '#e4e0d2', 0xb03a30, 4, LAST, sigInfo)
    const cyberInfo: Info = {
      name: 'DLF CyberCity tower',
      sub: 'built 1999–2015',
      story: 'Part of the CyberCity office district — floors of code, calls and finance where Nathupur’s mustard fields stood.',
    }
    tower(30, -180, 14, 22, 'glass', '#5f88a8', 0x3d5a72, 4, LAST, cyberInfo)
    tower(55, -170, 12, 18, 'glass', '#6f94b2', 0x3d5a72, 4, LAST, cyberInfo)
    const mallInfo = (name: string, year: string): Info => ({
      name,
      sub: `opened ${year}`,
      story: 'One of the MG Road malls that taught north India to hang out in air-conditioning — multiplex on top, food court in the middle, arcade below.',
    })
    bld(30, -6, 16, 12, 13, 'shop', '#c8a06a', 0x8a6a42, 4, LAST, 0, mallInfo('Sahara Mall', '2001'))
    bld(58, -18, 15, 13, 13, 'shop', '#b06848', 0x7c4630, 4, LAST, 0, mallInfo('MGF Metropolitan', '2001'))
    bld(84, -30, 14, 11, 12, 'shop', '#7c98a6', 0x54707e, 5, LAST, 0, mallInfo('DT City Centre', '2007'))
  }

  /* ---------- 2010 ---------- */
  {
    const rnd = mulberry(2010)
    const cyberInfo: Info = {
      name: 'DLF CyberCity tower',
      sub: 'built 1999–2015',
      story: 'Part of the CyberCity office district — floors of code, calls and finance where Nathupur’s mustard fields stood.',
    }
    tower(70, -178, 14, 34, 'glass', '#4f7f9f', 0x2e4a5e, 5, LAST, cyberInfo)
    tower(40, -158, 13, 30, 'glass', '#5f93af', 0x2e4a5e, 5, LAST, cyberInfo)
    tower(8, -186, 12, 28, 'glass', '#74a8c4', 0x2e4a5e, 5, LAST, cyberInfo)
    // Kingdom of Dreams (2010)
    const kod = new THREE.Group()
    const hall = new THREE.Mesh(new THREE.BoxGeometry(18, 7, 12), mat(0xf0e8d4))
    hall.position.y = 3.5
    kod.add(hall)
    const dome = new THREE.Mesh(new THREE.SphereGeometry(5.5, 12, 8), mat(0x3a6cb0, 0.5))
    dome.position.y = 9
    dome.scale.y = 0.7
    kod.add(dome)
    kod.position.set(-134, 0, 172)
    setInfo(kod, {
      name: 'Kingdom of Dreams',
      sub: 'opened 2010',
      story: 'India’s Bollywood-style live-entertainment palace — home of the Zangoora musical and the Culture Gully food street.',
    })
    track(kod, 5)
    // Ambience Mall (2007)
    bld(122, -268, 26, 10, 12, 'shop', '#e0d6c0', 0x9c8e76, 5, LAST, 0, {
      name: 'Ambience Mall',
      sub: 'opened 2007',
      story: 'The “1-km mall” on NH-48 at the Delhi border — a kilometre of shopfront on every floor.',
    })
    // metro
    const metroInfo: Info = {
      name: 'Yellow Line Metro',
      sub: 'reached Gurgaon 2010',
      story: 'Delhi Metro crossed the border in 2010 — MG Road, IFFCO Chowk and HUDA City Centre stations rewired how the city commutes.',
    }
    const metroGroup = new THREE.Group()
    for (let i = 0; i < METRO_PTS.length - 1; i++) {
      const [ax, az] = METRO_PTS[i]
      const [bx, bz] = METRO_PTS[i + 1]
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
    setInfo(metroGroup, metroInfo)
    track(metroGroup, 5)
    // early golf condos
    for (let i = 0; i < 3; i++) {
      tower(150 + rnd() * 60, 20 + rnd() * 70, 9 + rnd() * 3, 24 + rnd() * 14, 'concrete', '#e6ddc8', 0x9a8c74, 5, LAST, genericInfo.condo)
    }
    for (let i = 0; i < 30; i++) {
      const hx = -240 + rnd() * 460
      const hz = -160 + rnd() * 420
      if (hx > 170 && hz < 0) continue
      bld(hx, hz, 4.5 + rnd() * 3, 5 + rnd() * 6, 4.5 + rnd() * 3, 'concrete', rnd() < 0.5 ? '#d8cdb6' : '#c9c2b4', 0xa39882, 5, LAST, 0, genericInfo.infill)
    }
  }

  /* ---------- 2020 ---------- */
  {
    const rnd = mulberry(2020)
    const cyberInfo: Info = {
      name: 'DLF CyberCity tower',
      sub: 'built 1999–2015',
      story: 'Part of the CyberCity office district — floors of code, calls and finance where Nathupur’s mustard fields stood.',
    }
    const cyber: [number, number, number, number][] = [
      [26, -196, 15, 44],
      [48, -192, 13, 52],
      [86, -160, 12, 38],
      [62, -145, 12, 36],
      [18, -160, 11, 30],
    ]
    for (const [x, z, w, h] of cyber) {
      tower(x, z, w, h, 'glass', rnd() < 0.5 ? '#4f7f9f' : '#5f93af', 0x2e4a5e, 6, LAST, cyberInfo)
    }
    bld(90, -205, 22, 5, 8, 'shop', '#c04030', 0x7c2820, 6, LAST, 0, {
      name: 'Cyber Hub',
      sub: 'opened 2013',
      story: 'The food-and-nightlife strip at CyberCity’s feet — 60+ restaurants where all of corporate Gurgaon decompresses.',
    })
    // Gateway Tower — the ship-shaped icon at Shankar Chowk
    {
      const ship = new THREE.Group()
      const shipSide = facadeMat('glass', '#74a8c4', 10)
      for (let i = 0; i < 8; i++) {
        const off = Math.pow(i / 7, 1.6) * 5
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(13 - i * 0.8, 4.4, 7),
          [shipSide, shipSide, mat(0x2e4a5e), mat(0x2e4a5e), shipSide, shipSide],
        )
        slab.position.set(off, 2.2 + i * 4.4, 0)
        slab.castShadow = true
        ship.add(slab)
      }
      ship.position.set(4, 0, -206)
      ship.rotation.y = 0.5
      setInfo(ship, {
        name: 'DLF Gateway Tower',
        sub: 'the “ship building”',
        story: 'The curved prow-shaped tower at Shankar Chowk — the first thing drivers from Delhi recognise. Gurgaon’s unofficial logo.',
      })
      track(ship, 6)
    }
    // rapid metro loop
    const rapidInfo: Info = {
      name: 'Rapid Metro',
      sub: 'opened 2013',
      story: 'India’s first fully private metro — a small loop around CyberCity, later extended down Golf Course Road.',
    }
    const rg = new THREE.Group()
    for (let i = 0; i < RAPID_PTS.length - 1; i++) {
      const [ax, az] = RAPID_PTS[i]
      const [bx, bz] = RAPID_PTS[i + 1]
      const len = Math.hypot(bx - ax, bz - az)
      const deck = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.9, len + 2), mat(0xb5aea0))
      deck.position.set((ax + bx) / 2, 7, (az + bz) / 2)
      deck.rotation.y = Math.atan2(bx - ax, bz - az)
      rg.add(deck)
      const n = Math.floor(len / 16)
      for (let k = 1; k <= n; k++) {
        const t = k / (n + 1)
        const pil = new THREE.Mesh(new THREE.BoxGeometry(1, 7, 1), mat(0x9a948a))
        pil.position.set(ax + (bx - ax) * t, 3.5, az + (bz - az) * t)
        rg.add(pil)
      }
    }
    setInfo(rg, rapidInfo)
    track(rg, 6)
    for (let i = 0; i < 3; i++) {
      tower(170 + rnd() * 70, 40 + rnd() * 80, 9 + rnd() * 4, 28 + rnd() * 18, 'concrete', '#ddd2ba', 0x9a8c74, 6, LAST, genericInfo.condo)
    }
    for (let i = 0; i < 14; i++) {
      const hx = -220 + rnd() * 420
      const hz = -60 + rnd() * 320
      if (hx > 150 && hz < 130) continue
      tower(hx, hz, 8 + rnd() * 4, 18 + rnd() * 16, rnd() < 0.3 ? 'glass' : 'concrete', rnd() < 0.3 ? '#5f93af' : '#ddd2ba', 0x9a8c74, 6, LAST, genericInfo.condo)
    }
    for (let i = 0; i < 45; i++) {
      const hx = -240 + rnd() * 460
      const hz = -160 + rnd() * 420
      if (hx > 170 && hz < 0) continue
      bld(hx, hz, 4.5 + rnd() * 3, 5 + rnd() * 7, 4.5 + rnd() * 3, 'concrete', rnd() < 0.5 ? '#d8cdb6' : '#c9c2b4', 0xa39882, 6, LAST, 0, genericInfo.infill)
    }
  }

  /* ---------- NOW ---------- */
  {
    const rnd = mulberry(2025)
    for (let i = 0; i < 12; i++) {
      const hx = -220 + rnd() * 420
      const hz = -60 + rnd() * 320
      if (hx > 150 && hz < 130) continue
      tower(hx, hz, 8 + rnd() * 4, 22 + rnd() * 20, rnd() < 0.35 ? 'glass' : 'concrete', rnd() < 0.35 ? '#5f93af' : '#e2d8c0', 0x9a8c74, 7, LAST, genericInfo.condo)
    }
    for (let i = 0; i < 40; i++) {
      const hx = -240 + rnd() * 460
      const hz = -160 + rnd() * 420
      if (hx > 170 && hz < 0) continue
      bld(hx, hz, 4.5 + rnd() * 3, 6 + rnd() * 7, 4.5 + rnd() * 3, 'concrete', rnd() < 0.5 ? '#d8cdb6' : '#cfc8ba', 0xa39882, 7, LAST, 0, genericInfo.infill)
    }
    for (let i = 0; i < 4; i++) {
      tower(190 + rnd() * 70, 90 + rnd() * 110, 10 + rnd() * 4, 34 + rnd() * 20, 'glass', '#6f9cb8', 0x2e4a5e, 7, LAST, genericInfo.condo)
    }
  }

  /* ---------- landmark labels ---------- */
  label('Railway Station', -196, 16, 173, 0)
  label('Sadar Bazaar', -190, 20, 160, 0)
  label('Civil Lines', -252, 14, 96, 1)
  label('Anaj Mandi', -143, 14, 168, 2, 5)
  label('Jharsa', -60, 14, 182, 0, 4)
  label('Sikanderpur', 100, 13, -44, 0, 4)
  label('Nathupur', 58, 13, -182, 0, 3)
  label('Delhi–Jaipur Road', 40, 16, -145, 0, 2)
  label('NH-8', 40, 18, -145, 3, 4)
  label('NH-48', 40, 20, -145, 5)
  label('Maruti Plant', 55, 22, -108, 3)
  label('MG Road', 45, 22, -8, 3)
  label('IFFCO Chowk', -93, 20, 65, 3)
  label('Signature Towers', -109, 34, 96, 4)
  label('Udyog Vihar', -95, 18, -180, 4)
  label('DLF City', 90, 20, 10, 4)
  label('CyberCity', 48, 52, -172, 5)
  label('Kingdom of Dreams', -134, 20, 172, 5)
  label('Ambience Mall', 122, 20, -268, 5)
  label('Cyber Hub', 90, 14, -205, 6)
  label('Golf Course Road', 180, 26, 45, 5)
  label('Aravalli Ridge', 250, 34, -140, 0)

  /* ---------- era switching ---------- */
  const transitions: { rec: EraObject; target: number; delay: number }[] = []

  function refreshLabels(): void {
    for (const l of labels) {
      l.sprite.visible = labelsOn && currentEra >= l.from && currentEra <= l.to
    }
  }

  function setEra(era: EraIndex, instant = false): void {
    currentEra = era
    paintGround(groundCtx, era)
    groundTex.needsUpdate = true
    refreshLabels()
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
      if (rec.anim !== want) {
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

  function setLabels(on: boolean): void {
    labelsOn = on
    refreshLabels()
  }

  return { setEra, setNight, setLabels, update, era: () => currentEra, ground }
}
