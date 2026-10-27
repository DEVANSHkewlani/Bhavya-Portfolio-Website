"use client"

import * as React from "react"

/* ------------------------------------------------------------------ types */

export type MascotPortfolioHeroProps = {
  /**
   * Height of the hero. Must be a definite length — the poster is fitted to
   * this box, so a percentage collapses to 0px unless every ancestor up to
   * `<html>` has a real height. Never pass `"100%"`.
   */
  height?: string
  /** Floor for the height, so the headline stays legible. */
  minHeight?: string

  /* ---- top rule ---- */
  /** Set in the green half of the index pill, top left. */
  index?: string
  /** Set beside the index, inside the same pill. */
  discipline?: string
  /** The bold line beside the pill. */
  tagline?: string
  /** Centre-right, set inside braces: `{ first / second }`. */
  collection?: [string, string]
  /** Top right, two lines beside the green dot. */
  reel?: [string, string]

  /* ---- headline ---- */
  /** First headline line, before the arrow. */
  year?: string
  /** First headline line, after the arrow. */
  initials?: string
  /** The ringed stamp beside the first line. */
  badge?: string
  /** Second headline line. */
  line2?: string
  /** Third headline line. Its last letter gets the looping swash. */
  line3?: string
  /** Fourth line, the big one — set before the vertical tag. */
  word?: string
  /** The vertical label between `word` and the bracketed letters. */
  verticalTag?: string
  /** Set between the two arcs, followed by an asterisk. */
  bracketed?: string

  /* ---- pill and services ---- */
  /** White half of the pill. */
  seekingLabel?: string
  /** Green half of the pill. */
  seeking?: string
  /** Turns the green half into a link. */
  href?: string
  /** The row along the bottom edge. */
  services?: string[]

  /* ---- the character ---- */
  /** Cycled through, one per click on the character. */
  greetings?: string[]
  skin?: string
  beanie?: string
  shirt?: string
  hairColor?: string
  /** The leather tag on the beanie cuff. */
  tag?: string

  /* ---- palette ---- */
  /** The accent color: index pill, dot, seeking pill, hover rules. */
  accent?: string
  /** The sheet. */
  paper?: string
  /** Type, rules and the room. */
  ink?: string
  className?: string
}

const SANS_STACK =
  '"Inter","Helvetica Neue",Helvetica,Arial,system-ui,sans-serif'
const DISPLAY_STACK =
  '"Archivo Black","Arial Black","Helvetica Neue",Helvetica,Arial,system-ui,sans-serif'

/* The character's sheet. Every coordinate in the figure lives in this box. */
const CW = 600
const CH = 720

/* --------------------------------------------------------------- the gaze */

// #region gaze

/**
 * Where the pointer is, relative to the head, as a direction in (-1, 1) on
 * each axis. Soft-saturated rather than clamped, so the head never slams into
 * a stop: it keeps turning a little further the further away you go.
 */
export function aim(px: number, py: number, cx: number, cy: number, rx: number, ry: number) {
  const sat = (v: number) => v / Math.sqrt(1 + v * v)
  return [sat((px - cx) / rx), sat((py - cy) / ry)]
}

/** Frame-rate-independent easing of `cur` towards `target`. */
export function approach(cur: number, target: number, dt: number, rate: number) {
  return target + (cur - target) * Math.exp(-rate * dt)
}

/**
 * How far each layer moves for a gaze of (x, y). Offsets are in figure units
 * and nested: `face` is relative to `head`, `nose` and `eyes` to `face`.
 * `near` is 0..1, how close the pointer is to the face — it widens the eyes
 * and lifts the brows.
 */
export function pose(x: number, y: number, near: number) {
  return {
    body: { dx: x * 4, dy: 0 },
    head: { dx: x * 10, dy: y * 7, rot: x * 4 },
    ears: { dx: -x * 7, dy: -y * 3, lead: 1 + x * 0.16, trail: 1 - x * 0.16 },
    hair: { dx: x * 8, dy: y * 3 },
    beanie: { dx: x * 10, dy: y * 4 },
    tag: { dx: x * 6, dy: 0 },
    blush: { dx: x * 14, dy: y * 9 },
    face: { dx: x * 18, dy: y * (y < 0 ? 8 : 14) },
    nose: { dx: x * 8, dy: y * 5 },
    eyes: { dx: x * 6, dy: y * 5, scale: 1 + near * 0.14 },
    brows: { dx: x * 3, dy: y * 2 + Math.min(0, y) * 3 - near * 9 },
  }
}

/** Blink envelope: 1 is open, dips towards 0.08 across a 150ms blink. */
export function blink(since: number) {
  const d = 0.15
  if (since < 0 || since > d) return 1
  return 1 - Math.sin((Math.PI * since) / d) * 0.92
}

// #endregion

/* ------------------------------------------------------------- the room */

type Seg = [number, number, number, number]

/**
 * A one-point-perspective room in a 1000x1000 box that is stretched to fill
 * the hero.
 */
function room(): { back: Seg[]; rays: Seg[]; depth: string[] } {
  const x0 = 95
  const x1 = 905
  const y0 = 85
  const y1 = 865
  const vx = (x0 + x1) / 2
  const vy = (y0 + y1) / 2
  const cols = 14
  const rows = 11
  const back: Seg[] = []
  const rays: Seg[] = []
  const out = (x: number, y: number): Seg => {
    const dx = x - vx
    const dy = y - vy
    const tx = dx > 0 ? (1000 - x) / dx : dx < 0 ? -x / dx : Infinity
    const ty = dy > 0 ? (1000 - y) / dy : dy < 0 ? -y / dy : Infinity
    const t = Math.min(tx, ty)
    return [x, y, x + dx * t, y + dy * t]
  }
  for (let i = 0; i <= cols; i++) {
    const x = x0 + ((x1 - x0) * i) / cols
    back.push([x, y0, x, y1])
    rays.push(out(x, y0), out(x, y1))
  }
  for (let j = 0; j <= rows; j++) {
    const y = y0 + ((y1 - y0) * j) / rows
    back.push([x0, y, x1, y])
    rays.push(out(x0, y), out(x1, y))
  }
  const depth = [1.07, 1.16, 1.28, 1.45, 1.7].map((s) => {
    const l = vx + (x0 - vx) * s
    const r = vx + (x1 - vx) * s
    const t = vy + (y0 - vy) * s
    const b = vy + (y1 - vy) * s
    return "M" + l + " " + t + "H" + r + "V" + b + "H" + l + "Z"
  })
  return { back, rays, depth }
}

