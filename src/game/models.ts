import * as THREE from 'three';
import { ProceduralTextures } from './textures';

export interface EntityRig {
  kind: 'humanoid' | 'wolf' | 'bear' | 'orc' | 'skeleton' | 'troll' | 'horse' | 'bird' | 'golem';
  hipL?: THREE.Group;
  hipR?: THREE.Group;
  kneeL?: THREE.Group;
  kneeR?: THREE.Group;
  shoulderL?: THREE.Group;
  shoulderR?: THREE.Group;
  elbowL?: THREE.Group;
  elbowR?: THREE.Group;
  body: THREE.Object3D;
  headGroup?: THREE.Group;
  cloak?: THREE.Mesh;
  // Quadruped legs for Wolf & Horse
  legFL?: THREE.Group;
  legFR?: THREE.Group;
  legBL?: THREE.Group;
  legBR?: THREE.Group;
  legs?: THREE.Group[];
  tail?: THREE.Mesh;
  jaw?: THREE.Mesh;
  hitMeshes: THREE.Mesh[];
}

function collectMeshes(group: THREE.Group): THREE.Mesh[] {
  const list: THREE.Mesh[] = [];
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      list.push(obj as THREE.Mesh);
    }
  });
  return list;
}

export function createForgedSword(textures: ProceduralTextures, isRusty = false): THREE.Group {
  const g = new THREE.Group();
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.05, 0.32, 8),
    new THREE.MeshStandardMaterial({ color: 0x3b2313, roughness: 0.9 })
  );
  g.add(grip);

  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.06, 0.09),
    new THREE.MeshStandardMaterial({
      color: isRusty ? 0x5a4632 : 0xb89040,
      metalness: 0.8,
      roughness: 0.3,
    })
  );
  guard.position.y = 0.18;
  g.add(guard);

  const bladeMat = new THREE.MeshStandardMaterial({
    map: textures.metal,
    color: isRusty ? 0x8a7d70 : 0xdbe4eb,
    metalness: isRusty ? 0.65 : 0.92,
    roughness: isRusty ? 0.55 : 0.18,
  });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.095, 1.32, 0.028), bladeMat);
  blade.position.y = 0.86;
  blade.castShadow = true;
  g.add(blade);

  // Fuller (groove) down the blade
  const fuller = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.95, 0.032),
    new THREE.MeshStandardMaterial({ color: 0x55606a, metalness: 0.9, roughness: 0.35 })
  );
  fuller.position.y = 0.72;
  g.add(fuller);

  const pommel = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.075, 0),
    new THREE.MeshStandardMaterial({ color: 0xc89d48, metalness: 0.85, roughness: 0.25 })
  );
  pommel.position.y = -0.19;
  g.add(pommel);

  return g;
}

export function createOrcBattleAxe(textures: ProceduralTextures): THREE.Group {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 1.55, 7),
    new THREE.MeshStandardMaterial({ map: textures.bark, color: 0x4a2e1b, roughness: 0.95 })
  );
  handle.position.y = 0.55;
  handle.castShadow = true;
  g.add(handle);

  const headMat = new THREE.MeshStandardMaterial({
    map: textures.metal,
    color: 0x70757a,
    metalness: 0.85,
    roughness: 0.35,
  });
  const bladeL = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.55, 4), headMat);
  bladeL.rotation.z = Math.PI / 2;
  bladeL.scale.set(0.35, 1, 1.1);
  bladeL.position.set(0, 1.1, 0.22);
  bladeL.castShadow = true;
  g.add(bladeL);

  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 5), headMat);
  spike.position.set(0, 1.42, 0);
  g.add(spike);

  return g;
}

// ============================================================
// 1. HUMANOID (Player & Village NPCs)
// ============================================================
export function createHumanoid(
  clothColor: number,
  textures: ProceduralTextures,
  skinColor = 0xe8c090,
  scale = 1,
  isArmor = false
): THREE.Group {
  const g = new THREE.Group();

  const legMat = new THREE.MeshStandardMaterial({
    color: 0x281a11,
    bumpMap: textures.cloth,
    bumpScale: 0.015,
    roughness: 0.92,
  });
  const thighGeo = new THREE.CapsuleGeometry(0.15, 0.45, 5, 8);
  const shinGeo = new THREE.CapsuleGeometry(0.13, 0.4, 5, 8);

  const hipL = new THREE.Group();
  hipL.position.set(-0.18, 0.85, 0);
  const thighL = new THREE.Mesh(thighGeo, legMat);
  thighL.position.set(0, -0.22, 0);
  thighL.castShadow = true;
  hipL.add(thighL);
  const kneeL = new THREE.Group();
  kneeL.position.set(0, -0.45, 0);
  const shinL = new THREE.Mesh(shinGeo, legMat);
  shinL.position.set(0, -0.22, 0);
  shinL.castShadow = true;
  kneeL.add(shinL);
  hipL.add(kneeL);
  g.add(hipL);

  const hipR = new THREE.Group();
  hipR.position.set(0.18, 0.85, 0);
  const thighR = new THREE.Mesh(thighGeo, legMat);
  thighR.position.set(0, -0.22, 0);
  thighR.castShadow = true;
  hipR.add(thighR);
  const kneeR = new THREE.Group();
  kneeR.position.set(0, -0.45, 0);
  const shinR = new THREE.Mesh(shinGeo, legMat);
  shinR.position.set(0, -0.22, 0);
  shinR.castShadow = true;
  kneeR.add(shinR);
  hipR.add(kneeR);
  g.add(hipR);

  const bootMat = new THREE.MeshStandardMaterial({ color: 0x1a0f08, roughness: 0.85 });
  const bootGeo = new THREE.BoxGeometry(0.28, 0.22, 0.42);
  const bootL = new THREE.Mesh(bootGeo, bootMat);
  bootL.position.set(0, -0.22, 0.06);
  bootL.castShadow = true;
  kneeL.add(bootL);
  const bootR = new THREE.Mesh(bootGeo, bootMat);
  bootR.position.set(0, -0.22, 0.06);
  bootR.castShadow = true;
  kneeR.add(bootR);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: clothColor,
    bumpMap: textures.cloth,
    bumpScale: 0.02,
    roughness: isArmor ? 0.5 : 0.85,
    metalness: isArmor ? 0.45 : 0.08,
  });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.9, 6, 10), bodyMat);
  body.position.y = 1.4;
  body.castShadow = true;
  g.add(body);

  // Chest leather harness / cuirass detail
  const chestPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.47, 0.43, 0.55, 10),
    new THREE.MeshStandardMaterial({
      color: isArmor ? 0x6e7680 : 0x3d2616,
      metalness: isArmor ? 0.75 : 0.2,
      roughness: isArmor ? 0.35 : 0.8,
    })
  );
  chestPlate.position.y = 1.48;
  g.add(chestPlate);

  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 0.15, 12),
    new THREE.MeshStandardMaterial({ color: 0x2a180c, roughness: 0.8 })
  );
  belt.position.y = 1.0;
  g.add(belt);

  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.16, 0.09),
    new THREE.MeshStandardMaterial({ color: 0xd4a84e, metalness: 0.85, roughness: 0.2 })
  );
  buckle.position.set(0, 1.0, 0.47);
  g.add(buckle);

  const pauldronMat = new THREE.MeshStandardMaterial({
    map: textures.metal,
    color: isArmor ? 0x9aa4b0 : 0x4e3522,
    metalness: isArmor ? 0.8 : 0.35,
    roughness: 0.4,
  });
  const shoulderGeo = new THREE.SphereGeometry(0.22, 10, 8);
  const shL = new THREE.Mesh(shoulderGeo, pauldronMat);
  shL.position.set(-0.52, 1.86, 0);
  shL.scale.set(1.1, 0.85, 1.1);
  shL.castShadow = true;
  g.add(shL);
  const shR = new THREE.Mesh(shoulderGeo, pauldronMat);
  shR.position.set(0.52, 1.86, 0);
  shR.scale.set(1.1, 0.85, 1.1);
  shR.castShadow = true;
  g.add(shR);

  const armGeo = new THREE.CapsuleGeometry(0.12, 0.4, 4, 8);
  const forearmGeo = new THREE.CapsuleGeometry(0.1, 0.35, 4, 8);
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.85 });

  const shoulderL = new THREE.Group();
  shoulderL.position.set(-0.55, 1.75, 0);
  const upperArmL = new THREE.Mesh(armGeo, bodyMat);
  upperArmL.position.set(0, -0.2, 0);
  upperArmL.castShadow = true;
  shoulderL.add(upperArmL);
  const elbowL = new THREE.Group();
  elbowL.position.set(0, -0.4, 0);
  const forearmL = new THREE.Mesh(forearmGeo, bodyMat);
  forearmL.position.set(0, -0.18, 0);
  forearmL.castShadow = true;
  elbowL.add(forearmL);
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), skinMat);
  handL.position.set(0, -0.38, 0);
  elbowL.add(handL);
  shoulderL.add(elbowL);
  g.add(shoulderL);

  const shoulderR = new THREE.Group();
  shoulderR.position.set(0.55, 1.75, 0);
  const upperArmR = new THREE.Mesh(armGeo, bodyMat);
  upperArmR.position.set(0, -0.2, 0);
  upperArmR.castShadow = true;
  shoulderR.add(upperArmR);
  const elbowR = new THREE.Group();
  elbowR.position.set(0, -0.4, 0);
  const forearmR = new THREE.Mesh(forearmGeo, bodyMat);
  forearmR.position.set(0, -0.18, 0);
  forearmR.castShadow = true;
  elbowR.add(forearmR);
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), skinMat);
  handR.position.set(0, -0.38, 0);
  elbowR.add(handR);
  shoulderR.add(elbowR);
  g.add(shoulderR);

  const headGroup = new THREE.Group();
  headGroup.position.y = 2.25;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), skinMat);
  head.castShadow = true;
  headGroup.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.335, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62),
    new THREE.MeshStandardMaterial({ color: 0x24160d, roughness: 0.95 })
  );
  hair.position.y = 0.04;
  hair.rotation.x = -0.15;
  headGroup.add(hair);

  // Pony-tail / Gothic hero hair knot at the back
  const ponytail = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.06, 0.22, 4, 6),
    new THREE.MeshStandardMaterial({ color: 0x24160d, roughness: 0.95 })
  );
  ponytail.position.set(0, -0.08, -0.34);
  ponytail.rotation.x = 0.4;
  headGroup.add(ponytail);

  const eyeGeo = new THREE.SphereGeometry(0.065, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xf4f8ff,
    roughness: 0.3,
    emissive: 0x223344,
    emissiveIntensity: 0.25,
  });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.11, 0.05, 0.27);
  headGroup.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.11, 0.05, 0.27);
  headGroup.add(eyeR);

  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x101820 });
  const pupilGeo = new THREE.SphereGeometry(0.035, 6, 6);
  const pL = new THREE.Mesh(pupilGeo, pupilMat);
  pL.position.set(-0.11, 0.05, 0.325);
  headGroup.add(pL);
  const pR = new THREE.Mesh(pupilGeo, pupilMat);
  pR.position.set(0.11, 0.05, 0.325);
  headGroup.add(pR);

  // Beard / goatee for Gothic aesthetic
  const beard = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.22, 6),
    new THREE.MeshStandardMaterial({ color: 0x24160d, roughness: 1 })
  );
  beard.position.set(0, -0.22, 0.24);
  beard.rotation.x = Math.PI;
  headGroup.add(beard);

  g.add(headGroup);

  const cloak = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 1.55, 4, 6),
    new THREE.MeshStandardMaterial({
      color: 0x23150c,
      bumpMap: textures.cloth,
      bumpScale: 0.02,
      roughness: 0.95,
      side: THREE.DoubleSide,
    })
  );
  cloak.position.set(0, 1.38, -0.48);
  cloak.rotation.x = -0.06;
  cloak.castShadow = true;
  g.add(cloak);

  g.scale.setScalar(scale);
  const rig: EntityRig = {
    kind: 'humanoid',
    hipL,
    hipR,
    kneeL,
    kneeR,
    shoulderL,
    shoulderR,
    elbowL,
    elbowR,
    body,
    headGroup,
    cloak,
    hitMeshes: collectMeshes(g),
  };
  g.userData = rig;
  return g;
}

