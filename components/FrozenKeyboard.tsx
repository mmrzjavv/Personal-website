"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
} from "@react-three/drei";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSeason } from "@/components/SeasonProvider";
import { useLanguage } from "@/components/LanguageProvider";
import * as THREE from "three";
import {
  SKILL_FOCUS_EVENT,
  SKILL_HOVER_EVENT,
  SKILLS_GRID,
  type SkillIcon,
} from "@/lib/skills";

// Per-section keyboard "states" — same idea as Naresh's animated-background-
// config.ts, but for our R3F keyboard. Values are tweened toward via lerp
// inside useFrame; the active section is detected via IntersectionObserver
// on elements carrying data-kb-section.
type KeyboardState = {
  yaw: number; // rotation.y
  pitch: number; // rotation.x
  roll: number; // rotation.z
  posX: number;
  posY: number;
  posZ: number;
  scale: number;
};

const SECTION_STATES: Record<string, KeyboardState> = {
  hero: {
    yaw: Math.PI * 0.15,
    pitch: Math.PI * 0.18,
    roll: Math.PI * 0.025,
    posX: 2.2,
    posY: 0,
    posZ: 0,
    scale: 1,
  },
  stack: {
    yaw: Math.PI * 0.2,
    pitch: Math.PI * 0.1,
    roll: 0.04,
    posX: 2.6,
    posY: 0.1,
    posZ: 0,
    scale: 1.05,
  },
  // Keep keyboard off-canvas while browsing projects.
  project1: { yaw: 0, pitch: 0, roll: 0, posX: 10, posY: 6, posZ: -8, scale: 0.01 },
  project2: { yaw: 0, pitch: 0, roll: 0, posX: 10, posY: 6, posZ: -8, scale: 0.01 },
  project3: { yaw: 0, pitch: 0, roll: 0, posX: 10, posY: 6, posZ: -8, scale: 0.01 },
  project4: { yaw: 0, pitch: 0, roll: 0, posX: 10, posY: 6, posZ: -8, scale: 0.01 },
  project5: { yaw: 0, pitch: 0, roll: 0, posX: 10, posY: 6, posZ: -8, scale: 0.01 },
  experience: {
    yaw: Math.PI * 0.3,
    pitch: Math.PI * 0.08,
    roll: 0,
    posX: 0,
    posY: 0.05,
    posZ: 0,
    scale: 0.95,
  },
  // Contact — mirrors the hero pose (same yaw/pitch/roll and scale) but
  // pushed to the right so the "¿Hablamos?" copy can sit on the left. The
  // Keyboard component also reuses the hero-style cinematic idle swing
  // while this section is active.
  contact: {
    yaw: Math.PI * 0.15,
    pitch: Math.PI * 0.18,
    roll: Math.PI * 0.025,
    posX: 1.4,
    posY: 0,
    posZ: 0,
    scale: 1,
  },
};

// Mobile lives in the hero only (the canvas scrolls away with it), so there is
// no per-section choreography — the keyboard sits centered with a permanent
// cinematic idle swing and reacts to taps instead of hover.
const MOBILE_STATE: KeyboardState = {
  yaw: Math.PI * 0.08,
  pitch: Math.PI * 0.12,
  roll: 0.02,
  posX: 0,
  posY: -0.1,
  posZ: 0,
  scale: 1.38,
};

