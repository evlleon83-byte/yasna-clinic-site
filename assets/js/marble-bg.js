/*
  ЯСНА — subtle procedural marble backdrop for the homepage hero.
  Progressive enhancement only: a static hero image/gradient always sits
  underneath (#marble-canvas is layered on top of it), so if WebGL, Three.js
  or prefers-reduced-motion rule this out, the page looks correct either way.
  Kept intentionally light (single plane, low pixel ratio cap, low frame
  budget) so it does not hurt Core Web Vitals / INP on mobile.
*/
(function () {
  "use strict";
  var mount = document.getElementById("marble-canvas");
  if (!mount) return;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isSmall = window.innerWidth < 720;
  if (reduceMotion) return; // static gradient/image underneath is enough

  function boot() {
    if (typeof THREE === "undefined") return;
    try {
      var width = mount.clientWidth, height = mount.clientHeight;
      var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1 : 1.5));
      renderer.setSize(width, height);
      mount.appendChild(renderer.domElement);

      var scene = new THREE.Scene();
      var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      var vertexShader = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }";
      var fragmentShader = [
        "precision mediump float;",
        "varying vec2 vUv;",
        "uniform float uTime;",
        "uniform vec2 uRes;",
        "",
        "vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}",
        "vec2 mod289(vec2 x){return x - floor(x * (1.0/289.0)) * 289.0;}",
        "vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}",
        "float snoise(vec2 v){",
        "  const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);",
        "  vec2 i  = floor(v + dot(v, C.yy));",
        "  vec2 x0 = v - i + dot(i, C.xx);",
        "  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);",
        "  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;",
        "  i = mod289(i);",
        "  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));",
        "  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);",
        "  m = m*m; m = m*m;",
        "  vec3 x = 2.0 * fract(p * C.www) - 1.0;",
        "  vec3 h = abs(x) - 0.5;",
        "  vec3 ox = floor(x + 0.5);",
        "  vec3 a0 = x - ox;",
        "  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);",
        "  vec3 g;",
        "  g.x = a0.x * x0.x + h.x * x0.y;",
        "  g.yz = a0.yz * x12.xz + h.yz * x12.yw;",
        "  return 130.0 * dot(m, g);",
        "}",
        "",
        "void main(){",
        "  vec2 uv = vUv; uv.x *= uRes.x / uRes.y;",
        "  float t = uTime * 0.035;",
        "  float n = 0.0;",
        "  n += 0.55 * snoise(uv * 2.2 + vec2(t, -t*0.6));",
        "  n += 0.30 * snoise(uv * 4.4 - vec2(t*0.8, t*0.3));",
        "  n += 0.15 * snoise(uv * 9.0 + vec2(-t*1.3, t*0.9));",
        "  float vein = smoothstep(0.15, 0.55, abs(n));",
        "  float shade = mix(0.06, 0.16, vein);",
        "  vec3 col = vec3(0.04) + shade;",
        "  float vignette = smoothstep(1.05, 0.15, length(vUv - 0.5));",
        "  gl_FragColor = vec4(col, 0.55 * vignette);",
        "}"
      ].join("\n");

      var material = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uRes: { value: new THREE.Vector2(width, height) } },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true
      });
      var geo = new THREE.PlaneGeometry(2, 2);
      scene.add(new THREE.Mesh(geo, material));

      var clock = new THREE.Clock();
      var frame = 0;
      function animate() {
        frame++;
        // throttle to ~20fps — a decorative backdrop doesn't need 60fps
        if (frame % 3 === 0) {
          material.uniforms.uTime.value = clock.getElapsedTime();
          renderer.render(scene, camera);
        }
        raf = requestAnimationFrame(animate);
      }
      var raf = requestAnimationFrame(animate);

      var resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          var w = mount.clientWidth, h = mount.clientHeight;
          renderer.setSize(w, h);
          material.uniforms.uRes.value.set(w, h);
        }, 200);
      });

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(animate);
      });
    } catch (e) {
      // WebGL not available / context lost — the static image underneath stands on its own.
    }
  }

  if (typeof THREE === "undefined") {
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.onload = boot;
    s.async = true;
    document.body.appendChild(s);
  } else {
    boot();
  }
})();