// ============================================================
// 1B. FEMALE HUMANOID (Женственный скин персонажа — Целительница Елена)
//     Изящная талия, корсет с золотой шнуровкой, длинное средневековое платье,
//     передник травницы с флаконами зелий, нежные черты лица, длинные локоны и венок из трав
// ============================================================
export function createFemaleHumanoid(
  dressColor: number,
  textures: ProceduralTextures,
  skinColor = 0xf6d2c2,
  scale = 0.96
): THREE.Group {
  const g = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.72 });
  const dressMat = new THREE.MeshStandardMaterial({
    color: dressColor,
    bumpMap: textures.cloth,
    bumpScale: 0.015,
    roughness: 0.82,
  });
  const bodiceMat = new THREE.MeshStandardMaterial({
    color: 0x5c1f3c,
    bumpMap: textures.cloth,
    bumpScale: 0.018,
    roughness: 0.75,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe5be62,
    metalness: 0.8,
    roughness: 0.25,
  });
  const creamSilkMat = new THREE.MeshStandardMaterial({
    color: 0xf7efe2,
    roughness: 0.78,
  });

  // Изящные женские ножки и аккуратные сапожки под платьем
  const legGeo = new THREE.CapsuleGeometry(0.105, 0.42, 5, 8);
  const shinGeo = new THREE.CapsuleGeometry(0.09, 0.38, 5, 8);
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x3b2216, roughness: 0.8 });

  const hipL = new THREE.Group();
  hipL.position.set(-0.14, 0.84, 0);
  const thighL = new THREE.Mesh(legGeo, skinMat);
  thighL.position.set(0, -0.2, 0);
  hipL.add(thighL);
  const kneeL = new THREE.Group();
  kneeL.position.set(0, -0.42, 0);
  const shinL = new THREE.Mesh(shinGeo, skinMat);
  shinL.position.set(0, -0.2, 0);
  kneeL.add(shinL);
  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.34), bootMat);
  bootL.position.set(0, -0.22, 0.05);
  kneeL.add(bootL);
  hipL.add(kneeL);
  g.add(hipL);

  const hipR = new THREE.Group();
  hipR.position.set(0.14, 0.84, 0);
  const thighR = new THREE.Mesh(legGeo, skinMat);
  thighR.position.set(0, -0.2, 0);
  hipR.add(thighR);
  const kneeR = new THREE.Group();
  kneeR.position.set(0, -0.42, 0);
  const shinR = new THREE.Mesh(shinGeo, skinMat);
  shinR.position.set(0, -0.2, 0);
  kneeR.add(shinR);
  const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.34), bootMat);
  bootR.position.set(0, -0.22, 0.05);
  kneeR.add(bootR);
  hipR.add(kneeR);
  g.add(hipR);

  // Женственный силуэт (песочные часы: тонкая талия + расклешённая юбка + корсаж)
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.21, 0.56, 12), bodiceMat);
  body.position.y = 1.46;
  body.castShadow = true;
  g.add(body);

  // Верхняя светлая блуза у декольте
  const neckline = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.26, 0.22, 12), creamSilkMat);
  neckline.position.y = 1.72;
  g.add(neckline);

  // Женственный бюст
  const bustGeo = new THREE.SphereGeometry(0.155, 10, 10);
  const bustL = new THREE.Mesh(bustGeo, bodiceMat);
  bustL.scale.set(1.0, 0.92, 1.08);
  bustL.position.set(-0.11, 1.54, 0.17);
  const bustR = new THREE.Mesh(bustGeo, bodiceMat);
  bustR.scale.set(1.0, 0.92, 1.08);
  bustR.position.set(0.11, 1.54, 0.17);
  g.add(bustL, bustR);

  // Золотая шнуровка корсета спереди
  const lacing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.04), goldTrimMat);
  lacing.position.set(0, 1.42, 0.25);
  g.add(lacing);

  // Длинная расклешённая юбка платья до щиколоток
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.56, 1.02, 16), dressMat);
  skirt.position.y = 0.68;
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  g.add(skirt);

  // Золотая кайма по низу платья
  const skirtHem = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 8, 20), goldTrimMat);
  skirtHem.rotation.x = Math.PI / 2;
  skirtHem.position.y = 0.19;
  g.add(skirtHem);

  // Светлый передник травницы и пояс с алхимическими флаконами зелий
  const apron = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.72, 0.04), creamSilkMat);
  apron.position.set(0, 0.76, 0.36);
  apron.rotation.x = -0.26;
  g.add(apron);

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.03, 8, 16), goldTrimMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 1.16;
  g.add(belt);

  // Два светящихся флакончика с зельями на поясе Елены
  const vialRed = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0xff3355,
      emissive: 0xaa1133,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    })
  );
  vialRed.position.set(0.24, 1.1, 0.12);
  g.add(vialRed);

  const vialBlue = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0x33bbff,
      emissive: 0x1166cc,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    })
  );
  vialBlue.position.set(-0.24, 1.1, 0.12);
  g.add(vialBlue);

  // Плавные женские плечи и рукава-фонарики
  const puffGeo = new THREE.SphereGeometry(0.15, 10, 8);
  const shL = new THREE.Mesh(puffGeo, creamSilkMat);
  shL.position.set(-0.36, 1.72, 0);
  g.add(shL);
  const shR = new THREE.Mesh(puffGeo, creamSilkMat);
  shR.position.set(0.36, 1.72, 0);
  g.add(shR);

  const armGeo = new THREE.CapsuleGeometry(0.085, 0.36, 4, 8);
  const forearmGeo = new THREE.CapsuleGeometry(0.072, 0.33, 4, 8);

  const shoulderL = new THREE.Group();
  shoulderL.position.set(-0.38, 1.68, 0);
  const upperArmL = new THREE.Mesh(armGeo, creamSilkMat);
  upperArmL.position.set(0, -0.18, 0);
  shoulderL.add(upperArmL);
  const elbowL = new THREE.Group();
  elbowL.position.set(0, -0.36, 0);
  const forearmL = new THREE.Mesh(forearmGeo, skinMat);
  forearmL.position.set(0, -0.16, 0);
  elbowL.add(forearmL);
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.085, 6, 6), skinMat);
  handL.position.set(0, -0.34, 0);
  elbowL.add(handL);
  shoulderL.add(elbowL);
  g.add(shoulderL);

  const shoulderR = new THREE.Group();
  shoulderR.position.set(0.38, 1.68, 0);
  const upperArmR = new THREE.Mesh(armGeo, creamSilkMat);
  upperArmR.position.set(0, -0.18, 0);
  shoulderR.add(upperArmR);
  const elbowR = new THREE.Group();
  elbowR.position.set(0, -0.36, 0);
  const forearmR = new THREE.Mesh(forearmGeo, skinMat);
  forearmR.position.set(0, -0.16, 0);
  elbowR.add(forearmR);
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.085, 6, 6), skinMat);
  handR.position.set(0, -0.34, 0);
  elbowR.add(handR);
  shoulderR.add(elbowR);
  g.add(shoulderR);

  // Изящная шея и женственная голова без бороды, с румянцем, губами, ресницами и длинными локонами
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.22, 8), skinMat);
  neck.position.y = 1.92;
  g.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.y = 2.18;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), skinMat);
  head.scale.set(0.94, 1.04, 0.95);
  head.castShadow = true;
  headGroup.add(head);

  // Длинные пышные каштаново-золотистые женские волосы и локоны
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x6b3618, roughness: 0.78 });
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65),
    hairMat
  );
  hairCap.position.y = 0.04;
  hairCap.rotation.x = -0.12;
  headGroup.add(hairCap);

  // Длинные волнистые локоны по спине и двум плечам спереди
  const backHair = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.58, 6, 8), hairMat);
  backHair.position.set(0, -0.28, -0.18);
  backHair.scale.set(1.2, 1.0, 0.65);
  headGroup.add(backHair);

  const braidL = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.46, 5, 6), hairMat);
  braidL.position.set(-0.21, -0.24, 0.11);
  braidL.rotation.z = 0.12;
  headGroup.add(braidL);

  const braidR = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.46, 5, 6), hairMat);
  braidR.position.set(0.21, -0.24, 0.11);
  braidR.rotation.z = -0.12;
  headGroup.add(braidR);

  // Цветочный венок травницы на голове Елены
  const wreath = new THREE.Mesh(
    new THREE.TorusGeometry(0.27, 0.032, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0x3b8a3e, roughness: 0.7 })
  );
  wreath.rotation.x = Math.PI / 2 - 0.15;
  wreath.position.set(0, 0.16, 0.01);
  headGroup.add(wreath);

  const flowerColors = [0xff66aa, 0xffdd44, 0x66ccff, 0xff88aa];
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const fl = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 6, 6),
      new THREE.MeshBasicMaterial({ color: flowerColors[i % flowerColors.length] })
    );
    fl.position.set(Math.cos(ang) * 0.27, 0.17 + Math.sin(ang) * 0.03, Math.sin(ang) * 0.27);
    headGroup.add(fl);
  }

  // Изумрудно-голубые выразительные глаза, ресницы, румянец и нежные губы
  const eyeWhiteGeo = new THREE.SphereGeometry(0.058, 8, 8);
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeL = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  eyeL.position.set(-0.095, 0.04, 0.235);
  const eyeR = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  eyeR.position.set(0.095, 0.04, 0.235);
  headGroup.add(eyeL, eyeR);

  const irisMat = new THREE.MeshBasicMaterial({ color: 0x249988 });
  const irisGeo = new THREE.SphereGeometry(0.034, 6, 6);
  const pL = new THREE.Mesh(irisGeo, irisMat);
  pL.position.set(-0.095, 0.04, 0.278);
  const pR = new THREE.Mesh(irisGeo, irisMat);
  pR.position.set(0.095, 0.04, 0.278);
  headGroup.add(pL, pR);

  // Нежные губы ягодного оттенка
  const lips = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.022, 0.065, 4, 6),
    new THREE.MeshStandardMaterial({ color: 0xd4526e, roughness: 0.4 })
  );
  lips.rotation.z = Math.PI / 2;
  lips.position.set(0, -0.095, 0.255);
  headGroup.add(lips);

  // Лёгкий румянец на щёчках
  const blushMat = new THREE.MeshBasicMaterial({
    color: 0xf08090,
    transparent: true,
    opacity: 0.42,
  });
  const blushL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), blushMat);
  blushL.position.set(-0.15, -0.03, 0.22);
  const blushR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), blushMat);
  blushR.position.set(0.15, -0.03, 0.22);
  headGroup.add(blushL, blushR);

  g.add(headGroup);

  // Лёгкая шаль-накидка травницы за плечами
  const cloak = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 1.25, 4, 6),
    new THREE.MeshStandardMaterial({
      color: 0x6e2446,
      bumpMap: textures.cloth,
      bumpScale: 0.015,
      roughness: 0.85,
      side: THREE.DoubleSide,
    })
  );
  cloak.position.set(0, 1.32, -0.34);
  cloak.rotation.x = -0.08;
  g.add(cloak);

  g.scale.setScalar(scale);
  const rig: EntityRig = {
    kind: 'humanoid',
    hipL,
    hipR,
    kneeL,
    kneeR,
    shoulderL,
    shoulderR,
    elbowL,
    elbowR,
    body,
    headGroup,
    cloak,
    hitMeshes: collectMeshes(g),
  };
  g.userData = rig;
  return g;
}

