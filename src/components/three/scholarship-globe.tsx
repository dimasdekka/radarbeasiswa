"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TextureLoader,
  Vector3,
  WebGLRenderer,
  type Texture,
  CatmullRomCurve3,
  TubeGeometry,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import {
  createWaveMesh,
  createLightPillar,
  createPointMesh,
  createLabel,
  getCirclePoints,
  flyArc,
} from "./earth-utils";

/** Scholarship data: Indonesia (home) → destinations. [name, lon(E), lat(N)] */
const HOME = { name: "Indonesia", E: 118, N: -2.5 };
const DESTS = [
  { name: "Inggris", E: 359.8, N: 51.5 },
  { name: "Jerman", E: 10, N: 51 },
  { name: "Australia", E: 133.8, N: -25 },
  { name: "Jepang", E: 138, N: 36 },
  { name: "Amerika", E: 241.7, N: 39 },
  { name: "Hungaria", E: 19, N: 47 },
  { name: "Korea", E: 128, N: 36.5 },
  { name: "Belanda", E: 5, N: 52 },
  { name: "Turki", E: 35, N: 39 },
];

const EARTH_VERTEX = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vp;
varying vec3 vPositionNormal;
void main(void){
  vUv = uv;
  vNormal = normalize( normalMatrix * normal );
  vp = position;
  vPositionNormal = normalize(( modelViewMatrix * vec4(position, 1.0) ).xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const EARTH_FRAGMENT = `
uniform vec3 glowColor;
uniform float bias;
uniform float power;
uniform float time;
uniform float brightness;
uniform vec3 tint;
varying vec3 vp;
varying vec3 vNormal;
varying vec3 vPositionNormal;
uniform float scale;
uniform sampler2D map;
varying vec2 vUv;
void main(void){
  float a = pow( bias + scale * abs(dot(vNormal, vPositionNormal)), power );
  vec4 tex = texture2D( map, vUv );
  // brighten + tint so it stays legible on light backgrounds
  vec3 col = tex.rgb * brightness + tint * 0.18;
  // lift the darkest shadows so the night side isn't a harsh black disc
  col = max(col, tint * 0.72);
  gl_FragColor = vec4(col, 1.0);
  if(vp.y > time && vp.y < time + 20.0) {
    float t = smoothstep(0.0, 0.8, (1.0 - abs(0.5 - (vp.y - time) / 20.0)) / 3.0 );
    gl_FragColor = mix(gl_FragColor, vec4(glowColor, 1.0), t * t );
  }
  gl_FragColor = mix(gl_FragColor, vec4( glowColor, 1.0 ), a );
}
`;

const RADIUS = 50;

const isDark = () => typeof document !== "undefined" && document.documentElement.classList.contains("dark");

export function ScholarshipGlobe() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [themeKey, setThemeKey] = useState(0);

  // Re-init the scene when the theme toggles so colors update.
  useEffect(() => {
    const obs = new MutationObserver(() => setThemeKey((k) => k + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = mount.clientWidth;
    let height = mount.clientHeight;
    let frameId = 0;
    let disposed = false;

    const scene = new Scene();
    const camera = new PerspectiveCamera(45, width / height, 1, 10000);
    camera.position.set(0, 30, 205);

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 130;
    controls.maxDistance = 340;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.addEventListener("start", () => (controls.autoRotate = false));
    controls.addEventListener("end", () => (controls.autoRotate = true));

    const group = new Group();
    group.scale.set(0, 0, 0);
    scene.add(group);
    const earthGroup = new Group();
    group.add(earthGroup);

    const uniforms: any = {
      glowColor: { value: new Color(isDark() ? 0x8b5cf6 : 0x4338ca) },
      scale: { type: "f", value: -1.0 },
      bias: { type: "f", value: isDark() ? 1.0 : 1.15 },
      power: { type: "f", value: isDark() ? 3.3 : 2.6 },
      time: { type: "f", value: 100 },
      map: { value: null as Texture | null },
      brightness: { value: isDark() ? 1.15 : 1.55 },
      tint: { value: new Color(isDark() ? 0x2a2168 : 0x3b2f8f) },
    };
    const timeValue = 100;

    const waveMeshArr: Mesh[] = [];
    const circleLineList: any[] = [];
    let flyArray: any[] = [];
    const flySpeed = 0.0045;
    const satRotateSpeed = 0.006;
    const rotateSpeed = 0.0015;

    const loader = new TextureLoader();
    const load = (url: string) => new Promise<Texture>((res) => loader.load(url, res));

    (async () => {
      const [earthTex, apertureTex, lightColumnTex, labelTex, gradientTex] = await Promise.all([
        load("/earth/earth.jpg"),
        load("/earth/aperture.png"),
        load("/earth/light_column.png"),
        load("/earth/label.png"),
        load("/earth/gradient.png"),
      ]);
      if (disposed) return;

      // ── Earth (custom scan shader) ──
      uniforms.map.value = earthTex;
      const earthGeo = new SphereGeometry(RADIUS, 128, 128);
      const earthMat = new ShaderMaterial({
        uniforms,
        vertexShader: EARTH_VERTEX,
        fragmentShader: EARTH_FRAGMENT,
      });
      const earth = new Mesh(earthGeo, earthMat);
      earthGroup.add(earth);

      // ── Atmosphere rim (smooth fresnel, additive) ──
      const atmoMat = new ShaderMaterial({
        uniforms: {
          coeficient: { value: isDark() ? 0.45 : 0.7 },
          power: { value: isDark() ? 4.0 : 3.2 },
          glowColor: { value: new Color(isDark() ? 0x8b5cf6 : 0x7c5cd6) },
        },
        vertexShader: `
          varying vec3 vVertexWorldPosition;
          varying vec3 vVertexNormal;
          void main(){
            vVertexNormal = normalize(normalMatrix * normal);
            vVertexWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 glowColor;
          uniform float coeficient;
          uniform float power;
          varying vec3 vVertexNormal;
          varying vec3 vVertexWorldPosition;
          void main(){
            vec3 worldCameraToVertex = vVertexWorldPosition - cameraPosition;
            vec3 viewCameraToVertex = (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;
            viewCameraToVertex = normalize(viewCameraToVertex);
            float intensity = pow(coeficient + dot(vVertexNormal, viewCameraToVertex), power);
            gl_FragColor = vec4(glowColor, intensity);
          }`,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
      });
      const atmo = new Mesh(new SphereGeometry(RADIUS * 1.08, 128, 128), atmoMat);
      earthGroup.add(atmo);

      // ── Outer soft glow shell (wide fresnel that melts into the page) ──
      const outerGlowMat = new ShaderMaterial({
        uniforms: { glowColor: { value: new Color(isDark() ? 0x7c5cd6 : 0x8b5cf6) } },
        vertexShader: `
          varying vec3 vNormalW;
          varying vec3 vPosW;
          void main(){
            vNormalW = normalize(mat3(modelMatrix) * normal);
            vPosW = (modelMatrix * vec4(position,1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }`,
        fragmentShader: `
          uniform vec3 glowColor;
          varying vec3 vNormalW;
          varying vec3 vPosW;
          void main(){
            vec3 viewDir = normalize(cameraPosition - vPosW);
            float rim = 1.0 - abs(dot(viewDir, normalize(vNormalW)));
            float intensity = pow(rim, 3.5) * 0.6;
            gl_FragColor = vec4(glowColor, intensity);
          }`,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
        side: BackSide,
      });
      const outerGlow = new Mesh(new SphereGeometry(RADIUS * 1.35, 96, 96), outerGlowMat);
      earthGroup.add(outerGlow);

      // ── Markers: pillars + waves at home & destinations ──
      const allPoints = [{ ...HOME, home: true }, ...DESTS.map((d) => ({ ...d, home: false }))];
      const markup = new Group();
      const pointMat = new MeshBasicMaterial({ color: 0xfbbf24, map: labelTex, transparent: true, depthWrite: false });

      allPoints.forEach((p) => {
        markup.add(createPointMesh({ radius: RADIUS, lon: p.E, lat: p.N, material: pointMat }));
        markup.add(
          createLightPillar({
            radius: RADIUS,
            lon: p.E,
            lat: p.N,
            color: p.home ? 0xfbbf24 : 0x8b5cf6,
            texture: lightColumnTex,
          })
        );
        const wave = createWaveMesh({ radius: RADIUS, lon: p.E, lat: p.N, texture: apertureTex, color: p.home ? 0xfbbf24 : 0x67e8f9 });
        markup.add(wave);
        waveMeshArr.push(wave);
        // place-name label
        markup.add(
          createLabel({
            radius: RADIUS,
            lon: p.E,
            lat: p.N,
            text: p.name,
            color: p.home ? "#fbbf24" : "#c4b5fd",
            home: p.home,
          })
        );
      });
      earthGroup.add(markup);

      // ── Fly-line arcs home → each destination ──
      const flyGroup = new Group();
      earthGroup.add(flyGroup);
      DESTS.forEach((d) => {
        const arc = flyArc(RADIUS, HOME.E, HOME.N, d.E, d.N, { color: 0xec8f43, flyLineColor: 0xfde68a });
        flyGroup.add(arc);
        flyArray.push(arc.userData.flyLine);
      });

      // ── Orbiting satellite rings ──
      const ringPts = getCirclePoints({ radius: RADIUS + 15, number: 150, closed: true });
      const curve = new CatmullRomCurve3(ringPts.map((e) => new Vector3(e[0], e[1], e[2])));
      const ringMat = new MeshBasicMaterial({ color: 0x6d5bb5, transparent: true, opacity: 0.4, side: DoubleSide });
      const ringTube = new TubeGeometry(curve, 150, 0.3, 8);
      const line = new Mesh(ringTube, ringMat);
      const l2 = line.clone(); l2.scale.set(1.2, 1.2, 1.2); l2.rotateZ(Math.PI / 6);
      const l3 = line.clone(); l3.scale.set(0.8, 0.8, 0.8); l3.rotateZ(-Math.PI / 6);
      earthGroup.add(line, l2, l3);
      circleLineList.push(line, l2, l3);

      const satGeo = new SphereGeometry(1.2, 32, 32);
      const satColors = [0xe0b187, 0x628fbb, 0x806bdf];
      [line, l2, l3].forEach((l, li) => {
        const ball = new Mesh(satGeo, new MeshBasicMaterial({ color: satColors[li] }));
        const idx = Math.floor((ringPts.length / 1) * 0.25);
        ball.position.set(ringPts[idx][0], ringPts[idx][1], ringPts[idx][2]);
        l.add(ball);
      });

      // starfield
      const starVerts: number[] = [];
      for (let i = 0; i < 500; i++) {
        starVerts.push(800 * Math.random() - 400, 800 * Math.random() - 400, 800 * Math.random() - 400);
      }
      const starGeo = new BufferGeometry();
      starGeo.setAttribute("position", new BufferAttribute(new Float32Array(starVerts), 3));
      const stars = new Points(starGeo, new PointsMaterial({ size: 2, sizeAttenuation: true, color: 0x9f8fef, transparent: true, opacity: 0.8, map: gradientTex, depthWrite: false }));
      scene.add(stars);

      // reveal
      gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: 1.8, ease: "power2.out" });
      mount.style.opacity = "1";
    })();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();

      // fly-line motion
      flyArray.forEach((fly) => {
        if (!fly) return;
        fly.rotation.z += flySpeed;
        if (fly.rotation.z >= fly.flyEndAngle) fly.rotation.z = 0;
      });

      earthGroup.rotation.y += rotateSpeed;
      circleLineList.forEach((e) => e.rotateY(satRotateSpeed));

      // scan shader
      uniforms.time.value = uniforms.time.value < -timeValue ? timeValue : uniforms.time.value - 1;

      // wave rings
      waveMeshArr.forEach((mesh) => {
        const ud = mesh.userData as any;
        ud.scale += 0.007;
        mesh.scale.set(ud.size * ud.scale, ud.size * ud.scale, ud.size * ud.scale);
        const mat = mesh.material as MeshBasicMaterial;
        if (ud.scale <= 1.5) mat.opacity = (ud.scale - 1) * 2;
        else if (ud.scale > 1.5 && ud.scale <= 2) mat.opacity = 1 - (ud.scale - 1.5) * 2;
        else ud.scale = 1;
      });

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      width = mount.clientWidth;
      height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      flyArray = [];
    };
  }, [themeKey]);

  return (
    <div className="relative aspect-square w-full max-w-[620px]">
      <div ref={mountRef} className="h-full w-full cursor-grab opacity-0 transition-opacity duration-1000 active:cursor-grabbing" />
      <p className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
        Tarik untuk memutar &middot; scroll untuk zoom
      </p>
    </div>
  );
}