// Track which data-kb-section element is currently most prominent on-screen.
// Returns the section id (React state, for conditional overlay rendering) +
// a mutable Set of "highlighted" keyboard slugs read off the same element's
// data-kb-highlights attribute. The Set is a ref so per-frame reads inside
// useFrame don't trigger re-renders — Keycap mutates position/emissive
// based on `highlightsRef.current.has(slug)`.
function useActiveSection(): [
  string,
  React.RefObject<string>,
  React.RefObject<Set<string>>
] {
  const [section, setSection] = useState<string>("hero");
  const ref = useRef<string>("hero");
  const highlightsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const visibility = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target, entry.intersectionRatio);
        }
        let bestRatio = 0;
        let bestEl: HTMLElement | null = null;
        let bestSection = ref.current;
        for (const [el, ratio] of visibility) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestEl = el as HTMLElement;
            bestSection = bestEl.dataset.kbSection ?? bestSection;
          }
        }
        // Always refresh highlights from the most-visible element, even if
        // the section id didn't change — lets page tweak highlights by
        // updating just the data attribute.
        const raw = bestEl?.dataset.kbHighlights ?? "";
        highlightsRef.current = new Set(
          raw.split(",").map((s) => s.trim()).filter(Boolean)
        );
        if (bestSection !== ref.current) {
          ref.current = bestSection;
          setSection(bestSection);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    const targets = document.querySelectorAll<HTMLElement>("[data-kb-section]");
    targets.forEach((el) => observer.observe(el));
    const mutations = new MutationObserver(() => {
      document.querySelectorAll<HTMLElement>("[data-kb-section]").forEach((el) => observer.observe(el));
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, []);
  return [section, ref, highlightsRef];
}

// Taglines are now resolved via the i18n dictionary (keyboard.taglines.<slug>),
// keyed by the simple-icons slug on each key. See lib/i18n.ts.

function makeRoundedRectShape(
  width: number,
  depth: number,
  cornerRadius: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const w = width / 2;
  const d = depth / 2;
  const r = Math.min(cornerRadius, w, d);
  shape.moveTo(-w + r, -d);
  shape.lineTo(w - r, -d);
  shape.quadraticCurveTo(w, -d, w, -d + r);
  shape.lineTo(w, d - r);
  shape.quadraticCurveTo(w, d, w - r, d);
  shape.lineTo(-w + r, d);
  shape.quadraticCurveTo(-w, d, -w, d - r);
  shape.lineTo(-w, -d + r);
  shape.quadraticCurveTo(-w, -d, -w + r, -d);
  return shape;
}

function createExtrudedBox(
  width: number,
  depth: number,
  height: number,
  cornerRadius: number,
  bevelSize: number,
  topScale = 1
): THREE.BufferGeometry {
  const shape = makeRoundedRectShape(width, depth, cornerRadius);
  const extrudeDepth = Math.max(0.001, height - 2 * bevelSize);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: extrudeDepth,
    bevelEnabled: bevelSize > 0,
    bevelThickness: bevelSize,
    bevelSize: bevelSize,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 12,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -height / 2 + bevelSize, 0);

  if (topScale !== 1) {
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = (y + height / 2) / height;
      const factor = THREE.MathUtils.lerp(1, topScale, t);
      pos.setX(i, pos.getX(i) * factor);
      pos.setZ(i, pos.getZ(i) * factor);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  return geometry;
}

// Render a simple-icons SVG path into a square CanvasTexture.
function makeIconTexture(
  svgPath: string,
  color: string,
  size = 256
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);

  const iconTargetSize = Math.round(size * 0.62);
  const scale = iconTargetSize / 24;
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.scale(scale, scale);
  ctx.translate(-12, -12);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(svgPath));
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = size >= 128 ? 2 : 1;
  tex.generateMipmaps = size >= 128;
  tex.minFilter = size >= 128 ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

const SKILLS = SKILLS_GRID;

const COLS = 5;
const ROWS = 3;
const KEYCAP_SIZE = 0.4;
const KEYCAP_HEIGHT = 0.28;
const KEYCAP_TOP_SCALE = 0.78;
const COL_SPACING = 0.42;
const ROW_SPACING = 0.42;
const BASE_WIDTH = 2.4;
const BASE_DEPTH = 1.4;
const BASE_HEIGHT = 0.26;
const ICON_PLANE_SIZE = KEYCAP_SIZE * KEYCAP_TOP_SCALE * 0.78;
const PRESS_DEPTH = 0.15;

let audioCtx: AudioContext | null = null;
let audioUnlockInstalled = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  audioCtx = new Ctor();
  return audioCtx;
}

function installAudioUnlock() {
  if (audioUnlockInstalled || typeof window === "undefined") return;
  audioUnlockInstalled = true;
  const unlock = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const state = ctx.state as string;
    if (state === "suspended" || state === "interrupted") {
      void ctx.resume().catch(() => {});
    }
    void loadKeySounds(ctx);
  };
  window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  window.addEventListener("keydown", unlock, { capture: true, passive: true });
  window.addEventListener("touchstart", unlock, { capture: true, passive: true });
}