// ============================================================
// 1C. ИНДИВИДУАЛЬНЫЕ 3D-СКИНЫ ДЛЯ КАЖДОГО ОТДЕЛЬНОГО NPC-ПЕРСОНАЖА!
//     Каждый персонаж деревни и лагеря имеет свой неповторимый облик,
//     одежду, головной убор, причёску/бороду, телосложение и рабочий атрибут!
// ============================================================
export function createCharacterNPCSkin(
  dialogKey: string,
  baseColor: number,
  textures: ProceduralTextures
): THREE.Group {
  if (dialogKey === 'healer') {
    return createFemaleHumanoid(baseColor, textures);
  }

  // Настраиваем индивидуальное телосложение, оттенок кожи и базовую одежду для каждого NPC
  const roleMap: Record<
    string,
    {
      tunicColor: number;
      skinColor: number;
      scaleX: number;
      scaleY: number;
      scaleZ: number;
      hasArmor: boolean;
      beardColor: number;
      beardLen: number;
      cloakColor: number | null;
    }
  > = {
    elder: {
      tunicColor: 0x6b2228, // Багряно-золотая мантия Старейшины Горна
      skinColor: 0xe6be94,
      scaleX: 0.98,
      scaleY: 1.03,
      scaleZ: 0.98,
      hasArmor: false,
      beardColor: 0xdcdcdc, // Длинная седая борода мудреца
      beardLen: 0.44,
      cloakColor: 0x4a1419,
    },
    smith: {
      tunicColor: 0x4a2f1d, // Кожаная кузнечная роба Торуса
      skinColor: 0xdca87e, // Загорелая от горна кожа
      scaleX: 1.18, // Могучие широкие плечи кузнеца!
      scaleY: 1.02,
      scaleZ: 1.15,
      hasArmor: false,
      beardColor: 0x1a120c, // Густая чёрная окладистая борода
      beardLen: 0.28,
      cloakColor: null, // Без плаща, чтобы не мешал у наковальни
    },
    trader: {
      tunicColor: 0x1f5c58, // Богатый бирюзово-изумрудный кафтан купца Хакона
      skinColor: 0xeac49a,
      scaleX: 1.12, // Дородный зажиточный купец
      scaleY: 0.98,
      scaleZ: 1.14,
      hasArmor: false,
      beardColor: 0x5c3418, // Аккуратная каштановая бородка
      beardLen: 0.2,
      cloakColor: 0x7a4a18, // Бархатный золотисто-бурый плащ
    },
    guard: {
      tunicColor: 0x283858, // Королевский сине-стальной доспех Стражника Диего
      skinColor: 0xe2b88c,
      scaleX: 1.08,
      scaleY: 1.05,
      scaleZ: 1.06,
      hasArmor: true,
      beardColor: 0x2c1d12,
      beardLen: 0.16,
      cloakColor: 0x7c1c1c, // Алый воинский плащ стражника
    },
    woodcutter: {
      tunicColor: 0x8a3b22, // Клетчато-терракотовая плотная рубаха Лесоруба Брома
      skinColor: 0xe5b88b,
      scaleX: 1.14, // Крепкий плечистый дровосек
      scaleY: 1.01,
      scaleZ: 1.1,
      hasArmor: false,
      beardColor: 0x9c481e, // Рыжая густая борода лесоруба!
      beardLen: 0.32,
      cloakColor: null,
    },
    fisherman: {
      tunicColor: 0x2e5872, // Морская сине-зелёная куртка Рыбака Фарима
      skinColor: 0xdca97e,
      scaleX: 0.95,
      scaleY: 0.99,
      scaleZ: 0.95,
      hasArmor: false,
      beardColor: 0x7a7670, // Солёная седоватая шкиперская бородка
      beardLen: 0.22,
      cloakColor: 0x3b4c54,
    },
    hunter: {
      tunicColor: 0x2e4e28, // Лесной камуфляжно-зелёный дублет Охотника Ларса
      skinColor: 0xe4ba90,
      scaleX: 0.96, // Поджарый ловкий следопыт
      scaleY: 1.03,
      scaleZ: 0.96,
      hasArmor: false,
      beardColor: 0x4a321a,
      beardLen: 0.14,
      cloakColor: 0x243b1e, // Зелёный плащ рейнджера
    },
    mage_fire: {
      tunicColor: 0x9e1b1b, // Алая мантия Верховного Мага Огня Пирокара
      skinColor: 0xe8c298,
      scaleX: 1.02,
      scaleY: 1.06,
      scaleZ: 1.02,
      hasArmor: false,
      beardColor: 0xd8c8b8,
      beardLen: 0.36,
      cloakColor: 0xc83214,
    },
    mage_water: {
      tunicColor: 0x164e8a, // Сапфировая мантия Верховного Мага Воды Сатураса
      skinColor: 0xd8b088,
      scaleX: 1.0,
      scaleY: 1.05,
      scaleZ: 1.0,
      hasArmor: false,
      beardColor: 0xd0dce8,
      beardLen: 0.34,
      cloakColor: 0x1c72b8,
    },
    mage_air: {
      tunicColor: 0x247a74, // Бирюзово-небесная мантия Мага Воздуха Аэриона
      skinColor: 0xecd0a8,
      scaleX: 0.95,
      scaleY: 1.07,
      scaleZ: 0.95,
      hasArmor: false,
      beardColor: 0xe8f4f8,
      beardLen: 0.28,
      cloakColor: 0x4cc4b8,
    },
    mage_earth: {
      tunicColor: 0x3b5824, // Изумрудно-каменная мантия Мага Земли Торгалора
      skinColor: 0xdca878,
      scaleX: 1.12,
      scaleY: 1.05,
      scaleZ: 1.12,
      hasArmor: false,
      beardColor: 0x5c4228,
      beardLen: 0.4,
      cloakColor: 0x4e3b22,
    },
    mage_necro: {
      tunicColor: 0x261438, // Чёрно-пурпурная мантия Мага Некромагии и Ядов Ксардаса
      skinColor: 0xd0c8d8,
      scaleX: 1.0,
      scaleY: 1.08,
      scaleZ: 1.0,
      hasArmor: false,
      beardColor: 0x221a2e,
      beardLen: 0.38,
      cloakColor: 0x160b22,
    },
    cobbler: {
      tunicColor: 0x6e4224, // Кожаный дублет Сапожника Криспена
      skinColor: 0xe6be94,
      scaleX: 0.98,
      scaleY: 0.98,
      scaleZ: 1.0,
      hasArmor: false,
      beardColor: 0x6b3e20,
      beardLen: 0.18,
      cloakColor: null,
    },
    cook: {
      tunicColor: 0xdcd6c8, // Светлый поварской китель Повара Гаспара
      skinColor: 0xf0c29c,
      scaleX: 1.18, // Упитанный весёлый шеф-повар
      scaleY: 0.98,
      scaleZ: 1.2,
      hasArmor: false,
      beardColor: 0x4a2c18,
      beardLen: 0.14,
      cloakColor: null,
    },
    stablehand: {
      tunicColor: 0x5c4428, // Плотная жилетка Конюха Гюнтера
      skinColor: 0xe2b486,
      scaleX: 1.06,
      scaleY: 1.02,
      scaleZ: 1.04,
      hasArmor: false,
      beardColor: 0x8a6236,
      beardLen: 0.2,
      cloakColor: 0x4a351e,
    },
    worker: {
      tunicColor: 0x54585c, // Рабочая рубаха Каменотёса-работяги Борка
      skinColor: 0xd8a274,
      scaleX: 1.16, // Плечистый работяга
      scaleY: 1.01,
      scaleZ: 1.14,
      hasArmor: false,
      beardColor: 0x2b1e14,
      beardLen: 0.24,
      cloakColor: null,
    },
  };

  const cfg = roleMap[dialogKey] || {
    tunicColor: baseColor,
    skinColor: 0xe8c090,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    hasArmor: false,
    beardColor: 0x24160d,
    beardLen: 0.22,
    cloakColor: 0x23150c,
  };

  const g = createHumanoid(cfg.tunicColor, textures, cfg.skinColor, 1.0, cfg.hasArmor);
  g.scale.set(cfg.scaleX, cfg.scaleY, cfg.scaleZ);
  const rig = g.userData as EntityRig;

  // Настраиваем индивидуальный плащ (или убираем его у кузнеца и лесоруба)
  if (rig.cloak) {
    if (cfg.cloakColor === null) {
      rig.cloak.visible = false;
    } else {
      (rig.cloak.material as THREE.MeshStandardMaterial).color.setHex(cfg.cloakColor);
    }
  }

  // Настраиваем индивидуальную бороду в headGroup
  if (rig.headGroup) {
    const customBeard = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, cfg.beardLen, 7),
      new THREE.MeshStandardMaterial({ color: cfg.beardColor, roughness: 0.95 })
    );
    customBeard.position.set(0, -0.18 - cfg.beardLen * 0.35, 0.25);
    customBeard.rotation.x = Math.PI;
    rig.headGroup.add(customBeard);
  }

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe5be55,
    metalness: 0.85,
    roughness: 0.25,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x3b2313,
    roughness: 0.9,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    map: textures.metal,
    color: 0x8a929a,
    metalness: 0.85,
    roughness: 0.3,
  });

  // Добавляем яркие уникальные детали и реквизит каждому персонажу:
  if (dialogKey === 'elder') {
    // 👑 Старейшина Горн: Длинная мантия до земли с золотым орнаментом, венец старейшины и посох с кристаллом!
    const robeSkirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.56, 0.98, 12),
      new THREE.MeshStandardMaterial({
        color: 0x5c1920,
        bumpMap: textures.cloth,
        bumpScale: 0.02,
        roughness: 0.85,
      })
    );
    robeSkirt.position.y = 0.62;
    robeSkirt.castShadow = true;
    g.add(robeSkirt);

    const stole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.35, 0.04), goldMat);
    stole.position.set(0, 1.05, 0.42);
    g.add(stole);

    if (rig.headGroup) {
      const circlet = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.032, 8, 20), goldMat);
      circlet.rotation.x = Math.PI / 2 - 0.1;
      circlet.position.y = 0.14;
      rig.headGroup.add(circlet);
    }

    if (rig.elbowR) {
      const staff = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.03, 2.25, 7),
        leatherMat
      );
      staff.add(pole);
      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.14, 0),
        new THREE.MeshStandardMaterial({
          color: 0x44ddff,
          emissive: 0x1188cc,
          emissiveIntensity: 0.9,
          roughness: 0.15,
        })
      );
      orb.position.y = 1.2;
      staff.add(orb);
      staff.position.set(0, -0.35, 0.12);
      staff.rotation.x = Math.PI / 2;
      rig.elbowR.add(staff);
    }
  } else if (dialogKey === 'smith') {
    // 🔨 Кузнец Торус: Тяжёлый кожаный фартук кузнеца с металлическими заклёпками, обнажённые мускулистые руки и боевой молот!
    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 1.18, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x26170c, roughness: 0.92 })
    );
    apron.position.set(0, 1.02, 0.39);
    g.add(apron);

    if (rig.headGroup) {
      const headband = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.035, 6, 18),
        new THREE.MeshStandardMaterial({ color: 0x8a2818, roughness: 0.9 })
      );
      headband.rotation.x = Math.PI / 2 - 0.12;
      headband.position.y = 0.12;
      rig.headGroup.add(headband);
    }

    if (rig.elbowR) {
      const hammer = new THREE.Group();
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.78, 6), leatherMat);
      hammer.add(handle);
      const headBlock = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.42), ironMat);
      headBlock.position.y = 0.38;
      hammer.add(headBlock);
      hammer.position.set(0, -0.36, 0);
      hammer.rotation.set(0, 0, Math.PI);
      rig.elbowR.add(hammer);
    }
  } else if (dialogKey === 'trader') {
    // 💰 Торговец Хакон: Пышный бархатный берет с золотым пером, массивная золотая цепь на груди и тугой кошель с золотом!
    if (rig.headGroup) {
      const beret = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0x8c1d28, roughness: 0.85 })
      );
      beret.scale.set(1.1, 0.42, 1.1);
      beret.position.set(0.04, 0.24, 0);
      beret.rotation.z = -0.15;
      rig.headGroup.add(beret);

      const feather = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.36, 5), goldMat);
      feather.position.set(0.28, 0.36, 0.06);
      feather.rotation.z = -0.45;
      rig.headGroup.add(feather);
    }

    const goldChain = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.035, 8, 20), goldMat);
    goldChain.position.set(0, 1.62, 0.18);
    goldChain.rotation.x = 1.15;
    g.add(goldChain);

    const coinPouch = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), goldMat);
    coinPouch.position.set(0.38, 1.05, 0.22);
    g.add(coinPouch);
  } else if (dialogKey === 'guard') {
    // 🛡️ Стражник Диего: Высокий стальной шлем с красным гребнем, алебарда в правой руке и гербовый щит на левой!
    if (rig.headGroup) {
      const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.35, 0.34, 10), ironMat);
      helm.position.y = 0.16;
      rig.headGroup.add(helm);

      const plume = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.26, 0.48),
        new THREE.MeshStandardMaterial({ color: 0xcc1818, roughness: 0.8 })
      );
      plume.position.set(0, 0.38, -0.04);
      rig.headGroup.add(plume);
    }

    if (rig.elbowR) {
      const halberd = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 2.5, 6), leatherMat);
      halberd.add(shaft);
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 4), ironMat);
      blade.position.y = 1.35;
      halberd.add(blade);
      halberd.position.set(0, -0.35, 0.08);
      halberd.rotation.x = Math.PI / 2;
      rig.elbowR.add(halberd);
    }

    if (rig.elbowL) {
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.56), ironMat);
      shield.position.set(-0.14, -0.2, 0.08);
      rig.elbowL.add(shield);
    }
  } else if (dialogKey === 'woodcutter') {
    // 🪓 Лесоруб Бром: Тёплая меховая шапка, кожаные подтяжки и большой двуручный топор дровосека!
    if (rig.headGroup) {
      const furCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.33, 0.35, 0.24, 10),
        new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.98 })
      );
      furCap.position.y = 0.18;
      rig.headGroup.add(furCap);
    }

    const suspenderL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.82, 0.76), leatherMat);
    suspenderL.position.set(-0.2, 1.42, 0);
    const suspenderR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.82, 0.76), leatherMat);
    suspenderR.position.set(0.2, 1.42, 0);
    g.add(suspenderL, suspenderR);

    if (rig.elbowR) {
      const woodAxe = createOrcBattleAxe(textures);
      woodAxe.scale.setScalar(0.88);
      woodAxe.position.set(0, -0.36, 0);
      woodAxe.rotation.set(0, 0, Math.PI);
      rig.elbowR.add(woodAxe);
    }
  } else if (dialogKey === 'fisherman') {
    // 🎣 Рыбак Фарим: Широкополая соломенная шляпа рыбака, плетёная корзина для рыбы за спиной!
    if (rig.headGroup) {
      const strawMat = new THREE.MeshStandardMaterial({ color: 0xd8b868, roughness: 0.9 });
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.58, 0.05, 14), strawMat);
      brim.position.y = 0.2;
      rig.headGroup.add(brim);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.22, 12), strawMat);
      crown.position.y = 0.31;
      rig.headGroup.add(crown);
    }

    const creelBasket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.2, 0.55, 8),
      new THREE.MeshStandardMaterial({ color: 0x8c6836, roughness: 0.95 })
    );
    creelBasket.position.set(0, 1.42, -0.46);
    g.add(creelBasket);
  } else if (dialogKey === 'hunter') {
    // 🏹 Охотник Ларс: Охотничья шляпа с пером фазана, колчан со стрелами за спиной и длинный тисовый лук!
    if (rig.headGroup) {
      const hat = new THREE.Mesh(
        new THREE.ConeGeometry(0.38, 0.34, 8),
        new THREE.MeshStandardMaterial({ color: 0x26421e, roughness: 0.9 })
      );
      hat.position.y = 0.28;
      rig.headGroup.add(hat);

      const feather = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.32, 4),
        new THREE.MeshStandardMaterial({ color: 0xe64822, roughness: 0.6 })
      );
      feather.position.set(0.22, 0.34, -0.05);
      feather.rotation.z = -0.35;
      rig.headGroup.add(feather);
    }

    const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.72, 8), leatherMat);
    quiver.position.set(0.22, 1.52, -0.44);
    quiver.rotation.z = -0.28;
    g.add(quiver);

    if (rig.elbowL) {
      const bow = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.03, 6, 16, Math.PI),
        leatherMat
      );
      bow.position.set(-0.08, -0.32, 0.12);
      bow.rotation.z = -Math.PI / 2;
      rig.elbowL.add(bow);
    }
  } else if (dialogKey.startsWith('mage_')) {
    // 🔮 МАГИ-НАСТАВНИКИ 5 СТИХИЙ (Огонь, Вода, Воздух, Земля, Некромагия и Яды)
    const mageTheme: Record<
      string,
      { robeHex: number; glowHex: number; trimHex: number; hatHex: number }
    > = {
      mage_fire: { robeHex: 0x8a1414, glowHex: 0xff4400, trimHex: 0xffc838, hatHex: 0xaa1c1c },
      mage_water: { robeHex: 0x123e72, glowHex: 0x22ccff, trimHex: 0xc8e8ff, hatHex: 0x185496 },
      mage_air: { robeHex: 0x1c6662, glowHex: 0x88ffea, trimHex: 0xe6fff8, hatHex: 0x26827c },
      mage_earth: { robeHex: 0x2f481c, glowHex: 0x99e633, trimHex: 0xc29b48, hatHex: 0x3b5824 },
      mage_necro: { robeHex: 0x1d0f2c, glowHex: 0x66ff22, trimHex: 0x9b4dff, hatHex: 0x150a22 },
    };
    const mt = mageTheme[dialogKey] || mageTheme.mage_fire;
    const robeSkirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.39, 0.62, 1.04, 12),
      new THREE.MeshStandardMaterial({ color: mt.robeHex, roughness: 0.78 })
    );
    robeSkirt.position.y = 0.62;
    robeSkirt.castShadow = true;
    g.add(robeSkirt);

    const runeStole = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 1.38, 0.045),
      new THREE.MeshStandardMaterial({
        color: mt.trimHex,
        emissive: mt.glowHex,
        emissiveIntensity: 0.35,
        metalness: 0.7,
        roughness: 0.25,
      })
    );
    runeStole.position.set(0, 1.05, 0.42);
    g.add(runeStole);

    // Магическая мантия-оплечье и головной убор стихии
    if (rig.headGroup) {
      if (dialogKey === 'mage_necro' || dialogKey === 'mage_earth') {
        const crown = new THREE.Mesh(
          new THREE.TorusGeometry(0.32, 0.04, 8, 18),
          new THREE.MeshStandardMaterial({
            color: mt.trimHex,
            emissive: mt.glowHex,
            emissiveIntensity: 0.6,
            metalness: 0.8,
          })
        );
        crown.rotation.x = Math.PI / 2 - 0.1;
        crown.position.y = 0.18;
        rig.headGroup.add(crown);
      } else {
        const wizardHat = new THREE.Mesh(
          new THREE.ConeGeometry(0.42, 0.65, 10),
          new THREE.MeshStandardMaterial({ color: mt.hatHex, roughness: 0.8 })
        );
        wizardHat.position.y = 0.42;
        wizardHat.rotation.x = -0.15;
        rig.headGroup.add(wizardHat);
      }
    }

    // Стихийный посох Верховного Мага с парящей сферой магии в правой руке
    if (rig.elbowR) {
      const staff = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.032, 2.35, 7),
        leatherMat
      );
      staff.add(pole);
      const staffCrown = new THREE.Mesh(
        new THREE.TorusGeometry(0.19, 0.028, 7, 16),
        goldMat
      );
      staffCrown.position.y = 1.22;
      staff.add(staffCrown);
      const elemOrb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16, 1),
        new THREE.MeshStandardMaterial({
          color: mt.glowHex,
          emissive: mt.glowHex,
          emissiveIntensity: 1.25,
          roughness: 0.1,
        })
      );
      elemOrb.position.y = 1.22;
      staff.add(elemOrb);
      staff.position.set(0, -0.35, 0.12);
      staff.rotation.x = Math.PI / 2;
      rig.elbowR.add(staff);
    }
  } else if (dialogKey === 'cobbler') {
    // 👢 Сапожник Криспен: Кожаный фартук сапожника, берет и золочёный сапог скорохода в руке!
    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.05, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x3d2210, roughness: 0.9 })
    );
    apron.position.set(0, 1.02, 0.38);
    g.add(apron);
    if (rig.headGroup) {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.32, 0.16, 10),
        new THREE.MeshStandardMaterial({ color: 0x5c3418, roughness: 0.85 })
      );
      cap.position.y = 0.2;
      rig.headGroup.add(cap);
    }
    if (rig.elbowL) {
      const bootModel = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.32, 0.28),
        new THREE.MeshStandardMaterial({ color: 0x8a381c, roughness: 0.6 })
      );
      bootModel.position.set(0, -0.34, 0.14);
      rig.elbowL.add(bootModel);
    }
  } else if (dialogKey === 'cook') {
    // 👨‍🍳 Повар Гаспар: Высокий белый поварской колпак, белый фартук и большой черпак!
    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 1.12, 0.07),
      new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.85 })
    );
    apron.position.set(0, 1.0, 0.4);
    g.add(apron);
    if (rig.headGroup) {
      const chefHat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.28, 0.46, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 })
      );
      chefHat.position.y = 0.36;
      rig.headGroup.add(chefHat);
    }
    if (rig.elbowR) {
      const ladle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.85, 6),
        ironMat
      );
      ladle.position.set(0, -0.35, 0.1);
      ladle.rotation.x = Math.PI / 2;
      rig.elbowR.add(ladle);
    }
  } else if (dialogKey === 'stablehand') {
    // 🐴 Конюх Гюнтер: Шляпа конюха и кожаная сбруя через плечо
    if (rig.headGroup) {
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.52, 0.05, 12),
        leatherMat
      );
      brim.position.y = 0.2;
      rig.headGroup.add(brim);
    }
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.78), leatherMat);
    strap.position.set(0, 1.38, 0);
    strap.rotation.z = 0.35;
    g.add(strap);
  } else if (dialogKey === 'worker') {
    // ⛏️ Работяга-каменотёс Борк: Повязка горняка и тяжёлая кирка в руке!
    if (rig.headGroup) {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.31, 0.038, 6, 16),
        new THREE.MeshStandardMaterial({ color: 0xc87a28, roughness: 0.85 })
      );
      band.rotation.x = Math.PI / 2 - 0.1;
      band.position.y = 0.14;
      rig.headGroup.add(band);
    }
    if (rig.elbowR) {
      const pickaxe = new THREE.Group();
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 6), leatherMat);
      pickaxe.add(handle);
      const pickHead = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.68, 4), ironMat);
      pickHead.rotation.z = Math.PI / 2;
      pickHead.position.y = 0.45;
      pickaxe.add(pickHead);
      pickaxe.position.set(0, -0.36, 0.08);
      pickaxe.rotation.x = Math.PI / 2;
      rig.elbowR.add(pickaxe);
    }
  }

  rig.hitMeshes = collectMeshes(g);
  return g;
}