const ROOM = room()

/** Five irregular petals, closed, as one outline */
function flowerPath() {
  const n = 180
  const lens = [1, 0.84, 0.95, 0.78, 0.9]
  let d = ""
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = Math.floor(((a + Math.PI / 5) / (Math.PI * 2)) * 5) % 5
    const lobe = Math.pow(Math.abs(Math.cos((a * 5) / 2)), 0.9)
    const r = 50 * (0.3 + 0.7 * lobe * lens[k])
    const x = 60 + Math.cos(a - Math.PI / 2) * r
    const y = 60 + Math.sin(a - Math.PI / 2) * r
    d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)
  }
  return d + "Z"
}

const FLOWER = flowerPath()

/* ----------------------------------------------------------------- styles */

const CSS = `
.mph-root{position:relative;width:100%;overflow:hidden;isolation:isolate;background:var(--mph-paper);color:var(--mph-ink);container:mph / size;font-family:var(--mph-sans);-webkit-font-smoothing:antialiased;}
.mph-room{position:absolute;inset:0;width:100%;height:100%;display:block;color:var(--mph-ink);pointer-events:none;}
.mph-room line,.mph-room path{vector-effect:non-scaling-stroke;}
.mph-stage{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(100cqw,177.78cqh);aspect-ratio:16/9;container:mphs / inline-size;}

.mph-top{position:absolute;left:4.6%;right:4.6%;top:4.4%;display:grid;grid-template-columns:auto auto 1fr auto auto;align-items:center;column-gap:2.4cqw;font-size:1.05cqw;font-weight:800;line-height:1.1;text-transform:uppercase;letter-spacing:.02em;}
.mph-index{display:inline-flex;align-items:center;gap:.9em;border:.12cqw solid var(--mph-ink);border-radius:999px;padding:.12em .9em .12em .12em;font-size:.72em;}
.mph-index b{background:var(--mph-accent);color:var(--mph-ink);border-radius:999px;padding:.3em 1.2em;font-weight:800;}
.mph-tagline{font-size:1.18em;font-weight:900;margin-left:1cqw;}
.mph-brace{grid-column:4;font-size:1.3em;font-weight:700;letter-spacing:.04em;margin-right:2.6cqw;}
.mph-reel{grid-column:5;display:flex;align-items:center;gap:.8em;font-size:.8em;text-align:right;}
.mph-reel i{display:block;width:1.9em;height:1.9em;border-radius:50%;background:var(--mph-accent);border:.12cqw solid var(--mph-ink);flex:none;}

.mph-h1{position:absolute;left:8.8%;top:17.5%;margin:0;font-family:var(--mph-display);font-weight:900;font-size:6.5cqw;line-height:.93;letter-spacing:-.045em;text-transform:uppercase;color:var(--mph-ink);}
.mph-line{display:block;width:max-content;white-space:nowrap;position:relative;}
.mph-ch{display:inline-block;transition:transform .35s cubic-bezier(.3,1.6,.5,1),color .2s;}
.mph-ch:hover{transform:translateY(-.08em) rotate(-4deg);color:var(--mph-accent);}
.mph-arrow{display:inline-block;width:.6em;height:.6em;margin:0 .06em 0 .1em;vertical-align:-.02em;}
.mph-arrow path{stroke:currentColor;stroke-width:15;fill:none;stroke-linecap:square;}
.mph-badge{position:absolute;top:-.02em;left:calc(100% + .55em);font-family:var(--mph-sans);font-size:.2em;font-weight:800;letter-spacing:0;line-height:1;text-transform:none;border:.13cqw solid var(--mph-ink);border-radius:50%;padding:.75em 1.15em;transform:rotate(-9deg);transition:background .25s,transform .4s cubic-bezier(.3,1.6,.5,1);cursor:default;}
.mph-badge sup{font-size:.7em;margin-left:.1em;}
.mph-badge:hover{background:var(--mph-accent);transform:rotate(6deg) scale(1.08);}
.mph-swash{position:relative;display:inline-block;}
.mph-swash svg{position:absolute;left:-.95em;top:.3em;width:2.55em;height:.72em;overflow:visible;pointer-events:none;}
.mph-swash path{fill:none;stroke:var(--mph-ink);stroke-width:.2cqw;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:0;animation:mph-draw 1.6s .5s cubic-bezier(.6,0,.2,1) both;}
.mph-h1:hover .mph-swash path{animation:mph-draw 1.1s cubic-bezier(.6,0,.2,1) both;}
.mph-l4{font-size:1.2em;letter-spacing:-.02em;margin-top:.04em;}
.mph-vtag{display:inline-flex;flex-direction:column;align-items:stretch;vertical-align:-.02em;margin:0 .1em 0 .06em;width:.2em;}
.mph-vtag span{display:block;background:var(--mph-ink);color:var(--mph-paper);writing-mode:vertical-rl;font-family:var(--mph-sans);font-size:.105em;font-weight:800;letter-spacing:.12em;padding:.55em 0;text-align:center;}
.mph-vtag i{display:block;height:.34em;background:repeating-linear-gradient(to bottom,var(--mph-ink) 0 .02em,transparent .02em .045em);}
.mph-bracket{position:relative;display:inline-block;padding:0 .08em;}
.mph-bracket svg{position:absolute;left:-.02em;right:-.02em;top:-.1em;bottom:-.12em;width:calc(100% + .04em);height:calc(100% + .22em);overflow:visible;}
.mph-bracket path{fill:none;stroke:var(--mph-ink);stroke-width:.62cqw;stroke-linecap:butt;transition:transform .45s cubic-bezier(.3,1.6,.5,1);}
.mph-bracket:hover .mph-arc-t{transform:translateY(-10px);}
.mph-bracket:hover .mph-arc-b{transform:translateY(10px);}
.mph-star{display:inline-block;font-size:.66em;vertical-align:.5em;margin-left:.02em;transition:transform .6s cubic-bezier(.3,1.6,.5,1);}
.mph-l4:hover .mph-star{transform:rotate(180deg) scale(1.2);}

.mph-pill{position:absolute;left:8.8%;top:72.8%;display:flex;align-items:stretch;font-size:1.72cqw;font-weight:800;line-height:1;}
.mph-pill-a{position:relative;z-index:1;background:#fff;color:var(--mph-ink);border:.16cqw solid var(--mph-ink);border-radius:999px;padding:.72em 1.25em;}
.mph-pill-b{display:inline-flex;align-items:center;gap:.5em;margin-left:-1.4em;padding:.72em 3.4em .72em 3.1em;background:var(--mph-accent);color:var(--mph-ink);border:.16cqw solid var(--mph-ink);border-radius:0 999px 999px 0;text-decoration:none;transition:background .25s,color .25s,padding .35s cubic-bezier(.3,1.4,.5,1);}
.mph-pill-b em{font-style:normal;display:inline-block;width:0;overflow:hidden;opacity:0;transition:width .35s,opacity .25s;}
.mph-pill-b:hover,.mph-pill-b:focus-visible{background:var(--mph-ink);color:var(--mph-paper);padding-right:2.4em;outline:none;}
.mph-pill-b:hover em,.mph-pill-b:focus-visible em{width:1em;opacity:1;}

.mph-flower{position:absolute;left:35.4%;top:64%;width:7.4%;aspect-ratio:1;animation:mph-spin 22s linear infinite;cursor:grab;}
.mph-flower svg{display:block;width:100%;height:100%;overflow:visible;transition:transform .5s cubic-bezier(.3,1.8,.5,1);}
.mph-flower:hover svg{transform:scale(1.18) rotate(40deg);}
.mph-flower path{fill:#fff;stroke:var(--mph-ink);stroke-width:2.6;stroke-linejoin:round;}
.mph-curl{position:absolute;left:43.2%;top:52.5%;width:5.6%;aspect-ratio:1;overflow:visible;pointer-events:none;}
.mph-curl path{fill:none;stroke:var(--mph-ink);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;animation:mph-draw 1.4s 1s cubic-bezier(.6,0,.2,1) both;}

.mph-services{position:absolute;left:4.6%;bottom:4.6%;display:flex;gap:4cqw;margin:0;padding:0;list-style:none;font-size:1.3cqw;font-weight:800;}
.mph-services li{position:relative;cursor:default;padding-bottom:.25em;}
.mph-services li::after{content:"";position:absolute;left:0;right:0;bottom:0;height:.18em;background:var(--mph-accent);transform:scaleX(0);transform-origin:left;transition:transform .35s cubic-bezier(.6,0,.2,1);}
.mph-services li:hover::after{transform:scaleX(1);}

.mph-rule{position:absolute;width:0;border-left:.1cqw solid var(--mph-ink);}
.mph-rule::after{content:"";position:absolute;bottom:0;left:-.1cqw;width:1.1cqw;border-top:.1cqw solid var(--mph-ink);transform:rotate(28deg);transform-origin:left;}
.mph-rule-l{left:3.7%;top:23%;height:13%;}
.mph-rule-r{left:94.8%;top:66%;height:13%;}

.mph-char{position:absolute;left:55%;bottom:-1.2%;width:41%;aspect-ratio:600/720;padding:0;margin:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;border-radius:40% 40% 8% 8%;perspective:900px;}
.mph-char:focus-visible{outline:.2cqw dashed var(--mph-ink);outline-offset:.4cqw;}
.mph-char svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 14px 24px rgba(0,0,0,0.12));transition:filter .3s ease;}
.mph-char:hover svg{filter:drop-shadow(0 20px 32px rgba(0,0,0,0.18));}
.mph-tagwig{transform-box:fill-box;transform-origin:50% 0;}
.mph-happy .mph-tagwig{animation:mph-wiggle .9s cubic-bezier(.3,1.6,.5,1);}
.mph-bubble{position:absolute;left:-4%;top:6%;max-width:46%;background:#fff;color:var(--mph-ink);border:.16cqw solid var(--mph-ink);border-radius:1.4em 1.4em 1.4em .2em;padding:.8em 1.1em;font-size:1.3cqw;font-weight:800;line-height:1.2;text-align:left;box-shadow:.35cqw .35cqw 0 var(--mph-accent);transform-origin:0 100%;transform:scale(0) rotate(-8deg);opacity:0;transition:transform .45s cubic-bezier(.3,1.6,.5,1),opacity .2s;pointer-events:none;}
.mph-bubble[data-on="true"]{transform:scale(1) rotate(-4deg);opacity:1;}

@keyframes mph-draw{from{stroke-dashoffset:1;}to{stroke-dashoffset:0;}}
@keyframes mph-spin{to{transform:rotate(360deg);}}
@keyframes mph-wiggle{0%{transform:rotate(0);}25%{transform:rotate(-14deg);}55%{transform:rotate(9deg);}80%{transform:rotate(-4deg);}100%{transform:rotate(0);}}

@container mph (orientation: portrait){
.mph-stage{top:0;transform:translateX(-50%);width:min(100cqw,56.25cqh);height:100cqh;aspect-ratio:auto;}
.mph-top{top:5cqw;left:6%;right:6%;grid-template-columns:auto 1fr auto;font-size:2.5cqw;}
.mph-tagline,.mph-brace{display:none;}
.mph-reel{grid-column:3;}
.mph-h1{left:7%;top:17cqw;font-size:11.4cqw;}
.mph-badge{left:calc(100% + .35em);top:.1em;font-size:.22em;}
.mph-pill{left:7%;top:70cqw;font-size:3.5cqw;}
.mph-flower{left:auto;right:6%;top:66cqw;width:13%;}
.mph-curl{left:auto;right:4%;top:44cqw;width:11%;}
.mph-services{left:7%;right:7%;bottom:auto;top:84cqw;flex-wrap:wrap;gap:1.6cqw 5cqw;font-size:3cqw;}
.mph-rule-l{left:3%;top:22cqw;height:12cqw;}
.mph-rule-r{left:95%;top:auto;bottom:40cqw;height:12cqw;}
.mph-char{left:12%;width:76%;bottom:-.6%;}
.mph-bubble{font-size:3cqw;left:-8%;top:2%;max-width:52%;}
}

@media (prefers-reduced-motion: reduce){
.mph-root *,.mph-root *::after{animation:none!important;transition:none!important;}
}
`

