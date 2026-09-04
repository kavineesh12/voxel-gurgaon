import * as THREE from 'three'
import { LAST, METRO_PTS, RAILWAY, RAPID_PTS, ROADS, type EraIndex } from './world'

/*
 * Everything that moves — block people dressed for their era, era-correct
 * vehicles, and the trains. Movers appear/disappear with the timeline.
 */

function mat(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.02 })
}

class Poly {
  pts: THREE.Vector3[]
  cum: number[]
  total: number
  constructor(pts: [number, number][], y = 0) {
    this.pts = pts.map(([x, z]) => new THREE.Vector3(x, y, z))
    this.cum = [0]
    for (let i = 1; i < this.pts.length; i++) {
      this.cum.push(this.cum[i - 1] + this.pts[i].distanceTo(this.pts[i - 1]))
    }
    this.total = this.cum[this.cum.length - 1]
  }
  posAt(d: number, out: THREE.Vector3, pingpong = false): void {
    let dd: number
    if (pingpong) {
      const c = ((d % (this.total * 2)) + this.total * 2) % (this.total * 2)
      dd = c <= this.total ? c : this.total * 2 - c
    } else {
      dd = ((d % this.total) + this.total) % this.total
    }
    let i = 1
    while (i < this.cum.length - 1 && this.cum[i] < dd) i++
    const seg = this.cum[i] - this.cum[i - 1]
    const t = seg > 0 ? (dd - this.cum[i - 1]) / seg : 0
    out.lerpVectors(this.pts[i - 1], this.pts[i], t)
  }
}

/* ---------- block people, dressed for their decade ---------- */

export type Wardrobe = 'colonial' | 'midcentury' | 'nineties' | 'modern'

interface Person {
  group: THREE.Group
  legL: THREE.Mesh
  legR: THREE.Mesh
}

const SKIN = [0xc68642, 0x8d5524, 0xe0ac69, 0xa06a3c]

interface Outfit {
  shirt: number
  pants: number
  headwear?: number // turban / cap block
  sari?: boolean // single-colour draped silhouette
}

function pickOutfit(w: Wardrobe, rnd: () => number): Outfit {
  const r = rnd()
  switch (w) {
    case 'colonial': {
      // dhoti-kurta whites with bright turbans; women in ghagra colours
      if (r < 0.4) return { shirt: 0xe8e0cc, pants: 0xf2ecd8, headwear: [0xd06020, 0xc03030, 0xe8e0cc][Math.floor(rnd() * 3)] }
      if (r < 0.7) return { shirt: 0xded4b8, pants: 0xe8e0cc, headwear: 0xd8a028 }
      return { sari: true, shirt: [0xb03060, 0x2a7a44, 0x3a5ab0, 0xc07020][Math.floor(rnd() * 4)], pants: 0 }
    }
    case 'midcentury': {
      // khadi, Gandhi caps, cotton saris
      if (r < 0.35) return { shirt: 0xe8e4d8, pants: 0xd8d2c0, headwear: 0xf2eee2 }
      if (r < 0.65) return { shirt: 0xc8b890, pants: 0x8a7a5a }
      return { sari: true, shirt: [0x8a3a5a, 0x3a6a8a, 0x6a8a3a][Math.floor(rnd() * 3)], pants: 0 }
    }
    case 'nineties': {
      // polyester shirts, trousers, brighter saris
      if (r < 0.55) return { shirt: [0xa8763a, 0x6a7a8a, 0x8a5a3a, 0x4a6a5a][Math.floor(rnd() * 4)], pants: 0x4a4438 }
      return { sari: true, shirt: [0xc03060, 0x30a060, 0xe0a020, 0x6040c0][Math.floor(rnd() * 4)], pants: 0 }
    }
    case 'modern': {
      // office wear, tees, kurtis with jeans
      if (r < 0.4) return { shirt: [0xf0f0f0, 0x9ab8d8, 0x60c0d8][Math.floor(rnd() * 3)], pants: 0x2a3444 }
      if (r < 0.75) return { shirt: [0xd84040, 0x30a080, 0xf0b020, 0x8050c0, 0x202428][Math.floor(rnd() * 5)], pants: 0x35507a }
      return { shirt: [0xe06090, 0x40b0a0, 0xd88030][Math.floor(rnd() * 3)], pants: 0x35507a }
    }
  }
}

function makePerson(w: Wardrobe, rnd: () => number): Person {
  const g = new THREE.Group()
  const skin = SKIN[Math.floor(rnd() * SKIN.length)]
  const o = pickOutfit(w, rnd)
  const legGeo = new THREE.BoxGeometry(0.42, 1.1, 0.45)
  legGeo.translate(0, -0.55, 0)
  const legMat = mat(o.sari ? o.shirt : o.pants)
  const legL = new THREE.Mesh(legGeo, legMat)
  legL.position.set(-0.25, 1.1, 0)
  const legR = new THREE.Mesh(legGeo, legMat)
  legR.position.set(0.25, 1.1, 0)
  const body = new THREE.Mesh(new THREE.BoxGeometry(o.sari ? 1.15 : 1.0, 1.2, o.sari ? 0.7 : 0.55), mat(o.shirt))
  body.position.y = 1.7
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), mat(skin))
  head.position.y = 2.7
  g.add(legL, legR, body, head)
  if (o.headwear !== undefined) {
    const turban = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.32, 0.85), mat(o.headwear))
    turban.position.y = 3.15
    g.add(turban)
  } else if (o.sari) {
    // pallu over the head in early eras
    const pallu = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.28, 0.82), mat(o.shirt))
    pallu.position.y = 3.12
    g.add(pallu)
  }
  g.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.castShadow = true
  })
  return { group: g, legL, legR }
}

