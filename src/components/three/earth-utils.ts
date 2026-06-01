/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ArcCurve,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Quaternion,
  Sprite,
  SpriteMaterial,
  CanvasTexture,
  type Texture,
  Vector3,
} from "three";

/** Lon/lat (degrees) → point on sphere of radius R. Ported from GhostCatcg/3d-earth. */
export function lon2xyz(R: number, longitude: number, latitude: number): Vector3 {
  let lon = (longitude * Math.PI) / 180;
  const lat = (latitude * Math.PI) / 180;
  lon = -lon;
  const x = R * Math.cos(lat) * Math.cos(lon);
  const y = R * Math.sin(lat);
  const z = R * Math.cos(lat) * Math.sin(lon);
  return new Vector3(x, y, z);
}

export interface PointTextures {
  aperture: Texture;
  light_column: Texture;
  label: Texture;
}

/** Pulsing wave ring laid flat on the sphere surface. */
export function createWaveMesh(opts: { radius: number; lon: number; lat: number; texture: Texture; color: number }) {
  const geometry = new PlaneGeometry(1, 1);
  const material = new MeshBasicMaterial({
    color: opts.color,
    map: opts.texture,
    transparent: true,
    opacity: 1.0,
    depthWrite: false,
  });
  const mesh = new Mesh(geometry, material);
  const coord = lon2xyz(opts.radius * 1.001, opts.lon, opts.lat);
  const size = opts.radius * 0.12;
  mesh.scale.set(size, size, size);
  (mesh.userData as any).size = size;
  (mesh.userData as any).scale = Math.random() * 1.0;
  mesh.position.set(coord.x, coord.y, coord.z);
  const coordVec3 = coord.clone().normalize();
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), coordVec3);
  return mesh;
}

/** Vertical light pillar (two crossed planes) at a coordinate. */
export function createLightPillar(opts: {
  radius: number;
  lon: number;
  lat: number;
  color: number;
  texture: Texture;
}) {
  const height = opts.radius * 0.3;
  const geometry = new PlaneGeometry(opts.radius * 0.05, height);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, height / 2);
  const material = new MeshBasicMaterial({
    map: opts.texture,
    color: opts.color,
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
  });
  const mesh = new Mesh(geometry, material);
  const group = new Group();
  group.add(mesh, mesh.clone().rotateZ(Math.PI / 2));
  const coord = lon2xyz(opts.radius, opts.lon, opts.lat);
  group.position.set(coord.x, coord.y, coord.z);
  group.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), coord.clone().normalize());
  return group;
}

/** Flat marker plate at base of a pillar. */
export function createPointMesh(opts: { radius: number; lon: number; lat: number; material: MeshBasicMaterial }) {
  const geometry = new PlaneGeometry(1, 1);
  const mesh = new Mesh(geometry, opts.material);
  const coord = lon2xyz(opts.radius * 1.001, opts.lon, opts.lat);
  const size = opts.radius * 0.05;
  mesh.scale.set(size, size, size);
  mesh.position.set(coord.x, coord.y, coord.z);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), coord.clone().normalize());
  return mesh;
}

export function getCirclePoints(opt: { radius: number; number: number; closed: boolean }) {
  const list: number[][] = [];
  for (let j = 0; j < 2 * Math.PI - 0.1; j += (2 * Math.PI) / (opt.number || 100)) {
    list.push([
      parseFloat((Math.cos(j) * (opt.radius || 10)).toFixed(2)),
      0,
      parseFloat((Math.sin(j) * (opt.radius || 10)).toFixed(2)),
    ]);
  }
  if (opt.closed) list.push(list[0]);
  return list;
}

/* ───────── Fly-line arc (ported & condensed from 3d-earth/arc.ts) ───────── */

function radianAOB(A: Vector3, B: Vector3, O: Vector3) {
  const dir1 = A.clone().sub(O).normalize();
  const dir2 = B.clone().sub(O).normalize();
  return Math.acos(dir1.dot(dir2));
}