/* ------------------------------------------------------------- component */

type Layers = Partial<
  Record<
    | "body" | "head" | "earL" | "earR" | "beanie" | "tag" | "blush"
    | "face" | "nose" | "eyes" | "brows" | "hair" | "hairBack",
    SVGGElement | null
  >
>

const DEFAULT_SERVICES = ["Film Direction", "Screenwriting", "Visual Storytelling", "Production & Sets"]
const DEFAULT_GREETINGS = [
  "Hi there! I'm Bhavya ✨",
  "Let's make something bold.",
  "Looking for fresh vision?",
  "Films, frames & stories!",
  "Okay, you can stop poking me :)",
]

export default function MascotPortfolioHero({
  height = "100svh",
  minHeight = "440px",
  index = "08/01",
  discipline = "Film & Direction",
  tagline = "Cinema in Discomfort",
  collection = ["Selected", "Works"],
  reel = ["Sample reels @ 2026", "Film Direction"],
  year = "2026",
  initials = "BH",
  badge = "Hire me",
  line2 = "Portfolio",
  line3 = "Cinema",
  word = "Direct",
  verticalTag = "Visual",
  bracketed = "S",
  seekingLabel = "Seeking*",
  seeking = "Film / Direction",
  href,
  services = DEFAULT_SERVICES,
  greetings = DEFAULT_GREETINGS,
  skin = "#fcd9c7",
  beanie = "#f06522", // Orange beanie as requested
  shirt = "#2d72e2",  // Blue clothes as requested
  hairColor = "#2c1c14", // Long brown hair as requested
  tag = "#c48858",
  accent = "#4A88E8",
  paper = "#ebebea",
  ink = "#111111",
  className,
}: MascotPortfolioHeroProps) {
  const uid = React.useId().replace(/:/g, "")
  const id = (n: string) => n + uid
  const u = (n: string) => "url(#" + id(n) + ")"

  const rootRef = React.useRef<HTMLDivElement>(null)
  const charRef = React.useRef<HTMLButtonElement>(null)
  const layers = React.useRef<Layers>({})
  const set = (k: keyof Layers) => (el: SVGGElement | null) => {
    layers.current[k] = el
  }

  const [happy, setHappy] = React.useState(false)
  const [said, setSaid] = React.useState(-1)
  const happyTimer = React.useRef<number | undefined>(undefined)

  const poke = () => {
    setSaid((n) => (n + 1) % Math.max(1, greetings.length))
    setHappy(true)
    window.clearTimeout(happyTimer.current)
    happyTimer.current = window.setTimeout(() => setHappy(false), 2200)
  }
  React.useEffect(() => () => window.clearTimeout(happyTimer.current), [])

  React.useEffect(() => {
    const root = rootRef.current
    const char = charRef.current
    if (!root || !char) return

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    let still = mq.matches
    const onMq = () => (still = mq.matches)
    mq.addEventListener("change", onMq)

    let px = 0
    let py = 0
    let lastMove = -1e9
    let gx = 0
    let gy = 0
    let near = 0
    let prev = performance.now()
    let nextBlink = prev + 1800
    let blinkAt = -1e9
    let raf = 0
    let visible = true

    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      lastMove = performance.now()
    }
    const onLeave = () => (lastMove = -1e9)
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onMove, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)
    window.addEventListener("blur", onLeave)

    const tr = (dx: number, dy: number) => "translate(" + dx.toFixed(2) + " " + dy.toFixed(2) + ")"
    const L = layers.current

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now

      const r = char.getBoundingClientRect()
      const cx = r.left + r.width * 0.5
      const cy = r.top + r.height * 0.48
      let tx = 0
      let ty = 0
      let tn = 0
      const idle = now - lastMove > 3500
      if (!idle) {
        const reach = Math.max(innerWidth, innerHeight)
        ;[tx, ty] = aim(px, py, cx, cy, reach * 0.3, reach * 0.26)
        const dist = Math.hypot(px - cx, py - cy)
        tn = Math.max(0, 1 - dist / (r.width * 0.45))
      } else if (!still) {
        const t = now / 1000
        tx = Math.sin(t * 0.45) * 0.55 + Math.sin(t * 1.1) * 0.1
        ty = Math.sin(t * 0.31 + 1) * 0.25
      }

      const rate = still ? 30 : 7
      gx = approach(gx, tx, dt, rate)
      gy = approach(gy, ty, dt, rate)
      near = approach(near, tn, dt, 8)
      const p = pose(gx, gy, near)
      const breathe = still ? 0 : Math.sin(now / 620) * 1.6

      if (!still && now > nextBlink) {
        blinkAt = now
        nextBlink = now + (Math.random() < 0.2 ? 260 : 2200 + Math.random() * 3200)
      }
      const open = still ? 1 : blink((now - blinkAt) / 1000)

      L.body?.setAttribute("transform", tr(p.body.dx, p.body.dy + breathe * 0.4))
      L.head?.setAttribute(
        "transform",
        tr(p.head.dx, p.head.dy + breathe) + " rotate(" + p.head.rot.toFixed(2) + " 300 560)",
      )

      L.earL?.setAttribute("transform", tr(p.ears.dx, p.ears.dy) + " translate(138 380) scale(" + p.ears.lead.toFixed(3) + " 1) translate(-138 -380)")
      L.earR?.setAttribute("transform", tr(p.ears.dx, p.ears.dy) + " translate(462 380) scale(" + p.ears.trail.toFixed(3) + " 1) translate(-462 -380)")
      L.hair?.setAttribute("transform", tr(p.hair.dx, p.hair.dy))
      L.beanie?.setAttribute("transform", tr(p.beanie.dx, p.beanie.dy))
      L.tag?.setAttribute("transform", tr(p.tag.dx, p.tag.dy))
      L.blush?.setAttribute("transform", tr(p.blush.dx, p.blush.dy))
      L.face?.setAttribute("transform", tr(p.face.dx, p.face.dy))
      L.nose?.setAttribute("transform", tr(p.nose.dx, p.nose.dy))
      L.brows?.setAttribute("transform", tr(p.brows.dx, p.brows.dy))
      L.eyes?.setAttribute(
        "transform",
        tr(p.eyes.dx, p.eyes.dy) +
          " translate(300 350) scale(" + p.eyes.scale.toFixed(3) + " " + (p.eyes.scale * open).toFixed(3) + ") translate(-300 -350)",
      )
    }
    raf = requestAnimationFrame(frame)

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      prev = performance.now()
    })
    io.observe(root)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      mq.removeEventListener("change", onMq)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onMove)
      document.documentElement.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("blur", onLeave)
    }
  }, [])

  const chars = (s: string) =>
    Array.from(s).map((c, i) => (
      <span key={i} className="mph-ch">
        {c === " " ? "\u00A0" : c}
      </span>
    ))

  const l3 = Array.from(line3)
  const l3Head = l3.slice(0, -1).join("")
  const l3Tail = l3[l3.length - 1] ?? ""
  const greeting = said >= 0 ? greetings[said % greetings.length] : greetings[0]

  const vars = {
    "--mph-accent": accent,
    "--mph-paper": paper,
    "--mph-ink": ink,
    "--mph-sans": SANS_STACK,
    "--mph-display": DISPLAY_STACK,
    height,
    minHeight,
  } as React.CSSProperties

  const pillInner = (
    <>
      {seeking}
      <em aria-hidden="true">→</em>
    </>
  )

  return (
    <div ref={rootRef} className={"mph-root" + (className ? " " + className : "")} style={vars}>
      <style>{CSS}</style>

      <svg className="mph-room" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.13">
          {ROOM.back.map((s, i) => (
            <line key={"b" + i} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} />
          ))}
          {ROOM.rays.map((s, i) => (
            <line key={"r" + i} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} />
          ))}
          {ROOM.depth.map((d, i) => (
            <path key={"d" + i} d={d} />
          ))}
        </g>
      </svg>

      <div className="mph-stage">
        <header className="mph-top">
          <span className="mph-index">
            <b>{index}</b>
            {discipline}
          </span>
          <span className="mph-tagline">{tagline}</span>
          <span className="mph-brace">
            {"{"}
            {collection[0]}/{collection[1]}
            {"}"}
          </span>
          <span className="mph-reel">
            <i aria-hidden="true" />
            <span>
              {reel[0]}
              <br />
              {reel[1]}
            </span>
          </span>
        </header>

        <span className="mph-rule mph-rule-l" aria-hidden="true" />
        <span className="mph-rule mph-rule-r" aria-hidden="true" />

        <h1 className="mph-h1" aria-label={[year, initials, line2, line3, word + bracketed].join(" ")}>
          <span className="mph-line" aria-hidden="true">
            {chars(year)}
            <svg className="mph-arrow" viewBox="0 0 100 100">
              <path d="M14 14 L84 84 M84 30 V84 H30" />
            </svg>
            {chars(initials)}
            <span className="mph-badge">
              {badge}
              <sup>@</sup>
            </span>
          </span>
          <span className="mph-line" aria-hidden="true">
            {chars(line2)}
          </span>
          <span className="mph-line" aria-hidden="true">
            {chars(l3Head)}
            <span className="mph-swash">
              <span className="mph-ch">{l3Tail}</span>
              <svg viewBox="0 0 255 72" preserveAspectRatio="none">
                <path
                  pathLength={1}
                  d="M6 44 C40 18 150 4 222 14 C262 20 258 48 214 58 C150 72 60 70 30 60 C10 53 20 40 60 34"
                />
              </svg>
            </span>
          </span>
          <span className="mph-line mph-l4" aria-hidden="true">
            {chars(word)}
            <span className="mph-vtag">
              <span>{verticalTag}</span>
              <i />
            </span>
            <span className="mph-bracket">
              <svg viewBox="0 0 100 120" preserveAspectRatio="none">
                <path className="mph-arc-t" vectorEffect="non-scaling-stroke" d="M4 16 Q50 -8 96 16" />
                <path className="mph-arc-b" vectorEffect="non-scaling-stroke" d="M4 104 Q50 128 96 104" />
              </svg>
              {bracketed}
            </span>
            <span className="mph-star">*</span>
          </span>
        </h1>

        <svg className="mph-curl" viewBox="0 0 100 100" aria-hidden="true">
          <path
            pathLength={1}
            d="M92 8 C70 6 52 22 58 40 C63 56 84 52 80 36 C76 22 50 30 40 48 C32 62 26 74 16 84 M14 66 L14 86 L34 86"
          />
        </svg>

        <div className="mph-pill">
          <span className="mph-pill-a">{seekingLabel}</span>
          {href ? (
            <a className="mph-pill-b" href={href}>
              {pillInner}
            </a>
          ) : (
            <span className="mph-pill-b" tabIndex={0}>
              {pillInner}
            </span>
          )}
        </div>

        <div className="mph-flower" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <path d={FLOWER} />
            <circle cx="60" cy="60" r="4" fill="none" stroke={ink} strokeWidth="2" />
          </svg>
        </div>

        <ul className="mph-services">
          {services.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        {/* CHARACTER: GIRL MASCOT WITH LONG HAIR, LIGHT BLUSH, NATURAL SMILE, NO CHOKER, BLUE CLOTHES & ORANGE BEANIE */}
        <button
          ref={charRef}
          type="button"
          className={"mph-char" + (happy ? " mph-happy" : "")}
          onClick={poke}
          aria-label="Say hi to Bhavya"
        >
          <svg viewBox={"0 0 " + CW + " " + CH} aria-hidden="true">
            <defs>
              <radialGradient id={id("shade")} cx="46%" cy="40%" r="62%">
                <stop offset="0.55" stopColor="#7a2e14" stopOpacity="0" />
                <stop offset="1" stopColor="#7a2e14" stopOpacity="0.32" />
              </radialGradient>
              <radialGradient id={id("hi")} cx="36%" cy="30%" r="42%">
                <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              {/* Light delicate blush */}
              <radialGradient id={id("blush")}>
                <stop offset="0" stopColor="#ff7085" stopOpacity="0.45" />
                <stop offset="0.7" stopColor="#ff7085" stopOpacity="0.12" />
                <stop offset="1" stopColor="#ff7085" stopOpacity="0" />
              </radialGradient>
              {/* Orange beanie knit gradient */}
              <radialGradient id={id("knit")} cx="38%" cy="22%" r="80%">
                <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
                <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity="0.3" />
              </radialGradient>
              <radialGradient id={id("sclera")} cx="50%" cy="45%" r="65%">
                <stop offset="0.75" stopColor="#ffffff" />
                <stop offset="1" stopColor="#e9e2db" />
              </radialGradient>
              <radialGradient id={id("iris")} cx="42%" cy="36%" r="65%">
                <stop offset="0" stopColor="#553a2a" />
                <stop offset="0.55" stopColor="#332015" />
                <stop offset="1" stopColor="#120b07" />
              </radialGradient>
              <radialGradient id={id("nose")} cx="42%" cy="36%" r="66%">
                <stop offset="0" stopColor="#ff9c82" stopOpacity="0.18" />
                <stop offset="1" stopColor="#b8583a" stopOpacity="0.38" />
              </radialGradient>
              <linearGradient id={id("neck")} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#6b2a14" stopOpacity="0.38" />
                <stop offset="0.5" stopColor="#6b2a14" stopOpacity="0.06" />
              </linearGradient>
              <linearGradient id={id("cloth")} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity="0.15" />
                <stop offset="1" stopColor="#000" stopOpacity="0.22" />
              </linearGradient>
              <linearGradient id={id("hairFlow")} x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0" stopColor="#442e22" />
                <stop offset="0.45" stopColor="#2c1d15" />
                <stop offset="1" stopColor="#160e0a" />
              </linearGradient>
              <clipPath id={id("cuff")}>
                <path d="M114 262 Q300 222 486 262 L490 322 Q300 286 110 322 Z" />
              </clipPath>
            </defs>

            {/* Floor Contact Shadow */}
            <ellipse cx="300" cy="712" rx="250" ry="16" fill="#000" opacity="0.08" />
            <g ref={set("body")}>
              {/* Blue top */}
              <path d="M28 730 C40 646 104 604 206 588 L394 588 C496 604 560 646 572 730 Z" fill={shirt} />
              <path d="M28 730 C40 646 104 604 206 588 L394 588 C496 604 560 646 572 730 Z" fill={u("cloth")} />
              {/* Clean natural neck without choker */}
              <path d="M246 500 L354 500 L360 600 Q300 622 240 600 Z" fill={skin} />
              <path d="M246 500 L354 500 L360 600 Q300 622 240 600 Z" fill={u("neck")} />
              {/* Blue tee neckline & collar seams */}
              <path d="M234 586 Q300 624 366 586 L372 600 Q300 640 228 600 Z" fill="#1b52aa" />
              <path d="M236 590 Q300 626 364 590" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity={0.65} />
            </g>

            {/* HEAD & FACIAL FEATURES */}
            <g ref={set("head")}>
              {/* 1. CLEAN BACK HAIR (back of skull only, no side strands) */}
              <g ref={set("hairBack")}>
                {/* Back-of-head hair cap — stays behind the face, no dangling sides */}
                <path
                  d="M178 560
                     C162 480 158 390 178 320
                     C196 256 244 218 300 218
                     C356 218 404 256 422 320
                     C442 390 438 480 422 560
                     C400 640 380 700 300 720
                     C220 700 200 640 178 560 Z"
                  fill={u("hairFlow")}
                />
                {/* Subtle edge shading left */}
                <path
                  d="M178 560 C162 480 158 390 178 320 C170 390 168 480 182 560 C192 620 210 670 240 700 C210 670 190 630 178 560 Z"
                  fill="#160e0a"
                  opacity={0.28}
                />
                {/* Subtle edge shading right */}
                <path
                  d="M422 560 C438 480 442 390 422 320 C430 390 432 480 418 560 C408 620 390 670 360 700 C390 670 410 630 422 560 Z"
                  fill="#160e0a"
                  opacity={0.28}
                />
              </g>

              {/* Ears with dainty golden hoops */}
              <g ref={set("earL")}>
                <ellipse cx="140" cy="382" rx="42" ry="54" fill={skin} />
                <ellipse cx="140" cy="382" rx="42" ry="54" fill={u("shade")} />
                <path d="M152 352 Q122 364 128 394 Q134 416 152 414" fill="none" stroke="#a24c2e" strokeOpacity="0.3" strokeWidth="5" strokeLinecap="round" />
                <ellipse cx="138" cy="392" rx="20" ry="18" fill={u("blush")} />
                <ellipse cx="134" cy="426" rx="9" ry="13" fill="none" stroke="#ffd152" strokeWidth="3.5" />
                <circle cx="134" cy="439" r="2.5" fill="#ffeaa7" />
              </g>
              <g ref={set("earR")}>
                <ellipse cx="460" cy="382" rx="42" ry="54" fill={skin} />
                <ellipse cx="460" cy="382" rx="42" ry="54" fill={u("shade")} />
                <path d="M448 352 Q478 364 472 394 Q466 416 448 414" fill="none" stroke="#a24c2e" strokeOpacity="0.3" strokeWidth="5" strokeLinecap="round" />
                <ellipse cx="462" cy="392" rx="20" ry="18" fill={u("blush")} />
                <ellipse cx="466" cy="426" rx="9" ry="13" fill="none" stroke="#ffd152" strokeWidth="3.5" />
                <circle cx="466" cy="439" r="2.5" fill="#ffeaa7" />
              </g>

              {/* Smooth original face / skull oval */}
              <path d="M300 150 C402 150 468 226 468 348 C468 472 394 560 300 560 C206 560 132 472 132 348 C132 226 198 150 300 150 Z" fill={skin} />
              <path d="M300 150 C402 150 468 226 468 348 C468 472 394 560 300 560 C206 560 132 472 132 348 C132 226 198 150 300 150 Z" fill={u("shade")} />

              {/* LIGHT BLUSH ON CHEEKS */}
              <g ref={set("blush")}>
                <ellipse cx="196" cy="428" rx={happy ? 46 : 40} ry={happy ? 26 : 22} fill={u("blush")} />
                <ellipse cx="404" cy="428" rx={happy ? 46 : 40} ry={happy ? 26 : 22} fill={u("blush")} />
              </g>

              {/* FACE DETAILS */}
              <g ref={set("face")}>
                {/* Natural Eyebrows */}
                <g ref={set("brows")}>
                  <path d={happy ? "M204 288 Q236 268 268 282" : "M204 294 Q236 276 268 288"} fill="none" stroke="#2c1a12" strokeWidth="13" strokeLinecap="round" />
                  <path d={happy ? "M332 282 Q364 268 396 288" : "M332 288 Q364 276 396 294"} fill="none" stroke="#2c1a12" strokeWidth="13" strokeLinecap="round" />
                </g>

                {/* Expressive Eyes */}
                <g ref={set("eyes")}>
                  {happy ? (
                    <>
                      <path d="M214 354 Q240 320 266 354" fill="none" stroke="#111" strokeWidth="12" strokeLinecap="round" />
                      <path d="M212 346 L204 338 M268 346 L276 338" stroke="#111" strokeWidth="4" strokeLinecap="round" />
                      <path d="M334 354 Q360 320 386 354" fill="none" stroke="#111" strokeWidth="12" strokeLinecap="round" />
                      <path d="M332 346 L324 338 M388 346 L396 338" stroke="#111" strokeWidth="4" strokeLinecap="round" />
                    </>
                  ) : (
                    <>
                      {/* Left Eye */}
                      <g>
                        <ellipse cx="240" cy="350" rx="27" ry="21" fill={u("sclera")} />
                        <path d="M214 348 Q240 334 266 348 C266 340 240 332 214 348 Z" fill="#2a1810" opacity={0.12} />
                        <ellipse cx="240" cy="350" rx="14.5" ry="15" fill={u("iris")} />
                        <circle cx="240" cy="350" r="14" fill="none" stroke="#22140c" strokeWidth="1" />
                        <circle cx="240" cy="350" r="7.5" fill="#0c0704" />
                        <circle cx="235" cy="344" r="3.5" fill="#ffffff" />
                        <circle cx="245" cy="355" r="1.8" fill="#ffffff" opacity={0.8} />
                        <path d="M212 346 Q240 324 268 342" fill="none" stroke="#16100c" strokeWidth="5.5" strokeLinecap="round" />
                        <path d="M213 342 L203 332 M221 332 L215 320 M265 338 L275 328" stroke="#16100c" strokeWidth="3" strokeLinecap="round" />
                      </g>
                      {/* Right Eye */}
                      <g>
                        <ellipse cx="360" cy="350" rx="27" ry="21" fill={u("sclera")} />
                        <path d="M334 348 Q360 334 386 348 C386 340 360 332 334 348 Z" fill="#2a1810" opacity={0.12} />
                        <ellipse cx="360" cy="350" rx="14.5" ry="15" fill={u("iris")} />
                        <circle cx="360" cy="350" r="14" fill="none" stroke="#22140c" strokeWidth="1" />
                        <circle cx="360" cy="350" r="7.5" fill="#0c0704" />
                        <circle cx="355" cy="344" r="3.5" fill="#ffffff" />
                        <circle cx="365" cy="355" r="1.8" fill="#ffffff" opacity={0.8} />
                        <path d="M332 342 Q360 324 388 346" fill="none" stroke="#16100c" strokeWidth="5.5" strokeLinecap="round" />
                        <path d="M387 342 L397 332 M379 332 L385 320 M335 338 L325 328" stroke="#16100c" strokeWidth="3" strokeLinecap="round" />
                      </g>
                    </>
                  )}
                </g>

                {/* Star beauty mark */}
                <path d="M414 378 L417 386 L425 386.5 L418.5 391.5 L421 399.5 L414 395 L407 399.5 L409.5 391.5 L403 386.5 L411 386 Z" fill="#2a1a14" />

                {/* NATURAL WARM SMILE */}
                <g>
                  {/* Subtle natural lip contour */}
                  <path d="M252 458 Q274 454 300 456 Q326 454 348 458 Q328 464 300 465 Q272 464 252 458 Z" fill="#db747f" />
                  <path d="M256 461 Q300 465 344 461 Q336 478 300 480 Q264 478 256 461 Z" fill="#e88590" />
                  <ellipse cx="300" cy="470" rx="14" ry="4" fill="#ffffff" opacity="0.32" />
                  {/* Natural upturned smile seam */}
                  <path d="M250 458 Q300 466 350 458" fill="none" stroke="#682026" strokeWidth="3" strokeLinecap="round" />
                  <path d="M248 455 Q245 460 250 463 M352 455 Q355 460 350 463" fill="none" stroke="#8a3038" strokeWidth="2" strokeLinecap="round" />
                  <ellipse cx="300" cy="487" rx="14" ry="3.5" fill="#a24c2e" opacity="0.18" />
                </g>

                {/* Cute Button Nose */}
                <g ref={set("nose")}>
                  <ellipse cx="300" cy="412" rx="22" ry="9" fill="#6b2a14" opacity="0.14" />
                  <ellipse cx="300" cy="398" rx="22" ry="20" fill={skin} />
                  <ellipse cx="300" cy="398" rx="22" ry="20" fill={u("nose")} />
                  <ellipse cx="293" cy="390" rx="8" ry="6" fill="#fff" opacity="0.5" />
                </g>
              </g>

              {/* CURTAIN BANGS — multiple strands fanning from centre toward each ear */}
              <g ref={set("hair")}>
                {/* ── LEFT SIDE: strands sweep from centre parting toward left ear ── */}
                {/* Strand L1 — innermost, barely leaves centre */}
                <path
                  d="M292 242 C286 268 278 298 272 318 C268 330 262 330 260 316 C258 298 264 268 274 244 Z"
                  fill={hairColor}
                />
                {/* Strand L2 */}
                <path
                  d="M284 240 C272 270 256 308 244 336 C238 350 230 348 230 332 C230 310 244 272 262 242 Z"
                  fill={hairColor}
                />
                {/* Strand L3 */}
                <path
                  d="M276 238 C256 272 232 318 214 352 C206 368 196 364 198 346 C200 322 222 278 250 240 Z"
                  fill={hairColor}
                />
                {/* Strand L4 — outermost, reaches near left ear */}
                <path
                  d="M268 236 C240 274 208 330 186 372 C176 390 164 384 168 364 C172 338 204 282 240 238 Z"
                  fill={hairColor}
                />

                {/* ── RIGHT SIDE: mirror strands toward right ear ── */}
                {/* Strand R1 — innermost */}
                <path
                  d="M308 242 C314 268 322 298 328 318 C332 330 338 330 340 316 C342 298 336 268 326 244 Z"
                  fill={hairColor}
                />
                {/* Strand R2 */}
                <path
                  d="M316 240 C328 270 344 308 356 336 C362 350 370 348 370 332 C370 310 356 272 338 242 Z"
                  fill={hairColor}
                />
                {/* Strand R3 */}
                <path
                  d="M324 238 C344 272 368 318 386 352 C394 368 404 364 402 346 C400 322 378 278 350 240 Z"
                  fill={hairColor}
                />
                {/* Strand R4 — outermost, reaches near right ear */}
                <path
                  d="M332 236 C360 274 392 330 414 372 C424 390 436 384 432 364 C428 338 396 282 360 238 Z"
                  fill={hairColor}
                />

                {/* ── Subtle dark shade lines to give each strand depth ── */}
                <path d="M272 248 C264 278 258 310 256 330" fill="none" stroke="#24160e" strokeWidth={2} strokeLinecap="round" opacity={0.45} />
                <path d="M248 248 C236 282 224 318 214 350" fill="none" stroke="#24160e" strokeWidth={2} strokeLinecap="round" opacity={0.4} />
                <path d="M222 248 C208 284 192 324 180 360" fill="none" stroke="#24160e" strokeWidth={2} strokeLinecap="round" opacity={0.35} />
                <path d="M328 248 C336 278 342 310 344 330" fill="none" stroke="#24160e" strokeWidth={2} strokeLinecap="round" opacity={0.45} />
                <path d="M352 248 C364 282 376 318 386 350" fill="none" stroke="#24160e" strokeWidth={2} strokeLinecap="round" opacity={0.4} />
                <path d="M378 248 C392 284 408 324 420 360" fill="none" stroke="#24160e" strokeWidth={2} strokeLinecap="round" opacity={0.35} />
              </g>

              {/* ORANGE BEANIE CAP */}
              <g ref={set("beanie")}>
                <g transform="translate(0 -22)">
                  {/* Orange dome */}
                  <path d="M126 300 C112 168 196 88 300 88 C404 88 488 168 474 300 Z" fill={beanie} />
                  <path d="M126 300 C112 168 196 88 300 88 C404 88 488 168 474 300 Z" fill={u("knit")} />
                  {/* Orange folded cuff */}
                  <path d="M114 262 Q300 222 486 262 L490 322 Q300 286 110 322 Z" fill={beanie} />
                  <g clipPath={u("cuff")} stroke="#fff" strokeOpacity={0.12} strokeWidth={5}>
                    {Array.from({ length: 34 }, (_, i) => (
                      <line key={i} x1={112 + i * 11.4} y1="220" x2={112 + i * 11.4} y2="330" />
                    ))}
                  </g>
                  {/* Beanie depth shadow under cuff */}
                  <path d="M114 262 Q300 222 486 262 L490 322 Q300 286 110 322 Z" fill="#000" opacity={0.16} />
                  <path d="M112 292 Q300 254 488 292" fill="none" stroke="#000" strokeOpacity={0.22} strokeWidth={3} />

                  {/* Leather Tag with stitched accent */}
                  <g ref={set("tag")} className="mph-tagwig">
                    <g transform="rotate(-7 190 272)">
                      <rect x="172" y="238" width="36" height="64" rx="5" fill={tag} />
                      <rect x="172" y="238" width="36" height="64" rx="5" fill={u("cloth")} />
                      <rect x="177" y="243" width="26" height="54" rx="3" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth={1.6} strokeDasharray="3 3" />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </svg>
          <span className="mph-bubble" data-on={happy ? "true" : "false"} aria-live="polite">
            {greeting}
          </span>
        </button>
      </div>
    </div>
  )
}
