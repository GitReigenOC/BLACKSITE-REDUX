/* ============================================================================
   VANGUARD PRIME — Audited, Bug-Fixed & Visually Overhauled 3D FPS Engine
   GitHub Pages Static Build (Three.js r160)
============================================================================ */
'use strict';

const GRAVITY = 28;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();

/* ===================== SAVE SYSTEM ===================== */
const SaveSystem = {
    key: 'vanguard_prime_v2',
    data: {
        playerName: 'OPERATOR',
        points: 1200,
        unlockedWeapons: ['rifle', 'shotgun', 'knife', 'rocket'],
        equippedLoadout: ['rifle', 'shotgun', 'rocket', 'knife', null],
        unlockedCamos: ['rifle:default', 'shotgun:default', 'knife:default', 'rocket:default'],
        equippedCamos: { rifle: 'default', shotgun: 'default', knife: 'default', rocket: 'default' },
        settings: {
            sensitivity: 1.0,
            scopeSensitivity: 0.45,
            fov: 85,
            volume: 0.7,
            uiColor: '#00e5ff',
            invertY: false
        }
    },
    load() {
        try {
            const raw = localStorage.getItem(this.key);
            if (raw) {
                const parsed = JSON.parse(raw);
                this.data = Object.assign(this.data, parsed);
                this.data.settings = Object.assign(this.data.settings, parsed.settings || {});
            }
        } catch (e) { /* ignore storage errors */ }
        this.applyTheme();
    },
    save() {
        try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
    },
    applyTheme() {
        const hex = this.data.settings.uiColor || '#00e5ff';
        document.documentElement.style.setProperty('--accent', hex);
        const r = parseInt(hex.slice(1, 3), 16) || 0;
        const g = parseInt(hex.slice(3, 5), 16) || 229;
        const b = parseInt(hex.slice(5, 7), 16) || 255;
        document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
    }
};
SaveSystem.load();

/* ===================== AUDIO ENGINE ===================== */
const audio = {
    ctx: null,
    volume: SaveSystem.data.settings.volume,
    init() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) this.ctx = new AC();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    _tone(freq, dur, type = 'sawtooth', vol = 0.2, slideTo = null) {
        if (!this.ctx || this.volume <= 0.01) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + dur);
        gain.gain.setValueAtTime(vol * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + dur);
    },
    _noise(dur, vol = 0.25, highpass = 400) {
        if (!this.ctx || this.volume <= 0.01) return;
        const now = this.ctx.currentTime;
        const len = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.35));
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = highpass;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol * this.volume, now);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(now);
    },
    shoot(kind) {
        if (kind === 'shotgun') { this._noise(0.22, 0.38, 180); this._tone(110, 0.18, 'triangle', 0.3, 35); }
        else if (kind === 'sniper' || kind === 'kar98') { this._noise(0.28, 0.4, 300); this._tone(180, 0.22, 'sawtooth', 0.28, 40); }
        else if (kind === 'rocket') { this._noise(0.35, 0.35, 120); this._tone(95, 0.3, 'sawtooth', 0.25, 30); }
        else if (kind === 'katana' || kind === 'knife') { this._noise(0.11, 0.22, 1600); this._tone(520, 0.09, 'sine', 0.15, 180); }
        else if (kind === 'lightning') { this._noise(0.45, 0.45, 600); this._tone(680, 0.35, 'sawtooth', 0.25, 60); }
        else { this._noise(0.1, 0.25, 500); this._tone(190, 0.08, 'square', 0.18, 55); }
    },
    hit(head) { this._tone(head ? 1150 : 720, 0.07, 'sine', 0.22, head ? 1550 : 500); },
    kill() { this._tone(520, 0.12, 'triangle', 0.22, 880); },
    explosion() { this._noise(0.5, 0.5, 80); this._tone(75, 0.45, 'sine', 0.4, 22); },
    pad() { this._tone(240, 0.24, 'sine', 0.22, 760); },
    pickup() { this._tone(520, 0.12, 'sine', 0.18, 920); },
    empty() { this._tone(180, 0.05, 'square', 0.1); },
    ui() { this._tone(640, 0.05, 'sine', 0.12, 820); },
    teleport() { this._tone(900, 0.2, 'sine', 0.22, 220); },
    telekinesis() { this._tone(140, 0.4, 'sawtooth', 0.22, 360); },
    flashbang() { this._tone(2600, 0.9, 'sine', 0.18, 2200); },
    domain() { this._tone(65, 1.1, 'sawtooth', 0.32, 35); },
    waveStart() { this._tone(330, 0.22, 'triangle', 0.2, 440); }
};

/* ===================== WEAPON & CAMO DEFINITIONS ===================== */
const WEAPON_DEFS = {
    rifle: { kind: 'rifle', name: 'M4 CARBINE', damage: 26, rpm: 650, mag: 30, reserve: 150, reload: 1.5, auto: true, spread: 0.012, price: 0 },
    smg: { kind: 'smg', name: 'VECTOR SMG', damage: 19, rpm: 920, mag: 36, reserve: 180, reload: 1.3, auto: true, spread: 0.022, price: 450 },
    shotgun: { kind: 'shotgun', name: 'M870 BREACHER', damage: 16, pellets: 7, rpm: 85, mag: 6, reserve: 36, reload: 1.9, auto: false, spread: 0.055, price: 0 },
    ak47: { kind: 'ak47', name: 'AK-47 VANGUARD', damage: 34, rpm: 540, mag: 30, reserve: 150, reload: 1.7, auto: true, spread: 0.016, price: 650 },
    sniper: { kind: 'sniper', name: 'AX-50 SNIPER', damage: 115, rpm: 48, mag: 5, reserve: 30, reload: 2.2, auto: false, spread: 0.002, price: 850 },
    kar98: { kind: 'kar98', name: 'KAR98K MARKSMAN', damage: 95, rpm: 62, mag: 5, reserve: 35, reload: 1.9, auto: false, spread: 0.003, price: 750 },
    lmg: { kind: 'lmg', name: 'MK48 TITAN LMG', damage: 28, rpm: 720, mag: 80, reserve: 240, reload: 2.8, auto: true, spread: 0.024, price: 950 },
    rocket: { kind: 'rocket', name: 'HYDRA LAUNCHER', damage: 135, rpm: 42, mag: 1, reserve: 8, reload: 2.1, auto: false, splashRadius: 6.0, price: 0 },
    knife: { kind: 'knife', name: 'COMBAT KNIFE', damage: 65, rpm: 140, mag: 1, reserve: 1, reload: 0, auto: false, melee: true, range: 2.8, price: 0 },
    katana: { kind: 'katana', name: 'REDLINER KATANA', damage: 95, rpm: 130, mag: 1, reserve: 1, reload: 0, auto: false, melee: true, range: 4.2, price: 1100 }
};

const CAMO_NAMES = {
    default: 'FACTORY SPEC',
    crimson: 'CRIMSON CARBON',
    cyber: 'CYBER NEON',
    emerald: 'EMERALD VIPER',
    royal: 'ROYAL GOLD',
    void: 'OBSIDIAN VOID',
    dragon: 'DRAGON SCALE'
};

const CAMO_PRICES = {
    default: 0, crimson: 350, cyber: 500, emerald: 650, royal: 900, void: 1200, dragon: 2000
};

const CAMO_SWATCHES = {
    default: 'linear-gradient(135deg, #2a313d, #161b24)',
    crimson: 'linear-gradient(135deg, #9b111e, #24070a, #ff2e44)',
    cyber: 'linear-gradient(135deg, #00e5ff, #0a1730, #ff00cc)',
    emerald: 'linear-gradient(135deg, #0b3b24, #1ce888, #061c12)',
    royal: 'linear-gradient(135deg, #ffd15c, #8a5a00, #fff0a8)',
    void: 'linear-gradient(135deg, #1b0a2e, #6c1fff, #090312)',
    dragon: 'linear-gradient(135deg, #ff3c00, #1a0606, #ffbe2e, #b80c09)'
};

/* ===================== PROCEDURAL CAMO TEXTURE ENGINE ===================== */
const _camoMatCache = {};
function getCamoMaterial(camoId = 'default') {
    if (_camoMatCache[camoId]) return _camoMatCache[camoId];

    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');

    let metalness = 0.65, roughness = 0.32, emissive = 0x000000, emissiveIntensity = 0;

    if (camoId === 'dragon') {
        // High-end Dragon Scale: obsidian base, layered crimson/molten-gold scales, glowing veins
        ctx.fillStyle = '#140606';
        ctx.fillRect(0, 0, 256, 256);
        const r = 24;
        for (let row = -1; row < 14; row++) {
            for (let col = -1; col < 10; col++) {
                const x = col * 32 + (row % 2 ? 16 : 0);
                const y = row * 20;
                const grad = ctx.createRadialGradient(x, y - 4, 2, x, y, r);
                grad.addColorStop(0, '#ffae00');
                grad.addColorStop(0.32, '#c81414');
                grad.addColorStop(0.78, '#2b0608');
                grad.addColorStop(1, '#0c0203');
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.lineWidth = 2.2;
                ctx.strokeStyle = '#ff6a00';
                ctx.stroke();
            }
        }
        // Molten gold claw-vein highlights
        ctx.strokeStyle = 'rgba(255, 215, 90, 0.65)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 44);
            ctx.bezierCurveTo(80, i * 44 + 25, 170, i * 44 - 20, 256, i * 44 + 10);
            ctx.stroke();
        }
        metalness = 0.88; roughness = 0.18; emissive = 0xff3b00; emissiveIntensity = 0.45;
    } else if (camoId === 'cyber') {
        ctx.fillStyle = '#091122';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 3;
        for (let i = 0; i < 256; i += 32) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
        }
        ctx.strokeStyle = '#ff00cc';
        ctx.lineWidth = 2;
        ctx.strokeRect(24, 24, 208, 208);
        metalness = 0.78; roughness = 0.22; emissive = 0x00aaff; emissiveIntensity = 0.35;
    } else if (camoId === 'crimson') {
        ctx.fillStyle = '#1b0709';
        ctx.fillRect(0, 0, 256, 256);
        for (let y = 0; y < 256; y += 16) {
            for (let x = 0; x < 256; x += 16) {
                ctx.fillStyle = ((x + y) / 16) % 2 === 0 ? '#5c0c14' : '#26080b';
                ctx.fillRect(x, y, 15, 15);
            }
        }
        ctx.fillStyle = '#ff2840';
        ctx.fillRect(0, 118, 256, 18);
        metalness = 0.72; roughness = 0.26; emissive = 0x660010; emissiveIntensity = 0.28;
    } else if (camoId === 'emerald') {
        ctx.fillStyle = '#071f14';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = '#20f08b';
        ctx.lineWidth = 3;
        for (let i = -256; i < 512; i += 28) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke();
        }
        metalness = 0.75; roughness = 0.25; emissive = 0x0a6638; emissiveIntensity = 0.3;
    } else if (camoId === 'royal') {
        const g = ctx.createLinearGradient(0, 0, 256, 256);
        g.addColorStop(0, '#ffe484'); g.addColorStop(0.5, '#b8860b'); g.addColorStop(1, '#fff2b0');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
        metalness = 0.95; roughness = 0.14; emissive = 0x442a00; emissiveIntensity = 0.18;
    } else if (camoId === 'void') {
        ctx.fillStyle = '#090414';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 45; i++) {
            ctx.fillStyle = i % 2 ? 'rgba(130, 50, 255, 0.45)' : 'rgba(200, 120, 255, 0.25)';
            ctx.beginPath();
            ctx.arc(Math.random() * 256, Math.random() * 256, rand(4, 22), 0, Math.PI * 2);
            ctx.fill();
        }
        metalness = 0.82; roughness = 0.2; emissive = 0x5511cc; emissiveIntensity = 0.4;
    } else {
        ctx.fillStyle = '#242b36';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#1b212a';
        for (let y = 0; y < 256; y += 32) ctx.fillRect(0, y, 256, 10);
        metalness = 0.6; roughness = 0.38;
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);

    const mat = new THREE.MeshStandardMaterial({
        map: tex,
        metalness,
        roughness,
        emissive,
        emissiveIntensity
    });
    _camoMatCache[camoId] = mat;
    return mat;
}