// ============================================================
// 2. QUADRUPED WOLF (True 4-legged beast with snout, ears, tail)
// ============================================================
export function createWolfModel(textures: ProceduralTextures): THREE.Group {
  const g = new THREE.Group();

  const furMat = new THREE.MeshStandardMaterial({
    color: 0x4e4338,
    bumpMap: textures.terrainBump,
    bumpScale: 0.03,
    roughness: 0.95,
  });
  const darkFurMat = new THREE.MeshStandardMaterial({
    color: 0x2b241d,
    roughness: 0.95,
  });

  // Horizontal torso + chestmane
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 0.85, 0);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.95, 6, 10), furMat);
  torso.rotation.x = Math.PI / 2;
  torso.castShadow = true;
  bodyGroup.add(torso);

  const mane = new THREE.Mesh(new THREE.SphereGeometry(0.39, 8, 8), darkFurMat);
  mane.position.set(0, 0.08, 0.38);
  mane.scale.set(1.05, 1.1, 1.2);
  mane.castShadow = true;
  bodyGroup.add(mane);

  // Head, Snout, Ears, Glowing Amber Eyes
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.25, 0.78);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), furMat);
  cranium.castShadow = true;
  headGroup.add(cranium);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.48, 6), darkFurMat);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.04, 0.32);
  snout.castShadow = true;
  headGroup.add(snout);

  // Pointed ears
  const earGeo = new THREE.ConeGeometry(0.08, 0.24, 5);
  const earL = new THREE.Mesh(earGeo, darkFurMat);
  earL.position.set(-0.15, 0.26, -0.04);
  earL.rotation.z = 0.2;
  headGroup.add(earL);
  const earR = new THREE.Mesh(earGeo, darkFurMat);
  earR.position.set(0.15, 0.26, -0.04);
  earR.rotation.z = -0.2;
  headGroup.add(earR);

  // Predator glowing yellow-orange eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.12, 0.07, 0.21);
  headGroup.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.12, 0.07, 0.21);
  headGroup.add(eyeR);

  bodyGroup.add(headGroup);

  // Bushy tail
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 6), darkFurMat);
  tail.position.set(0, 0.05, -0.78);
  tail.rotation.x = -Math.PI * 0.68;
  tail.castShadow = true;
  bodyGroup.add(tail);

  g.add(bodyGroup);

  // 4 Articulated Legs
  const legGeo = new THREE.CapsuleGeometry(0.09, 0.52, 4, 6);
  const makeLeg = (x: number, z: number) => {
    const lg = new THREE.Group();
    lg.position.set(x, 0.72, z);
    const limb = new THREE.Mesh(legGeo, furMat);
    limb.position.y = -0.32;
    limb.castShadow = true;
    lg.add(limb);
    const paw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.22), darkFurMat);
    paw.position.set(0, -0.62, 0.04);
    lg.add(paw);
    g.add(lg);
    return lg;
  };

  const legFL = makeLeg(-0.22, 0.45);
  const legFR = makeLeg(0.22, 0.45);
  const legBL = makeLeg(-0.22, -0.45);
  const legBR = makeLeg(0.22, -0.45);

  const rig: EntityRig = {
    kind: 'wolf',
    body: bodyGroup,
    headGroup,
    legFL,
    legFR,
    legBL,
    legBR,
    tail,
    hitMeshes: collectMeshes(g),
  };
  g.userData = rig;
  return g;
}

// ============================================================
// 2b. FOREST GRIZZLY BEAR (Massive quadruped bear with humped shoulders, round ears, thick paws)
// ============================================================
export function createBearModel(textures: ProceduralTextures): THREE.Group {
  const g = new THREE.Group();

  const furMat = new THREE.MeshStandardMaterial({
    color: 0x3d2616,
    bumpMap: textures.terrainBump,
    bumpScale: 0.05,
    roughness: 0.96,
  });
  const muzzleMat = new THREE.MeshStandardMaterial({
    color: 0x5c3e26,
    roughness: 0.9,
  });
  const clawMat = new THREE.MeshStandardMaterial({
    color: 0x1a1410,
    roughness: 0.6,
  });

  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 1.25, 0);

  // Massive barrel torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.68, 1.35, 8, 12), furMat);
  torso.rotation.x = Math.PI / 2;
  torso.scale.set(1.15, 1.0, 1.1);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Characteristic grizzly shoulder hump
  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 8), furMat);
  hump.position.set(0, 0.22, 0.48);
  hump.scale.set(1.1, 0.95, 1.15);
  hump.castShadow = true;
  bodyGroup.add(hump);

  // Heavy Rump
  const rump = new THREE.Mesh(new THREE.SphereGeometry(0.72, 10, 8), furMat);
  rump.position.set(0, 0.08, -0.58);
  rump.castShadow = true;
  bodyGroup.add(rump);

  // Bear Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.32, 1.22);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.46, 10, 10), furMat);
  cranium.scale.set(1.08, 0.98, 1.0);
  cranium.castShadow = true;
  headGroup.add(cranium);

  // Broad snout + black nose
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.29, 0.46, 8), muzzleMat);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.08, 0.42);
  snout.castShadow = true;
  headGroup.add(snout);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), clawMat);
  nose.position.set(0, -0.02, 0.65);
  headGroup.add(nose);

  // Round bear ears
  const earGeo = new THREE.SphereGeometry(0.15, 8, 8);
  const earL = new THREE.Mesh(earGeo, furMat);
  earL.position.set(-0.34, 0.36, -0.05);
  earL.scale.set(1, 1, 0.5);
  headGroup.add(earL);
  const earR = new THREE.Mesh(earGeo, furMat);
  earR.position.set(0.34, 0.36, -0.05);
  earR.scale.set(1, 1, 0.5);
  headGroup.add(earR);

  // Fierce amber eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff9900 });
  const eyeGeo = new THREE.SphereGeometry(0.055, 6, 6);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.2, 0.1, 0.38);
  headGroup.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.2, 0.1, 0.38);
  headGroup.add(eyeR);

  bodyGroup.add(headGroup);

  // Short stubby bear tail
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), furMat);
  tail.position.set(0, 0.15, -1.25);
  bodyGroup.add(tail);

  g.add(bodyGroup);

  // 4 Thick Muscular Bear Legs with Claws
  const legGeo = new THREE.CapsuleGeometry(0.24, 0.68, 5, 8);
  const makeLeg = (x: number, z: number) => {
    const lg = new THREE.Group();
    lg.position.set(x, 1.05, z);
    const limb = new THREE.Mesh(legGeo, furMat);
    limb.position.y = -0.42;
    limb.castShadow = true;
    lg.add(limb);

    const paw = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.46), furMat);
    paw.position.set(0, -0.92, 0.08);
    paw.castShadow = true;
    lg.add(paw);

    for (let c = -1; c <= 1; c++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 4), clawMat);
      claw.rotation.x = Math.PI / 2;
      claw.position.set(c * 0.1, -0.95, 0.34);
      lg.add(claw);
    }

    g.add(lg);
    return lg;
  };

  const legFL = makeLeg(-0.46, 0.68);
  const legFR = makeLeg(0.46, 0.68);
  const legBL = makeLeg(-0.46, -0.68);
  const legBR = makeLeg(0.46, -0.68);

  const rig: EntityRig = {
    kind: 'bear',
    body: bodyGroup,
    headGroup,
    legFL,
    legFR,
    legBL,
    legBR,
    tail,
    hitMeshes: collectMeshes(g),
  };
  g.userData = rig;
  return g;
}