const KEY_SOUND_URLS = [
  "/sounds/switch_press.mp3",
  "/sounds/switch_release.mp3",
] as const;
const keySoundBuffers: (AudioBuffer | null)[] = [null, null];
let keySoundsLoading: Promise<void> | null = null;

function loadKeySounds(ctx: AudioContext): Promise<void> {
  if (keySoundsLoading) return keySoundsLoading;
  keySoundsLoading = Promise.all(
    KEY_SOUND_URLS.map((url, i) =>
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((buf) => ctx.decodeAudioData(buf))
        .then((decoded) => {
          keySoundBuffers[i] = decoded;
        })
        .catch(() => {})
    )
  ).then(() => undefined);
  return keySoundsLoading;
}

function playSynthKeyClick(ctx: AudioContext, seed: number) {
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const frequency = 980 + (seed % 5) * 55;
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(420, now + 0.045);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.06);
}

function playKeyClick(seed = 0) {
  const ctx = getAudioContext();
  if (!ctx) return;
  installAudioUnlock();
  void loadKeySounds(ctx);

  const trigger = () => {
    const available = keySoundBuffers.filter(
      (b): b is AudioBuffer => b !== null
    );
    if (available.length === 0) {
      playSynthKeyClick(ctx, seed);
      return;
    }
    const buffer = available[Math.floor(Math.random() * available.length)];
    const detune =
      1 + (((seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.08;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = detune;
    const gain = ctx.createGain();
    gain.gain.value = 0.55;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  };

  const run = () => {
    try {
      trigger();
    } catch {
      // Audio failure must never break the 3D scene.
    }
  };

  const state = ctx.state as string;
  const resume =
    state === "suspended" || state === "interrupted"
      ? ctx.resume()
      : Promise.resolve();
  void resume.then(run).catch(() => {});
}

function Keycap({
  geometry,
  position,
  soundSeed,
  isMobile,
  icon,
  onHoverChange,
  hovered,
  highlightsRef,
  activeSectionRef,
  wavePhase,
  accent,
}: {
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  soundSeed: number;
  isMobile: boolean;
  icon: SkillIcon;
  onHoverChange: (hovered: boolean) => void;
  hovered: boolean;
  // Reactive set of slugs to animate; read every frame so we don't force
  // re-renders when the active project changes.
  highlightsRef: React.RefObject<Set<string>>;
  // Current section id (ref so we don't re-render when it flips). Used by
  // the contact section to trigger idle random bobs.
  activeSectionRef: React.RefObject<string>;
  // Per-key phase so neighbouring highlighted keys bob out of sync and
  // look like a wave rather than a synchronised jump.
  wavePhase: number;
  // Season accent colour — highlighted keys glow in this colour, so the
  // bouncing keys feel "part of" the current theme.
  accent: string;
}) {
  const pressRef = useRef<THREE.Group>(null);
  const pressY = useRef(0);
  const liftAmp = useRef(0); // smoothed 0..1 gate for the bounce + glow
  const contactAmp = useRef(0); // smoothed 0..1 gate for the random idle bob
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const baseEmissive = 0.3;

  // Each key gets its own random frequency + phase, stable across re-renders
  // so every keycap's random bob feels independent (no synchronised wave).
  // Sampled once at mount.
  const randomBob = useMemo(
    () => ({
      freq: 0.6 + Math.random() * 0.6, // 0.6..1.2 Hz-ish
      phase: Math.random() * Math.PI * 2,
      threshold: 0.45 + Math.random() * 0.2, // 0.45..0.65 — higher = rarer pop
    }),
    []
  );

  const iconTexture = useMemo(
    () => makeIconTexture(icon.path, `#${icon.hex}`, isMobile ? 160 : 256),
    [icon.path, icon.hex, isMobile]
  );

  // Stable THREE.Color objects so useFrame can lerp in place (no garbage
  // per-tick). Recomputed whenever the season accent changes.
  const whiteColor = useMemo(() => new THREE.Color("#ffffff"), []);
  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);
  // Tinted white for the plastic body — keeps the "white keycap with a
  // hint of the season" look without going cartoonishly saturated.
  const bodyTint = useMemo(() => {
    const c = new THREE.Color(accent);
    c.lerp(whiteColor, 0.25);
    return c;
  }, [accent, whiteColor]);

  useEffect(() => {
    return () => iconTexture.dispose();
  }, [iconTexture]);

  useFrame((state) => {
    if (!pressRef.current) return;
    const pressed = hovered ? -PRESS_DEPTH : 0;
    const t = state.clock.elapsedTime;

    // Project wave: 1 while this key's slug is in the active section's
    // highlights, fading out when it leaves. Produces the synchronised
    // travelling bounce on project sections.
    const isHighlighted =
      highlightsRef.current?.has(icon.slug) ?? false;
    const isProject = activeSectionRef.current.startsWith("project");

    // Project sections keep the keyboard as a quiet visual backdrop. Once a
    // highlight has settled there is no reason to update every key's
    // position, colour and emissive material on every frame.
    if (
      isProject &&
      !hovered &&
      !isHighlighted &&
      liftAmp.current < 0.01 &&
      contactAmp.current < 0.01
    ) {
      return;
    }
    liftAmp.current = THREE.MathUtils.lerp(
      liftAmp.current,
      isHighlighted ? 1 : 0,
      0.08
    );
    const bob =
      Math.sin(t * 2.2 + wavePhase) * 0.14 * liftAmp.current;

    // Contact idle: each keycap pops up at its own random cadence. We use
    // a thresholded sine so every key spends most of its time at rest and
    // only jumps briefly when its sine crosses the threshold — creates the
    // Naresh-style "random keys popping" effect without anything global.
    const isContact = activeSectionRef.current === "contact";
    contactAmp.current = THREE.MathUtils.lerp(
      contactAmp.current,
      isContact ? 1 : 0,
      0.06
    );
    const sineRaw = Math.sin(t * randomBob.freq + randomBob.phase);
    const popRaw = Math.max(0, sineRaw - randomBob.threshold);
    // Normalise the pop so keys with higher thresholds don't end up flat.
    const popNorm = popRaw / (1 - randomBob.threshold);
    const randomPop = popNorm * 0.18 * contactAmp.current;

    const target = pressed + bob + randomPop;
    pressY.current = THREE.MathUtils.lerp(pressY.current, target, 0.22);
    pressRef.current.position.y = pressY.current;

    if (matRef.current) {
      // Emissive intensity pulses with the bob so glow brightens on the
      // upswing of the wave.
      const pulse = (bob / 0.14 + 1) * 0.5; // 0..1 from the sine
      const targetIntensity =
        baseEmissive + liftAmp.current * (0.45 + pulse * 0.55);
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity,
        targetIntensity,
        0.15
      );
      // Emissive COLOUR lerps white → season accent so highlighted keys
      // glow in the current theme (blue in winter, green in spring, …).
      matRef.current.emissive
        .copy(whiteColor)
        .lerp(accentColor, liftAmp.current);
      // Body tint pushes clearly toward the accent so the key reads as
      // "tinted white" (e.g. an icy blue-white in winter) rather than pure
      // plastic when lifted.
      matRef.current.color
        .copy(whiteColor)
        .lerp(bodyTint, liftAmp.current);
    }
  });

  const playThisKey = useCallback(() => {
    playKeyClick(soundSeed);
  }, [soundSeed]);

  const handleOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      playThisKey();
      onHoverChange(true);
    },
    [onHoverChange, playThisKey]
  );
  const handleOut = useCallback(() => onHoverChange(false), [onHoverChange]);

  const handleDown = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      playThisKey();
      onHoverChange(true);
    },
    [onHoverChange, playThisKey]
  );
  const handleUp = useCallback(() => onHoverChange(false), [onHoverChange]);

  const iconY = KEYCAP_HEIGHT / 2 + 0.0015;

  return (
    <group position={position}>
      <group ref={pressRef}>
        <mesh
          geometry={geometry}
          onPointerOver={isMobile ? undefined : handleOver}
          onPointerOut={isMobile ? undefined : handleOut}
          onPointerDown={handleDown}
          onPointerUp={isMobile ? handleUp : undefined}
          onPointerCancel={isMobile ? handleUp : undefined}
        >
          <meshStandardMaterial
            ref={matRef}
            color="#ffffff"
            roughness={isMobile ? 0.48 : 0.34}
            metalness={0}
            emissive="#ffffff"
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh
          position={[0, iconY, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <planeGeometry args={[ICON_PLANE_SIZE, ICON_PLANE_SIZE]} />
          <meshBasicMaterial
            map={iconTexture}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function Keyboard({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const isMobile = mobile;
  const { palette } = useSeason();
  const { lang } = useLanguage();
  const [activeSection, activeSectionRef, highlightsRef] = useActiveSection();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null);
  // Mutable holders for the smoothed target — kept off React state so
  // useFrame can read them every tick without triggering re-renders.
  const current = useRef<KeyboardState>({ ...SECTION_STATES.hero });
  // Accumulated spin (radians) added on top of the target yaw while it
  // decays to zero — produces a flip between project sections.
  const spinRef = useRef(0);
  const prevSectionId = useRef<string>("hero");

  // When scrolling between two project sections, kick off a spin. Direction
  // alternates per target project so consecutive flips don't look identical.
  useEffect(() => {
    if (mobile) return; // no project→project flips on mobile (hero-only)
    const prev = prevSectionId.current;
    prevSectionId.current = activeSection;
    if (prev === activeSection) return;
    const wasProject = prev.startsWith("project");
    const isProject = activeSection.startsWith("project");
    if (!wasProject || !isProject) return;
    const n = parseInt(activeSection.replace("project", ""), 10) || 0;
    const dir = n % 2 === 0 ? 1 : -1;
    spinRef.current += Math.PI * 2 * dir;
  }, [activeSection, mobile]);

  // DOM skill chips can focus a keycap — keep the 3D highlight in sync.
  useEffect(() => {
    const onFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ slug: string | null }>).detail;
      setFocusedSlug(detail?.slug ?? null);
    };
    window.addEventListener(SKILL_FOCUS_EVENT, onFocus as EventListener);
    return () => window.removeEventListener(SKILL_FOCUS_EVENT, onFocus as EventListener);
  }, []);

  const hoveredIcon = useMemo(() => {
    if (hoveredKey) {
      const [r, c] = hoveredKey.split("-").map(Number);
      return SKILLS[r]?.[c] ?? null;
    }
    if (focusedSlug) {
      for (const row of SKILLS) {
        const match = row.find((skill) => skill.slug === focusedSlug);
        if (match) return match;
      }
    }
    return null;
  }, [hoveredKey, focusedSlug]);

  // Broadcast hovered/focused skill so the stack panel can mirror it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent(SKILL_HOVER_EVENT, {
        detail: { slug: hoveredIcon?.slug ?? null },
      })
    );
  }, [hoveredIcon]);

  // Drive the global cursor from the single Keyboard instance. The sound is
  // triggered directly by each key's pointer event so React state batching
  // cannot swallow rapid moves between adjacent keys.
  useEffect(() => {
    document.body.style.cursor = hoveredKey ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hoveredKey]);

  useEffect(() => {
    if (ref.current) ref.current.rotation.order = "YXZ";
  }, []);

  useEffect(() => {
    installAudioUnlock();
    const ctx = getAudioContext();
    if (ctx) void loadKeySounds(ctx);
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const target = mobile
      ? MOBILE_STATE
      : SECTION_STATES[activeSectionRef.current] ?? SECTION_STATES.hero;
    const targetPosX = lang === "fa" && !mobile ? -target.posX : target.posX;
    // Frame-rate-independent lerp: ~0.06 per 16ms tick = a satisfying ease.
    const k = 1 - Math.pow(0.001, delta);
    const c = current.current;
    c.yaw = THREE.MathUtils.lerp(c.yaw, target.yaw, k);
    c.pitch = THREE.MathUtils.lerp(c.pitch, target.pitch, k);
    c.roll = THREE.MathUtils.lerp(c.roll, target.roll, k);
    c.posX = THREE.MathUtils.lerp(c.posX, targetPosX, k);
    c.posY = THREE.MathUtils.lerp(c.posY, target.posY, k);
    c.posZ = THREE.MathUtils.lerp(c.posZ, target.posZ, k);
    c.scale = THREE.MathUtils.lerp(c.scale, target.scale, k);

    // Decay the project-transition spin frame-rate independently so the
    // flip settles at roughly the same pace regardless of refresh rate.
    spinRef.current *= Math.exp(-3.2 * delta);
    if (Math.abs(spinRef.current) < 0.003) spinRef.current = 0;
    // Normalised magnitude (0..1) — used for a subtle "pop" on scale & a
    // small hop on Y so the flip reads as a tiny jump-and-turn.
    const spinNorm = Math.min(1, Math.abs(spinRef.current) / (Math.PI * 2));

    // Idle motion layered on top. Hero and Contact share a wide cinematic
    // yoyo so the keyboard "shows itself"; other sections keep a quiet
    // breathing so the copy is easier to read.
    const isShowcase =
      mobile ||
      activeSectionRef.current === "hero" ||
      activeSectionRef.current === "contact";
    const yawSwing = isShowcase ? 0.5 : 0.025;
    const pitchSwing = isShowcase ? 0.07 : 0.0;
    const rollSwing = isShowcase ? 0.05 : 0.0;
    const period = isShowcase ? 9 : 20; // seconds per full cycle
    const w = (Math.PI * 2) / period;
    ref.current.rotation.y =
      c.yaw + Math.sin(t * w) * yawSwing + spinRef.current;
    ref.current.rotation.x = c.pitch + Math.sin(t * w * 0.6) * pitchSwing;
    ref.current.rotation.z = c.roll + Math.sin(t * w * 0.8) * rollSwing;
    ref.current.position.x = c.posX;
    ref.current.position.y =
      c.posY + Math.sin(t * 0.6) * 0.04 + spinNorm * 0.35;
    ref.current.position.z = c.posZ;
    ref.current.scale.setScalar(c.scale * (1 - spinNorm * 0.12));
  });

  const keycapGeom = useMemo(
    () =>
      createExtrudedBox(
        KEYCAP_SIZE,
        KEYCAP_SIZE,
        KEYCAP_HEIGHT,
        0.05,
        0.012,
        KEYCAP_TOP_SCALE
      ),
    []
  );
  const baseGeom = useMemo(
    () => createExtrudedBox(BASE_WIDTH, BASE_DEPTH, BASE_HEIGHT, 0.12, 0.02, 1),
    []
  );

  useEffect(() => {
    return () => {
      keycapGeom.dispose();
      baseGeom.dispose();
    };
  }, [keycapGeom, baseGeom]);

  const keycapY = BASE_HEIGHT / 2 + KEYCAP_HEIGHT / 2 + 0.005;
  const keycaps = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = (col - (COLS - 1) / 2) * COL_SPACING;
      const z = (row - (ROWS - 1) / 2) * ROW_SPACING;
      const id = `${row}-${col}`;
      const icon = SKILLS[row][col];
      // Phase staggered by grid position so highlighted keys look like a
      // travelling wave rather than a synchronised pulse. Constants tuned
      // by eye — any non-degenerate combo works, just avoid exact multiples
      // of 2π between neighbours.
      const wavePhase = row * 0.9 + col * 0.55;
      const isFocused = focusedSlug === icon.slug;
      keycaps.push(
        <Keycap
          key={id}
          geometry={keycapGeom}
          position={[x, keycapY, z]}
          soundSeed={row * COLS + col}
          isMobile={isMobile}
          icon={icon}
          hovered={hoveredKey === id || isFocused}
          highlightsRef={highlightsRef}
          activeSectionRef={activeSectionRef}
          wavePhase={wavePhase}
          accent={palette.accent}
          onHoverChange={(h) =>
            setHoveredKey((prev) => (h ? id : prev === id ? null : prev))
          }
        />
      );
    }
  }

  return (
    <>
      <group ref={ref}>
        <mesh geometry={baseGeom}>
          {/* Solid matte plastic — color prop controls the tone directly.
              No transmission/clearcoat so the white environment doesn't
              wash it out to grey. */}
          <meshStandardMaterial
            color={palette.keyboardBase}
            roughness={0.6}
            metalness={0}
          />
        </mesh>
        {keycaps}
      </group>
      {/* Callout lives OUTSIDE the animated keyboard group so the keyboard's
          yaw/pitch/scale don't warp the text. Placed in world space, to the
          left of the tilted keyboard, with its own matching isometric yaw +
          a small roll so the baseline rises left-to-right like Naresh's. */}
      {/* Skill copy now lives in the DOM stack panel for clearer reading
          and mobile parity — keep the 3D scene focused on the keyboard. */}
    </>
  );
}

