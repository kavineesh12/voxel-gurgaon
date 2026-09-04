import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  areaAt,
  buildWorld,
  ERA_CAPTIONS,
  ERAS,
  LAST,
  roadAt,
  type EraIndex,
  type Info,
} from './world'
import { createMovers } from './movers'
import { computeRoutes, findPlace, PLACES, type RouteResult } from './routes'

/* ------------------------------------------------------------------ */
/* renderer / scene / lights                                           */
/* ------------------------------------------------------------------ */

const canvas = document.querySelector<HTMLCanvasElement>('#scene')!
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true

const scene = new THREE.Scene()
const DAY_SKY = new THREE.Color(0x9ecfe8)
const NIGHT_SKY = new THREE.Color(0x0a1026)
const DAY_FOG = new THREE.Color(0xc4dcea)
const NIGHT_FOG = new THREE.Color(0x0b1230)
scene.background = DAY_SKY.clone()
scene.fog = new THREE.Fog(DAY_FOG.clone(), 400, 1400)

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 3000)

const hemi = new THREE.HemisphereLight(0xffffff, 0x9a8a66, 0.85)
scene.add(hemi)
const sun = new THREE.DirectionalLight(0xfff2d8, 1.7)
sun.position.set(260, 320, -160)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.left = -340
sun.shadow.camera.right = 340
sun.shadow.camera.top = 340
sun.shadow.camera.bottom = -340
sun.shadow.camera.far = 1200
sun.shadow.bias = -0.0005
scene.add(sun)

const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1.7,
  transparent: true,
  opacity: 0,
  sizeAttenuation: false,
})
{
  const geo = new THREE.BufferGeometry()
  const pos: number[] = []
  for (let i = 0; i < 600; i++) {
    const r = 1800
    const th = Math.random() * Math.PI * 2
    const ph = Math.random() * Math.PI * 0.48
    pos.push(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) + 30, r * Math.sin(ph) * Math.sin(th))
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  scene.add(new THREE.Points(geo, starMat))
}

/* ------------------------------------------------------------------ */
/* world + movers                                                      */
/* ------------------------------------------------------------------ */

const world = buildWorld(scene)
const movers = createMovers(scene)

/* ------------------------------------------------------------------ */
/* camera views                                                        */
/* ------------------------------------------------------------------ */

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.maxPolarAngle = Math.PI * 0.495
controls.minDistance = 6
controls.maxDistance = 1100

interface Pose {
  pos: THREE.Vector3
  target: THREE.Vector3
}

const VIEWS: Record<string, Pose> = {
  aerial: { pos: new THREE.Vector3(0, 640, 2), target: new THREE.Vector3(0, 0, 0) },
  straight: { pos: new THREE.Vector3(60, 200, 380), target: new THREE.Vector3(-20, 0, -10) },
  eye: { pos: new THREE.Vector3(-60, 3.2, 92), target: new THREE.Vector3(-93, 4, 60) },
  orbit: { pos: new THREE.Vector3(320, 190, 260), target: new THREE.Vector3(0, 10, 0) },
}

let camAnim: { fromP: THREE.Vector3; fromT: THREE.Vector3; toP: THREE.Vector3; toT: THREE.Vector3; t: number } | null =
  null
let touring = false

function flyTo(pose: Pose, thenOrbit = false): void {
  touring = thenOrbit
  controls.autoRotate = false
  controls.enabled = false
  camAnim = {
    fromP: camera.position.clone(),
    fromT: controls.target.clone(),
    toP: pose.pos.clone(),
    toT: pose.target.clone(),
    t: 0,
  }
}

function goToView(name: string): void {
  flyTo(VIEWS[name], name === 'orbit')
  document.querySelectorAll<HTMLButtonElement>('.view-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === name)
  })
}

document.querySelectorAll<HTMLButtonElement>('.view-btn').forEach((b) => {
  b.addEventListener('click', () => goToView(b.dataset.view!))
})
canvas.addEventListener('pointerdown', () => {
  if (touring) {
    touring = false
    controls.autoRotate = false
  }
})

/* ------------------------------------------------------------------ */
/* era timeline                                                        */
/* ------------------------------------------------------------------ */