/* ---------- voxel vehicles ---------- */

function makeCar(color: number): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 4.6), mat(color))
  body.position.y = 0.9
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 2.4), mat(0x1e2a34))
  cab.position.set(0, 1.8, -0.2)
  g.add(body, cab)
  body.castShadow = true
  return g
}

function makeAuto(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.1, 2.8), mat(0x2a7a44))
  body.position.y = 0.9
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.9, 2.3), mat(0xe8c02a))
  top.position.set(0, 1.85, -0.15)
  g.add(body, top)
  body.castShadow = true
  return g
}

function makeLorry(): THREE.Group {
  const g = new THREE.Group()
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 2.0), mat(0xb05030))
  cab.position.set(0, 1.3, 2.4)
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 5.0), mat(0x8a7a4a))
  bed.position.set(0, 1.4, -1.2)
  g.add(cab, bed)
  cab.castShadow = bed.castShadow = true
  return g
}

function makeBus(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 8.0), mat(0xc8641e))
  body.position.y = 1.7
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.6, 8.05), mat(0xe8e0d0))
  stripe.position.y = 2.2
  g.add(body, stripe)
  body.castShadow = true
  return g
}

function makeBullockCart(): THREE.Group {
  const g = new THREE.Group()
  const cart = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 2.6), mat(0x8a6a3a))
  cart.position.set(0, 1.0, -1.4)
  const ox1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 2.0), mat(0xd8d0c0))
  ox1.position.set(-0.5, 0.8, 1.2)
  const ox2 = ox1.clone()
  ox2.position.x = 0.5
  g.add(cart, ox1, ox2)
  cart.castShadow = true
  return g
}

function makeTrain(era: EraIndex): THREE.Group {
  const g = new THREE.Group()
  const steam = era < 3
  const engine = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 6), mat(steam ? 0x2a2a2e : 0x3a4a8a))
  engine.position.set(0, 1.5, 0)
  engine.castShadow = true
  g.add(engine)
  if (steam) {
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.6, 8), mat(0x1a1a1a))
    funnel.position.set(0, 3.4, 2)
    g.add(funnel)
  }
  const coachColor = steam ? 0x7a3a2a : era >= 6 ? 0xd8d8d8 : 0x35558a
  for (let i = 1; i <= 3; i++) {
    const coach = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.4, 6), mat(coachColor))
    coach.position.set(0, 1.4, -i * 7)
    coach.castShadow = true
    g.add(coach)
  }
  return g
}

function makeMetro(band: number): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const car = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 6.4), mat(0xe0e0e0))
    car.position.set(0, 1.2, -i * 7)
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.5, 6.45), mat(band))
    stripe.position.set(0, 1.0, -i * 7)
    g.add(car, stripe)
  }
  return g
}

/* ---------- the system ---------- */

interface Mover {
  group: THREE.Group
  poly: Poly
  d: number
  speed: number
  from: number
  to: number
  pingpong: boolean
  person?: Person
  phase: number
}

export interface Movers {
  setEra: (era: EraIndex) => void
  update: (dt: number) => void
}