// ============================================================
// 3. TRUE ANATOMICAL UNDEAD SKELETON (No cloth/skin! Pure hollow bones, spine, ribcage, pelvis, skull & shield)
// ============================================================
export function createSkeletonModel(textures: ProceduralTextures): THREE.Group {
  const g = new THREE.Group();

  const boneMat = new THREE.MeshStandardMaterial({
    color: 0xe6dec8,
    roughness: 0.55,
    metalness: 0.05,
  });
  const darkBoneMat = new THREE.MeshStandardMaterial({
    color: 0xb5aa92,
    roughness: 0.7,
  });
  const jointGeo = new THREE.SphereGeometry(0.075, 6, 6);

  // 1. Skeletal Legs (Femur + Knee Joint + Tibia + Bony Foot)
  const makeBoneLeg = (lx: number) => {
    const hip = new THREE.Group();
    hip.position.set(lx, 0.92, 0);

    const hipBall = new THREE.Mesh(jointGeo, darkBoneMat);
    hip.add(hipBall);

    const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.038, 0.48, 6), boneMat);
    femur.position.set(0, -0.24, 0);
    femur.castShadow = true;
    hip.add(femur);

    const knee = new THREE.Group();
    knee.position.set(0, -0.48, 0);
    const kneeCap = new THREE.Mesh(jointGeo, boneMat);
    knee.add(kneeCap);

    const tibia = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.44, 6), boneMat);
    tibia.position.set(0, -0.22, 0);
    tibia.castShadow = true;
    knee.add(tibia);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.32), darkBoneMat);
    foot.position.set(0, -0.44, 0.08);
    foot.castShadow = true;
    knee.add(foot);

    hip.add(knee);
    g.add(hip);
    return { hip, knee };
  };

  const legL = makeBoneLeg(-0.2);
  const legR = makeBoneLeg(0.2);

  // 2. Pelvis + Exposed Vertebrae Spine + Open Hollow Ribcage
  const body = new THREE.Group();
  body.position.set(0, 1.4, 0);

  // Pelvis bowl
  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.2, 8), darkBoneMat);
  pelvis.position.set(0, -0.42, 0);
  pelvis.scale.set(1.15, 1, 0.75);
  pelvis.castShadow = true;
  body.add(pelvis);

  // Central Spine column with vertebrae rings
  const spineCol = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.95, 6), darkBoneMat);
  spineCol.position.set(0, 0.05, -0.08);
  spineCol.castShadow = true;
  body.add(spineCol);

  for (let v = 0; v < 7; v++) {
    const vert = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 6), boneMat);
    vert.position.set(0, -0.35 + v * 0.13, -0.08);
    body.add(vert);
  }

  // Sternum (breastbone) + 5 pairs of curved open ribs with empty gaps between them!
  const sternum = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.04), boneMat);
  sternum.position.set(0, 0.2, 0.15);
  body.add(sternum);

  for (let r = 0; r < 5; r++) {
    const ribScale = 1.0 - Math.abs(r - 2) * 0.1;
    const ribHoop = new THREE.Mesh(
      new THREE.TorusGeometry(0.25 * ribScale, 0.032, 6, 12),
      boneMat
    );
    ribHoop.rotation.x = Math.PI / 2 + 0.15;
    ribHoop.scale.set(1.15, 0.82, 1.0);
    ribHoop.position.set(0, -0.02 + r * 0.11, 0.03);
    ribHoop.castShadow = true;
    body.add(ribHoop);
  }

  // Collarbones (Clavicles)
  const clavicle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 6), boneMat);
  clavicle.rotation.z = Math.PI / 2;
  clavicle.position.set(0, 0.48, 0);
  body.add(clavicle);

  g.add(body);

  // 3. Skeletal Arms (Humerus + Elbow + Radius/Ulna + Rusty Sword & Shield)
  const makeBoneArm = (ax: number) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(ax, 1.86, 0);

    const shSocket = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), darkBoneMat);
    shoulder.add(shSocket);

    const humerus = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.035, 0.44, 6), boneMat);
    humerus.position.set(0, -0.22, 0);
    humerus.castShadow = true;
    shoulder.add(humerus);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.44, 0);
    const elbowJoint = new THREE.Mesh(jointGeo, boneMat);
    elbow.add(elbowJoint);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.03, 0.4, 6), boneMat);
    forearm.position.set(0, -0.2, 0);
    forearm.castShadow = true;
    elbow.add(forearm);

    const bonyHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.06), darkBoneMat);
    bonyHand.position.set(0, -0.4, 0);
    elbow.add(bonyHand);

    shoulder.add(elbow);
    g.add(shoulder);
    return { shoulder, elbow };
  };

  const armL = makeBoneArm(-0.48);
  const armR = makeBoneArm(0.48);

  // Rusty Sword in Right Hand (matching v10 grip orientation)
  const sword = createForgedSword(textures, true);
  sword.position.set(0, -0.4, 0);
  sword.rotation.set(0, 0, Math.PI);
  sword.scale.setScalar(0.8);
  armR.elbow.add(sword);

  // Battered Wooden Round Shield on Left Forearm
  const shield = new THREE.Group();
  const shieldBoard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.05, 12),
    new THREE.MeshStandardMaterial({ map: textures.bark, color: 0x4a321e, roughness: 0.9 })
  );
  shieldBoard.rotation.z = Math.PI / 2;
  shieldBoard.castShadow = true;
  shield.add(shieldBoard);
  const shieldBoss = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x6e6a64, metalness: 0.8, roughness: 0.4 })
  );
  shieldBoss.position.set(-0.04, 0, 0);
  shield.add(shieldBoss);
  shield.position.set(-0.08, -0.22, 0.08);
  armL.elbow.add(shield);

  // 4. Sculpted Skull with Deep Black Eye Sockets, Nasal Cavity, Teeth & Glowing Red Eyes
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.24, 0);

  // Cranium dome
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), boneMat);
  cranium.position.set(0, 0.08, -0.02);
  cranium.scale.set(0.95, 1.0, 1.08);
  cranium.castShadow = true;
  headGroup.add(cranium);

  // Cheekbones & upper jaw (maxilla)
  const maxilla = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.28), boneMat);
  maxilla.position.set(0, -0.08, 0.12);
  maxilla.castShadow = true;
  headGroup.add(maxilla);

  // Lower jaw (mandible) separated by dark mouth gap
  const mandible = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.11, 0.26), darkBoneMat);
  mandible.position.set(0, -0.24, 0.1);
  headGroup.add(mandible);

  // Row of white skull teeth
  for (let t = -2; t <= 2; t++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.065, 0.03), boneMat);
    tooth.position.set(t * 0.05, -0.17, 0.25);
    headGroup.add(tooth);
  }

  // Deep hollow black eye sockets + glowing red pupils + dark triangular nose cavity
  const socketMat = new THREE.MeshBasicMaterial({ color: 0x090707 });
  const sockL = new THREE.Mesh(new THREE.SphereGeometry(0.082, 8, 8), socketMat);
  sockL.position.set(-0.1, 0.04, 0.22);
  sockL.scale.set(1, 0.9, 0.5);
  const sockR = new THREE.Mesh(new THREE.SphereGeometry(0.082, 8, 8), socketMat);
  sockR.position.set(0.1, 0.04, 0.22);
  sockR.scale.set(1, 0.9, 0.5);
  headGroup.add(sockL, sockR);

  const glowEyeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), glowEyeMat);
  pupilL.position.set(-0.1, 0.04, 0.26);
  const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), glowEyeMat);
  pupilR.position.set(0.1, 0.04, 0.26);
  headGroup.add(pupilL, pupilR);

  // Hollow nasal cavity
  const noseHole = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.09, 3), socketMat);
  noseHole.position.set(0, -0.04, 0.26);
  headGroup.add(noseHole);

  g.add(headGroup);

  const rig: EntityRig = {
    kind: 'skeleton',
    hipL: legL.hip,
    hipR: legR.hip,
    kneeL: legL.knee,
    kneeR: legR.knee,
    shoulderL: armL.shoulder,
    shoulderR: armR.shoulder,
    elbowL: armL.elbow,
    elbowR: armR.elbow,
    body,
    headGroup,
    hitMeshes: collectMeshes(g),
  };
  g.userData = rig;
  return g;
}

