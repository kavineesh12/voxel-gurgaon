import * as THREE from 'three'
import { RAILWAY, ROADS, type EraIndex } from './world'

/*
 * Everything that moves: block people, era-appropriate vehicles, and the
 * Delhi–Rewari train. Each mover carries an era band and simply appears /
 * disappears with the timeline.
 */

function mat(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.02 })
}

/* ---------- polyline follower ---------- */

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

/* ---------- block person (Minecraft-ish, not Lego) ---------- */

interface Person {
  group: THREE.Group
  legL: THREE.Mesh
  legR: THREE.Mesh
}

const SKIN_TONES = [0xc68642, 0x8d5524, 0xe0ac69, 0xa06a3c]
const CLOTH = [0xb03a3a, 0x3a6ab0, 0x3a8a4a, 0xc08a2a, 0x8a4aa0, 0x607080, 0xc06080, 0x4a8a8a]

function makePerson(rnd: () => number): Person {
  const g = new THREE.Group()
  const skin = SKIN_TONES[Math.floor(rnd() * SKIN_TONES.length)]
  const shirt = CLOTH[Math.floor(rnd() * CLOTH.length)]
  const pants = CLOTH[Math.floor(rnd() * CLOTH.length)]
  const legGeo = new THREE.BoxGeometry(0.42, 1.1, 0.45)
  legGeo.translate(0, -0.55, 0)
  const legL = new THREE.Mesh(legGeo, mat(pants))
  legL.position.set(-0.25, 1.1, 0)
  const legR = new THREE.Mesh(legGeo, mat(pants))
  legR.position.set(0.25, 1.1, 0)
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.55), mat(shirt))
  body.position.y = 1.7
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), mat(skin))
  head.position.y = 2.7
  g.add(legL, legR, body, head)
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true
  })
  return { group: g, legL, legR }
}

/* ---------- vehicles (single-group voxel shapes) ---------- */

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
  const engineColor = steam ? 0x2a2a2e : 0x3a4a8a
  const engine = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 6), mat(engineColor))
  engine.position.set(0, 1.5, 0)
  engine.castShadow = true
  g.add(engine)
  if (steam) {
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.6, 8), mat(0x1a1a1a))
    funnel.position.set(0, 3.4, 2)
    g.add(funnel)
  }
  const coachColor = steam ? 0x7a3a2a : era === 5 ? 0xd8d8d8 : 0x35558a
  for (let i = 1; i <= 3; i++) {
    const coach = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.4, 6), mat(coachColor))
    coach.position.set(0, 1.4, -i * 7)
    coach.castShadow = true
    g.add(coach)
  }
  return g
}

function makeMetro(): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const car = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 6.4), mat(0xe0e0e0))
    car.position.set(0, 1.2, -i * 7)
    const band = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.5, 6.45), mat(0xe8c020))
    band.position.set(0, 1.0, -i * 7)
    g.add(car, band)
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

  const nhRoad = ROADS[0].pts
  const railwayRoad = ROADS[1].pts
  const mgRoad = ROADS[4].pts.slice(0, 3)
  const hudaRoad = ROADS[6].pts.slice(0, 2)
  const gcRoad = ROADS[5].pts
  const cyberLoop = ROADS[10].pts

  /* people — bazaar in every era, malls/cyber hub later */
  const bazaarWalk: [number, number][] = [
    [-214, 138],
    [-190, 160],
    [-166, 182],
    [-190, 160],
  ]
  for (let i = 0; i < 8; i++) {
    const p = makePerson(rnd)
    add(p.group, bazaarWalk, 1.6 + rnd(), 0, 5, { pingpong: true, person: p, offset: rnd() })
  }
  const villagePath: [number, number][] = [
    [-60, 176],
    [-40, 150],
    [-93, 70],
  ]
  for (let i = 0; i < 4; i++) {
    const p = makePerson(rnd)
    add(p.group, villagePath, 1.4 + rnd(), 0, 3, { pingpong: true, person: p, offset: rnd() })
  }
  const mallWalk: [number, number][] = [
    [22, -1],
    [58, -13],
    [88, -27],
  ]
  for (let i = 0; i < 6; i++) {
    const p = makePerson(rnd)
    add(p.group, mallWalk, 1.8 + rnd(), 4, 5, { pingpong: true, person: p, offset: rnd() })
  }
  const cyberWalk: [number, number][] = [
    [84, -200],
    [60, -188],
    [40, -170],
  ]
  for (let i = 0; i < 6; i++) {
    const p = makePerson(rnd)
    add(p.group, cyberWalk, 1.9 + rnd(), 5, 5, { pingpong: true, person: p, offset: rnd() })
  }

  /* era vehicles on the Delhi road */
  for (let i = 0; i < 2; i++) add(makeBullockCart(), nhRoad, 2.2, 0, 1, { offset: rnd() })
  add(makeBullockCart(), railwayRoad, 1.8, 0, 2, { pingpong: true })
  for (let i = 0; i < 2; i++) add(makeLorry(), nhRoad, 9, 1, 3, { offset: rnd() })
  add(makeBus(), nhRoad, 10, 2, 5, { offset: rnd() })
  for (let i = 0; i < 3; i++) add(makeCar(0x333333), nhRoad, 11, 2, 3, { offset: rnd() })
  // modern traffic
  const carColors = [0xc0c0c0, 0x8a2a2a, 0x2a4a8a, 0x222222, 0xd8d8d8]
  for (let i = 0; i < 6; i++) {
    add(makeCar(carColors[i % carColors.length]), nhRoad, 15 + rnd() * 6, 4, 5, { offset: rnd() })
  }
  for (let i = 0; i < 4; i++) {
    add(makeCar(carColors[(i + 2) % carColors.length]), mgRoad, 12, 3, 5, { pingpong: true, offset: rnd() })
  }
  for (let i = 0; i < 3; i++) add(makeAuto(), mgRoad, 8, 3, 5, { pingpong: true, offset: rnd() })
  add(makeAuto(), hudaRoad, 8, 3, 5, { pingpong: true })
  for (let i = 0; i < 2; i++) add(makeCar(0xd8d8d8), gcRoad, 12, 4, 5, { pingpong: true, offset: rnd() })
  for (let i = 0; i < 2; i++) add(makeCar(0x334455), cyberLoop, 9, 4, 5, { offset: rnd() })
  add(makeLorry(), nhRoad, 12, 4, 5, { offset: rnd() })
  add(makeBus(), mgRoad, 9, 3, 5, { pingpong: true, offset: 0.3 })

  /* trains: steam (→1960), diesel (1980–2000), modern (now) + metro */
  add(makeTrain(0), RAILWAY, 14, 0, 2, { pingpong: true })
  add(makeTrain(3), RAILWAY, 20, 3, 4, { pingpong: true })
  add(makeTrain(5), RAILWAY, 24, 5, 5, { pingpong: true })
  const metroPts: [number, number][] = [
    [190, -117],
    [103, -36],
    [-93, 65],
    [-90, 210],
  ]
  add(makeMetro(), metroPts, 16, 5, 5, { y: 9.9, pingpong: true })

  let era: EraIndex = 5

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