export function createMovers(scene: THREE.Scene): Movers {
  const movers: Mover[] = []
  const tmp = new THREE.Vector3()
  const ahead = new THREE.Vector3()
  let rndState = 12345
  const rnd = (): number => {
    rndState = (rndState * 16807) % 2147483647
    return rndState / 2147483647
  }

  function add(
    group: THREE.Group,
    pts: [number, number][],
    speed: number,
    from: number,
    to: number,
    opts: { y?: number; pingpong?: boolean; person?: Person; offset?: number } = {},
  ): void {
    scene.add(group)
    group.visible = false
    movers.push({
      group,
      poly: new Poly(pts, opts.y ?? 0),
      d: (opts.offset ?? rnd()) * 500,
      speed,
      from,
      to,
      pingpong: opts.pingpong ?? false,
      person: opts.person,
      phase: rnd() * 6,
    })
  }

  function crowd(pts: [number, number][], count: number, from: number, to: number, w: Wardrobe): void {
    for (let i = 0; i < count; i++) {
      const p = makePerson(w, rnd)
      add(p.group, pts, 1.5 + rnd(), from, to, { pingpong: true, person: p, offset: rnd() })
    }
  }

  const nhRoad = ROADS[0].pts
  const railwayRoad = ROADS[1].pts
  const mgRoad = ROADS[4].pts.slice(0, 3)
  const hudaRoad = ROADS[6].pts.slice(0, 2)
  const gcRoad = ROADS[5].pts
  const cyberLoop = ROADS[10].pts

  /* people — same streets, changing wardrobes */
  const bazaarWalk: [number, number][] = [
    [-214, 138],
    [-190, 160],
    [-166, 182],
    [-190, 160],
  ]
  crowd(bazaarWalk, 7, 0, 1, 'colonial')
  crowd(bazaarWalk, 7, 2, 3, 'midcentury')
  crowd(bazaarWalk, 6, 4, LAST, 'modern')

  const villagePath: [number, number][] = [
    [-60, 176],
    [-40, 150],
    [-93, 70],
  ]
  crowd(villagePath, 4, 0, 2, 'colonial')
  crowd(villagePath, 3, 3, 4, 'nineties')

  const mallWalk: [number, number][] = [
    [22, -1],
    [58, -13],
    [88, -27],
  ]
  crowd(mallWalk, 4, 4, 4, 'nineties')
  crowd(mallWalk, 6, 5, LAST, 'modern')

  const cyberWalk: [number, number][] = [
    [84, -200],
    [60, -188],
    [40, -170],
  ]
  crowd(cyberWalk, 6, 6, LAST, 'modern')

  const stationWalk: [number, number][] = [
    [-206, 168],
    [-186, 170],
  ]
  crowd(stationWalk, 3, 0, 2, 'colonial')
  crowd(stationWalk, 3, 3, LAST, 'modern')

  /* vehicles by era */
  for (let i = 0; i < 2; i++) add(makeBullockCart(), nhRoad, 2.2, 0, 1, { offset: rnd() })
  add(makeBullockCart(), railwayRoad, 1.8, 0, 2, { pingpong: true })
  for (let i = 0; i < 2; i++) add(makeLorry(), nhRoad, 9, 1, 3, { offset: rnd() })
  add(makeBus(), nhRoad, 10, 2, LAST, { offset: rnd() })
  for (let i = 0; i < 3; i++) add(makeCar(0x333333), nhRoad, 11, 2, 3, { offset: rnd() })
  const carColors = [0xc0c0c0, 0x8a2a2a, 0x2a4a8a, 0x222222, 0xd8d8d8]
  for (let i = 0; i < 4; i++) {
    add(makeCar(carColors[i % carColors.length]), nhRoad, 14 + rnd() * 5, 4, 5, { offset: rnd() })
  }
  for (let i = 0; i < 7; i++) {
    add(makeCar(carColors[(i + 1) % carColors.length]), nhRoad, 15 + rnd() * 6, 6, LAST, { offset: rnd() })
  }
  for (let i = 0; i < 4; i++) {
    add(makeCar(carColors[(i + 2) % carColors.length]), mgRoad, 12, 3, LAST, { pingpong: true, offset: rnd() })
  }
  for (let i = 0; i < 3; i++) add(makeAuto(), mgRoad, 8, 3, LAST, { pingpong: true, offset: rnd() })
  add(makeAuto(), hudaRoad, 8, 3, LAST, { pingpong: true })
  for (let i = 0; i < 2; i++) add(makeCar(0xd8d8d8), gcRoad, 12, 4, LAST, { pingpong: true, offset: rnd() })
  for (let i = 0; i < 2; i++) add(makeCar(0x334455), cyberLoop, 9, 4, LAST, { offset: rnd() })
  add(makeLorry(), nhRoad, 12, 4, LAST, { offset: rnd() })
  add(makeBus(), mgRoad, 9, 3, LAST, { pingpong: true, offset: 0.3 })

  /* trains + metros */
  add(makeTrain(0), RAILWAY, 14, 0, 2, { pingpong: true })
  add(makeTrain(3), RAILWAY, 20, 3, 5, { pingpong: true })
  add(makeTrain(7), RAILWAY, 24, 6, LAST, { pingpong: true })
  add(makeMetro(0xe8c020), METRO_PTS, 16, 5, LAST, { y: 9.9, pingpong: true })
  add(makeMetro(0x3a6ab0), RAPID_PTS, 12, 6, LAST, { y: 7.9 })

  let era: EraIndex = LAST as EraIndex

  function setEra(e: EraIndex): void {
    era = e
    for (const m of movers) {
      m.group.visible = era >= m.from && era <= m.to
    }
  }

  function update(dt: number): void {
    for (const m of movers) {
      if (!m.group.visible) continue
      m.d += m.speed * dt
      m.poly.posAt(m.d, tmp, m.pingpong)
      m.poly.posAt(m.d + 1.5, ahead, m.pingpong)
      m.group.position.copy(tmp)
      if (ahead.distanceToSquared(tmp) > 0.001) m.group.lookAt(ahead)
      if (m.person) {
        m.phase += dt * m.speed * 3
        const s = Math.sin(m.phase) * 0.6
        m.person.legL.rotation.x = s
        m.person.legR.rotation.x = -s
      }
    }
  }

  return { setEra, update }
}
