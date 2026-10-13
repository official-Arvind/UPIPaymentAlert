/* ════════════════════════════════════════════════════════════════════════════
   heroink.js — the hero cursor BLOB (the Buttermax follow model).
   ─ A trimmed velocity+dye Navier–Stokes sim (adapted from Pavel Dobryakov's
     WebGL-Fluid-Simulation, MIT): one splat AT the cursor every frame — the
     position never lags, only the SIZE does (eased toward a speed-mapped
     target, buttermax-style). Stop moving and the blob collapses to a small
     resting dot; the trail melts where it was laid in ~1–2s. Display is a
     noise-raggened THRESHOLD over the dye field — molten magenta body, amber
     core. The ink rides ABOVE the DOM wordmark (z: .heroword → #ink → #gl);
     glyphs under the blob are re-composited SOLID PINK via setGlyphMask(canvas)
     — a rasterized copy of the DOM wordmark passed in by landing3d.js.
   ─ Hero-only: opacity follows the same heroOut envelope as the DOM copy, and
     ALL GPU work early-returns once the hero has left (or the tab is hidden).
   ─ createHeroInk(canvas, {…}) → null on any capability failure (the hero is
     then simply blob-less — the DOM wordmark is unaffected; a failed glyph
     mask just leaves uGlyphOn=0, byte-identical to the maskless path).
   ════════════════════════════════════════════════════════════════════════════ */