export default function FrozenKeyboard({
  mobile = false,
}: {
  mobile?: boolean;
}) {
  return (
    <Canvas
      // Portrait gets a pulled-back, centered, less top-down camera so the
      // keyboard reads as a front-facing hero centerpiece instead of the
      // off-axis desktop composition.
      camera={
        mobile
          ? { position: [0, 1.05, 6.6], fov: 26 }
          : { position: [1.5, 3.6, 11], fov: 22 }
      }
      // Cap DPR on phones (full retina + Environment FBO was crashing WebGL).
      dpr={mobile ? [1, 1.75] : [1, 1.25]}
      gl={{
        antialias: true,
        alpha: true,
        depth: true,
        stencil: false,
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
      }}
      // pan-y keeps vertical page scroll alive on phones; "none" was trapping
      // every touch and making the portfolio feel frozen.
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        touchAction: mobile ? "pan-y" : "none",
      }}
      onCreated={({ gl }) => {
        gl.domElement.style.touchAction = mobile ? "pan-y" : "none";
        gl.domElement.style.position = "absolute";
        gl.domElement.style.inset = "0";
        gl.domElement.style.width = "100%";
        gl.domElement.style.height = "100%";
        const canvas = gl.domElement;
        const onLost = (e: Event) => {
          e.preventDefault();
          console.warn("WebGL context lost (keyboard)");
        };
        canvas.addEventListener("webglcontextlost", onLost, false);
      }}
    >
      {/* Canvas is transparent so the FrozenBackground (snow + aurora) shows
          through behind/around the keyboard. */}

      {/* Environment FBO is desktop-only — on phones it often exhausts the
          single WebGL budget and the whole keyboard fails to appear. */}
      {!mobile && (
        <Environment resolution={32} environmentIntensity={0.25}>
          <Lightformer
            intensity={1.1}
            color="#ffffff"
            position={[0, 6, -4]}
            rotation={[0, 0, 0]}
            scale={[12, 6, 1]}
          />
          <Lightformer
            intensity={0.7}
            color="#ffffff"
            position={[-6, 2, 2]}
            rotation={[0, Math.PI / 2, 0]}
            scale={[6, 4, 1]}
          />
          <Lightformer
            intensity={0.5}
            color="#ffffff"
            position={[6, 3, 1]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[6, 4, 1]}
          />
          <Lightformer
            intensity={0.35}
            color="#ffffff"
            position={[0, -4, 3]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[8, 8, 1]}
          />
        </Environment>
      )}
      {/* Naresh-style lighting: low ambient + strong single directional from
          upper-left gives crisp top-bright / sides-shadowed contrast. The
          hemisphere adds a subtle sky-ground gradient so the darkest faces
          still read as "the lower faces" instead of pitch-black. */}
      <ambientLight intensity={mobile ? 0.28 : 0.15} />
      <directionalLight position={[-5, 8, 3]} intensity={mobile ? 2.0 : 2.2} />
      <directionalLight
        position={[4, 3, 5]}
        intensity={mobile ? 0.55 : 0}
        color="#cfe0f5"
      />
      <hemisphereLight
        intensity={mobile ? 0.35 : 0.25}
        color="#eaf2fb"
        groundColor="#0a1428"
      />

      <Keyboard mobile={mobile} />

    </Canvas>
  );
}