/* ===================== 3D WEAPON BUILDER (WITH MUZZLE ANCHOR) ===================== */
function buildWeaponMesh(kind, camo = 'default') {
    const g = new THREE.Group();
    const bodyMat = getCamoMaterial(camo);
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x15181f, metalness: 0.75, roughness: 0.35 });
    const accentColor = camo === 'dragon' ? 0xff6a00 : (camo === 'cyber' ? 0x00e5ff : (camo === 'void' ? 0xaa44ff : 0xff2e44));
    const glowMat = new THREE.MeshBasicMaterial({ color: accentColor });

    const muzzle = new THREE.Object3D();
    g.userData.muzzle = muzzle;

    if (kind === 'knife') {
        // Rebuilt Tactical Combat Knife — clean ergonomic first-person orientation
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.16, 10), darkMat);
        handle.rotation.x = Math.PI * 0.42;
        handle.position.set(0, -0.02, 0.08);
        g.add(handle);

        // Pommel
        const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), bodyMat);
        pommel.position.set(0, -0.04, 0.16);
        g.add(pommel);

        // Crossguard
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.022, 0.024), bodyMat);
        guard.position.set(0, 0.005, 0.0);
        g.add(guard);

        // Beveled Steel Blade
        const bladeMat = camo === 'default'
            ? new THREE.MeshStandardMaterial({ color: 0xd8e2ee, metalness: 0.92, roughness: 0.16 })
            : bodyMat;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.048, 0.24), bladeMat);
        blade.position.set(0, 0.022, -0.12);
        g.add(blade);

        // Tapered Spear Tip
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.08, 4), bladeMat);
        tip.rotation.x = -Math.PI / 2;
        tip.rotation.y = Math.PI / 4;
        tip.scale.set(0.32, 1, 0.92);
        tip.position.set(0, 0.022, -0.28);
        g.add(tip);

        // Glowing Fuller Accent
        const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.008, 0.17), glowMat);
        fuller.position.set(0, 0.028, -0.11);
        g.add(fuller);

        muzzle.position.set(0, 0.02, -0.32);
        g.add(muzzle);
        return g;
    }

    if (kind === 'katana') {
        // Forged Redliner Katana
        const tsuka = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.28, 8), darkMat);
        tsuka.rotation.x = Math.PI / 2;
        tsuka.position.set(0, 0, 0.14);
        g.add(tsuka);

        const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.014, 8), new THREE.MeshStandardMaterial({ color: 0xffc44d, metalness: 0.9, roughness: 0.2 }));
        tsuba.rotation.x = Math.PI / 2;
        tsuba.position.set(0, 0, 0);
        g.add(tsuba);

        const bladeMat = camo === 'default'
            ? new THREE.MeshStandardMaterial({ color: 0xe6eef8, metalness: 0.94, roughness: 0.12 })
            : bodyMat;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.044, 0.92), bladeMat);
        blade.position.set(0, 0.012, -0.46);
        g.add(blade);

        const edgeGlow = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.01, 0.9), glowMat);
        edgeGlow.position.set(0, -0.006, -0.46);
        g.add(edgeGlow);

        muzzle.position.set(0, 0.01, -0.95);
        g.add(muzzle);
        return g;
    }

    // Firearms (Rifle, SMG, Shotgun, AK47, Sniper, Kar98, LMG, Rocket)
    const isSniper = kind === 'sniper' || kind === 'kar98';
    const isRocket = kind === 'rocket';
    const isLmg = kind === 'lmg';
    const isSmg = kind === 'smg';

    const bodyLen = isSniper ? 0.56 : (isRocket ? 0.78 : (isSmg ? 0.34 : 0.46));
    const barrelLen = isSniper ? 0.55 : (isRocket ? 0.22 : (isSmg ? 0.20 : 0.36));

    const receiver = new THREE.Mesh(
        new THREE.BoxGeometry(isRocket ? 0.13 : 0.085, isRocket ? 0.13 : 0.11, bodyLen),
        bodyMat
    );
    g.add(receiver);

    // Barrel
    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(isRocket ? 0.068 : 0.018, isRocket ? 0.068 : 0.022, barrelLen, 10),
        darkMat
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -(bodyLen * 0.5 + barrelLen * 0.5));
    g.add(barrel);

    // Grip & Magazine
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.14, 0.07), darkMat);
    grip.position.set(0, -0.1, 0.1);
    grip.rotation.x = 0.25;
    g.add(grip);

    if (!isRocket) {
        const mag = new THREE.Mesh(new THREE.BoxGeometry(isLmg ? 0.12 : 0.05, isLmg ? 0.14 : 0.18, 0.08), darkMat);
        mag.position.set(0, -0.12, -0.04);
        mag.rotation.x = kind === 'ak47' ? -0.22 : -0.08;
        g.add(mag);
    }

    // Optic / Scope
    if (isSniper) {
        const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.026, 0.28, 12), darkMat);
        scope.rotation.x = Math.PI / 2;
        scope.position.set(0, 0.095, -0.02);
        g.add(scope);
    } else {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 0.14), darkMat);
        rail.position.set(0, 0.068, 0.02);
        g.add(rail);
    }

    // Glowing Tactical Accent Strip (Dragon / Camo Highlight)
    const strip = new THREE.Mesh(new THREE.BoxGeometry(isRocket ? 0.14 : 0.092, 0.014, bodyLen * 0.65), glowMat);
    strip.position.set(0, 0.02, -0.02);
    g.add(strip);

    // Exact Muzzle Tip Anchor
    muzzle.position.set(0, 0.02, -(bodyLen * 0.5 + barrelLen + 0.03));
    g.add(muzzle);

    return g;
}

/* ===================== INPUT MANAGER ===================== */
class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.pressed = {};
        this.dx = 0; this.dy = 0;
        this.left = false; this.right = false;
        this.leftPressed = false; this.rightPressed = false;
        this.wheel = 0;
        this.locked = false;
        this.sensitivity = SaveSystem.data.settings.sensitivity;
        this.invertY = SaveSystem.data.settings.invertY;
        this.onLockChange = null;

        addEventListener('keydown', e => {
            if (!this.keys[e.code]) this.pressed[e.code] = true;
            this.keys[e.code] = true;
        });
        addEventListener('keyup', e => { this.keys[e.code] = false; });
        addEventListener('mousemove', e => {
            if (!this.locked) return;
            this.dx += clamp(e.movementX || 0, -180, 180);
            this.dy += clamp(e.movementY || 0, -180, 180);
        });
        addEventListener('mousedown', e => {
            if (!this.locked) return;
            if (e.button === 0) { this.left = true; this.leftPressed = true; }
            if (e.button === 2) { this.right = true; this.rightPressed = true; }
        });
        addEventListener('mouseup', e => {
            if (e.button === 0) this.left = false;
            if (e.button === 2) this.right = false;
        });
        addEventListener('wheel', e => {
            if (!this.locked) return;
            this.wheel += Math.sign(e.deltaY);
        });
        addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('pointerlockchange', () => {
            this.locked = document.pointerLockElement === this.canvas;
            if (!this.locked) { this.left = false; this.right = false; }
            if (this.onLockChange) this.onLockChange(this.locked);
        });
    }
    lock() {
        try {
            const p = this.canvas.requestPointerLock();
            if (p && p.catch) p.catch(() => { });
        } catch (e) { /* ignore */ }
    }
    unlock() {
        if (document.pointerLockElement) document.exitPointerLock();
    }
    consume(code) {
        const v = !!this.pressed[code];
        this.pressed[code] = false;
        return v;
    }
    endFrame() {
        this.dx = 0; this.dy = 0;
        this.leftPressed = false; this.rightPressed = false;
        this.wheel = 0;
        for (const k in this.pressed) this.pressed[k] = false;
    }
}

/* ===================== WORLD & 5 ARENAS ===================== */
class World {
    constructor(scene, mapId = 'blacksite') {
        this.scene = scene;
        this.mapId = mapId;
        this.boxes = [];
        this.meshes = [];
        this.jumpPads = [];
        this.spawnPoints = [];
        this.botSpawns = [];
        this.playerSpawn = new THREE.Vector3(0, 1.2, 22);
        this.killY = -18;
        this._build(mapId);
    }
    _addBox(x, y, z, w, h, d, mat, isCollider = true) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, y, z);
        mesh.receiveShadow = true;
        mesh.castShadow = h > 0.6;
        this.scene.add(mesh);
        if (isCollider) {
            this.meshes.push(mesh);
            this.boxes.push(new THREE.Box3(
                new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
                new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2)
            ));
        }
        return mesh;
    }
    _addJumpPad(x, y, z, boostY = 21, color = 0x00e5ff) {
        const g = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0x1a2230, metalness: 0.8, roughness: 0.3 }));
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 8, 24), new THREE.MeshBasicMaterial({ color }));
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.18;
        const holo = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.04, 8, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 }));
        holo.rotation.x = Math.PI / 2;
        holo.position.y = 0.65;
        g.add(base, ring, holo);
        g.position.set(x, y, z);
        this.scene.add(g);
        this.jumpPads.push({ pos: new THREE.Vector3(x, y, z), boostY, color, holo, phase: rand(0, 6.28) });
    }
    _build(mapId) {
        const themes = {
            blacksite: { sky: 0x0b1220, fog: 0x0b1220, floor: 0x1d2534, wall: 0x2a3447, accent: 0x00e5ff },
            foundry: { sky: 0x1a0b08, fog: 0x1a0b08, floor: 0x261c1a, wall: 0x3b2622, accent: 0xff6a24 },
            abyss: { sky: 0x070818, fog: 0x070818, floor: 0x141933, wall: 0x222952, accent: 0x9b4dff },
            void: { sky: 0x0c0614, fog: 0x0c0614, floor: 0x191224, wall: 0x2a1f3d, accent: 0xff2e88 },
            zenith: { sky: 0x101c2c, fog: 0x101c2c, floor: 0x243140, wall: 0x384b61, accent: 0x3fe08a }
        };
        const t = themes[mapId] || themes.blacksite;
        this.scene.background = new THREE.Color(t.sky);
        this.scene.fog = new THREE.FogExp2(t.fog, 0.012);

        const hemi = new THREE.HemisphereLight(0xdbe8ff, 0x1a2030, 0.85);
        this.scene.add(hemi);
        const sun = new THREE.DirectionalLight(0xffffff, 1.15);
        sun.position.set(28, 45, 22);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.camera.left = -45; sun.shadow.camera.right = 45;
        sun.shadow.camera.top = 45; sun.shadow.camera.bottom = -45;
        this.scene.add(sun);

        const floorMat = new THREE.MeshStandardMaterial({ color: t.floor, roughness: 0.78, metalness: 0.15 });
        const wallMat = new THREE.MeshStandardMaterial({ color: t.wall, roughness: 0.6, metalness: 0.25 });
        const trimMat = new THREE.MeshBasicMaterial({ color: t.accent });

        // Main Arena Floor & Perimeter Walls
        this._addBox(0, -0.5, 0, 64, 1, 64, floorMat);
        this._addBox(0, 4, -32, 64, 9, 1.5, wallMat);
        this._addBox(0, 4, 32, 64, 9, 1.5, wallMat);
        this._addBox(-32, 4, 0, 1.5, 9, 64, wallMat);
        this._addBox(32, 4, 0, 1.5, 9, 64, wallMat);

        // Central Elevated Platform + Stepped Ramps
        this._addBox(0, 1.5, 0, 12, 3, 12, wallMat);
        this._addBox(0, 3.05, 0, 12.2, 0.12, 12.2, trimMat, false);
        for (let i = 0; i < 10; i++) {
            this._addBox(0, 0.15 + i * 0.3, 6.5 + i * 0.55, 4.4, 0.3, 0.6, wallMat);
            this._addBox(0, 0.15 + i * 0.3, -6.5 - i * 0.55, 4.4, 0.3, 0.6, wallMat);
        }

        // Tactical Cover Bunkers & Pillars
        const coverCoords = [
            [-14, 1.2, -14, 5, 2.4, 1.5], [14, 1.2, -14, 5, 2.4, 1.5],
            [-14, 1.2, 14, 5, 2.4, 1.5], [14, 1.2, 14, 5, 2.4, 1.5],
            [-18, 2.5, 0, 3.5, 5, 8], [18, 2.5, 0, 3.5, 5, 8],
            [0, 1.1, -20, 8, 2.2, 1.6], [0, 1.1, 20, 8, 2.2, 1.6]
        ];
        for (const [x, y, z, w, h, d] of coverCoords) this._addBox(x, y, z, w, h, d, wallMat);

        // Corner Sniper Catwalks + Jump Pads
        this._addBox(-24, 5.5, -24, 10, 0.8, 10, wallMat);
        this._addBox(24, 5.5, -24, 10, 0.8, 10, wallMat);
        this._addBox(-24, 5.5, 24, 10, 0.8, 10, wallMat);
        this._addBox(24, 5.5, 24, 10, 0.8, 10, wallMat);

        this._addJumpPad(-22, 0.1, -14, 21, t.accent);
        this._addJumpPad(22, 0.1, -14, 21, t.accent);
        this._addJumpPad(-22, 0.1, 14, 21, t.accent);
        this._addJumpPad(22, 0.1, 14, 21, t.accent);

        this.spawnPoints = [
            new THREE.Vector3(0, 3.2, 0),
            new THREE.Vector3(-12, 0.2, -18),
            new THREE.Vector3(12, 0.2, -18),
            new THREE.Vector3(-12, 0.2, 18),
            new THREE.Vector3(12, 0.2, 18)
        ];
        this.botSpawns = [
            new THREE.Vector3(-20, 0.2, -20),
            new THREE.Vector3(20, 0.2, -20),
            new THREE.Vector3(0, 0.2, -25),
            new THREE.Vector3(-25, 0.2, 0),
            new THREE.Vector3(25, 0.2, 0)
        ];
    }
    collidesBox(cx, cy, cz, hx, hy, hz) {
        const minX = cx - hx, maxX = cx + hx;
        const minY = cy - hy, maxY = cy + hy;
        const minZ = cz - hz, maxZ = cz + hz;
        for (let i = 0; i < this.boxes.length; i++) {
            const b = this.boxes[i];
            if (maxX > b.min.x && minX < b.max.x && maxY > b.min.y && minY < b.max.y && maxZ > b.min.z && minZ < b.max.z) {
                return b;
            }
        }
        return null;
    }
    groundAt(x, z) {
        const ray = new THREE.Raycaster(new THREE.Vector3(x, 30, z), new THREE.Vector3(0, -1, 0), 0, 60);
        const hits = ray.intersectObjects(this.meshes, false);
        return hits.length ? hits[0].point.y : 0;
    }
    update(dt) {
        for (const pad of this.jumpPads) {
            pad.phase += dt * 4;
            pad.holo.position.y = 0.55 + Math.sin(pad.phase) * 0.22;
            pad.holo.rotation.z += dt * 2.5;
        }
    }
}

