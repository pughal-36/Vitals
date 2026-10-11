'use client';

import { useEffect, useRef, useCallback } from 'react';

// ────────────────────────────────────────────────────────────────
// Vertex shader: a fullscreen triangle (covers the viewport).
// We don't need geometry — just two triangles that fill the screen.
// ────────────────────────────────────────────────────────────────
const VERT = /* glsl */ `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// ────────────────────────────────────────────────────────────────
// Fragment shader — this is where ALL the visual work happens.
// Each pixel runs this independently. ~75 lines of GLSL.
// ────────────────────────────────────────────────────────────────
const FRAG = /* glsl */ `
  precision mediump float;

  uniform float u_time;        // seconds since start — drives motion
  uniform vec2  u_resolution;  // canvas size in pixels
  uniform vec2  u_mouse;       // mouse position, 0..1 (smoothed on JS side)

  // ── Aurora palette (4 colors) ──
  // Deep navy, teal, soft violet, warm pink
  const vec3 COL_A = vec3(0.067, 0.106, 0.220);  // #111B38
  const vec3 COL_B = vec3(0.141, 0.518, 0.529);  // #248487
  const vec3 COL_C = vec3(0.455, 0.349, 0.608);  // #74599B
  const vec3 COL_D = vec3(0.824, 0.310, 0.498);  // #D24F7F

  // ── Simple noise helper ──
  // This generates pseudo-random values from a 2D coordinate.
  // It's a classic one-liner hash: dot the input with two big primes,
  // take the sine (which oscillates wildly), multiply by a large number,
  // and keep only the fractional part. Result: a "random" 0..1 float.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // ── Smooth value noise ──
  // Samples the hash at the 4 corners of a grid cell, then
  // blends them with smooth interpolation. This gives gentle,
  // cloud-like variation instead of sharp static.
  float noise(vec2 p) {
    vec2 i = floor(p);              // which grid cell
    vec2 f = fract(p);              // position inside the cell
    f = f * f * (3.0 - 2.0 * f);   // smoothstep curve (ease in-out)
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // ── Layered noise (fractal Brownian motion — fBm) ──
  // Stacks 3 layers of noise at increasing frequency & decreasing
  // amplitude. This creates complexity: big slow waves + smaller
  // fast ripples, like real clouds or aurora curtains.
  float fbm(vec2 p) {
    float v = 0.0;
    v += 0.50 * noise(p * 1.0);   // large, slow shapes
    v += 0.25 * noise(p * 2.0);   // medium detail
    v += 0.125 * noise(p * 4.0);  // fine ripples
    return v;
  }

  void main() {
    // ── Normalised coordinates ──
    // uv goes from 0..1 across the screen. We correct for aspect
    // ratio so circles look like circles, not ovals.
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 pos = vec2(uv.x * aspect, uv.y);

    // ── Mouse influence ──
    // Shift the noise sampling point toward the mouse. This makes
    // the aurora "lean" toward the cursor. The 0.3 multiplier keeps
    // the effect subtle — it's a gentle pull, not a warp.
    vec2 mouseOffset = (u_mouse - 0.5) * 0.3;
    pos += mouseOffset;

    // ── Animated noise field ──
    // Feed position + time into fBm. The time multipliers control
    // speed: 0.08 = slow horizontal drift, 0.12 = slow vertical rise.
    float t = u_time;
    float n1 = fbm(pos + vec2(t * 0.08, t * 0.12));
    float n2 = fbm(pos * 1.3 + vec2(-t * 0.06, t * 0.10) + 3.5);

    // ── Color mixing ──
    // Use the two noise values to blend between our 4 palette colors.
    // n1 picks between COL_A↔COL_B, n2 picks between COL_C↔COL_D,
    // then we blend those two pairs using a diagonal gradient.
    vec3 colorAB = mix(COL_A, COL_B, n1);
    vec3 colorCD = mix(COL_C, COL_D, n2);
    float blend = smoothstep(0.2, 0.8, uv.x * 0.5 + uv.y * 0.5);
    vec3 color = mix(colorAB, colorCD, blend);

    // ── Vignette (dark edges) ──
    // Darken the edges and corners so text in the centre stays
    // readable against the bright aurora. The 0.45/0.65 control
    // how far the darkening reaches; the 0.25 sets the minimum
    // brightness at the very edges.
    float vignette = smoothstep(0.0, 0.65, length(uv - 0.5) - 0.45);
    color = mix(color, color * 0.25, vignette);

    // ── Film grain ──
    // A subtle noise overlay that shifts every frame (using u_time).
    // Multiplied at 0.06 intensity so it's barely visible — just
    // enough to add texture and prevent banding on gradients.
    float grain = hash(uv * u_resolution + fract(t * 100.0)) * 0.06;
    color += grain - 0.03;  // centre around 0 so it lightens AND darkens

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ────────────────────────────────────────────────────────────────
// Helper: compile a shader and return it (or throw on error)
// ────────────────────────────────────────────────────────────────
function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

// ────────────────────────────────────────────────────────────────
// Helper: link vertex + fragment shaders into a program
// ────────────────────────────────────────────────────────────────
function createProgram(gl: WebGLRenderingContext, vert: WebGLShader, frag: WebGLShader): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }
  return program;
}