// ============================================================
// 4. ORC WARRIOR (Полностью уникальная звероподобная 3D-модель Орка!
//    Мощный сгорбленный зелёно-оливковый торс, выдвинутая вперёд клыкастая пасть,
//    длинные острые уши, горящие багровые глаза, огромные шипастые наплечники,
//    боевой килт с черепами и 3 клановых разновидности орков!)
// ============================================================
export function createOrcModel(textures: ProceduralTextures, variantIdx = 0): THREE.Group {
  const g = new THREE.Group();
  const clan = Math.abs(variantIdx) % 3;

  // Отличающиеся оттенки орочьей шкуры по кланам (Болотно-зелёный, Тёмно-оливковый, Пепельно-зелёный)
  const skinHex = clan === 0 ? 0x456e26 : clan === 1 ? 0x385c20 : 0x4f752b;
  const darkSkinHex = clan === 0 ? 0x2d4a18 : clan === 1 ? 0x233b13 : 0x34501b;

  const orcSkinMat = new THREE.MeshStandardMaterial({
    color: skinHex,
    bumpMap: textures.terrainBump,
    bumpScale: 0.04,
    roughness: 0.86,
  });
  const orcDarkSkinMat = new THREE.MeshStandardMaterial({
    color: darkSkinHex,
    roughness: 0.9,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    map: textures.metal,
    color: clan === 2 ? 0x5c4838 : 0x3b4046,
    metalness: 0.82,
    roughness: 0.35,
  });
  const boneMat = new THREE.MeshStandardMaterial({
    color: 0xe6dcc5,
    roughness: 0.45,
  });
  const warKiltMat = new THREE.MeshStandardMaterial({
    color: clan === 0 ? 0x6e1a14 : clan === 1 ? 0x4a2812 : 0x581414,
    bumpMap: textures.cloth,
    bumpScale: 0.025,
    roughness: 0.92,
  });
  const furMat = new THREE.MeshStandardMaterial({
    color: 0x241911,
    roughness: 0.98,
  });

  // 1. Массивные кривые лапы-ноги орка в шипастых железных поножах и когтистых сапогах
  const makeOrcLeg = (side: number) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.27, 0.92, 0);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.42, 6, 8), orcSkinMat);
    thigh.position.set(0, -0.22, 0);
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.set(0, -0.45, 0);

    // Кованая шипастая поножа на голени
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.44, 8), ironMat);
    shin.position.set(0, -0.22, 0);
    shin.castShadow = true;
    knee.add(shin);

    const kneeSpike = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.2, 5), boneMat);
    kneeSpike.rotation.x = Math.PI / 2 - 0.3;
    kneeSpike.position.set(0, -0.04, 0.19);
    knee.add(kneeSpike);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.5), furMat);
    boot.position.set(0, -0.42, 0.08);
    boot.castShadow = true;
    knee.add(boot);

    hip.add(knee);
    g.add(hip);
    return { hip, knee };
  };

  const legL = makeOrcLeg(-1);
  const legR = makeOrcLeg(1);

  // 2. Могучий V-образный сгорбленный орочий торс с открытой зелёной грудью, перевязью с черепом и боевым килтом
  const body = new THREE.Group();
  body.position.set(0, 1.4, 0);

  // Широкая грудная клетка и мускулистый горб на спине
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.46, 0.88, 10), orcSkinMat);
  chest.position.set(0, 0.18, 0.04);
  chest.scale.set(1.18, 1.0, 0.92);
  chest.castShadow = true;
  body.add(chest);

  const backHump = new THREE.Mesh(new THREE.SphereGeometry(0.56, 9, 8), orcDarkSkinMat);
  backHump.position.set(0, 0.42, -0.14);
  backHump.scale.set(1.25, 0.9, 1.05);
  body.add(backHump);

  // Рельефные грудные мышцы орка и диагональная боевая портупея с шипами
  for (const s of [-1, 1]) {
    const pec = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), orcSkinMat);
    pec.scale.set(1.15, 0.82, 0.75);
    pec.position.set(s * 0.24, 0.3, 0.34);
    body.add(pec);
  }

  const bandolier = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.15, 0.92), furMat);
  bandolier.position.set(0, 0.2, 0.04);
  bandolier.rotation.z = 0.58;
  body.add(bandolier);

  // Широкий кованый пояс воеводы с трофейным черепом на пряжке и рваный боевой килт
  const warBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.54, 0.24, 10), ironMat);
  warBelt.position.y = -0.32;
  body.add(warBelt);

  const beltSkull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), boneMat);
  beltSkull.position.set(0, -0.3, 0.52);
  beltSkull.scale.set(0.95, 1.1, 0.85);
  body.add(beltSkull);

  const kilt = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.68, 0.56, 10), warKiltMat);
  kilt.position.y = -0.58;
  kilt.castShadow = true;
  body.add(kilt);

  // Если это Орк-Воевода (clan === 2), за спиной возвышается боевое тотемное знамя орков с черепом!
  if (clan === 2) {
    const totemPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.85, 6), furMat);
    totemPole.position.set(0, 0.85, -0.48);
    body.add(totemPole);

    const bannerCloth = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.04), warKiltMat);
    bannerCloth.position.set(0, 1.25, -0.5);
    body.add(bannerCloth);

    const topSkull = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), boneMat);
    topSkull.position.set(0, 1.82, -0.48);
    body.add(topSkull);
  }

  g.add(body);

  // 3. Колоссальные шипастые орочьи наплечники и бугристые зелёные руки-кувалды
  const makeOrcArm = (side: number) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.78, 1.82, 0.06);

    // Огромный кованый наплечник с тремя длинными рогами-шипами
    const pauldron = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.65),
      ironMat
    );
    pauldron.scale.set(1.25, 0.95, 1.15);
    pauldron.position.set(side * 0.06, 0.08, 0);
    pauldron.rotation.z = -side * 0.35;
    pauldron.castShadow = true;
    shoulder.add(pauldron);

    for (let sp = -1; sp <= 1; sp++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.38, 5), boneMat);
      spike.position.set(side * 0.24, 0.28, sp * 0.16);
      spike.rotation.z = -side * 0.65;
      spike.rotation.x = sp * 0.25;
      shoulder.add(spike);
    }

    const bicep = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.42, 6, 8), orcSkinMat);
    bicep.position.set(0, -0.24, 0);
    bicep.castShadow = true;
    shoulder.add(bicep);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.46, 0);

    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.38, 6, 8), orcSkinMat);
    forearm.position.set(0, -0.2, 0);
    forearm.castShadow = true;
    elbow.add(forearm);

    // Железный шипастый наруч на предплечье
    const bracer = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.17, 0.26, 8), ironMat);
    bracer.position.set(0, -0.24, 0);
    elbow.add(bracer);

    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), orcDarkSkinMat);
    fist.position.set(0, -0.44, 0);
    elbow.add(fist);

    shoulder.add(elbow);
    g.add(shoulder);
    return { shoulder, elbow };
  };

  const armL = makeOrcArm(-1);
  const armR = makeOrcArm(1);

  // Оружие в правой лапе орка (Огромный топор-секира или шипастая булава)
  const axe = createOrcBattleAxe(textures);
  axe.scale.setScalar(1.18);
  axe.position.set(0, -0.42, 0);
  axe.rotation.set(0, 0, Math.PI);
  armR.elbow.add(axe);

  // В левой лапе у части орков — орочий зубчатый кулачный щит с шипом
  if (clan !== 1) {
    const buckler = new THREE.Group();
    const shieldPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 8), ironMat);
    shieldPlate.rotation.z = Math.PI / 2;
    buckler.add(shieldPlate);
    const centerSpike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.32, 5), boneMat);
    centerSpike.rotation.z = Math.PI / 2;
    centerSpike.position.x = -0.18;
    buckler.add(centerSpike);
    buckler.position.set(-0.14, -0.24, 0.08);
    armL.elbow.add(buckler);
  }

  // 4. Звероподобная Голова Орка (низко посаженная и выдвинутая вперёд, с мощной нижней челюстью, огромными бивнями-клыками, длинными ушами и рогатым шлемом!)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.12, 0.28);

  const cranium = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.48, 0.54), orcSkinMat);
  cranium.castShadow = true;
  headGroup.add(cranium);

  // Нависающие надбровные дуги и широкая приплюснутая переносица
  const browRidge = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.24), orcDarkSkinMat);
  browRidge.position.set(0, 0.12, 0.24);
  browRidge.rotation.x = 0.22;
  headGroup.add(browRidge);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.2), orcDarkSkinMat);
  snout.position.set(0, 0.0, 0.28);
  headGroup.add(snout);

  // Пылающие яростью багрово-оранжевые глаза орка
  const orcEyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), orcEyeMat);
  eyeL.position.set(-0.15, 0.05, 0.28);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), orcEyeMat);
  eyeR.position.set(0.15, 0.05, 0.28);
  headGroup.add(eyeL, eyeR);

  // Длинные заострённые уши орка, торчащие в стороны
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.34, 5), orcSkinMat);
    ear.position.set(s * 0.38, 0.04, -0.02);
    ear.rotation.z = -s * 1.25;
    ear.rotation.y = -s * 0.25;
    headGroup.add(ear);
  }

  // Массивная выдвинутая вперёд нижняя челюсть с четырьмя загнутыми вверх белыми бивнями!
  const orcJaw = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.26, 0.48), orcDarkSkinMat);
  orcJaw.position.set(0, -0.2, 0.16);
  orcJaw.castShadow = true;
  headGroup.add(orcJaw);

  for (const s of [-1, 1]) {
    const bigTusk = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.36, 6), boneMat);
    bigTusk.position.set(s * 0.21, -0.02, 0.38);
    bigTusk.rotation.x = 0.28;
    bigTusk.rotation.z = -s * 0.12;
    headGroup.add(bigTusk);

    const midFang = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 5), boneMat);
    midFang.position.set(s * 0.09, -0.06, 0.39);
    midFang.rotation.x = 0.2;
    headGroup.add(midFang);
  }

  // Головной убор по клану: у клана 1 — дикий багровый ирокез берсерка, у остальных — тяжёлый рогатый железный шлем!
  if (clan === 1) {
    const mohawk = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.56), warKiltMat);
    mohawk.position.set(0, 0.36, -0.04);
    headGroup.add(mohawk);
  } else {
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.3, 8), ironMat);
    helm.position.y = 0.26;
    headGroup.add(helm);

    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.52, 6), boneMat);
      horn.position.set(s * 0.42, 0.38, 0.04);
      horn.rotation.z = -s * 0.85;
      horn.rotation.x = 0.25;
      headGroup.add(horn);
    }
  }

  g.add(headGroup);

  // Общий масштаб делает орка заметно крупнее и шире человека!
  g.scale.set(1.22, 1.18, 1.22);

  const rig: EntityRig = {
    kind: 'orc',
    hipL: legL.hip,
    hipR: legR.hip,
    kneeL: legL.knee,
    kneeR: legR.knee,
    shoulderL: armL.shoulder,
    shoulderR: armR.shoulder,
    elbowL: armL.elbow,
    elbowR: armR.elbow,
    body,
    headGroup,
    jaw: orcJaw,
    hitMeshes: collectMeshes(g),
  };
  g.userData = rig;
  return g;
}

// ============================================================
// 5. BLACK TROLL (Authentic Gothic 2 bespoke monster — hunched, massive arms, low-slung head, tusks, craggy hide)
// ============================================================
export function createTrollModel(textures: ProceduralTextures): THREE.Group {
  const g = new THREE.Group();

  const hideMat = new THREE.MeshStandardMaterial({
    map: textures.terrainBump,
    bumpMap: textures.terrainBump,
    bumpScale: 0.12,
    color: 0x262422, // Deep charcoal-black leathery hide
    roughness: 0.92,
  });

  const bellyMat = new THREE.MeshStandardMaterial({
    map: textures.stoneWall,
    bumpMap: textures.terrainBump,
    bumpScale: 0.06,
    color: 0x3b3631, // Ashen-brown thick belly skin
    roughness: 0.95,
  });

  const maneMat = new THREE.MeshStandardMaterial({
    color: 0x161412,
    roughness: 0.98,
    flatShading: true,
  });

  const boneMat = new THREE.MeshStandardMaterial({
    color: 0xd8ccb8,
    roughness: 0.5,
  });

  // Short, thick pillar-like hind legs
  const makeLeg = (lx: number) => {
    const hip = new THREE.Group();
    hip.position.set(lx, 1.35, -0.25);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.55, 6, 8), hideMat);
    thigh.position.set(0, -0.3, 0);
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.set(0, -0.6, 0);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.45, 0.7, 8), hideMat);
    shin.position.set(0, -0.35, 0);
    shin.castShadow = true;
    knee.add(shin);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.32, 0.95), bellyMat);
    foot.position.set(0, -0.65, 0.18);
    foot.castShadow = true;
    knee.add(foot);

    // Toe claws
    for (let c = -1; c <= 1; c++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 5), boneMat);
      claw.rotation.x = Math.PI / 2;
      claw.position.set(c * 0.22, -0.72, 0.68);
      knee.add(claw);
    }

    hip.add(knee);
    g.add(hip);
    return { hip, knee };
  };

  const legL = makeLeg(-0.72);
  const legR = makeLeg(0.72);

  // Hunched colossal torso & ribcage
  const body = new THREE.Group();
  body.position.set(0, 2.25, 0);

  const upperBack = new THREE.Mesh(new THREE.DodecahedronGeometry(1.45, 1), hideMat);
  upperBack.scale.set(1.25, 1.05, 1.15);
  upperBack.position.set(0, 0.55, 0.1);
  upperBack.castShadow = true;
  body.add(upperBack);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(1.22, 10, 8), bellyMat);
  belly.scale.set(1.1, 1.0, 1.05);
  belly.position.set(0, -0.15, 0.15);
  belly.castShadow = true;
  body.add(belly);

  // Dorsal craggy rock-plates & dark fur ridge along the hunched spine
  for (let i = 0; i < 6; i++) {
    const spike = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.48 - i * 0.04, 0),
      maneMat
    );
    spike.position.set(0, 1.35 - i * 0.25, 0.35 - i * 0.26);
    spike.scale.set(0.8, 1.2, 1.1);
    spike.castShadow = true;
    body.add(spike);
  }

  g.add(body);

  // Sunken, menacing Troll Head jutting forward from the chest/shoulders
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.75, 1.35);

  const skull = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 1), hideMat);
  skull.scale.set(1.12, 0.92, 1.15);
  skull.castShadow = true;
  headGroup.add(skull);

  // Heavy overhanging brow ridge
  const brow = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.26, 0.55), maneMat);
  brow.position.set(0, 0.22, 0.45);
  brow.rotation.x = 0.2;
  headGroup.add(brow);

  // Deep-set glowing blood-amber eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff5511 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), eyeMat);
  eyeL.position.set(-0.26, 0.08, 0.58);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), eyeMat);
  eyeR.position.set(0.26, 0.08, 0.58);
  headGroup.add(eyeL, eyeR);

  // Massive protruding lower jaw with 4 curved tusks
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.38, 0.72), bellyMat);
  jaw.position.set(0, -0.32, 0.35);
  jaw.castShadow = true;
  headGroup.add(jaw);

  const tuskPositions = [
    [-0.34, 0.26, 0.32],
    [0.34, 0.26, 0.32],
    [-0.16, 0.18, 0.35],
    [0.16, 0.18, 0.35],
  ];
  for (const [tx, hScale, tz] of tuskPositions) {
    const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.085, hScale * 1.6, 6), boneMat);
    tusk.position.set(tx, 0.24, tz);
    tusk.rotation.x = 0.25;
    jaw.add(tusk);
  }

  // Swept-back heavy black horns on the sides of the skull
  const hornGeo = new THREE.ConeGeometry(0.22, 1.1, 6);
  const hornL = new THREE.Mesh(hornGeo, maneMat);
  hornL.position.set(-0.68, 0.32, -0.1);
  hornL.rotation.set(-0.6, 0, 0.85);
  const hornR = new THREE.Mesh(hornGeo, maneMat);
  hornR.position.set(0.68, 0.32, -0.1);
  hornR.rotation.set(-0.6, 0, -0.85);
  headGroup.add(hornL, hornR);

  g.add(headGroup);

  // Colossal gorilla-like arms reaching almost to the ground
  const makeArm = (ax: number) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(ax, 3.05, 0.35);

    const deltoid = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 1), maneMat);
    deltoid.castShadow = true;
    shoulder.add(deltoid);

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.95, 6, 8), hideMat);
    upperArm.position.set(0, -0.65, 0);
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.set(0, -1.25, 0);

    // Massive thick forearms
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.52, 1.15, 8), hideMat);
    forearm.position.set(0, -0.55, 0.12);
    forearm.rotation.x = -0.2;
    forearm.castShadow = true;
    elbow.add(forearm);

    // Craggy boulder-fist
    const fist = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 1), bellyMat);
    fist.position.set(0, -1.18, 0.24);
    fist.scale.set(1.1, 0.85, 1.2);
    fist.castShadow = true;
    elbow.add(fist);

    shoulder.add(elbow);
    g.add(shoulder);
    return { shoulder, elbow };
  };

  const armL = makeArm(-1.55);
  const armR = makeArm(1.55);

  const rig: EntityRig = {
    kind: 'troll',
    hipL: legL.hip,
    hipR: legR.hip,
    kneeL: legL.knee,
    kneeR: legR.knee,
    shoulderL: armL.shoulder,
    shoulderR: armR.shoulder,
    elbowL: armL.elbow,
    elbowR: armR.elbow,
    body,
    headGroup,
    jaw,
    hitMeshes: collectMeshes(g),
  };
  g.userData = rig;
  return g;
}