/* ===================== ARMORY & ACCURATE RAYCASTING ===================== */
class Armory {
    constructor(game) { this.game = game; }
    _makeWeapon(kind, camo = 'default') {
        const def = WEAPON_DEFS[kind] || WEAPON_DEFS.rifle;
        return Object.assign({}, def, {
            camo,
            maxMag: def.mag,
            mag: def.mag,
            reserve: def.reserve,
            fireTimer: 0,
            reloading: false,
            reloadTimer: 0,
            reloadProgress: 0
        });
    }
    equipped() {
        const list = [];
        for (const k of SaveSystem.data.equippedLoadout) {
            if (k && WEAPON_DEFS[k]) {
                list.push(this._makeWeapon(k, SaveSystem.data.equippedCamos[k] || 'default'));
            }
        }
        if (list.length === 0) list.push(this._makeWeapon('rifle', 'default'));
        return list;
    }
    fire(player, w) {
        if (w.reloading || w.fireTimer > 0) return;
        if (!w.melee && w.mag <= 0) { audio.empty(); this.startReload(player, w); return; }

        w.fireTimer = 60 / w.rpm;
        if (!w.melee) w.mag--;

        const cam = this.game.camera;
        const origin = cam.position.clone();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
        const muzzlePos = player.getMuzzleWorldPos();

        audio.shoot(w.kind);
        player.recoilKick = w.melee ? 0.14 : (w.kind === 'shotgun' || w.kind === 'sniper' ? 0.16 : 0.06);
        player.bloomPulse = Math.min(1.5, player.bloomPulse + (w.melee ? 0.2 : 0.45));

        if (w.melee) {
            this._fireMelee(player, w, origin, forward);
            return;
        }

        // Muzzle Flash at exact barrel tip
        this.game.effects.muzzleFlash(muzzlePos, w.camo === 'dragon' ? 0xff6a00 : 0xffcc55);

        if (w.kind === 'rocket') {
            this.game.spawnRocket(muzzlePos, forward.clone().multiplyScalar(42), true, w, w.camo === 'dragon' ? 0xff4400 : 0xff9438);
            return;
        }

        const pellets = w.pellets || 1;
        const dmgMult = player.damageBoostTimer > 0 ? 1.5 : 1.0;

        // Gather ONLY live bot hitParts (never player viewmodel/collider)
        const botMeshes = [];
        for (const b of this.game.bots) {
            if (b.alive) botMeshes.push(...b.hitParts);
        }

        for (let p = 0; p < pellets; p++) {
            const dir = forward.clone();
            const isAds = this.game.input.right && (w.kind === 'sniper' || w.kind === 'kar98');
            const spread = isAds ? 0.0005 : (w.spread || 0.01);
            if (spread > 0) {
                dir.x += rand(-spread, spread);
                dir.y += rand(-spread, spread);
                dir.z += rand(-spread, spread);
                dir.normalize();
            }

            // 1. Raycast from exact camera/crosshair against world geometry
            const ray = new THREE.Raycaster(origin, dir, 0.05, 140);
            const wallHits = ray.intersectObjects(this.game.world.meshes, false);
            const wallDist = wallHits.length ? wallHits[0].distance : 140;
            let hitPoint = wallHits.length ? wallHits[0].point.clone() : origin.clone().addScaledVector(dir, 140);

            // 2. Raycast against enemy hitboxes and compare distance strictly against wallDist
            const botHits = ray.intersectObjects(botMeshes, false);
            if (botHits.length && botHits[0].distance < wallDist) {
                const bh = botHits[0];
                hitPoint = bh.point.clone();
                const bot = bh.object.userData.bot;
                const isHead = bh.object.userData.part === 'head';
                if (bot && bot.alive) {
                    const dmg = Math.round(w.damage * (isHead ? 2.0 : 1.0) * dmgMult);
                    this._damageBot(bot, dmg, isHead, w.kind);
                    this.game.effects.blood(hitPoint, isHead ? 12 : 7);
                }
            } else if (wallHits.length) {
                this.game.effects.sparks(hitPoint, wallHits[0].face ? wallHits[0].face.normal : null, 6);
            }

            // 3. Tracer originates directly from the 3D barrel muzzle to the exact raycast hitPoint
            const tracerColor = w.camo === 'dragon' ? 0xff5500 : (w.camo === 'cyber' ? 0x00e5ff : 0xffdd66);
            this.game.effects.tracer(muzzlePos, hitPoint, tracerColor);
        }
    }
    _fireMelee(player, w, origin, forward) {
        player.swingTimer = 0.28;
        player.comboStep = (player.comboStep + 1) % 3;

        if (w.kind === 'katana') {
            const isSuper = player.sliding || player.crouching;
            const slashColor = w.camo === 'dragon' ? 0xff5500 : (w.camo === 'cyber' ? 0x00e5ff : 0xff1e38);
            this.game.effects.katanaSlashArc(origin, forward, isSuper, slashColor, player.comboStep);
            if (isSuper) {
                this.game.spawnKatanaWave(origin.clone().addScaledVector(forward, 1.2), forward, slashColor);
            }
        }

        const range = w.range || 3.2;
        for (const b of this.game.bots) {
            if (!b.alive) continue;
            const toBot = b.pos.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(origin);
            const dist = toBot.length();
            if (dist <= range && toBot.normalize().dot(forward) > 0.35) {
                const dmg = Math.round(w.damage * (player.damageBoostTimer > 0 ? 1.5 : 1.0));
                this._damageBot(b, dmg, true, w.kind);
                this.game.effects.blood(b.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 14);
            }
        }
    }
    startReload(player, w) {
        if (!w || w.melee || w.reloading || w.mag >= w.maxMag) return;
        if (!this.game.infiniteAmmo() && w.reserve <= 0) return;
        w.reloading = true;
        w.reloadTimer = w.reload;
        w.reloadProgress = 0;
    }
    _damageBot(bot, dmg, head) {
        if (!bot || !bot.alive) return;
        const killed = bot.onHit(dmg);
        audio.hit(head);
        this.game.ui.showHitmarker(head);
        this.game.ui.showDamageNum(bot.pos.clone().add(new THREE.Vector3(0, 1.85, 0)), dmg, head);
        if (killed) this.game.onBotKilled(bot, head);
    }
}

/* ===================== PLAYER (FIXED MOVEMENT, SLIDING & COLLISION) ===================== */
class Player {
    constructor(game) {
        this.game = game;
        this.world = game.world;
        this.pos = new THREE.Vector3(0, 1, 22);
        this.vel = new THREE.Vector3();
        this.yaw = 0; this.pitch = 0;
        this.height = 1.75;
        this.eyeHeight = 1.6;
        this.radius = 0.42;
        this.onGround = false;
        this.alive = true;
        this.health = 100; this.maxHealth = 100;

        this.weapons = [];
        this.currentWeaponIdx = 0;
        this.viewGroup = new THREE.Group();
        this.game.camera.add(this.viewGroup);
        this.vmMeshes = [];

        this.crouching = false;
        this.sliding = false;
        this.slideTimer = 0;
        this.slideCooldown = 0;
        this.slideDir = new THREE.Vector3(0, 0, -1);

        this.medkits = 1; this.maxMedkits = 2;
        this.flashbangs = 2;
        this.recoilKick = 0;
        this.bloomPulse = 0;
        this.swingTimer = 0;
        this.comboStep = 0;
        this.parryTimer = 0;
        this.speedBoostTimer = 0;
        this.damageBoostTimer = 0;
        this.aimbotTimer = 0;
        this.sukunaTimer = 0;
        this.bobPhase = 0;
    }
    get currentWeapon() { return this.weapons[this.currentWeaponIdx] || null; }
    reset(spawnPos) {
        this.pos.copy(spawnPos || new THREE.Vector3(0, 1.2, 22));
        this.vel.set(0, 0, 0);
        this.yaw = 0; this.pitch = 0;
        this.alive = true;
        this.health = this.maxHealth;
        this.sliding = false; this.slideTimer = 0; this.crouching = false;
        this.parryTimer = 0; this.sukunaTimer = 0; this.aimbotTimer = 0;
        this.flashbangs = 2;
        this.weapons.forEach(w => { w.mag = w.maxMag; w.reloading = false; w.fireTimer = 0; });
        this.selectWeapon(0);
    }
    _buildViewModels() {
        while (this.viewGroup.children.length) this.viewGroup.remove(this.viewGroup.children[0]);
        this.vmMeshes = this.weapons.map(w => {
            const m = buildWeaponMesh(w.kind, w.camo);
            m.visible = false;
            this.viewGroup.add(m);
            return m;
        });
        this.selectWeapon(0);
    }
    selectWeapon(idx) {
        if (idx < 0 || idx >= this.weapons.length) return;
        this.currentWeaponIdx = idx;
        this.vmMeshes.forEach((m, i) => { m.visible = i === idx; });
        this.game.ui.updateWeapon(this);
    }
    getMuzzleWorldPos() {
        const vm = this.vmMeshes[this.currentWeaponIdx];
        if (vm && vm.userData.muzzle) {
            vm.updateMatrixWorld(true);
            const p = new THREE.Vector3();
            vm.userData.muzzle.getWorldPosition(p);
            return p;
        }
        return this.game.camera.position.clone().add(new THREE.Vector3(0.2, -0.15, -0.6).applyQuaternion(this.game.camera.quaternion));
    }
    activateSukuna() {
        this.sukunaTimer = 14.0;
        this.damageBoostTimer = 14.0;
        this.speedBoostTimer = 14.0;
        this.game.triggerDomainExpansion(true);
        this.game.ui.showCenterMsg('DOMAIN EXPANSION', 'MALEVOLENT SHRINE UNLEASHED', 2600);
    }
    onHit(dmg) {
        if (!this.alive) return;
        const w = this.currentWeapon;
        if (w && w.kind === 'katana' && this.parryTimer > 0) {
            this.health = Math.min(this.maxHealth, this.health + 15);
            this.game.effects.katanaParry(this.game.camera.position.clone().add(new THREE.Vector3(0, 0, -1.2).applyQuaternion(this.game.camera.quaternion)));
            audio.hit(true);
            this.game.ui.showCenterMsg('PARRY DEFLECT', '+15 HP', 900);
            return;
        }
        this.health = Math.max(0, this.health - dmg);
        if (this.health <= 0) {
            this.alive = false;
            this.game.onPlayerDied();
        }
    }
    update(dt, paused) {
        if (!this.alive || paused) return;
        const inp = this.game.input;

        // Look rotation
        const w = this.currentWeapon;
        const isScoped = w && (w.kind === 'sniper' || w.kind === 'kar98') && inp.right;
        const sens = (isScoped ? SaveSystem.data.settings.scopeSensitivity : inp.sensitivity) * 0.0022;
        this.yaw -= inp.dx * sens;
        this.pitch -= inp.dy * sens * (inp.invertY ? -1 : 1);
        this.pitch = clamp(this.pitch, -Math.PI * 0.48, Math.PI * 0.48);

        // Smooth FOV for scoping / sliding
        const targetFov = isScoped ? 28 : (this.sliding ? SaveSystem.data.settings.fov + 9 : SaveSystem.data.settings.fov);
        if (Math.abs(this.game.camera.fov - targetFov) > 0.1) {
            this.game.camera.fov = damp(this.game.camera.fov, targetFov, 14, dt);
            this.game.camera.updateProjectionMatrix();
        }

        // Timers
        this.bloomPulse = Math.max(0, this.bloomPulse - dt * 2.6);
        this.recoilKick = damp(this.recoilKick, 0, 14, dt);
        this.swingTimer = Math.max(0, this.swingTimer - dt);
        this.parryTimer = Math.max(0, this.parryTimer - dt);
        this.slideCooldown = Math.max(0, this.slideCooldown - dt);
        this.speedBoostTimer = Math.max(0, this.speedBoostTimer - dt);
        this.damageBoostTimer = Math.max(0, this.damageBoostTimer - dt);
        this.aimbotTimer = Math.max(0, this.aimbotTimer - dt);
        this.sukunaTimer = Math.max(0, this.sukunaTimer - dt);

        // Movement Input
        const fwdX = -Math.sin(this.yaw), fwdZ = -Math.cos(this.yaw);
        const rightX = Math.cos(this.yaw), rightZ = -Math.sin(this.yaw);
        let ix = 0, iz = 0;
        if (inp.keys['KeyW']) { ix += fwdX; iz += fwdZ; }
        if (inp.keys['KeyS']) { ix -= fwdX; iz -= fwdZ; }
        if (inp.keys['KeyD']) { ix += rightX; iz += rightZ; }
        if (inp.keys['KeyA']) { ix -= rightX; iz -= rightZ; }
        const inLen = Math.hypot(ix, iz);
        if (inLen > 1e-5) { ix /= inLen; iz /= inLen; } else { ix = 0; iz = 0; }

        const sprint = !!inp.keys['ShiftLeft'] && inLen > 0.1;
        const crouchKey = !!inp.keys['KeyC'] || !!inp.keys['ControlLeft'];

        // Tactical Slide (NaN-safe & teleport-proof)
        if (crouchKey && this.onGround && !this.sliding && this.slideCooldown <= 0 && Math.hypot(this.vel.x, this.vel.z) > 6.5) {
            this.sliding = true;
            this.slideTimer = 0.55;
            this.slideCooldown = 0.85;
            const vx = this.vel.x, vz = this.vel.z;
            const vl = Math.hypot(vx, vz);
            if (vl > 1e-5) this.slideDir.set(vx / vl, 0, vz / vl);
            else this.slideDir.set(fwdX, 0, fwdZ);
        }

        if (this.sliding) {
            this.slideTimer -= dt;
            const slideSpeed = 16.5 * (0.45 + 0.55 * clamp(this.slideTimer / 0.55, 0, 1));
            this.vel.x = this.slideDir.x * slideSpeed;
            this.vel.z = this.slideDir.z * slideSpeed;
            if (this.slideTimer <= 0 || !this.onGround) this.sliding = false;
        } else {
            this.crouching = crouchKey;
            const baseSpeed = this.crouching ? 5.2 : (sprint ? 12.2 : 8.8);
            const speed = baseSpeed * (this.speedBoostTimer > 0 ? 1.3 : 1.0);
            const accel = this.onGround ? 14 : 4.5;
            this.vel.x = damp(this.vel.x, ix * speed, accel, dt);
            this.vel.z = damp(this.vel.z, iz * speed, accel, dt);
        }

        // Jump
        if (inp.consume('Space') && this.onGround) {
            this.vel.y = 11.2;
            this.onGround = false;
            this.sliding = false;
        }

        // Gravity & Safe Sub-Stepped Movement (prevents tunneling/teleporting)
        this.vel.y = Math.max(-40, this.vel.y - GRAVITY * dt);
        const targetEye = (this.sliding || this.crouching) ? 1.0 : 1.6;
        this.eyeHeight = damp(this.eyeHeight, targetEye, 14, dt);

        const totalDx = this.vel.x * dt, totalDz = this.vel.z * dt;
        const maxDisp = Math.max(Math.abs(totalDx), Math.abs(totalDz));
        const steps = Math.max(1, Math.min(4, Math.ceil(maxDisp / 0.25)));
        const stepDt = dt / steps;

        this.onGround = false;
        for (let s = 0; s < steps; s++) {
            this._moveAxis('x', this.vel.x * stepDt);
            this._moveAxis('z', this.vel.z * stepDt);
            this._moveAxis('y', this.vel.y * stepDt);
        }

        // Jump Pads
        for (const pad of this.world.jumpPads) {
            if (Math.hypot(this.pos.x - pad.pos.x, this.pos.z - pad.pos.z) < 1.85 && Math.abs(this.pos.y - pad.pos.y) < 1.1 && this.vel.y <= 2.0) {
                this.vel.y = pad.boostY;
                this.onGround = false;
                this.sliding = false;
                audio.pad();
                this.game.effects.jumpPadBurst(pad.pos, pad.color);
            }
        }

        // Kill Floor Safety
        if (this.pos.y < this.world.killY) {
            this.pos.copy(this.world.playerSpawn);
            this.vel.set(0, 0, 0);
        }

        // Camera Transform
        this.game.camera.position.set(this.pos.x, this.pos.y + this.eyeHeight, this.pos.z);
        this.game.camera.rotation.order = 'YXZ';
        this.game.camera.rotation.y = this.yaw;
        this.game.camera.rotation.x = this.pitch + this.recoilKick * 0.28;

        // Weapon Switching
        for (let i = 0; i < 5; i++) {
            if (inp.consume('Digit' + (i + 1)) && i < this.weapons.length) this.selectWeapon(i);
        }
        if (inp.wheel !== 0 && this.weapons.length > 1) {
            this.selectWeapon((this.currentWeaponIdx + inp.wheel + this.weapons.length) % this.weapons.length);
        }

        // Gear & Abilities
        if (inp.consume('KeyR') && w) this.game.armory.startReload(this, w);
        if (inp.consume('KeyE')) this.game.abilitySystem.use();
        if (inp.consume('KeyH') && this.medkits > 0 && this.health < this.maxHealth) {
            this.medkits--;
            this.health = Math.min(this.maxHealth, this.health + 55);
            audio.pickup();
            this.game.ui.updateMedkits(this.medkits, this.maxMedkits);
        }
        if (inp.consume('KeyG') && this.flashbangs > 0) {
            this.flashbangs--;
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.game.camera.quaternion);
            this.game.spawnFlashbang(this.game.camera.position.clone().addScaledVector(dir, 0.8), dir.multiplyScalar(18).add(new THREE.Vector3(0, 4, 0)));
            this.game.ui.updateFlashbangs(this.flashbangs);
        }

