import * as THREE from 'three';

export interface ProceduralTextures {
  terrainGround: THREE.CanvasTexture;
  terrainBump: THREE.CanvasTexture;
  terrainRoughness: THREE.CanvasTexture;
  bark: THREE.CanvasTexture;
  stoneWall: THREE.CanvasTexture;
  plasterWall: THREE.CanvasTexture;
  roofTile: THREE.CanvasTexture;
  metal: THREE.CanvasTexture;
  cloth: THREE.CanvasTexture;
  cloud: THREE.CanvasTexture;
  slashArc: THREE.CanvasTexture;
}

let cachedTextures: ProceduralTextures | null = null;

export function generateProceduralTextures(): ProceduralTextures {
  if (cachedTextures) return cachedTextures;

  // 0. Detailed Tiling Ground Grass, Moss, Clover & Soil Micro-Detail Texture (multiplies with vertexColors!)
  const groundCanvas = document.createElement('canvas');
  groundCanvas.width = groundCanvas.height = 128;
  const gCtx = groundCanvas.getContext('2d')!;
  gCtx.fillStyle = '#d4d8cc';
  gCtx.fillRect(0, 0, 128, 128);

  // Soft organic moss & soil patches
  for (let i = 0; i < 65; i++) {
    const gx = Math.random() * 128;
    const gy = Math.random() * 128;
    const gr = 4 + Math.random() * 11;
    gCtx.fillStyle =
      i % 3 === 0
        ? 'rgba(165, 185, 145, 0.28)'
        : i % 3 === 1
        ? 'rgba(215, 205, 175, 0.24)'
        : 'rgba(140, 160, 125, 0.25)';
    gCtx.beginPath();
    gCtx.arc(gx, gy, gr, 0, Math.PI * 2);
    gCtx.fill();
  }

  // Fine grass strokes of different lengths and angles
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const len = 2 + Math.random() * 6;
    const tilt = (Math.random() - 0.5) * 0.9;
    const shade = 155 + Math.floor(Math.random() * 90);
    gCtx.strokeStyle = `rgb(${shade - 12}, ${shade + 8}, ${shade - 22})`;
    gCtx.lineWidth = 0.8 + Math.random() * 1.1;
    gCtx.beginPath();
    gCtx.moveTo(x, y);
    gCtx.lineTo(x + tilt * len, y - len);
    gCtx.stroke();
  }

  // Tiny pebbles and clover specks
  for (let i = 0; i < 65; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    gCtx.fillStyle = Math.random() > 0.25 ? '#b4bca4' : '#f2ebd4';
    gCtx.fillRect(x, y, 2, 2);
  }

  const terrainGround = new THREE.CanvasTexture(groundCanvas);
  terrainGround.wrapS = terrainGround.wrapT = THREE.RepeatWrapping;
  terrainGround.repeat.set(68, 68);
  terrainGround.colorSpace = THREE.SRGBColorSpace;

  // 1. Terrain Micro-Bump & Roughness Texture (Fast generation)
  const terrainCanvas = document.createElement('canvas');
  terrainCanvas.width = terrainCanvas.height = 64;
  const tCtx = terrainCanvas.getContext('2d')!;
  tCtx.fillStyle = '#808080';
  tCtx.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 64;
    const y = Math.random() * 64;
    const v = Math.floor(85 + Math.random() * 90);
    tCtx.fillStyle = `rgb(${v},${v},${v})`;
    tCtx.fillRect(x, y, 2, 2);
  }
  const terrainBump = new THREE.CanvasTexture(terrainCanvas);
  terrainBump.wrapS = terrainBump.wrapT = THREE.RepeatWrapping;
  terrainBump.repeat.set(75, 75);

  const terrainRoughness = terrainBump;

  // 2. Tree Bark Texture
  const barkCanvas = document.createElement('canvas');
  barkCanvas.width = barkCanvas.height = 64;
  const bCtx = barkCanvas.getContext('2d')!;
  bCtx.fillStyle = '#3b2415';
  bCtx.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 110; i++) {
    const x = Math.random() * 64;
    const y = Math.random() * 64;
    const h = 8 + Math.random() * 18;
    bCtx.fillStyle = Math.random() > 0.5 ? '#26150b' : '#4e321e';
    bCtx.fillRect(x, y, 2, h);
  }
  const bark = new THREE.CanvasTexture(barkCanvas);
  bark.wrapS = bark.wrapT = THREE.RepeatWrapping;
  bark.repeat.set(2, 4);
  bark.colorSpace = THREE.SRGBColorSpace;

  // 3. Stone Foundation / Rock Texture
  const stoneCanvas = document.createElement('canvas');
  stoneCanvas.width = stoneCanvas.height = 128;
  const sCtx = stoneCanvas.getContext('2d')!;
  sCtx.fillStyle = '#58554e';
  sCtx.fillRect(0, 0, 128, 128);
  for (let row = 0; row < 8; row++) {
    const y = row * 16;
    sCtx.fillStyle = '#2d2b27';
    sCtx.fillRect(0, y, 128, 2);
    const offset = (row % 2) * 16;
    for (let col = 0; col < 4; col++) {
      const x = (col * 32 + offset) % 128;
      sCtx.fillStyle = '#2d2b27';
      sCtx.fillRect(x, y, 2, 16);
      const shade = 75 + Math.floor(Math.random() * 30);
      sCtx.fillStyle = `rgb(${shade},${shade - 3},${shade - 8})`;
      sCtx.fillRect(x + 2, y + 2, 28, 12);
    }
  }
  const stoneWall = new THREE.CanvasTexture(stoneCanvas);
  stoneWall.wrapS = stoneWall.wrapT = THREE.RepeatWrapping;
  stoneWall.repeat.set(3, 2);
  stoneWall.colorSpace = THREE.SRGBColorSpace;

  // 4. Medieval Half-Timbered Plaster Texture
  const plasterCanvas = document.createElement('canvas');
  plasterCanvas.width = plasterCanvas.height = 64;
  const pCtx = plasterCanvas.getContext('2d')!;
  pCtx.fillStyle = '#c8b89a';
  pCtx.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 220; i++) {
    const shade = 175 + Math.floor(Math.random() * 35);
    pCtx.fillStyle = `rgb(${shade},${shade - 14},${shade - 32})`;
    pCtx.fillRect(Math.random() * 64, Math.random() * 64, 3, 3);
  }
  const plasterWall = new THREE.CanvasTexture(plasterCanvas);
  plasterWall.wrapS = plasterWall.wrapT = THREE.RepeatWrapping;
  plasterWall.colorSpace = THREE.SRGBColorSpace;

  // 5. Roof Shingles / Tiles Texture
  const roofCanvas = document.createElement('canvas');
  roofCanvas.width = roofCanvas.height = 128;
  const rCtx = roofCanvas.getContext('2d')!;
  rCtx.fillStyle = '#4e281a';
  rCtx.fillRect(0, 0, 128, 128);
  for (let row = 0; row < 10; row++) {
    const y = row * 13;
    rCtx.fillStyle = '#261109';
    rCtx.fillRect(0, y, 128, 2);
    for (let col = 0; col < 8; col++) {
      const x = col * 16 + (row % 2) * 8;
      const r = 70 + Math.floor(Math.random() * 25);
      const g = 34 + Math.floor(Math.random() * 14);
      const b = 22 + Math.floor(Math.random() * 10);
      rCtx.fillStyle = `rgb(${r},${g},${b})`;
      rCtx.fillRect((x + 1) % 128, y + 2, 14, 10);
    }
  }
  const roofTile = new THREE.CanvasTexture(roofCanvas);
  roofTile.wrapS = roofTile.wrapT = THREE.RepeatWrapping;
  roofTile.repeat.set(4, 4);
  roofTile.colorSpace = THREE.SRGBColorSpace;

  // 6. Forged Steel / Armor Texture
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = metalCanvas.height = 64;
  const mCtx = metalCanvas.getContext('2d')!;
  mCtx.fillStyle = '#b4bcc4';
  mCtx.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 140; i++) {
    const v = 140 + Math.floor(Math.random() * 70);
    mCtx.fillStyle = `rgba(${v},${v + 5},${v + 10},0.35)`;
    mCtx.fillRect(Math.random() * 64, Math.random() * 64, 12, 1);
  }
  const metal = new THREE.CanvasTexture(metalCanvas);
  metal.wrapS = metal.wrapT = THREE.RepeatWrapping;
  metal.colorSpace = THREE.SRGBColorSpace;

  // 7. Woven Cloth / Leather Bump Texture
  const clothCanvas = document.createElement('canvas');
  clothCanvas.width = clothCanvas.height = 64;
  const cCtx = clothCanvas.getContext('2d')!;
  cCtx.fillStyle = '#808080';
  cCtx.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 2) {
    for (let x = 0; x < 64; x += 2) {
      const v = (x + y) % 4 === 0 ? 155 : 105;
      cCtx.fillStyle = `rgb(${v},${v},${v})`;
      cCtx.fillRect(x, y, 2, 2);
    }
  }
  const cloth = new THREE.CanvasTexture(clothCanvas);
  cloth.wrapS = cloth.wrapT = THREE.RepeatWrapping;
  cloth.repeat.set(6, 6);

  // 8. Soft Volumetric Cloud Texture
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = cloudCanvas.height = 128;
  const clCtx = cloudCanvas.getContext('2d')!;
  const grad = clCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255,250,240,0.95)');
  grad.addColorStop(0.5, 'rgba(235,230,220,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  clCtx.fillStyle = grad;
  for (let i = 0; i < 7; i++) {
    const cx = 24 + Math.random() * 80;
    const cy = 38 + Math.random() * 52;
    const r = 22 + Math.random() * 26;
    clCtx.beginPath();
    clCtx.arc(cx, cy, r, 0, Math.PI * 2);
    clCtx.fill();
  }
  const cloud = new THREE.CanvasTexture(cloudCanvas);
  cloud.colorSpace = THREE.SRGBColorSpace;

  // 9. Curved Sword Slash Gradient Texture (Sharp steel edge + motion trail)
  const slashCanvas = document.createElement('canvas');
  slashCanvas.width = 256;
  slashCanvas.height = 64;
  const slCtx = slashCanvas.getContext('2d')!;
  const slGrad = slCtx.createLinearGradient(0, 0, 256, 0);
  slGrad.addColorStop(0, 'rgba(180, 195, 210, 0)');
  slGrad.addColorStop(0.45, 'rgba(200, 215, 230, 0.28)');
  slGrad.addColorStop(0.85, 'rgba(235, 240, 245, 0.82)');
  slGrad.addColorStop(0.97, 'rgba(255, 250, 235, 0.98)');
  slGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  slCtx.fillStyle = slGrad;
  slCtx.fillRect(0, 0, 256, 64);
  const slashArc = new THREE.CanvasTexture(slashCanvas);
  slashArc.colorSpace = THREE.SRGBColorSpace;

  cachedTextures = {
    terrainGround,
    terrainBump,
    terrainRoughness,
    bark,
    stoneWall,
    plasterWall,
    roofTile,
    metal,
    cloth,
    cloud,
    slashArc,
  };
  return cachedTextures;
}