// ============================================================
// 6. MEDIEVAL HALF-TIMBERED HOUSE WITH CHIMNEY PIPE, SMOKE ANCHOR & DYNAMIC WINDOW LIGHTS
// ============================================================
export interface MedievalHouseInstance {
  group: THREE.Group;
  chimneyWorldPos: THREE.Vector3;
  winMat: THREE.MeshStandardMaterial;
  windowGlowMesh: THREE.Mesh;
  isWindowLit: boolean;
  isSmoking: boolean;
  setWindowLit: (lit: boolean) => void;
}

export function createMedievalHouse(
  x: number,
  z: number,
  h: number,
  textures: ProceduralTextures,
  scene: THREE.Scene,
  _torchLights: THREE.PointLight[],
  houseVariant = 0
): MedievalHouseInstance {
  const g = new THREE.Group();
  const v = Math.abs(houseVariant) % 5;

  // Индивидуальные пропорции, оттенок стен и черепицы крыши для каждого из 5 домиков деревни!
  const houseConfigs = [
    // 0: Высокий двухэтажный Дом Старейшины с балконом и терракотовой крышей
    { w: 6.6, d: 6.4, wallH: 4.3, plasterHex: 0xdfd2ba, roofHex: 0x8a3324, roofH: 3.9, beamHex: 0x2e1c10 },
    // 1: Каменно-бревенчатая Кузница Торуса с навесом, наковальней и тёмно-сланцевой крышей
    { w: 7.2, d: 6.0, wallH: 3.5, plasterHex: 0xa89f91, roofHex: 0x3b4048, roofH: 3.2, beamHex: 0x241810 },
    // 2: Купеческая Лавка Хакона с золотисто-охристыми стенами, навесом и бочками
    { w: 6.8, d: 6.6, wallH: 3.8, plasterHex: 0xe2c48e, roofHex: 0x6e3b1e, roofH: 3.5, beamHex: 0x3d2312 },
    // 3: Уютный Домик Травницы Елены с изумрудно-мшистой крутой крышей и клумбами цветов у окон
    { w: 5.8, d: 5.8, wallH: 3.5, plasterHex: 0xf0e4d0, roofHex: 0x3b5832, roofH: 4.1, beamHex: 0x4a2e1a },
    // 4: Каменная Сторожевая Казарма Диего с зубчатым парапетом и стойкой оружия
    { w: 6.4, d: 6.4, wallH: 4.0, plasterHex: 0x98948c, roofHex: 0x4e2a22, roofH: 3.6, beamHex: 0x221a14 },
  ];
  const cfg = houseConfigs[v];

  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneWall,
    bumpMap: textures.stoneWall,
    bumpScale: 0.05,
    roughness: 0.95,
  });

  // Stone foundation
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.w + 0.4, 1.2, cfg.d + 0.4),
    stoneMat
  );
  foundation.position.y = 0.6;
  foundation.castShadow = true;
  foundation.receiveShadow = true;
  g.add(foundation);

  // Main walls with unique plaster/stone tint per house
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.w, cfg.wallH, cfg.d),
    new THREE.MeshStandardMaterial({
      map: v === 4 ? textures.stoneWall : textures.plasterWall,
      bumpMap: v === 4 ? textures.stoneWall : textures.plasterWall,
      color: cfg.plasterHex,
      bumpScale: 0.03,
      roughness: 0.9,
    })
  );
  walls.position.y = 1.2 + cfg.wallH * 0.5;
  walls.castShadow = true;
  walls.receiveShadow = true;
  g.add(walls);

  // Dark timber framing beams
  const beamMat = new THREE.MeshStandardMaterial({
    map: textures.bark,
    color: cfg.beamHex,
    roughness: 0.9,
  });
  const hw = cfg.w * 0.5 + 0.02;
  const hd = cfg.d * 0.5 + 0.02;
  const cornerCoords = [
    [-hw, -hd],
    [hw, -hd],
    [-hw, hd],
    [hw, hd],
  ];
  for (const [cx, cz] of cornerCoords) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, cfg.wallH + 0.1, 0.24), beamMat);
    post.position.set(cx, 1.2 + cfg.wallH * 0.5, cz);
    g.add(post);
  }
  const topY = 1.2 + cfg.wallH;
  const topRing = new THREE.Mesh(new THREE.BoxGeometry(cfg.w + 0.22, 0.22, cfg.d + 0.22), beamMat);
  topRing.position.y = topY;
  g.add(topRing);

  // Steep pitched medieval roof with unique color & height per house
  const roofRadius = Math.max(cfg.w, cfg.d) * 0.92;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(roofRadius, cfg.roofH, 4),
    new THREE.MeshStandardMaterial({
      map: textures.roofTile,
      bumpMap: textures.roofTile,
      color: cfg.roofHex,
      bumpScale: 0.06,
      roughness: 0.85,
    })
  );
  roof.position.y = topY + cfg.roofH * 0.5;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  roof.receiveShadow = true;
  g.add(roof);

  // Индивидуальные архитектурные детали каждого домика деревни:
  if (v === 0) {
    // Дом 0 (Старейшина): Деревянный балкон второго этажа с резными перилами
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 1.15), beamMat);
    balcony.position.set(0, 3.6, hd + 0.52);
    g.add(balcony);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 0.12), beamMat);
    rail.position.set(0, 3.95, hd + 1.02);
    g.add(rail);
  } else if (v === 1) {
    // Дом 1 (Кузница): Боковой навес с каменным горном и наковальней на дубовой колоде
    const awning = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 3.4), beamMat);
    awning.position.set(hw + 1.1, 3.3, 0);
    awning.rotation.z = -0.22;
    g.add(awning);
    const anvilBlock = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.75, 8), beamMat);
    anvilBlock.position.set(hw + 1.1, 0.38, 0.4);
    g.add(anvilBlock);
    const anvil = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.32, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x3a4048, metalness: 0.85, roughness: 0.3 })
    );
    anvil.position.set(hw + 1.1, 0.9, 0.4);
    g.add(anvil);
  } else if (v === 2) {
    // Дом 2 (Лавка Хакона): Купеческий козырёк над входом и дубовые бочки с товарами
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.14, 1.35),
      new THREE.MeshStandardMaterial({ color: 0x9e2a22, roughness: 0.8 })
    );
    canopy.position.set(0, 3.35, hd + 0.62);
    canopy.rotation.x = 0.28;
    g.add(canopy);
    for (const bx of [-2.1, -1.45]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.82, 9), beamMat);
      barrel.position.set(bx, 0.85, hd + 0.55);
      g.add(barrel);
    }
  } else if (v === 3) {
    // Дом 3 (Домик Елены): Деревянные ящики с цветущими травами под передними окнами
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x3b6e28, roughness: 0.8 });
    for (const wx of [-1.6, 1.6]) {
      const flowerBox = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.28, 0.34), boxMat);
      flowerBox.position.set(wx, 2.45, hd + 0.18);
      g.add(flowerBox);
    }
  } else if (v === 4) {
    // Дом 4 (Казарма Диего): Каменные зубцы по углам крыши
    for (const [cx, cz] of cornerCoords) {
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.65), stoneMat);
      merlon.position.set(cx, topY + 0.32, cz);
      g.add(merlon);
    }
  }

  // Каменная печная труба с оголовком и жерлом, откуда идёт настоящий объёмный дым!
  const chimneyX = (v % 2 === 0 ? 1 : -1) * (cfg.w * 0.28);
  const chimneyZ = -cfg.d * 0.22;
  const chimneyBaseY = topY + cfg.roofH * 0.42;
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.92, 3.2, 0.92), stoneMat);
  chimney.position.set(chimneyX, chimneyBaseY, chimneyZ);
  chimney.castShadow = true;
  g.add(chimney);

  const chimneyTopY = chimneyBaseY + 1.52;
  const chimneyRim = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.22, 1.12), stoneMat);
  chimneyRim.position.set(chimneyX, chimneyTopY, chimneyZ);
  g.add(chimneyRim);

  const chimneyFlue = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.35, 10),
    new THREE.MeshBasicMaterial({ color: 0x120d0a })
  );
  chimneyFlue.position.set(chimneyX, chimneyTopY + 0.06, chimneyZ);
  g.add(chimneyFlue);

  // Heavy oak door
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 2.3, 0.18),
    new THREE.MeshStandardMaterial({ map: textures.bark, color: 0x3a2212, roughness: 0.9 })
  );
  door.position.set(0, 1.9, hd);
  g.add(door);

  // Управляемые окна домика (иногда в домиках включается тёплый свет, а иногда выключается!)
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xffcf70,
    emissive: 0xff9d2e,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });
  const winFrontL = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.98, 0.14), winMat);
  winFrontL.position.set(-cfg.w * 0.27, 3.0, hd);
  const winFrontR = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.98, 0.14), winMat);
  winFrontR.position.set(cfg.w * 0.27, 3.0, hd);
  const winSideL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.98, 1.1), winMat);
  winSideL.position.set(-hw, 3.0, 0);
  const winSideR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.98, 1.1), winMat);
  winSideR.position.set(hw, 3.0, 0);
  g.add(winFrontL, winFrontR, winSideL, winSideR);

  // Мягкое объёмное свечение вокруг окон при включённом свете
  const windowGlowMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  windowGlowMesh.position.set(0, 3.0, hd + 0.3);
  g.add(windowGlowMesh);

  // Entrance torch & flame
  const torchHolder = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.55, 6), beamMat);
  torchHolder.position.set(0.95, 2.4, hd + 0.22);
  torchHolder.rotation.x = 0.35;
  g.add(torchHolder);

  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xffaa22 })
  );
  flame.position.set(0.95, 2.68, hd + 0.32);
  g.add(flame);

  const flameGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xff8c24,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  flameGlow.position.set(0.95, 2.68, hd + 0.32);
  g.add(flameGlow);

  const rotY = Math.atan2(-x, -z) + (Math.random() - 0.5) * 0.5;
  g.position.set(x, h, z);
  g.rotation.y = rotY;
  scene.add(g);

  // Вычисляем точную мировую координату верхушки печной трубы для генератора дыма
  const localChimney = new THREE.Vector3(chimneyX, chimneyTopY + 0.22, chimneyZ);
  localChimney.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
  const chimneyWorldPos = new THREE.Vector3(
    x + localChimney.x,
    h + localChimney.y,
    z + localChimney.z
  );

  const instance: MedievalHouseInstance = {
    group: g,
    chimneyWorldPos,
    winMat,
    windowGlowMesh,
    isWindowLit: true,
    isSmoking: true,
    setWindowLit(lit: boolean) {
      this.isWindowLit = lit;
      if (lit) {
        winMat.color.setHex(0xffcf70);
        winMat.emissive.setHex(0xff9d2e);
        winMat.emissiveIntensity = 1.55;
        windowGlowMesh.visible = true;
      } else {
        winMat.color.setHex(0x1f2630);
        winMat.emissive.setHex(0x080b10);
        winMat.emissiveIntensity = 0.1;
        windowGlowMesh.visible = false;
      }
    },
  };

  return instance;
}

// ============================================================
// 6B. КОСТЁР С ВЕРТЕЛОМ И ЖАРЯЩИМСЯ МЯСОМ + БРЁВНА-ЛАВКИ ДЛЯ NPC
// ============================================================
export function createCampfireWithRoastingMeat(
  x: number,
  z: number,
  h: number,
  textures: ProceduralTextures,
  scene: THREE.Scene
): {
  group: THREE.Group;
  spitMeatGroup: THREE.Group;
  flameMesh: THREE.Mesh;
  fireGlow: THREE.Mesh;
} {
  const g = new THREE.Group();
  g.position.set(x, h, z);

  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneWall,
    color: 0x686460,
    roughness: 0.95,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.bark,
    color: 0x3d2514,
    roughness: 0.9,
  });
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    emissive: 0xff3300,
    emissiveIntensity: 1.6,
    roughness: 0.5,
  });

  // Каменное кольцо очага
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), stoneMat);
    rock.position.set(Math.cos(a) * 0.95, 0.14, Math.sin(a) * 0.95);
    rock.scale.set(1.2, 0.75, 1.0);
    g.add(rock);
  }

  // Тлеющие угли и поленья в костре
  const embers = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.14, 12), emberMat);
  embers.position.y = 0.08;
  g.add(embers);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 1.45, 7), woodMat);
    log.position.set(0, 0.2, 0);
    log.rotation.z = Math.PI / 2 - 0.18;
    log.rotation.y = a;
    g.add(log);
  }

  // Живое пламя костра
  const flameMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.52, 1.25, 7),
    new THREE.MeshBasicMaterial({
      color: 0xff8818,
      transparent: true,
      opacity: 0.88,
    })
  );
  flameMesh.position.y = 0.68;
  g.add(flameMesh);

  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.9, 6),
    new THREE.MeshBasicMaterial({ color: 0xffee66 })
  );
  innerFlame.position.y = 0.52;
  g.add(innerFlame);

  // Мягкое объёмное свечение костра без нагрузки на шейдеры (Additive Glow как в Snowball Fight 3D)
  const fireGlow = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xff7a1a,
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  fireGlow.position.set(0, 0.9, 0);
  g.add(fireGlow);

  // Две деревянные рогатины и вертел с румяным жарящимся мясом над огнём!
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.45, 6), woodMat);
    post.position.set(side * 1.05, 0.7, 0);
    g.add(post);
  }

  const spitMeatGroup = new THREE.Group();
  spitMeatGroup.position.set(0, 1.28, 0);
  const ironSpit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 2.35, 8),
    new THREE.MeshStandardMaterial({ color: 0x333840, metalness: 0.85, roughness: 0.35 })
  );
  ironSpit.rotation.z = Math.PI / 2;
  spitMeatGroup.add(ironSpit);

  // Большой сочный кусок мяса на вертеле
  const roastMat = new THREE.MeshStandardMaterial({
    color: 0x9e3e1e,
    roughness: 0.45,
    emissive: 0x381004,
    emissiveIntensity: 0.35,
  });
  const roastChunk = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.52, 6, 10), roastMat);
  roastChunk.rotation.z = Math.PI / 2;
  spitMeatGroup.add(roastChunk);
  g.add(spitMeatGroup);

  // Брёвна-скамейки вокруг костра, на которых сидят персонажи и жарят мясо
  const benchPositions: [number, number, number][] = [
    [0, -2.25, 0],
    [-2.25, 0, Math.PI / 2],
    [2.25, 0, Math.PI / 2],
  ];
  for (const [bx, bz, brot] of benchPositions) {
    const bench = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 2.1, 8), woodMat);
    bench.rotation.z = Math.PI / 2;
    bench.rotation.y = brot;
    bench.position.set(bx, 0.26, bz);
    bench.castShadow = true;
    bench.receiveShadow = true;
    g.add(bench);
  }

  scene.add(g);
  return { group: g, spitMeatGroup, flameMesh, fireGlow };
}