        // Weapon Cooldowns, Reload & Firing
        if (w) {
            w.fireTimer = Math.max(0, w.fireTimer - dt);
            if (w.reloading) {
                w.reloadTimer -= dt;
                w.reloadProgress = clamp(1 - w.reloadTimer / w.reload, 0, 1);
                if (w.reloadTimer <= 0) {
                    const need = w.maxMag - w.mag;
                    if (this.game.infiniteAmmo()) w.mag = w.maxMag;
                    else { const take = Math.min(need, w.reserve); w.mag += take; w.reserve -= take; }
                    w.reloading = false;
                }
            }
            if (w.kind === 'katana' && inp.rightPressed) this.parryTimer = 0.55;
            if (inp.locked && ((w.auto && inp.left) || (!w.auto && inp.leftPressed))) {
                this.game.armory.fire(this, w);
            }
        }

        // Viewmodel Animation
        const vm = this.vmMeshes[this.currentWeaponIdx];
        if (vm) {
            vm.visible = !isScoped;
            const hSpd = Math.hypot(this.vel.x, this.vel.z);
            if (hSpd > 0.5 && this.onGround) this.bobPhase += dt * hSpd * 1.15;
            const bx = Math.cos(this.bobPhase) * 0.012;
            const by = Math.abs(Math.sin(this.bobPhase)) * 0.014;
            const swingT = this.swingTimer > 0 ? Math.sin((this.swingTimer / 0.28) * Math.PI) : 0;

            if (w.kind === 'katana') {
                vm.position.set(0.32 - swingT * 0.45 + bx, -0.26 - by, -0.45 - swingT * 0.18);
                vm.rotation.set(this.parryTimer > 0 ? 0.4 : -swingT * 0.9, this.parryTimer > 0 ? 1.1 : -0.2 + swingT * 1.3, this.parryTimer > 0 ? 0.9 : 0.25);
            } else if (w.kind === 'knife') {
                vm.position.set(0.28 - swingT * 0.25 + bx, -0.24 - by, -0.42 - swingT * 0.24);
                vm.rotation.set(-0.15 - swingT * 0.55, 0.25 + swingT * 0.3, 0.12);
            } else {
                const adsX = inp.right ? 0.0 : 0.24;
                const adsY = inp.right ? -0.15 : -0.21;
                vm.position.set(adsX + bx, adsY - by, -0.46 + this.recoilKick * 0.55);
                vm.rotation.set(this.recoilKick * 0.45, 0, 0);
            }
        }
    }
    _moveAxis(axis, delta) {
        if (!Number.isFinite(delta) || Math.abs(delta) < 1e-6) return;
        this.pos[axis] += delta;
        const r = this.radius;
        const hh = this.height * 0.5;
        const hit = this.world.collidesBox(this.pos.x, this.pos.y + hh, this.pos.z, r, hh, r);
        if (!hit) return;

        // Smooth stair step-up (strictly bounded to prevent wall-snap teleports)
        if (axis !== 'y') {
            const stepH = hit.max.y - this.pos.y;
            if (stepH > 0.01 && stepH <= 0.42) {
                if (!this.world.collidesBox(this.pos.x, hit.max.y + hh + 0.01, this.pos.z, r, hh, r)) {
                    this.pos.y = hit.max.y + 0.005;
                    return;
                }
            }
        }

        if (axis === 'x') {
            this.pos.x = delta > 0 ? hit.min.x - r - 0.001 : hit.max.x + r + 0.001;
            this.vel.x = 0;
        } else if (axis === 'z') {
            this.pos.z = delta > 0 ? hit.min.z - r - 0.001 : hit.max.z + r + 0.001;
            this.vel.z = 0;
        } else {
            if (delta > 0) this.pos.y = hit.min.y - this.height - 0.001;
            else { this.pos.y = hit.max.y; this.onGround = true; }
            this.vel.y = 0;
        }
    }
}