function threePointCenter(p1: Vector3, p2: Vector3, p3: Vector3) {
  const L1 = p1.lengthSq();
  const L2 = p2.lengthSq();
  const L3 = p3.lengthSq();
  const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, x3 = p3.x, y3 = p3.y;
  const S = x1 * y2 + x2 * y3 + x3 * y1 - x1 * y3 - x2 * y1 - x3 * y2;
  const x = (L2 * y3 + L1 * y2 + L3 * y1 - L2 * y1 - L3 * y2 - L1 * y3) / S / 2;
  const y = (L3 * x2 + L2 * x1 + L1 * x3 - L1 * x2 - L2 * x3 - L3 * x1) / S / 2;
  return new Vector3(x, y, 0);
}

function createFlyLine(radius: number, startAngle: number, endAngle: number, color: number) {
  const geometry = new BufferGeometry();
  const arc = new ArcCurve(0, 0, radius, startAngle, endAngle, false);
  const pointsArr = arc.getSpacedPoints(100);
  geometry.setFromPoints(pointsArr as unknown as Vector3[]);
  const percentArr: number[] = [];
  for (let i = 0; i < pointsArr.length; i++) percentArr.push(i / pointsArr.length);
  geometry.setAttribute("percent", new BufferAttribute(new Float32Array(percentArr), 1));
  const size = 1.3;
  const material = new PointsMaterial({ size, transparent: true, depthWrite: false });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "void main() {",
      ["attribute float percent;", "void main() {"].join("\n")
    );
    shader.vertexShader = shader.vertexShader.replace(
      "gl_PointSize = size;",
      ["gl_PointSize = percent * size;"].join("\n")
    );
  };
  const flyLine = new Points(geometry, material);
  material.color = new Color(color);
  return flyLine;
}

function arcXOY(radius: number, startPoint: Vector3, endPoint: Vector3, opts: { color: number; flyLineColor: number }) {
  const middleV3 = new Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
  const dir = middleV3.clone().normalize();
  const earthRadianAngle = radianAOB(startPoint, endPoint, new Vector3(0, 0, 0));
  const arcTopCoord = dir.multiplyScalar(radius + earthRadianAngle * radius * 0.2);
  const flyArcCenter = threePointCenter(startPoint, endPoint, arcTopCoord);
  const flyArcR = Math.abs(flyArcCenter.y - arcTopCoord.y);
  const flyRadianAngle = radianAOB(startPoint, new Vector3(0, -1, 0), flyArcCenter);
  const startAngle = -Math.PI / 2 + flyRadianAngle;
  const endAngle = Math.PI - startAngle;

  const arcline: any = circleLine(flyArcCenter.x, flyArcCenter.y, flyArcR, startAngle, endAngle, opts.color);
  const flyAngle = (endAngle - startAngle) / 7;
  const flyLine: any = createFlyLine(flyArcR, startAngle, startAngle + flyAngle, opts.flyLineColor);
  flyLine.position.y = flyArcCenter.y;
  arcline.add(flyLine);
  flyLine.flyEndAngle = endAngle - startAngle - flyAngle;
  flyLine.startAngle = startAngle;
  flyLine.rotation.z = flyLine.flyEndAngle * Math.random();
  arcline.userData.flyLine = flyLine;
  return arcline;
}

function circleLine(x: number, y: number, r: number, startAngle: number, endAngle: number, color: number) {
  const geometry = new BufferGeometry();
  const arc = new ArcCurve(x, y, r, startAngle, endAngle, false);
  const points = arc.getSpacedPoints(80);
  geometry.setFromPoints(points as unknown as Vector3[]);
  const material = new LineBasicMaterial({ color, transparent: true, opacity: 0.4 });
  return new Line(geometry, material);
}