const eraYear = document.querySelector<HTMLDivElement>('#era-year')!
const eraText = document.querySelector<HTMLDivElement>('#era-text')!
const playBtn = document.querySelector<HTMLButtonElement>('#play')!
let playing = false
let playTimer = 0

function setEra(era: EraIndex, instant = false): void {
  world.setEra(era, instant)
  movers.setEra(era)
  eraYear.textContent = era === LAST ? 'NOW · 2025' : String(ERAS[era])
  eraText.textContent = ERA_CAPTIONS[era]
  document.querySelectorAll<HTMLButtonElement>('.era-btn').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.era) === era)
  })
}

document.querySelectorAll<HTMLButtonElement>('.era-btn').forEach((b) => {
  b.addEventListener('click', () => {
    playing = false
    playBtn.classList.remove('playing')
    setEra(Number(b.dataset.era) as EraIndex)
  })
})

playBtn.addEventListener('click', () => {
  playing = !playing
  playBtn.classList.toggle('playing', playing)
  if (playing) {
    setEra(0)
    playTimer = 0
  }
})

/* ------------------------------------------------------------------ */
/* day / night + labels                                                */
/* ------------------------------------------------------------------ */

let nightTarget = 0
let nightT = 0
const dayNightBtn = document.querySelector<HTMLButtonElement>('#daynight')!
dayNightBtn.addEventListener('click', () => {
  nightTarget = nightTarget === 0 ? 1 : 0
  dayNightBtn.textContent = nightTarget === 1 ? '🌞' : '🌙'
})
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'n') dayNightBtn.click()
})

function applyNight(t: number): void {
  ;(scene.background as THREE.Color).lerpColors(DAY_SKY, NIGHT_SKY, t)
  scene.fog!.color.lerpColors(DAY_FOG, NIGHT_FOG, t)
  hemi.intensity = THREE.MathUtils.lerp(0.85, 0.16, t)
  sun.intensity = THREE.MathUtils.lerp(1.7, 0.1, t)
  sun.color.setHex(t > 0.5 ? 0xa8c0ff : 0xfff2d8)
  starMat.opacity = t
  world.setNight(t)
}

let labelsOn = true
const labelsBtn = document.querySelector<HTMLButtonElement>('#labels')!
labelsBtn.addEventListener('click', () => {
  labelsOn = !labelsOn
  world.setLabels(labelsOn)
  labelsBtn.classList.toggle('active', labelsOn)
})

/* ------------------------------------------------------------------ */
/* click-to-history                                                    */
/* ------------------------------------------------------------------ */

const infoCard = document.querySelector<HTMLDivElement>('#info-card')!
const infoName = document.querySelector<HTMLDivElement>('#info-name')!
const infoSub = document.querySelector<HTMLDivElement>('#info-sub')!
const infoStory = document.querySelector<HTMLDivElement>('#info-story')!
document.querySelector('#info-close')!.addEventListener('click', () => infoCard.classList.add('hidden'))

function showInfo(info: Info): void {
  infoName.textContent = info.name
  infoSub.textContent = info.sub
  infoStory.textContent = info.story
  infoCard.classList.remove('hidden')
}

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let downX = 0
let downY = 0

canvas.addEventListener('pointerdown', (e) => {
  downX = e.clientX
  downY = e.clientY
})

canvas.addEventListener('pointerup', (e) => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return // it was a drag
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(scene.children, true)
  for (const hit of hits) {
    if (!hit.object.visible) continue
    // walk up for building info
    let o: THREE.Object3D | null = hit.object
    while (o) {
      const info = o.userData?.info as Info | undefined
      if (info) {
        showInfo(info)
        return
      }
      o = o.parent
    }
    if (hit.object === world.ground) {
      const era = world.era()
      const road = roadAt(hit.point.x, hit.point.z, era)
      showInfo(road ?? areaAt(hit.point.x, hit.point.z, era))
      return
    }
    // hit something anonymous (person/vehicle/label) — keep looking deeper
  }
})

/* ------------------------------------------------------------------ */
/* Directions — type from → to, get routes with typical-traffic ETAs   */
/* ------------------------------------------------------------------ */