/* ===================== BOT AI ===================== */
class Bot {
    constructor(game, pos, wave = 1, kind = 'grunt') {
        this.game = game;
        this.world = game.world;
        this.pos = pos.clone();
        this.vel = new THREE.Vector3();
        this.kind = kind;
        const isHeavy = kind === 'heavy';
        this.maxHealth = (isHeavy ? 150 : 85) + wave * 12;
        this.health = this.maxHealth;
        this.speed = isHeavy ? 4.4 : 6.0;
        this.alive = true;
        this.deathTimer = 0;
        this.sightTimer = 0;
        this.reaction = isHeavy ? 0.55 : 0.4;
        this.fireCooldown = rand(0.5, 1.2);
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
        this.strafeTimer = rand(1.0, 2.5);
        this.tkFreezeTimer = 0;
        this.walkPhase = 0;
        this.onGround = false;
        this._build(isHeavy);
    }
    _build(isHeavy) {
        const g = new THREE.Group();
        const scale = isHeavy ? 1.18 : 1.0;
        const bodyMat = new THREE.MeshStandardMaterial({ color: isHeavy ? 0x3b181c : 0x1d2636, roughness: 0.55, metalness: 0.4 });
        const plateMat = new THREE.MeshStandardMaterial({ color: isHeavy ? 0x5c2228 : 0x2f3c52, roughness: 0.4, metalness: 0.6 });
        const headMat = new THREE.MeshStandardMaterial({ color: 0x222a38, roughness: 0.45, metalness: 0.5 });
        const visorMat = new THREE.MeshBasicMaterial({ color: isHeavy ? 0xff3b3b : 0xffaa00 });

        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.32), bodyMat);
        chest.position.y = 1.05; chest.userData = { bot: this, part: 'body' }; g.add(chest);
        const armorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.36), plateMat);
        armorPlate.position.set(0, 1.12, 0); armorPlate.userData = { bot: this, part: 'body' }; g.add(armorPlate);
        const chestCore = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.05), visorMat);
        chestCore.position.set(0, 1.15, 0.175); g.add(chestCore);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), headMat);
        head.position.y = 1.64; head.userData = { bot: this, part: 'head' }; g.add(head);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.05), visorMat);
        visor.position.set(0, 1.63, 0.185); g.add(visor);

        const legL = new THREE.Group(); legL.position.set(-0.16, 0.70, 0);
        const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.70, 0.22), bodyMat);
        legLMesh.position.y = -0.35; legLMesh.userData = { bot: this, part: 'limb' }; legL.add(legLMesh); g.add(legL);

        const legR = new THREE.Group(); legR.position.set(0.16, 0.70, 0);
        const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.70, 0.22), bodyMat);
        legRMesh.position.y = -0.35; legRMesh.userData = { bot: this, part: 'limb' }; legR.add(legRMesh); g.add(legR);

        const armL = new THREE.Group(); armL.position.set(-0.39, 1.32, 0);
        const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.54, 0.18), bodyMat);
        armLMesh.position.y = -0.28; armLMesh.userData = { bot: this, part: 'limb' }; armL.add(armLMesh); g.add(armL);

        const armR = new THREE.Group(); armR.position.set(0.39, 1.32, 0);
        const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.54, 0.18), bodyMat);
        armRMesh.position.y = -0.28; armRMesh.userData = { bot: this, part: 'limb' }; armR.add(armRMesh); g.add(armR);

        const gun = buildWeaponMesh(isHeavy ? 'lmg' : 'rifle', isHeavy ? 'crimson' : 'default');
        gun.scale.setScalar(0.62);
        gun.position.set(-0.26, 1.08, 0.32);
        gun.rotation.y = Math.PI;
        g.add(gun);

        g.scale.setScalar(scale);
        this.group = g;
        this.legs = [legL, legR];
        this.arms = [armL, armR];
        this.hitParts = [chest, armorPlate, head, legLMesh, legRMesh, armLMesh, armRMesh];
        this.game.scene.add(g);

        const hbCanvas = document.createElement('canvas'); hbCanvas.width = 128; hbCanvas.height = 16;
        this.hbCtx = hbCanvas.getContext('2d');
        this.hbTex = new THREE.CanvasTexture(hbCanvas);
        this.hbSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.hbTex, transparent: true }));
        this.hbSprite.position.set(0, 2.15, 0); this.hbSprite.scale.set(1.2, 0.16, 1);
        g.add(this.hbSprite);
        this._updateHealthbar();
    }
    _updateHealthbar() {
        if (!this.hbCtx) return;
        const pct = clamp(this.health / this.maxHealth, 0, 1);
        this.hbCtx.clearRect(0, 0, 128, 16);
        this.hbCtx.fillStyle = 'rgba(0,0,0,0.75)';
        this.hbCtx.fillRect(0, 2, 128, 12);
        this.hbCtx.fillStyle = pct > 0.5 ? '#3fe08a' : (pct > 0.25 ? '#ffaa00' : '#ff3b3b');
        this.hbCtx.fillRect(2, 4, Math.round(124 * pct), 8);
        this.hbTex.needsUpdate = true;
    }
    update(dt, player) {
        if (this.tkFreezeTimer > 0) {
            this.tkFreezeTimer -= dt;
            this.group.position.copy(this.pos);
            this.group.rotation.x = Math.sin(performance.now() * 0.02) * 0.15;
            return;
        }
        if (!this.alive) {
            this.deathTimer += dt;
            this.group.rotation.x = damp(this.group.rotation.x, Math.PI * 0.5, 8, dt);
            this.group.position.y = damp(this.group.position.y, this.pos.y + 0.22, 6, dt);
            return;
        }
        const toP = _v1.copy(player.pos).sub(this.pos);
        const dist = Math.hypot(toP.x, toP.z);
        if (dist > 0.01) {
            const ty = Math.atan2(toP.x, toP.z);
            this.group.rotation.y = lerp(this.group.rotation.y, ty, 1 - Math.exp(-9 * dt));
        }
        const sees = player.alive && this._canSee(player);
        this.sightTimer = sees ? this.sightTimer + dt : 0;
        this.strafeTimer -= dt;
        if (this.strafeTimer <= 0) { this.strafeDir *= -1; this.strafeTimer = rand(1.1, 2.6); }

        let mx = 0, mz = 0;
        if (dist > 0.01) {
            const fx = toP.x / dist, fz = toP.z / dist, sx = -fz * this.strafeDir, sz = fx * this.strafeDir;
            if (!sees || dist > 11) { mx += fx; mz += fz; } else if (dist < 6) { mx -= fx * 0.6; mz -= fz * 0.6; }
            if (sees) { mx += sx * 0.75; mz += sz * 0.75; }
        }
        const ml = Math.hypot(mx, mz);
        if (ml > 0.001) { mx /= ml; mz /= ml; }

        this.vel.x = damp(this.vel.x, mx * this.speed, 9, dt);
        this.vel.z = damp(this.vel.z, mz * this.speed, 9, dt);
        this.vel.y -= GRAVITY * dt;
        this.onGround = false;
        this._moveAxis('x', this.vel.x * dt);
        this._moveAxis('z', this.vel.z * dt);
        this._moveAxis('y', this.vel.y * dt);

        const hSpd = Math.hypot(this.vel.x, this.vel.z);
        if (hSpd > 0.5 && this.onGround) {
            this.walkPhase += dt * hSpd * 2.2;
            const sw = Math.sin(this.walkPhase) * 0.55;
            this.legs[0].rotation.x = sw; this.legs[1].rotation.x = -sw;
            this.arms[0].rotation.x = -sw * 0.4; this.arms[1].rotation.x = sw * 0.4;
        }

        this.group.position.copy(this.pos);
        this.fireCooldown -= dt;
        if (sees && this.sightTimer > this.reaction && this.fireCooldown <= 0 && !this.game.isTraining()) {
            this.fireCooldown = this.kind === 'heavy' ? rand(0.55, 0.95) : rand(0.75, 1.35);
            this._shoot(player);
        }
    }
    _moveAxis(axis, delta) {
        if (Math.abs(delta) < 1e-6) return;
        this.pos[axis] += delta;
        const r = 0.42, hh = 0.9;
        const hit = this.world.collidesBox(this.pos.x, this.pos.y + hh, this.pos.z, r, hh, r);
        if (!hit) return;
        if (axis !== 'y') {
            const stepH = hit.max.y - this.pos.y;
            if (stepH > 0 && stepH <= 0.36 && !this.world.collidesBox(this.pos.x, hit.max.y + hh, this.pos.z, r, hh, r)) {
                this.pos.y = hit.max.y; return;
            }
        }
        if (axis === 'x') { this.pos.x = delta > 0 ? hit.min.x - r : hit.max.x + r; this.vel.x = 0; }
        else if (axis === 'z') { this.pos.z = delta > 0 ? hit.min.z - r : hit.max.z + r; this.vel.z = 0; }
        else { if (delta > 0) this.pos.y = hit.min.y - 1.8; else { this.pos.y = hit.max.y; this.onGround = true; } this.vel.y = 0; }
    }
    _canSee(player) {
        const from = _v1.set(this.pos.x, this.pos.y + 1.45, this.pos.z);
        const to = _v2.set(player.pos.x, player.pos.y + 1.1, player.pos.z);
        const dir = to.sub(from); const d = dir.length(); if (d > 48) return false; dir.multiplyScalar(1 / d);
        return new THREE.Raycaster(from, dir, 0, d).intersectObjects(this.world.meshes, false).length === 0;
    }
    _shoot(player) {
        const origin = new THREE.Vector3(this.pos.x, this.pos.y + 1.38, this.pos.z);
        const aim = new THREE.Vector3(player.pos.x, player.pos.y + 1.1, player.pos.z);
        const dir = aim.sub(origin).normalize();
        dir.x += rand(-0.055, 0.055); dir.y += rand(-0.045, 0.045); dir.z += rand(-0.055, 0.055); dir.normalize();
        const ray = new THREE.Raycaster(origin, dir, 0, 50);
        const hits = ray.intersectObjects(this.world.meshes, false);
        const wallD = hits.length ? hits[0].distance : 50;
        const pBox = new THREE.Box3(
            new THREE.Vector3(player.pos.x - 0.42, player.pos.y, player.pos.z - 0.42),
            new THREE.Vector3(player.pos.x + 0.42, player.pos.y + player.height, player.pos.z + 0.42)
        );
        const hitP = new THREE.Vector3();
        const end = origin.clone().addScaledVector(dir, wallD);
        if (ray.ray.intersectBox(pBox, hitP) && hitP.distanceTo(origin) < wallD) {
            end.copy(hitP);
            player.onHit(this.kind === 'heavy' ? 14 : 9);
        }
        this.game.effects.tracer(origin, end, 0xff5533);
        audio.shoot(this.kind === 'heavy' ? 'shotgun' : 'rifle');
    }
    onHit(dmg) {
        if (!this.alive) return false;
        this.health -= dmg;
        this._updateHealthbar();
        if (this.health <= 0) {
            this.health = 0; this.alive = false;
            if (this.hbSprite) this.hbSprite.visible = false;
            return true;
        }
        return false;
    }
    dispose() { this.game.scene.remove(this.group); }
}

/* ===================== EFFECTS (TRACERS, MUZZLE FLASH, KATANA & SUKUNA VFX) ===================== */
class Effects {
    constructor(scene) { this.scene = scene; this.items = []; }
    muzzleFlash(pos, color = 0xffcc55) {
        const light = new THREE.PointLight(color, 10, 6, 2);
        light.position.copy(pos);
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }));
        star.position.copy(pos);
        this.scene.add(light, star);
        this.items.push({
            obj: star, life: 0.055, max: 0.055,
            tick: (it) => {
                const t = it.life / it.max;
                star.scale.setScalar(0.6 + t * 1.1);
                light.intensity = 10 * t;
                if (it.life <= 0.01) this.scene.remove(light);
            }
        });
    }
    tracer(from, to, color = 0xffdd44) {
        const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
        const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 });
        const line = new THREE.Line(geo, mat);
        this.scene.add(line);
        this.items.push({ obj: line, life: 0.085, max: 0.085, tick: it => { mat.opacity = it.life / it.max; } });
    }
    katanaSlashArc(origin, dir, isSuper = false, color = 0xff1e38, variant = 0) {
        const g = new THREE.Group();
        const radius = isSuper ? 2.5 : 1.75;
        const tube = isSuper ? 0.13 : 0.075;
        const arcLen = isSuper ? Math.PI * 1.15 : Math.PI * 0.82;
        const outerMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.98, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
        g.add(new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 28, arcLen), outerMat));
        g.add(new THREE.Mesh(new THREE.TorusGeometry(radius + 0.03, tube * 0.35, 6, 28, arcLen), coreMat));

        g.position.copy(origin).addScaledVector(dir, 0.9);
        g.lookAt(origin.clone().addScaledVector(dir, 5));
        g.rotateX(Math.PI / 2);
        g.rotateY(isSuper ? 0 : ([-0.6, 0, 0.6][variant % 3] || 0));
        g.rotateZ(-arcLen * 0.5);
        this.scene.add(g);

        const maxLife = isSuper ? 0.34 : 0.22;
        this.items.push({
            obj: g, life: maxLife, max: maxLife,
            tick: (it, dt) => {
                const t = 1 - it.life / it.max;
                g.position.addScaledVector(dir, dt * (isSuper ? 14 : 7));
                g.scale.setScalar(1 + t * 0.45);
                outerMat.opacity = (1 - t) * 0.92;
                coreMat.opacity = (1 - t) * 0.98;
            }
        });
    }
    sukunaSlash(pos) {
        const g = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color: 0xff1122, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
        const s1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.06), mat);
        const s2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.06), mat);
        s1.rotation.z = rand(-0.9, 0.9); s2.rotation.z = s1.rotation.z + Math.PI * 0.5;
        g.add(s1, s2);
        g.position.copy(pos);
        g.rotation.y = rand(0, Math.PI);
        this.scene.add(g);
        this.items.push({
            obj: g, life: 0.26, max: 0.26,
            tick: (it) => {
                const t = 1 - it.life / it.max;
                g.scale.setScalar(0.8 + t * 1.1);
                mat.opacity = 1 - t;
            }
        });
    }
    katanaParry(pos) {
        const mat = new THREE.MeshBasicMaterial({ color: 0x40d0ff, transparent: true, opacity: 0.95, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
        const mesh = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.45, 24), mat);
        mesh.position.copy(pos);
        this.scene.add(mesh);
        this.items.push({
            obj: mesh, life: 0.35, max: 0.35,
            tick: (it, dt) => { const t = 1 - it.life / it.max; mesh.scale.setScalar(1 + t * 5); mesh.rotation.z += dt * 8; mat.opacity = 1 - t; }
        });
        this.sparks(pos, new THREE.Vector3(0, 1, 0), 18);
    }
    jumpPadBurst(pos, color = 0x00e5ff) {
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.3, 24), mat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(pos.x, pos.y + 0.15, pos.z);
        this.scene.add(ring);
        this.items.push({
            obj: ring, life: 0.45, max: 0.45,
            tick: (it, dt) => { const t = 1 - it.life / it.max; ring.scale.setScalar(1 + t * 2.6); ring.position.y += dt * 4.5; mat.opacity = 1 - t; }
        });
    }
    sparks(pos, normal, n = 8) {
        const geom = new THREE.SphereGeometry(0.03, 5, 5);
        for (let i = 0; i < n; i++) {
            const mat = new THREE.MeshBasicMaterial({ color: Math.random() < 0.6 ? 0xffbb55 : 0x77ccff, transparent: true, opacity: 1 });
            const m = new THREE.Mesh(geom, mat); m.position.copy(pos); this.scene.add(m);
            const v = new THREE.Vector3(rand(-1, 1), rand(0.2, 1.4), rand(-1, 1)).normalize().multiplyScalar(rand(2, 7));
            if (normal) v.addScaledVector(normal, 3);
            this.items.push({ obj: m, life: rand(0.15, 0.3), max: 0.3, vel: v, tick: (it, dt) => { it.vel.y -= 16 * dt; it.obj.position.addScaledVector(it.vel, dt); mat.opacity = it.life / it.max; } });
        }
    }
    blood(pos, n = 8) {
        const geom = new THREE.SphereGeometry(0.045, 5, 5);
        for (let i = 0; i < n; i++) {
            const mat = new THREE.MeshBasicMaterial({ color: 0xcc1818, transparent: true, opacity: 1 });
            const m = new THREE.Mesh(geom, mat); m.position.copy(pos); this.scene.add(m);
            const v = new THREE.Vector3(rand(-1, 1), rand(0.2, 1.5), rand(-1, 1)).normalize().multiplyScalar(rand(1.5, 5.5));
            this.items.push({ obj: m, life: rand(0.2, 0.42), max: 0.42, vel: v, tick: (it, dt) => { it.vel.y -= 16 * dt; it.obj.position.addScaledVector(it.vel, dt); mat.opacity = it.life / it.max; } });
        }
    }
    explosion(pos, radius = 5.5) {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.9 }));
        sphere.position.copy(pos); this.scene.add(sphere);
        const light = new THREE.PointLight(0xff7722, 18, radius * 4, 2); light.position.copy(pos); this.scene.add(light);
        this.items.push({
            obj: sphere, life: 0.38, max: 0.38,
            tick: (it, dt) => {
                const t = 1 - it.life / it.max;
                sphere.scale.setScalar(0.5 + t * radius * 2);
                sphere.material.opacity = (1 - t) * 0.9;
                light.intensity = 18 * (1 - t);
                if (it.life - dt <= 0) this.scene.remove(light);
            }
        });
        this.sparks(pos, null, 20);
    }
    update(dt) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const it = this.items[i]; it.life -= dt;
            if (it.life <= 0) {
                this.scene.remove(it.obj);
                it.obj.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
                this.items.splice(i, 1);
            } else if (it.tick) it.tick(it, dt);
        }
    }
}