function _3Dto2D(startSphere: Vector3, endSphere: Vector3) {
  const origin = new Vector3(0, 0, 0);
  const startDir = startSphere.clone().sub(origin);
  const endDir = endSphere.clone().sub(origin);
  const normal = startDir.clone().cross(endDir).normalize();
  const xoyNormal = new Vector3(0, 0, 1);
  const q1 = new Quaternion().setFromUnitVectors(normal, xoyNormal);
  const startXOY = startSphere.clone().applyQuaternion(q1);
  const endXOY = endSphere.clone().applyQuaternion(q1);
  const middleV3 = startXOY.clone().add(endXOY).multiplyScalar(0.5);
  const midDir = middleV3.clone().sub(origin).normalize();
  const yDir = new Vector3(0, 1, 0);
  const q2 = new Quaternion().setFromUnitVectors(midDir, yDir);
  const startYY = startXOY.clone().applyQuaternion(q2);
  const endYY = endXOY.clone().applyQuaternion(q2);
  const quaternionInverse = q1.clone().invert().multiply(q2.clone().invert());
  return { quaternion: quaternionInverse, startPoint: startYY, endPoint: endYY };
}

export function flyArc(
  radius: number,
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number,
  opts: { color: number; flyLineColor: number }
) {
  const s1 = lon2xyz(radius, lon1, lat1);
  const s2 = lon2xyz(radius, lon2, lat2);
  const startEndQua = _3Dto2D(s1.clone(), s2.clone());
  const arcline = arcXOY(radius, startEndQua.startPoint, startEndQua.endPoint, opts);
  arcline.quaternion.multiply(startEndQua.quaternion);
  return arcline;
}

/** Crisp text label as a billboarded canvas sprite at a lon/lat. */
export function createLabel(opts: {
  radius: number;
  lon: number;
  lat: number;
  text: string;
  color: string;
  home?: boolean;
}) {
  const dpr = 3;
  const fontSize = opts.home ? 30 : 26;
  const dotR = opts.home ? 6 : 4.5;
  const gap = 10;
  const padR = 6;

  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  const textW = measure.measureText(opts.text).width;

  const w = Math.ceil(dotR * 2 + gap + textW + padR + 8);
  const h = Math.ceil(fontSize + 14);

  const canvas = document.createElement("canvas");
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const cy = h / 2;
  const dotX = dotR + 3;

  // glow dot
  ctx.shadowColor = opts.color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(dotX, cy, dotR, 0, Math.PI * 2);
  ctx.fillStyle = opts.color;
  ctx.fill();
  ctx.shadowBlur = 0;

  // text with soft dark outline for legibility on any side
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(8, 5, 20, 0.85)";
  ctx.strokeText(opts.text, dotX + dotR + gap, cy + 1);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(opts.text, dotX + dotR + gap, cy + 1);

  const texture = new CanvasTexture(canvas);
  texture.anisotropy = 8;
  const material = new SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false });
  const sprite = new Sprite(material);

  // target a small fixed world height (~3.2 units) so labels stay subtle
  const targetH = opts.home ? 3.6 : 3.0;
  const k = targetH / h;
  sprite.scale.set(w * k, h * k, 1);
  sprite.center.set(0, 0.5);

  const coord = lon2xyz(opts.radius * 1.04, opts.lon, opts.lat);
  sprite.position.set(coord.x, coord.y, coord.z);
  sprite.renderOrder = 20;
  return sprite;
}

/** A guaranteed-round radial-gradient glow sprite that fades fully to transparent
 *  at the edges (so there is never a visible square/box behind the globe). */
export function createRadialGlow(opts: { size: number; color: string; opacity?: number }) {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  // Smooth, wide falloff — strongest just around the globe, melting to nothing.
  g.addColorStop(0.0, opts.color);
  g.addColorStop(0.25, opts.color);
  g.addColorStop(0.5, opts.color.replace(/[\d.]+\)$/, "0.22)"));
  g.addColorStop(0.75, opts.color.replace(/[\d.]+\)$/, "0.06)"));
  g.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
  ctx.fill();

  const texture = new CanvasTexture(canvas);
  const material = new SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
    opacity: opts.opacity ?? 1,
  });
  const sprite = new Sprite(material);
  sprite.scale.set(opts.size, opts.size, 1);
  return sprite;
}
