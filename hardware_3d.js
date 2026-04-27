/* ═══════════════════════════════════════════════════════════════════
   Hardware 3D — GPU & TPU Modelle, scroll-gekoppelt
   Performance: Render nur bei Scroll/Drag/Resize, kein continuous RAF
   IntersectionObserver pausiert komplett wenn Section nicht sichtbar
   ═══════════════════════════════════════════════════════════════════ */
(function(){

  function makeTextTexture(text, opts){
    opts = opts || {};
    const color = opts.color || '#ffffff';
    const font = opts.font || 'bold 96px Arial';
    const width = opts.width || 512;
    const height = opts.height || 128;
    const cv = document.createElement('canvas');
    cv.width = width; cv.height = height;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width/2, height/2);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    return tex;
  }

  // ════════════════════════════════════════════════════════════════
  // GPU Factory — RTX-4090-Founders-Edition-Stil mit voller Detail-Dichte
  // ════════════════════════════════════════════════════════════════
  function buildGPU(){
    const group = new THREE.Group();
    group.userData.type = 'gpu';

    const L = 5.6, D = 2.6, H = 0.95;

    // PCB
    const pcb = new THREE.Mesh(
      new THREE.BoxGeometry(L - 0.1, 0.08, D - 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0a1512, metalness: 0.45, roughness: 0.55 })
    );
    pcb.position.y = 0.04;
    group.add(pcb);

    // Shroud
    const shroudMat = new THREE.MeshStandardMaterial({ color: 0x111115, metalness: 0.55, roughness: 0.35 });
    const shroud = new THREE.Mesh(new THREE.BoxGeometry(L, H, D), shroudMat);
    shroud.position.y = 0.08 + H/2;
    group.add(shroud);

    // Silver X-Frame
    const diagAngle = Math.atan2(D, L);
    const diagLen = Math.hypot(L, D);
    const xFrameMat = new THREE.MeshStandardMaterial({
      color: 0xb8b8c2, metalness: 0.95, roughness: 0.22,
      emissive: 0x202028, emissiveIntensity: 0.15
    });
    const xBar1 = new THREE.Mesh(new THREE.BoxGeometry(diagLen - 0.25, 0.05, 0.38), xFrameMat);
    xBar1.position.y = 0.08 + H + 0.025; xBar1.rotation.y = diagAngle;
    group.add(xBar1);
    const xBar2 = new THREE.Mesh(new THREE.BoxGeometry(diagLen - 0.25, 0.05, 0.38), xFrameMat);
    xBar2.position.y = 0.08 + H + 0.025; xBar2.rotation.y = -diagAngle;
    group.add(xBar2);
    const xCenter = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.055, 0.5), xFrameMat);
    xCenter.position.y = 0.08 + H + 0.028;
    group.add(xCenter);

    // Chrome-Kanten
    const mkEdge = (w, d, x, z) => {
      const e = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), xFrameMat);
      e.position.set(x, 0.08 + H - 0.02, z);
      group.add(e);
    };
    mkEdge(L, 0.05, 0,  D/2 - 0.01);
    mkEdge(L, 0.05, 0, -D/2 + 0.01);
    mkEdge(0.05, D, -L/2 + 0.01, 0);
    mkEdge(0.05, D,  L/2 - 0.01, 0);

    // Panel-Einsätze
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x080810, metalness: 0.3, roughness: 0.75 });
    const panelL = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.02, 0.9), panelMat);
    panelL.position.set(-1.55, 0.08 + H + 0.005, 0); group.add(panelL);
    const panelB = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.02, 0.65), panelMat);
    panelB.position.set(0, 0.08 + H + 0.005, -0.65); group.add(panelB);
    const panelF = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.02, 0.65), panelMat);
    panelF.position.set(0, 0.08 + H + 0.005, 0.65); group.add(panelF);

    // RTX 4090 Schriftzug
    const rtxTex = makeTextTexture('RTX  4090', { color: '#c8c8d2', font: 'bold 110px Arial', width: 1024, height: 220 });
    const rtxLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.25),
      new THREE.MeshBasicMaterial({ map: rtxTex, transparent: true })
    );
    rtxLabel.rotation.x = -Math.PI / 2;
    rtxLabel.position.set(-1.55, 0.08 + H + 0.018, 0);
    group.add(rtxLabel);

    // Lüfter mit Sichel-Blades
    function makeBigFan(xPos){
      const fanGroup = new THREE.Group();
      const outerRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.9, 0.06, 10, 48),
        new THREE.MeshStandardMaterial({ color: 0x16161e, metalness: 0.55, roughness: 0.4 })
      );
      outerRing.rotation.x = Math.PI / 2;
      fanGroup.add(outerRing);

      const wellDepth = 0.22;
      const wellSide = new THREE.Mesh(
        new THREE.CylinderGeometry(0.88, 0.88, wellDepth, 48, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x020204, metalness: 0.4, roughness: 0.9, side: THREE.DoubleSide })
      );
      wellSide.position.y = -wellDepth/2;
      fanGroup.add(wellSide);
      const wellBottom = new THREE.Mesh(
        new THREE.CircleGeometry(0.88, 48),
        new THREE.MeshStandardMaterial({ color: 0x030306, metalness: 0.3, roughness: 0.95 })
      );
      wellBottom.rotation.x = -Math.PI / 2;
      wellBottom.position.y = -wellDepth + 0.005;
      fanGroup.add(wellBottom);

      // Heatsink-Finnen im Well
      const finMat = new THREE.MeshStandardMaterial({ color: 0x252530, metalness: 0.7, roughness: 0.3 });
      for(let i = 0; i < 13; i++){
        const fin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.04), finMat);
        fin.position.set(0, -wellDepth + 0.03, -0.75 + i * 0.125);
        fanGroup.add(fin);
      }

      // Rotor mit Sichel-Blades (ExtrudeGeometry)
      const rotor = new THREE.Group();
      rotor.userData.isFanRotor = true;
      rotor.userData.spinSpeed = 0.028 + Math.random() * 0.012;

      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(0.20, -0.03);
      bladeShape.bezierCurveTo(0.42, -0.08, 0.72, -0.02, 0.88, 0.06);
      bladeShape.quadraticCurveTo(0.90, 0.14, 0.84, 0.20);
      bladeShape.bezierCurveTo(0.58, 0.28, 0.30, 0.22, 0.20, 0.10);
      bladeShape.lineTo(0.20, -0.03);

      const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
        depth: 0.024, bevelEnabled: true, bevelThickness: 0.006,
        bevelSize: 0.006, bevelSegments: 2, steps: 1
      });
      bladeGeo.translate(0, 0, -0.012);
      bladeGeo.rotateX(-Math.PI / 2);

      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a22, metalness: 0.4, roughness: 0.45, side: THREE.DoubleSide
      });

      for(let i = 0; i < 9; i++){
        const holder = new THREE.Group();
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.rotation.x = -0.38;
        holder.add(blade);
        holder.rotation.y = (i / 9) * Math.PI * 2;
        rotor.add(holder);
      }

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.26, 0.08, 32),
        new THREE.MeshStandardMaterial({ color: 0x0c0c14, metalness: 0.92, roughness: 0.15 })
      );
      hub.position.y = 0.015;
      rotor.add(hub);

      const hubLogo = new THREE.Mesh(
        new THREE.CircleGeometry(0.14, 24),
        new THREE.MeshBasicMaterial({ color: 0x76b900, transparent: true, opacity: 0.85 })
      );
      hubLogo.rotation.x = -Math.PI / 2;
      hubLogo.position.y = 0.06;
      rotor.add(hubLogo);
      const hubCore = new THREE.Mesh(
        new THREE.CircleGeometry(0.05, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
      );
      hubCore.rotation.x = -Math.PI / 2;
      hubCore.position.y = 0.065;
      rotor.add(hubCore);

      fanGroup.add(rotor);
      fanGroup.position.set(xPos, 0, 0);
      return fanGroup;
    }
    const topFan = makeBigFan(1.3);
    topFan.position.y = 0.08 + H - 0.02;
    group.add(topFan);

    // Backplate
    const backplate = new THREE.Mesh(
      new THREE.BoxGeometry(L, 0.04, D),
      new THREE.MeshStandardMaterial({ color: 0x06060a, metalness: 0.65, roughness: 0.35 })
    );
    backplate.position.y = 0.09;
    group.add(backplate);

    // NVIDIA Schriftzug + Glow
    const nvTex = makeTextTexture('NVIDIA', { color: '#76b900', font: 'italic bold 82px Arial', width: 1024, height: 180 });
    const nvLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 0.18),
      new THREE.MeshBasicMaterial({ map: nvTex, transparent: true, opacity: 0.95 })
    );
    nvLabel.position.set(1.6, 0.08 + H * 0.72, D/2 + 0.005);
    group.add(nvLabel);
    const nvGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.28),
      new THREE.MeshBasicMaterial({ color: 0x76b900, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    nvGlow.position.copy(nvLabel.position); nvGlow.position.z -= 0.002;
    group.add(nvGlow);

    // Bracket
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, H + 0.1, D),
      new THREE.MeshStandardMaterial({ color: 0x18181e, metalness: 0.6, roughness: 0.4 })
    );
    bracket.position.set(L/2 + 0.06, 0.08 + H/2, 0);
    group.add(bracket);

    // Bracket Ventilations-Schlitze
    const slotMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.2, roughness: 0.9 });
    for(let i = 0; i < 14; i++){
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.08), slotMat);
      slot.position.set(L/2 + 0.12, 0.08 + H * 0.88, -0.95 + i * 0.14);
      group.add(slot);
    }

    // I/O-Ports (detailliert: Frame, Cavity, Tongue, Gold-Pins)
    function makePort(type){
      const pg = new THREE.Group();
      const isH = type === 'hdmi';
      const pW = 0.19, pH = isH ? 0.085 : 0.07;
      const frameT = 0.012;
      const frameM  = new THREE.MeshStandardMaterial({ color: 0x808088, metalness: 0.9,  roughness: 0.26 });
      const blackM  = new THREE.MeshStandardMaterial({ color: 0x050507, metalness: 0.2,  roughness: 0.95 });
      const tongueM = new THREE.MeshStandardMaterial({
        color: isH ? 0xe8dcb8 : 0xece5cf, metalness: 0.12, roughness: 0.7
      });
      const pinLocal = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.92, roughness: 0.18 });
      const clipM    = new THREE.MeshStandardMaterial({ color: 0x9c9ca4, metalness: 0.88, roughness: 0.28 });

      const frameLen = pW + 2*frameT;
      const frameDepth = 0.018;
      const ft = new THREE.Mesh(new THREE.BoxGeometry(frameDepth, frameT, frameLen), frameM);
      ft.position.set(frameDepth/2, pH/2 + frameT/2, 0); pg.add(ft);
      const fb = new THREE.Mesh(new THREE.BoxGeometry(frameDepth, frameT, frameLen), frameM);
      fb.position.set(frameDepth/2, -pH/2 - frameT/2, 0); pg.add(fb);
      const fl = new THREE.Mesh(new THREE.BoxGeometry(frameDepth, pH, frameT), frameM);
      fl.position.set(frameDepth/2, 0, -pW/2 - frameT/2); pg.add(fl);
      const fr = new THREE.Mesh(new THREE.BoxGeometry(frameDepth, pH, frameT), frameM);
      fr.position.set(frameDepth/2, 0, pW/2 + frameT/2); pg.add(fr);

      const cav = new THREE.Mesh(new THREE.BoxGeometry(0.07, pH, pW), blackM);
      cav.position.set(-0.035, 0, 0); pg.add(cav);

      const tW = isH ? pW * 0.74 : pW * 0.82;
      const tH = 0.012, tD = 0.052;
      const tY = isH ? 0.014 : 0;
      const tongue = new THREE.Mesh(new THREE.BoxGeometry(tD, tH, tW), tongueM);
      tongue.position.set(-tD/2 - 0.01, tY, 0); pg.add(tongue);

      const pinCount = isH ? 19 : 20;
      const pinSpace = tW / (pinCount + 1);
      for(let i = 0; i < pinCount; i++){
        const pin = new THREE.Mesh(
          new THREE.BoxGeometry(tD * 0.75, 0.0025, pinSpace * 0.42),
          pinLocal
        );
        pin.position.set(-tD/2 - 0.006, tY + tH/2 + 0.002, -tW/2 + (i+1) * pinSpace);
        pg.add(pin);
      }

      if(!isH){
        const notch = new THREE.Mesh(new THREE.BoxGeometry(frameDepth * 0.9, 0.009, 0.028), clipM);
        notch.position.set(frameDepth/2, pH/2 - 0.006, -pW/2 + 0.035);
        pg.add(notch);
      }
      if(isH){
        for(let i = 0; i < 10; i++){
          const lowPin = new THREE.Mesh(
            new THREE.BoxGeometry(tD * 0.5, 0.002, pinSpace * 0.4),
            pinLocal
          );
          lowPin.position.set(-tD/2 - 0.008, tY - tH/2 - 0.002, -tW/2 + (i+1) * (tW / 11));
          pg.add(lowPin);
        }
      }
      return pg;
    }
    const hdmiPort = makePort('hdmi');
    hdmiPort.position.set(L/2 + 0.13, 0.55, -0.65);
    group.add(hdmiPort);
    [-0.25, 0.1, 0.45].forEach(z => {
      const dp = makePort('dp');
      dp.position.set(L/2 + 0.13, 0.32, z);
      group.add(dp);
    });

    // 12VHPWR Housing + Pins
    const pwrHousing = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.2, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x0f0f18, metalness: 0.35, roughness: 0.65 })
    );
    pwrHousing.position.set(-0.3, 0.08 + H + 0.12, -D/2 + 0.17);
    group.add(pwrHousing);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
    for(let i = 0; i < 8; i++){
      for(let j = 0; j < 2; j++){
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.05), pinMat);
        pin.position.set(-0.3 - 0.4 + i * 0.115, 0.08 + H + 0.17, -D/2 + 0.1 + j * 0.14);
        group.add(pin);
      }
    }

    // PCIe-Finger
    const pcieMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 });
    for(let i = 0; i < 30; i++){
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.01, 0.3), pcieMat);
      finger.position.set(-1.5 + i * 0.1, 0.01, D/2 - 0.15);
      group.add(finger);
    }

    // Bracket-Schraublöcher
    const screwMat = new THREE.MeshStandardMaterial({ color: 0x303038, metalness: 0.8, roughness: 0.25 });
    [-L/2 + 0.15, L/2 - 0.15].forEach(x => {
      [D/2 - 0.1, -D/2 + 0.1].forEach(z => {
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12), screwMat);
        s.position.set(x, 0.08 + H + 0.042, z);
        group.add(s);
      });
    });

    // Detail-Layer 2
    const heatFinMat = new THREE.MeshStandardMaterial({ color: 0xc89060, metalness: 0.9, roughness: 0.3 });
    for(let i = 0; i < 22; i++){
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, H - 0.22, 0.08), heatFinMat);
      fin.position.set(-L/2 - 0.01, 0.08 + (H - 0.22)/2 + 0.06, -D/2 + 0.2 + i * ((D - 0.4) / 21));
      group.add(fin);
    }
    const hpMat = new THREE.MeshStandardMaterial({
      color: 0xd89a5a, metalness: 0.95, roughness: 0.18, emissive: 0x2a1208, emissiveIntensity: 0.12
    });
    [0.22, 0.42, 0.62, 0.80].forEach((yRatio, idx) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16), hpMat);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(-L/2 + 0.03, 0.08 + H * yRatio, -D/2 + 0.4 + idx * 0.55);
      group.add(pipe);
    });

    const rgbStrip = new THREE.Mesh(
      new THREE.BoxGeometry(L - 1.8, 0.035, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x4f8ef7, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
    );
    rgbStrip.position.set(-0.3, 0.08 + H - 0.018, D/2 - 0.03);
    group.add(rgbStrip);
    const rgbGlow = new THREE.Mesh(
      new THREE.BoxGeometry(L - 1.4, 0.08, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x4f8ef7, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    rgbGlow.position.copy(rgbStrip.position);
    group.add(rgbGlow);

    const gfFrontTex = makeTextTexture('GeForce  RTX', { color: '#ffffff', font: 'italic 900 76px Arial', width: 1024, height: 128 });
    const gfFrontLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.22),
      new THREE.MeshBasicMaterial({ map: gfFrontTex, transparent: true, opacity: 0.92 })
    );
    gfFrontLabel.position.set(-1.3, 0.08 + H * 0.5, D/2 + 0.003);
    group.add(gfFrontLabel);

    // NVLink
    const nvLinkBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.08, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x08080d, metalness: 0.6, roughness: 0.5 })
    );
    nvLinkBase.position.set(-L/2 + 1.35, 0.08 + H + 0.09, -D/2 + 0.12);
    group.add(nvLinkBase);
    const nvPadMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.92, roughness: 0.15 });
    for(let i = 0; i < 20; i++){
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.01, 0.06), nvPadMat);
      pad.position.set(-L/2 + 1.35 - 0.33 + i * 0.033, 0.08 + H + 0.131, -D/2 + 0.12);
      group.add(pad);
    }

    // Dual-BIOS
    const biosBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.025, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x1c1c22, metalness: 0.5, roughness: 0.5 })
    );
    biosBase.position.set(L/2 - 0.55, 0.08 + H + 0.04, -D/2 + 0.15);
    group.add(biosBase);
    const biosSlider = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.02, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xe8e8ee, metalness: 0.7, roughness: 0.3 })
    );
    biosSlider.position.set(L/2 - 0.58, 0.08 + H + 0.057, -D/2 + 0.15);
    group.add(biosSlider);

    // FE Badge
    const feBadge = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 32),
      new THREE.MeshStandardMaterial({ color: 0xc8c8d0, metalness: 0.95, roughness: 0.2 })
    );
    feBadge.rotation.x = -Math.PI / 2;
    feBadge.position.set(L/2 - 0.95, 0.08 + H + 0.02, 0.82);
    group.add(feBadge);
    const feDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 16),
      new THREE.MeshBasicMaterial({ color: 0x76b900 })
    );
    feDot.rotation.x = -Math.PI / 2;
    feDot.position.set(L/2 - 0.95, 0.08 + H + 0.021, 0.82);
    group.add(feDot);

    // 12VHPWR Frame + Sense-Pins
    const pwrFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.08, 0.04, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x070712, metalness: 0.3, roughness: 0.85 })
    );
    pwrFrame.position.set(-0.3, 0.08 + H + 0.14, -D/2 + 0.17);
    group.add(pwrFrame);
    for(let i = 0; i < 4; i++){
      const sense = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.04, 0.025), pinMat);
      sense.position.set(-0.52 + i * 0.08, 0.08 + H + 0.16, -D/2 + 0.25);
      group.add(sense);
    }

    // Bracket-Port-Labels
    const lblMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
    const hdmiLbl = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.02, 0.1), lblMat);
    hdmiLbl.position.set(L/2 + 0.135, 0.71, -0.65);
    group.add(hdmiLbl);
    for(let i = 0; i < 3; i++){
      const dpLbl = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.018, 0.055), lblMat);
      dpLbl.position.set(L/2 + 0.135, 0.48, -0.25 + i * 0.35);
      group.add(dpLbl);
    }

    // Power-LED
    const pwrLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x7aff92 })
    );
    pwrLed.position.set(L/2 + 0.14, 0.18, 0.85);
    group.add(pwrLed);
    const pwrLedGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x7aff92, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    pwrLedGlow.position.copy(pwrLed.position);
    group.add(pwrLedGlow);

    // Backplate-Gravur
    const gfBackTex = makeTextTexture('GEFORCE  RTX', { color: '#2a2a38', font: 'italic 900 88px Arial', width: 1024, height: 128 });
    const gfBackLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 0.22),
      new THREE.MeshBasicMaterial({ map: gfBackTex, transparent: true, opacity: 0.82 })
    );
    gfBackLabel.rotation.x = Math.PI / 2;
    gfBackLabel.position.set(0.8, 0.068, 0);
    group.add(gfBackLabel);

    // Backplate-Vents
    const ventMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    for(let i = 0; i < 11; i++){
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.5), ventMat);
      vent.position.set(-L/2 + 0.5 + i * 0.13, 0.072, -D/2 + 0.4);
      group.add(vent);
    }

    // Hologram + Serial
    const holoSticker = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.004, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xd0d0dc, metalness: 0.85, roughness: 0.2, emissive: 0x4f8ef7, emissiveIntensity: 0.25 })
    );
    holoSticker.position.set(L/2 - 0.95, 0.072, D/2 - 0.35);
    group.add(holoSticker);
    const serialSticker = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.003, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xf0f0ee })
    );
    serialSticker.position.set(-L/2 + 0.75, 0.072, D/2 - 0.32);
    group.add(serialSticker);
    for(let i = 0; i < 12; i++){
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.001, 0.05),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      bar.position.set(-L/2 + 0.65 + i * 0.02, 0.074, D/2 - 0.32);
      group.add(bar);
    }

    // Anti-Sag Hole
    const sagHole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0x000004, metalness: 0.2, roughness: 0.9 })
    );
    sagHole.position.set(L/2 - 1.5, 0.08 + H + 0.035, D/2 - 0.15);
    group.add(sagHole);

    // VRM-Chokes
    const chokeMat = new THREE.MeshStandardMaterial({ color: 0x08080c, metalness: 0.4, roughness: 0.6 });
    const chokeCopMat = new THREE.MeshStandardMaterial({ color: 0xd4944a, metalness: 0.92, roughness: 0.25 });
    for(let i = 0; i < 7; i++){
      const choke = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.13), chokeMat);
      choke.position.set(-0.8 + i * 0.28, 0.07, -D/2 + 0.15);
      group.add(choke);
      const chokeTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.1), chokeCopMat);
      chokeTop.position.set(-0.8 + i * 0.28, 0.125, -D/2 + 0.15);
      group.add(chokeTop);
    }

    // SMD-Caps
    const smdMat = new THREE.MeshStandardMaterial({ color: 0x6b4520, metalness: 0.3, roughness: 0.65 });
    for(let i = 0; i < 18; i++){
      const smd = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.035), smdMat);
      smd.position.set(-1.6 + i * 0.19, 0.06, -D/2 + 0.35);
      group.add(smd);
    }

    // Fan-Header
    const fanHeader = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.035, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xf2f2ee, metalness: 0.15, roughness: 0.75 })
    );
    fanHeader.position.set(2.1, 0.065, -D/2 + 0.5);
    group.add(fanHeader);

    // Torx
    const torxMat = new THREE.MeshStandardMaterial({ color: 0x3a3a44, metalness: 0.88, roughness: 0.22 });
    const torxCoreMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0e, metalness: 0.3, roughness: 0.7 });
    [[-L/2+0.4, D/2-0.25], [-L/2+0.4, -D/2+0.25], [0, D/2-0.25], [0, -D/2+0.25], [L/2-0.4, D/2-0.25], [L/2-0.4, -D/2+0.25]].forEach(([x, z]) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.012, 10), torxMat);
      t.position.set(x, 0.076, z); group.add(t);
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.014, 6), torxCoreMat);
      core.position.set(x, 0.078, z); group.add(core);
    });

    return group;
  }

  // ════════════════════════════════════════════════════════════════
  // TPU Factory — Tensor-Processor mit HBM-Stacks + Systolic Array
  // ════════════════════════════════════════════════════════════════
  function buildTPU(){
    const group = new THREE.Group();
    group.userData.type = 'tpu';

    const substrate = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.1, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x12121c, metalness: 0.4, roughness: 0.65 })
    );
    group.add(substrate);

    // Pin-1 Marker
    const pinOne = new THREE.Mesh(
      new THREE.CircleGeometry(0.06, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
    );
    pinOne.rotation.x = -Math.PI / 2;
    pinOne.position.set(-1.95, 0.052, -1.95);
    group.add(pinOne);

    // Fiducials
    const fidMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    [[-1.95, 1.95], [1.95, -1.95], [1.95, 1.95]].forEach(([x, z]) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.002, 0.08), fidMat);
      f.position.set(x, 0.052, z); group.add(f);
    });

    // Silk-Traces
    const traceMat = new THREE.MeshBasicMaterial({ color: 0x4f8ef7, transparent: true, opacity: 0.3 });
    for(let i = 0; i < 16; i++){
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.6 + Math.random() * 0.8, 0.001, 0.015), traceMat);
      t.position.set((Math.random() - 0.5) * 3.8, 0.053, (Math.random() - 0.5) * 3.8);
      t.rotation.y = Math.random() * Math.PI;
      group.add(t);
    }

    // Package
    const pkg = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.16, 2.3),
      new THREE.MeshStandardMaterial({ color: 0x1a1a28, metalness: 0.6, roughness: 0.4 })
    );
    pkg.position.y = 0.13;
    group.add(pkg);

    // Heatspreader
    const spreader = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.04, 2.0),
      new THREE.MeshStandardMaterial({ color: 0xbbbbc5, metalness: 0.95, roughness: 0.18 })
    );
    spreader.position.y = 0.23;
    group.add(spreader);

    // TPU v5 Label
    const tpuTex = makeTextTexture('TPU v5', { color: '#1a1a28', font: 'bold 88px Arial', width: 512, height: 128 });
    const tpuLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.22),
      new THREE.MeshBasicMaterial({ map: tpuTex, transparent: true, opacity: 0.85 })
    );
    tpuLabel.rotation.x = -Math.PI / 2;
    tpuLabel.position.set(0, 0.251, 0.65);
    group.add(tpuLabel);

    // Google Label
    const gTex = makeTextTexture('Google', { color: '#555560', font: 'italic bold 48px Arial', width: 512, height: 96 });
    const gLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.11),
      new THREE.MeshBasicMaterial({ map: gTex, transparent: true, opacity: 0.7 })
    );
    gLabel.rotation.x = -Math.PI / 2;
    gLabel.position.set(0, 0.251, 0.85);
    group.add(gLabel);

    // Systolic-Array 16×16
    const cellGeo = new THREE.BoxGeometry(0.08, 0.015, 0.08);
    const cellCount = 16, arraySize = 1.5;
    const cellStep = arraySize / cellCount;
    for(let i = 0; i < cellCount; i++){
      for(let j = 0; j < cellCount; j++){
        const distToCenter = Math.hypot(i - cellCount/2 + 0.5, j - cellCount/2 + 0.5) / (cellCount/2);
        const active = Math.random() < 0.45;
        const baseOpacity = active ? 0.9 - distToCenter * 0.25 : 0.2;
        const cell = new THREE.Mesh(cellGeo, new THREE.MeshBasicMaterial({
          color: active ? 0x4f8ef7 : 0x2a2a3a,
          transparent: true, opacity: baseOpacity
        }));
        cell.position.set(
          -arraySize/2 + i * cellStep + cellStep/2,
          0.257,
          -arraySize/2 + j * cellStep + cellStep/2
        );
        cell.userData.active = active;
        cell.userData.basePhase = Math.random() * Math.PI * 2;
        group.add(cell);
      }
    }

    // Cluster-Divider
    const clusterDivMat = new THREE.MeshBasicMaterial({ color: 0x333344, transparent: true, opacity: 0.6 });
    for(let c = 1; c < 4; c++){
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.001, arraySize), clusterDivMat);
      v.position.set(-arraySize/2 + c * (arraySize/4), 0.262, 0); group.add(v);
      const h = new THREE.Mesh(new THREE.BoxGeometry(arraySize, 0.001, 0.01), clusterDivMat);
      h.position.set(0, 0.262, -arraySize/2 + c * (arraySize/4)); group.add(h);
    }

    // Array-Rahmen
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(arraySize + 0.05, 0.003, arraySize + 0.05),
      new THREE.MeshBasicMaterial({ color: 0x4f8ef7, wireframe: true, transparent: true, opacity: 0.5 })
    );
    frame.position.y = 0.263;
    group.add(frame);

    // HBM-Stacks
    function makeHBM(x, z){
      const hbm = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.04, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x0f0f15, metalness: 0.5, roughness: 0.5 })
      );
      base.position.y = 0.075;
      hbm.add(base);
      for(let i = 0; i < 4; i++){
        const die = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.05, 1.15),
          new THREE.MeshStandardMaterial({ color: i === 3 ? 0x282835 : 0x1e1e28, metalness: 0.55, roughness: 0.4 })
        );
        die.position.y = 0.11 + i * 0.055;
        hbm.add(die);
        const edge = new THREE.Mesh(
          new THREE.BoxGeometry(0.72, 0.003, 1.17),
          new THREE.MeshBasicMaterial({ color: 0x4f8ef7, transparent: true, opacity: 0.25 })
        );
        edge.position.y = 0.085 + i * 0.055;
        hbm.add(edge);
      }
      const lbl = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.002, 0.1),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
      );
      lbl.position.y = 0.33;
      hbm.add(lbl);
      hbm.position.set(x, 0, z);
      return hbm;
    }
    group.add(makeHBM(-1.55, -0.7), makeHBM(-1.55, 0.7), makeHBM(1.55, -0.7), makeHBM(1.55, 0.7));

    // Interposer-Traces
    const interMat = new THREE.MeshBasicMaterial({ color: 0x4f8ef7, transparent: true, opacity: 0.55 });
    for(let i = 0; i < 8; i++){
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.002, 0.015), interMat);
      l.position.set(-1.13, 0.213, -0.8 + i * 0.22); group.add(l);
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.002, 0.015), interMat);
      r.position.set(1.13, 0.213, -0.8 + i * 0.22); group.add(r);
    }

    // Capacitors
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1a1a28, metalness: 0.45, roughness: 0.55 });
    const capTopMat = new THREE.MeshStandardMaterial({ color: 0x8b6b32, metalness: 0.6, roughness: 0.4 });
    function addCap(x, z){
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.14, 10), capMat);
      c.position.set(x, 0.12, z); group.add(c);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.02, 10), capTopMat);
      top.position.set(x, 0.2, z); group.add(top);
    }
    for(let i = 0; i < 10; i++){
      addCap(-1.8 + i * 0.4, -1.7);
      addCap(-1.8 + i * 0.4,  1.7);
    }
    [[-1.55, 0], [1.55, 0]].forEach(([x, z]) => { addCap(x - 0.2, z); addCap(x + 0.2, z); });

    // Decoupling-Caps
    const decapMat = new THREE.MeshStandardMaterial({ color: 0x505058, metalness: 0.5, roughness: 0.4 });
    for(let i = 0; i < 18; i++){
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.04), decapMat);
      const side = Math.floor(Math.random() * 4);
      const offset = (Math.random() - 0.5) * 2.6;
      if(side === 0) d.position.set(-1.8, 0.08, offset);
      else if(side === 1) d.position.set(1.8, 0.08, offset);
      else if(side === 2) d.position.set(offset, 0.08, -1.8);
      else d.position.set(offset, 0.08, 1.8);
      if(Math.random() < 0.5) d.rotation.y = Math.PI / 2;
      group.add(d);
    }

    // BGA Balls
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.2 });
    const ballGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const ballCount = 14, ballStep = 3.6 / ballCount;
    for(let i = 0; i < ballCount; i++){
      for(let j = 0; j < ballCount; j++){
        const b = new THREE.Mesh(ballGeo, ballMat);
        b.position.set(-1.8 + i * ballStep + ballStep/2, -0.06, -1.8 + j * ballStep + ballStep/2);
        group.add(b);
      }
    }

    return group;
  }

  // ════════════════════════════════════════════════════════════════
  // Scroll-gekoppelte Mount-Funktion
  // Render nur bei Bedarf (Scroll, Drag, Resize). Kein continuous RAF.
  // IntersectionObserver pausiert komplett wenn nicht sichtbar.
  // ════════════════════════════════════════════════════════════════
  function mountScrollScene(mountId, factory, opts){
    opts = opts || {};
    const cameraDist = opts.cameraDist || 6.5;
    const baseRotation = opts.baseRotation || { x: 0.4, y: -0.55 };
    const flyInScale = opts.flyInScale || 1.8;  // Start-Scale (groß)
    const scrollRotations = opts.scrollRotations || 1.2;  // wie viel sich beim Scrollen dreht
    const sectionSelector = opts.sectionSelector || '#s5';

    const mount = document.getElementById(mountId);
    if(!mount) return;
    const section = document.querySelector(sectionSelector);
    if(!section) return;

    const object = factory();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(cameraDist * 0.7, cameraDist * 0.45, cameraDist * 0.85);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mount.appendChild(renderer.domElement);

    // Kräftige, eigenständige Beleuchtung — damit das Modell sich vom dunklen Card-Hintergrund abhebt
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xcfe0ff, 1.6); key.position.set(5, 8, 4); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe4b8, 0.7); fill.position.set(-4, 2, -3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0x6ba8ff, 1.0); rim.position.set(0, -3, -5); scene.add(rim);
    // Zusätzliches Top-Licht für bessere Lesbarkeit der Oberflächen-Details
    const top = new THREE.DirectionalLight(0xffffff, 0.5); top.position.set(0, 10, 0); scene.add(top);

    scene.add(object);
    object.rotation.x = baseRotation.x;
    object.rotation.y = baseRotation.y;

    let renderQueued = false;
    function renderOnce(){
      if(renderQueued) return;
      renderQueued = true;
      requestAnimationFrame(() => { renderer.render(scene, camera); renderQueued = false; });
    }

    function resize(){
      const w = mount.clientWidth, h = mount.clientHeight;
      if(!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderOnce();
    }

    // Scroll-Handler
    let isInView = false;
    let lastScrollY = window.scrollY;
    let dragActive = false;  // wenn User gerade zieht, nicht mit Scroll überschreiben

    function updateFromScroll(){
      if(!isInView || dragActive) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progress 0 = Section kommt unten rein, 1 = Section oben raus
      const raw = (vh - rect.top) / (vh + rect.height);
      const progress = Math.max(0, Math.min(1, raw));

      // Y-Rotation folgt Scroll-Progress (linear dreht sich während du scrollst)
      object.rotation.y = baseRotation.y - 0.6 + progress * Math.PI * scrollRotations;
      object.rotation.x = baseRotation.x;

      // Scale: startet groß, schrumpft in erster Hälfte
      const flyProg = Math.min(progress * 2, 1);
      const s = flyInScale - flyProg * (flyInScale - 1);
      object.scale.setScalar(s);

      // Lüfter drehen proportional zur Scroll-Geschwindigkeit
      const delta = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      const fanBoost = delta * 0.012;
      object.traverse(child => {
        if(child.userData && child.userData.isFanRotor){
          child.rotation.y += fanBoost + child.userData.spinSpeed * 0.15;
        }
        // Systolic-Array-Pulsieren leicht bei Scroll
        if(child.userData && child.userData.active && child.material){
          const pulse = Math.sin(progress * 20 + child.userData.basePhase) * 0.3 + 0.7;
          child.material.opacity = 0.85 * pulse;
        }
      });

      renderOnce();
    }

    // IntersectionObserver
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        isInView = e.isIntersecting;
        if(isInView){
          updateFromScroll();
        }
      });
    }, { rootMargin: '150px' });
    io.observe(section);

    window.addEventListener('scroll', updateFromScroll, { passive: true });
    window.addEventListener('resize', () => { resize(); updateFromScroll(); });

    // Drag zum Inspizieren (ersetzt Scroll-gesteuerte Rotation temporär)
    mount.style.cursor = 'grab';
    mount.style.touchAction = 'none';
    let lastX = 0, lastY = 0;
    mount.addEventListener('pointerdown', (e) => {
      dragActive = true;
      lastX = e.clientX; lastY = e.clientY;
      mount.style.cursor = 'grabbing';
      try{ mount.setPointerCapture(e.pointerId); }catch(_){}
    });
    mount.addEventListener('pointermove', (e) => {
      if(!dragActive) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      object.rotation.y += dx * 0.008;
      object.rotation.x += dy * 0.006;
      object.rotation.x = Math.max(-Math.PI/2 + 0.15, Math.min(Math.PI/2 - 0.15, object.rotation.x));
      lastX = e.clientX; lastY = e.clientY;
      renderOnce();
    });
    const stopDrag = (e) => {
      if(!dragActive) return;
      dragActive = false;
      mount.style.cursor = 'grab';
      try{ mount.releasePointerCapture(e.pointerId); }catch(_){}
    };
    mount.addEventListener('pointerup', stopDrag);
    mount.addEventListener('pointercancel', stopDrag);
    mount.addEventListener('pointerleave', stopDrag);

    // Initial
    resize();
    updateFromScroll();
  }

  // ════════════════════════════════════════════════════════════════
  // Boot — wartet auf THREE und DOM
  // ════════════════════════════════════════════════════════════════
  function boot(){
    if(typeof THREE === 'undefined'){
      setTimeout(boot, 60);
      return;
    }
    const gpuMount = document.getElementById('gpu3DCanvas');
    const tpuMount = document.getElementById('tpu3DCanvas');
    if(gpuMount){
      mountScrollScene('gpu3DCanvas', buildGPU, { cameraDist: 7.5, baseRotation: { x: 0.45, y: -0.55 } });
    }
    if(tpuMount){
      mountScrollScene('tpu3DCanvas', buildTPU, { cameraDist: 6, baseRotation: { x: 0.5, y: -0.65 } });
    }
  }

  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(boot, 0);
  } else {
    window.addEventListener('DOMContentLoaded', boot);
  }

})();