/* ===================== ABILITY SYSTEM (BALANCED SPAWN RATE & UPGRADED VFX) ===================== */
class AbilitySystem {
    constructor(game) {
        this.game = game;
        this.pickups = [];
        this.held = null; this.charges = 0; this.maxCharges = 0;
        this.cooldown = 0; this.cooldownMax = 0;
        this.spawnTimer = 14;
        this.defs = {
            teleport: { name: 'TELEPORT', charges: 2, cd: 10, color: 0x00ffff },
            telekinesis: { name: 'TELEKINESIS', charges: 1, cd: 14, color: 0xaa00ff },
            tracker: { name: 'OVERDRIVE', charges: 1, cd: 16, color: 0xff8800 },
            lightning: { name: 'LIGHTNING', charges: 1, cd: 18, color: 0xffff00 }
        };
    }
    reset() {
        for (const p of this.pickups) this.game.scene.remove(p.mesh);
        this.pickups = []; this.held = null; this.charges = 0; this.cooldown = 0;
        this.spawnTimer = 14;
        this.game.ui.updateAbility(null, 0, 0, 0);
    }
    update(dt) {
        this.spawnTimer -= dt;
        // Slower, balanced spawn pacing (max 2 pickups, 24-36s interval)
        if (this.spawnTimer <= 0 && this.pickups.length < 2) {
            this.spawnTimer = rand(24, 36);
            const keys = Object.keys(this.defs);
            if (Math.random() < 0.1) keys.push('sukuna');
            const pType = pick(keys);
            const sp = pick(this.game.world.spawnPoints);
            if (sp) this.spawnPickupAt([sp.x + rand(-3, 3), sp.y + 1.2, sp.z + rand(-3, 3)], pType);
        }
        this._updatePickups(dt);
        if (this.held && this.charges < this.maxCharges) {
            this.cooldown -= dt;
            if (this.cooldown <= 0) { this.charges++; this.cooldown = this.charges < this.maxCharges ? this.cooldownMax : 0; }
        }
        if (this.held) this.game.ui.updateAbility(this.defs[this.held].name, this.charges, this.maxCharges, this.cooldown / (this.cooldownMax || 1));
    }
    spawnPickupAt(pos, pType) {
        const isSukuna = pType === 'sukuna';
        const color = isSukuna ? 0xff0022 : this.defs[pType].color;
        const g = new THREE.Group();
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.5 }));
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.04, 8, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }));
        ring.rotation.x = Math.PI / 2;
        g.add(core, ring);
        g.position.set(pos[0], pos[1], pos[2]);
        this.game.scene.add(g);
        this.pickups.push({ mesh: g, core, ring, pos: new THREE.Vector3(pos[0], pos[1], pos[2]), type: pType, phase: rand(0, 6.28) });
    }
    _updatePickups(dt) {
        const p = this.game.player;
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pk = this.pickups[i];
            pk.phase += dt * 3;
            pk.core.rotation.y += dt * 2.5;
            pk.ring.rotation.z -= dt * 2.0;
            pk.mesh.position.y = pk.pos.y + Math.sin(pk.phase) * 0.22;
            if (p && p.alive && p.pos.distanceTo(pk.mesh.position) < 2.0) {
                if (pk.type === 'sukuna') {
                    p.activateSukuna();
                    audio.pickup();
                    this.game.scene.remove(pk.mesh);
                    this.pickups.splice(i, 1);
                    continue;
                }
                const def = this.defs[pk.type];
                if (def) {
                    this.held = pk.type; this.charges = def.charges; this.maxCharges = def.charges; this.cooldownMax = def.cd; this.cooldown = 0;
                    audio.pickup();
                    this.game.ui.showCenterMsg(def.name + ' ACQUIRED', '[E] TO ACTIVATE', 1500);
                    this.game.ui.updateAbility(def.name, this.charges, this.maxCharges, 0);
                }
                this.game.scene.remove(pk.mesh);
                this.pickups.splice(i, 1);
            }
        }
    }
    use() {
        if (!this.held || this.charges <= 0) { audio.empty(); return; }
        const p = this.game.player;
        if (!p || !p.alive) return;
        this.charges--;
        if (this.cooldown <= 0) this.cooldown = this.cooldownMax;

        if (this.held === 'teleport') {
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.game.camera.quaternion).normalize();
            const ray = new THREE.Raycaster(this.game.camera.position, dir, 0, 14);
            const hits = ray.intersectObjects(this.game.world.meshes, false);
            const dest = hits.length ? hits[0].point.clone().addScaledVector(dir, -1.2) : p.pos.clone().addScaledVector(dir, 14);
            dest.y = this.game.world.groundAt(dest.x, dest.z) + 0.15;
            p.pos.copy(dest); p.vel.set(0, 0, 0);
            audio.teleport();
            this.game.effects.jumpPadBurst(dest, 0x00ffff);
            this.game.effects.sparks(dest, new THREE.Vector3(0, 1, 0), 22);
        } else if (this.held === 'telekinesis') {
            audio.telekinesis();
            const origin = this.game.camera.position;
            this.game.effects.jumpPadBurst(p.pos, 0xaa00ff);
            for (const b of this.game.bots) {
                if (b.alive && b.pos.distanceTo(origin) < 16) {
                    b.tkFreezeTimer = 2.2;
                    b.vel.y = 12;
                    setTimeout(() => { if (b.alive) { b.vel.y = -32; this.game.armory._damageBot(b, 85, false); } }, 1100);
                }
            }
            this.game.ui.showCenterMsg('TELEKINESIS SLAM', 'HOSTILES CRUSHED', 1000);
        } else if (this.held === 'tracker') {
            p.damageBoostTimer = 6.0;
            p.speedBoostTimer = 6.0;
            audio.pickup();
            this.game.ui.showCenterMsg('OVERDRIVE ACTIVE', '1.5x DAMAGE & SPEED (6s)', 1200);
        } else if (this.held === 'lightning') {
            audio.shoot('lightning');
            const cam = this.game.camera;
            const origin = cam.position.clone();
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
            const hits = new THREE.Raycaster(origin, dir, 0, 80).intersectObjects(this.game.world.meshes, false);
            const strikePos = hits.length ? hits[0].point : origin.clone().addScaledVector(dir, 40);
            const skyPos = strikePos.clone().add(new THREE.Vector3(0, 32, 0));
            const mid1 = skyPos.clone().lerp(strikePos, 0.35).add(new THREE.Vector3(rand(-1.5, 1.5), 0, rand(-1.5, 1.5)));
            const mid2 = skyPos.clone().lerp(strikePos, 0.7).add(new THREE.Vector3(rand(-1.5, 1.5), 0, rand(-1.5, 1.5)));
            this.game.effects.tracer(skyPos, mid1, 0xffff44);
            this.game.effects.tracer(mid1, mid2, 0xffffff);
            this.game.effects.tracer(mid2, strikePos, 0xffff44);
            this.game.effects.explosion(strikePos, 8);
            for (const b of this.game.bots) {
                if (b.alive && b.pos.distanceTo(strikePos) < 8) this.game.armory._damageBot(b, 999, true);
            }
            this.game.ui.showCenterMsg('LIGHTNING STRIKE', 'DIRECT HIT', 1000);
        }
    }
}

/* ===================== UI CONTROLLER ===================== */
class UI {
    constructor() {
        this.el = {
            hud: document.getElementById('hud'),
            healthFill: document.getElementById('healthFill'), healthNum: document.getElementById('healthNum'),
            medkitBlock: document.getElementById('medkitBlock'), medkitCount: document.getElementById('medkitCount'),
            flashBlock: document.getElementById('flashBlock'), flashCount: document.getElementById('flashCount'),
            weaponName: document.getElementById('weaponName'), ammoMag: document.getElementById('ammoMag'), ammoRes: document.getElementById('ammoRes'),
            reloadBar: document.getElementById('reloadBar'), reloadFill: document.getElementById('reloadFill'), slotList: document.getElementById('slotList'),
            modeLabel: document.getElementById('modeLabel'), waveLabel: document.getElementById('waveLabel'), enemyLabel: document.getElementById('enemyLabel'),
            crosshair: document.getElementById('crosshair'), hitmarker: document.getElementById('hitmarker'), vignette: document.getElementById('vignette'),
            killfeed: document.getElementById('killfeed'), killSkull: document.getElementById('killSkull'), buffBar: document.getElementById('buffBar'),
            damageNums: document.getElementById('damageNums'), centerMsg: document.getElementById('centerMsg'),
            abilityIcon: document.getElementById('abilityIcon'), abilityCharges: document.getElementById('abilityCharges'), abilityCdFill: document.getElementById('abilityCdFill'),
            scopeOverlay: document.getElementById('scopeOverlay'), flashOverlay: document.getElementById('flashOverlay')
        };
    }
    setHUD(show) { this.el.hud.classList.toggle('hidden', !show); }
    updateHealth(hp, max) {
        const pct = clamp(hp / max, 0, 1);
        this.el.healthFill.style.width = (pct * 100) + '%';
        this.el.healthNum.textContent = Math.ceil(hp);
        if (pct > 0.5) { this.el.healthFill.style.background = 'linear-gradient(90deg, #3fe08a, #8effc4)'; this.el.vignette.style.opacity = 0; }
        else if (pct > 0.25) { this.el.healthFill.style.background = 'linear-gradient(90deg, #ffaa00, #ffe066)'; this.el.vignette.style.opacity = 0.25; }
        else { this.el.healthFill.style.background = 'linear-gradient(90deg, #ff3b3b, #ff8a8a)'; this.el.vignette.style.opacity = 0.65; }
    }
    updateMedkits(count, max) {
        this.el.medkitCount.textContent = `${count}/${max}`;
        this.el.medkitBlock.classList.toggle('empty', count <= 0);
    }
    updateFlashbangs(count) {
        this.el.flashCount.textContent = `${count}/2`;
        this.el.flashBlock.classList.toggle('empty', count <= 0);
    }
    updateWeapon(player) {
        const w = player.currentWeapon; if (!w) return;
        this.el.weaponName.textContent = w.name;
        if (w.melee) {
            this.el.ammoMag.textContent = w.kind === 'katana' ? 'SWD' : 'INF';
            this.el.ammoRes.textContent = w.kind === 'katana' ? '/ PARRY' : '';
            this.el.ammoMag.classList.remove('low');
        } else {
            this.el.ammoMag.textContent = w.mag;
            this.el.ammoRes.textContent = '/ ' + (player.game.infiniteAmmo() ? '∞' : w.reserve);
            this.el.ammoMag.classList.toggle('low', w.mag <= Math.ceil(w.maxMag * 0.25));
        }
        this.el.reloadBar.classList.toggle('on', w.reloading);
        this.el.reloadFill.style.width = (w.reloadProgress * 100) + '%';
        if (this.el.slotList.children.length !== player.weapons.length) {
            this.el.slotList.innerHTML = '';
            player.weapons.forEach((wp, i) => {
                const d = document.createElement('div'); d.className = 'slot';
                d.textContent = `${i + 1} · ${wp.name.split(' ')[0]}`;
                this.el.slotList.appendChild(d);
            });
        }
        Array.from(this.el.slotList.children).forEach((el, i) => el.classList.toggle('active', i === player.currentWeaponIdx));
    }
    updateCrosshair(bloom) { this.el.crosshair.style.setProperty('--bloom', (bloom * 16) + 'px'); }
    updateScope(active) { this.el.scopeOverlay.classList.toggle('active', active); }
    updateWave(mode, wave, enemies) {
        this.el.modeLabel.textContent = mode;
        this.el.waveLabel.textContent = typeof wave === 'number' ? ('WAVE ' + String(wave).padStart(2, '0')) : wave;
        this.el.enemyLabel.textContent = enemies;
    }
    updateAbility(name, charges, max, cdPct) {
        this.el.abilityIcon.textContent = name || '—';
        this.el.abilityCharges.textContent = name ? `${charges}/${max}` : '0';
        this.el.abilityCdFill.style.width = ((1 - clamp(cdPct, 0, 1)) * 100) + '%';
    }
    updateBuffs(player) {
        const list = [];
        if (player.sukunaTimer > 0) list.push(`MALEVOLENT SHRINE ${player.sukunaTimer.toFixed(1)}s`);
        if (player.speedBoostTimer > 0) list.push(`SPEED BOOST ${player.speedBoostTimer.toFixed(1)}s`);
        if (player.damageBoostTimer > 0) list.push(`DAMAGE 1.5x ${player.damageBoostTimer.toFixed(1)}s`);
        if (player.parryTimer > 0) list.push(`PARRY GUARD`);
        this.el.buffBar.innerHTML = list.map(b => `<div class="buff">${b}</div>`).join('');
    }
    showHitmarker(head) {
        const hm = this.el.hitmarker; hm.classList.remove('show', 'head'); void hm.offsetWidth;
        hm.classList.add('show'); if (head) hm.classList.add('head');
    }
    showKillSkull() {
        const sk = this.el.killSkull; sk.classList.remove('pop'); void sk.offsetWidth; sk.classList.add('pop');
    }
    addKillFeed(text, head) {
        const d = document.createElement('div'); d.className = 'kf' + (head ? ' head' : ''); d.textContent = text;
        this.el.killfeed.appendChild(d);
        setTimeout(() => d.remove(), 4000);
        while (this.el.killfeed.children.length > 5) this.el.killfeed.firstChild.remove();
    }
    showDamageNum(worldPos, dmg, head) {
        const v = worldPos.clone().project(game.camera);
        if (v.z > 1) return;
        const x = (v.x * 0.5 + 0.5) * innerWidth, y = (-v.y * 0.5 + 0.5) * innerHeight;
        const d = document.createElement('div'); d.className = 'dnum' + (head ? ' head' : ''); d.textContent = dmg;
        d.style.left = x + 'px'; d.style.top = y + 'px';
        this.el.damageNums.appendChild(d);
        setTimeout(() => d.remove(), 700);
    }
    showCenterMsg(big, small, dur = 2000) {
        this.el.centerMsg.querySelector('.big').textContent = big;
        this.el.centerMsg.querySelector('.small').textContent = small;
        this.el.centerMsg.classList.add('show');
        clearTimeout(this._msgTo);
        this._msgTo = setTimeout(() => this.el.centerMsg.classList.remove('show'), dur);
    }
    flashbang() {
        const f = this.el.flashOverlay; f.classList.remove('fade'); f.classList.add('show');
        audio.flashbang();
        setTimeout(() => { f.classList.remove('show'); f.classList.add('fade'); }, 400);
    }
}