// ============================================================
// 7. HORSE MODEL (With leather saddle, stirrups, bridle, mane & 4 articulated legs)
// ============================================================
export function createHorseModel(
  bodyColor: number,
  maneColor: number,
  textures: ProceduralTextures
): THREE.Group {
  const g = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    bumpMap: textures.terrainBump,
    bumpScale: 0.02,
    roughness: 0.88,
  });
  const maneMat = new THREE.MeshStandardMaterial({
    color: maneColor,
    roughness: 0.96,
  });
  const hoofMat = new THREE.MeshStandardMaterial({
    color: 0x1a1210,
    roughness: 0.85,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x422815,
    bumpMap: textures.cloth,
    bumpScale: 0.02,
    roughness: 0.82,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    map: textures.metal,
    color: 0xc2a258,
    metalness: 0.85,
    roughness: 0.25,
  });

  // Body capsule along Z
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.68, 1.58, 8, 12), bodyMat);
  body.rotation.x = Math.PI / 2;
  body.position.y = 1.5;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Crafted Leather Saddle + Pommel + Cantle + Stirrups
  const saddleGroup = new THREE.Group();
  const saddleSeat = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.98), leatherMat);
  saddleSeat.position.set(0, 2.06, -0.08);
  saddleSeat.castShadow = true;
  saddleGroup.add(saddleSeat);

  const saddlePommel = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.18), leatherMat);
  saddlePommel.position.set(0, 2.18, 0.34);
  saddlePommel.rotation.x = 0.25;
  saddleGroup.add(saddlePommel);

  const saddleCantle = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.24, 0.2), leatherMat);
  saddleCantle.position.set(0, 2.19, -0.5);
  saddleCantle.rotation.x = -0.3;
  saddleGroup.add(saddleCantle);

  // Saddle girth strap around belly
  const girth = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.16, 12), leatherMat);
  girth.rotation.x = Math.PI / 2;
  girth.position.set(0, 1.5, 0.08);
  saddleGroup.add(girth);

  // Stirrup straps, iron stirrups & Two Worlds Leather Saddlebags (Седельные сумки с пряжками)
  const bagLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x523018,
    roughness: 0.78,
  });
  const buckleMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.85,
    roughness: 0.25,
  });
  for (const side of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.68, 0.08), leatherMat);
    strap.position.set(side * 0.68, 1.68, -0.05);
    saddleGroup.add(strap);
    const stirrup = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 8), metalMat);
    stirrup.rotation.y = Math.PI / 2;
    stirrup.position.set(side * 0.7, 1.3, -0.05);
    saddleGroup.add(stirrup);

    // Кожаная седельная сумка Two Worlds по бокам крупа лошади
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.44, 0.48), bagLeatherMat);
    pouch.position.set(side * 0.67, 1.66, -0.46);
    pouch.rotation.z = side * -0.12;
    saddleGroup.add(pouch);

    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.5), leatherMat);
    flap.position.set(side * 0.68, 1.82, -0.46);
    flap.rotation.z = side * -0.12;
    saddleGroup.add(flap);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.08), buckleMat);
    buckle.position.set(side * 0.8, 1.72, -0.46);
    saddleGroup.add(buckle);
  }

  // Походная скатка позади седла
  const bedroll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.86, 8),
    new THREE.MeshStandardMaterial({ color: 0x6e2c22, roughness: 0.9 })
  );
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(0, 2.02, -0.68);
  saddleGroup.add(bedroll);

  g.add(saddleGroup);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.54, 1.22, 8), bodyMat);
  neck.position.set(0, 2.2, 0.95);
  neck.rotation.x = 0.5;
  neck.castShadow = true;
  g.add(neck);

  // Head
  const headGroup = new THREE.Group();
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.29, 0.64, 6, 8), bodyMat);
  head.position.set(0, 2.75, 1.55);
  head.rotation.x = -0.9;
  head.castShadow = true;
  headGroup.add(head);

  // Muzzle
  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x261a12, roughness: 0.9 })
  );
  muzzle.position.set(0, 2.55, 1.95);
  headGroup.add(muzzle);

  // Leather bridle strap on head
  const bridle = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.25, 0.08, 8), leatherMat);
  bridle.position.set(0, 2.64, 1.75);
  bridle.rotation.x = 0.65;
  headGroup.add(bridle);

  // Ears
  const earGeo = new THREE.ConeGeometry(0.1, 0.3, 5);
  const earL = new THREE.Mesh(earGeo, bodyMat);
  earL.position.set(0.16, 3.05, 1.4);
  earL.rotation.x = -0.3;
  headGroup.add(earL);
  const earR = new THREE.Mesh(earGeo, bodyMat);
  earR.position.set(-0.16, 3.05, 1.4);
  earR.rotation.x = -0.3;
  headGroup.add(earR);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.065, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x120d0a });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(0.22, 2.85, 1.65);
  headGroup.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(-0.22, 2.85, 1.65);
  headGroup.add(eyeR);
  g.add(headGroup);

  // Mane along the neck
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 5), maneMat);
    spike.position.set(0, 2.65 + t * 0.4, 0.95 - t * 0.75);
    spike.rotation.x = -0.4;
    g.add(spike);
  }

  // Flowing Tail
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.22, 6), maneMat);
  tail.position.set(0, 1.8, -1.4);
  tail.rotation.x = -1.2;
  tail.castShadow = true;
  g.add(tail);

  // 4 Articulated Legs
  const legs: THREE.Group[] = [];
  const legPositions: [number, number, number][] = [
    [0.38, 1.0, 0.75], // front right (index 0)
    [-0.38, 1.0, 0.75], // front left (index 1)
    [0.38, 1.0, -0.75], // back right (index 2)
    [-0.38, 1.0, -0.75], // back left (index 3)
  ];

  for (const [lx, ly, lz] of legPositions) {
    const leg = new THREE.Group();
    leg.position.set(lx, ly, lz);

    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.55, 4, 6), bodyMat);
    upper.position.y = -0.32;
    upper.castShadow = true;
    leg.add(upper);

    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.42, 4, 6), bodyMat);
    lower.position.y = -0.75;
    lower.castShadow = true;
    leg.add(lower);

    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.16, 8), hoofMat);
    hoof.position.y = -0.98;
    leg.add(hoof);

    g.add(leg);
    legs.push(leg);
  }

  g.scale.setScalar(1.15);
  const rig: EntityRig = {
    kind: 'horse',
    body,
    headGroup,
    legs,
    tail,
    hitMeshes: collectMeshes(g),
  };
  g.userData = rig;
  return g;
}

// ============================================================
// 9. ПРИЗВАННЫЕ ГОЛЕМЫ МАГИИ ЗЕМЛИ (TWO WORLDS: ЗЕМЛЯНОЙ, КАМЕННЫЙ И СТАЛЬНОЙ ГОЛЕМ!)
// ============================================================
export function createGolemModel(
  golemType: 'earth' | 'stone' | 'steel',
  textures: ProceduralTextures
): THREE.Group {
  const g = new THREE.Group();

  const cfg = {
    earth: {
      bodyColor: 0x5c4228,
      accentColor: 0x3b6e28, // Мох и корни Земляного Голема
      coreColor: 0x88ff33, // Изумрудно-янтарное сердце Земли
      metalness: 0.1,
      roughness: 0.95,
      scale: 1.25,
    },
    stone: {
      bodyColor: 0x62666e,
      accentColor: 0x3e424a, // Гранитные глыбы Каменного Голема
      coreColor: 0x33ddff, // Лазурные руны камня
      metalness: 0.25,
      roughness: 0.88,
      scale: 1.38,
    },
    steel: {
      bodyColor: 0x9aa4b0,
      accentColor: 0x48525e, // Кованая броня Стального Голема
      coreColor: 0xff6600, // Пылающее горнило Стального Голема
      metalness: 0.88,
      roughness: 0.22,
      scale: 1.48,
    },
  }[golemType];

  const mainMat = new THREE.MeshStandardMaterial({
    map: golemType === 'steel' ? textures.metal : textures.stoneWall,
    color: cfg.bodyColor,
    metalness: cfg.metalness,
    roughness: cfg.roughness,
    flatShading: golemType !== 'steel',
  });
  const subMat = new THREE.MeshStandardMaterial({
    color: cfg.accentColor,
    metalness: cfg.metalness * 0.8,
    roughness: cfg.roughness,
    flatShading: true,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: cfg.coreColor,
    emissive: cfg.coreColor,
    emissiveIntensity: 1.35,
    roughness: 0.15,
  });

  const body = new THREE.Group();
  body.position.y = 1.65;
  g.add(body);

  // Могучий торс Голема из скальных/стальных плит
  const chest = new THREE.Mesh(new THREE.DodecahedronGeometry(0.88, 0), mainMat);
  chest.scale.set(1.25, 1.05, 0.88);
  chest.position.y = 0.35;
  chest.castShadow = true;
  body.add(chest);

  const waist = new THREE.Mesh(new THREE.DodecahedronGeometry(0.56, 0), subMat);
  waist.scale.set(1.1, 0.75, 0.85);
  waist.position.y = -0.35;
  body.add(waist);

  // Светящееся руническое ядро жизни в груди Голема
  const coreGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), coreMat);
  coreGem.position.set(0, 0.38, 0.68);
  body.add(coreGem);

  // Массивные наплечники (с кристаллами/шипами)
  for (const sx of [-1, 1]) {
    const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 0), subMat);
    pauldron.position.set(sx * 1.05, 0.72, 0);
    pauldron.scale.set(1.1, 0.85, 1.1);
    body.add(pauldron);

    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.52, 5), coreMat);
    crystal.position.set(sx * 1.15, 1.12, -0.05);
    crystal.rotation.z = -sx * 0.38;
    body.add(crystal);
  }

  // Голова Голема с горящими глазами-рунами
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.12, 0.12);
  const headRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), mainMat);
  headRock.scale.set(1.05, 0.92, 1.0);
  headGroup.add(headRock);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), coreMat);
  eyeL.position.set(-0.15, 0.05, 0.36);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), coreMat);
  eyeR.position.set(0.15, 0.05, 0.36);
  headGroup.add(eyeL, eyeR);
  body.add(headGroup);

  // Сочленённые руки-молоты Голема
  const buildArm = (side: number) => {
    const sh = new THREE.Group();
    sh.position.set(side * 1.12, 0.58, 0);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.78, 0.42), mainMat);
    upper.position.y = -0.38;
    upper.castShadow = true;
    sh.add(upper);

    const el = new THREE.Group();
    el.position.set(0, -0.75, 0);
    const forearm = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), subMat);
    forearm.scale.set(0.95, 1.35, 0.95);
    forearm.position.y = -0.42;
    forearm.castShadow = true;
    el.add(forearm);
    sh.add(el);
    body.add(sh);
    return { sh, el };
  };

  const armL = buildArm(-1);
  const armR = buildArm(1);

  // Колоннообразные ноги Голема
  const buildLeg = (side: number) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.48, -0.55, 0);
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.65, 0.46), mainMat);
    thigh.position.y = -0.32;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.set(0, -0.62, 0);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.62, 7), subMat);
    shin.position.y = -0.28;
    knee.add(shin);
    hip.add(knee);
    body.add(hip);
    return { hip, knee };
  };

  const legL = buildLeg(-1);
  const legR = buildLeg(1);

  // Магический круг призыва Земли у стоп Голема
  const summonRing = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 1.12, 24),
    new THREE.MeshBasicMaterial({
      color: cfg.coreColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    })
  );
  summonRing.rotation.x = -Math.PI / 2;
  summonRing.position.y = 0.06;
  g.add(summonRing);

  g.scale.setScalar(cfg.scale);
  const rig: EntityRig = {
    kind: 'troll', // Использует мощную шагающую анимацию титана!
    hipL: legL.hip,
    hipR: legR.hip,
    kneeL: legL.knee,
    kneeR: legR.knee,
    shoulderL: armL.sh,
    shoulderR: armR.sh,
    elbowL: armL.el,
    elbowR: armR.el,
    body,
    headGroup,
    hitMeshes: collectMeshes(g),
  };
  g.userData = rig;
  return g;
}