const dirPanel = document.querySelector<HTMLDivElement>('#directions')!
const dirFrom = document.querySelector<HTMLInputElement>('#dir-from')!
const dirTo = document.querySelector<HTMLInputElement>('#dir-to')!
const dirResults = document.querySelector<HTMLDivElement>('#dir-results')!
const dirTraffic = document.querySelector<HTMLDivElement>('#dir-traffic')!
{
  const dl = document.querySelector<HTMLDataListElement>('#places-list')!
  for (const p of PLACES) {
    const opt = document.createElement('option')
    opt.value = p.name
    dl.appendChild(opt)
  }
}

const ROUTE_COLORS: Record<string, number> = { primary: 0x4a8af4, alt: 0x8a94a8, metro: 0xe8c020, auto: 0x2a9a4a }
let routeMeshes: THREE.Object3D[] = []
let currentRoutes: RouteResult[] = []

function clearRoutes(): void {
  for (const m of routeMeshes) scene.remove(m)
  routeMeshes = []
}

function drawRoute(route: RouteResult, color: number, thick: boolean): void {
  const pts = route.path.map(([x, y, z]) => new THREE.Vector3(x, y + (thick ? 0.4 : 0), z))
  if (pts.length < 2) return
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.0)
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.min(220, pts.length * 6), thick ? 1.5 : 0.9, 6, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: thick ? 0.96 : 0.55, depthTest: true }),
  )
  tube.renderOrder = 4
  scene.add(tube)
  routeMeshes.push(tube)
}

function pinMarker(x: number, z: number, color: number): void {
  const g = new THREE.Group()
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }))
  pole.position.y = 4
  const head = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), new THREE.MeshBasicMaterial({ color }))
  head.position.y = 9
  g.add(pole, head)
  g.position.set(x, 0, z)
  scene.add(g)
  routeMeshes.push(g)
}

function frameRoutes(): void {
  const box = new THREE.Box3()
  for (const r of currentRoutes) {
    for (const [x, y, z] of r.path) box.expandByPoint(new THREE.Vector3(x, y, z))
  }
  if (box.isEmpty()) return
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const span = Math.max(size.x, size.z, 80)
  flyTo({
    pos: new THREE.Vector3(center.x + span * 0.15, span * 1.0 + 70, center.z + span * 0.75),
    target: center,
  })
}

function renderRoutes(selected: number): void {
  clearRoutes()
  currentRoutes.forEach((r, i) => {
    if (i === selected) return
    drawRoute(r, r.mode === 'metro' ? ROUTE_COLORS.metro : r.mode === 'auto' ? ROUTE_COLORS.auto : ROUTE_COLORS.alt, false)
  })
  const sel = currentRoutes[selected]
  if (sel) {
    drawRoute(sel, sel.mode === 'metro' ? ROUTE_COLORS.metro : sel.mode === 'auto' ? ROUTE_COLORS.auto : ROUTE_COLORS.primary, true)
    const first = sel.path[0]
    const last = sel.path[sel.path.length - 1]
    pinMarker(first[0], first[2], 0x35c26a)
    pinMarker(last[0], last[2], 0xe0483a)
  }
  dirResults.querySelectorAll('.route-card').forEach((c, i) => c.classList.toggle('selected', i === selected))
}

function runDirections(): void {
  const from = findPlace(dirFrom.value)
  const to = findPlace(dirTo.value)
  dirResults.innerHTML = ''
  dirTraffic.textContent = ''
  clearRoutes()
  if (!from || !to) {
    dirResults.innerHTML = `<div class="dir-error">Couldn't find “${!from ? dirFrom.value : dirTo.value}”. Try one of the suggestions.</div>`
    return
  }
  if (from === to) {
    dirResults.innerHTML = '<div class="dir-error">You are already there.</div>'
    return
  }
  // routes are computed on the modern network — jump to NOW
  if (world.era() !== LAST) setEra(LAST as EraIndex)
  const { traffic, routes } = computeRoutes(from, to)
  currentRoutes = routes
  dirTraffic.textContent = `⏱ ${traffic.label} (estimates, not live data)`
  if (!routes.length) {
    dirResults.innerHTML = '<div class="dir-error">No route found.</div>'
    return
  }
  const icons: Record<string, string> = { car: '🚗', auto: '🛺', metro: '🚇' }
  routes.forEach((r, i) => {
    const card = document.createElement('div')
    card.className = 'route-card'
    card.innerHTML = `
      <div class="route-top">
        <span class="route-title">${icons[r.mode]} ${r.title}</span>
        <span class="route-time">${Math.round(r.minutes)} min</span>
      </div>
      <div class="route-sub">${r.km.toFixed(1)} km · ${r.via}${r.note ? ' · ' + r.note : ''}</div>`
    card.addEventListener('click', () => renderRoutes(i))
    dirResults.appendChild(card)
  })
  renderRoutes(0)
  frameRoutes()
}