// ────────────────────────────────────────────────────────────────
// The React component
// ────────────────────────────────────────────────────────────────
export default function AuroraHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  // Smoothed mouse position (eased, not snapped)
  const mouseTarget = useRef({ x: 0.5, y: 0.5 });
  const mouseCurrent = useRef({ x: 0.5, y: 0.5 });

  // Check reduced-motion preference once
  const prefersReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── DPR capped at 2 ──
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // ── Get WebGL context ──
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) {
      console.warn('WebGL not available');
      return;
    }

    // ── Compile & link shaders ──
    const vertShader = createShader(gl, gl.VERTEX_SHADER, VERT);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = createProgram(gl, vertShader, fragShader);
    gl.useProgram(program);

    // ── Fullscreen quad geometry ──
    // Two triangles covering clip-space -1..1 on both axes
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // ── Uniform locations ──
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    // ── Resize handler ──
    function resize() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Mouse tracking ──
    function onMouseMove(e: MouseEvent) {
      mouseTarget.current.x = e.clientX / window.innerWidth;
      mouseTarget.current.y = 1.0 - e.clientY / window.innerHeight; // flip Y for GL
    }
    window.addEventListener('mousemove', onMouseMove);

    // ── Visibility change: pause when tab is hidden ──
    let paused = false;
    function onVisibility() {
      paused = document.hidden;
      if (!paused && !prefersReducedMotion()) {
        // Resume the animation loop when the tab becomes visible again
        startTime = performance.now() / 1000 - elapsedBeforePause;
        rafRef.current = requestAnimationFrame(frame);
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    // ── Animation loop ──
    let startTime = performance.now() / 1000;
    let elapsedBeforePause = 0;
    const reducedMotion = prefersReducedMotion();

    function frame() {
      if (paused) {
        // Store elapsed time so we can resume without a jump
        elapsedBeforePause = performance.now() / 1000 - startTime;
        return;
      }

      // Smooth the mouse position (ease toward target by 4% per frame)
      const lerp = 0.04;
      mouseCurrent.current.x += (mouseTarget.current.x - mouseCurrent.current.x) * lerp;
      mouseCurrent.current.y += (mouseTarget.current.y - mouseCurrent.current.y) * lerp;

      const t = performance.now() / 1000 - startTime;
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform2f(uMouse, mouseCurrent.current.x, mouseCurrent.current.y);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);

      if (!reducedMotion) {
        rafRef.current = requestAnimationFrame(frame);
      }
    }

    if (reducedMotion) {
      // ── Reduced motion: render exactly ONE static frame ──
      gl.uniform1f(uTime, 0.0);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, 0.5, 0.5);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } else {
      rafRef.current = requestAnimationFrame(frame);
    }

    // ── Cleanup on unmount ──
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('visibilitychange', onVisibility);
      // Lose the GL context to free GPU resources
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [prefersReducedMotion]);

  return (
    <section
      className="aurora-hero"
      aria-labelledby="aurora-title"
    >
      {/* WebGL canvas — sits behind everything */}
      <canvas
        ref={canvasRef}
        className="aurora-canvas"
        aria-hidden="true"
      />

      {/* Dark overlay for text contrast (CSS, not shader) */}
      <div className="aurora-overlay" aria-hidden="true" />

      {/* Readable content on top */}
      <div className="aurora-content">
        <h1 id="aurora-title" className="aurora-headline">
          Pughal
        </h1>
        <p className="aurora-intro">
          Building interfaces that feel alive.
        </p>
      </div>
    </section>
  );
}
