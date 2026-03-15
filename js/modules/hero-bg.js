/**
 * Hero Background — WebGL port of the OVERLAY floating-lines shader.
 * Organic line animation where curves breathe and change shape.
 * Pure WebGL, no Three.js. Slow, blurred, non-distracting.
 */

const VERT = `attribute vec2 a_pos;
void main(){gl_Position=vec4(a_pos,0.,1.);}`;

const FRAG = `precision highp float;
uniform float u_time;
uniform vec2  u_res;
uniform float u_jitter;

const float SPEED = 0.3;

const vec3 BG = vec3(0.180, 0.180, 0.204);

mat2 rot(float r){float c=cos(r),s=sin(r);return mat2(c,s,-s,c);}

vec3 getLineColor(float t){
  vec3 c1 = vec3(0.553, 0.353, 0.592);
  vec3 c2 = vec3(0.627, 0.427, 0.667);
  vec3 c3 = vec3(0.831, 0.722, 0.855);
  float s = t * 2.0;
  if(s < 1.0) return mix(c1, c2, s);
  return mix(c2, c3, s - 1.0);
}

float wave(vec2 uv, float offset, float time){
  float x_movement = time * 0.1;
  float amp = sin(offset + time * 0.2) * 0.3;
  float y = sin(uv.x + offset + x_movement) * amp;
  y += sin(uv.x * 0.7 + time * 0.15 + offset * 1.3) * amp * 0.3;
  y += u_jitter * sin(uv.x * 3.0 + offset * 5.0) * 0.08;
  float m = uv.y - y;
  return 0.014 / max(abs(m) + 0.012, 1e-3) + 0.005;
}

void main(){
  vec2 uv = (2.0 * gl_FragCoord.xy - u_res.xy) / u_res.y;
  uv.y *= -1.0;
  float time = u_time * SPEED;

  vec3 col = BG;

  float glow = exp(-length(uv) * 1.6) * 0.04;
  col += vec3(0.553, 0.353, 0.592) * glow;

  for(int i = 0; i < 7; i++){
    float fi = float(i);
    float t = fi / 6.0;
    vec3 lc = getLineColor(t);
    float angle = 0.4 * log(length(uv) + 1.0);
    vec2 ruv = uv * rot(angle);
    col += lc * wave(
      ruv + vec2(0.8 * fi + 2.0, -0.7),
      1.5 + 0.2 * fi, time
    ) * 0.12;
  }

  for(int i = 0; i < 7; i++){
    float fi = float(i);
    float t = fi / 6.0;
    vec3 lc = getLineColor(t);
    float angle = 0.2 * log(length(uv) + 1.0);
    vec2 ruv = uv * rot(angle);
    col += lc * wave(
      ruv + vec2(0.8 * fi + 5.0, 0.0),
      2.0 + 0.15 * fi, time
    ) * 0.22;
  }

  for(int i = 0; i < 7; i++){
    float fi = float(i);
    float t = fi / 6.0;
    vec3 lc = getLineColor(t);
    float angle = -0.4 * log(length(uv) + 1.0);
    vec2 ruv = uv * rot(angle);
    ruv.x *= -1.0;
    col += lc * wave(
      ruv + vec2(0.8 * fi + 10.0, 0.5),
      1.0 + 0.2 * fi, time
    ) * 0.06;
  }

  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;

export function initHeroBg() {
  const canvas = document.getElementById('hero-bg-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
  if (!gl) return;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

  const uTime   = gl.getUniformLocation(prog, 'u_time');
  const uRes    = gl.getUniformLocation(prog, 'u_res');
  const uJitter = gl.getUniformLocation(prog, 'u_jitter');

  let w, h, jitter = 0, animId;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = canvas.parentElement.getBoundingClientRect();
    w = Math.round(rect.width * dpr);
    h = Math.round(rect.height * dpr);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width  = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    gl.viewport(0, 0, w, h);
  }

  const start = performance.now();

  function frame() {
    jitter *= 0.92;
    gl.uniform1f(uTime, (performance.now() - start) * 0.001);
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uJitter, jitter);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    animId = requestAnimationFrame(frame);
  }

  resize();
  frame();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  }, { passive: true });

  canvas.parentElement.addEventListener('click', () => {
    jitter = 1.0;
  }, { passive: true });

  return () => cancelAnimationFrame(animId);
}