document.querySelector('#directions-btn')!.addEventListener('click', () => {
  dirPanel.classList.toggle('hidden')
  if (!dirPanel.classList.contains('hidden')) dirFrom.focus()
})
document.querySelector('#dir-close')!.addEventListener('click', () => {
  dirPanel.classList.add('hidden')
  clearRoutes()
})
document.querySelector('#dir-go')!.addEventListener('click', runDirections)
document.querySelector('#dir-swap')!.addEventListener('click', () => {
  const t = dirFrom.value
  dirFrom.value = dirTo.value
  dirTo.value = t
  if (currentRoutes.length) runDirections()
})
for (const input of [dirFrom, dirTo]) {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runDirections()
    e.stopPropagation()
  })
}

/* ------------------------------------------------------------------ */
/* City Guide — a narrated tour for first-time visitors                */
/* ------------------------------------------------------------------ */

interface GuideStop {
  title: string
  text: string
  pos: [number, number, number]
  target: [number, number, number]
  era?: EraIndex
}

const GUIDE: GuideStop[] = [
  {
    title: '1 · Old Gurgaon & the Railway Station',
    text: 'Every city has a seed — this is Gurgaon’s. The 1873 Delhi–Rewari railway and Sadar Bazaar made a market town of ~5,000 people. Everything else on this map is younger than 1980.',
    pos: [-150, 45, 230],
    target: [-196, 4, 165],
  },
  {
    title: '2 · NH-48, the Delhi–Jaipur Road',
    text: 'The diagonal artery. Delhi is up-right, Jaipur down-left. Gurgaon boomed because it sits on this road right at Delhi’s border — offices, malls and the airport corridor all cling to it.',
    pos: [-40, 120, 130],
    target: [-40, 0, -50],
  },
  {
    title: '3 · IFFCO Chowk & Signature Towers',
    text: 'The city’s pivot point, where NH-48, MG Road and the Jharsa corridor meet. The red-topped Signature Towers (1995) were new Gurgaon’s first landmark — meet someone “at IFFCO” and everyone knows where.',
    pos: [-150, 40, 40],
    target: [-100, 8, 80],
  },
  {
    title: '4 · MG Road — the mall mile',
    text: 'India learned mall culture here in the early 2000s: Sahara, MGF Metropolitan, City Centre in a row, with the Yellow Line metro overhead since 2010. Take the metro along this road to reach Delhi.',
    pos: [60, 40, 60],
    target: [50, 6, -15],
  },
  {
    title: '5 · DLF CyberCity & Cyber Hub',
    text: 'The skyline you saw from the highway. 30 lakh sq ft of offices on old Nathupur farmland — and Cyber Hub at its feet, where all of corporate Gurgaon eats. The Rapid Metro loops around it.',
    pos: [110, 60, -120],
    target: [50, 20, -175],
  },
  {
    title: '6 · Kingdom of Dreams & Sector 29',
    text: 'The blue dome by the HUDA corridor is Kingdom of Dreams (2010) — Bollywood musicals nightly. Around it, Sector 29 is the open-air food and microbrewery district.',
    pos: [-90, 40, 240],
    target: [-134, 6, 172],
  },
  {
    title: '7 · Golf Course Road',
    text: 'The condo canyon — the most expensive addresses in north India overlook the DLF golf course. Ride the Rapid Metro’s southern arm to see it tower by tower.',
    pos: [130, 55, 130],
    target: [200, 15, 70],
  },
  {
    title: '8 · The Aravalli Ridge',
    text: 'Older than the Himalayas — the rocky spine that bounds the city on the east. The Biodiversity Park here is reclaimed mining land, and the last green lung. That’s Gurgaon: a century, corner to corner.',
    pos: [140, 70, -60],
    target: [240, 15, -140],
  },
]