/* ===================== MAIN GAME CONTROLLER ===================== */
class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.renderer.setSize(innerWidth, innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.22;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(SaveSystem.data.settings.fov, innerWidth / innerHeight, 0.1, 260);
        this.scene.add(this.camera);

        this.input = new Input(this.canvas);
        this.ui = new UI();
        this.armory = new Armory(this);

        this.selectedMap = 'blacksite';
        this.selectedArmoryWeapon = 'rifle';
        this.world = new World(this.scene, this.selectedMap);
        this.effects = new Effects(this.scene);
        this.abilitySystem = new AbilitySystem(this);
        this.player = new Player(this);

        this.bots = []; this.rockets = []; this.flashbangs = []; this.medkitDrops = []; this.katanaWaves = [];
        this.state = 'menu'; this.mode = 'wave'; this.paused = false;
        this.wave = 1; this.kills = 0; this.waveClearDelay = 0;
        this.domainActive = false; this.domainTimer = 0; this.domainGroup = null;

        this._bindEvents();
        this._updateMenuMeta();

        this._lastTime = performance.now();
        requestAnimationFrame(t => this._loop(t));
    }
    isTraining() { return this.mode === 'training'; }
    infiniteAmmo() { return this.isTraining(); }
    _bindEvents() {
        addEventListener('resize', () => {
            this.camera.aspect = innerWidth / innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(innerWidth, innerHeight);
        });
        this.canvas.addEventListener('click', () => {
            audio.init();
            if (this.state === 'playing' && !this.paused && !this.input.locked) this.input.lock();
        });
        this.input.onLockChange = (locked) => {
            document.getElementById('clickHint').classList.toggle('show', this.state === 'playing' && !this.paused && !locked);
        };
        addEventListener('keydown', e => {
            if (e.code === 'Escape' && this.state === 'playing') this._togglePause();
            if (e.code === 'KeyV' && this.state === 'playing' && !this.paused && this.isTraining()) this.player.activateSukuna();
        });

        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                audio.init(); audio.ui();
                const act = btn.dataset.action;
                if (act === 'wave') this._startGame('wave', this.selectedMap);
                else if (act === 'training') this._startGame('training', this.selectedMap);
                else if (act === 'weapons') this._openWeaponsMenu();
                else if (act === 'maps') this._openMaps();
                else if (act === 'settings') this._openSettings();
                else if (act === 'close-panel') document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
                else if (act === 'resume') this._togglePause(false);
                else if (act === 'restart') { document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden')); this._startGame(this.mode, this.selectedMap); }
                else if (act === 'quit') this._quitToMenu();
                else if (act === 'apply-settings') this._applySettings();
            });
        });
    }
    _openPanel(id) {
        document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    }
    _updateMenuMeta() {
        document.getElementById('menuName').textContent = SaveSystem.data.playerName;
        document.getElementById('menuPoints').textContent = SaveSystem.data.points;
        document.getElementById('menuMap').textContent = this.selectedMap.toUpperCase();
    }
    _rebuildWorld(mapId) {
        this.scene.children = [this.camera];
        this.world = new World(this.scene, mapId);
        this.effects = new Effects(this.scene);
        this.domainGroup = null;
        this.domainActive = false;
    }
    _startGame(mode, mapId) {
        this.mode = mode; this.selectedMap = mapId;
        document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
        document.getElementById('menu').classList.add('hidden');
        this.ui.setHUD(true);
        this._rebuildWorld(mapId);

        this.bots = []; this.rockets = []; this.flashbangs = []; this.medkitDrops = []; this.katanaWaves = [];
        this.abilitySystem.reset();

        this.player.world = this.world;
        this.player.weapons = this.armory.equipped();
        if (this.isTraining() && !this.player.weapons.some(w => w.kind === 'katana')) {
            this.player.weapons.push(this.armory._makeWeapon('katana', SaveSystem.data.equippedCamos.katana || 'dragon'));
        }
        this.player._buildViewModels();
        this.player.reset(this.world.playerSpawn);
        this.player.medkits = this.isTraining() ? 2 : 1;
        this.ui.updateMedkits(this.player.medkits, this.player.maxMedkits);
        this.ui.updateFlashbangs(this.player.flashbangs);

        this.state = 'playing'; this.paused = false; this.wave = 1; this.kills = 0;
        if (mode === 'wave') this._spawnWave(1);
        else {
            this.ui.updateWave('TRAINING GROUNDS', 'SANDBOX', 'UNLIMITED TARGETS');
            for (let i = 0; i < 4; i++) this._spawnBot(1);
        }
        this.input.lock();
    }
    _spawnWave(w) {
        this.wave = w;
        const count = 3 + w * 2;
        this.ui.updateWave('SOLO WAVE', w, `HOSTILES ${count}`);
        this.ui.showCenterMsg(`WAVE ${String(w).padStart(2, '0')}`, 'ELIMINATE ALL HOSTILES', 2200);
        audio.waveStart();
        for (let i = 0; i < count; i++) this._spawnBot(w);
    }
    _spawnBot(w) {
        const sp = pick(this.world.botSpawns);
        const pos = sp.clone().add(new THREE.Vector3(rand(-2.5, 2.5), 0, rand(-2.5, 2.5)));
        this.bots.push(new Bot(this, pos, w, (w >= 2 && Math.random() < 0.28) ? 'heavy' : 'grunt'));
    }
    onBotKilled(bot, head) {
        this.kills++;
        const pts = head ? 50 : 30;
        SaveSystem.data.points += pts;
        SaveSystem.save();
        this.ui.showKillSkull();
        this.ui.addKillFeed(`ELIMINATED ${bot.kind.toUpperCase()} (+${pts} CR)`, head);
        audio.kill();
        if (Math.random() < 0.35) this.spawnMedkitDrop(bot.pos.clone().add(new THREE.Vector3(0, 0.4, 0)));
    }
    onPlayerDied() {
        this.input.unlock();
        document.getElementById('overTitle').textContent = 'ELIMINATED';
        document.getElementById('overSub').textContent = `REACHED WAVE ${this.wave} · ${this.kills} KILLS`;
        document.getElementById('overStats').innerHTML = `KILLS: <b class="accent">${this.kills}</b><br>WAVE: <b class="accent">${this.wave}</b><br>CREDITS: <b class="accent">${SaveSystem.data.points}</b>`;
        this._openPanel('overPanel');
    }
    _togglePause(force) {
        this.paused = force !== undefined ? force : !this.paused;
        document.getElementById('pausePanel').classList.toggle('hidden', !this.paused);
        if (this.paused) this.input.unlock(); else this.input.lock();
    }
    _quitToMenu() {
        this.state = 'menu'; this.paused = false;
        this.input.unlock();
        document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
        this.ui.setHUD(false);
        document.getElementById('menu').classList.remove('hidden');
        this._rebuildWorld(this.selectedMap);
        this._updateMenuMeta();
    }
    spawnKatanaWave(pos, dir, color = 0xff1e38) {
        const g = new THREE.Group();
        const arcMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
        const mesh = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.11, 8, 24, Math.PI * 0.85), arcMat);
        mesh.rotation.z = -Math.PI * 0.425;
        g.add(mesh);
        g.position.copy(pos);
        g.lookAt(pos.clone().add(dir));
        this.scene.add(g);
        this.katanaWaves.push({ mesh: g, mat: arcMat, dir: dir.clone().normalize(), speed: 34, life: 0.65, hitSet: new Set() });
    }
    spawnRocket(pos, vel, fromPlayer, w, color = 0xff9438) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 8), new THREE.MeshStandardMaterial({ color: 0x222830, metalness: 0.8 }));
        body.rotation.x = Math.PI / 2;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 8), new THREE.MeshBasicMaterial({ color }));
        tip.rotation.x = Math.PI / 2; tip.position.z = -0.26;
        g.add(body, tip); g.position.copy(pos); g.lookAt(pos.clone().add(vel));
        this.scene.add(g);
        this.rockets.push({ mesh: g, vel, w, life: 4.0 });
    }
    spawnFlashbang(pos, vel) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 10), new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8 }));
        mesh.position.copy(pos); this.scene.add(mesh);
        this.flashbangs.push({ mesh, vel, timer: 1.5 });
    }
    spawnMedkitDrop(pos) {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.45), new THREE.MeshStandardMaterial({ color: 0x103824, emissive: 0x3fe08a, emissiveIntensity: 1.2 })));
        g.position.copy(pos); this.scene.add(g);
        this.medkitDrops.push({ mesh: g, pos: pos.clone(), life: 25 });
    }
    triggerDomainExpansion() {
        this.domainActive = true; this.domainTimer = 14;
        audio.domain();
        if (!this.domainGroup) {
            const g = new THREE.Group();
            const dome = new THREE.Mesh(new THREE.SphereGeometry(32, 24, 16), new THREE.MeshBasicMaterial({ color: 0x3a0006, side: THREE.BackSide, transparent: true, opacity: 0.62 }));
            const wire = new THREE.Mesh(new THREE.SphereGeometry(31.5, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff1122, wireframe: true, transparent: true, opacity: 0.25 }));
            const light = new THREE.PointLight(0xff1122, 12, 45);
            light.position.set(0, 12, 0);
            g.add(dome, wire, light);
            this.scene.add(g);
            this.domainGroup = g;
        }
    }
    endDomain() {
        this.domainActive = false;
        if (this.domainGroup) { this.scene.remove(this.domainGroup); this.domainGroup = null; }
    }

    /* ================= DEDICATED WEAPONS & CAMO MENU ================= */
    _openWeaponsMenu() {
        this._openPanel('weaponsPanel');
        document.getElementById('armoryBalance').textContent = SaveSystem.data.points;

        const listEl = document.getElementById('weaponList');
        listEl.innerHTML = '';
        for (const [k, def] of Object.entries(WEAPON_DEFS)) {
            const owned = SaveSystem.data.unlockedWeapons.includes(k);
            const item = document.createElement('div');
            item.className = 'wp-item' + (this.selectedArmoryWeapon === k ? ' selected' : '');
            item.innerHTML = `<b>${def.name}</b><span class="tag ${owned ? 'owned' : 'locked'}">${owned ? 'OWNED' : def.price + ' CR'}</span>`;
            item.onclick = () => { this.selectedArmoryWeapon = k; this._openWeaponsMenu(); };
            listEl.appendChild(item);
        }

        const k = this.selectedArmoryWeapon;
        const def = WEAPON_DEFS[k];
        const owned = SaveSystem.data.unlockedWeapons.includes(k);
        const detailEl = document.getElementById('weaponDetail');
        detailEl.innerHTML = `
            <div class="wd-top">
                <h3>${def.name}</h3>
                <span class="accent" style="font-weight:800;">${owned ? 'UNLOCKED' : def.price + ' CREDITS'}</span>
            </div>
            <div class="wd-stats">
                <div class="stat-box"><span>DAMAGE</span><b>${def.damage}${def.pellets ? 'x' + def.pellets : ''}</b></div>
                <div class="stat-box"><span>FIRE RATE</span><b>${def.rpm} RPM</b></div>
                <div class="stat-box"><span>MAGAZINE</span><b>${def.melee ? 'MELEE' : def.mag}</b></div>
            </div>
            <div class="wd-actions" id="wdActions"></div>
        `;
        const actEl = detailEl.querySelector('#wdActions');
        if (!owned) {
            const buyBtn = document.createElement('button');
            buyBtn.className = 'btn primary';
            buyBtn.textContent = `UNLOCK (${def.price} CR)`;
            buyBtn.disabled = SaveSystem.data.points < def.price;
            buyBtn.onclick = () => {
                SaveSystem.data.points -= def.price;
                SaveSystem.data.unlockedWeapons.push(k);
                SaveSystem.data.unlockedCamos.push(k + ':default');
                SaveSystem.data.equippedCamos[k] = 'default';
                SaveSystem.save(); audio.pickup(); this._updateMenuMeta(); this._openWeaponsMenu();
            };
            actEl.appendChild(buyBtn);
        } else {
            for (let s = 0; s < 5; s++) {
                const eqBtn = document.createElement('button');
                const isHere = SaveSystem.data.equippedLoadout[s] === k;
                eqBtn.className = 'btn' + (isHere ? ' primary' : '');
                eqBtn.textContent = isHere ? `IN SLOT ${s + 1}` : `EQUIP SLOT ${s + 1}`;
                eqBtn.onclick = () => {
                    SaveSystem.data.equippedLoadout[s] = k;
                    SaveSystem.save(); audio.ui(); this._openWeaponsMenu();
                };
                actEl.appendChild(eqBtn);
            }
        }

        const camoGrid = document.getElementById('camoGrid');
        camoGrid.innerHTML = '';
        const curCamo = SaveSystem.data.equippedCamos[k] || 'default';
        for (const [ck, cname] of Object.entries(CAMO_NAMES)) {
            const key = k + ':' + ck;
            const cOwned = ck === 'default' || SaveSystem.data.unlockedCamos.includes(key);
            const price = CAMO_PRICES[ck];
            const card = document.createElement('div');
            card.className = 'camo-card' + (curCamo === ck && owned ? ' equipped' : '') + (ck === 'dragon' ? ' dragon' : '');
            card.innerHTML = `
                <div class="camo-swatch" style="background:${CAMO_SWATCHES[ck]}"></div>
                <div class="camo-name">${cname}</div>
                <div class="camo-sub">${cOwned ? (curCamo === ck ? 'EQUIPPED' : 'CLICK TO EQUIP') : price + ' CR'}</div>
            `;
            card.onclick = () => {
                if (!owned) return;
                if (cOwned) {
                    SaveSystem.data.equippedCamos[k] = ck;
                    SaveSystem.save(); audio.ui(); this._openWeaponsMenu();
                } else if (SaveSystem.data.points >= price) {
                    SaveSystem.data.points -= price;
                    SaveSystem.data.unlockedCamos.push(key);
                    SaveSystem.data.equippedCamos[k] = ck;
                    SaveSystem.save(); audio.pickup(); this._updateMenuMeta(); this._openWeaponsMenu();
                }
            };
            camoGrid.appendChild(card);
        }

        const slotsBar = document.getElementById('loadoutSlots');
        slotsBar.innerHTML = SaveSystem.data.equippedLoadout.map((wk, i) =>
            `<div class="slot-chip">${i + 1}: ${wk && WEAPON_DEFS[wk] ? WEAPON_DEFS[wk].name : 'EMPTY'}</div>`
        ).join('');
    }
    _openMaps() {
        this._openPanel('mapPanel');
        const grid = document.getElementById('mapGrid'); grid.innerHTML = '';
        const maps = [
            { id: 'blacksite', name: 'BLACKSITE CITADEL', desc: 'Multi-tier tactical fortress with central overlook & 4 corner jump pads.' },
            { id: 'foundry', name: 'SMELTERY FOUNDRY', desc: 'Industrial magma facility with elevated decks & thermal jump pads.' },
            { id: 'abyss', name: 'NEON ABYSS', desc: 'High-contrast cyber sector with purple hard-light energy accents.' },
            { id: 'void', name: 'ASTRAL VOID', desc: 'Obsidian arena bathed in crimson-violet void lighting.' },
            { id: 'zenith', name: 'ZENITH HELIPORT', desc: 'High-altitude rooftop tactical compound with emerald trim.' }
        ];
        for (const m of maps) {
            const card = document.createElement('div');
            card.className = 'shopCard' + (this.selectedMap === m.id ? ' owned' : '');
            card.innerHTML = `<h3>${m.name}</h3><p>${m.desc}</p><button class="btn ${this.selectedMap === m.id ? 'primary' : ''}">${this.selectedMap === m.id ? 'SELECTED' : 'SELECT'}</button>`;
            card.querySelector('button').onclick = () => {
                this.selectedMap = m.id; this._updateMenuMeta(); this._rebuildWorld(m.id); this._openMaps();
            };
            grid.appendChild(card);
        }
    }
    _openSettings() {
        this._openPanel('settingsPanel');
        const s = SaveSystem.data.settings;
        document.getElementById('setName').value = SaveSystem.data.playerName;
        document.getElementById('setSens').value = s.sensitivity; document.getElementById('setSensVal').textContent = s.sensitivity.toFixed(1);
        document.getElementById('setScopeSens').value = s.scopeSensitivity; document.getElementById('setScopeSensVal').textContent = s.scopeSensitivity.toFixed(1);
        document.getElementById('setFov').value = s.fov; document.getElementById('setFovVal').textContent = s.fov;
        document.getElementById('setVol').value = Math.round(s.volume * 100); document.getElementById('setVolVal').textContent = Math.round(s.volume * 100) + '%';
        document.getElementById('setUiColor').value = s.uiColor;
        document.getElementById('setInvert').checked = s.invertY;
        for (const [id, vid, fmt] of [['setSens', 'setSensVal', v => parseFloat(v).toFixed(1)], ['setScopeSens', 'setScopeSensVal', v => parseFloat(v).toFixed(1)], ['setFov', 'setFovVal', v => v], ['setVol', 'setVolVal', v => v + '%']]) {
            document.getElementById(id).oninput = e => document.getElementById(vid).textContent = fmt(e.target.value);
        }
    }
    _applySettings() {
        const s = SaveSystem.data.settings;
        SaveSystem.data.playerName = document.getElementById('setName').value.trim().toUpperCase().slice(0, 14) || 'OPERATOR';
        s.sensitivity = parseFloat(document.getElementById('setSens').value);
        s.scopeSensitivity = parseFloat(document.getElementById('setScopeSens').value);
        s.fov = parseInt(document.getElementById('setFov').value);
        s.volume = parseInt(document.getElementById('setVol').value) / 100;
        s.uiColor = document.getElementById('setUiColor').value;
        s.invertY = document.getElementById('setInvert').checked;
        SaveSystem.save(); SaveSystem.applyTheme();
        this.input.sensitivity = s.sensitivity; this.input.invertY = s.invertY;
        audio.volume = s.volume;
        this.camera.fov = s.fov; this.camera.updateProjectionMatrix();
        this._updateMenuMeta();
        document.getElementById('settingsPanel').classList.add('hidden');
    }
    _loop(now) {
        requestAnimationFrame(t => this._loop(t));
        const dt = Math.min((now - this._lastTime) / 1000, 0.05);
        this._lastTime = now;

        this.world.update(dt);
        this.effects.update(dt);

        if (this.state === 'menu') {
            const t = now * 0.00035;
            this.camera.position.set(Math.sin(t) * 20, 10 + Math.sin(t * 1.5) * 1.5, Math.cos(t) * 20);
            this.camera.lookAt(0, 2, 0);
            this.renderer.render(this.scene, this.camera);
            this.input.endFrame();
            return;
        }

        this.player.update(dt, this.paused);
        this.abilitySystem.update(dt);

        // Katana Waves
        for (let i = this.katanaWaves.length - 1; i >= 0; i--) {
            const kw = this.katanaWaves[i]; kw.life -= dt;
            kw.mesh.position.addScaledVector(kw.dir, kw.speed * dt);
            kw.mesh.scale.addScalar(dt * 1.8);
            kw.mat.opacity = clamp(kw.life / 0.65, 0, 1);
            for (const b of this.bots) {
                if (b.alive && !kw.hitSet.has(b) && b.pos.distanceTo(kw.mesh.position) < 2.4) {
                    kw.hitSet.add(b);
                    this.armory._damageBot(b, 115, true);
                    this.effects.blood(b.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 14);
                }
            }
            if (kw.life <= 0) { this.scene.remove(kw.mesh); this.katanaWaves.splice(i, 1); }
        }

        // Rockets
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i]; r.life -= dt;
            const step = r.vel.clone().multiplyScalar(dt);
            const nextPos = r.mesh.position.clone().add(step);
            const hits = new THREE.Raycaster(r.mesh.position, step.clone().normalize(), 0, step.length()).intersectObjects(this.world.meshes, false);
            let detonated = hits.length > 0 || r.life <= 0;
            const hitPos = hits.length ? hits[0].point : nextPos;
            if (!detonated) {
                for (const b of this.bots) if (b.alive && b.pos.clone().add(new THREE.Vector3(0, 1, 0)).distanceTo(nextPos) < 1.1) { detonated = true; break; }
            }
            if (detonated) {
                this.effects.explosion(hitPos, r.w.splashRadius || 6);
                audio.explosion();
                for (const b of this.bots) {
                    if (!b.alive) continue;
                    const d = b.pos.distanceTo(hitPos);
                    if (d < (r.w.splashRadius || 6)) this.armory._damageBot(b, Math.round(r.w.damage * (1 - d / 9)), false);
                }
                this.scene.remove(r.mesh); this.rockets.splice(i, 1);
            } else r.mesh.position.copy(nextPos);
        }

        // Flashbangs
        for (let i = this.flashbangs.length - 1; i >= 0; i--) {
            const fb = this.flashbangs[i]; fb.timer -= dt;
            fb.vel.y -= GRAVITY * 0.75 * dt;
            fb.mesh.position.addScaledVector(fb.vel, dt);
            if (fb.mesh.position.y < 0.2) { fb.mesh.position.y = 0.2; fb.vel.y *= -0.4; fb.vel.x *= 0.6; fb.vel.z *= 0.6; }
            if (fb.timer <= 0) {
                this.effects.explosion(fb.mesh.position, 3);
                for (const b of this.bots) if (b.alive && b.pos.distanceTo(fb.mesh.position) < 12) b.tkFreezeTimer = 2.5;
                if (this.player.pos.distanceTo(fb.mesh.position) < 12) {
                    const toF = fb.mesh.position.clone().sub(this.camera.position).normalize();
                    if (toF.dot(new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion)) > 0.5) this.ui.flashbang();
                }
                this.scene.remove(fb.mesh); this.flashbangs.splice(i, 1);
            }
        }

        // Medkit Drops
        for (let i = this.medkitDrops.length - 1; i >= 0; i--) {
            const md = this.medkitDrops[i]; md.life -= dt;
            md.mesh.rotation.y += dt * 2.2;
            if (this.player.alive && this.player.pos.distanceTo(md.mesh.position) < 1.8 && this.player.medkits < this.player.maxMedkits) {
                this.player.medkits++; this.ui.updateMedkits(this.player.medkits, this.player.maxMedkits);
                audio.pickup(); this.scene.remove(md.mesh); this.medkitDrops.splice(i, 1); continue;
            }
            if (md.life <= 0) { this.scene.remove(md.mesh); this.medkitDrops.splice(i, 1); }
        }

        // Bots & Waves
        let aliveBots = 0;
        for (let i = this.bots.length - 1; i >= 0; i--) {
            const b = this.bots[i];
            b.update(dt, this.player);
            if (b.alive) aliveBots++;
            else if (b.deathTimer > 2.2) { b.dispose(); this.bots.splice(i, 1); }
        }
        if (this.mode === 'wave') {
            this.ui.updateWave('SOLO WAVE', this.wave, `HOSTILES ${aliveBots}`);
            if (aliveBots === 0 && this.player.alive) {
                this.waveClearDelay += dt;
                if (this.waveClearDelay > 2.2) { this.waveClearDelay = 0; this._spawnWave(this.wave + 1); }
            } else this.waveClearDelay = 0;
        } else {
            while (aliveBots < 4) { this._spawnBot(1); aliveBots++; }
        }

        // Sukuna Domain Expansion Tick
        if (this.domainActive) {
            this.domainTimer -= dt;
            if (this.domainGroup) this.domainGroup.rotation.y += dt * 0.35;
            if (Math.random() < 0.28) {
                for (const b of this.bots) {
                    if (b.alive) {
                        this.effects.sukunaSlash(b.pos.clone().add(new THREE.Vector3(rand(-0.4, 0.4), 1.1, rand(-0.4, 0.4))));
                        this.armory._damageBot(b, 28, true);
                    }
                }
            }
            if (this.domainTimer <= 0) this.endDomain();
        }

        // HUD Update
        const w = this.player.currentWeapon;
        const isSniper = w && (w.kind === 'sniper' || w.kind === 'kar98') && this.input.right;
        this.ui.updateHealth(this.player.health, this.player.maxHealth);
        this.ui.updateWeapon(this.player);
        this.ui.updateCrosshair(this.player.bloomPulse + (this.player.onGround ? 0 : 0.65));
        this.ui.updateScope(isSniper);
        this.ui.updateBuffs(this.player);

        this.renderer.render(this.scene, this.camera);
        this.input.endFrame();
    }
}

const game = new Game();