import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildWorld, ERA_CAPTIONS, ERAS, type EraIndex } from './world'
import { createMovers } from './movers'

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

// stars
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

interface ViewPreset {
  pos: THREE.Vector3
  target: THREE.Vector3
}

const VIEWS: Record<string, ViewPreset> = {
  aerial: { pos: new THREE.Vector3(0, 640, 2), target: new THREE.Vector3(0, 0, 0) },
  straight: { pos: new THREE.Vector3(60, 200, 380), target: new THREE.Vector3(-20, 0, -10) },
  eye: { pos: new THREE.Vector3(-60, 3.2, 92), target: new THREE.Vector3(-93, 4, 60) },
  tour: { pos: new THREE.Vector3(320, 190, 260), target: new THREE.Vector3(0, 10, 0) },
}

let camAnim: { fromP: THREE.Vector3; fromT: THREE.Vector3; toP: THREE.Vector3; toT: THREE.Vector3; t: number } | null =
  null
let touring = false

function goToView(name: string): void {
  const v = VIEWS[name]
  touring = name === 'tour'
  controls.autoRotate = false
  controls.enabled = false
  camAnim = {
    fromP: camera.position.clone(),
    fromT: controls.target.clone(),
    toP: v.pos.clone(),
    toT: v.target.clone(),
    t: 0,
  }
  document.querySelectorAll<HTMLButtonElement>('.view-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === name)
  })
}

document.querySelectorAll<HTMLButtonElement>('.view-btn').forEach((b) => {
  b.addEventListener('click', () => goToView(b.dataset.view!))
})
// manual orbiting cancels the tour
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
  eraYear.textContent = era === 5 ? 'NOW · 2025' : String(ERAS[era])
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
/* day / night                                                         */
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

/* ------------------------------------------------------------------ */
/* loop                                                                */
/* ------------------------------------------------------------------ */

setEra(5, true)
goToView('straight')
camera.position.copy(VIEWS.straight.pos)
controls.target.copy(VIEWS.straight.target)
camAnim = null

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
      if (next > 5) {
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

// debug handle for testing
;(window as unknown as Record<string, unknown>).__vg = {
  setEra,
  goToView,
  camera,
  get era() {
    return world.era()
  },
  get night() {
    return { nightT, nightTarget }
  },
  /** advance the simulation manually (testing in a throttled tab) */
  step(seconds: number) {
    const n = Math.ceil(seconds / 0.05)
    for (let i = 0; i < n; i++) tick(0.05)
    renderer.render(scene, camera)
  },
}