const guideCard = document.querySelector<HTMLDivElement>('#guide-card')!
const guideTitle = document.querySelector<HTMLDivElement>('#guide-title')!
const guideText = document.querySelector<HTMLDivElement>('#guide-text')!
const guideStep = document.querySelector<HTMLSpanElement>('#guide-step')!
let guideIndex = -1

function showGuideStop(i: number): void {
  guideIndex = i
  const stop = GUIDE[i]
  setEra(stop.era ?? (LAST as EraIndex))
  guideTitle.textContent = stop.title
  guideText.textContent = stop.text
  guideStep.textContent = `${i + 1} / ${GUIDE.length}`
  guideCard.classList.remove('hidden')
  infoCard.classList.add('hidden')
  flyTo({ pos: new THREE.Vector3(...stop.pos), target: new THREE.Vector3(...stop.target) })
}

function endGuide(): void {
  guideIndex = -1
  guideCard.classList.add('hidden')
  goToView('straight')
}

document.querySelector('#guide')!.addEventListener('click', () => showGuideStop(0))
document.querySelector('#guide-next')!.addEventListener('click', () => {
  if (guideIndex < GUIDE.length - 1) showGuideStop(guideIndex + 1)
  else endGuide()
})
document.querySelector('#guide-prev')!.addEventListener('click', () => {
  if (guideIndex > 0) showGuideStop(guideIndex - 1)
})
document.querySelector('#guide-end')!.addEventListener('click', endGuide)

/* ------------------------------------------------------------------ */
/* loop                                                                */
/* ------------------------------------------------------------------ */

setEra(LAST as EraIndex, true)
camera.position.copy(VIEWS.straight.pos)
controls.target.copy(VIEWS.straight.target)

let last = performance.now()

function frame(now: number): void {
  requestAnimationFrame(frame)
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  tick(dt)
}

function tick(dt: number): void {
  if (nightT !== nightTarget) {
    nightT = THREE.MathUtils.clamp(nightT + (nightTarget === 1 ? dt : -dt) / 1.3, 0, 1)
    applyNight(nightT)
  }

  world.update(dt)
  movers.update(dt)

  if (playing) {
    playTimer += dt
    if (playTimer > 5.5) {
      playTimer = 0
      const next = world.era() + 1
      if (next > LAST) {
        playing = false
        playBtn.classList.remove('playing')
      } else {
        setEra(next as EraIndex)
      }
    }
  }

  if (camAnim) {
    camAnim.t = Math.min(1, camAnim.t + dt / 1.4)
    const e = camAnim.t < 0.5 ? 2 * camAnim.t * camAnim.t : 1 - Math.pow(-2 * camAnim.t + 2, 2) / 2
    camera.position.lerpVectors(camAnim.fromP, camAnim.toP, e)
    controls.target.lerpVectors(camAnim.fromT, camAnim.toT, e)
    camera.lookAt(controls.target)
    if (camAnim.t >= 1) {
      controls.enabled = true
      if (touring) {
        controls.autoRotate = true
        controls.autoRotateSpeed = 0.9
      }
      camAnim = null
    }
  } else {
    controls.update()
  }

  renderer.render(scene, camera)
}
requestAnimationFrame(frame)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// debug handle
;(window as unknown as Record<string, unknown>).__vg = {
  setEra,
  goToView,
  camera,
  showGuideStop,
  route(from: string, to: string) {
    dirFrom.value = from
    dirTo.value = to
    dirPanel.classList.remove('hidden')
    runDirections()
  },
  get era() {
    return world.era()
  },
  get night() {
    return { nightT, nightTarget }
  },
  step(seconds: number) {
    const n = Math.ceil(seconds / 0.05)
    for (let i = 0; i < n; i++) tick(0.05)
    renderer.render(scene, camera)
  },
}