export function createHeroInk(canvas, opts = {}) {
  const {
    heroEnd = 1.05, dprCap = 1.5,
    simRes = 128, dyeRes = 512, onContextLost = null,
  } = opts;
  if (!canvas) return null;

  /* ── tuning (buttermax follow — the blob IS the cursor; only its SIZE lags) ── */
  const PRESSURE_ITER = 16;
  const CURL = 8;                  // vorticity confinement — a little living wobble in the melt
  const VELOCITY_DISS = 0.90;      // trail dies where it was laid (no long drift)
  const DYE_DISS = 0.965;          // fast melt — a laid stroke collapses in ~1–2s
  const PRESSURE_DECAY = 0.8;
  const SPLAT_FORCE = 1400;        // flicks shed droplets, but the body isn't thrown ahead
  const R_DOT = 0.00035;           // Gaussian r² of the resting dot (cursor still)
  const R_MAX = 0.0075;            // Gaussian r² at full cursor speed
  const SIZE_EASE = 0.08;          // buttermax's size-lag — position never lags, size does
  const SPEED_FULL = 10;           // cursor px/frame that maps to size 1
  const INK_DEEP = [0.91, 0.14, 0.38]; // molten red-aurora body (magenta-red)
  const INK_HOT  = [1.00, 0.63, 0.22]; // amber core where the dye is dense
  const PINK     = [0.91, 0.141, 0.616]; // --magenta #E8249D — glyphs under the blob go SOLID this
  const MAX_ALPHA = 0.96;          // near-opaque — hard ink, not smoke

  const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
  const out3 = (T, t0, d) => { const x = clamp01((T - t0) / d); return 1 - Math.pow(1 - x, 3); };

  /* ── context + float-texture capability gate ─────────────────────────────── */
  const ctxParams = { alpha: true, depth: false, stencil: false, antialias: false,
                      premultipliedAlpha: true, preserveDrawingBuffer: false };
  let gl = canvas.getContext('webgl2', ctxParams);
  const webgl2 = !!gl;
  if (!gl) gl = canvas.getContext('webgl', ctxParams) || canvas.getContext('experimental-webgl', ctxParams);
  if (!gl) return null;

  let fRGBA, fRG, fR, texType, halfExt;
  if (webgl2) {
    gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('OES_texture_float_linear');
    texType = gl.HALF_FLOAT;
    fRGBA = { internal: gl.RGBA16F, format: gl.RGBA };
    fRG   = { internal: gl.RG16F,   format: gl.RG };
    fR    = { internal: gl.R16F,    format: gl.RED };
  } else {
    halfExt = gl.getExtension('OES_texture_half_float');
    const halfLinear = gl.getExtension('OES_texture_half_float_linear');
    if (!halfExt || !halfLinear) return null;                 // no filterable float → no wisp
    texType = halfExt.HALF_FLOAT_OES;
    fRGBA = { internal: gl.RGBA, format: gl.RGBA };
    fRG = fRGBA; fR = fRGBA;
  }
  if (!supportsRTT(fRGBA.internal, fRGBA.format, texType)) return null;

  function supportsRTT(internal, format, type) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo); gl.deleteTexture(tex);
    return ok;
  }

  /* ── shaders (GLSL ES 1.00 — runs on both WebGL1 and WebGL2) ─────────────── */
  const VERT = `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform vec2 texelSize;
    void main(){
      vUv = aPosition * 0.5 + 0.5;
      vL = vUv - vec2(texelSize.x, 0.0);
      vR = vUv + vec2(texelSize.x, 0.0);
      vT = vUv + vec2(0.0, texelSize.y);
      vB = vUv - vec2(0.0, texelSize.y);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }`;
  const F_SPLAT = `
    precision highp float; varying vec2 vUv;
    uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color;
    uniform vec2 point; uniform float radius;
    void main(){
      vec2 p = vUv - point; p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / radius) * color;
      gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + splat, 1.0);
    }`;
  const F_CURL = `
    precision mediump float; varying vec2 vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    void main(){
      float L = texture2D(uVelocity, vL).y;
      float R = texture2D(uVelocity, vR).y;
      float T = texture2D(uVelocity, vT).x;
      float B = texture2D(uVelocity, vB).x;
      gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
    }`;
  const F_VORT = `
    precision highp float; varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
    void main(){
      float L = texture2D(uCurl, vL).x;
      float R = texture2D(uCurl, vR).x;
      float T = texture2D(uCurl, vT).x;
      float B = texture2D(uCurl, vB).x;
      float C = texture2D(uCurl, vUv).x;
      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force /= length(force) + 0.0001;
      force *= curl * C; force.y *= -1.0;
      vec2 vel = texture2D(uVelocity, vUv).xy;
      gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
    }`;
  const F_DIV = `
    precision mediump float; varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    void main(){
      float L = texture2D(uVelocity, vL).x;
      float R = texture2D(uVelocity, vR).x;
      float T = texture2D(uVelocity, vT).y;
      float B = texture2D(uVelocity, vB).y;
      vec2 C = texture2D(uVelocity, vUv).xy;
      if (vL.x < 0.0) L = -C.x;
      if (vR.x > 1.0) R = -C.x;
      if (vT.y > 1.0) T = -C.y;
      if (vB.y < 0.0) B = -C.y;
      gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
    }`;
  const F_CLEAR = `
    precision mediump float; varying vec2 vUv;
    uniform sampler2D uTexture; uniform float value;
    void main(){ gl_FragColor = value * texture2D(uTexture, vUv); }`;
  const F_PRESSURE = `
    precision mediump float; varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uPressure, uDivergence;
    void main(){
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      float div = texture2D(uDivergence, vUv).x;
      gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
    }`;
  const F_GRAD = `
    precision mediump float; varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uPressure, uVelocity;
    void main(){
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      vec2 vel = texture2D(uVelocity, vUv).xy;
      vel -= vec2(R - L, T - B);
      gl_FragColor = vec4(vel, 0.0, 1.0);
    }`;
  const F_ADVECT = `
    precision highp float; varying vec2 vUv;
    uniform sampler2D uVelocity, uSource; uniform vec2 texelSize;
    uniform float dt, dissipation;
    void main(){
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      gl_FragColor = dissipation * texture2D(uSource, coord);
    }`;
  const F_DISPLAY = `
    precision highp float; varying vec2 vUv;
    uniform sampler2D uDye, uGlyph; uniform vec2 uAspect, uGlyphShift;
    uniform vec3 uInkDeep, uInkHot, uPink; uniform float uMaxAlpha, uGlyphOn, uTime;
    float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
    /* cheap hash-based value noise — raggens the threshold edge (dry-brush) */
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
                 mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
    }
    /* the glyph-shimmer ramp — the COOL half of the brand aurora (magenta -> violet
       -> pale lavender). Deliberately no amber: the blob body is warm (red/amber),
       so cool letters stay legible inside it at every phase of the slide. */
    vec3 aurora(float t){
      vec3 c = mix(uPink, vec3(0.427, 0.349, 0.859), smoothstep(0.00, 0.55, t));
      return mix(c, vec3(0.855, 0.820, 1.000),       smoothstep(0.60, 1.00, t));
    }
    void main(){
      float dye = luma(texture2D(uDye, vUv).rgb);
      float n = vnoise(vUv * uAspect * 90.0) * .6 + vnoise(vUv * uAspect * 340.0) * .4;
      float a = smoothstep(0.42, 0.50, dye + (n - .5) * 0.16) * uMaxAlpha;  // HARD ragged edge
      vec3 col = mix(uInkDeep, uInkHot, smoothstep(1.5, 3.2, dye));         // molten: red body, amber only in the dense fresh core
      /* wordmark glyphs under the blob SHIMMER — a full-strength aurora that slides
         through the letters + a traveling white-hot glint band, only inside the
         blob's footprint (red-pen round 6c; replaced the flat solid pink). Mask
         rasterized from the DOM at rest; uGlyphShift re-applies the cursor-board
         offset (CSS px/viewport, y-down) so it stays glued to the moving letters. */
      float g = texture2D(uGlyph, vec2(vUv.x - uGlyphShift.x, vUv.y + uGlyphShift.y)).a * uGlyphOn;
      float sE = g * smoothstep(0.02, 0.30, a);
      float dax = dot(vec2(vUv.x * uAspect.x, vUv.y), vec2(0.573, -0.819)); // ~125deg axis
      vec3 shim = aurora(0.5 + 0.5 * sin(dax * 4.2 + uTime * 1.3));         // seamless colour slide (fast enough to READ as shimmer at blob scale)
      float band = pow(max(sin(dax * 3.4 - uTime * 2.3), 0.0), 22.0);       // the sweeping shine — crosses a parked blob every ~2.7s
      shim = mix(shim, vec3(1.0), band * 0.9);
      col = mix(col, shim, sE);
      float A = max(a, sE);
      gl_FragColor = vec4(col * A, A);              // premultiplied out
    }`;

  function compile(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('[heroink]', gl.getShaderInfoLog(s)); gl.deleteShader(s); return null; }
    return s;
  }
  function program(fragSrc) {
    const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'aPosition');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn('[heroink]', gl.getProgramInfoLog(p)); return null; }
    gl.deleteShader(vs); gl.deleteShader(fs);             // the linked program keeps its own copy
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { program: p, u };
  }
  const P = {
    splat: program(F_SPLAT), curl: program(F_CURL), vort: program(F_VORT),
    div: program(F_DIV), clear: program(F_CLEAR), pressure: program(F_PRESSURE),
    grad: program(F_GRAD), advect: program(F_ADVECT), display: program(F_DISPLAY),
  };
  for (const k in P) if (!P[k]) return null;

  /* ── fullscreen quad ─────────────────────────────────────────────────────── */
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  const elem = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elem);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);
  gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);

  function blit(target) {
    if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
    else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
  function use(p) { gl.useProgram(p.program); }

  /* ── FBO factory ─────────────────────────────────────────────────────────── */
  function makeFBO(w, h, fmt, filter) {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internal, w, h, 0, fmt.format, texType, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo, w, h, texelX: 1 / w, texelY: 1 / h,
      attach(unit) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); return unit; } };
  }
  function makeDouble(w, h, fmt, filter) {
    let a = makeFBO(w, h, fmt, filter), b = makeFBO(w, h, fmt, filter);
    return { w, h, texelX: 1 / w, texelY: 1 / h,
      get read() { return a; }, get write() { return b; },
      swap() { const t = a; a = b; b = t; },
      destroy() { gl.deleteTexture(a.tex); gl.deleteFramebuffer(a.fbo); gl.deleteTexture(b.tex); gl.deleteFramebuffer(b.fbo); } };
  }
  function resolution(res) {
    let ar = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (ar < 1) ar = 1 / ar;
    const min = Math.round(res), max = Math.round(res * ar);
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? { w: max, h: min } : { w: min, h: max };
  }

  /* ── sized resources (rebuilt on resize) ─────────────────────────────────── */
  let velocity, dye, pressure, divergence, curl;
  function buildResources() {
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    canvas.width = Math.max(2, Math.round(window.innerWidth * dpr));
    canvas.height = Math.max(2, Math.round(window.innerHeight * dpr));
    canvas.style.width = window.innerWidth + 'px';        // else the canvas displays at its backing width
    canvas.style.height = window.innerHeight + 'px';       // (intrinsic width overrides inset:0)
    if (velocity) velocity.destroy();
    if (dye) dye.destroy();
    if (pressure) pressure.destroy();
    if (divergence) { gl.deleteTexture(divergence.tex); gl.deleteFramebuffer(divergence.fbo); }
    if (curl) { gl.deleteTexture(curl.tex); gl.deleteFramebuffer(curl.fbo); }
    const sim = resolution(simRes), dyeR = resolution(dyeRes);
    velocity = makeDouble(sim.w, sim.h, fRG, gl.LINEAR);
    dye = makeDouble(dyeR.w, dyeR.h, fRGBA, gl.LINEAR);
    pressure = makeDouble(sim.w, sim.h, fR, gl.NEAREST);
    divergence = makeFBO(sim.w, sim.h, fR, gl.NEAREST);
    curl = makeFBO(sim.w, sim.h, fR, gl.NEAREST);
  }

  /* ── input (buttermax follow: record the cursor; the per-frame emitter does the rest) ── */
  let curX = 0, curY = 0, prevX = 0, prevY = 0, hasCur = false, size = 0, lastT = 0;
  function onMove(e) {
    curX = e.clientX; curY = e.clientY;
    if (!hasCur) { prevX = curX; prevY = curY; hasCur = true; }
  }
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onMove, { passive: true });  // seeds touch coords

  function splat(x, y, dx, dy, radius, amt) {
    use(P.splat);
    gl.uniform1f(P.splat.u.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(P.splat.u.point, x, y);
    gl.uniform1f(P.splat.u.radius, radius);
    gl.uniform1i(P.splat.u.uTarget, velocity.read.attach(0));
    gl.uniform3f(P.splat.u.color, dx, dy, 0);
    blit(velocity.write); velocity.swap();
    const c = 0.85 * amt;                                 // the resting dot is dimmer than the blob
    gl.uniform1i(P.splat.u.uTarget, dye.read.attach(0));
    gl.uniform3f(P.splat.u.color, c, c, c);
    blit(dye.write); dye.swap();
  }
  /* every frame: one splat AT the cursor (zero positional lag); the radius eases
     toward a speed-mapped target — stop dead and the blob collapses to the dot */
  function emit() {
    if (!hasCur || lastT >= heroEnd) return;
    const dxPx = curX - prevX, dyPx = curY - prevY;
    const sizeTarget = clamp01(Math.hypot(dxPx, dyPx) / SPEED_FULL);
    size += (sizeTarget - size) * SIZE_EASE;
    const radius = R_DOT + (R_MAX - R_DOT) * size * size;
    splat(curX / window.innerWidth, 1 - curY / window.innerHeight,
          (dxPx / window.innerWidth) * SPLAT_FORCE, (-dyPx / window.innerHeight) * SPLAT_FORCE,
          radius, 0.35 + 0.65 * size);
    prevX = curX; prevY = curY;
  }

  /* ── one sim step ────────────────────────────────────────────────────────── */
  const vTexel = () => [velocity.texelX, velocity.texelY];
  function step(dt) {
    gl.disable(gl.BLEND);
    use(P.curl);
    gl.uniform2f(P.curl.u.texelSize, ...vTexel());
    gl.uniform1i(P.curl.u.uVelocity, velocity.read.attach(0));
    blit(curl);

    use(P.vort);
    gl.uniform2f(P.vort.u.texelSize, ...vTexel());
    gl.uniform1i(P.vort.u.uVelocity, velocity.read.attach(0));
    gl.uniform1i(P.vort.u.uCurl, curl.attach(1));
    gl.uniform1f(P.vort.u.curl, CURL); gl.uniform1f(P.vort.u.dt, dt);
    blit(velocity.write); velocity.swap();

    use(P.div);
    gl.uniform2f(P.div.u.texelSize, ...vTexel());
    gl.uniform1i(P.div.u.uVelocity, velocity.read.attach(0));
    blit(divergence);

    use(P.clear);
    gl.uniform1i(P.clear.u.uTexture, pressure.read.attach(0));
    gl.uniform1f(P.clear.u.value, PRESSURE_DECAY);
    blit(pressure.write); pressure.swap();

    use(P.pressure);
    gl.uniform2f(P.pressure.u.texelSize, ...vTexel());
    gl.uniform1i(P.pressure.u.uDivergence, divergence.attach(0));
    for (let i = 0; i < PRESSURE_ITER; i++) {
      gl.uniform1i(P.pressure.u.uPressure, pressure.read.attach(1));
      blit(pressure.write); pressure.swap();
    }

    use(P.grad);
    gl.uniform2f(P.grad.u.texelSize, ...vTexel());
    gl.uniform1i(P.grad.u.uPressure, pressure.read.attach(0));
    gl.uniform1i(P.grad.u.uVelocity, velocity.read.attach(1));
    blit(velocity.write); velocity.swap();

    use(P.advect);
    gl.uniform2f(P.advect.u.texelSize, ...vTexel());
    gl.uniform1f(P.advect.u.dt, dt);
    gl.uniform1i(P.advect.u.uVelocity, velocity.read.attach(0));
    gl.uniform1i(P.advect.u.uSource, velocity.read.attach(0));
    gl.uniform1f(P.advect.u.dissipation, VELOCITY_DISS);
    blit(velocity.write); velocity.swap();

    gl.uniform1i(P.advect.u.uVelocity, velocity.read.attach(0));
    gl.uniform1i(P.advect.u.uSource, dye.read.attach(1));
    gl.uniform1f(P.advect.u.dissipation, DYE_DISS);
    blit(dye.write); dye.swap();
  }

  /* ── the wordmark glyph mask (pink-over-text) ────────────────────────────── */
  let glyphTex = null, glyphOn = 0, glyphSX = 0, glyphSY = 0;
  function setGlyphShift(x, y) { glyphSX = x || 0; glyphSY = y || 0; }
  function setGlyphMask(src) {                            // src: an offscreen 2D canvas
    if (disposed || !src) return;
    try {
      if (!glyphTex) glyphTex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, glyphTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);       // canvas is y-down, vUv is y-up
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      glyphOn = 1;
    } catch (e) { glyphOn = 0; }                          // silent degrade — old path exactly
  }

  function render() {
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    use(P.display);
    gl.uniform2f(P.display.u.texelSize, 1 / canvas.width, 1 / canvas.height);
    gl.uniform1i(P.display.u.uDye, dye.read.attach(0));
    if (glyphTex) { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, glyphTex); }
    gl.uniform1i(P.display.u.uGlyph, 1);
    gl.uniform1f(P.display.u.uGlyphOn, glyphOn);
    gl.uniform2f(P.display.u.uGlyphShift, glyphSX, glyphSY);
    gl.uniform3f(P.display.u.uPink, ...PINK);
    gl.uniform2f(P.display.u.uAspect, canvas.width / canvas.height, 1);
    gl.uniform3f(P.display.u.uInkDeep, ...INK_DEEP);
    gl.uniform3f(P.display.u.uInkHot, ...INK_HOT);
    gl.uniform1f(P.display.u.uMaxAlpha, MAX_ALPHA);
    gl.uniform1f(P.display.u.uTime, simT);
    blit(null);
  }

  /* ── public frame / resize / dispose ─────────────────────────────────────── */
  let disposed = false, simT = 0;                         /* simT drives the glyph shimmer */
  function frame(T, dt) {
    if (disposed) return;
    lastT = T;
    const op = clamp01(1 - out3(T, 0.62, 0.42));
    canvas.style.opacity = op.toFixed(3);
    if (op < 0.01 || document.hidden) { prevX = curX; prevY = curY; return; }  // no delta-jump splat on return
    const d = Math.min(Math.max(dt || 0.016, 0.001), 0.033);
    simT += d;
    emit();
    step(d);
    render();
  }
  function onResize() { if (!disposed) buildResources(); }
  function dispose() {
    disposed = true;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onMove);
    canvas.removeEventListener('webglcontextlost', onLost);
  }
  /* a lost context (backgrounded mobile tab, driver reset) just means no wisp —
     the caller hides the dead canvas; the DOM wordmark + streaks are untouched. */
  function onLost(e) {
    e.preventDefault();                                   // allow a later 'restored'
    disposed = true;                                      // stop the loop touching a dead context
    if (typeof onContextLost === 'function') { try { onContextLost(); } catch (_) {} }
  }
  canvas.addEventListener('webglcontextlost', onLost, false);

  try { buildResources(); }
  catch (e) { console.warn('[heroink] build failed', e); return null; }

  return { frame, onResize, dispose, setGlyphMask, setGlyphShift };
}
