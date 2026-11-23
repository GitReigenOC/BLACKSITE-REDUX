import * as THREE from 'three';
addEventListener('error', e => console.error('[BSR]', e.message, e.filename, e.lineno));

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const sign = v => v < 0 ? -1 : 1;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3();
const _e1 = new THREE.Euler();

const PUBLIC_ROOM_IDS = ['BSR-PUB-ALPHA-1', 'BSR-PUB-BRAVO-2', 'BSR-PUB-CHARLIE-3', 'BSR-PUB-DELTA-4', 'BSR-PUB-ECHO-5'];

const CAMO_ORDER = ['default', 'crimson', 'cyber', 'emerald', 'royal', 'void', 'dragon'];
const CAMO_COLORS = {
    default: 0xffdd44,
    crimson: 0xff2244,
    cyber: 0x00ffff,
    emerald: 0x00ff66,
    royal: 0xffaa00,
    void: 0xaa00ff,
    dragon: 0xff3b1a
};
const CAMO_PRICES = {
    default: 0,
    crimson: 300,
    cyber: 450,
    emerald: 450,
    royal: 650,
    void: 800,
    dragon: 1500
};
const CAMO_NAMES = {
    default: 'Standard Issue',
    crimson: 'Crimson (Tracer)',
    cyber: 'Cyber Cyan (Tracer)',
    emerald: 'Emerald Toxic (Tracer)',
    royal: 'Royal Gold (Tracer)',
    void: 'Void Purple (Tracer)',
    dragon: 'Dragon (3D Model)'
};
const CAMO_DESCS = {
    default: 'Factory tactical finish.',
    crimson: 'Blood-red digital blocks + red tracers.',
    cyber: 'Circuit board cyan + plasma tracers.',
    emerald: 'Hexagonal green plating + toxic tracers.',
    royal: 'Diagonal gold stripes + golden tracers.',
    void: 'Starfield nebula + void tracers.',
    dragon: 'Custom 3D fire-breathing dragon sculpt.'
};
const CAMO_SWATCH_CSS = {
    default: 'linear-gradient(135deg, #2b3544, #161c24)',
    crimson: 'linear-gradient(135deg, #4a0812, #ff2244)',
    cyber: 'linear-gradient(135deg, #062636, #00ffff)',
    emerald: 'linear-gradient(135deg, #092e16, #00ff66)',
    royal: 'repeating-linear-gradient(45deg, #1f1406, #1f1406 8px, #ffaa00 8px, #ffaa00 13px)',
    void: 'radial-gradient(circle at 30% 30%, #aa00ff, #0a0514 75%)',
    dragon: 'linear-gradient(135deg, #2a0602 0%, #ff3b1a 55%, #ffaa00 100%)'
};

const SKINS = {
    operator: { name: 'OPERATOR', skin: '#e8ecf0', accent: '#ff7a1a' },
    shadow: { name: 'SHADOW', skin: '#2a2f38', accent: '#8a5cff' },
    ember: { name: 'EMBER', skin: '#e8b090', accent: '#ff5a1a' },
    arctic: { name: 'ARCTIC', skin: '#d0e4f0', accent: '#40d0ff' },
    toxic: { name: 'TOXIC', skin: '#9fe0a0', accent: '#3fe08a' },
    void: { name: 'VOID', skin: '#40304a', accent: '#aa00ff' }
};

const SHOP_WEAPONS = ['rifle', 'shotgun', 'rocket', 'knife', 'smg', 'sniper', 'ak47', 'kar98', 'lmg', 'katana'];
const WEAPON_CHALLENGES = { rifle: 40, shotgun: 30, sniper: 25, kar98: 40, smg: 30, lmg: 60, ak47: 50, rocket: 25, knife: 15, katana: 20 };

/* ===== INJECT DYNAMIC STYLES FOR ABILITIES & TELEKINESIS/BLINK VIGNETTES ===== */
(function injectDynamicStyles() {
    if (document.getElementById('bsr-dynamic-styles')) return;
    const st = document.createElement('style');
    st.id = 'bsr-dynamic-styles';
    st.textContent = `
        .tg-ability-row { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.12); }
        .tg-btn.ab { border-color: rgba(64, 208, 255, 0.55); color: #bfefff; }
        .tg-btn.ab:hover { background: rgba(64, 208, 255, 0.24); border-color: #40d0ff; }
        .tg-btn.sukuna { border-color: rgba(255, 30, 56, 0.7); color: #ff9aa8; }
        .tg-btn.sukuna:hover { background: rgba(255, 30, 56, 0.28); border-color: #ff1e38; }
        #psyOverlay {
            position: fixed; inset: 0; pointer-events: none; z-index: 25; opacity: 0;
            transition: opacity 0.2s ease-out;
            background: radial-gradient(circle at center, transparent 48%, rgba(170, 0, 255, 0.45) 100%);
        }
        #blinkOverlay {
            position: fixed; inset: 0; pointer-events: none; z-index: 25; opacity: 0;
            transition: opacity 0.16s ease-out;
            background: radial-gradient(circle at center, transparent 52%, rgba(64, 208, 255, 0.5) 100%);
        }
        .loadoutSlot .slotCamo {
            font-size: 9px; letter-spacing: 2px; color: var(--accent); margin-top: 4px; text-transform: uppercase;
        }
        .loadoutItem.equipped {
            border-color: #3fe08a; background: rgba(63, 224, 138, 0.1);
        }
        .shop-3d-canvas {
            width: 100%; height: 170px; display: block; margin-top: 10px;
            background: radial-gradient(circle at center, rgba(255,122,26,0.12), rgba(4,6,10,0.85));
            border: 1px solid rgba(255,255,255,0.08); cursor: grab;
        }
        .shop-3d-canvas:active { cursor: grabbing; }
    `;
    document.head.appendChild(st);
})();

/* ===== PROCEDURAL TEXTURES FOR CAMOS & ARENAS ===== */
const _camoTextureCache = {};
function generateCamoTexture(camo) {
    if (_camoTextureCache[camo]) return _camoTextureCache[camo];
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const x = c.getContext('2d');
    if (camo === 'default') {
        x.fillStyle = '#1d242e'; x.fillRect(0, 0, 128, 128);
        x.strokeStyle = 'rgba(255,255,255,0.06)'; x.lineWidth = 1;
        for (let i = 0; i < 128; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); }
    } else if (camo === 'crimson') {
        x.fillStyle = '#1a0505'; x.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 55; i++) {
            x.fillStyle = `hsl(0, ${50 + Math.random() * 50}%, ${8 + Math.random() * 18}%)`;
            const s = 5 + Math.random() * 22;
            x.fillRect(Math.random() * 128, Math.random() * 128, s, s);
        }
        x.fillStyle = '#ff2244';
        for (let i = 0; i < 6; i++) x.fillRect(Math.random() * 128, Math.random() * 128, 3, 3);
    } else if (camo === 'cyber') {
        x.fillStyle = '#05131a'; x.fillRect(0, 0, 128, 128);
        x.strokeStyle = '#00ffff'; x.lineWidth = 1.2; x.shadowColor = '#00ffff'; x.shadowBlur = 3;
        for (let i = 0; i < 10; i++) {
            x.beginPath();
            let px = Math.random() * 128, py = Math.random() * 128;
            x.moveTo(px, py);
            for (let j = 0; j < 5; j++) { px += (Math.random() - .5) * 45; py += (Math.random() - .5) * 45; x.lineTo(px, py); }
            x.stroke();
        }
        x.shadowBlur = 0; x.fillStyle = '#00ffff';
        for (let i = 0; i < 12; i++) x.fillRect(Math.random() * 128, Math.random() * 128, 2.5, 2.5);
    } else if (camo === 'emerald') {
        x.fillStyle = '#0a2010'; x.fillRect(0, 0, 128, 128);
        x.strokeStyle = '#00ff66'; x.lineWidth = 1; x.shadowColor = '#00ff66'; x.shadowBlur = 2;
        const hs = 11;
        for (let y = -hs; y < 128 + hs; y += hs * 1.5) for (let xx = -hs; xx < 128 + hs; xx += hs * Math.sqrt(3)) {
            const off = (Math.floor((y + hs) / (hs * 1.5)) % 2) * (hs * Math.sqrt(3) / 2);
            x.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = i * Math.PI / 3;
                const px = xx + off + Math.cos(a) * hs, py = y + Math.sin(a) * hs;
                if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
            }
            x.closePath(); x.stroke();
        }
        x.shadowBlur = 0;
    } else if (camo === 'royal') {
        x.fillStyle = '#1a1005'; x.fillRect(0, 0, 128, 128);
        x.strokeStyle = '#ffcc44'; x.lineWidth = 3; x.shadowColor = '#ffcc44'; x.shadowBlur = 4;
        for (let i = -128; i < 256; i += 14) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 64, 128); x.stroke(); }
        x.shadowBlur = 0; x.fillStyle = '#ffe680';
        for (let i = 0; i < 12; i++) x.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    } else if (camo === 'void') {
        x.fillStyle = '#0a0514'; x.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 3; i++) {
            const grad = x.createRadialGradient(Math.random() * 128, Math.random() * 128, 0, Math.random() * 128, Math.random() * 128, 55);
            grad.addColorStop(0, 'rgba(120,50,200,0.45)');
            grad.addColorStop(1, 'rgba(120,50,200,0)');
            x.fillStyle = grad; x.fillRect(0, 0, 128, 128);
        }
        for (let i = 0; i < 80; i++) {
            const b = Math.random();
            x.fillStyle = `rgba(${170 + Math.random() * 85},${100 + Math.random() * 100},255,${b})`;
            const s = b * 2.8;
            x.fillRect(Math.random() * 128, Math.random() * 128, s, s);
        }
    } else if (camo === 'dragon') {
        x.fillStyle = '#160402'; x.fillRect(0, 0, 128, 128);
        for (let y = 0; y < 128; y += 14) {
            for (let xx = 0; xx < 128; xx += 16) {
                const ox = (Math.floor(y / 14) % 2) * 8;
                x.fillStyle = (xx + y) % 28 === 0 ? '#3b0904' : '#240502';
                x.beginPath();
                x.arc(xx + ox, y, 9, 0, Math.PI);
                x.fill();
                x.strokeStyle = '#ff4d1a';
                x.lineWidth = 1.2;
                x.stroke();
            }
        }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    _camoTextureCache[camo] = tex;
    return tex;
}

const _arenaTexCache = {};
function getArenaTexture(kind, primaryHex = '#3a4656', accentHex = '#ff7a1a', repeatX = 8, repeatY = 8) {
    const key = `${kind}_${primaryHex}_${accentHex}_${repeatX}_${repeatY}`;
    if (_arenaTexCache[key]) return _arenaTexCache[key];
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    if (kind === 'floor') {
        ctx.fillStyle = primaryHex;
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 124, 124);
        ctx.strokeRect(130, 2, 124, 124);
        ctx.strokeRect(2, 130, 124, 124);
        ctx.strokeRect(130, 130, 124, 124);
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 2;
        ctx.strokeRect(6, 6, 116, 116);
        ctx.strokeRect(134, 134, 116, 116);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        for (let i = 16; i < 112; i += 24) {
            ctx.fillRect(i, 58, 12, 4);
            ctx.fillRect(128 + i, 186, 12, 4);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        for (const [rx, ry] of [[12, 12], [116, 12], [12, 116], [116, 116], [140, 140], [244, 140], [140, 244], [244, 244]]) {
            ctx.fillRect(rx, ry, 4, 4);
        }
    } else if (kind === 'wall') {
        ctx.fillStyle = primaryHex;
        ctx.fillRect(0, 0, 256, 256);
        for (let y = 0; y < 256; y += 64) {
            ctx.fillStyle = 'rgba(0,0,0,0.32)';
            ctx.fillRect(0, y, 256, 6);
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(0, y + 6, 256, 3);
        }
        for (let x = 0; x < 256; x += 128) {
            ctx.fillStyle = 'rgba(0,0,0,0.38)';
            ctx.fillRect(x, 0, 6, 256);
        }
        ctx.fillStyle = '#11161d';
        ctx.fillRect(0, 212, 256, 26);
        ctx.fillStyle = accentHex;
        for (let i = -32; i < 288; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, 238);
            ctx.lineTo(i + 16, 238);
            ctx.lineTo(i + 28, 212);
            ctx.lineTo(i + 12, 212);
            ctx.closePath();
            ctx.fill();
        }
    } else if (kind === 'crate') {
        ctx.fillStyle = primaryHex;
        ctx.fillRect(0, 0, 256, 256);
        for (let x = 16; x < 240; x += 20) {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(x, 20, 8, 216);
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(x + 8, 20, 4, 216);
        }
        ctx.strokeStyle = '#151a22';
        ctx.lineWidth = 18;
        ctx.strokeRect(9, 9, 238, 238);
        ctx.fillStyle = accentHex;
        ctx.fillRect(28, 28, 64, 10);
        ctx.fillRect(188, 216, 40, 10);
    } else if (kind === 'walk') {
        ctx.fillStyle = primaryHex;
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        for (let y = 8; y < 256; y += 16) {
            for (let x = (y % 32 === 0 ? 8 : 16); x < 256; x += 16) {
                ctx.fillRect(x, y, 6, 6);
            }
        }
        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, 250, 250);
    } else if (kind === 'lava') {
        ctx.fillStyle = '#3a0800';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 40; i++) {
            const gx = Math.random() * 256, gy = Math.random() * 256, r = 20 + Math.random() * 50;
            const g = ctx.createRadialGradient(gx, gy, 2, gx, gy, r);
            g.addColorStop(0, '#ffdd55');
            g.addColorStop(0.45, '#ff5500');
            g.addColorStop(1, 'rgba(90,10,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 256, 256);
        }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.colorSpace = THREE.SRGBColorSpace;
    _arenaTexCache[key] = tex;
    return tex;
}

const SAVE_KEY = 'blacksite_redux_save_v1';
const SaveSystem = {
    data: {
        points: 0,
        unlockedWeapons: ['rifle', 'shotgun', 'rocket', 'knife'],
        unlockedCamos: ['rifle:default', 'shotgun:default', 'rocket:default', 'knife:default'],
        equippedLoadout: ['rifle', 'shotgun', 'rocket', 'knife'],
        equippedCamos: { rifle: 'default', shotgun: 'default', rocket: 'default', knife: 'default' },
        settings: { volume: 0.6, musicVolume: 0.4, fov: 90, sensitivity: 1, scopeSensitivity: 0.8, invertY: false, uiColor: '#ff7a1a', skinColor: '#e8ecf0' },
        playerName: 'OPERATOR-' + Math.floor(Math.random() * 999),
        challenges: {},
        selectedSkin: 'operator'
    },
    normalizeLoadout() {
        const defaults = ['rifle', 'shotgun', 'rocket', 'knife'];
        for (const d of defaults) {
            if (!this.data.unlockedWeapons.includes(d)) this.data.unlockedWeapons.push(d);
        }
        const validUnlocked = this.data.unlockedWeapons.filter(w => !!WEAPON_DEFS[w]);
        this.data.unlockedWeapons = [...new Set(validUnlocked)];

        for (const k of this.data.unlockedWeapons) {
            if (!this.data.unlockedCamos.includes(k + ':default')) this.data.unlockedCamos.push(k + ':default');
            if (!this.data.equippedCamos[k]) this.data.equippedCamos[k] = 'default';
        }

        const raw = Array.isArray(this.data.equippedLoadout) ? this.data.equippedLoadout : [];
        const fixed = [];
        for (let i = 0; i < 4; i++) {
            const candidate = raw[i];
            if (candidate && this.data.unlockedWeapons.includes(candidate) && !fixed.includes(candidate)) {
                fixed.push(candidate);
            } else {
                const fallback = this.data.unlockedWeapons.find(w => !fixed.includes(w)) || defaults[i];
                fixed.push(fallback);
            }
        }
        this.data.equippedLoadout = fixed;
    },
    load() {
        try {
            let s = localStorage.getItem(SAVE_KEY);
            if (!s) s = localStorage.getItem('blacksite_redux_save_v2');
            if (!s) s = localStorage.getItem('blacksite_redux_save_v3');
            if (s) {
                const parsed = JSON.parse(s);
                this.data = { ...this.data, ...parsed };
                if (!this.data.equippedCamos) this.data.equippedCamos = {};
                if (!this.data.equippedLoadout) this.data.equippedLoadout = ['rifle', 'shotgun', 'rocket', 'knife'];
                if (!this.data.settings) this.data.settings = { volume: 0.6, musicVolume: 0.4, fov: 90, sensitivity: 1, scopeSensitivity: 0.8, invertY: false, uiColor: '#ff7a1a', skinColor: '#e8ecf0' };
                if (this.data.settings.scopeSensitivity === undefined) this.data.settings.scopeSensitivity = 0.8;
                if (!this.data.settings.uiColor) this.data.settings.uiColor = '#ff7a1a';
                if (!this.data.settings.skinColor) this.data.settings.skinColor = '#e8ecf0';
                if (!this.data.playerName) this.data.playerName = 'OPERATOR-' + Math.floor(Math.random() * 999);
                if (!this.data.challenges) this.data.challenges = {};
                if (!this.data.selectedSkin) this.data.selectedSkin = 'operator';
            }
        } catch (e) { console.error('Save load error', e); }
        this.normalizeLoadout();
        document.documentElement.style.setProperty('--accent', this.data.settings.uiColor);
    },
    save() {
        this.normalizeLoadout();
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { console.error('Save error', e); }
    },
    reset() {
        if (confirm("Are you sure you want to reset all progress, weapons, camos, and settings?")) {
            localStorage.removeItem(SAVE_KEY);
            localStorage.removeItem('blacksite_redux_save_v2');
            localStorage.removeItem('blacksite_redux_save_v3');
            location.reload();
        }
    }
};

class AudioEngine {
    constructor() { this.ready = false; this.volume = SaveSystem.data.settings.volume; this.listenerPos = new THREE.Vector3(); this.listenerRight = new THREE.Vector3(1, 0, 0); this._tmp = new THREE.Vector3(); this.onReadyCallback = null; }
    init() {
        if (this.ready) { this.ctx.resume(); return; }
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        try { this.ctx = new AC(); } catch (e) { return; }
        this.master = this.ctx.createGain(); this.master.gain.value = this.volume; this.master.connect(this.ctx.destination);
        this.comp = this.ctx.createDynamicsCompressor(); this.comp.threshold.value = -18; this.comp.knee.value = 8; this.comp.ratio.value = 5; this.comp.attack.value = .003; this.comp.release.value = .15; this.comp.connect(this.master);
        this.sfx = this.ctx.createGain(); this.sfx.gain.value = 1.0; this.sfx.connect(this.comp);
        this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = SaveSystem.data.settings.musicVolume; this.musicBus.connect(this.master);
        this.reverb = this.ctx.createConvolver(); this.reverb.buffer = this._impulse(1.8, 2.5);
        this.reverbSend = this.ctx.createGain(); this.reverbSend.gain.value = .18; this.reverbSend.connect(this.reverb); this.reverb.connect(this.comp);
        const len = Math.floor(this.ctx.sampleRate * 1.5); const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate); const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.noise = buf; this.ready = true;
        if (this.onReadyCallback) this.onReadyCallback();
    }
    _impulse(dur, decay) { const len = this.ctx.sampleRate * dur; const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); } return buf; }
    setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; }
    setMusicVolume(v) { if (this.musicBus) this.musicBus.gain.value = v; }
    _spatial(pos) { if (!pos) return { pan: 0, gain: 1 }; this._tmp.copy(pos).sub(this.listenerPos); const dist = this._tmp.length(); if (dist < .001) return { pan: 0, gain: 1 }; this._tmp.multiplyScalar(1 / dist); const pan = clamp(this._tmp.dot(this.listenerRight), -1, 1) * .85; const gain = clamp(1 / (1 + dist * .08), 0, 1); return { pan, gain }; }
    _noise({ dur = .2, gain = .4, freq = 1400, freqEnd = 200, q = 1, attack = .002, pan = 0, reverb = false, type = 'lowpass' }) {
        if (!this.ready || gain < 0.005) return; const t = this.ctx.currentTime;
        const src = this.ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
        const flt = this.ctx.createBiquadFilter(); flt.type = type; flt.Q.value = q; flt.frequency.setValueAtTime(Math.max(20, freq), t); flt.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur);
        const g = this.ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
        src.connect(flt); flt.connect(g); g.connect(p); p.connect(this.sfx);
        if (reverb) { const r = this.ctx.createGain(); r.gain.value = .3; g.connect(r); r.connect(this.reverbSend); }
        src.start(t); src.stop(t + dur + .03);
    }
    _sweep(f0, f1, dur, gain, type = 'sawtooth', pan = 0, reverb = false) {
        if (!this.ready || gain < 0.005) return; const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = type; osc.frequency.setValueAtTime(f0, t); osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
        const g = this.ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
        osc.connect(g); g.connect(p); p.connect(this.sfx);
        if (reverb) { const r = this.ctx.createGain(); r.gain.value = .4; g.connect(r); r.connect(this.reverbSend); }
        osc.start(t); osc.stop(t + dur + .03);
    }
    _sub(freq, dur, gain, pan = 0) {
        if (!this.ready || gain < 0.01) return; const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t); osc.frequency.exponentialRampToValueAtTime(freq * .55, t + dur);
        const g = this.ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
        osc.connect(g); g.connect(p); p.connect(this.sfx); osc.start(t); osc.stop(t + dur + .03);
    }
    _click(gain, pan = 0) {
        if (!this.ready || gain < 0.01) return; const t = this.ctx.currentTime;
        const src = this.ctx.createBufferSource(); src.buffer = this.noise;
        const flt = this.ctx.createBiquadFilter(); flt.type = 'highpass'; flt.frequency.value = 3500;
        const g = this.ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + .001); g.gain.exponentialRampToValueAtTime(.0001, t + .018);
        const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
        src.connect(flt); flt.connect(g); g.connect(p); p.connect(this.sfx); src.start(t); src.stop(t + .025);
    }
    _tone({ freq = 440, freqEnd = null, dur = .15, gain = .2, type = 'sine', attack = .004, pan = 0 }) {
        if (!this.ready || gain < 0.005) return; const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = type; osc.frequency.setValueAtTime(freq, t);
        if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur);
        const g = this.ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
        osc.connect(g); g.connect(p); p.connect(this.sfx); osc.start(t); osc.stop(t + dur + .03);
    }
    katanaDraw() {
        if (!this.ready) return;
        this._sweep(2200, 4400, .14, .22, 'triangle', 0, true);
        this._sweep(3300, 5200, .11, .14, 'sine', 0, true);
        this._noise({ dur: .14, gain: .28, freq: 5200, freqEnd: 1800, q: 3.5, type: 'bandpass', reverb: true });
    }
    katanaSlash(isSuper = false, combo = 0, pos = null) {
        const s = this._spatial(pos); if (s.gain < 0.02) return;
        const pitchShift = combo === 0 ? 1.0 : combo === 1 ? 1.12 : 1.26;
        this._noise({
            dur: isSuper ? .28 : .17,
            gain: (isSuper ? .62 : .46) * s.gain,
            freq: (isSuper ? 3800 : 3100) * pitchShift,
            freqEnd: isSuper ? 260 : 420,
            q: 2.2,
            type: 'bandpass',
            pan: s.pan,
            reverb: true
        });
        this._sweep(1550 * pitchShift, 520 * pitchShift, isSuper ? .24 : .14, .26 * s.gain, 'triangle', s.pan, true);
        this._sweep(2480 * pitchShift, 980 * pitchShift, isSuper ? .22 : .12, .15 * s.gain, 'sine', s.pan, true);
        if (isSuper) {
            this._sub(88, .24, .55 * s.gain, s.pan);
            this._sweep(420, 95, .26, .35 * s.gain, 'sawtooth', s.pan, true);
        }
    }
    katanaHit(isCrit = false, pos = null) {
        const s = this._spatial(pos); if (s.gain < 0.02) return;
        this._noise({ dur: .11, gain: .52 * s.gain, freq: 4200, freqEnd: 600, q: 1.4, pan: s.pan });
        this._sweep(isCrit ? 2200 : 1400, 320, .12, .35 * s.gain, 'sawtooth', s.pan);
        this._sub(isCrit ? 75 : 95, .12, .45 * s.gain, s.pan);
    }
    katanaParry(pos = null) {
        const s = this._spatial(pos);
        this._tone({ freq: 1920, freqEnd: 1860, dur: .42, gain: .38 * s.gain, type: 'triangle', pan: s.pan });
        this._tone({ freq: 2890, freqEnd: 2810, dur: .36, gain: .28 * s.gain, type: 'sine', pan: s.pan });
        this._tone({ freq: 4120, freqEnd: 3980, dur: .24, gain: .18 * s.gain, type: 'sine', pan: s.pan });
        this._noise({ dur: .22, gain: .45 * s.gain, freq: 6500, freqEnd: 1400, q: 2.5, type: 'bandpass', pan: s.pan, reverb: true });
        this._sub(110, .16, .42 * s.gain, s.pan);
    }
    shoot(kind, pos) {
        const s = this._spatial(pos); if (s.gain < 0.02) return;
        if (kind === 'katana') { this.katanaSlash(false, 0, pos); return; }
        if (kind === 'dismantle') {
            this._noise({ dur: .19, gain: .58 * s.gain, freq: 6800, freqEnd: 320, q: 2.4, type: 'bandpass', pan: s.pan, reverb: true });
            this._sweep(2600, 420, .16, .34 * s.gain, 'sawtooth', s.pan, true);
            this._sweep(3900, 780, .14, .22 * s.gain, 'triangle', s.pan, true);
            this._sub(68, .15, .42 * s.gain, s.pan);
            return;
        }
        this._click(0.55 * s.gain, s.pan);
        if (kind === 'rifle' || kind === 'smg' || kind === 'lmg' || kind === 'ak47') {
            this._noise({ dur: .09, gain: .42 * s.gain, freq: 5500, freqEnd: 400, q: .85, pan: s.pan });
            this._sweep(190, 55, .085, .55 * s.gain, 'sawtooth', s.pan);
            this._sub(65, .08, .38 * s.gain, s.pan);
            this._noise({ dur: .15, gain: .12 * s.gain, freq: 1200, freqEnd: 200, pan: s.pan, reverb: true, attack: .01 });
        } else if (kind === 'shotgun') {
            this._noise({ dur: .32, gain: .68 * s.gain, freq: 3200, freqEnd: 90, q: .55, pan: s.pan });
            this._sweep(150, 38, .24, .65 * s.gain, 'sawtooth', s.pan);
            this._sub(52, .18, .55 * s.gain, s.pan);
            setTimeout(() => this._sub(48, .1, .32 * s.gain, s.pan), 45);
            this._noise({ dur: .6, gain: .2 * s.gain, freq: 800, freqEnd: 120, pan: s.pan, reverb: true, attack: .02 });
        } else if (kind === 'sniper' || kind === 'kar98') {
            this._noise({ dur: .42, gain: .75 * s.gain, freq: 7500, freqEnd: 180, q: .5, pan: s.pan });
            this._sweep(100, 32, .34, .7 * s.gain, 'sawtooth', s.pan);
            this._sub(46, .32, .6 * s.gain, s.pan);
            setTimeout(() => this._noise({ dur: .7, gain: .28 * s.gain, freq: 1400, freqEnd: 150, q: .8, pan: s.pan, reverb: true, attack: .03 }), 90);
        } else if (kind === 'rocket') {
            this._noise({ dur: .55, gain: .55 * s.gain, freq: 1400, freqEnd: 180, q: 1.2, pan: s.pan });
            this._sweep(230, 55, .32, .4 * s.gain, 'sawtooth', s.pan);
            this._sub(72, .15, .42 * s.gain, s.pan);
            this._noise({ dur: .8, gain: .22 * s.gain, freq: 900, freqEnd: 100, pan: s.pan, reverb: true, attack: .03 });
        } else if (kind === 'knife') {
            this._noise({ dur: .12, gain: .35 * s.gain, freq: 2400, freqEnd: 300, q: 1.2, pan: s.pan });
            this._sweep(950, 260, .09, .18, 'triangle', s.pan);
        } else if (kind === 'lightning') {
            this._noise({ dur: .6, gain: .8 * s.gain, freq: 8000, freqEnd: 500, q: 1, pan: s.pan });
            this._sub(60, .5, .7 * s.gain, s.pan);
        }
    }
    explosion(pos) { const s = this._spatial(pos); this._noise({ dur: 1.0, gain: .85 * s.gain, freq: 2200, freqEnd: 50, q: .8, pan: s.pan }); this._sweep(110, 22, .9, .75 * s.gain, 'sawtooth', s.pan, true); this._sub(40, .6, .55 * s.gain, s.pan); this._sub(28, .8, .35 * s.gain, s.pan); }
    hit(head) { if (head) { this._tone({ freq: 2400, freqEnd: 3200, dur: .08, gain: .3 }); this._tone({ freq: 3600, dur: .05, gain: .15, type: 'triangle' }); } else this._tone({ freq: 1100, freqEnd: 800, dur: .05, gain: .18, type: 'square' }); }
    kill() { this._tone({ freq: 660, dur: .08, gain: .22, type: 'triangle' }); setTimeout(() => this._tone({ freq: 990, dur: .12, gain: .22, type: 'triangle' }), 70); setTimeout(() => this._tone({ freq: 1320, dur: .18, gain: .18, type: 'triangle' }), 155); }
    multikill(tier) {
        const base = 520 + tier * 110;
        this._tone({ freq: base, dur: .12, gain: .24, type: 'sawtooth' });
        setTimeout(() => this._tone({ freq: base * 1.25, dur: .14, gain: .24, type: 'sawtooth' }), 70);
        setTimeout(() => this._tone({ freq: base * 1.5, dur: .22, gain: .22, type: 'triangle' }), 140);
    }
    reload() { this._noise({ dur: .06, gain: .2, freq: 2800, freqEnd: 1400, q: 4, type: 'bandpass' }); setTimeout(() => this._noise({ dur: .08, gain: .24, freq: 2000, freqEnd: 800, q: 5, type: 'bandpass' }), 150); }
    reloadDone() { this._noise({ dur: .05, gain: .32, freq: 3600, freqEnd: 2000, q: 6, type: 'bandpass' }); }
    empty() { this._tone({ freq: 240, freqEnd: 140, dur: .07, gain: .15, type: 'square' }); }
    jump() { this._sweep(280, 520, .1, .12, 'sine'); }
    land() { this._noise({ dur: .12, gain: .22, freq: 1000, freqEnd: 120 }); }
    footstep() { this._noise({ dur: .06, gain: .14, freq: 2000, freqEnd: 280, q: 1.2, type: 'bandpass' }); }
    slide() { this._noise({ dur: .65, gain: .36, freq: 1150, freqEnd: 120, q: .8 }); }
    ui() { this._tone({ freq: 820, freqEnd: 1100, dur: .05, gain: .09, type: 'square' }); }
    waveStart() { this._sweep(280, 700, .5, .25, 'sawtooth'); setTimeout(() => this._sweep(550, 1100, .5, .2, 'sawtooth'), 200); }
    pad() {
        this._sweep(260, 2200, .32, .34, 'sine');
        this._sweep(140, 980, .28, .22, 'triangle');
        this._noise({ dur: .34, gain: .26, freq: 350, freqEnd: 5600, q: 2.2, type: 'bandpass', reverb: true });
        this._sub(85, .22, .38);
    }
    teleport() { this._sweep(2400, 80, .45, .45, 'sine'); this._noise({ dur: .5, gain: .5, freq: 10000, freqEnd: 150, q: 3, type: 'bandpass', reverb: true }); this._sub(120, .3, .4); }
    telekinesis() { this._sweep(50, 220, .85, .5, 'sawtooth', 0, true); this._noise({ dur: 1.05, gain: .4, freq: 250, freqEnd: 1800, q: 1.5, type: 'bandpass' }); this._sub(42, .75, .5); }
    pickup() { this._tone({ freq: 660, freqEnd: 1400, dur: .14, gain: .26 }); setTimeout(() => this._tone({ freq: 990, freqEnd: 2000, dur: .2, gain: .22 }), 90); }
    medkit() { this._tone({ freq: 660, freqEnd: 880, dur: .12, gain: .22, type: 'triangle' }); setTimeout(() => this._tone({ freq: 880, freqEnd: 1320, dur: .18, gain: .2, type: 'triangle' }), 100); setTimeout(() => this._tone({ freq: 1320, dur: .25, gain: .16, type: 'triangle' }), 220); }
    countdown(go) { if (go) this._sweep(400, 1400, .35, .4, 'sawtooth'); else this._tone({ freq: 880, dur: .14, gain: .32, type: 'square' }); }
    perfect() { this._sweep(300, 1400, .7, .55, 'sawtooth', 0, true); this._noise({ dur: .5, gain: .5, freq: 2000, freqEnd: 5000, q: 2, type: 'bandpass' }); this._sub(55, .3, .4); }
    flashbang(intensity = 1.0, pos = null) {
        const s = this._spatial(pos);
        const g = Math.max(0.25, s.gain * intensity);
        this._noise({ dur: 1.4, gain: .85 * g, freq: 8500, freqEnd: 900, q: .5, type: 'bandpass', pan: s.pan, reverb: true });
        this._sweep(1100, 90, .85, .55 * g, 'sine', s.pan);
        this._sub(52, .35, .5 * g, s.pan);
        if (intensity > 0.25) {
            this._tone({ freq: 3350, freqEnd: 3180, dur: 2.1 * intensity, gain: 0.24 * intensity, type: 'sine', attack: 0.02 });
        }
    }
    throw() { this._sweep(400, 200, .2, .2, 'sine'); }
    sukuna() { this._sweep(100, 50, 2.0, .8, 'sawtooth', 0, true); this._noise({ dur: 2.0, gain: .6, freq: 800, freqEnd: 100, q: 1, type: 'lowpass' }); }
    domain() { this._sub(30, 3.0, 1.0); this._sweep(200, 50, 2.0, .8, 'sawtooth', 0, true); for (let i = 0; i < 10; i++) setTimeout(() => this._noise({ dur: .3, gain: .5, freq: 5000, freqEnd: 500, q: 2, pan: rand(-1, 1) }), i * 200); }
}

const audio = new AudioEngine();

/* ===== SUKUNA VFX / MAP DESTRUCTION ===== */
const slashShape = new THREE.Shape();
slashShape.moveTo(-1, 0);
slashShape.quadraticCurveTo(0, 0.82, 1, 0);
slashShape.quadraticCurveTo(0, -0.22, -1, 0);
const slashGeo = new THREE.ShapeGeometry(slashShape);
const _cleavePlaneOuterGeo = new THREE.PlaneGeometry(1.35, 0.085);
const _cleavePlaneCoreGeo = new THREE.PlaneGeometry(1.18, 0.028);
const _dismantleCoreGeo = new THREE.SphereGeometry(0.18, 8, 8);
const _dismantleSparkGeo = new THREE.BoxGeometry(0.055, 0.055, 0.055);
const _voxelChunkGeo = new THREE.BoxGeometry(1, 1, 1);

window._activeVfxLoops = window._activeVfxLoops || new Set();
window.cleanupAllStandaloneVfx = function () {
    for (const cleanup of Array.from(window._activeVfxLoops)) {
        try { cleanup(); } catch (_) { }
    }
    window._activeVfxLoops.clear();
    if (window.sukunaHandVfx) window.sukunaHandVfx.remove();
};

window.sukunaSlashVfx = function (position, type = 'dismantle') {
    if (!window.game || !window.game.scene) return;
    if (window._activeVfxLoops.size > 26) return;

    const scene = window.game.scene;
    const group = new THREE.Group();
    const disposables = [];
    let cancelled = false;

    const cleanup = () => {
        if (cancelled) return;
        cancelled = true;
        window._activeVfxLoops.delete(cleanup);
        scene.remove(group);
        for (const m of disposables) m.dispose();
    };
    window._activeVfxLoops.add(cleanup);

    if (type === 'cleave') {
        for (let i = 0; i < 8; i++) {
            const slash = new THREE.Group();
            const outerMat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0xff2438 : 0xffffff,
                transparent: true,
                opacity: 0.95,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0x050002,
                transparent: true,
                opacity: 0.95,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            disposables.push(outerMat, coreMat);
            slash.add(new THREE.Mesh(_cleavePlaneOuterGeo, outerMat));
            const core = new THREE.Mesh(_cleavePlaneCoreGeo, coreMat);
            core.position.z = 0.003;
            slash.add(core);
            slash.rotation.z = (i / 8) * Math.PI + rand(-0.25, 0.25);
            slash.rotation.x = rand(-0.55, 0.55);
            slash.position.set(rand(-0.45, 0.45), rand(-0.45, 0.45), rand(-0.25, 0.25));
            slash.userData.baseRot = slash.rotation.z;
            group.add(slash);
        }
        group.position.copy(position);
        scene.add(group);
        const start = performance.now();
        const animate = () => {
            if (cancelled) return;
            const t = (performance.now() - start) / 340;
            if (t >= 1) { cleanup(); return; }
            const inv = 1 - t;
            for (let i = 0; i < group.children.length; i++) {
                const s = group.children[i];
                s.scale.setScalar(1 + t * 1.35);
                s.rotation.z = s.userData.baseRot + t * 0.42;
                s.children[0].material.opacity = inv * 0.95;
                s.children[1].material.opacity = inv * 0.95;
            }
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        return;
    }

    const red = 0xff1e2d;
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    disposables.push(coreMat);
    const core = new THREE.Mesh(_dismantleCoreGeo, coreMat);
    group.add(core);

    const slashes = [];
    for (let i = 0; i < 4; i++) {
        const s = new THREE.Group();
        const glowMat = new THREE.MeshBasicMaterial({
            color: red,
            transparent: true,
            opacity: 0.92,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const bladeMat = new THREE.MeshBasicMaterial({
            color: 0x050000,
            transparent: true,
            opacity: 1,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        disposables.push(glowMat, bladeMat);
        const glow = new THREE.Mesh(slashGeo, glowMat);
        glow.scale.set(1.35, 1.35, 1);
        const blade = new THREE.Mesh(slashGeo, bladeMat);
        blade.position.z = 0.01;
        blade.scale.set(1.08, 0.85, 1);
        s.add(glow, blade);
        s.rotation.z = (i / 4) * Math.PI + rand(-0.2, 0.2);
        s.rotation.x = rand(-0.45, 0.45);
        s.position.set(rand(-0.18, 0.18), rand(-0.18, 0.18), rand(-0.12, 0.12));
        s.userData.baseRot = s.rotation.z;
        group.add(s);
        slashes.push(s);
    }

    const sparks = [];
    for (let i = 0; i < 10; i++) {
        const spMat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? red : 0xffffff,
            transparent: true,
            opacity: 1
        });
        disposables.push(spMat);
        const sp = new THREE.Mesh(_dismantleSparkGeo, spMat);
        group.add(sp);
        sparks.push({ mesh: sp, vel: new THREE.Vector3(rand(-4.5, 4.5), rand(-3, 4.5), rand(-4.5, 4.5)), life: 1 });
    }

    group.position.copy(position);
    scene.add(group);
    const start = performance.now();
    const animate = () => {
        if (cancelled) return;
        const t = (performance.now() - start) / 400;
        if (t >= 1) { cleanup(); return; }
        const inv = 1 - t;
        core.scale.setScalar(1 + t * 3.8);
        coreMat.opacity = inv;
        for (let i = 0; i < slashes.length; i++) {
            const s = slashes[i];
            s.scale.setScalar(1 + t * 1.5);
            s.rotation.z = s.userData.baseRot + t * 0.65;
            s.children[0].material.opacity = inv * 0.92;
            s.children[1].material.opacity = inv;
        }
        for (let i = 0; i < sparks.length; i++) {
            const sp = sparks[i];
            sp.life -= 0.065;
            sp.vel.y -= 7 * 0.016;
            sp.mesh.position.addScaledVector(sp.vel, 0.016);
            sp.mesh.material.opacity = Math.max(0, sp.life);
        }
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
};

window.damageMapMesh = function (mesh, hitPoint, damage) {
    if (!mesh || !mesh.userData?.destructible || !mesh.parent) return;
    if (window._activeVfxLoops.size > 26) return;
    if (!mesh.userData._voxelState) mesh.userData._voxelState = { regenTimer: null };
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const chunkSize = Math.max(0.18, Math.min(size.x, size.y, size.z) * 0.26);
    const chunkMat = new THREE.MeshBasicMaterial({ color: 0x3a424d });
    const chunk = new THREE.Mesh(_voxelChunkGeo, chunkMat);
    chunk.scale.setScalar(chunkSize);
    chunk.position.copy(hitPoint);
    const parent = mesh.parent;
    parent.add(chunk);

    const v = new THREE.Vector3(rand(-2.5, 2.5), rand(1.8, 3.8), rand(-2.5, 2.5));
    let life = 0;
    let cancelled = false;
    const cleanup = () => {
        if (cancelled) return;
        cancelled = true;
        window._activeVfxLoops.delete(cleanup);
        parent.remove(chunk);
        chunkMat.dispose();
    };
    window._activeVfxLoops.add(cleanup);

    const tick = () => {
        if (cancelled) return;
        life += 0.016;
        v.y -= 9.8 * 0.016;
        chunk.position.addScaledVector(v, 0.016);
        chunk.rotation.x += 0.14;
        chunk.rotation.y += 0.18;
        if (life < 0.95) requestAnimationFrame(tick);
        else cleanup();
    };
    requestAnimationFrame(tick);

    mesh.userData.originalScale = mesh.userData.originalScale || mesh.scale.clone();
    mesh.scale.multiplyScalar(0.985);
    if (!mesh.userData._voxelState.regenTimer) {
        mesh.userData._voxelState.regenTimer = setTimeout(() => {
            if (mesh.userData.originalScale) mesh.scale.copy(mesh.userData.originalScale);
            mesh.visible = true;
            if (mesh.userData._voxelState) mesh.userData._voxelState.regenTimer = null;
        }, 12000);
    }
};

window.sukunaHandVfx = {
    group: null,
    start: 0,
    swinging: false,
    _rafId: 0,
    spawn(camera) {
        if (this.group) return;
        const g = new THREE.Group();
        const pGeo = new THREE.SphereGeometry(0.036, 5, 5);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xff1a1a, transparent: true, opacity: 0.78, depthWrite: false });
        for (let i = 0; i < 16; i++) {
            const p = new THREE.Mesh(pGeo, pMat);
            p.position.set(rand(-0.38, 0.38), rand(-0.32, 0.32), rand(-0.28, 0.28));
            p.userData.base = p.position.clone();
            p.userData.phase = Math.random() * Math.PI * 2;
            g.add(p);
        }
        const hand = new THREE.Group();
        const skinMat = new THREE.MeshBasicMaterial({ color: 0x2c090c, transparent: true, opacity: 0.96 });
        const tattooMat = new THREE.MeshBasicMaterial({ color: 0xff1e2d });
        const nailMat = new THREE.MeshBasicMaterial({ color: 0x090000 });
        hand.add(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.38, 0.1), skinMat));
        const wristBand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.11), tattooMat);
        wristBand.position.y = -0.11;
        hand.add(wristBand);
        for (let i = 0; i < 4; i++) {
            const f = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.24, 0.056), skinMat);
            f.position.set(-0.095 + i * 0.064, 0.29, 0);
            f.rotation.z = (i - 1.5) * 0.08;
            const nail = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.06, 4), nailMat);
            nail.position.y = 0.14;
            f.add(nail);
            hand.add(f);
        }
        const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.18, 0.065), skinMat);
        thumb.position.set(-0.2, 0.07, 0);
        thumb.rotation.z = 0.6;
        hand.add(thumb);
        hand.position.set(0.52, -0.3, -0.72);
        hand.rotation.y = -0.4;
        hand.userData.isHand = true;
        g.add(hand);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.46, 0.018, 6, 28),
            new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.58 })
        );
        ring.position.set(0.52, -0.3, -0.7);
        ring.rotation.x = Math.PI / 2;
        ring.userData.isRing = true;
        g.add(ring);

        camera.add(g);
        g.position.set(0, 0, -1);
        this.group = g;
        this.start = performance.now();
        const loop = () => {
            if (!this.group) return;
            const t = (performance.now() - this.start) / 1000;
            this.group.children.forEach(c => {
                if (c.userData.isHand && !this.swinging) {
                    c.position.y = -0.3 + Math.sin(t * 2.4) * 0.04;
                    c.rotation.y = -0.4 + Math.sin(t * 1.2) * 0.12;
                }
                if (c.userData.isRing) {
                    c.rotation.z = t * 1.6;
                    c.scale.setScalar(1 + Math.sin(t * 3.2) * 0.08);
                }
                if (c.userData.base) {
                    c.position.x = c.userData.base.x + Math.sin(t * 2 + c.userData.phase) * 0.05;
                    c.position.y = c.userData.base.y + Math.cos(t * 2.4 + c.userData.phase) * 0.05;
                }
            });
            this._rafId = requestAnimationFrame(loop);
        };
        this._rafId = requestAnimationFrame(loop);
    },
    swing(type) {
        if (!this.group || this.swinging) return;
        const hand = this.group.children.find(c => c.userData.isHand);
        if (!hand) return;
        this.swinging = true;
        const start = performance.now();
        const dur = type === 'cleave' ? 360 : 220;
        const origZ = -0.72;
        const anim = () => {
            if (!this.group) return;
            const t = (performance.now() - start) / dur;
            if (t >= 1) {
                hand.position.z = origZ;
                hand.rotation.set(0, -0.4, 0);
                this.swinging = false;
                return;
            }
            const ease = Math.sin(t * Math.PI);
            if (type === 'dismantle') {
                hand.position.z = origZ - ease * 0.48;
                hand.rotation.x = -ease * 0.48;
            } else {
                hand.position.z = origZ - ease * 0.32;
                hand.rotation.z = Math.sin(t * Math.PI * 2) * 1.45;
                hand.rotation.y = -0.4 - ease * 0.95;
            }
            requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
    },
    remove() {
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = 0; }
        if (!this.group) return;
        this.group.parent?.remove(this.group);
        const disposedGeos = new Set();
        const disposedMats = new Set();
        this.group.traverse(o => {
            if (o.geometry && !disposedGeos.has(o.geometry)) { disposedGeos.add(o.geometry); o.geometry.dispose(); }
            if (o.material && !disposedMats.has(o.material)) { disposedMats.add(o.material); o.material.dispose(); }
        });
        this.group = null;
        this.swinging = false;
    }
};

class MusicSystem {
    constructor(audio) { this.audio = audio; this.currentTrack = null; this.tempo = 100; this.step = 0; this.nextNoteTime = 0; this.lookahead = 0.15; this.scheduleInterval = null; this.pendingTrack = null; }
    _tempoFor(track) { return { menu: 78, wave: 108, pvp: 132, training: 90, foundry: 115, abyss: 85 }[track] || 100; }
    playMenu() { this._request('menu'); }
    playWave() { this._request('wave'); }
    playPVP() { this._request('pvp'); }
    playTraining() { this._request('training'); }
    playFoundry() { this._request('foundry'); }
    playAbyss() { this._request('abyss'); }
    _request(track) { if (this.currentTrack === track) return; if (!this.audio.ready) { this.pendingTrack = track; return; } this._start(track); }
    _start(track) {
        this.stop(); if (!this.audio.ready) { this.pendingTrack = track; return; }
        this.currentTrack = track; this.tempo = this._tempoFor(track); this.step = 0;
        this.nextNoteTime = this.audio.ctx.currentTime + 0.1;
        if (this.scheduleInterval) clearInterval(this.scheduleInterval);
        this.scheduleInterval = setInterval(() => this._scheduler(), 25);
    }
    stop() { if (this.scheduleInterval) { clearInterval(this.scheduleInterval); this.scheduleInterval = null; } this.currentTrack = null; }
    onAudioReady() { if (this.pendingTrack) { const t = this.pendingTrack; this.pendingTrack = null; this._start(t); } }
    _scheduler() {
        if (!this.audio.ready || !this.currentTrack) return;
        const ctx = this.audio.ctx;
        while (this.nextNoteTime < ctx.currentTime + this.lookahead) {
            try { this._playStep(this.step, this.nextNoteTime); } catch (e) { }
            this.nextNoteTime += 60 / this.tempo / 4;
            this.step++; if (this.step > 512) this.step = 0;
        }
    }
    _note(freq, time, dur, gain, type = 'sine', filter = null) {
        if (!this.audio.ready) return;
        const ctx = this.audio.ctx;
        const osc = ctx.createOscillator(); osc.type = type; osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), time + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        let last = osc;
        if (filter) { const f = ctx.createBiquadFilter(); f.type = filter.type; f.frequency.value = filter.freq; if (filter.q) f.Q.value = filter.q; osc.connect(f); last = f; }
        last.connect(g); g.connect(this.audio.musicBus);
        osc.start(time); osc.stop(time + dur + 0.05);
    }
    _drum(kind, time, gain) {
        if (!this.audio.ready) return;
        const ctx = this.audio.ctx;
        if (kind === 'kick') {
            const osc = ctx.createOscillator(); osc.type = 'sine';
            osc.frequency.setValueAtTime(140, time); osc.frequency.exponentialRampToValueAtTime(38, time + 0.18);
            const g = ctx.createGain(); g.gain.setValueAtTime(gain, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
            osc.connect(g); g.connect(this.audio.musicBus); osc.start(time); osc.stop(time + 0.28);
        } else {
            const src = ctx.createBufferSource(); src.buffer = this.audio.noise;
            const f = ctx.createBiquadFilter();
            if (kind === 'snare') { f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 1.2; } else { f.type = 'highpass'; f.frequency.value = 7500; }
            const g = ctx.createGain();
            const dur = kind === 'snare' ? 0.16 : 0.045;
            g.gain.setValueAtTime(gain, time); g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
            src.connect(f); f.connect(g); g.connect(this.audio.musicBus); src.start(time); src.stop(time + dur + 0.05);
        }
    }
    _playStep(step, time) {
        const s = step % 16; const t = this.currentTrack;
        if (t === 'menu') {
            const bar = Math.floor(step / 16) % 4;
            const chords = [[220.00, 261.63, 329.63], [174.61, 220.00, 261.63], [261.63, 329.63, 392.00], [196.00, 246.94, 293.66]];
            if (s === 0) for (const f of chords[bar]) { this._note(f, time, 4.5, 0.035, 'sawtooth', { type: 'lowpass', freq: 700, q: 2 }); this._note(f / 2, time, 4.5, 0.025, 'sine'); }
            if (s === 6) this._note(659.25, time, 1.5, 0.03, 'triangle');
            if (s === 12) this._note(783.99, time, 1.2, 0.025, 'triangle');
        } else if (t === 'wave') {
            if (s === 0 || s === 4 || s === 8 || s === 12) this._drum('kick', time, 0.32);
            if (s === 4 || s === 12) this._drum('snare', time, 0.18);
            if (s % 2 === 1) this._drum('hat', time, 0.045);
            const bp = [55, 55, 65.41, 55, 73.42, 65.41, 55, 49];
            if (s % 2 === 0) this._note(bp[(step / 2) % 8], time, 0.22, 0.15, 'sawtooth', { type: 'lowpass', freq: 420, q: 3 });
            if (s === 6) this._note(440, time, 0.35, 0.04, 'square');
            if (s === 10) this._note(523.25, time, 0.35, 0.04, 'square');
            if (s === 14) this._note(587.33, time, 0.35, 0.04, 'square');
        } else if (t === 'pvp') {
            if (s % 4 === 0) this._drum('kick', time, 0.34);
            if (s === 4 || s === 12) this._drum('snare', time, 0.2);
            if (s % 2 === 0) this._drum('hat', time, 0.05);
            if (s % 4 === 0) this._note([55, 55, 65.41, 73.42][(step / 4) % 4], time, 0.28, 0.18, 'sawtooth', { type: 'lowpass', freq: 500, q: 4 });
            if (s === 8) this._note(440, time, 0.5, 0.05, 'square');
            if (s === 10) this._note(523.25, time, 0.5, 0.05, 'square');
            if (s === 14) this._note(659.25, time, 0.5, 0.04, 'square');
            if (s === 0) this._note(110, time, 3.8, 0.03, 'sawtooth', { type: 'lowpass', freq: 400, q: 2 });
        } else if (t === 'training') {
            if (s === 0) this._note(220, time, 3.5, 0.035, 'sine');
            if (s === 8) this._note(329.63, time, 1.8, 0.028, 'triangle');
        } else if (t === 'foundry') {
            if (s === 0 || s === 6 || s === 10) this._drum('kick', time, 0.4);
            if (s === 4 || s === 12) this._drum('snare', time, 0.25);
            if (s % 4 === 0) this._note([45.0, 45.0, 54.0, 40.0][(step / 4) % 4], time, 0.35, 0.25, 'square', { type: 'lowpass', freq: 300, q: 1 });
            if (s === 2 || s === 14) this.audio._noise({ dur: 0.1, gain: 0.15, freq: 800, freqEnd: 200, type: 'bandpass' });
            if (s === 8) this._note(110, time, 0.5, 0.1, 'sawtooth', { type: 'lowpass', freq: 600 });
        } else if (t === 'abyss') {
            if (s === 0 || s === 8) this._note([55, 65.41][(step / 8) % 2], time, 4.0, 0.1, 'sine');
            if (s === 4) this._drum('kick', time, 0.2);
            if (s === 12) this._drum('snare', time, 0.15);
            if (s === 2) this._note(440, time, 1.5, 0.03, 'triangle');
            if (s === 10) this._note(587.33, time, 1.5, 0.03, 'triangle');
            if (s === 14) this._note(880, time, 1.0, 0.02, 'sine');
        }
    }
}
const music = new MusicSystem(audio);
audio.onReadyCallback = () => music.onAudioReady();

class Input {
    constructor(canvas) {
        this.canvas = canvas; this.keys = new Set(); this.pressed = new Set();
        this.mouseDX = 0; this.mouseDY = 0; this.left = false; this.right = false; this.wheel = 0; this.locked = false;
        this.sensitivity = SaveSystem.data.settings.sensitivity; this.invertY = SaveSystem.data.settings.invertY; this.onLockChange = null; this.onLockError = null; this.onTab = null;
        addEventListener('keydown', e => {
            if (document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
            if (e.code === 'Tab') { e.preventDefault(); if (this.onTab) this.onTab(true); return; }
            if (e.repeat) return; const c = e.code; this.keys.add(c); this.pressed.add(c);
            if (['Space', 'KeyR', 'KeyF', 'KeyE', 'KeyQ', 'KeyG', 'KeyB', 'KeyN', 'KeyM', 'KeyT', 'KeyV', 'KeyH', 'KeyZ', 'KeyX', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'].includes(c)) e.preventDefault();
        });
        addEventListener('keyup', e => { if (e.code === 'Tab') { if (this.onTab) this.onTab(false); return; } this.keys.delete(e.code); });
        addEventListener('blur', () => { this.keys.clear(); this.left = this.right = false; });
        addEventListener('mousedown', e => { if (!this.locked) return; if (e.button === 0) this.left = true; if (e.button === 2) this.right = true; });
        addEventListener('mouseup', e => { if (e.button === 0) this.left = false; if (e.button === 2) this.right = false; });
        addEventListener('contextmenu', e => e.preventDefault());
        addEventListener('wheel', e => { if (this.locked) this.wheel += sign(e.deltaY); }, { passive: true });
        addEventListener('mousemove', e => { if (!this.locked) return; this.mouseDX += e.movementX || 0; this.mouseDY += e.movementY || 0; });
        document.addEventListener('pointerlockchange', () => {
            this.locked = document.pointerLockElement === this.canvas;
            if (!this.locked) { this.left = this.right = false; this.keys.clear(); }
            if (this.onLockChange) this.onLockChange(this.locked);
        });
        document.addEventListener('pointerlockerror', () => { if (this.onLockError) this.onLockError(); });
    }
    lock() { if (this.locked) return; const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { if (this.onLockError) this.onLockError(); }); }
    unlock() { if (document.pointerLockElement) document.exitPointerLock(); }
    down(c) { return this.keys.has(c); }
    hit(c) { return this.pressed.has(c); }
    endFrame() { this.pressed.clear(); this.mouseDX = 0; this.mouseDY = 0; this.wheel = 0; }
}

const WEAPON_DEFS = {
    rifle: { kind: 'rifle', shortName: 'MK-7', name: 'MK-7 CARBINE', auto: true, rpm: 620, mag: 30, reserve: 240, reloadTime: 1.9, damage: 24, headMult: 2.5, limbMult: .75, spreadHip: .025, spreadAds: .004, recoil: 0.7, range: 200, sound: 'rifle', price: 0 },
    shotgun: { kind: 'shotgun', shortName: 'SG-12', name: 'BREACHER 12G', auto: false, rpm: 75, mag: 6, reserve: 36, reloadTime: 2.6, damage: 22, pellets: 8, headMult: 2.0, limbMult: .75, spreadHip: .09, spreadAds: .05, recoil: 1.5, range: 30, sound: 'shotgun', falloff: true, price: 0, shellReload: true },
    sniper: { kind: 'sniper', shortName: 'LB-50', name: 'LONGBOW .50', auto: false, rpm: 35, mag: 5, reserve: 30, reloadTime: 3.2, damage: 95, headMult: 5.0, limbMult: .75, spreadHip: .06, spreadAds: 0, recoil: 3.0, range: 1000, sound: 'sniper', boltTime: .55, price: 800 },
    kar98: { kind: 'kar98', shortName: 'KAR98', name: 'KAR98K', auto: false, rpm: 45, mag: 5, reserve: 30, reloadTime: 2.8, damage: 80, headMult: 3.0, limbMult: .8, spreadHip: .05, spreadAds: 0, recoil: 4.0, range: 500, sound: 'kar98', boltTime: .8, price: 1200 },
    smg: { kind: 'smg', shortName: 'MP-5', name: 'MP-5', auto: true, rpm: 900, mag: 40, reserve: 240, reloadTime: 1.8, damage: 18, headMult: 2.0, limbMult: .8, spreadHip: .04, spreadAds: .01, recoil: 0.5, range: 150, sound: 'smg', price: 500 },
    lmg: { kind: 'lmg', shortName: 'M249', name: 'M249 SAW', auto: true, rpm: 750, mag: 100, reserve: 200, reloadTime: 4.0, damage: 30, headMult: 2.5, limbMult: .75, spreadHip: .06, spreadAds: .01, recoil: 1.2, range: 300, sound: 'lmg', price: 1500 },
    ak47: { kind: 'ak47', shortName: 'AK-47', name: 'AK-47', auto: true, rpm: 600, mag: 30, reserve: 120, reloadTime: 2.2, damage: 35, headMult: 3.0, limbMult: .75, spreadHip: .03, spreadAds: .005, recoil: 1.8, range: 250, sound: 'ak47', price: 1000 },
    rocket: { kind: 'rocket', shortName: 'RPG', name: 'HAVOC RL', auto: false, rpm: 55, mag: 3, reserve: 9, reloadTime: 2.8, damage: 120, splashDamage: 55, splashRadius: 5.5, spreadHip: .008, spreadAds: .003, recoil: 2.0, range: 300, sound: 'rocket', projectile: true, rocketSpeed: 42, price: 0 },
    knife: { kind: 'knife', shortName: 'KNIFE', name: 'TACTICAL KARAMBIT', auto: false, rpm: 140, mag: 1, reserve: 1, reloadTime: 0, damage: 45, headMult: 3, limbMult: 1, spreadHip: 0, spreadAds: 0, recoil: 0, range: 2.4, sound: 'knife', price: 0, melee: true, backstabMult: 999 },
    katana: { kind: 'katana', shortName: 'KATANA', name: 'REDLINER KATANA', auto: false, rpm: 175, mag: 1, reserve: 1, reloadTime: 0, damage: 85, superDamage: 125, headMult: 2.0, limbMult: 1, spreadHip: 0, spreadAds: 0, recoil: 0, range: 3.9, sound: 'katana', price: 2000, melee: true, backstabMult: 999 },
    dismantle: { kind: 'dismantle', shortName: 'DSM', name: 'DISMANTLE', auto: true, rpm: 320, mag: 999, reserve: 999, reloadTime: 0, damage: 52, headMult: 1, limbMult: 1, spreadHip: 0, spreadAds: 0, recoil: 0, range: 110, sound: 'dismantle', price: 0 },
    cleave: { kind: 'cleave', shortName: 'CLV', name: 'CLEAVE', auto: false, rpm: 60, mag: 1, reserve: 1, reloadTime: 0, damage: 90, headMult: 1, limbMult: 1, spreadHip: 0, spreadAds: 0, recoil: 0, range: 65, sound: 'knife', price: 0, melee: true }
};

SaveSystem.load();

class NetworkManager {
    constructor(game) {
        this.game = game; this.peer = null; this.hostConn = null;
        this.connections = {}; this.peerToPlayer = {}; this.players = {};
        this.isHost = false; this.roomCode = null; this.maxPlayers = 4;
        this.isPublic = false; this.matchStarted = false;
        this.myId = 'player_' + Math.random().toString(36).slice(2, 8);
        this.myName = SaveSystem.data.playerName || ('OPERATOR-' + Math.floor(Math.random() * 999));
        this._syncTimer = 0;
        this._lastReceiveTime = {};
        this._lastShootTime = 0;
        this.domainQueue = [];
        addEventListener('beforeunload', () => { try { this.broadcast({ type: 'LEAVE' }); } catch (e) { } });
    }
    host(maxPlayers, isPublic = false) {
        if (typeof Peer === 'undefined') { alert('PeerJS library not loaded. Check your internet connection.'); return; }
        this.isHost = true; this.maxPlayers = maxPlayers; this.isPublic = isPublic;
        this.roomCode = isPublic ? null : 'BSR-' + Math.random().toString(36).slice(2, 6).toUpperCase();
        if (isPublic) { this._hostPublic(); return; }
        this._hostAtCode(this.roomCode);
    }
    _hostAtCode(code) {
        this.roomCode = code;
        try { this.peer = new Peer(code); } catch (e) { alert('Peer creation failed: ' + e.message); return; }
        this.peer.on('open', () => {
            this.players[this.myId] = { name: this.myName, uiColor: SaveSystem.data.settings.uiColor, skinColor: SaveSystem.data.settings.skinColor, kills: 0, deaths: 0, isHost: true, state: {} };
            this.showWaitingLobby();
        });
        this._setupHostHandlers();
        this.peer.on('error', (err) => {
            if (err.type === 'unavailable-id') alert('Room code already in use. Try again or pick another.');
            else alert('Network error: ' + err.type);
            this.game._quitToMenu();
        });
    }
    async _hostPublic() {
        const st = document.getElementById('publicStatus');
        if (st) st.textContent = 'Claiming public slot…';
        for (const code of PUBLIC_ROOM_IDS) {
            try { await this._tryClaimPublicCode(code); this.roomCode = code; if (st) st.textContent = 'Hosting: ' + code; return; }
            catch (e) { console.warn('[NET] Public slot busy:', code); }
        }
        alert('All public slots are taken. Try hosting a private server instead.');
        this.game._quitToMenu();
    }
    _tryClaimPublicCode(code) {
        return new Promise((resolve, reject) => {
            const peer = new Peer(code);
            const timeout = setTimeout(() => { try { peer.destroy(); } catch (e) { } reject(new Error('timeout')); }, 6000);
            peer.on('open', () => {
                clearTimeout(timeout);
                this.peer = peer; this.roomCode = code;
                this.players[this.myId] = { name: this.myName, uiColor: SaveSystem.data.settings.uiColor, skinColor: SaveSystem.data.settings.skinColor, kills: 0, deaths: 0, isHost: true, state: {} };
                this._setupHostHandlers(); this.showWaitingLobby(); resolve();
            });
            peer.on('error', (err) => { clearTimeout(timeout); try { peer.destroy(); } catch (e) { } reject(err); });
        });
    }
    _setupHostHandlers() {
        this.peer.on('connection', (conn) => {
            conn.on('data', (data) => {
                if (data.type === 'PUBLIC_PROBE') {
                    try { conn.send({ type: 'PUBLIC_PROBE_RESPONSE', mode: document.getElementById('hostMode')?.value || 'PVP', map: document.getElementById('hostMap')?.value || 'blacksite', players: Object.keys(this.players).length, maxPlayers: this.maxPlayers, hostName: this.myName, timestamp: data.timestamp }); } catch (e) { }
                    return;
                }
                if (data.type === 'HANDSHAKE_JOIN') {
                    if (Object.keys(this.players).length >= this.maxPlayers) {
                        try { conn.send({ type: 'ERROR_ROOM_FULL' }); } catch (e) { }
                        setTimeout(() => { try { conn.close(); } catch (e) { } }, 500); return;
                    }
                    if (!this.connections[conn.peer]) {
                        this.connections[conn.peer] = conn;
                        this.peerToPlayer[conn.peer] = data.playerId;
                        this.players[data.playerId] = { name: data.name, uiColor: data.uiColor, skinColor: data.skinColor, kills: 0, deaths: 0, isHost: false, state: {} };
                        this._lastReceiveTime[data.playerId] = performance.now();
                        this.broadcastLobbyState();
                        try { conn.send({ type: 'LOBBY_STATE', players: this.players, maxPlayers: this.maxPlayers }); } catch (e) { }
                        if (this.matchStarted) { try { conn.send({ type: 'START_GAME', mode: this.game.mode, map: this.game.selectedMap }); } catch (e) { } }
                    }
                } else {
                    this._lastReceiveTime[data.playerId] = performance.now();
                    this.handlePacket(data, conn);
                }
            });
            conn.on('close', () => this.handleDisconnect(conn.peer));
            conn.on('error', (err) => console.warn('[NET] conn error', err));
        });
    }
    join(roomCode) {
        if (typeof Peer === 'undefined') { alert('PeerJS library not loaded. Check your internet connection.'); return; }
        this.isHost = false; this.roomCode = roomCode;
        try { this.peer = new Peer(); } catch (e) { alert('Peer error: ' + e.message); return; }
        this.peer.on('open', () => {
            this.hostConn = this.peer.connect(roomCode, { reliable: true });
            this.hostConn.on('open', () => { this.hostConn.send({ type: 'HANDSHAKE_JOIN', playerId: this.myId, name: this.myName, uiColor: SaveSystem.data.settings.uiColor, skinColor: SaveSystem.data.settings.skinColor }); });
            this.hostConn.on('data', (data) => {
                if (data.type === 'ERROR_ROOM_FULL') { alert('Room is full!'); this.game._quitToMenu(); return; }
                if (data.type === 'LOBBY_STATE') {
                    this.players = data.players; this.maxPlayers = data.maxPlayers;
                    this.showWaitingLobby();
                    const list = Object.keys(this.players).map(id => ({ id, name: this.players[id].name, isHost: this.players[id].isHost }));
                    this.updateLobbyUI(list);
                }
                if (data.type === 'START_GAME') { this.matchStarted = true; document.getElementById('waitingLobby').classList.remove('show'); this.game._startGame(data.mode, data.map, true); }
                if (data.type === 'PLAYER_LEFT') {
                    delete this.players[data.playerId];
                    if (this.game.remoteMeshes[data.playerId]) { this.game.scene.remove(this.game.remoteMeshes[data.playerId]); delete this.game.remoteMeshes[data.playerId]; }
                    if (this.matchStarted) this.updateLeaderboard();
                }
                this.handlePacket(data, null);
            });
            this.hostConn.on('close', () => { if (this.matchStarted) { alert('Host disconnected.'); this.game._quitToMenu(); } });
            this.hostConn.on('error', (err) => console.error('[NET] Conn error', err));
        });
        this.peer.on('error', (err) => { console.error('[NET] Join error:', err.type); alert('Could not connect: ' + err.type); this.game._quitToMenu(); });
    }
    disconnect() {
        try { this.broadcast({ type: 'LEAVE' }); } catch (e) { }
        if (this.hostConn) { try { this.hostConn.close(); } catch (e) { } }
        Object.values(this.connections).forEach(c => { try { c.close(); } catch (e) { } });
        if (this.peer) { try { this.peer.destroy(); } catch (e) { } }
        this.peer = null; this.connections = {}; this.peerToPlayer = {}; this.players = {};
        this.matchStarted = false; this.isPublic = false;
    }
    handleDisconnect(peerId) {
        const playerId = this.peerToPlayer[peerId];
        if (playerId) { delete this.players[playerId]; delete this.peerToPlayer[peerId]; }
        delete this.connections[peerId];
        if (playerId) {
            if (this.game.remoteMeshes[playerId]) { this.game.scene.remove(this.game.remoteMeshes[playerId]); delete this.game.remoteMeshes[playerId]; }
            if (this.game._remoteDeathState) delete this.game._remoteDeathState[playerId];
        }
        if (this.isHost) {
            this.broadcastLobbyState();
            if (playerId) this.broadcast({ type: 'PLAYER_LEFT', playerId });
            if (this.matchStarted) this.updateLeaderboard();
        }
        if (!this.isHost && this.hostConn && this.hostConn.peer === peerId) { alert('Host disconnected.'); this.game._quitToMenu(); }
    }
    broadcast(data) {
        if (this.isHost) { Object.values(this.connections).forEach(c => { try { if (c.open) c.send(data); } catch (e) { } }); }
        else if (this.hostConn && this.hostConn.open) { try { this.hostConn.send(data); } catch (e) { } }
    }
    broadcastLobbyState() {
        if (!this.isHost) return;
        const list = Object.keys(this.players).map(id => ({ id, name: this.players[id].name, isHost: this.players[id].isHost }));
        this.broadcast({ type: 'LOBBY_STATE', players: this.players, maxPlayers: this.maxPlayers });
        this.updateLobbyUI(list);
    }
    updateLobbyUI(playerList) {
        document.getElementById('lobbyStatus').textContent = `${playerList.length} / ${this.maxPlayers} READY`;
        const c = document.getElementById('lobbyPlayers'); c.innerHTML = '';
        playerList.forEach(p => {
            const el = document.createElement('div');
            el.className = 'lobbySlot ready ' + (p.isHost ? 'host' : '');
            el.innerHTML = `<div class="name">${p.name}</div><div class="status">${p.isHost ? 'HOST' : 'CONNECTED'}</div>`;
            c.appendChild(el);
        });
        for (let i = playerList.length; i < this.maxPlayers; i++) {
            const el = document.createElement('div');
            el.className = 'lobbySlot';
            el.innerHTML = `<div class="name">WAITING...</div><div class="status">EMPTY</div>`;
            c.appendChild(el);
        }
        if (this.isHost) document.getElementById('btnStartMatch').style.display = playerList.length >= 2 ? 'inline-block' : 'none';
    }
    showWaitingLobby() {
        document.getElementById('waitingLobby').classList.add('show');
        const codeBox = document.getElementById('lobbyRoomCode');
        const box = document.getElementById('lobbyRoomCodeBox');
        if (codeBox) codeBox.textContent = this.roomCode || '----';
        if (box) box.classList.toggle('big', this.maxPlayers > 2);
        if (codeBox) codeBox.onclick = () => { const r = document.createRange(); r.selectNodeContents(codeBox); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); };
        if (this.isHost) this.broadcastLobbyState();
    }
    startMatch() {
        if (!this.isHost) return;
        this.matchStarted = true;
        const mode = document.getElementById('hostMode').value;
        const map = document.getElementById('hostMap').value;
        const spawns = (this.game.world && this.game.world.spawnPoints) ? this.game.world.spawnPoints : null;
        let i = 0;
        for (const id in this.players) {
            this.players[id].state.spawnIndex = spawns ? (i % spawns.length) : undefined;
            i++;
        }
        this.broadcast({ type: 'START_GAME', mode, map, spawns: this.players });
        document.getElementById('waitingLobby').classList.remove('show');
        this.game._startGame(mode, map, true);
    }
    processDomainIntent(playerId) {
        if (!this.isHost) return;
        this.domainQueue.push({ id: playerId, time: performance.now() });
        this.domainQueue = this.domainQueue.filter(q => performance.now() - q.time < 1500);

        const other = this.domainQueue.find(q => q.id !== playerId);
        if (other) {
            this.broadcast({ type: 'CLASH_START', oppId: playerId, initiatorId: other.id, duration: 6 });
            this.broadcast({ type: 'CLASH_START', oppId: other.id, initiatorId: playerId, duration: 6 });
            if (playerId === this.myId) this.game.beginClash(other.id, 6);
            if (other.id === this.myId) this.game.beginClash(playerId, 6);
            this.domainQueue = [];
        } else {
            setTimeout(() => {
                const stillValid = this.domainQueue.find(q => q.id === playerId);
                if (stillValid) {
                    const casterState = this.players[playerId] && this.players[playerId].state;
                    const centerVec = (playerId === this.myId && this.game.player)
                        ? this.game.player.pos.clone()
                        : (casterState && casterState.pos ? new THREE.Vector3(...casterState.pos) : this.game.player.pos.clone());
                    const centerArr = [centerVec.x, centerVec.y, centerVec.z];

                    this.broadcast({ type: 'DOMAIN', playerId: playerId, center: centerArr });
                    if (playerId !== this.myId) this.game.triggerDomainExpansion(false, centerVec);
                    else this.game.triggerDomainExpansion(true, centerVec);

                    let slotIdx = 0;
                    for (const pid in this.players) {
                        if (pid === playerId) continue;
                        const pState = (pid === this.myId && this.game.player)
                            ? { pos: [this.game.player.pos.x, this.game.player.pos.y, this.game.player.pos.z], alive: this.game.player.alive }
                            : (this.players[pid] && this.players[pid].state);
                        if (!pState || !pState.pos || pState.alive === false) continue;
                        const pPos = new THREE.Vector3(...pState.pos);
                        if (pPos.distanceTo(centerVec) <= 55) {
                            const angle = (slotIdx++ * 2.1) + 0.6;
                            const pullPos = [centerVec.x + Math.cos(angle) * 10, centerVec.y + 0.25, centerVec.z + Math.sin(angle) * 10];
                            if (pid === this.myId && this.game.player && this.game.player.alive) {
                                this.game.player.pos.set(...pullPos);
                                this.game.player.vel.set(0, 0, 0);
                                this.game.player._resetViewState();
                            } else {
                                this.broadcast({ type: 'DOMAIN_TELEPORT', targetId: pid, pos: pullPos });
                            }
                        }
                    }
                    this.domainQueue = this.domainQueue.filter(q => q.id !== playerId);
                }
            }, 150);
        }
    }
    handlePacket(data, conn) {
        if (!data) return;
        if (data.type === 'LEAVE') { if (this.isHost && conn) this.handleDisconnect(conn.peer); return; }
        if (data.type === 'STATE') {
            if (this.players[data.playerId]) this.players[data.playerId].state = data.state;
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'SHOOT') {
            if (data.senderId && data.senderId === this.myId) return;
            const now = performance.now();
            if (now - this._lastShootTime < 50) return;
            this._lastShootTime = now;
            if (data.origin && data.to) {
                if (data.weapon === 'katana') {
                    const o = new THREE.Vector3(...data.origin);
                    const t = new THREE.Vector3(...data.to);
                    this.game.effects.katanaSlashArc(o, t.sub(o).normalize(), false, data.color);
                } else {
                    this.game.effects.tracer(new THREE.Vector3(...data.origin), new THREE.Vector3(...data.to), data.color);
                }
                audio.shoot(data.weapon, new THREE.Vector3(...data.origin));
            }
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'SUKUNA_SLASH') {
            if (data.senderId && data.senderId === this.myId) return;
            if (data.origin && data.dir && this.game.effects) {
                const o = new THREE.Vector3(...data.origin);
                const d = new THREE.Vector3(...data.dir);
                this.game.effects.spawnSukunaSlash(o, d, data.senderId, 0, data.slashType || 'dismantle', this.game);
                audio.shoot('dismantle', o);
            }
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'TELEPORT_VFX') {
            if (data.senderId && data.senderId === this.myId) return;
            if (data.from && data.to && this.game.effects) {
                const f = new THREE.Vector3(...data.from);
                const t = new THREE.Vector3(...data.to);
                this.game.effects.blinkTrail(f, t);
                audio.teleport();
            }
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'TK_VFX') {
            if (data.senderId && data.senderId === this.myId) return;
            if (data.origin && this.game.effects) {
                this.game.effects.telekinesisWave(new THREE.Vector3(...data.origin));
                audio.telekinesis();
            }
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'HIT') {
            if (data.targetId === this.myId) {
                const attackerPos = (data.attackerId && this.players[data.attackerId] && this.players[data.attackerId].state && this.players[data.attackerId].state.pos)
                    ? new THREE.Vector3(...this.players[data.attackerId].state.pos) : null;
                this.game.lastAttacker = data.attackerId || 'Unknown';
                this.game.lastAttackerName = data.attackerName || 'RIVAL';
                this.game.lastAttackerWeapon = data.weaponName || 'ELIMINATED';
                this.game.lastHitHeadshot = !!data.headshot;
                const canDamage = !this.game.isCoop() || !data.attackerId || data.attackerId === 'bot';
                const deflectNo = data.deflect || 0;
                const p = this.game.player;
                if (canDamage && p && p.alive) {
                    const parrying = (p.parryTimer > 0) && p.currentWeapon && p.currentWeapon.kind === 'katana';
                    if (parrying && data.attackerId && this.players[data.attackerId] && deflectNo < 6) {
                        this.broadcast({ type: 'HIT', targetId: data.attackerId, damage: Math.round(data.damage * 1.5), attackerId: this.myId, attackerName: this.myName, deflect: deflectNo + 1, isParry: true });
                        p.parryTimer = 0.25;
                        p.parryCooldown = 0.5;
                        p.health = Math.min(p.maxHealth, p.health + 20);
                        this.game.effects.katanaParry(p.pos.clone().add(new THREE.Vector3(0, 1.2, 0)));
                        this.game.ui.showCenterMsg('KATANA PARRY!', 'DEFLECTED +20 HP', 900);
                        audio.katanaParry();
                    } else {
                        if (data.isParry) this.game.ui.showCenterMsg('DEFLECTED!', '', 600);
                        p.onHit(data.damage, data.isMelee || false, attackerPos);
                        if (!p.alive) this.game.onPlayerDied();
                    }
                }
            }
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'HEAL') {
            if (data.targetId === this.myId && this.game.player && this.game.player.alive) this.game.player.health = Math.min(this.game.player.maxHealth, this.game.player.health + data.amount);
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'KILL') {
            if (this.players[data.killerId]) this.players[data.killerId].kills = (this.players[data.killerId].kills || 0) + 1;
            if (this.players[data.victimId]) this.players[data.victimId].deaths = (this.players[data.victimId].deaths || 0) + 1;
            this.game.ui.addKillFeed(data.killerName + ' ✕ ' + data.victimName, data.headshot);
            if (data.deathPos && data.victimId !== this.myId) this.game.spawnMedkitDrop(new THREE.Vector3(data.deathPos[0], data.deathPos[1], data.deathPos[2]));
            if (data.victimId === this.myId && this.game.player.alive) { this.game.player.health = 0; this.game.player.alive = false; this.game.onPlayerDied(); }
            if (data.killerId === this.myId && data.victimId !== this.myId) {
                this.game.kills++;
                const pts = 100 + (data.headshot ? 25 : 0);
                this.game.pointsEarned += pts;
                SaveSystem.data.points += pts;
                this.game.recordWeaponChallengeKill();
                SaveSystem.save();
                this.game.ui.popSkull();
                audio.kill();
                this.game._registerKillStreak(null);
            }
            this.updateLeaderboard();
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'RESPAWN') {
            if (data.playerId === this.myId && this.game.player) { const sp = this.game.world.getSafeSpawnPoint(this); this.game.player.reset(sp); this.game.player.health = this.game.player.maxHealth; this.game.player.alive = true; }
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'TK_FREEZE') {
            if (data.targetId === this.myId && this.game.player) {
                this.game.player.tkFreezeTimer = 3.5;
            }
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'FLASH') {
            if (this.game.player && this.game.player.alive) {
                this.game.applyFlashbangToPlayer(new THREE.Vector3(...data.pos));
            }
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'POWERUP_SPAWN') {
            if (!this.isHost) this.game.abilitySystem.spawnPickupAt(data.pos, data.pType);
        } else if (data.type === 'SUKUNA') {
            if (data.playerId !== this.myId) {
                this.game.ui.showCenterMsg("RYOMEN SUKUNA ARRIVES", "", 5000);
                audio.domain();
            }
        } else if (data.type === 'DOMAIN_INTENT') {
            this.processDomainIntent(data.playerId);
        } else if (data.type === 'DOMAIN') {
            if (data.playerId === this.myId) return;
            const casterState = this.players[data.playerId] && this.players[data.playerId].state;
            const center = data.center
                ? new THREE.Vector3(...data.center)
                : (casterState && casterState.pos ? new THREE.Vector3(...casterState.pos) : this.game.player.pos.clone());
            this.game.ui.showCenterMsg("DOMAIN EXPANSION MALEVOLENT SHRINE", "", 4000);
            this.game.triggerDomainExpansion(false, center);
        } else if (data.type === 'DOMAIN_TELEPORT') {
            if ((!data.targetId || data.targetId === this.myId) && this.game.player && this.game.player.alive) {
                this.game.player.pos.set(...data.pos);
                this.game.player.vel.set(0, 0, 0);
                this.game.player._resetViewState();
            }
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'DOMAIN_END') {
            this.game.endDomain();
        } else if (data.type === 'CLASH_START') {
            if (data.oppId === this.myId) this.game.beginClash(data.initiatorId, data.duration);
        } else if (data.type === 'CLASH_SCORE') {
            if (this.game.clash && this.game.clash.active && data.id === this.game.clash.oppId) this.game.clash.oppScore = data.score;
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'CLASH_RESULT') {
            this.game.resolveClash(data.winnerId);
        } else if (data.type === 'SYNC_LEADERBOARD') {
            this.players = data.players;
            this.updateLeaderboard();
        }
    }
    update(dt) {
        if (!this.matchStarted) return;
        this._syncTimer += dt;
        if (this._syncTimer > 0.033) {
            this._syncTimer = 0;
            const p = this.game.player;
            if (p) {
                const w = p.currentWeapon;
                this.broadcast({
                    type: 'STATE', playerId: this.myId,
                    state: {
                        pos: [p.pos.x, p.pos.y, p.pos.z], vel: [p.vel.x, p.vel.y, p.vel.z],
                        yaw: p.yaw, pitch: p.pitch, health: p.health, weapon: w ? w.kind : 'rifle',
                        weaponCamo: w ? (w.camo || 'default') : 'default',
                        isCrouching: p.crouching, isSliding: p.sliding, onGround: p.onGround, alive: p.alive,
                        paused: this.game.paused, tkFreezeTimer: p.tkFreezeTimer,
                        sukuna: p.sukunaTimer > 0, domainActive: this.game.domainActive,
                        skinColor: SaveSystem.data.settings.skinColor, uiColor: SaveSystem.data.settings.uiColor
                    }
                });
            }
        }
        const now = performance.now();
        for (const id in this._lastReceiveTime) {
            if (id === this.myId) continue;
            if (now - this._lastReceiveTime[id] > 12000) {
                if (this.isHost) { const peerId = Object.keys(this.peerToPlayer).find(p => this.peerToPlayer[p] === id); if (peerId) this.handleDisconnect(peerId); }
            }
        }
        for (const id in this.players) {
            if (id === this.myId) continue;
            const pData = this.players[id];
            if (!pData.state || !pData.state.pos || pData.state.pos.some(v => !Number.isFinite(v))) continue;
            let mesh = this.game.remoteMeshes[id];
            if (!mesh) {
                mesh = buildRemoteAvatar(pData.name, pData.skinColor, pData.uiColor);
                this.game.scene.add(mesh);
                this.game.remoteMeshes[id] = mesh;
                this._updateRemoteWeapon(mesh, pData.state.weapon || 'rifle', pData.state.weaponCamo || 'default');
            }
            const targetPos = new THREE.Vector3(...pData.state.pos);
            const targetYaw = pData.state.yaw || 0;
            const lerpF = 1 - Math.exp(-25 * dt);
            mesh.position.lerp(targetPos, lerpF);
            let yawD = targetYaw - mesh.rotation.y;
            while (yawD > Math.PI) yawD -= Math.PI * 2;
            while (yawD < -Math.PI) yawD += Math.PI * 2;
            mesh.rotation.y += yawD * lerpF;
            const isAlive = pData.state.alive !== false;
            if (!isAlive) { mesh.rotation.z = damp(mesh.rotation.z, Math.PI / 2, 6, dt); mesh.position.y = damp(mesh.position.y, targetPos.y - 0.7, 4, dt); }
            else { mesh.rotation.z = damp(mesh.rotation.z, 0, 8, dt); }
            if (pData.state.tkFreezeTimer > 0) {
                mesh.rotation.x = Math.sin(performance.now() * .01) * 0.16;
                mesh.position.y += Math.sin(performance.now() * .01) * 0.08;
                if (mesh.userData.tkRing) {
                    mesh.userData.tkRing.visible = true;
                    mesh.userData.tkRing.rotation.y += dt * 4;
                }
            } else {
                mesh.rotation.x = damp(mesh.rotation.x, 0, 10, dt);
                if (mesh.userData.tkRing) mesh.userData.tkRing.visible = false;
            }
            if (mesh.userData.currentWeapon !== pData.state.weapon || mesh.userData.currentCamo !== (pData.state.weaponCamo || 'default')) this._updateRemoteWeapon(mesh, pData.state.weapon || 'rifle', pData.state.weaponCamo || 'default');
            this._updateRemoteAnimation(mesh, pData.state, dt);
        }
    }
    _updateRemoteWeapon(mesh, kind, camo) {
        if (mesh.userData.weaponMesh) {
            mesh.remove(mesh.userData.weaponMesh);
            mesh.userData.weaponMesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (Array.isArray(o.material)) o.material.forEach(m => m.dispose()); else o.material.dispose(); } });
        }
        const wm = buildWeaponMesh(kind || 'rifle', camo || 'default', false);
        wm.scale.set(0.65, 0.65, 0.65);
        wm.position.set(0.28, 1.05, -0.28);
        wm.rotation.set(0, 0, 0);
        mesh.add(wm);
        mesh.userData.weaponMesh = wm;
        mesh.userData.currentWeapon = kind;
        mesh.userData.currentCamo = camo || 'default';
    }
    _updateRemoteAnimation(mesh, state, dt) {
        const vx = state.vel ? state.vel[0] : 0, vz = state.vel ? state.vel[2] : 0;
        const hSpeed = Math.hypot(vx, vz);
        if (state.isSliding) mesh.rotation.x = damp(mesh.rotation.x, 0.5, 10, dt);
        else if (!state.tkFreezeTimer) mesh.rotation.x = damp(mesh.rotation.x, 0, 10, dt);
        const legs = mesh.userData.legs;
        if (legs && state.alive !== false) {
            if (hSpeed > 0.5 && state.onGround !== false) {
                mesh.userData.walkPhase = (mesh.userData.walkPhase || 0) + dt * hSpeed * 2.5;
                const sw = Math.sin(mesh.userData.walkPhase) * 0.6;
                if (legs[0]) legs[0].rotation.x = sw;
                if (legs[1]) legs[1].rotation.x = -sw;
                const arms = mesh.userData.arms;
                if (arms) { if (arms[0]) arms[0].rotation.x = -sw * 0.5; if (arms[1]) arms[1].rotation.x = sw * 0.5; }
            } else {
                if (legs[0]) legs[0].rotation.x = damp(legs[0].rotation.x, 0, 10, dt);
                if (legs[1]) legs[1].rotation.x = damp(legs[1].rotation.x, 0, 10, dt);
            }
            if (!state.onGround && state.alive !== false) {
                if (legs[0]) legs[0].rotation.x = damp(legs[0].rotation.x, -0.4, 8, dt);
                if (legs[1]) legs[1].rotation.x = damp(legs[1].rotation.x, 0.4, 8, dt);
            }
        }
    }
    updateLeaderboard() {
        const list = Object.keys(this.players).map(id => { const p = this.players[id]; return { id, name: p.name, kills: p.kills || 0, deaths: p.deaths || 0, isHost: p.isHost }; });
        list.sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
        const tbody = document.getElementById('lbBody'); if (!tbody) return; tbody.innerHTML = '';
        list.forEach((p, i) => {
            const tr = document.createElement('tr');
            if (p.id === this.myId) tr.className = 'you';
            const kd = p.deaths === 0 ? p.kills.toFixed(2) : (p.kills / p.deaths).toFixed(2);
            const hostTag = p.isHost ? '<span class="host-tag">HOST</span>' : '';
            tr.innerHTML = `<td>#${i + 1}</td><td>${p.name} ${hostTag}</td><td>${p.kills}</td><td>${p.deaths}</td><td>${kd}</td><td>${p.isHost ? 'HOST' : 'CLIENT'}</td>`;
            tbody.appendChild(tr);
        });
    }
    _probeRoom(code) {
        return new Promise((resolve) => {
            if (typeof Peer === 'undefined') { resolve(null); return; }
            let peer;
            try { peer = new Peer(); } catch (e) { resolve(null); return; }
            let done = false;
            const finish = (r) => { if (done) return; done = true; try { peer.destroy(); } catch (e) { } resolve(r); };
            peer.on('open', () => {
                let conn;
                try { conn = peer.connect(code, { reliable: true }); } catch (e) { finish(null); return; }
                const to = setTimeout(() => finish(null), 2500);
                conn.on('open', () => {
                    try { conn.send({ type: 'PUBLIC_PROBE', timestamp: Date.now() }); } catch (e) { }
                    conn.on('data', (data) => {
                        if (data.type === 'PUBLIC_PROBE_RESPONSE') { clearTimeout(to); finish({ code, mode: data.mode, map: data.map, players: data.players, maxPlayers: data.maxPlayers, hostName: data.hostName, ping: Math.max(0, Date.now() - data.timestamp) }); }
                    });
                });
                conn.on('error', () => finish(null));
            });
            peer.on('error', () => finish(null));
        });
    }
    async refreshPublicServers() {
        const body = document.getElementById('srvBody');
        const status = document.getElementById('publicStatus');
        if (status) status.textContent = 'Scanning ' + PUBLIC_ROOM_IDS.length + ' slots…';
        if (body) body.innerHTML = '<tr><td colspan="5" class="offline">Scanning…</td></tr>';
        const results = await Promise.all(PUBLIC_ROOM_IDS.map(c => this._probeRoom(c)));
        const rooms = results.filter(r => r !== null);
        if (status) status.textContent = rooms.length + ' active public ' + (rooms.length === 1 ? 'server' : 'servers');
        if (!body) return;
        body.innerHTML = '';
        if (rooms.length === 0) { body.innerHTML = '<tr><td colspan="5" class="offline">No public servers detected. Host one!</td></tr>'; return; }
        for (const r of rooms) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${r.hostName || r.code}</td><td>${r.mode}</td><td>${r.map.toUpperCase()}</td><td>${r.players}/${r.maxPlayers}</td><td class="ping">${r.ping}ms</td>`;
            tr.addEventListener('click', () => { this.game.isMultiplayer = true; document.getElementById('mpPanel').classList.add('hidden'); this.join(r.code); });
            body.appendChild(tr);
        }
    }
}

/* ===== WORLD & ARENAS ===== */
class World {
    constructor(scene, mapId) {
        this.scene = scene; this.colliders = []; this.meshes = []; this.killY = -30;
        this.botSpawns = []; this.jumpPads = []; this.barrels = []; this.supplyCrates = [];
        this.mapId = mapId || 'blacksite';
        this.playerSpawn = new THREE.Vector3(0, .2, 26);
        this.spawnPoints = [];
        this._build();
    }
    _addBox(w, h, d, x, y, z, mat, noCollide = false) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
        this.scene.add(mesh); this.meshes.push(mesh);
        if (!noCollide) this.colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(w, h, d)));
        const indestructible = (mat === this.mats?.wall) || (mat === this.mats?.floor);
        mesh.userData.destructible = !indestructible;
        mesh.userData.originalPosition = mesh.position.clone();
        mesh.userData.originalScale = mesh.scale.clone();
        return mesh;
    }
    _addRamp(w, rise, run, x, yBase, z, dirAxis, dirSign, mat) {
        const steps = Math.max(4, Math.ceil(rise / 0.3));
        const stepH = rise / steps;
        const stepL = run / steps;
        for (let i = 0; i < steps; i++) {
            const h = stepH * (i + 1);
            const offset = -run / 2 + stepL * (i + 0.5);
            if (dirAxis === 'z') {
                this.colliders.push(new THREE.Box3().setFromCenterAndSize(
                    new THREE.Vector3(x, yBase + h / 2, z + offset * dirSign),
                    new THREE.Vector3(w, h, stepL + 0.08)
                ));
            } else {
                this.colliders.push(new THREE.Box3().setFromCenterAndSize(
                    new THREE.Vector3(x + offset * dirSign, yBase + h / 2, z),
                    new THREE.Vector3(stepL + 0.08, h, w)
                ));
            }
        }
        const slopeLen = Math.hypot(rise, run);
        const angle = Math.atan2(rise, run);
        const rampMesh = new THREE.Mesh(
            new THREE.BoxGeometry(dirAxis === 'z' ? w : slopeLen, 0.24, dirAxis === 'z' ? slopeLen : w),
            mat
        );
        rampMesh.position.set(x, yBase + rise / 2, z);
        if (dirAxis === 'z') rampMesh.rotation.x = -angle * dirSign;
        else rampMesh.rotation.z = angle * dirSign;
        rampMesh.castShadow = true;
        rampMesh.receiveShadow = true;
        this.scene.add(rampMesh);
        this.meshes.push(rampMesh);
        return rampMesh;
    }
    _addBunker(x, y, z, rotY = 0, mats) {
        const g = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.35, 1.1), mats.crate);
        base.position.y = 0.675; base.castShadow = true; base.receiveShadow = true; g.add(base);
        const visorStrip = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 1.16), mats.ember);
        visorStrip.position.y = 1.15; g.add(visorStrip);
        const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.65, 1.15), mats.pillar);
        wingL.position.set(-1.95, 0.825, 0.1); wingL.castShadow = true; g.add(wingL);
        const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.65, 1.15), mats.pillar);
        wingR.position.set(1.95, 0.825, 0.1); wingR.castShadow = true; g.add(wingR);
        g.position.set(x, y, z);
        g.rotation.y = rotY;
        this.scene.add(g);
        const box = new THREE.Box3().setFromObject(g);
        this.colliders.push(box);
        this.meshes.push(base, wingL, wingR);
        return g;
    }
    _addBarrel(x, y, z) {
        const g = new THREE.Group();
        g.position.set(x, y + 0.65, z);
        const cyl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.42, 0.42, 1.3, 14),
            new THREE.MeshStandardMaterial({ color: 0x8f1a1a, metalness: 0.65, roughness: 0.35 })
        );
        cyl.castShadow = true; cyl.receiveShadow = true;
        const band = new THREE.Mesh(
            new THREE.CylinderGeometry(0.435, 0.435, 0.24, 14),
            new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff3b00, emissiveIntensity: 2.2 })
        );
        g.add(cyl, band);
        const barrelData = { mesh: g, cyl, pos: new THREE.Vector3(x, y + 0.65, z), alive: true, respawnTimer: 0 };
        cyl.userData.barrel = barrelData;
        band.userData.barrel = barrelData;
        this.scene.add(g);
        this.meshes.push(cyl);
        this.barrels.push(barrelData);
    }
    _addSupplyCrate(x, y, z) {
        const g = new THREE.Group();
        g.position.set(x, y + 0.4, z);
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(1.1, 0.55, 0.75),
            new THREE.MeshStandardMaterial({ color: 0x1a2634, metalness: 0.7, roughness: 0.3 })
        );
        const holo = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.24, 0),
            new THREE.MeshBasicMaterial({ color: 0x3fe08a, wireframe: true })
        );
        holo.position.y = 0.65;
        g.add(base, holo);
        this.scene.add(g);
        this.supplyCrates.push({ mesh: g, holo, pos: new THREE.Vector3(x, y + 0.4, z), cooldown: 0 });
    }
    _addJumpPad(x, y, z, boostY = 22.5, forwardBoost = 5.5, colorHex = 0xff8c24) {
        const g = new THREE.Group();
        g.position.set(x, y, z);

        const baseGeo = new THREE.CylinderGeometry(1.75, 2.0, 0.24, 8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x161c24, metalness: 0.85, roughness: 0.3 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.12;
        base.receiveShadow = true;
        g.add(base);

        const coreGeo = new THREE.CylinderGeometry(1.22, 1.22, 0.26, 16);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x091018,
            emissive: colorHex,
            emissiveIntensity: 3.4,
            metalness: 0.4,
            roughness: 0.2
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = 0.14;
        g.add(core);

        const finMat = new THREE.MeshStandardMaterial({ color: 0x2a3544, metalness: 0.8, roughness: 0.35 });
        for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2 + Math.PI / 4;
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.65), finMat);
            fin.position.set(Math.cos(a) * 1.68, 0.22, Math.sin(a) * 1.68);
            fin.rotation.y = -a + Math.PI / 2;
            fin.rotation.x = 0.28;
            g.add(fin);
        }

        const rings = [];
        for (let i = 0; i < 3; i++) {
            const rGeo = new THREE.TorusGeometry(1.3 - i * 0.16, 0.035, 8, 24);
            const rMat = new THREE.MeshBasicMaterial({
                color: colorHex,
                transparent: true,
                opacity: 0.85,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const ring = new THREE.Mesh(rGeo, rMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.3 + i * 0.55;
            g.add(ring);
            rings.push(ring);
        }

        const beamGeo = new THREE.CylinderGeometry(0.95, 1.25, 2.6, 16, 1, true);
        const beamMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.14,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.y = 1.4;
        g.add(beam);

        const light = new THREE.PointLight(colorHex, 10, 12, 2);
        light.position.y = 1.2;
        g.add(light);

        this.scene.add(g);
        this.meshes.push(base);
        this.jumpPads.push({
            pos: new THREE.Vector3(x, y + 0.15, z),
            boostY,
            forwardBoost,
            rings,
            core,
            beam,
            light,
            colorHex,
            phase: rand(0, Math.PI * 2),
            cooldown: 0
        });
    }
    _build() {
        const scene = this.scene, map = this.mapId;
        const themes = {
            blacksite: { bg: 0x0e1828, fog: 0x0e1828, ambient: 0x7090b0, sun: 0xfff5e0, fill: 0x50a0ff, rim: 0xff9040, ember: 0xff7a1a, ice: 0x40d0ff, skyTop: 0x566c96, skyBot: 0x202838, floorHex: '#2b3646', wallHex: '#394658', accentHex: '#ff7a1a' },
            foundry: { bg: 0x280d06, fog: 0x280d06, ambient: 0xa07050, sun: 0xffe0b0, fill: 0xff7030, rim: 0xffb070, ember: 0xff8c1a, ice: 0xffc850, skyTop: 0xc07048, skyBot: 0x381812, floorHex: '#332622', wallHex: '#47332d', accentHex: '#ff8c1a' },
            abyss: { bg: 0x130728, fog: 0x130728, ambient: 0x8060a0, sun: 0xf0c0ff, fill: 0xb050ff, rim: 0x40e0ff, ember: 0xb050ff, ice: 0x40e0ff, skyTop: 0x7a42b8, skyBot: 0x180a28, floorHex: '#1f1933', wallHex: '#2a2146', accentHex: '#40e0ff' },
            void: { bg: 0x030208, fog: 0x030208, ambient: 0x4a466e, sun: 0x9090ff, fill: 0x00ffff, rim: 0xff00ff, ember: 0xaa00ff, ice: 0x00ffff, skyTop: 0x140d28, skyBot: 0x020105, floorHex: '#161422', wallHex: '#221e34', accentHex: '#aa00ff' },
            zenith: { bg: 0x26384a, fog: 0x26384a, ambient: 0x8aa8c8, sun: 0xffffff, fill: 0xffaa00, rim: 0x00b8ff, ember: 0xffaa00, ice: 0x00b8ff, skyTop: 0x7a9ec2, skyBot: 0x1d2b3a, floorHex: '#344252', wallHex: '#45566b', accentHex: '#00b8ff' },
        };
        const theme = themes[map] || themes.blacksite;
        scene.background = new THREE.Color(theme.bg);
        scene.fog = new THREE.FogExp2(theme.fog, 0.0082);
        scene.add(new THREE.AmbientLight(theme.ambient, 1.35));
        scene.add(new THREE.HemisphereLight(theme.skyTop, theme.skyBot, 1.45));
        const sun = new THREE.DirectionalLight(theme.sun, 2.5); sun.position.set(30, 48, 22); sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -60; sun.shadow.camera.right = 60; sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
        sun.shadow.camera.far = 160; sun.shadow.bias = -0.0008; scene.add(sun);
        const fill1 = new THREE.DirectionalLight(theme.fill, 1.3); fill1.position.set(-22, 20, -24); scene.add(fill1);
        const rim1 = new THREE.DirectionalLight(theme.rim, 1.0); rim1.position.set(0, 15, 40); scene.add(rim1);
        const over = new THREE.PointLight(theme.fill, 9, 85, 2); over.position.set(0, 26, 0); scene.add(over);
        const emberA = new THREE.PointLight(theme.ember, 15, 38, 2); emberA.position.set(0, 2.5, 26); scene.add(emberA);
        const emberB = new THREE.PointLight(theme.ember, 15, 38, 2); emberB.position.set(0, 2.5, -26); scene.add(emberB);
        const iceA = new THREE.PointLight(theme.ice, 13, 38, 2); iceA.position.set(26, 2.5, 0); scene.add(iceA);
        const iceB = new THREE.PointLight(theme.ice, 13, 38, 2); iceB.position.set(-26, 2.5, 0); scene.add(iceB);

        const mats = {
            floor: new THREE.MeshStandardMaterial({ map: getArenaTexture('floor', theme.floorHex, theme.accentHex, 12, 12), metalness: .55, roughness: .62 }),
            wall: new THREE.MeshStandardMaterial({ map: getArenaTexture('wall', theme.wallHex, theme.accentHex, 10, 2), metalness: .65, roughness: .52 }),
            crate: new THREE.MeshStandardMaterial({ map: getArenaTexture('crate', '#3c4858', theme.accentHex, 1, 1), metalness: .48, roughness: .62 }),
            walk: new THREE.MeshStandardMaterial({ map: getArenaTexture('walk', '#445466', theme.accentHex, 4, 4), metalness: .78, roughness: .36 }),
            pillar: new THREE.MeshStandardMaterial({ map: getArenaTexture('wall', '#2f3946', theme.accentHex, 2, 3), metalness: .72, roughness: .45 }),
            ember: new THREE.MeshStandardMaterial({ color: 0x120a05, emissive: theme.ember, emissiveIntensity: 3.2 }),
            ice: new THREE.MeshStandardMaterial({ color: 0x05131a, emissive: theme.ice, emissiveIntensity: 3.0 }),
            glass: new THREE.MeshStandardMaterial({ color: theme.ice, emissive: theme.ice, emissiveIntensity: 0.45, transparent: true, opacity: 0.32, metalness: 0.9, roughness: 0.1 }),
            lava: new THREE.MeshStandardMaterial({ map: getArenaTexture('lava', '#3a0800', '#ff6600', 4, 12), emissive: 0xff4500, emissiveIntensity: 2.2, roughness: 0.8 })
        };
        this.mats = mats;
        const wallH = 12;

        if (map === 'abyss') {
            const abyss = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshBasicMaterial({ color: 0x050210 }));
            abyss.rotation.x = -Math.PI / 2; abyss.position.y = -28; scene.add(abyss);
            const coreOrb = new THREE.Mesh(new THREE.OctahedronGeometry(7, 1), mats.ice);
            coreOrb.position.set(0, -18, 0); scene.add(coreOrb); this._spinProp = coreOrb;

            this._addBox(64, wallH, 1, 0, wallH / 2, 32, mats.wall);
            this._addBox(64, wallH, 1, 0, wallH / 2, -32, mats.wall);
            this._addBox(1, wallH, 64, 32, wallH / 2, 0, mats.wall);
            this._addBox(1, wallH, 64, -32, wallH / 2, 0, mats.wall);

            for (const [ix, iz] of [[0, -19], [0, 19], [-19, 0], [19, 0]]) {
                this._addBox(14, 0.8, 14, ix, -0.2, iz, mats.floor);
                this._addBox(14.3, 0.14, 0.25, ix, 0.22, iz + 7, mats.ice, true);
                this._addBox(14.3, 0.14, 0.25, ix, 0.22, iz - 7, mats.ice, true);
                this._addBox(0.25, 0.14, 14.3, ix + 7, 0.22, iz, mats.ice, true);
                this._addBox(0.25, 0.14, 14.3, ix - 7, 0.22, iz, mats.ice, true);
            }
            this._addBunker(0, 0.2, -21, 0, mats);
            this._addBunker(0, 0.2, 21, Math.PI, mats);
            this._addBunker(-21, 0.2, 0, Math.PI / 2, mats);
            this._addBunker(21, 0.2, 0, -Math.PI / 2, mats);

            for (const [dx, dz] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) {
                this._addBox(7.5, 0.7, 7.5, dx, 0.5, dz, mats.walk);
                this._addBox(1.4, 2.4, 1.4, dx, 2.0, dz, mats.pillar);
            }

            this._addBox(3.4, 0.3, 9.5, 0, 0.4, -11.5, mats.glass);
            this._addBox(3.4, 0.3, 9.5, 0, 0.4, 11.5, mats.glass);
            this._addBox(9.5, 0.3, 3.4, -11.5, 0.4, 0, mats.glass);
            this._addBox(9.5, 0.3, 3.4, 11.5, 0.4, 0, mats.glass);

            this._addRamp(3.4, 2.2, 4.5, 0, 0.4, -8.2, 'z', 1, mats.walk);
            this._addRamp(3.4, 2.2, 4.5, 0, 0.4, 8.2, 'z', -1, mats.walk);
            this._addRamp(3.4, 2.2, 4.5, -8.2, 0.4, 0, 'x', 1, mats.walk);
            this._addRamp(3.4, 2.2, 4.5, 8.2, 0.4, 0, 'x', -1, mats.walk);

            this._addBox(11, 0.8, 11, 0, 2.2, 0, mats.walk);
            for (const [px, pz] of [[-4.2, -4.2], [4.2, -4.2], [-4.2, 4.2], [4.2, 4.2]]) {
                this._addBox(1.1, 6.5, 1.1, px, 5.8, pz, mats.pillar);
                this._addBox(1.2, 0.2, 1.2, px, 8.8, pz, mats.ember, true);
            }
            this._addBox(9.6, 0.5, 1.0, 0, 9.2, -4.2, mats.walk);
            this._addBox(9.6, 0.5, 1.0, 0, 9.2, 4.2, mats.walk);

            for (const [sx, sz] of [[-15, -15], [15, -15], [-15, 15], [15, 15]]) {
                this._addBox(6.5, 0.5, 6.5, sx, 6.5, sz, mats.walk);
                this._addBox(6.5, 1.1, 0.3, sx, 7.3, sz + (sz > 0 ? -3.1 : 3.1), mats.glass);
            }

            this._addJumpPad(0, 2.6, 0, 24, 6, 0x40e0ff);
            for (const [px, pz] of [[-19, 0], [19, 0], [0, -19], [0, 19]]) {
                this._addJumpPad(px, 0.2, pz, 22, 7.5, 0xb050ff);
            }

            this._addBarrel(-3.5, 0.2, -16);
            this._addBarrel(3.5, 0.2, 16);
            this._addSupplyCrate(-19, 0.2, -4);
            this._addSupplyCrate(19, 0.2, 4);

            this.playerSpawn.set(-19, 0.3, 4);
            this.spawnPoints = [new THREE.Vector3(-19, 0.3, 4), new THREE.Vector3(19, 0.3, -4), new THREE.Vector3(4, 0.3, -19), new THREE.Vector3(-4, 0.3, 19), new THREE.Vector3(-14, 1.0, -14), new THREE.Vector3(14, 1.0, 14)];
            this.botSpawns = [...this.spawnPoints];

        } else if (map === 'foundry') {
            this._addBox(22, 1, 60, 0, -.5, 0, mats.floor);
            this._addBox(14, 1, 60, -23, -.5, 0, mats.floor);
            this._addBox(14, 1, 60, 23, -.5, 0, mats.floor);
            this._addBox(5, 0.4, 58, -13.5, -0.7, 0, mats.lava);
            this._addBox(5, 0.4, 58, 13.5, -0.7, 0, mats.lava);
            const lavaGlowL = new THREE.PointLight(0xff5500, 16, 32, 2); lavaGlowL.position.set(-13.5, 1.5, 0); scene.add(lavaGlowL);
            const lavaGlowR = new THREE.PointLight(0xff5500, 16, 32, 2); lavaGlowR.position.set(13.5, 1.5, 0); scene.add(lavaGlowR);

            for (const bz of [-16, 0, 16]) {
                this._addBox(6.2, 0.35, 4.4, -13.5, 0.1, bz, mats.walk);
                this._addBox(6.2, 0.35, 4.4, 13.5, 0.1, bz, mats.walk);
                this._addBox(6.2, 0.15, 0.2, -13.5, 0.32, bz + 2.1, mats.ember, true);
                this._addBox(6.2, 0.15, 0.2, 13.5, 0.32, bz - 2.1, mats.ember, true);
            }

            this._addBox(60, wallH, 1, 0, wallH / 2, 30, mats.wall);
            this._addBox(60, wallH, 1, 0, wallH / 2, -30, mats.wall);
            this._addBox(1, wallH, 60, 30, wallH / 2, 0, mats.wall);
            this._addBox(1, wallH, 60, -30, wallH / 2, 0, mats.wall);

            for (const [tx, tz] of [[-22, -18], [22, -18], [-22, 18], [22, 18]]) {
                const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 7.5, 16), mats.pillar);
                tank.position.set(tx, 3.75, tz); tank.castShadow = true; tank.receiveShadow = true; scene.add(tank); this.meshes.push(tank);
                this.colliders.push(new THREE.Box3().setFromObject(tank));
                tank.userData.destructible = true;
                tank.userData.originalPosition = tank.position.clone();
                tank.userData.originalScale = tank.scale.clone();
                const ventRing = new THREE.Mesh(new THREE.CylinderGeometry(2.85, 2.85, 0.45, 16), mats.ember);
                ventRing.position.set(tx, 3.2, tz); scene.add(ventRing);
            }

            this._addBox(15, 0.6, 15, 0, 3.0, 0, mats.walk);
            this._addRamp(4.2, 3.2, 7.5, 0, 0.0, 11.2, 'z', -1, mats.walk);
            this._addRamp(4.2, 3.2, 7.5, 0, 0.0, -11.2, 'z', 1, mats.walk);
            this._addBox(16, 0.4, 3.6, -15.5, 3.1, 0, mats.walk);
            this._addBox(16, 0.4, 3.6, 15.5, 3.1, 0, mats.walk);
            this._addBunker(0, 3.3, -4.5, 0, mats);
            this._addBunker(0, 3.3, 4.5, Math.PI, mats);

            for (let i = -2; i <= 2; i++) {
                const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, 58, 10), mats.pillar);
                pipe.rotation.z = Math.PI / 2; pipe.position.set(0, 9.2, i * 10); scene.add(pipe); this.meshes.push(pipe);
            }

            for (const [cx, cy, cz, cw, ch, cd] of [
                [-6, 0, -21, 5.5, 2.8, 2.6], [6, 0, 21, 5.5, 2.8, 2.6],
                [-23, 0, -6, 2.8, 2.6, 5.2], [23, 0, 6, 2.8, 2.6, 5.2],
                [-7, 0, 11, 2.6, 1.8, 2.6], [7, 0, -11, 2.6, 1.8, 2.6]
            ]) this._addBox(cw, ch, cd, cx, cy + ch / 2, cz, mats.crate);

            this._addJumpPad(0, 3.3, 0, 22, 6, 0xff8c1a);
            this._addJumpPad(-23, 0.0, 0, 23, 7, 0xffaa33);
            this._addJumpPad(23, 0.0, 0, 23, 7, 0xffaa33);

            this._addBarrel(-4, 0, 14);
            this._addBarrel(4, 0, -14);
            this._addSupplyCrate(-23, 0, 6);
            this._addSupplyCrate(23, 0, -6);

            this.playerSpawn.set(0, .2, 24);
            this.spawnPoints = [new THREE.Vector3(-23, .2, -12), new THREE.Vector3(23, .2, -12), new THREE.Vector3(-23, .2, 12), new THREE.Vector3(23, .2, 12), new THREE.Vector3(0, .2, 24), new THREE.Vector3(0, .2, -24)];
            this.botSpawns = [...this.spawnPoints];

        } else if (map === 'void') {
            const voidScene = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshBasicMaterial({ color: 0x010004 }));
            voidScene.rotation.x = -Math.PI / 2; voidScene.position.y = -30; scene.add(voidScene);

            this._addBox(28, 1.0, 28, 0, 0, 0, mats.floor);
            this._addBox(20, 0.8, 20, 0, 0.9, 0, mats.walk);
            this._addBox(12, 0.8, 12, 0, 1.7, 0, mats.walk);
            this._addBox(28.4, 0.14, 0.3, 0, 0.55, 14, mats.ice, true);
            this._addBox(28.4, 0.14, 0.3, 0, 0.55, -14, mats.ice, true);
            this._addBox(0.3, 0.14, 28.4, 14, 0.55, 0, mats.ember, true);
            this._addBox(0.3, 0.14, 28.4, -14, 0.55, 0, mats.ember, true);

            for (const [px, pz] of [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]]) {
                this._addBox(1.2, 5.5, 1.2, px, 4.8, pz, mats.pillar);
                this._addBox(1.3, 0.25, 1.3, px, 7.6, pz, mats.ember, true);
            }
            this._addBox(10.5, 0.6, 1.2, 0, 7.8, -4.5, mats.walk);
            this._addBox(10.5, 0.6, 1.2, 0, 7.8, 4.5, mats.walk);
            this._addBunker(0, 2.1, -3.2, 0, mats);
            this._addBunker(0, 2.1, 3.2, Math.PI, mats);

            for (const [bx, bz] of [[-21, -21], [21, -21], [-21, 21], [21, 21]]) {
                this._addBox(11, 1.0, 11, bx, 1.8, bz, mats.walk);
                this._addBox(11.3, 0.15, 0.25, bx, 2.35, bz + 5.5, mats.ember, true);
                this._addBox(11.3, 0.15, 0.25, bx, 2.35, bz - 5.5, mats.ember, true);
                const obelisk = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), mats.ember);
                obelisk.position.set(bx * 1.28, 5.5, bz * 1.28);
                obelisk.castShadow = true;
                scene.add(obelisk);
                this.meshes.push(obelisk);

                const dirX = Math.sign(bx), dirZ = Math.sign(bz);
                for (let step = 1; step <= 3; step++) {
                    const bxStep = dirX * (8.5 + step * 3.1);
                    const bzStep = dirZ * (8.5 + step * 3.1);
                    this._addBox(3.2, 0.32, 3.2, bxStep, 1.3 + step * 0.15, bzStep, mats.glass);
                }
                this._addJumpPad(bx, 2.35, bz, 25, 8.5, 0xaa00ff);
            }

            for (const [sx, sz] of [[0, -29], [0, 29], [-29, 0], [29, 0]]) {
                this._addBox(8.5, 0.7, 6.5, sx, 6.2, sz, mats.walk);
                this._addBox(8.5, 1.15, 0.25, sx, 7.1, sz + (sz > 0 ? -3.1 : 3.1), mats.glass);
                this._addBox(8.7, 0.14, 0.2, sx, 6.6, sz, mats.ice, true);
            }

            this._addJumpPad(0, 2.15, 0, 26, 7.0, 0x00ffff);
            this._addBarrel(-3.2, 2.1, 0);
            this._addBarrel(3.2, 2.1, 0);
            this._addSupplyCrate(-21, 2.3, 21);
            this._addSupplyCrate(21, 2.3, -21);

            this.playerSpawn.set(-21, 2.5, -21);
            this.spawnPoints = [
                new THREE.Vector3(-21, 2.5, -21),
                new THREE.Vector3(21, 2.5, 21),
                new THREE.Vector3(-21, 2.5, 21),
                new THREE.Vector3(21, 2.5, -21),
                new THREE.Vector3(0, 2.3, -9),
                new THREE.Vector3(0, 2.3, 9)
            ];
            this.botSpawns = [...this.spawnPoints];

        } else if (map === 'zenith') {
            this._addBox(64, 1, 64, 0, -0.5, 0, mats.floor);
            this._addBox(64, wallH, 1, 0, wallH / 2, 32, mats.wall);
            this._addBox(64, wallH, 1, 0, wallH / 2, -32, mats.wall);
            this._addBox(1, wallH, 64, 32, wallH / 2, 0, mats.wall);
            this._addBox(1, wallH, 64, -32, wallH / 2, 0, mats.wall);

            this._addBox(16, 0.8, 16, 0, 3.4, 0, mats.walk);
            this._addRamp(4.4, 3.6, 8.0, 0, 0, 12.0, 'z', -1, mats.walk);
            this._addRamp(4.4, 3.6, 8.0, 0, 0, -12.0, 'z', 1, mats.walk);
            this._addRamp(4.4, 3.6, 8.0, 12.0, 0, 0, 'x', -1, mats.walk);
            this._addRamp(4.4, 3.6, 8.0, -12.0, 0, 0, 'x', 1, mats.walk);

            this._addBox(28, 0.5, 4.2, 0, 7.2, -18, mats.walk);
            this._addBox(28, 0.5, 4.2, 0, 7.2, 18, mats.walk);
            this._addBox(4.2, 0.5, 28, -18, 7.2, 0, mats.walk);
            this._addBox(4.2, 0.5, 28, 18, 7.2, 0, mats.walk);
            this._addBox(28, 1.0, 0.25, 0, 7.9, -15.9, mats.glass);
            this._addBox(28, 1.0, 0.25, 0, 7.9, 15.9, mats.glass);

            for (const [px, pz] of [[-18, -18], [18, -18], [-18, 18], [18, 18]]) {
                this._addBox(2.4, 8.2, 2.4, px, 4.1, pz, mats.pillar);
                this._addBox(2.6, 0.25, 2.6, px, 7.5, pz, mats.ember, true);
            }

            this._addBunker(0, 3.8, -5.5, 0, mats);
            this._addBunker(0, 3.8, 5.5, Math.PI, mats);
            this._addBunker(-18, 0, 0, Math.PI / 2, mats);
            this._addBunker(18, 0, 0, -Math.PI / 2, mats);

            for (const [cx, cz, cw, ch, cd] of [
                [-9, -24, 4.5, 2.2, 2.4], [9, 24, 4.5, 2.2, 2.4],
                [-24, 9, 2.4, 2.2, 4.5], [24, -9, 2.4, 2.2, 4.5]
            ]) this._addBox(cw, ch, cd, cx, ch / 2, cz, mats.crate);

            this._addJumpPad(0, 3.85, 0, 23, 6.5, 0x00b8ff);
            this._addJumpPad(-25, 0, -25, 24, 7.5, 0xffaa00);
            this._addJumpPad(25, 0, 25, 24, 7.5, 0xffaa00);

            this._addBarrel(-6, 0, 16);
            this._addBarrel(6, 0, -16);
            this._addSupplyCrate(-25, 0, 0);
            this._addSupplyCrate(25, 0, 0);

            this.playerSpawn.set(0, 0.2, 26);
            this.spawnPoints = [
                new THREE.Vector3(0, 0.2, 26),
                new THREE.Vector3(0, 0.2, -26),
                new THREE.Vector3(-26, 0.2, 0),
                new THREE.Vector3(26, 0.2, 0),
                new THREE.Vector3(-18, 7.6, -18),
                new THREE.Vector3(18, 7.6, 18)
            ];
            this.botSpawns = [...this.spawnPoints];

        } else {
            this._addBox(64, 1, 64, 0, -0.5, 0, mats.floor);
            this._addBox(64, wallH, 1, 0, wallH / 2, 32, mats.wall);
            this._addBox(64, wallH, 1, 0, wallH / 2, -32, mats.wall);
            this._addBox(1, wallH, 64, 32, wallH / 2, 0, mats.wall);
            this._addBox(1, wallH, 64, -32, wallH / 2, 0, mats.wall);

            this._addBox(63.5, 0.22, 0.2, 0, 3.8, 31.4, mats.ember, true);
            this._addBox(63.5, 0.22, 0.2, 0, 3.8, -31.4, mats.ember, true);
            this._addBox(0.2, 0.22, 63.5, 31.4, 3.8, 0, mats.ice, true);
            this._addBox(0.2, 0.22, 63.5, -31.4, 3.8, 0, mats.ice, true);

            this._addBox(14, 0.7, 14, 0, 2.8, 0, mats.walk);
            this._addRamp(4.0, 3.1, 7.2, 0, 0, 10.6, 'z', -1, mats.walk);
            this._addRamp(4.0, 3.1, 7.2, 0, 0, -10.6, 'z', 1, mats.walk);
            this._addBunker(0, 3.15, -4.6, 0, mats);
            this._addBunker(0, 3.15, 4.6, Math.PI, mats);

            this._addBox(4.8, 0.5, 34, -22, 4.2, 0, mats.walk);
            this._addBox(4.8, 0.5, 34, 22, 4.2, 0, mats.walk);
            this._addRamp(4.2, 4.4, 8.5, -22, 0, 21.2, 'z', -1, mats.walk);
            this._addRamp(4.2, 4.4, 8.5, 22, 0, -21.2, 'z', 1, mats.walk);
            this._addBox(0.25, 1.0, 34, -19.7, 4.9, 0, mats.glass);
            this._addBox(0.25, 1.0, 34, 19.7, 4.9, 0, mats.glass);

            for (const [px, pz] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) {
                this._addBox(1.8, 9.0, 1.8, px, 4.5, pz, mats.pillar);
                this._addBox(2.0, 0.22, 2.0, px, 5.2, pz, mats.ice, true);
            }
            for (const [cx, cz, cw, ch, cd] of [
                [-7, 19, 4.8, 2.2, 2.4], [7, -19, 4.8, 2.2, 2.4],
                [-14, 0, 2.6, 2.0, 5.2], [14, 0, 2.6, 2.0, 5.2],
                [-26, -12, 3.2, 2.4, 3.2], [26, 12, 3.2, 2.4, 3.2]
            ]) this._addBox(cw, ch, cd, cx, ch / 2, cz, mats.crate);

            this._addJumpPad(0, 3.2, 0, 22.5, 6.0, 0xff7a1a);
            this._addJumpPad(-26, 0, 24, 22.0, 7.0, 0x40d0ff);
            this._addJumpPad(26, 0, -24, 22.0, 7.0, 0x40d0ff);

            this._addBarrel(-5.5, 0, 14);
            this._addBarrel(5.5, 0, -14);
            this._addSupplyCrate(-26, 0, 0);
            this._addSupplyCrate(26, 0, 0);

            this.playerSpawn.set(0, 0.2, 26);
            this.spawnPoints = [
                new THREE.Vector3(0, 0.2, 26),
                new THREE.Vector3(0, 0.2, -26),
                new THREE.Vector3(-26, 0.2, 18),
                new THREE.Vector3(26, 0.2, -18),
                new THREE.Vector3(-22, 4.6, -10),
                new THREE.Vector3(22, 4.6, 10)
            ];
            this.botSpawns = [...this.spawnPoints];
        }
    }

    getSafeSpawnPoint(net) {
        const candidates = this.spawnPoints.length ? this.spawnPoints : [this.playerSpawn];
        let best = candidates[0];
        let bestMinDist = -1;
        for (const sp of candidates) {
            let minDist = 9999;
            if (net && net.players) {
                for (const id in net.players) {
                    if (id === net.myId) continue;
                    const st = net.players[id].state;
                    if (st && st.pos && st.alive !== false) {
                        const d = sp.distanceTo(new THREE.Vector3(...st.pos));
                        if (d < minDist) minDist = d;
                    }
                }
            }
            if (window.game && window.game.bots) {
                for (const b of window.game.bots) {
                    if (b.alive) {
                        const d = sp.distanceTo(b.pos);
                        if (d < minDist) minDist = d;
                    }
                }
            }
            if (minDist > bestMinDist) {
                bestMinDist = minDist;
                best = sp;
            }
        }
        return best.clone();
    }

    detonateBarrel(barrel, game) {
        if (!barrel || !barrel.alive) return;
        barrel.alive = false;
        barrel.respawnTimer = 16;
        barrel.mesh.visible = false;
        const pos = barrel.pos.clone();
        if (game && game.effects) game.effects.explosion(pos, 7.5);
        audio.explosion(pos);
        if (game) game.applyExplosionDamage(pos, 7.5, 115, 'EXPLOSIVE BARREL', true);
    }

    update(dt, game) {
        if (this._spinProp) {
            this._spinProp.rotation.y += dt * 0.45;
            this._spinProp.rotation.x += dt * 0.22;
        }
        const now = performance.now() * 0.001;
        for (const pad of this.jumpPads) {
            if (pad.cooldown > 0) pad.cooldown = Math.max(0, pad.cooldown - dt);
            pad.rings.forEach((r, idx) => {
                const cycle = (now * 1.6 + idx * 0.33) % 1;
                r.position.y = 0.28 + cycle * 1.75;
                r.scale.setScalar(1.05 - cycle * 0.35);
                r.material.opacity = (1 - cycle) * 0.85;
            });
            pad.light.intensity = 8 + Math.sin(now * 6 + pad.phase) * 3;
            if (game && game.player && game.player.alive && pad.cooldown <= 0) {
                const dx = game.player.pos.x - pad.pos.x;
                const dz = game.player.pos.z - pad.pos.z;
                const dy = Math.abs(game.player.pos.y - pad.pos.y);
                if (Math.hypot(dx, dz) < 1.85 && dy < 1.4) {
                    pad.cooldown = 0.45;
                    game.player.vel.y = pad.boostY;
                    game.player.onGround = false;
                    const fwd = new THREE.Vector3(-Math.sin(game.player.yaw), 0, -Math.cos(game.player.yaw));
                    game.player.vel.x += fwd.x * pad.forwardBoost;
                    game.player.vel.z += fwd.z * pad.forwardBoost;
                    audio.pad();
                }
            }
        }
        for (const b of this.barrels) {
            if (!b.alive) {
                b.respawnTimer -= dt;
                if (b.respawnTimer <= 0) {
                    b.alive = true;
                    b.mesh.visible = true;
                }
            }
        }
        for (const sc of this.supplyCrates) {
            sc.holo.rotation.y += dt * 2.4;
            sc.holo.position.y = 0.65 + Math.sin(now * 3.5) * 0.08;
            if (sc.cooldown > 0) {
                sc.cooldown = Math.max(0, sc.cooldown - dt);
                sc.holo.visible = false;
            } else {
                sc.holo.visible = true;
                if (game && game.player && game.player.alive && game.player.pos.distanceTo(sc.pos) < 1.8) {
                    sc.cooldown = 14;
                    game.player.health = Math.min(game.player.maxHealth, game.player.health + 35);
                    game.player.medkits = Math.min(3, game.player.medkits + 1);
                    game.player.flashbangs = Math.min(3, game.player.flashbangs + 1);
                    game.player.refillAllAmmo();
                    audio.pickup();
                    game.ui.showCenterMsg('SUPPLY RESUPPLY', '+35 HP, GADGETS & AMMO RESTORED', 1100);
                }
            }
        }
    }
}

/* ===== PROCEDURAL 3D WEAPON & CUSTOM 3D DRAGON MODEL BUILDER ===== */
function buildWeaponMesh(kind, camo = 'default', isFirstPerson = true) {
    const g = new THREE.Group();
    const camoTex = generateCamoTexture(camo);
    const isCustom = camo && camo !== 'default';
    const accentHex = isCustom ? (CAMO_COLORS[camo] || 0xff7a1a) : 0xff7a1a;

    // 1. Custom 3D Fire-Breathing Dragon Model for Firearms with 'dragon' camo
    if (camo === 'dragon' && !['knife', 'katana', 'dismantle', 'cleave'].includes(kind)) {
        const scaleMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, metalness: 0.78, roughness: 0.24 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.9, roughness: 0.16 });
        const emberMat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff3b00, emissiveIntensity: 3.4 });

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.135, 0.54), scaleMat);
        torso.position.set(0, -0.02, -0.16);
        const belly = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.048, 0.50), goldMat);
        belly.position.set(0, -0.075, -0.16);

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.03, -0.49);
        const skull = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 0.18), scaleMat);
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.06, 0.14), scaleMat);
        snout.position.set(0, 0.01, -0.12);
        const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.035, 0.13), goldMat);
        jaw.position.set(0, -0.045, -0.11);
        jaw.rotation.x = 0.22;

        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), emberMat);
        eyeL.position.set(-0.048, 0.025, -0.04);
        const eyeR = eyeL.clone();
        eyeR.position.x = 0.048;

        const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.16, 6), goldMat);
        hornL.position.set(-0.038, 0.08, 0.04);
        hornL.rotation.set(-0.6, 0, 0.22);
        const hornR = hornL.clone();
        hornR.position.x = 0.038;
        hornR.rotation.z = -0.22;

        const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.14, 8), emberMat);
        flameCore.rotation.x = -Math.PI / 2;
        flameCore.position.set(0, -0.015, -0.21);
        headGroup.add(skull, snout, jaw, eyeL, eyeR, hornL, hornR, flameCore);

        const wingMat = new THREE.MeshStandardMaterial({
            color: 0x3b0404, emissive: 0x440000, emissiveIntensity: 0.7, side: THREE.DoubleSide, roughness: 0.4
        });
        const wingL = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.05, 0.02, -0.10),
            new THREE.Vector3(-0.24, 0.13, -0.22),
            new THREE.Vector3(-0.20, 0.05, 0.08)
        ]), wingMat);
        wingL.geometry.computeVertexNormals();

        const wingR = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0.05, 0.02, -0.10),
            new THREE.Vector3(0.24, 0.13, -0.22),
            new THREE.Vector3(0.20, 0.05, 0.08)
        ]), wingMat);
        wingR.geometry.computeVertexNormals();

        for (let i = 0; i < 5; i++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.06, 4), goldMat);
            spike.position.set(0, 0.07, -0.38 + i * 0.11);
            spike.rotation.x = -0.35;
            g.add(spike);
        }

        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.22, 6), scaleMat);
        tail.rotation.x = Math.PI / 2 + 0.35;
        tail.position.set(0, -0.085, 0.18);

        g.add(torso, belly, headGroup, wingL, wingR, tail);
        if (isFirstPerson) g.traverse(o => { if (o.isMesh) o.castShadow = false; });
        return g;
    }

    // 2. Curved 7-Segment Redliner Katana
    if (kind === 'katana') {
        const bladeMat = new THREE.MeshStandardMaterial({
            color: isCustom ? 0xffffff : 0xdce4ee,
            map: isCustom ? camoTex : null,
            metalness: 0.94,
            roughness: 0.14
        });
        const edgeColor = isCustom ? (CAMO_COLORS[camo] || 0xff1e38) : 0xff1e38;
        const edgeMat = new THREE.MeshStandardMaterial({
            color: edgeColor, emissive: edgeColor, emissiveIntensity: 3.2, metalness: 0.5, roughness: 0.2
        });
        const guardMat = new THREE.MeshStandardMaterial({ color: 0x161a20, metalness: 0.88, roughness: 0.25 });
        const goldAccent = new THREE.MeshStandardMaterial({ color: 0xd49b35, metalness: 0.9, roughness: 0.2 });
        const wrapMat = new THREE.MeshStandardMaterial({ color: 0x12141a, roughness: 0.85 });
        const silkMat = new THREE.MeshStandardMaterial({ color: 0x9e1124, roughness: 0.7 });

        const tsuka = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.02, 0.34, 8), wrapMat);
        tsuka.rotation.x = Math.PI / 2;
        tsuka.position.set(0, 0, 0.17);
        g.add(tsuka);

        for (let i = 0; i < 6; i++) {
            const diamond = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.012, 0.024), silkMat);
            diamond.position.set(0, 0, 0.05 + i * 0.048);
            diamond.rotation.y = Math.PI / 4;
            g.add(diamond);
        }

        const kashira = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.019, 0.026, 8), goldAccent);
        kashira.rotation.x = Math.PI / 2;
        kashira.position.set(0, 0, 0.345);

        const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.014, 16), guardMat);
        tsuba.rotation.x = Math.PI / 2;
        const tsubaRim = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.004, 6, 18), goldAccent);
        const habaki = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.038, 0.042), goldAccent);
        habaki.position.set(0, 0.004, -0.024);
        g.add(kashira, tsuba, tsubaRim, habaki);

        const segs = 7, segLen = 0.155;
        for (let i = 0; i < segs; i++) {
            const t = i / segs;
            const curveY = t * t * 0.075;
            const curveAngle = t * 0.16;
            const taper = 1 - t * 0.24;

            const spine = new THREE.Mesh(new THREE.BoxGeometry(0.011 * taper, 0.026 * taper, segLen + 0.006), bladeMat);
            spine.position.set(0, 0.008 + curveY, -0.095 - i * segLen);
            spine.rotation.x = curveAngle;

            const edge = new THREE.Mesh(new THREE.BoxGeometry(0.005 * taper, 0.008 * taper, segLen + 0.006), edgeMat);
            edge.position.set(0, -0.008 + curveY, -0.095 - i * segLen);
            edge.rotation.x = curveAngle;
            g.add(spine, edge);
        }

        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.14, 4), edgeMat);
        tip.rotation.x = -Math.PI / 2 + 0.18;
        tip.position.set(0, 0.082, -0.095 - segs * segLen - 0.03);
        g.add(tip);

        if (isFirstPerson) g.traverse(o => { if (o.isMesh) o.castShadow = false; });
        return g;
    }

    // 3. Tactical Firearms, Launcher, Knife & Sukuna Orbs
    const bodyMat = new THREE.MeshStandardMaterial({
        map: isCustom ? camoTex : null,
        color: isCustom ? 0xffffff : 0x262f3c,
        metalness: isCustom ? 0.65 : 0.82,
        roughness: isCustom ? 0.34 : 0.26
    });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x10141a, metalness: 0.85, roughness: 0.25 });
    const glowMat = new THREE.MeshStandardMaterial({
        color: accentHex,
        emissive: accentHex,
        emissiveIntensity: isCustom ? 2.4 : 1.5
    });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b3a1a, roughness: 0.72, metalness: 0.1 });

    if (kind === 'knife') {
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.021, 0.15, 8), darkMetal);
        handle.rotation.x = Math.PI / 2;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 8, 16), glowMat);
        ring.position.set(0, 0, 0.09);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.034, 0.20), bodyMat);
        blade.position.set(0, 0.005, -0.16);
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.009, 0.19), glowMat);
        edge.position.set(0, 0.02, -0.16);
        g.add(handle, ring, blade, edge);
    } else if (kind === 'dismantle' || kind === 'cleave') {
        const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 1), glowMat);
        g.add(orb);
    } else if (kind === 'shotgun') {
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 0.38), bodyMat);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.52, 12), darkMetal);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.032, -0.42);
        const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.46, 12), darkMetal);
        magTube.rotation.x = Math.PI / 2;
        magTube.position.set(0, -0.002, -0.39);
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.065, 0.18), glowMat);
        pump.position.set(0, -0.005, -0.32);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.12, 0.26), darkMetal);
        stock.position.set(0, -0.025, 0.30);
        g.add(receiver, barrel, magTube, pump, stock);
    } else if (kind === 'sniper' || kind === 'kar98') {
        const isKar = kind === 'kar98';
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.095, 0.52), isKar ? woodMat : bodyMat);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, 0.68, 12), darkMetal);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.026, -0.56);
        const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.034, 0.08), glowMat);
        muzzleBrake.position.set(0, 0.026, -0.90);
        const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.024, 0.32, 14), darkMetal);
        scopeTube.rotation.x = Math.PI / 2;
        scopeTube.position.set(0, 0.095, -0.04);
        const scopeLens = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.01, 14), glowMat);
        scopeLens.rotation.x = Math.PI / 2;
        scopeLens.position.set(0, 0.095, -0.205);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.12, 0.30), isKar ? woodMat : darkMetal);
        stock.position.set(0, -0.02, 0.38);
        g.add(chassis, barrel, muzzleBrake, scopeTube, scopeLens, stock);
    } else if (kind === 'rocket') {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.96, 16), bodyMat);
        tube.rotation.x = Math.PI / 2;
        const frontBell = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.072, 0.12, 16), darkMetal);
        frontBell.rotation.x = Math.PI / 2;
        frontBell.position.z = -0.48;
        const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.056, 0.16, 12), glowMat);
        warhead.rotation.x = -Math.PI / 2;
        warhead.position.z = -0.54;
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.06), darkMetal);
        grip.position.set(0, -0.11, -0.12);
        const optic = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.14), glowMat);
        optic.position.set(-0.085, 0.04, -0.10);
        g.add(tube, frontBell, warhead, grip, optic);
    } else {
        const isSmg = kind === 'smg';
        const isLmg = kind === 'lmg';
        const isAk = kind === 'ak47';
        const len = isSmg ? 0.32 : isLmg ? 0.52 : 0.44;
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.105, len), bodyMat);
        const barrelLen = isSmg ? 0.22 : isLmg ? 0.46 : 0.36;
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.015, barrelLen, 12), darkMetal);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.025, -len / 2 - barrelLen / 2);

        const mag = isLmg
            ? new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.13), glowMat)
            : new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.18, 0.075), darkMetal);
        mag.position.set(isLmg ? 0.03 : 0, -0.11, -0.05);
        if (!isLmg) mag.rotation.x = isAk ? 0.28 : 0.14;

        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.24), isAk ? woodMat : darkMetal);
        stock.position.set(0, -0.018, len / 2 + 0.11);

        const railGlow = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.012, len * 0.78), glowMat);
        railGlow.position.set(0, 0.058, -0.02);

        const optic = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.038, 0.09), darkMetal);
        optic.position.set(0, 0.075, 0.02);
        const dot = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.012), glowMat);
        dot.position.set(0, 0.078, 0.02);

        g.add(receiver, barrel, mag, stock, railGlow, optic, dot);
    }

    if (isFirstPerson) {
        g.traverse(o => { if (o.isMesh) o.castShadow = false; });
    }
    return g;
}

function buildRemoteAvatar(name = 'OPERATOR', skinColor = '#e8ecf0', uiColor = '#ff7a1a') {
    const group = new THREE.Group();
    const armorMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(skinColor), metalness: 0.45, roughness: 0.45 });
    const accentMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(uiColor),
        emissive: new THREE.Color(uiColor),
        emissiveIntensity: 1.5
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x161b22, metalness: 0.7, roughness: 0.35 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.32), armorMat);
    torso.position.y = 1.08;
    torso.castShadow = true;
    torso.userData.hitZone = 'torso';
    group.add(torso);

    const chestCore = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.34), accentMat);
    chestCore.position.y = 1.18;
    group.add(chestCore);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), armorMat);
    head.position.y = 1.66;
    head.castShadow = true;
    head.userData.hitZone = 'head';
    group.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.11, 0.38), accentMat);
    visor.position.set(0, 1.68, -0.02);
    visor.userData.hitZone = 'head';
    group.add(visor);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.64, 0.18), darkMat);
    leftArm.position.set(-0.39, 1.06, 0);
    leftArm.userData.hitZone = 'limb';
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.64, 0.18), darkMat);
    rightArm.position.set(0.39, 1.06, 0);
    rightArm.userData.hitZone = 'limb';
    group.add(leftArm, rightArm);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.72, 0.22), darkMat);
    leftLeg.position.set(-0.15, 0.36, 0);
    leftLeg.userData.hitZone = 'limb';
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.72, 0.22), darkMat);
    rightLeg.position.set(0.15, 0.36, 0);
    rightLeg.userData.hitZone = 'limb';
    group.add(leftLeg, rightLeg);

    const tkRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.03, 8, 28),
        new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: 0.85 })
    );
    tkRing.rotation.x = Math.PI / 2;
    tkRing.position.y = 1.1;
    tkRing.visible = false;
    group.add(tkRing);

    if (name) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(10, 14, 20, 0.72)';
        ctx.fillRect(16, 12, 224, 40);
        ctx.strokeStyle = uiColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(16, 12, 224, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(name).slice(0, 16), 128, 32);
        const spriteTex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex, transparent: true, depthTest: false }));
        sprite.position.set(0, 2.15, 0);
        sprite.scale.set(1.8, 0.45, 1);
        group.add(sprite);
    }

    group.userData.legs = [leftLeg, rightLeg];
    group.userData.arms = [leftArm, rightArm];
    group.userData.tkRing = tkRing;
    return group;
}

/* ===== DEDICATED 3D PREVIEW RENDERER (MENU OPERATOR + ARMORY WEAPON/CAMO) ===== */
class Preview3D {
    constructor(width, height, isOperator = false) {
        this.isOperator = isOperator;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 50);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        if (!isOperator) this.renderer.domElement.className = 'shop-3d-canvas';

        this.scene.add(new THREE.AmbientLight(0x8aa8c8, 1.6));
        const key = new THREE.DirectionalLight(0xfff2e0, 2.6);
        key.position.set(3, 5, 4);
        this.scene.add(key);
        const rim = new THREE.DirectionalLight(0xff7a1a, 1.5);
        rim.position.set(-4, 2, -3);
        this.scene.add(rim);

        this.pivot = new THREE.Group();
        this.scene.add(this.pivot);
        this.rotY = isOperator ? 0.35 : 0.65;
        this.dragging = false;
        this.lastX = 0;

        const dom = this.renderer.domElement;
        dom.addEventListener('mousedown', e => { this.dragging = true; this.lastX = e.clientX; });
        addEventListener('mouseup', () => { this.dragging = false; });
        addEventListener('mousemove', e => {
            if (!this.dragging) return;
            this.rotY += (e.clientX - this.lastX) * 0.015;
            this.lastX = e.clientX;
        });

        if (isOperator) {
            this.camera.position.set(0, 1.15, 2.75);
            this.camera.lookAt(0, 1.0, 0);
        } else {
            this.camera.position.set(0, 0.12, 1.15);
            this.camera.lookAt(0, 0, 0);
        }
    }

    setWeapon(kind, camo) {
        this._clearPivot();
        const mesh = buildWeaponMesh(kind, camo, false);
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        mesh.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z, 0.25);
        const scale = 0.78 / maxDim;
        mesh.scale.setScalar(scale);
        this.pivot.add(mesh);
    }

    setOperator(skinColor, uiColor, primaryWeapon, camo) {
        this._clearPivot();
        const avatar = buildRemoteAvatar('', skinColor, uiColor);
        const wm = buildWeaponMesh(primaryWeapon || 'rifle', camo || 'default', false);
        wm.scale.set(0.68, 0.68, 0.68);
        wm.position.set(0.32, 1.05, -0.26);
        avatar.add(wm);
        this.pivot.add(avatar);
    }

    _clearPivot() {
        while (this.pivot.children.length > 0) {
            const c = this.pivot.children[0];
            this.pivot.remove(c);
            c.traverse(o => {
                if (o.geometry) o.geometry.dispose();
                if (o.material) {
                    if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
                    else o.material.dispose();
                }
            });
        }
    }

    render(dt) {
        if (!this.renderer.domElement.isConnected) return;
        if (!this.dragging) this.rotY += dt * (this.isOperator ? 0.55 : 0.95);
        this.pivot.rotation.y = this.rotY;
        this.renderer.render(this.scene, this.camera);
    }
}

/* ===== VISUAL EFFECTS & PROJECTILES SYSTEM ===== */
class EffectsSystem {
    constructor(scene) {
        this.scene = scene;
        this.items = [];
        this.rockets = [];
        this.flashbangs = [];
        this.sukunaSlashes = [];
    }

    tracer(from, to, colorHex = 0xffdd44) {
        const dir = _v1.copy(to).sub(from);
        const len = dir.length();
        if (len < 0.05) return;

        const group = new THREE.Group();
        const outerGeo = new THREE.CylinderGeometry(0.022, 0.022, len, 6);
        outerGeo.rotateX(Math.PI / 2);
        const outerMat = new THREE.MeshBasicMaterial({
            color: colorHex, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false
        });
        const coreGeo = new THREE.CylinderGeometry(0.008, 0.008, len, 5);
        coreGeo.rotateX(Math.PI / 2);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false
        });

        group.add(new THREE.Mesh(outerGeo, outerMat), new THREE.Mesh(coreGeo, coreMat));
        group.position.copy(from).lerp(to, 0.5);
        group.lookAt(to);
        this.scene.add(group);
        this.items.push({ mesh: group, life: 0.12, maxLife: 0.12, disposeGeo: true });
    }

    muzzleFlash(pos, colorHex = 0xffb347, ejectCasing = true) {
        const g = new THREE.Group();
        g.position.copy(pos);

        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.14, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        const starMat = new THREE.MeshBasicMaterial({
            color: colorHex, transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
        });
        const s1 = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.09), starMat);
        const s2 = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.55), starMat);
        s1.rotation.z = rand(0, Math.PI);
        s2.rotation.z = s1.rotation.z;
        g.add(core, s1, s2);
        this.scene.add(g);
        this.items.push({ mesh: g, life: 0.055, maxLife: 0.055, disposeGeo: true });

        if (ejectCasing) {
            const casing = new THREE.Mesh(
                new THREE.CylinderGeometry(0.011, 0.011, 0.042, 6),
                new THREE.MeshStandardMaterial({ color: 0xe6b84c, metalness: 0.9, roughness: 0.25 })
            );
            casing.position.copy(pos);
            this.scene.add(casing);
            this.items.push({
                mesh: casing,
                vel: new THREE.Vector3(rand(1.2, 2.5), rand(1.6, 2.8), rand(-0.6, 0.6)),
                gravity: 16,
                life: 0.55,
                maxLife: 0.55,
                disposeGeo: true
            });
        }
    }

    impact(pos, normal = new THREE.Vector3(0, 1, 0), isBlood = false) {
        const count = isBlood ? 10 : 8;
        const col = isBlood ? 0xff1a2e : 0xffbb44;
        for (let i = 0; i < count; i++) {
            const m = new THREE.Mesh(
                new THREE.BoxGeometry(0.065, 0.065, 0.11),
                new THREE.MeshBasicMaterial({
                    color: i % 3 === 0 ? 0xffffff : col,
                    transparent: true,
                    opacity: 1,
                    blending: isBlood ? THREE.NormalBlending : THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            m.position.copy(pos);
            this.scene.add(m);
            const vel = new THREE.Vector3(
                normal.x * rand(1.8, 5.2) + rand(-3.0, 3.0),
                Math.abs(normal.y) * rand(1.8, 5.2) + rand(0.6, 3.4),
                normal.z * rand(1.8, 5.2) + rand(-3.0, 3.0)
            );
            this.items.push({ mesh: m, vel, gravity: 15, life: 0.36, maxLife: 0.36, disposeGeo: true });
        }
    }

    explosion(pos, radius = 5.5) {
        this.impact(pos, new THREE.Vector3(0, 1, 0), false);
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.55, 16, 16),
            new THREE.MeshBasicMaterial({
                color: 0xff6a1a,
                transparent: true,
                opacity: 0.94,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        sphere.position.copy(pos);
        this.scene.add(sphere);
        this.items.push({ mesh: sphere, life: 0.42, maxLife: 0.42, scaleTo: radius * 1.45, disposeGeo: true });

        const shockwave = new THREE.Mesh(
            new THREE.RingGeometry(0.35, 0.72, 28),
            new THREE.MeshBasicMaterial({
                color: 0xffd2a6,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        shockwave.rotation.x = -Math.PI / 2;
        shockwave.position.copy(pos).add(new THREE.Vector3(0, 0.15, 0));
        this.scene.add(shockwave);
        this.items.push({ mesh: shockwave, life: 0.36, maxLife: 0.36, scaleTo: radius * 1.85, disposeGeo: true });

        for (let i = 0; i < 8; i++) {
            const smoke = new THREE.Mesh(
                new THREE.DodecahedronGeometry(rand(0.28, 0.52), 0),
                new THREE.MeshBasicMaterial({ color: 0x1a1e24, transparent: true, opacity: 0.65, depthWrite: false })
            );
            smoke.position.copy(pos).add(new THREE.Vector3(rand(-0.7, 0.7), rand(0.1, 0.6), rand(-0.7, 0.7)));
            this.scene.add(smoke);
            this.items.push({
                mesh: smoke,
                vel: new THREE.Vector3(rand(-2, 2), rand(2.5, 5.2), rand(-2, 2)),
                gravity: -1.8,
                life: 0.75,
                maxLife: 0.75,
                scaleTo: 2.2,
                disposeGeo: true
            });
        }
    }

    katanaSlashArc(origin, dir, isSuper = false, colorHex = 0xff2a3c) {
        const group = new THREE.Group();
        const r = isSuper ? 1.85 : 1.3;
        const tube = isSuper ? 0.085 : 0.048;
        const outer = new THREE.Mesh(
            new THREE.TorusGeometry(r, tube, 8, 24, Math.PI * 1.1),
            new THREE.MeshBasicMaterial({
                color: isSuper ? 0xff1e38 : (colorHex || 0x40d0ff),
                transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false
            })
        );
        const core = new THREE.Mesh(
            new THREE.TorusGeometry(r * 0.96, tube * 0.42, 6, 20, Math.PI * 0.95),
            new THREE.MeshBasicMaterial({
                color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false
            })
        );
        group.add(outer, core);
        group.position.copy(origin).addScaledVector(dir, 1.2);
        group.lookAt(origin.clone().add(dir));
        group.rotateZ(rand(-0.55, 0.55));
        this.scene.add(group);
        this.items.push({ mesh: group, life: 0.22, maxLife: 0.22, scaleTo: 1.45, disposeGeo: true });
    }

    katanaParry(pos) {
        const flash = new THREE.Mesh(
            new THREE.RingGeometry(0.25, 1.5, 28),
            new THREE.MeshBasicMaterial({
                color: 0xffe875,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        flash.position.copy(pos);
        if (window.game && window.game.camera) flash.lookAt(window.game.camera.position);
        this.scene.add(flash);
        this.items.push({ mesh: flash, life: 0.28, maxLife: 0.28, scaleTo: 1.85, disposeGeo: true });
    }

    blinkTrail(from, to) {
        this.tracer(from.clone().add(new THREE.Vector3(0, 0.9, 0)), to.clone().add(new THREE.Vector3(0, 0.9, 0)), 0x40d0ff);
        const burst = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0x40d0ff, transparent: true, opacity: 0.8, wireframe: true })
        );
        burst.position.copy(to).add(new THREE.Vector3(0, 1.0, 0));
        this.scene.add(burst);
        this.items.push({ mesh: burst, life: 0.28, maxLife: 0.28, scaleTo: 2.2, disposeGeo: true });
    }

    telekinesisWave(origin) {
        const wave = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 18, 18),
            new THREE.MeshBasicMaterial({
                color: 0xaa00ff,
                transparent: true,
                opacity: 0.65,
                wireframe: true
            })
        );
        wave.position.copy(origin).add(new THREE.Vector3(0, 1.0, 0));
        this.scene.add(wave);
        this.items.push({ mesh: wave, life: 0.45, maxLife: 0.45, scaleTo: 14, disposeGeo: true });
    }

    spawnRocket(origin, dir, ownerId, damage, splashDamage, splashRadius, isFuga = false) {
        const mesh = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(isFuga ? 0.09 : 0.06, isFuga ? 0.09 : 0.06, isFuga ? 0.85 : 0.42, 8),
            new THREE.MeshBasicMaterial({ color: isFuga ? 0xff3b00 : 0xffaa22 })
        );
        body.rotation.x = Math.PI / 2;
        mesh.add(body);
        mesh.position.copy(origin);
        mesh.lookAt(origin.clone().add(dir));
        this.scene.add(mesh);
        this.rockets.push({
            mesh,
            pos: origin.clone(),
            vel: dir.clone().normalize().multiplyScalar(isFuga ? 62 : 44),
            ownerId,
            damage,
            splashDamage,
            splashRadius,
            isFuga,
            life: 4.5
        });
    }

    spawnFlashbang(origin, dir, ownerId) {
        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055, 0.055, 0.16, 10),
            new THREE.MeshStandardMaterial({ color: 0xd8e2ec, emissive: 0x40d0ff, emissiveIntensity: 1.2 })
        );
        mesh.position.copy(origin);
        this.scene.add(mesh);
        const vel = dir.clone().normalize().multiplyScalar(22);
        vel.y += 5.2;
        this.flashbangs.push({ mesh, pos: origin.clone(), vel, ownerId, timer: 1.45 });
    }

    spawnSukunaSlash(origin, dir, ownerId, damage, slashType, game) {
        const isCleave = slashType === 'cleave';
        const w = isCleave ? 4.4 : 2.6;
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, 0.08, 0.45),
            new THREE.MeshBasicMaterial({
                color: isCleave ? 0xff1a2e : 0xff4455,
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        mesh.position.copy(origin);
        mesh.lookAt(origin.clone().add(dir));
        mesh.rotateZ(rand(-0.55, 0.55));
        this.scene.add(mesh);
        this.sukunaSlashes.push({
            mesh,
            pos: origin.clone(),
            vel: dir.clone().normalize().multiplyScalar(isCleave ? 72 : 64),
            ownerId,
            damage,
            slashType,
            radius: isCleave ? 2.6 : 1.6,
            life: 1.4,
            hitSet: new Set()
        });
    }

    update(dt, game) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const it = this.items[i];
            it.life -= dt;
            if (it.life <= 0) {
                this.scene.remove(it.mesh);
                if (it.disposeGeo && it.mesh.geometry) it.mesh.geometry.dispose();
                if (it.mesh.material) it.mesh.material.dispose();
                this.items.splice(i, 1);
                continue;
            }
            const t = 1 - it.life / it.maxLife;
            if (it.vel) {
                if (it.gravity) it.vel.y -= it.gravity * dt;
                it.mesh.position.addScaledVector(it.vel, dt);
            }
            if (it.scaleTo) it.mesh.scale.setScalar(1 + (it.scaleTo - 1) * t);
            if (it.mesh.material && it.mesh.material.opacity !== undefined) {
                it.mesh.material.opacity = Math.max(0, 1 - t);
            }
        }

        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i];
            r.life -= dt;
            const step = r.vel.clone().multiplyScalar(dt);
            const nextPos = r.pos.clone().add(step);
            let detonated = r.life <= 0 || nextPos.y <= 0.1;

            if (!detonated && game && game.world) {
                for (const box of game.world.colliders) {
                    if (box.containsPoint(nextPos)) { detonated = true; break; }
                }
            }
            if (!detonated && game && game.bots) {
                for (const b of game.bots) {
                    if (b.alive && b.pos.distanceTo(nextPos) < 1.35) { detonated = true; break; }
                }
            }
            r.pos.copy(nextPos);
            r.mesh.position.copy(r.pos);

            if (detonated) {
                this.scene.remove(r.mesh);
                this.explosion(r.pos, r.splashRadius);
                audio.explosion(r.pos);
                if (game && r.ownerId === game.net.myId) {
                    game.applyExplosionDamage(r.pos, r.splashRadius, r.splashDamage, r.isFuga ? 'DIVINE FLAME: FUGA' : 'HAVOC RL', false);
                }
                this.rockets.splice(i, 1);
            }
        }

        for (let i = this.flashbangs.length - 1; i >= 0; i--) {
            const fb = this.flashbangs[i];
            fb.timer -= dt;
            fb.vel.y -= 18 * dt;
            fb.pos.addScaledVector(fb.vel, dt);
            if (fb.pos.y < 0.15) {
                fb.pos.y = 0.15;
                fb.vel.y *= -0.45;
                fb.vel.x *= 0.72;
                fb.vel.z *= 0.72;
            }
            fb.mesh.position.copy(fb.pos);
            fb.mesh.rotation.x += dt * 8;
            if (fb.timer <= 0) {
                this.scene.remove(fb.mesh);
                fb.mesh.geometry.dispose();
                fb.mesh.material.dispose();
                if (game) {
                    game.applyFlashbangToPlayer(fb.pos);
                    if (fb.ownerId === game.net.myId && game.isMultiplayer) {
                        game.net.broadcast({ type: 'FLASH', pos: [fb.pos.x, fb.pos.y, fb.pos.z] });
                    }
                    if (game.bots) {
                        for (const b of game.bots) {
                            if (b.alive && b.pos.distanceTo(fb.pos) < 14) b.stunTimer = 3.2;
                        }
                    }
                }
                this.flashbangs.splice(i, 1);
            }
        }

        for (let i = this.sukunaSlashes.length - 1; i >= 0; i--) {
            const sl = this.sukunaSlashes[i];
            sl.life -= dt;
            sl.pos.addScaledVector(sl.vel, dt);
            sl.mesh.position.copy(sl.pos);
            if (sl.damage > 0 && game && sl.ownerId === game.net.myId) {
                if (game.bots) {
                    for (const b of game.bots) {
                        if (b.alive && !sl.hitSet.has(b) && b.pos.distanceTo(sl.pos) < sl.radius + 0.9) {
                            sl.hitSet.add(b);
                            game.damageBot(b, sl.damage, false, sl.pos);
                            if (window.sukunaSlashVfx) window.sukunaSlashVfx(b.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), sl.slashType);
                        }
                    }
                }
                if (game.isMultiplayer) {
                    for (const id in game.net.players) {
                        if (id === game.net.myId || sl.hitSet.has(id)) continue;
                        const st = game.net.players[id].state;
                        if (st && st.pos && st.alive !== false) {
                            const rPos = new THREE.Vector3(...st.pos);
                            if (rPos.distanceTo(sl.pos) < sl.radius + 0.9) {
                                sl.hitSet.add(id);
                                game.damageRemotePlayer(id, sl.damage, false);
                                if (window.sukunaSlashVfx) window.sukunaSlashVfx(rPos.add(new THREE.Vector3(0, 1.1, 0)), sl.slashType);
                            }
                        }
                    }
                }
            }
            if (sl.life <= 0) {
                this.scene.remove(sl.mesh);
                sl.mesh.geometry.dispose();
                sl.mesh.material.dispose();
                this.sukunaSlashes.splice(i, 1);
            }
        }
    }
}

/* ===== ABILITY & POWERUP SYSTEM ===== */
class AbilitySystem {
    constructor(game) {
        this.game = game;
        this.blinkCooldown = 0;
        this.tkCooldown = 0;
        this.fugaCooldown = 0;
        this.domainCooldown = 0;
        this.pickups = [];
        this.spawnTimer = 18;
    }

    reset() {
        this.blinkCooldown = 0;
        this.tkCooldown = 0;
        this.fugaCooldown = 0;
        this.domainCooldown = 0;
        for (const p of this.pickups) {
            this.game.scene.remove(p.mesh);
        }
        this.pickups = [];
    }

    spawnPickupAt(posArr, pType = 'sukuna') {
        const pos = new THREE.Vector3(...posArr);
        const mesh = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.42, 0),
            new THREE.MeshStandardMaterial({
                color: pType === 'sukuna' ? 0xff1e38 : 0x40d0ff,
                emissive: pType === 'sukuna' ? 0xff1e38 : 0x40d0ff,
                emissiveIntensity: 2.8
            })
        );
        mesh.position.copy(pos).add(new THREE.Vector3(0, 1.0, 0));
        this.game.scene.add(mesh);
        this.pickups.push({ mesh, pos: mesh.position.clone(), pType, life: 35 });
    }

    useBlink() {
        const p = this.game.player;
        if (!p || !p.alive || this.blinkCooldown > 0) return;
        this.blinkCooldown = this.game.mode === 'TRAINING' ? 0.5 : 4.5;
        const start = p.pos.clone();
        const dir = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw)).normalize();
        let target = start.clone();
        for (let step = 1; step <= 11; step++) {
            const test = start.clone().addScaledVector(dir, step * 1.0);
            if (!p._collidesAt(test)) target.copy(test);
            else break;
        }
        p.pos.copy(target);
        p.vel.y = Math.max(p.vel.y, 2.2);
        this.game.effects.blinkTrail(start, target);
        audio.teleport();
        const ov = document.getElementById('blinkOverlay');
        if (ov) { ov.style.opacity = '1'; setTimeout(() => { ov.style.opacity = '0'; }, 180); }
        if (this.game.isMultiplayer) {
            this.game.net.broadcast({
                type: 'TELEPORT_VFX',
                senderId: this.game.net.myId,
                from: [start.x, start.y, start.z],
                to: [target.x, target.y, target.z]
            });
        }
    }

    useTelekinesis() {
        const p = this.game.player;
        if (!p || !p.alive || this.tkCooldown > 0) return;
        this.tkCooldown = this.game.mode === 'TRAINING' ? 1.0 : 8.0;
        this.game.effects.telekinesisWave(p.pos);
        audio.telekinesis();
        const ov = document.getElementById('psyOverlay');
        if (ov) { ov.style.opacity = '1'; setTimeout(() => { ov.style.opacity = '0'; }, 420); }

        if (this.game.bots) {
            for (const b of this.game.bots) {
                if (b.alive && b.pos.distanceTo(p.pos) <= 15) {
                    b.tkFreezeTimer = 3.5;
                    b.pos.y += 1.4;
                    this.game.damageBot(b, 35, false, b.pos);
                }
            }
        }
        if (this.game.isMultiplayer) {
            this.game.net.broadcast({ type: 'TK_VFX', senderId: this.game.net.myId, origin: [p.pos.x, p.pos.y, p.pos.z] });
            for (const id in this.game.net.players) {
                if (id === this.game.net.myId) continue;
                const st = this.game.net.players[id].state;
                if (st && st.pos && st.alive !== false) {
                    if (new THREE.Vector3(...st.pos).distanceTo(p.pos) <= 15) {
                        this.game.net.broadcast({ type: 'TK_FREEZE', targetId: id });
                        this.game.damageRemotePlayer(id, 30, false);
                    }
                }
            }
        }
    }

    useFlashOrFuga() {
        const p = this.game.player;
        if (!p || !p.alive) return;
        if (p.sukunaTimer > 0 && this.fugaCooldown <= 0) {
            this.fugaCooldown = this.game.mode === 'TRAINING' ? 1.5 : 8.0;
            const eye = p.getEyePos();
            const dir = p.getLookDir();
            this.game.effects.spawnRocket(eye.addScaledVector(dir, 0.8), dir, this.game.net.myId, 180, 140, 8.5, true);
            audio.shoot('rocket');
            this.game.ui.showCenterMsg('DIVINE FLAME: FUGA', '', 900);
            return;
        }
        if (p.flashbangs <= 0) {
            audio.empty();
            return;
        }
        p.flashbangs--;
        const eye = p.getEyePos();
        const dir = p.getLookDir();
        this.game.effects.spawnFlashbang(eye.addScaledVector(dir, 0.6), dir, this.game.net.myId);
        audio.throw();
    }

    activateSukuna() {
        const p = this.game.player;
        if (!p || !p.alive) return;
        p.sukunaTimer = 32;
        p.maxHealth = 180;
        p.health = 180;
        p.shield = Math.max(p.shield, 50);
        p.giveSukunaWeapons();
        audio.sukuna();
        this.game.ui.showCenterMsg('KING OF CURSES AWAKENED', 'DISMANTLE & CLEAVE • [Q] FUGA • [E] DOMAIN EXPANSION', 2800);
        if (window.sukunaHandVfx) window.sukunaHandVfx.spawn(this.game.camera);
        if (this.game.isMultiplayer) {
            this.game.net.broadcast({ type: 'SUKUNA', playerId: this.game.net.myId });
        }
    }

    useDomainExpansion() {
        const p = this.game.player;
        if (!p || !p.alive || this.domainCooldown > 0) return;
        if (p.sukunaTimer <= 0 && this.game.mode !== 'TRAINING') {
            this.game.ui.showCenterMsg('CURSED ENERGY INSUFFICIENT', 'AWAKEN SUKUNA VESSEL FIRST', 1400);
            return;
        }
        this.domainCooldown = this.game.mode === 'TRAINING' ? 3.0 : 25.0;
        if (this.game.isMultiplayer && !this.game.net.isHost) {
            this.game.net.broadcast({ type: 'DOMAIN_INTENT', playerId: this.game.net.myId });
        } else if (this.game.isMultiplayer && this.game.net.isHost) {
            this.game.net.processDomainIntent(this.game.net.myId);
        } else {
            this.game.triggerDomainExpansion(true, p.pos.clone());
        }
    }

    update(dt) {
        if (this.blinkCooldown > 0) this.blinkCooldown = Math.max(0, this.blinkCooldown - dt);
        if (this.tkCooldown > 0) this.tkCooldown = Math.max(0, this.tkCooldown - dt);
        if (this.fugaCooldown > 0) this.fugaCooldown = Math.max(0, this.fugaCooldown - dt);
        if (this.domainCooldown > 0) this.domainCooldown = Math.max(0, this.domainCooldown - dt);

        if ((!this.game.isMultiplayer || this.game.net.isHost) && this.game.world) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0 && this.pickups.length < 2) {
                this.spawnTimer = 28;
                const sp = pick(this.game.world.spawnPoints.length ? this.game.world.spawnPoints : [this.game.world.playerSpawn]);
                const posArr = [sp.x, sp.y, sp.z];
                this.spawnPickupAt(posArr, 'sukuna');
                if (this.game.isMultiplayer) {
                    this.game.net.broadcast({ type: 'POWERUP_SPAWN', pos: posArr, pType: 'sukuna' });
                }
            }
        }

        const p = this.game.player;
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pk = this.pickups[i];
            pk.life -= dt;
            pk.mesh.rotation.y += dt * 2.5;
            if (pk.life <= 0) {
                this.game.scene.remove(pk.mesh);
                this.pickups.splice(i, 1);
                continue;
            }
            if (p && p.alive && p.pos.distanceTo(pk.pos) < 1.9) {
                this.game.scene.remove(pk.mesh);
                this.pickups.splice(i, 1);
                this.activateSukuna();
            }
        }
    }
}

/* ===== PLAYER CONTROLLER ===== */
class Player {
    constructor(game) {
        this.game = game;
        this.camera = game.camera;
        this.pos = new THREE.Vector3(0, 0.2, 26);
        this.vel = new THREE.Vector3();
        this.yaw = 0;
        this.pitch = 0;
        this.onGround = false;
        this.crouching = false;
        this.sliding = false;
        this.slideTimer = 0;
        this.slideDir = new THREE.Vector3();

        this.maxHealth = 100;
        this.health = 100;
        this.shield = 25;
        this.maxShield = 100;
        this.alive = true;

        this.medkits = 2;
        this.flashbangs = 2;

        this.weapons = [];
        this.slot = 0;
        this.fireTimer = 0;
        this.reloadTimer = 0;
        this.reloading = false;
        this.ads = 0;
        this.recoilPitch = 0;
        this.recoilYaw = 0;
        this.stepDist = 0;

        this.parryTimer = 0;
        this.parryCooldown = 0;
        this.katanaCombo = 0;
        this.swingAnim = 0;

        this.sukunaTimer = 0;
        this.tkFreezeTimer = 0;

        this.viewRoot = new THREE.Group();
        this.camera.add(this.viewRoot);
        this.weaponMesh = null;
        this.initLoadout();
    }

    get currentWeapon() {
        return this.weapons[this.slot] || this.weapons[0];
    }

    initLoadout() {
        SaveSystem.normalizeLoadout();
        const loadoutKeys = SaveSystem.data.equippedLoadout;
        this.weapons = loadoutKeys.map(k => {
            const def = WEAPON_DEFS[k] || WEAPON_DEFS.rifle;
            return {
                ...def,
                ammo: def.mag,
                reserveAmmo: def.reserve,
                camo: SaveSystem.data.equippedCamos[k] || 'default'
            };
        });
        this.slot = clamp(this.slot, 0, Math.max(0, this.weapons.length - 1));
        this.reloading = false;
        this.reloadTimer = 0;
        this._rebuildViewmodel();
        if (this.game && this.game.ui) this.game.ui.updateSlotNames(this.weapons);
    }

    giveSukunaWeapons() {
        const dDef = WEAPON_DEFS.dismantle;
        const cDef = WEAPON_DEFS.cleave;
        this.weapons = [
            { ...dDef, ammo: dDef.mag, reserveAmmo: dDef.reserve, camo: 'crimson' },
            { ...cDef, ammo: cDef.mag, reserveAmmo: cDef.reserve, camo: 'crimson' },
            ...this.weapons.slice(0, 2)
        ];
        this.slot = 0;
        this.reloading = false;
        this._rebuildViewmodel();
        if (this.game && this.game.ui) this.game.ui.updateSlotNames(this.weapons);
    }

    refillAllAmmo() {
        for (const w of this.weapons) {
            w.ammo = w.mag;
            w.reserveAmmo = w.reserve;
        }
    }

    useMedkit() {
        if (!this.alive || this.medkits <= 0 || this.health >= this.maxHealth) {
            audio.empty();
            return;
        }
        this.medkits--;
        this.health = Math.min(this.maxHealth, this.health + 50);
        audio.medkit();
        this.game.ui.showCenterMsg('MEDKIT APPLIED', '+50 VITALS', 850);
    }

    _rebuildViewmodel() {
        if (this.weaponMesh) {
            this.viewRoot.remove(this.weaponMesh);
            this.weaponMesh.traverse(o => {
                if (o.geometry) o.geometry.dispose();
                if (o.material) {
                    if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
                    else o.material.dispose();
                }
            });
            this.weaponMesh = null;
        }
        const w = this.currentWeapon;
        if (!w) return;
        this.weaponMesh = buildWeaponMesh(w.kind, w.camo || 'default', true);
        this.viewRoot.add(this.weaponMesh);
    }

    _resetViewState() {
        this.ads = 0;
        this.recoilPitch = 0;
        this.recoilYaw = 0;
        this.camera.fov = SaveSystem.data.settings.fov;
        this.camera.updateProjectionMatrix();
        document.getElementById('scope')?.classList.remove('active');
    }

    reset(spawnPos) {
        this.pos.copy(spawnPos || new THREE.Vector3(0, 0.2, 26));
        this.vel.set(0, 0, 0);
        this.yaw = 0;
        this.pitch = 0;
        this.maxHealth = 100;
        this.health = 100;
        this.shield = 25;
        this.medkits = 2;
        this.flashbangs = 2;
        this.alive = true;
        this.sliding = false;
        this.crouching = false;
        this.sukunaTimer = 0;
        this.tkFreezeTimer = 0;
        if (window.sukunaHandVfx) window.sukunaHandVfx.remove();
        this.initLoadout();
        this._resetViewState();
    }

    switchSlot(idx) {
        if (idx < 0 || idx >= this.weapons.length || idx === this.slot) return;
        this.slot = idx;
        this.reloading = false;
        this.reloadTimer = 0;
        this.ads = 0;
        document.getElementById('scope')?.classList.remove('active');
        this._rebuildViewmodel();
        if (this.currentWeapon?.kind === 'katana') audio.katanaDraw();
        else audio.ui();
    }

    startReload() {
        const w = this.currentWeapon;
        if (!w || w.melee || w.reloadTime <= 0 || this.reloading) return;
        if (w.ammo >= w.mag || w.reserveAmmo <= 0) return;
        this.reloading = true;
        this.reloadTimer = w.reloadTime;
        this.ads = 0;
        document.getElementById('scope')?.classList.remove('active');
        audio.reload();
    }

    getEyePos() {
        const eyeH = this.sliding ? 0.85 : this.crouching ? 1.15 : 1.65;
        return new THREE.Vector3(this.pos.x, this.pos.y + eyeH, this.pos.z);
    }

    getLookDir() {
        const euler = new THREE.Euler(this.pitch + this.recoilPitch, this.yaw + this.recoilYaw, 0, 'YXZ');
        return new THREE.Vector3(0, 0, -1).applyEuler(euler).normalize();
    }

    onHit(dmg, isMelee = false, attackerPos = null) {
        if (!this.alive) return;
        let rem = dmg;
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, rem);
            this.shield -= absorbed;
            rem -= absorbed;
        }
        this.health = Math.max(0, this.health - rem);
        if (this.health <= 0) this.alive = false;

        const vig = document.getElementById('dmgVignette');
        if (vig) {
            vig.classList.add('active');
            clearTimeout(this._vigTo);
            this._vigTo = setTimeout(() => vig.classList.remove('active'), 240);
        }
        if (attackerPos) {
            const dx = attackerPos.x - this.pos.x;
            const dz = attackerPos.z - this.pos.z;
            const worldAng = Math.atan2(-dx, -dz);
            const relAng = worldAng - this.yaw;
            const ind = document.getElementById('dirIndicator');
            if (ind) {
                ind.style.transform = `translate(-50%, -50%) rotate(${-relAng}rad)`;
                ind.classList.add('active');
                clearTimeout(this._dirTo);
                this._dirTo = setTimeout(() => ind.classList.remove('active'), 450);
            }
        }
    }

    _collidesAt(pos) {
        if (!this.game.world) return false;
        const r = 0.38;
        const h = this.crouching || this.sliding ? 1.1 : 1.75;
        const pBox = new THREE.Box3(
            new THREE.Vector3(pos.x - r, pos.y + 0.05, pos.z - r),
            new THREE.Vector3(pos.x + r, pos.y + h, pos.z + r)
        );
        for (const box of this.game.world.colliders) {
            if (pBox.intersectsBox(box)) return true;
        }
        return false;
    }

    update(dt, input) {
        if (!this.alive) return;

        if (this.sukunaTimer > 0) {
            this.sukunaTimer -= dt;
            if (this.sukunaTimer <= 0) {
                this.sukunaTimer = 0;
                this.maxHealth = 100;
                this.health = Math.min(this.health, 100);
                if (window.sukunaHandVfx) window.sukunaHandVfx.remove();
                this.initLoadout();
                this.game.ui.showCenterMsg('VESSEL EXPIRED', '', 1200);
            }
        }

        if (this.tkFreezeTimer > 0) {
            this.tkFreezeTimer = Math.max(0, this.tkFreezeTimer - dt);
            this.vel.set(0, Math.sin(performance.now() * 0.008) * 0.4, 0);
        }

        if (this.parryTimer > 0) this.parryTimer = Math.max(0, this.parryTimer - dt);
        if (this.parryCooldown > 0) this.parryCooldown = Math.max(0, this.parryCooldown - dt);
        if (this.swingAnim > 0) this.swingAnim = Math.max(0, this.swingAnim - dt * 4.5);

        // Weapon switching
        if (input.hit('Digit1')) this.switchSlot(0);
        if (input.hit('Digit2')) this.switchSlot(1);
        if (input.hit('Digit3')) this.switchSlot(2);
        if (input.hit('Digit4')) this.switchSlot(3);
        if (input.wheel !== 0) {
            const next = (this.slot + sign(input.wheel) + this.weapons.length) % this.weapons.length;
            this.switchSlot(next);
        }

        // Look rotation
        const w = this.currentWeapon;
        const isScopeWeapon = w && (w.kind === 'sniper' || w.kind === 'kar98') && this.ads > 0.65;
        const sensMult = isScopeWeapon ? SaveSystem.data.settings.scopeSensitivity * 0.45 : SaveSystem.data.settings.sensitivity;
        const invY = SaveSystem.data.settings.invertY ? -1 : 1;
        this.yaw -= input.mouseDX * 0.0022 * sensMult;
        this.pitch = clamp(this.pitch - input.mouseDY * 0.0022 * sensMult * invY, -Math.PI * 0.48, Math.PI * 0.48);

        this.recoilPitch = damp(this.recoilPitch, 0, 12, dt);
        this.recoilYaw = damp(this.recoilYaw, 0, 12, dt);

        // ADS / Katana Parry
        if (w && w.kind === 'katana') {
            if (input.right && this.parryCooldown <= 0 && this.parryTimer <= 0) {
                this.parryTimer = 0.48;
                this.parryCooldown = 1.1;
                audio.katanaDraw();
            }
            this.ads = damp(this.ads, this.parryTimer > 0 ? 1 : 0, 14, dt);
        } else {
            const wantAds = input.right && !this.reloading && w && !w.melee;
            this.ads = damp(this.ads, wantAds ? 1 : 0, 12, dt);
        }

        const scopeEl = document.getElementById('scope');
        if (scopeEl) {
            const showScope = w && (w.kind === 'sniper' || w.kind === 'kar98') && this.ads > 0.72;
            scopeEl.classList.toggle('active', !!showScope);
            if (this.weaponMesh) this.weaponMesh.visible = !showScope;
        }

        const baseFov = SaveSystem.data.settings.fov;
        const targetFov = (w && (w.kind === 'sniper' || w.kind === 'kar98'))
            ? lerp(baseFov, 24, this.ads)
            : lerp(baseFov, baseFov * 0.78, this.ads);
        this.camera.fov = damp(this.camera.fov, targetFov, 14, dt);
        this.camera.updateProjectionMatrix();

        // Movement
        if (this.tkFreezeTimer <= 0) {
            const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
            const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
            const move = new THREE.Vector3();
            if (input.down('KeyW')) move.add(fwd);
            if (input.down('KeyS')) move.sub(fwd);
            if (input.down('KeyD')) move.add(right);
            if (input.down('KeyA')) move.sub(right);
            if (move.lengthSq() > 0) move.normalize();

            const sprinting = input.down('ShiftLeft') && move.lengthSq() > 0 && this.ads < 0.2;
            if (input.hit('KeyC') && sprinting && this.onGround && !this.sliding) {
                this.sliding = true;
                this.slideTimer = 0.68;
                this.slideDir.copy(move);
                audio.slide();
            }
            if (this.sliding) {
                this.slideTimer -= dt;
                if (this.slideTimer <= 0 || !this.onGround) this.sliding = false;
            }
            this.crouching = input.down('KeyC') && !this.sliding;

            const speedBoost = this.sukunaTimer > 0 ? 1.32 : 1.0;
            if (this.sliding) {
                this.vel.x = this.slideDir.x * 16.5 * speedBoost;
                this.vel.z = this.slideDir.z * 16.5 * speedBoost;
            } else {
                const maxSpd = (this.crouching ? 5.2 : sprinting ? 12.2 : 8.6) * speedBoost;
                this.vel.x = damp(this.vel.x, move.x * maxSpd, this.onGround ? 14 : 4, dt);
                this.vel.z = damp(this.vel.z, move.z * maxSpd, this.onGround ? 14 : 4, dt);
            }

            if (input.hit('Space') && this.onGround) {
                this.vel.y = 9.4;
                this.onGround = false;
                this.sliding = false;
                audio.jump();
            }

            this.vel.y -= 24.5 * dt;

            // Axis-separated collision
            const nextX = this.pos.clone(); nextX.x += this.vel.x * dt;
            if (!this._collidesAt(nextX)) this.pos.x = nextX.x; else this.vel.x = 0;

            const nextZ = this.pos.clone(); nextZ.z += this.vel.z * dt;
            if (!this._collidesAt(nextZ)) this.pos.z = nextZ.z; else this.vel.z = 0;

            const wasGround = this.onGround;
            const nextY = this.pos.clone(); nextY.y += this.vel.y * dt;
            if (!this._collidesAt(nextY)) {
                this.pos.y = nextY.y;
                this.onGround = false;
            } else {
                if (this.vel.y < 0) {
                    if (!wasGround && this.vel.y < -6) audio.land();
                    this.onGround = true;
                }
                this.vel.y = 0;
            }

            if (this.game.world && this.pos.y < this.game.world.killY) {
                this.health = 0;
                this.alive = false;
                this.game.onPlayerDied();
                return;
            }

            const hSpd = Math.hypot(this.vel.x, this.vel.z);
            if (this.onGround && !this.sliding && hSpd > 2.2) {
                this.stepDist += hSpd * dt;
                if (this.stepDist > 2.6) {
                    this.stepDist = 0;
                    audio.footstep();
                }
            }
        }

        // Camera transform
        const eyePos = this.getEyePos();
        this.camera.position.copy(eyePos);
        _e1.set(this.pitch + this.recoilPitch, this.yaw + this.recoilYaw, this.sliding ? 0.06 : 0, 'YXZ');
        this.camera.quaternion.setFromEuler(_e1);

        // Reloading
        if (this.reloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.reloading = false;
                const need = w.mag - w.ammo;
                const take = Math.min(need, w.reserveAmmo);
                w.ammo += take;
                w.reserveAmmo -= take;
                audio.reloadDone();
            }
        }
        if (input.hit('KeyR')) this.startReload();

        // Firing
        if (this.fireTimer > 0) this.fireTimer = Math.max(0, this.fireTimer - dt);
        const wantFire = w && (w.auto ? input.left : input.hit('Mouse0') || (input.left && this._prevLeft === false));
        this._prevLeft = input.left;

        if (wantFire && this.fireTimer <= 0 && !this.reloading && this.tkFreezeTimer <= 0) {
            this.fireWeapon();
        }

        // Viewmodel sway & positioning
        if (this.weaponMesh) {
            const t = performance.now() * 0.004;
            const bobX = Math.cos(t) * 0.008 * (1 - this.ads);
            const bobY = Math.abs(Math.sin(t)) * 0.008 * (1 - this.ads);
            const hipX = w && (w.kind === 'knife' || w.kind === 'katana') ? 0.28 : 0.24;
            const hipY = w && (w.kind === 'knife' || w.kind === 'katana') ? -0.22 : -0.20;
            const hipZ = w && (w.kind === 'katana') ? -0.45 : -0.42;

            const tx = lerp(hipX + bobX, 0, this.ads);
            const ty = lerp(hipY - bobY, -0.145, this.ads) - (this.reloading ? 0.14 : 0);
            const tz = lerp(hipZ, -0.32, this.ads);
            this.weaponMesh.position.set(tx, ty, tz);

            let rx = this.reloading ? -0.48 : 0;
            let ry = this.reloading ? 0.35 : 0;
            let rz = 0;

            if (w && w.kind === 'katana' && this.parryTimer > 0) {
                this.weaponMesh.position.set(0.02, -0.10, -0.36);
                rx = 0.25;
                ry = 0.65;
                rz = 1.15;
            } else if (this.swingAnim > 0) {
                const s = Math.sin(this.swingAnim * Math.PI);
                if (w && w.kind === 'katana') {
                    const dirSign = this.katanaCombo === 1 ? -1 : 1;
                    this.weaponMesh.position.x -= s * 0.26 * dirSign;
                    this.weaponMesh.position.z -= s * 0.14;
                    rx -= s * 0.45;
                    ry += s * 1.15 * dirSign;
                    rz += s * 0.85 * dirSign;
                } else {
                    this.weaponMesh.position.z -= s * 0.18;
                    rx -= s * 0.65;
                }
            }

            this.weaponMesh.rotation.set(rx, ry, rz);
        }
    }

    _intersectRaySphere(origin, dir, center, radius, maxDist) {
        const oc = origin.clone().sub(center);
        const b = oc.dot(dir);
        const c = oc.dot(oc) - radius * radius;
        const disc = b * b - c;
        if (disc < 0) return null;
        const sqrtD = Math.sqrt(disc);
        const t1 = -b - sqrtD;
        const t2 = -b + sqrtD;
        const t = t1 >= 0 ? t1 : (t2 >= 0 ? t2 : -1);
        return (t >= 0 && t <= maxDist) ? t : null;
    }

    fireWeapon() {
        const w = this.currentWeapon;
        if (!w) return;

        if (!w.melee && w.kind !== 'dismantle') {
            if (w.ammo <= 0) {
                audio.empty();
                if (w.reserveAmmo > 0) this.startReload();
                return;
            }
            w.ammo--;
        }

        this.fireTimer = 60 / w.rpm;
        const eye = this.getEyePos();
        const lookDir = this.getLookDir();
        const muzzle = eye.clone()
            .addScaledVector(lookDir, 0.65)
            .add(new THREE.Vector3(0, -0.08, 0));

        const tracerColor = CAMO_COLORS[w.camo || 'default'] || 0xffdd44;

        // 1. Melee (Knife / Katana)
        if (w.melee && w.kind !== 'cleave') {
            this.swingAnim = 1.0;
            let isSuper = false;
            let dmg = w.damage;

            if (w.kind === 'katana') {
                isSuper = this.katanaCombo === 2;
                if (isSuper) dmg = w.superDamage || 125;
                audio.katanaSlash(isSuper, this.katanaCombo);
                this.game.effects.katanaSlashArc(eye, lookDir, isSuper, tracerColor);
                this.katanaCombo = (this.katanaCombo + 1) % 3;
            } else {
                audio.shoot('knife');
            }

            let hitAnything = false;
            if (this.game.bots) {
                for (const b of this.game.bots) {
                    if (!b.alive) continue;
                    const toBot = b.pos.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(eye);
                    const dist = toBot.length();
                    if (dist <= w.range + 0.35) {
                        toBot.normalize();
                        if (lookDir.dot(toBot) > 0.45) {
                            const botFwd = new THREE.Vector3(-Math.sin(b.yaw), 0, -Math.cos(b.yaw));
                            const backstab = lookDir.dot(botFwd) > 0.65;
                            const finalDmg = backstab ? dmg * (w.backstabMult || 3) : dmg;
                            this.game.damageBot(b, finalDmg, backstab || isSuper, b.pos.clone().add(new THREE.Vector3(0, 1.1, 0)));
                            hitAnything = true;
                        }
                    }
                }
            }

            if (this.game.isMultiplayer && !this.game.isCoop()) {
                for (const id in this.game.net.players) {
                    if (id === this.game.net.myId) continue;
                    const st = this.game.net.players[id].state;
                    if (!st || st.alive === false) continue;
                    const rMesh = this.game.remoteMeshes?.[id];
                    const basePos = rMesh ? rMesh.position.clone() : (st.pos ? new THREE.Vector3(...st.pos) : null);
                    if (!basePos) continue;
                    const rPos = basePos.add(new THREE.Vector3(0, 1.15, 0));
                    const toR = rPos.clone().sub(eye);
                    const dist = toR.length();
                    if (dist <= w.range + 0.5 && lookDir.dot(toR.normalize()) > 0.42) {
                        const rFwd = new THREE.Vector3(-Math.sin(st.yaw || 0), 0, -Math.cos(st.yaw || 0));
                        const backstab = lookDir.dot(rFwd) > 0.65;
                        const finalDmg = backstab ? dmg * (w.backstabMult || 3) : dmg;
                        this.game.damageRemotePlayer(id, finalDmg, backstab || isSuper, true);
                        this.game.effects.impact(rPos, lookDir.clone().negate(), true);
                        hitAnything = true;
                    }
                }
            }

            if (this.game.isMultiplayer) {
                const reachPt = eye.clone().addScaledVector(lookDir, w.range);
                this.game.net.broadcast({
                    type: 'SHOOT',
                    senderId: this.game.net.myId,
                    weapon: w.kind,
                    origin: [muzzle.x, muzzle.y, muzzle.z],
                    to: [reachPt.x, reachPt.y, reachPt.z],
                    color: tracerColor
                });
            }

            if (hitAnything && w.kind === 'katana') audio.katanaHit(isSuper);
            return;
        }

        // 2. Sukuna Cursed Techniques (Dismantle / Cleave)
        if (w.kind === 'dismantle' || w.kind === 'cleave') {
            if (window.sukunaHandVfx) window.sukunaHandVfx.swing(w.kind);
            audio.shoot('dismantle');
            const count = w.kind === 'cleave' ? 3 : 1;
            for (let i = 0; i < count; i++) {
                const d = lookDir.clone();
                if (count > 1) {
                    d.applyAxisAngle(new THREE.Vector3(0, 1, 0), (i - 1) * 0.14);
                }
                this.game.effects.spawnSukunaSlash(muzzle, d, this.game.net.myId, w.damage, w.kind, this.game);
                if (this.game.isMultiplayer) {
                    this.game.net.broadcast({
                        type: 'SUKUNA_SLASH',
                        senderId: this.game.net.myId,
                        slashType: w.kind,
                        origin: [muzzle.x, muzzle.y, muzzle.z],
                        dir: [d.x, d.y, d.z]
                    });
                }
            }
            return;
        }

        // Apply Recoil & Muzzle Flash
        this.recoilPitch += w.recoil * 0.011 * (1 - this.ads * 0.35);
        this.recoilYaw += rand(-0.005, 0.005) * w.recoil;
        audio.shoot(w.sound);
        this.game.effects.muzzleFlash(muzzle, tracerColor, !w.projectile);

        // 3. Rocket Launcher
        if (w.projectile) {
            this.game.effects.spawnRocket(muzzle, lookDir, this.game.net.myId, w.damage, w.splashDamage, w.splashRadius, false);
            if (this.game.isMultiplayer) {
                const farPt = eye.clone().addScaledVector(lookDir, 45);
                this.game.net.broadcast({
                    type: 'SHOOT',
                    senderId: this.game.net.myId,
                    weapon: w.kind,
                    origin: [muzzle.x, muzzle.y, muzzle.z],
                    to: [farPt.x, farPt.y, farPt.z],
                    color: tracerColor
                });
            }
            if (w.ammo <= 0 && w.reserveAmmo > 0) this.startReload();
            return;
        }

        // 4. Hitscan Firearms (Rifles, SMG, LMG, Shotgun, Snipers)
        const pellets = w.pellets || 1;
        const spread = lerp(w.spreadHip, w.spreadAds, this.ads);
        const ray = new THREE.Raycaster();
        ray.far = w.range;

        for (let pIdx = 0; pIdx < pellets; pIdx++) {
            const dir = lookDir.clone();
            if (spread > 0) {
                dir.x += rand(-spread, spread);
                dir.y += rand(-spread, spread);
                dir.z += rand(-spread, spread);
                dir.normalize();
            }
            ray.set(eye, dir);

            let closestDist = w.range;
            let hitPoint = eye.clone().addScaledVector(dir, w.range);
            let hitNormal = new THREE.Vector3(0, 1, 0);
            let hitBot = null;
            let hitRemoteId = null;
            let hitZone = 'torso';
            let hitWorldObj = null;

            // World geometry & explosive barrels
            if (this.game.world && this.game.world.meshes.length) {
                const worldHits = ray.intersectObjects(this.game.world.meshes, true);
                if (worldHits.length > 0 && worldHits[0].distance < closestDist) {
                    closestDist = worldHits[0].distance;
                    hitPoint.copy(worldHits[0].point);
                    if (worldHits[0].face) hitNormal.copy(worldHits[0].face.normal);
                    hitWorldObj = worldHits[0].object;
                }
            }

            // Bots
            if (this.game.bots) {
                for (const b of this.game.bots) {
                    if (!b.alive || !b.mesh) continue;
                    b.mesh.updateMatrixWorld(true);
                    const hits = ray.intersectObjects(b.mesh.children, true);
                    if (hits.length > 0 && hits[0].distance < closestDist) {
                        closestDist = hits[0].distance;
                        hitPoint.copy(hits[0].point);
                        hitBot = b;
                        hitRemoteId = null;
                        hitWorldObj = null;
                        hitZone = hits[0].object.userData.hitZone || (hitPoint.y > b.pos.y + 1.42 * (b.scale || 1) ? 'head' : 'torso');
                    }
                }
            }

            // Remote Multiplayer Avatars (PVP & 1V1): Force matrixWorld update + Lag-Compensated Hit Spheres
            if (this.game.isMultiplayer && !this.game.isCoop() && this.game.net?.players) {
                for (const id in this.game.net.players) {
                    if (id === this.game.net.myId) continue;
                    const st = this.game.net.players[id]?.state;
                    if (!st || st.alive === false) continue;

                    const rMesh = this.game.remoteMeshes?.[id];
                    if (rMesh) {
                        rMesh.updateMatrixWorld(true);
                        const hits = ray.intersectObjects(rMesh.children, true);
                        if (hits.length > 0 && hits[0].distance < closestDist) {
                            closestDist = hits[0].distance;
                            hitPoint.copy(hits[0].point);
                            hitRemoteId = id;
                            hitBot = null;
                            hitWorldObj = null;
                            hitZone = hits[0].object.userData.hitZone || 'torso';
                            continue;
                        }
                    }

                    // Multi-sphere body check prevents limb-gap misses and compensates WebRTC interpolation
                    const basePos = rMesh ? rMesh.position.clone() : (st.pos ? new THREE.Vector3(...st.pos) : null);
                    if (!basePos) continue;

                    const headCenter = basePos.clone().add(new THREE.Vector3(0, 1.68, 0));
                    const hDist = this._intersectRaySphere(eye, dir, headCenter, 0.34, closestDist);
                    if (hDist !== null && hDist < closestDist) {
                        closestDist = hDist;
                        hitPoint.copy(eye).addScaledVector(dir, hDist);
                        hitRemoteId = id;
                        hitBot = null;
                        hitWorldObj = null;
                        hitZone = 'head';
                        continue;
                    }

                    const torsoCenter = basePos.clone().add(new THREE.Vector3(0, 1.12, 0));
                    const tDist = this._intersectRaySphere(eye, dir, torsoCenter, 0.48, closestDist);
                    if (tDist !== null && tDist < closestDist) {
                        closestDist = tDist;
                        hitPoint.copy(eye).addScaledVector(dir, tDist);
                        hitRemoteId = id;
                        hitBot = null;
                        hitWorldObj = null;
                        hitZone = 'torso';
                        continue;
                    }

                    const legsCenter = basePos.clone().add(new THREE.Vector3(0, 0.48, 0));
                    const lDist = this._intersectRaySphere(eye, dir, legsCenter, 0.44, closestDist);
                    if (lDist !== null && lDist < closestDist) {
                        closestDist = lDist;
                        hitPoint.copy(eye).addScaledVector(dir, lDist);
                        hitRemoteId = id;
                        hitBot = null;
                        hitWorldObj = null;
                        hitZone = 'limb';
                    }
                }
            }

            const mult = hitZone === 'head' ? (w.headMult || 2.0) : hitZone === 'limb' ? (w.limbMult || 0.75) : 1.0;
            const falloffMult = w.falloff ? clamp(1 - (closestDist / w.range) * 0.55, 0.35, 1.0) : 1.0;
            const finalDmg = Math.max(1, Math.round(w.damage * mult * falloffMult));

            if (hitBot) {
                this.game.damageBot(hitBot, finalDmg, hitZone === 'head', hitPoint);
                this.game.effects.impact(hitPoint, hitNormal, true);
            } else if (hitRemoteId) {
                this.game.damageRemotePlayer(hitRemoteId, finalDmg, hitZone === 'head', false);
                this.game.effects.impact(hitPoint, hitNormal, true);
            } else if (hitWorldObj) {
                if (hitWorldObj.userData?.barrel) {
                    this.game.world.detonateBarrel(hitWorldObj.userData.barrel, this.game);
                } else {
                    if (window.damageMapMesh) window.damageMapMesh(hitWorldObj, hitPoint, finalDmg);
                    this.game.effects.impact(hitPoint, hitNormal, false);
                }
            }

            this.game.effects.tracer(muzzle, hitPoint, tracerColor);
            if (this.game.isMultiplayer && pIdx === 0) {
                this.game.net.broadcast({
                    type: 'SHOOT',
                    senderId: this.game.net.myId,
                    weapon: w.kind,
                    origin: [muzzle.x, muzzle.y, muzzle.z],
                    to: [hitPoint.x, hitPoint.y, hitPoint.z],
                    color: tracerColor
                });
            }
        }

        if (w.ammo <= 0 && w.reserveAmmo > 0) this.startReload();
    }
}

/* ===== AI BOT / ELITE / BOSS / TRAINING TARGET ===== */
class Bot {
    constructor(game, spawnPos, opts = {}) {
        this.game = game;
        this.pos = spawnPos.clone();
        this.vel = new THREE.Vector3();
        this.yaw = rand(0, Math.PI * 2);
        this.isElite = !!opts.isElite;
        this.isBoss = !!opts.isBoss;
        this.isDummy = !!opts.isDummy;
        this.strafeDummy = !!opts.strafeDummy;
        this.scale = this.isBoss ? 1.62 : this.isElite ? 1.22 : 1.0;

        this.maxHealth = this.isBoss ? 900 : this.isElite ? 190 : this.isDummy ? 200 : (90 + (opts.wave || 1) * 10);
        this.health = this.maxHealth;
        this.alive = true;

        this.speed = this.isBoss ? 4.4 : this.isElite ? 6.6 : 5.4;
        this.damage = this.isBoss ? 22 : this.isElite ? 14 : 9;
        this.fireCooldown = rand(0.6, 1.5);
        this.stunTimer = 0;
        this.tkFreezeTimer = 0;
        this.regenDelay = 0;
        this._strafeDir = 1;

        const skinCol = this.isBoss ? '#3b0a12' : this.isElite ? '#222838' : this.isDummy ? '#364454' : '#c8d0dc';
        const accentCol = this.isBoss ? '#ff1e38' : this.isElite ? '#aa00ff' : this.isDummy ? '#3fe08a' : '#ff7a1a';
        this.mesh = buildRemoteAvatar(this.isBoss ? 'BOSS: WARDEN' : this.isElite ? 'ELITE' : this.isDummy ? 'TARGET' : '', skinCol, accentCol);
        this.mesh.scale.setScalar(this.scale);
        this.mesh.position.copy(this.pos);

        // Floating HP bar
        const hpBg = new THREE.Mesh(
            new THREE.PlaneGeometry(1.1, 0.11),
            new THREE.MeshBasicMaterial({ color: 0x090d12, side: THREE.DoubleSide })
        );
        hpBg.position.set(0, 2.02, 0);
        this.hpFill = new THREE.Mesh(
            new THREE.PlaneGeometry(1.04, 0.07),
            new THREE.MeshBasicMaterial({ color: this.isBoss ? 0xff1e38 : this.isElite ? 0xaa00ff : 0xff7a1a, side: THREE.DoubleSide })
        );
        this.hpFill.position.set(0, 2.02, 0.005);
        this.mesh.add(hpBg, this.hpFill);

        const wm = buildWeaponMesh(this.isBoss ? 'lmg' : this.isElite ? 'ak47' : 'rifle', this.isBoss ? 'crimson' : 'default', false);
        wm.scale.setScalar(0.65);
        wm.position.set(0.28, 1.05, -0.28);
        this.mesh.add(wm);

        this.game.scene.add(this.mesh);
    }

    onHit(dmg) {
        if (!this.alive) return false;
        this.health = Math.max(0, this.health - dmg);
        this.regenDelay = 3.0;
        const pct = clamp(this.health / this.maxHealth, 0, 1);
        this.hpFill.scale.x = Math.max(0.001, pct);
        this.hpFill.position.x = -(1 - pct) * 0.52;
        if (this.health <= 0) {
            this.alive = false;
            return true;
        }
        return false;
    }

    destroy() {
        if (!this.mesh) return;
        this.game.scene.remove(this.mesh);
        this.mesh.traverse(o => {
            if (o.geometry) o.geometry.dispose();
            if (o.material) {
                if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
                else o.material.dispose();
            }
        });
        this.mesh = null;
    }

    update(dt) {
        if (!this.alive || !this.mesh) return;

        if (this.hpFill && this.game.camera) {
            this.hpFill.parent.children.forEach(c => {
                if (c.geometry?.type === 'PlaneGeometry') c.lookAt(this.game.camera.position);
            });
        }

        if (this.tkFreezeTimer > 0) {
            this.tkFreezeTimer = Math.max(0, this.tkFreezeTimer - dt);
            this.mesh.position.copy(this.pos);
            this.mesh.position.y += Math.sin(performance.now() * 0.01) * 0.15;
            this.mesh.rotation.y += dt * 4;
            if (this.mesh.userData.tkRing) this.mesh.userData.tkRing.visible = true;
            return;
        } else if (this.mesh.userData.tkRing) {
            this.mesh.userData.tkRing.visible = false;
        }

        if (this.stunTimer > 0) {
            this.stunTimer = Math.max(0, this.stunTimer - dt);
            return;
        }

        if (this.isDummy) {
            if (this.regenDelay > 0) {
                this.regenDelay -= dt;
            } else if (this.health < this.maxHealth) {
                this.health = Math.min(this.maxHealth, this.health + 45 * dt);
                const pct = clamp(this.health / this.maxHealth, 0, 1);
                this.hpFill.scale.x = Math.max(0.001, pct);
                this.hpFill.position.x = -(1 - pct) * 0.52;
            }
            if (this.strafeDummy) {
                this.pos.x += this._strafeDir * 4.5 * dt;
                if (this.pos.x > 12) this._strafeDir = -1;
                if (this.pos.x < -12) this._strafeDir = 1;
            }
            this.mesh.position.copy(this.pos);
            return;
        }

        const p = this.game.player;
        if (!p || !p.alive) return;

        const toPlayer = _v1.copy(p.pos).sub(this.pos);
        const flatDist = Math.hypot(toPlayer.x, toPlayer.z);
        this.yaw = Math.atan2(-toPlayer.x, -toPlayer.z);
        this.mesh.rotation.y = this.yaw;

        // Movement & obstacle avoidance
        const moveDir = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const desiredDist = this.isBoss ? 10 : 8;
        if (flatDist > desiredDist) {
            this.vel.x = damp(this.vel.x, moveDir.x * this.speed, 8, dt);
            this.vel.z = damp(this.vel.z, moveDir.z * this.speed, 8, dt);
        } else {
            const strafe = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).multiplyScalar(Math.sin(performance.now() * 0.002 + this.pos.z) * this.speed * 0.55);
            this.vel.x = damp(this.vel.x, strafe.x, 6, dt);
            this.vel.z = damp(this.vel.z, strafe.z, 6, dt);
        }

        this.vel.y -= 24 * dt;
        const r = 0.42 * this.scale;
        const nextPos = this.pos.clone();
        nextPos.x += this.vel.x * dt;
        let blockedX = false;
        const boxX = new THREE.Box3(new THREE.Vector3(nextPos.x - r, this.pos.y + 0.2, this.pos.z - r), new THREE.Vector3(nextPos.x + r, this.pos.y + 1.7, this.pos.z + r));
        for (const c of this.game.world.colliders) if (boxX.intersectsBox(c)) { blockedX = true; break; }
        if (!blockedX) this.pos.x = nextPos.x;
        else if (Math.abs(this.vel.y) < 0.2) this.vel.y = 8.5;

        nextPos.z = this.pos.z + this.vel.z * dt;
        let blockedZ = false;
        const boxZ = new THREE.Box3(new THREE.Vector3(this.pos.x - r, this.pos.y + 0.2, nextPos.z - r), new THREE.Vector3(this.pos.x + r, this.pos.y + 1.7, nextPos.z + r));
        for (const c of this.game.world.colliders) if (boxZ.intersectsBox(c)) { blockedZ = true; break; }
        if (!blockedZ) this.pos.z = nextPos.z;
        else if (Math.abs(this.vel.y) < 0.2) this.vel.y = 8.5;

        nextPos.y = this.pos.y + this.vel.y * dt;
        let grounded = false;
        const boxY = new THREE.Box3(new THREE.Vector3(this.pos.x - r, nextPos.y, this.pos.z - r), new THREE.Vector3(this.pos.x + r, nextPos.y + 1.7, this.pos.z + r));
        for (const c of this.game.world.colliders) {
            if (boxY.intersectsBox(c)) {
                if (this.vel.y < 0) grounded = true;
                this.vel.y = 0;
                break;
            }
        }
        if (!grounded) this.pos.y = nextPos.y;
        if (this.pos.y < this.game.world.killY) {
            this.alive = false;
            return;
        }

        this.mesh.position.copy(this.pos);
        const hSpd = Math.hypot(this.vel.x, this.vel.z);
        if (this.mesh.userData.legs && hSpd > 0.4) {
            this.mesh.userData.walkPhase = (this.mesh.userData.walkPhase || 0) + dt * hSpd * 2.2;
            const sw = Math.sin(this.mesh.userData.walkPhase) * 0.55;
            this.mesh.userData.legs[0].rotation.x = sw;
            this.mesh.userData.legs[1].rotation.x = -sw;
        }

        // Combat firing
        this.fireCooldown -= dt;
        if (this.fireCooldown <= 0 && flatDist < 42) {
            this.fireCooldown = this.isBoss ? 0.26 : this.isElite ? 0.55 : rand(0.85, 1.35);
            const origin = this.pos.clone().add(new THREE.Vector3(0, 1.35 * this.scale, 0));
            const target = p.getEyePos().add(new THREE.Vector3(rand(-0.35, 0.35), rand(-0.25, 0.25), rand(-0.35, 0.35)));
            const dir = target.clone().sub(origin);
            const dist = dir.length();
            dir.normalize();

            const ray = new THREE.Raycaster(origin, dir, 0.2, dist);
            const wallHits = ray.intersectObjects(this.game.world.meshes, false);
            if (wallHits.length === 0) {
                audio.shoot(this.isBoss ? 'lmg' : 'rifle', origin);
                this.game.effects.tracer(origin, target, this.isBoss ? 0xff1e38 : this.isElite ? 0xaa00ff : 0xff7a1a);
                if (Math.random() < (this.isBoss ? 0.62 : 0.48)) {
                    if (p.parryTimer > 0 && p.currentWeapon?.kind === 'katana') {
                        this.onHit(this.damage * 2.5);
                        this.game.effects.katanaParry(p.pos.clone().add(new THREE.Vector3(0, 1.2, 0)));
                        audio.katanaParry();
                        this.game.ui.showCenterMsg('KATANA PARRY!', 'DEFLECTED', 650);
                    } else {
                        this.game.lastAttackerName = this.isBoss ? 'BOSS: WARDEN' : this.isElite ? 'ELITE TROOPER' : 'BLACKSITE UNIT';
                        p.onHit(this.damage, false, origin);
                        if (!p.alive) this.game.onPlayerDied();
                    }
                }
            }
        }
    }
}

/* ===== UNIFIED UI MANAGER (MENUS, 3D ARMORY, LOADOUT, CHALLENGES, HUD) ===== */
class UIManager {
    constructor(game) {
        this.game = game;
        this.shopWeapon = 'rifle';
        this.shopCamo = 'default';
        this.shopPreview = null;
        this.menuOperatorPreview = null;
        this.selectedLoadoutSlot = 0;

        this._ensureOverlays();
        this._bindMenus();
        this.refreshMenuStats();
    }

    _ensureOverlays() {
        if (!document.getElementById('psyOverlay')) {
            const d = document.createElement('div');
            d.id = 'psyOverlay';
            document.body.appendChild(d);
        }
        if (!document.getElementById('blinkOverlay')) {
            const d = document.createElement('div');
            d.id = 'blinkOverlay';
            document.body.appendChild(d);
        }
    }

    _showPanel(panel) {
        if (!panel) return;
        panel.classList.remove('hidden');
        panel.classList.add('show');
        panel.style.display = '';
    }

    _hidePanel(panel) {
        if (!panel) return;
        panel.classList.add('hidden');
        panel.classList.remove('show');
    }

    _findByText(selector, upperKeyword) {
        const els = Array.from(document.querySelectorAll(selector));
        return els.find(el => el.textContent && el.textContent.toUpperCase().includes(upperKeyword));
    }

    _bindMenus() {
        // 1. Main Menu Navigation Buttons (supports both IDs and visible labels from index.html)
        const btnWave = document.getElementById('btnSoloWave') || document.getElementById('btnWave') || document.getElementById('btnSolo') || this._findByText('button, .menu-btn, .nav-btn', 'SOLO WAVE');
        const btnTrain = document.getElementById('btnTraining') || document.getElementById('btnTrainingGrounds') || this._findByText('button, .menu-btn, .nav-btn', 'TRAINING GROUNDS');
        const btnMp = document.getElementById('btnMultiplayer') || document.getElementById('btnMP') || this._findByText('button, .menu-btn, .nav-btn', 'MULTIPLAYER');
        const btnLoadout = document.getElementById('btnLoadout') || this._findByText('button, .menu-btn, .nav-btn', 'LOADOUT');
        const btnArmory = document.getElementById('btnArmory') || document.getElementById('btnShop') || this._findByText('button, .menu-btn, .nav-btn', 'ARMORY');
        const btnChallenges = document.getElementById('btnChallenges') || document.getElementById('btnMastery') || this._findByText('button, .menu-btn, .nav-btn', 'MASTERY');
        const btnSettings = document.getElementById('btnSettings') || this._findByText('button, .menu-btn, .nav-btn', 'SETTINGS');

        if (btnWave) btnWave.onclick = () => { audio.ui(); this.game._startGame('WAVE', this.game.selectedMap, false); };
        if (btnTrain) btnTrain.onclick = () => { audio.ui(); this.game._startGame('TRAINING', this.game.selectedMap, false); };
        if (btnMp) btnMp.onclick = () => { audio.ui(); this.openPanel('mp'); this.game.net.refreshPublicServers(); };
        if (btnLoadout) btnLoadout.onclick = () => { audio.ui(); this.openPanel('loadout'); };
        if (btnArmory) btnArmory.onclick = () => { audio.ui(); this.openPanel('shop'); };
        if (btnChallenges) btnChallenges.onclick = () => { audio.ui(); this.openPanel('challenges'); };
        if (btnSettings) btnSettings.onclick = () => { audio.ui(); this.openPanel('settings'); };

        // 2. Arena Cards (BLACKSITE, FOUNDRY, ABYSS, THE VOID, ZENITH)
        const mapKeys = ['blacksite', 'foundry', 'abyss', 'void', 'zenith'];
        const mapLabels = { blacksite: 'BLACKSITE', foundry: 'FOUNDRY', abyss: 'ABYSS', void: 'THE VOID', zenith: 'ZENITH' };
        const arenaCards = [];
        for (const mk of mapKeys) {
            const card = document.querySelector(`[data-map="${mk}"]`) || this._findByText('.map-card, .arena-card, .map-item, [data-map]', mapLabels[mk]);
            if (card) {
                arenaCards.push({ key: mk, el: card });
                card.style.cursor = 'pointer';
                card.onclick = () => {
                    audio.ui();
                    this.game.selectedMap = mk;
                    arenaCards.forEach(c => {
                        const active = c.key === mk;
                        c.el.classList.toggle('active', active);
                        c.el.classList.toggle('selected', active);
                        c.el.style.borderColor = active ? 'var(--accent)' : '';
                    });
                    this.game.loadMenuBackground(mk);
                };
            }
        }

        // 3. Operator Identity Input + 3D Operator Preview
        const nameInput = document.getElementById('playerName') || document.getElementById('operatorName') || document.querySelector('input[type="text"]');
        if (nameInput) {
            nameInput.value = SaveSystem.data.playerName;
            nameInput.addEventListener('input', () => {
                const val = nameInput.value.trim().toUpperCase() || 'OPERATOR';
                SaveSystem.data.playerName = val;
                this.game.net.myName = val;
                SaveSystem.save();
            });
            const parentBox = nameInput.parentElement;
            if (parentBox && !parentBox.querySelector('.operator-3d-wrap')) {
                const wrap = document.createElement('div');
                wrap.className = 'operator-3d-wrap';
                wrap.style.cssText = 'margin-top:12px;display:flex;flex-direction:column;align-items:center;gap:8px;';
                this.menuOperatorPreview = new Preview3D(210, 220, true);
                this.menuOperatorPreview.renderer.domElement.style.border = '1px solid rgba(255,255,255,0.08)';
                this.menuOperatorPreview.renderer.domElement.style.background = 'radial-gradient(circle, rgba(255,255,255,0.05), rgba(0,0,0,0.6))';
                wrap.appendChild(this.menuOperatorPreview.renderer.domElement);

                const skinRow = document.createElement('div');
                skinRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;justify-content:center;';
                for (const skKey of Object.keys(SKINS)) {
                    const sk = SKINS[skKey];
                    const b = document.createElement('button');
                    b.textContent = sk.name;
                    b.style.cssText = 'font-size:9px;padding:3px 6px;background:rgba(15,20,28,0.85);color:#e8ecf0;border:1px solid rgba(255,255,255,0.16);cursor:pointer;letter-spacing:1px;';
                    b.onclick = () => {
                        audio.ui();
                        SaveSystem.data.selectedSkin = skKey;
                        SaveSystem.data.settings.skinColor = sk.skin;
                        SaveSystem.data.settings.uiColor = sk.accent;
                        document.documentElement.style.setProperty('--accent', sk.accent);
                        SaveSystem.save();
                        this.updateOperatorPreview();
                    };
                    skinRow.appendChild(b);
                }
                wrap.appendChild(skinRow);
                parentBox.appendChild(wrap);
                this.updateOperatorPreview();
            }
        }

        // 4. Multiplayer & Lobby Buttons
        const btnHostPriv = document.getElementById('btnHostPrivate') || this._findByText('#mpPanel button, button', 'HOST PRIVATE');
        const btnHostPub = document.getElementById('btnHostPublic') || this._findByText('#mpPanel button, button', 'HOST PUBLIC');
        const btnJoinCode = document.getElementById('btnJoinCode') || this._findByText('#mpPanel button, button', 'JOIN');
        const btnRefreshSrv = document.getElementById('btnRefreshServers') || this._findByText('#mpPanel button, button', 'REFRESH');
        const btnStartMatch = document.getElementById('btnStartMatch');
        const btnLeaveLobby = document.getElementById('btnLeaveLobby') || this._findByText('#waitingLobby button, button', 'LEAVE');

        if (btnHostPriv) btnHostPriv.onclick = () => {
            audio.ui();
            const maxP = parseInt(document.getElementById('hostMaxPlayers')?.value || '4', 10);
            this.game.isMultiplayer = true;
            this._hidePanel(document.getElementById('mpPanel'));
            this.game.net.host(maxP, false);
        };
        if (btnHostPub) btnHostPub.onclick = () => {
            audio.ui();
            const maxP = parseInt(document.getElementById('hostMaxPlayers')?.value || '4', 10);
            this.game.isMultiplayer = true;
            this._hidePanel(document.getElementById('mpPanel'));
            this.game.net.host(maxP, true);
        };
        if (btnJoinCode) btnJoinCode.onclick = () => {
            audio.ui();
            const code = (document.getElementById('joinRoomCode')?.value || '').trim().toUpperCase();
            if (!code) { alert('Enter a room code (e.g. BSR-XXXX)'); return; }
            this.game.isMultiplayer = true;
            this._hidePanel(document.getElementById('mpPanel'));
            this.game.net.join(code);
        };
        if (btnRefreshSrv) btnRefreshSrv.onclick = () => { audio.ui(); this.game.net.refreshPublicServers(); };
        if (btnStartMatch) btnStartMatch.onclick = () => { audio.ui(); this.game.net.startMatch(); };
        if (btnLeaveLobby) btnLeaveLobby.onclick = () => { audio.ui(); this.game._quitToMenu(); };

        // 5. Pause & Death Screen Buttons
        const btnResume = document.getElementById('btnResume') || this._findByText('#pauseMenu button, button', 'RESUME');
        const btnQuit = document.getElementById('btnQuitMenu') || document.getElementById('btnQuit') || this._findByText('#pauseMenu button, button', 'QUIT');
        const btnRespawn = document.getElementById('btnRespawn') || this._findByText('#deathScreen button, button', 'RESPAWN');
        const btnDeathMenu = document.getElementById('btnDeathMenu') || this._findByText('#deathScreen button, button', 'MAIN MENU');

        if (btnResume) btnResume.onclick = () => { audio.ui(); this.game.setPaused(false); };
        if (btnQuit) btnQuit.onclick = () => { audio.ui(); this.game._quitToMenu(); };
        if (btnRespawn) btnRespawn.onclick = () => { audio.ui(); this.game.respawnPlayer(); };
        if (btnDeathMenu) btnDeathMenu.onclick = () => { audio.ui(); this.game._quitToMenu(); };

        // 6. Close buttons inside modal panels
        document.querySelectorAll('.close-panel, .btn-close, [data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                audio.ui();
                const panel = btn.closest('.panel, .modal, .overlay-panel') || btn.parentElement;
                this._hidePanel(panel);
            });
        });

        // 7. Training Grounds Sandbox Bar (if present or injected in Training mode)
        this._setupTrainingToolbar();
    }

    _getOrCreateModal(id, titleText) {
        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement('div');
            el.id = id;
            el.className = 'panel hidden';
            el.style.cssText = 'position:fixed;inset:48px;z-index:60;background:rgba(8,12,18,0.96);border:1px solid var(--accent);padding:24px;overflow-y:auto;color:#e8ecf0;font-family:inherit;display:flex;flex-direction:column;gap:16px;';
            document.body.appendChild(el);
        }
        if (!el.querySelector('.bsr-modal-body')) {
            el.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:12px;">
                    <div style="font-size:20px;font-weight:700;letter-spacing:3px;color:var(--accent);">${titleText}</div>
                    <div style="display:flex;align-items:center;gap:16px;">
                        <span class="bsr-modal-pts" style="font-size:13px;letter-spacing:2px;color:#ffdd44;">POINTS: ${SaveSystem.data.points}</span>
                        <button class="bsr-modal-close" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;cursor:pointer;letter-spacing:2px;">CLOSE [ESC]</button>
                    </div>
                </div>
                <div class="bsr-modal-body" style="flex:1;overflow-y:auto;"></div>
            `;
            el.querySelector('.bsr-modal-close').onclick = () => { audio.ui(); this._hidePanel(el); };
        }
        const ptsEl = el.querySelector('.bsr-modal-pts');
        if (ptsEl) ptsEl.textContent = `POINTS: ${SaveSystem.data.points}`;
        return el;
    }

    openPanel(kind) {
        ['mpPanel', 'loadoutPanel', 'shopPanel', 'challengesPanel', 'settingsPanel'].forEach(id => {
            const p = document.getElementById(id);
            if (p) this._hidePanel(p);
        });

        if (kind === 'mp') {
            const mp = document.getElementById('mpPanel');
            if (mp) this._showPanel(mp);
            return;
        }
        if (kind === 'loadout') {
            const el = this._getOrCreateModal('loadoutPanel', 'TACTICAL 4-SLOT LOADOUT');
            this._renderLoadout(el.querySelector('.bsr-modal-body'));
            this._showPanel(el);
        } else if (kind === 'shop') {
            const el = this._getOrCreateModal('shopPanel', 'ARMORY // WEAPONS, TRACERS & 3D DRAGON');
            this._renderShop(el.querySelector('.bsr-modal-body'));
            this._showPanel(el);
        } else if (kind === 'challenges') {
            const el = this._getOrCreateModal('challengesPanel', 'MASTERY CHALLENGES // +1,000 PTS EACH');
            this._renderChallenges(el.querySelector('.bsr-modal-body'));
            this._showPanel(el);
        } else if (kind === 'settings') {
            const el = this._getOrCreateModal('settingsPanel', 'SYSTEM & OPERATOR SETTINGS');
            this._renderSettings(el.querySelector('.bsr-modal-body'));
            this._showPanel(el);
        }
    }

    _renderLoadout(container) {
        SaveSystem.normalizeLoadout();
        const slotLabels = ['SLOT 1 // PRIMARY', 'SLOT 2 // SECONDARY', 'SLOT 3 // HEAVY', 'SLOT 4 // MELEE'];
        const equipped = SaveSystem.data.equippedLoadout;

        let slotsHtml = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">`;
        equipped.forEach((wk, idx) => {
            const w = WEAPON_DEFS[wk];
            const camo = SaveSystem.data.equippedCamos[wk] || 'default';
            const active = idx === this.selectedLoadoutSlot;
            slotsHtml += `
                <div class="loadoutSlot" data-slot="${idx}" style="padding:14px;border:1px solid ${active ? 'var(--accent)' : 'rgba(255,255,255,0.14)'};background:${active ? 'rgba(255,122,26,0.12)' : 'rgba(15,20,28,0.75)'};cursor:pointer;">
                    <div style="font-size:10px;letter-spacing:2px;opacity:0.65;">${slotLabels[idx]}</div>
                    <div style="font-size:15px;font-weight:700;margin-top:6px;">${w.name}</div>
                    <div class="slotCamo">CAMO: ${CAMO_NAMES[camo]}</div>
                </div>
            `;
        });
        slotsHtml += `</div>`;

        let weaponsHtml = `<div style="font-size:12px;letter-spacing:2px;margin-bottom:10px;opacity:0.8;">SELECT WEAPON FOR ${slotLabels[this.selectedLoadoutSlot]}:</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;">`;

        for (const wk of SHOP_WEAPONS) {
            const w = WEAPON_DEFS[wk];
            const unlocked = SaveSystem.data.unlockedWeapons.includes(wk);
            const isEquippedInSlot = equipped[this.selectedLoadoutSlot] === wk;
            const camo = SaveSystem.data.equippedCamos[wk] || 'default';
            weaponsHtml += `
                <div class="loadoutItem ${isEquippedInSlot ? 'equipped' : ''}" data-wk="${wk}" style="padding:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(12,16,22,0.8);cursor:${unlocked ? 'pointer' : 'not-allowed'};opacity:${unlocked ? 1 : 0.45};">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <strong>${w.name}</strong>
                        <span style="font-size:10px;color:${unlocked ? '#3fe08a' : '#ff5555'};">${isEquippedInSlot ? 'EQUIPPED' : unlocked ? 'OWNED' : 'LOCKED'}</span>
                    </div>
                    <div style="font-size:11px;opacity:0.7;margin-top:4px;">DMG ${w.damage} · RPM ${w.rpm} · CAMO: ${camo.toUpperCase()}</div>
                </div>
            `;
        }
        weaponsHtml += `</div>`;
        container.innerHTML = slotsHtml + weaponsHtml;

        container.querySelectorAll('.loadoutSlot').forEach(el => {
            el.onclick = () => {
                audio.ui();
                this.selectedLoadoutSlot = parseInt(el.dataset.slot, 10);
                this._renderLoadout(container);
            };
        });

        container.querySelectorAll('.loadoutItem').forEach(el => {
            el.onclick = () => {
                const wk = el.dataset.wk;
                if (!SaveSystem.data.unlockedWeapons.includes(wk)) return;
                audio.ui();
                const otherIdx = SaveSystem.data.equippedLoadout.indexOf(wk);
                if (otherIdx !== -1 && otherIdx !== this.selectedLoadoutSlot) {
                    SaveSystem.data.equippedLoadout[otherIdx] = SaveSystem.data.equippedLoadout[this.selectedLoadoutSlot];
                }
                SaveSystem.data.equippedLoadout[this.selectedLoadoutSlot] = wk;
                SaveSystem.save();
                if (this.game.player) this.game.player.initLoadout();
                this.updateOperatorPreview();
                this._renderLoadout(container);
            };
        });
    }

    _renderShop(container) {
        const w = WEAPON_DEFS[this.shopWeapon];
        const wUnlocked = SaveSystem.data.unlockedWeapons.includes(this.shopWeapon);
        const camoKey = `${this.shopWeapon}:${this.shopCamo}`;
        const cUnlocked = SaveSystem.data.unlockedCamos.includes(camoKey);
        const cEquipped = SaveSystem.data.equippedCamos[this.shopWeapon] === this.shopCamo;

        let weaponTabs = `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">`;
        for (const wk of SHOP_WEAPONS) {
            const active = wk === this.shopWeapon;
            weaponTabs += `<button class="bsr-shop-w" data-wk="${wk}" style="padding:7px 12px;border:1px solid ${active ? 'var(--accent)' : 'rgba(255,255,255,0.16)'};background:${active ? 'rgba(255,122,26,0.2)' : 'rgba(14,18,26,0.85)'};color:#fff;cursor:pointer;font-size:11px;letter-spacing:1.5px;">${WEAPON_DEFS[wk].shortName}</button>`;
        }
        weaponTabs += `</div>`;

        let camoGrid = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:8px;margin-top:14px;">`;
        for (const cm of CAMO_ORDER) {
            const owned = SaveSystem.data.unlockedCamos.includes(`${this.shopWeapon}:${cm}`);
            const selected = cm === this.shopCamo;
            camoGrid += `
                <div class="bsr-shop-c" data-cm="${cm}" style="padding:10px;border:1px solid ${selected ? 'var(--accent)' : 'rgba(255,255,255,0.14)'};background:rgba(12,16,22,0.85);cursor:pointer;">
                    <div style="height:22px;border-radius:2px;background:${CAMO_SWATCH_CSS[cm]};margin-bottom:6px;border:1px solid rgba(255,255,255,0.15);"></div>
                    <div style="font-size:12px;font-weight:700;">${CAMO_NAMES[cm]}</div>
                    <div style="font-size:10px;opacity:0.75;margin-top:2px;">${CAMO_DESCS[cm]}</div>
                    <div style="font-size:11px;margin-top:6px;color:${owned ? '#3fe08a' : '#ffdd44'};">${owned ? 'UNLOCKED' : CAMO_PRICES[cm] + ' PTS'}</div>
                </div>
            `;
        }
        camoGrid += `</div>`;

        let actionHtml = '';
        if (!wUnlocked) {
            actionHtml = `<button id="bsrBuyWeapon" style="padding:10px 20px;background:var(--accent);color:#080a0e;font-weight:700;border:none;cursor:pointer;letter-spacing:2px;">UNLOCK ${w.name} (${w.price} PTS)</button>`;
        } else if (!cUnlocked) {
            const price = CAMO_PRICES[this.shopCamo];
            actionHtml = `<button id="bsrBuyCamo" style="padding:10px 20px;background:var(--accent);color:#080a0e;font-weight:700;border:none;cursor:pointer;letter-spacing:2px;">UNLOCK ${CAMO_NAMES[this.shopCamo].toUpperCase()} (${price} PTS)</button>`;
        } else if (!cEquipped) {
            actionHtml = `<button id="bsrEquipCamo" style="padding:10px 20px;background:#3fe08a;color:#080a0e;font-weight:700;border:none;cursor:pointer;letter-spacing:2px;">EQUIP ${CAMO_NAMES[this.shopCamo].toUpperCase()}</button>`;
        } else {
            actionHtml = `<span style="padding:10px 16px;border:1px solid #3fe08a;color:#3fe08a;font-size:12px;letter-spacing:2px;">ACTIVE ON ${w.name}</span>`;
        }

        container.innerHTML = `
            ${weaponTabs}
            <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:18px;align-items:center;background:rgba(10,14,20,0.8);border:1px solid rgba(255,255,255,0.1);padding:16px;">
                <div id="bsrShop3DHost"></div>
                <div>
                    <div style="font-size:20px;font-weight:700;letter-spacing:2px;">${w.name}</div>
                    <div style="font-size:12px;opacity:0.75;margin:6px 0 12px;">DAMAGE: ${w.damage} · FIRE RATE: ${w.rpm} RPM · MAG: ${w.mag} · DRAG 3D MODEL TO ROTATE</div>
                    ${actionHtml}
                </div>
            </div>
            ${camoGrid}
        `;

        if (!this.shopPreview) this.shopPreview = new Preview3D(360, 170, false);
        this.shopPreview.setWeapon(this.shopWeapon, this.shopCamo);
        container.querySelector('#bsrShop3DHost').appendChild(this.shopPreview.renderer.domElement);

        container.querySelectorAll('.bsr-shop-w').forEach(btn => {
            btn.onclick = () => {
                audio.ui();
                this.shopWeapon = btn.dataset.wk;
                this.shopCamo = SaveSystem.data.equippedCamos[this.shopWeapon] || 'default';
                this._renderShop(container);
            };
        });
        container.querySelectorAll('.bsr-shop-c').forEach(card => {
            card.onclick = () => {
                audio.ui();
                this.shopCamo = card.dataset.cm;
                this._renderShop(container);
            };
        });

        const buyW = container.querySelector('#bsrBuyWeapon');
        if (buyW) buyW.onclick = () => {
            if (SaveSystem.data.points < w.price) { alert('Not enough points!'); return; }
            SaveSystem.data.points -= w.price;
            SaveSystem.data.unlockedWeapons.push(this.shopWeapon);
            SaveSystem.data.unlockedCamos.push(`${this.shopWeapon}:default`);
            SaveSystem.data.equippedCamos[this.shopWeapon] = 'default';
            SaveSystem.save();
            audio.pickup();
            this.refreshMenuStats();
            this.openPanel('shop');
        };

        const buyC = container.querySelector('#bsrBuyCamo');
        if (buyC) buyC.onclick = () => {
            const price = CAMO_PRICES[this.shopCamo];
            if (SaveSystem.data.points < price) { alert('Not enough points!'); return; }
            SaveSystem.data.points -= price;
            SaveSystem.data.unlockedCamos.push(camoKey);
            SaveSystem.data.equippedCamos[this.shopWeapon] = this.shopCamo;
            SaveSystem.save();
            audio.pickup();
            if (this.game.player) this.game.player.initLoadout();
            this.updateOperatorPreview();
            this.refreshMenuStats();
            this.openPanel('shop');
        };

        const eqC = container.querySelector('#bsrEquipCamo');
        if (eqC) eqC.onclick = () => {
            audio.ui();
            SaveSystem.data.equippedCamos[this.shopWeapon] = this.shopCamo;
            SaveSystem.save();
            if (this.game.player) this.game.player.initLoadout();
            this.updateOperatorPreview();
            this._renderShop(container);
        };
    }

    _renderChallenges(container) {
        let html = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">`;
        for (const wk of SHOP_WEAPONS) {
            const w = WEAPON_DEFS[wk];
            const goal = WEAPON_CHALLENGES[wk] || 30;
            const prog = SaveSystem.data.challenges[wk] || 0;
            const claimed = !!SaveSystem.data.challenges[wk + '_claimed'];
            const done = prog >= goal;
            const pct = clamp((prog / goal) * 100, 0, 100);
            html += `
                <div style="padding:14px;border:1px solid ${done ? '#3fe08a' : 'rgba(255,255,255,0.14)'};background:rgba(12,16,22,0.85);">
                    <div style="display:flex;justify-content:space-between;font-weight:700;">
                        <span>${w.name}</span>
                        <span>${Math.min(prog, goal)} / ${goal} KILLS</span>
                    </div>
                    <div style="height:6px;background:rgba(255,255,255,0.1);margin:10px 0;">
                        <div style="height:100%;width:${pct}%;background:${done ? '#3fe08a' : 'var(--accent)'};"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:11px;opacity:0.75;">REWARD: +1,000 PTS</span>
                        ${claimed
                    ? `<span style="font-size:11px;color:#3fe08a;">CLAIMED ✓</span>`
                    : done
                        ? `<button class="bsr-claim" data-wk="${wk}" style="padding:5px 12px;background:#3fe08a;color:#05080c;font-weight:700;border:none;cursor:pointer;font-size:11px;">CLAIM +1000</button>`
                        : `<span style="font-size:11px;opacity:0.5;">IN PROGRESS</span>`
                }
                    </div>
                </div>
            `;
        }
        html += `</div>`;
        container.innerHTML = html;

        container.querySelectorAll('.bsr-claim').forEach(btn => {
            btn.onclick = () => {
                const wk = btn.dataset.wk;
                if (SaveSystem.data.challenges[wk + '_claimed']) return;
                SaveSystem.data.challenges[wk + '_claimed'] = true;
                SaveSystem.data.points += 1000;
                SaveSystem.save();
                audio.pickup();
                this.refreshMenuStats();
                this.openPanel('challenges');
            };
        });
    }

    _renderSettings(container) {
        const s = SaveSystem.data.settings;
        container.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;max-width:780px;">
                <label style="display:flex;flex-direction:column;gap:6px;">
                    <span>MASTER VOLUME: <strong id="lblVol">${Math.round(s.volume * 100)}%</strong></span>
                    <input id="setVol" type="range" min="0" max="1" step="0.05" value="${s.volume}">
                </label>
                <label style="display:flex;flex-direction:column;gap:6px;">
                    <span>MUSIC VOLUME: <strong id="lblMusic">${Math.round(s.musicVolume * 100)}%</strong></span>
                    <input id="setMusic" type="range" min="0" max="1" step="0.05" value="${s.musicVolume}">
                </label>
                <label style="display:flex;flex-direction:column;gap:6px;">
                    <span>FIELD OF VIEW: <strong id="lblFov">${s.fov}°</strong></span>
                    <input id="setFov" type="range" min="70" max="120" step="1" value="${s.fov}">
                </label>
                <label style="display:flex;flex-direction:column;gap:6px;">
                    <span>LOOK SENSITIVITY: <strong id="lblSens">${s.sensitivity.toFixed(2)}</strong></span>
                    <input id="setSens" type="range" min="0.2" max="3.0" step="0.05" value="${s.sensitivity}">
                </label>
                <label style="display:flex;flex-direction:column;gap:6px;">
                    <span>SCOPE SENSITIVITY: <strong id="lblScope">${s.scopeSensitivity.toFixed(2)}</strong></span>
                    <input id="setScope" type="range" min="0.2" max="2.0" step="0.05" value="${s.scopeSensitivity}">
                </label>
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
                    <input id="setInvY" type="checkbox" ${s.invertY ? 'checked' : ''}>
                    <span>INVERT MOUSE Y-AXIS</span>
                </label>
                <label style="display:flex;align-items:center;gap:12px;">
                    <span>HUD ACCENT COLOR:</span>
                    <input id="setUiCol" type="color" value="${s.uiColor}">
                </label>
                <label style="display:flex;align-items:center;gap:12px;">
                    <span>OPERATOR ARMOR COLOR:</span>
                    <input id="setSkinCol" type="color" value="${s.skinColor}">
                </label>
            </div>
            <div style="margin-top:24px;">
                <button id="btnResetSave" style="padding:8px 16px;background:rgba(255,30,56,0.2);border:1px solid #ff1e38;color:#ff9aa8;cursor:pointer;letter-spacing:2px;">RESET ALL SAVE DATA</button>
            </div>
        `;

        container.querySelector('#setVol').oninput = e => {
            s.volume = parseFloat(e.target.value);
            container.querySelector('#lblVol').textContent = `${Math.round(s.volume * 100)}%`;
            audio.setVolume(s.volume);
            SaveSystem.save();
        };
        container.querySelector('#setMusic').oninput = e => {
            s.musicVolume = parseFloat(e.target.value);
            container.querySelector('#lblMusic').textContent = `${Math.round(s.musicVolume * 100)}%`;
            audio.setMusicVolume(s.musicVolume);
            SaveSystem.save();
        };
        container.querySelector('#setFov').oninput = e => {
            s.fov = parseInt(e.target.value, 10);
            container.querySelector('#lblFov').textContent = `${s.fov}°`;
            SaveSystem.save();
        };
        container.querySelector('#setSens').oninput = e => {
            s.sensitivity = parseFloat(e.target.value);
            container.querySelector('#lblSens').textContent = s.sensitivity.toFixed(2);
            if (this.game.input) this.game.input.sensitivity = s.sensitivity;
            SaveSystem.save();
        };
        container.querySelector('#setScope').oninput = e => {
            s.scopeSensitivity = parseFloat(e.target.value);
            container.querySelector('#lblScope').textContent = s.scopeSensitivity.toFixed(2);
            SaveSystem.save();
        };
        container.querySelector('#setInvY').onchange = e => {
            s.invertY = e.target.checked;
            if (this.game.input) this.game.input.invertY = s.invertY;
            SaveSystem.save();
        };
        container.querySelector('#setUiCol').oninput = e => {
            s.uiColor = e.target.value;
            document.documentElement.style.setProperty('--accent', s.uiColor);
            this.updateOperatorPreview();
            SaveSystem.save();
        };
        container.querySelector('#setSkinCol').oninput = e => {
            s.skinColor = e.target.value;
            this.updateOperatorPreview();
            SaveSystem.save();
        };
        container.querySelector('#btnResetSave').onclick = () => SaveSystem.reset();
    }

    _setupTrainingToolbar() {
        let bar = document.getElementById('trainingBar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'trainingBar';
            bar.className = 'hidden';
            bar.style.cssText = 'position:fixed;top:64px;left:18px;z-index:35;background:rgba(8,12,18,0.85);border:1px solid rgba(255,255,255,0.16);padding:10px;display:flex;flex-direction:column;gap:6px;';
            bar.innerHTML = `
                <div style="font-size:10px;letter-spacing:2px;opacity:0.75;">TRAINING SANDBOX</div>
                <div style="display:flex;flex-wrap:wrap;gap:5px;">
                    <button class="tg-btn" id="tgSpawnStatic">SPAWN TARGET</button>
                    <button class="tg-btn" id="tgSpawnStrafe">STRAFE BOT</button>
                    <button class="tg-btn" id="tgClearBots">CLEAR BOTS</button>
                    <button class="tg-btn" id="tgRefill">REFILL ALL</button>
                </div>
                <div class="tg-ability-row">
                    <button class="tg-btn ab" id="tgKatana">EQUIP KATANA</button>
                    <button class="tg-btn ab" id="tgBlink">BLINK [F]</button>
                    <button class="tg-btn ab" id="tgTk">TELEKINESIS [SHIFT+F]</button>
                    <button class="tg-btn sukuna" id="tgSukuna">AWAKEN SUKUNA [V]</button>
                    <button class="tg-btn sukuna" id="tgDomain">DOMAIN [E]</button>
                </div>
            `;
            document.body.appendChild(bar);
        }
        const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
        bind('tgSpawnStatic', () => this.game.spawnTrainingBot(false));
        bind('tgSpawnStrafe', () => this.game.spawnTrainingBot(true));
        bind('tgClearBots', () => this.game.clearBots());
        bind('tgRefill', () => {
            if (this.game.player) {
                this.game.player.health = this.game.player.maxHealth;
                this.game.player.shield = 100;
                this.game.player.medkits = 3;
                this.game.player.flashbangs = 3;
                this.game.player.refillAllAmmo();
            }
        });
        bind('tgKatana', () => {
            if (!SaveSystem.data.unlockedWeapons.includes('katana')) SaveSystem.data.unlockedWeapons.push('katana');
            SaveSystem.data.equippedLoadout[3] = 'katana';
            this.game.player?.initLoadout();
            this.game.player?.switchSlot(3);
        });
        bind('tgBlink', () => this.game.abilitySystem.useBlink());
        bind('tgTk', () => this.game.abilitySystem.useTelekinesis());
        bind('tgSukuna', () => this.game.abilitySystem.activateSukuna());
        bind('tgDomain', () => this.game.abilitySystem.useDomainExpansion());
    }

    updateOperatorPreview() {
        if (!this.menuOperatorPreview) return;
        const primary = SaveSystem.data.equippedLoadout[0] || 'rifle';
        const camo = SaveSystem.data.equippedCamos[primary] || 'default';
        this.menuOperatorPreview.setOperator(
            SaveSystem.data.settings.skinColor,
            SaveSystem.data.settings.uiColor,
            primary,
            camo
        );
    }

    refreshMenuStats() {
        const ptsEl = document.getElementById('pointsVal') || document.getElementById('menuPoints');
        if (ptsEl) ptsEl.textContent = SaveSystem.data.points;
        document.querySelectorAll('*').forEach(el => {
            if (el.children.length === 0 && /^POINTS\s+\d+$/i.test(el.textContent.trim())) {
                el.textContent = `POINTS ${SaveSystem.data.points}`;
            }
        });
    }

    updateSlotNames(weapons) {
        weapons.forEach((w, i) => {
            const el = document.getElementById(`slot${i}`) || document.querySelector(`[data-hud-slot="${i}"]`);
            if (el) el.textContent = `[${i + 1}] ${w.shortName}`;
        });
    }

    showCenterMsg(title, sub = '', duration = 1600) {
        let box = document.getElementById('centerMsg');
        if (!box) {
            box = document.createElement('div');
            box.id = 'centerMsg';
            box.style.cssText = 'position:fixed;top:24%;left:50%;transform:translateX(-50%);z-index:45;text-align:center;pointer-events:none;transition:opacity 0.25s;';
            document.body.appendChild(box);
        }
        box.innerHTML = `
            <div style="font-size:22px;font-weight:800;letter-spacing:4px;color:var(--accent);text-shadow:0 0 18px rgba(0,0,0,0.9);">${title}</div>
            ${sub ? `<div style="font-size:12px;letter-spacing:2.5px;color:#e8ecf0;margin-top:4px;text-shadow:0 0 10px #000;">${sub}</div>` : ''}
        `;
        box.style.opacity = '1';
        clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(() => { box.style.opacity = '0'; }, duration);
    }

    addKillFeed(text, isHeadshot = false) {
        let feed = document.getElementById('killFeed');
        if (!feed) {
            feed = document.createElement('div');
            feed.id = 'killFeed';
            feed.style.cssText = 'position:fixed;top:70px;right:18px;z-index:35;display:flex;flex-direction:column;gap:4px;pointer-events:none;align-items:flex-end;';
            document.body.appendChild(feed);
        }
        const row = document.createElement('div');
        row.style.cssText = `background:rgba(8,12,18,0.82);border-right:3px solid ${isHeadshot ? '#ff1e38' : 'var(--accent)'};padding:4px 10px;font-size:11px;letter-spacing:1.5px;color:#fff;`;
        row.textContent = isHeadshot ? `${text} [HEADSHOT]` : text;
        feed.appendChild(row);
        setTimeout(() => { row.remove(); }, 4200);
    }

    popSkull() {
        const hm = document.getElementById('hitmarker');
        if (hm) {
            hm.classList.add('kill', 'active');
            clearTimeout(this._hmTo);
            this._hmTo = setTimeout(() => hm.classList.remove('kill', 'active'), 260);
        }
    }

    flashHitmarker(isHead = false) {
        const hm = document.getElementById('hitmarker');
        if (hm) {
            hm.classList.toggle('head', isHead);
            hm.classList.add('active');
            clearTimeout(this._hmTo);
            this._hmTo = setTimeout(() => hm.classList.remove('head', 'active'), 140);
        }
    }

    updateHUD(game) {
        const p = game.player;
        if (!p) return;

        const hpEl = document.getElementById('hpVal');
        const hpFill = document.getElementById('hpFill');
        const shEl = document.getElementById('shieldVal');
        const shFill = document.getElementById('shieldFill');
        const ammoCur = document.getElementById('ammoCur');
        const ammoRes = document.getElementById('ammoRes');
        const wNameEl = document.getElementById('weaponName');
        const waveEl = document.getElementById('waveVal');
        const enemiesEl = document.getElementById('enemiesVal');
        const scoreEl = document.getElementById('scoreVal');
        const speedEl = document.getElementById('speedVal');
        const medEl = document.getElementById('medkitCount');
        const flashEl = document.getElementById('flashbangCount');

        if (hpEl) hpEl.textContent = Math.ceil(p.health);
        if (hpFill) hpFill.style.width = `${clamp((p.health / p.maxHealth) * 100, 0, 100)}%`;
        if (shEl) shEl.textContent = Math.ceil(p.shield);
        if (shFill) shFill.style.width = `${clamp(p.shield, 0, 100)}%`;

        const w = p.currentWeapon;
        if (w) {
            const inf = w.melee || w.kind === 'dismantle';
            if (ammoCur) ammoCur.textContent = inf ? '∞' : w.ammo;
            if (ammoRes) ammoRes.textContent = inf ? '/ ∞' : `/ ${w.reserveAmmo}`;
            if (wNameEl) wNameEl.textContent = w.name;
        }

        for (let i = 0; i < 4; i++) {
            const slotEl = document.getElementById(`slot${i}`);
            if (slotEl) slotEl.classList.toggle('active', p.currentSlot === i);
        }

        if (waveEl) waveEl.textContent = game.mode === 'WAVE' ? String(game.wave).padStart(2, '0') : game.mode;
        if (enemiesEl) enemiesEl.textContent = game.bots ? game.bots.filter(b => b.alive).length : 0;
        if (scoreEl) scoreEl.textContent = game.kills;
        if (speedEl && p.vel) speedEl.textContent = Math.round(Math.hypot(p.vel.x, p.vel.z) * 10);
        if (medEl) medEl.textContent = p.medkits ?? 0;
        if (flashEl) flashEl.textContent = p.flashbangs ?? 0;
    }
}

/* ===== MAIN GAME CONTROLLER ===== */
class Game {
    constructor() {
        window.game = this;
        this.canvas = document.getElementById('gameCanvas') || document.querySelector('canvas') || (() => {
            const c = document.createElement('canvas');
            c.id = 'gameCanvas';
            c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;';
            document.body.prepend(c);
            return c;
        })();

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(innerWidth, innerHeight);
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(SaveSystem.data.settings.fov, innerWidth / innerHeight, 0.1, 300);
        this.scene.add(this.camera);

        this.input = new Input(this.canvas);
        this.net = new NetworkManager(this);
        this.effects = new EffectsSystem(this.scene);
        this.abilitySystem = new AbilitySystem(this);
        this.player = new Player(this);

        this.mode = 'MENU';
        this.selectedMap = 'blacksite';
        this.isMultiplayer = false;
        this.paused = false;

        this.world = null;
        this.bots = [];
        this.remoteMeshes = {};
        this._remoteDeathState = {};

        this.wave = 1;
        this.waveCooldown = 0;
        this.kills = 0;
        this.pointsEarned = 0;
        this.sukunaCharge = 0;
        this.streakCount = 0;
        this.streakTimer = 0;

        this.domainActive = false;
        this.domainIsCaster = false;
        this.domainCenter = new THREE.Vector3();
        this.domainTimer = 0;
        this.domainTick = 0;
        this.domainDome = null;

        this.clash = { active: false, oppId: null, myScore: 0, oppScore: 0, timer: 0, duration: 6 };

        this.ui = new UIManager(this);
        this._setupInputCallbacks();
        this.loadMenuBackground(this.selectedMap);

        addEventListener('resize', () => {
            this.camera.aspect = innerWidth / innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(innerWidth, innerHeight);
        });

        this._lastTime = performance.now();
        requestAnimationFrame(t => this._loop(t));
    }

    _setupInputCallbacks() {
        this.input.onLockChange = (locked) => {
            if (!locked && this.mode !== 'MENU' && this.player.alive && !this.paused) {
                this.setPaused(true);
            }
        };
        this.input.onTab = (isDown) => {
            if (this.mode === 'MENU') return;
            const sb = document.getElementById('scoreboard');
            if (sb) {
                sb.classList.toggle('hidden', !isDown);
                sb.classList.toggle('show', isDown);
            }
            if (isDown && this.isMultiplayer) this.net.updateLeaderboard();
        };
        addEventListener('pointerdown', () => audio.init(), { once: true });
        addEventListener('keydown', () => audio.init(), { once: true });
    }

    isCoop() {
        return this.mode === 'WAVE' || this.mode === 'COOP';
    }

    _clearSceneEntities() {
        if (window.cleanupAllStandaloneVfx) window.cleanupAllStandaloneVfx();
        this.clearBots();
        for (const id in this.remoteMeshes) {
            this.scene.remove(this.remoteMeshes[id]);
        }
        this.remoteMeshes = {};
        this.abilitySystem.reset();
        this.endDomain();

        while (this.scene.children.length > 0) {
            const obj = this.scene.children[0];
            this.scene.remove(obj);
        }
        this.scene.add(this.camera);
        this.effects = new EffectsSystem(this.scene);
    }

    loadMenuBackground(mapId) {
        this._clearSceneEntities();
        this.world = new World(this.scene, mapId);
        this.camera.position.set(0, 18, 34);
        this.camera.lookAt(0, 2, 0);
        music.playMenu();
    }

    _startGame(mode, mapId, isMp = false) {
        audio.init();
        this.mode = mode;
        this.selectedMap = mapId || this.selectedMap;
        this.isMultiplayer = isMp;
        this.paused = false;

        this._clearSceneEntities();
        this.world = new World(this.scene, this.selectedMap);

        const spawn = this.world.getSafeSpawnPoint(this.net);
        this.player.reset(spawn);
        this.kills = 0;
        this.pointsEarned = 0;
        this.wave = 1;
        this.sukunaCharge = mode === 'TRAINING' ? 100 : 0;

        // Toggle UI overlays
        const menuEl = document.getElementById('mainMenu') || document.querySelector('.menu-screen, #menu');
        if (menuEl) this.ui._hidePanel(menuEl);
        ['mpPanel', 'loadoutPanel', 'shopPanel', 'challengesPanel', 'settingsPanel', 'pauseMenu', 'deathScreen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) this.ui._hidePanel(el);
        });
        const hud = document.getElementById('hud');
        if (hud) this.ui._showPanel(hud);

        const tgBar = document.getElementById('trainingBar');
        if (tgBar) {
            if (mode === 'TRAINING') this.ui._showPanel(tgBar);
            else this.ui._hidePanel(tgBar);
        }

        if (mode === 'WAVE') {
            music.playWave();
            this._spawnWave(1);
        } else if (mode === 'TRAINING') {
            music.playTraining();
            this.spawnTrainingBot(false);
            this.spawnTrainingBot(true);
            this.ui.showCenterMsg('TRAINING GROUNDS', 'ALL ABILITIES & SUKUNA UNLOCKED', 2200);
        } else {
            music.playPVP();
            this.ui.showCenterMsg('MATCH LIVE', `${mode} // ${this.selectedMap.toUpperCase()}`, 1800);
        }

        this.input.lock();
    }

    _quitToMenu() {
        this.input.unlock();
        if (this.isMultiplayer) {
            this.net.disconnect();
            this.isMultiplayer = false;
        }
        this.mode = 'MENU';
        this.paused = false;

        ['hud', 'pauseMenu', 'deathScreen', 'waitingLobby', 'trainingBar', 'scoreboard'].forEach(id => {
            const el = document.getElementById(id);
            if (el) this.ui._hidePanel(el);
        });
        const menuEl = document.getElementById('mainMenu') || document.querySelector('.menu-screen, #menu');
        if (menuEl) this.ui._showPanel(menuEl);

        this.ui.refreshMenuStats();
        this.ui.updateOperatorPreview();
        this.loadMenuBackground(this.selectedMap);
    }

    setPaused(val) {
        this.paused = val;
        const pm = document.getElementById('pauseMenu');
        if (val) {
            this.input.unlock();
            if (pm) this.ui._showPanel(pm);
        } else {
            if (pm) this.ui._hidePanel(pm);
            this.input.lock();
        }
    }

    clearBots() {
        for (const b of this.bots) b.destroy();
        this.bots = [];
    }

    spawnTrainingBot(strafe = false) {
        if (!this.world) return;
        const sp = new THREE.Vector3(rand(-8, 8), 0.3, rand(-10, -2));
        this.bots.push(new Bot(this, sp, { isDummy: true, strafeDummy: strafe }));
    }

    _spawnWave(waveNum) {
        this.wave = waveNum;
        const isBossWave = waveNum % 5 === 0;
        const count = Math.min(18, 3 + waveNum * 2);
        const spawns = this.world.botSpawns.length ? this.world.botSpawns : [new THREE.Vector3(0, 0.3, -22)];

        for (let i = 0; i < count; i++) {
            const sp = spawns[i % spawns.length].clone().add(new THREE.Vector3(rand(-2, 2), 0, rand(-2, 2)));
            const isElite = waveNum >= 2 && (i % 4 === 3);
            this.bots.push(new Bot(this, sp, { wave: waveNum, isElite }));
        }

        if (isBossWave) {
            const bSp = spawns[0].clone();
            this.bots.push(new Bot(this, bSp, { wave: waveNum, isBoss: true }));
            this.ui.showCenterMsg(`WAVE ${waveNum} // BOSS INBOUND`, 'ELIMINATE THE WARDEN', 2600);
        } else {
            this.ui.showCenterMsg(`WAVE ${waveNum}`, `${count} HOSTILES DEPLOYED`, 1800);
        }
        audio.waveStart();
    }

    recordWeaponChallengeKill() {
        const w = this.player?.currentWeapon;
        if (!w || !WEAPON_CHALLENGES[w.kind]) return;
        SaveSystem.data.challenges[w.kind] = (SaveSystem.data.challenges[w.kind] || 0) + 1;
    }

    _registerKillStreak() {
        this.streakCount++;
        this.streakTimer = 4.5;
        this.sukunaCharge = Math.min(100, this.sukunaCharge + 25);
        if (this.streakCount >= 2) {
            const labels = ['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'ULTRA KILL', 'RAMPAGE'];
            const title = labels[Math.min(this.streakCount, 5)] || 'UNSTOPPABLE';
            audio.multikill(this.streakCount);
            this.ui.showCenterMsg(title, `SUKUNA CHARGE ${this.sukunaCharge}%`, 1200);
        }
    }

    damageBot(bot, dmg, headshot = false, hitPos = null) {
        if (!bot || !bot.alive) return;
        const killed = bot.onHit(dmg);
        this.ui.flashHitmarker(headshot);
        audio.hit(headshot);

        if (killed) {
            const deathPos = bot.pos.clone();
            const pts = (bot.isBoss ? 500 : bot.isElite ? 175 : 100) + (headshot ? 25 : 0);
            this.kills++;
            this.pointsEarned += pts;
            SaveSystem.data.points += pts;
            this.recordWeaponChallengeKill();
            SaveSystem.save();

            this.ui.popSkull();
            this.ui.addKillFeed(`${this.net.myName} ✕ ${bot.isBoss ? 'WARDEN BOSS' : bot.isElite ? 'ELITE' : 'TROOPER'}`, headshot);
            audio.kill();
            this._registerKillStreak();
            this.spawnMedkitDrop(deathPos);
            bot.destroy();
        }
    }

    damageRemotePlayer(targetId, dmg, headshot = false, isMelee = false) {
        if (!this.isMultiplayer || !this.net.players[targetId]) return;
        this.ui.flashHitmarker(headshot);
        audio.hit(headshot);
        this.net.broadcast({
            type: 'HIT',
            targetId,
            damage: dmg,
            headshot,
            isMelee,
            weaponName: this.player?.currentWeapon?.name || 'ELIMINATED',
            attackerId: this.net.myId,
            attackerName: this.net.myName
        });
    }

    applyExplosionDamage(pos, radius, maxDamage, sourceName = 'EXPLOSION', canHurtPlayer = true) {
        if (this.bots) {
            for (const b of this.bots) {
                if (!b.alive) continue;
                const d = b.pos.distanceTo(pos);
                if (d <= radius) {
                    const dmg = Math.round(maxDamage * (1 - d / (radius + 0.5)));
                    this.damageBot(b, dmg, false, b.pos);
                }
            }
        }
        if (this.isMultiplayer) {
            for (const id in this.net.players) {
                if (id === this.net.myId) continue;
                const st = this.net.players[id].state;
                if (st && st.pos && st.alive !== false) {
                    const d = new THREE.Vector3(...st.pos).distanceTo(pos);
                    if (d <= radius) {
                        const dmg = Math.round(maxDamage * (1 - d / (radius + 0.5)));
                        this.damageRemotePlayer(id, dmg, false, false);
                    }
                }
            }
        }
        if (canHurtPlayer && this.player && this.player.alive) {
            const d = this.player.pos.distanceTo(pos);
            if (d <= radius) {
                const dmg = Math.round(maxDamage * 0.65 * (1 - d / (radius + 0.5)));
                this.lastAttackerName = sourceName;
                this.player.onHit(dmg, false, pos);
                if (!this.player.alive) this.onPlayerDied();
            }
        }
    }

    applyFlashbangToPlayer(pos) {
        const p = this.player;
        if (!p || !p.alive) return;
        const toFlash = pos.clone().sub(p.getEyePos());
        const dist = toFlash.length();
        if (dist > 18) return;
        const facing = Math.max(0.25, p.getLookDir().dot(toFlash.normalize()));
        const intensity = clamp((1 - dist / 18) * facing * 1.4, 0, 1);
        audio.flashbang(intensity, pos);
        if (intensity > 0.15) {
            let ov = document.getElementById('flashOverlay');
            if (!ov) {
                ov = document.createElement('div');
                ov.id = 'flashOverlay';
                ov.style.cssText = 'position:fixed;inset:0;background:#ffffff;pointer-events:none;z-index:55;opacity:0;transition:opacity 0.12s;';
                document.body.appendChild(ov);
            }
            ov.style.opacity = String(intensity);
            setTimeout(() => { ov.style.transition = 'opacity 1.6s ease-out'; ov.style.opacity = '0'; }, 350);
        }
    }

    spawnMedkitDrop(pos) {
        if (!this.player || !this.player.alive) return;
        if (Math.random() < 0.35 && this.player.medkits < 3) {
            this.player.medkits++;
            audio.pickup();
        }
    }

    onPlayerDied() {
        this.input.unlock();
        clearInterval(this._respawnInterval);

        if (this.isMultiplayer) {
            this.net.broadcast({
                type: 'KILL',
                killerId: this.lastAttacker || 'env',
                killerName: this.lastAttackerName || 'ENVIRONMENT',
                victimId: this.net.myId,
                victimName: this.net.myName,
                headshot: !!this.lastHitHeadshot,
                deathPos: [this.player.pos.x, this.player.pos.y, this.player.pos.z]
            });
        }

        const dc = document.getElementById('deathCam');
        if (dc) {
            const killerEl = document.getElementById('dcKiller');
            const weaponEl = document.getElementById('dcWeapon');
            const timerEl = document.getElementById('dcTimer');
            if (killerEl) killerEl.textContent = this.lastAttackerName || 'ENVIRONMENT';
            if (weaponEl) weaponEl.textContent = this.lastAttackerWeapon || 'ELIMINATED';

            let remaining = 3.5;
            if (timerEl) timerEl.textContent = `${remaining.toFixed(1)}s`;
            this.ui._showPanel(dc);

            this._respawnInterval = setInterval(() => {
                remaining = Math.max(0, remaining - 0.1);
                if (timerEl) timerEl.textContent = `${remaining.toFixed(1)}s`;
                if (remaining <= 0) {
                    clearInterval(this._respawnInterval);
                    if (this.mode !== 'MENU') this.respawnPlayer();
                }
            }, 100);
        } else {
            this.ui.showCenterMsg('OPERATOR KIA', 'RESPAWNING IN 3.5S...', 3400);
            setTimeout(() => { if (this.mode !== 'MENU') this.respawnPlayer(); }, 3500);
        }
    }

    respawnPlayer() {
        clearInterval(this._respawnInterval);
        const dc = document.getElementById('deathCam');
        if (dc) this.ui._hidePanel(dc);
        const sp = this.world.getSafeSpawnPoint(this.net);
        this.player.reset(sp);
        if (this.mode === 'WAVE') {
            this.wave = 1;
            this.kills = 0;
            this.clearBots();
            this._spawnWave(1);
        }
        this.input.lock();
    }

    triggerDomainExpansion(isCaster, centerVec) {
        this.endDomain();
        this.domainActive = true;
        this.domainIsCaster = isCaster;
        this.domainCenter.copy(centerVec);
        this.domainTimer = 14.0;
        this.domainTick = 0;

        audio.domain();
        this.ui.showCenterMsg('DOMAIN EXPANSION', 'MALEVOLENT SHRINE', 2600);

        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(28, 24, 18),
            new THREE.MeshBasicMaterial({
                color: 0x3b0008,
                side: THREE.BackSide,
                transparent: true,
                opacity: 0.52,
                depthWrite: false
            })
        );
        dome.position.copy(centerVec);
        this.scene.add(dome);
        this.domainDome = dome;
    }

    endDomain() {
        this.domainActive = false;
        if (this.domainDome) {
            this.scene.remove(this.domainDome);
            this.domainDome.geometry.dispose();
            this.domainDome.material.dispose();
            this.domainDome = null;
        }
    }

    beginClash(oppId, duration = 6) {
        this.clash = { active: true, oppId, myScore: 0, oppScore: 0, timer: duration, duration };
        this.ui.showCenterMsg('DOMAIN CLASH!', 'MASH [E] OR [SPACE] TO OVERPOWER!', duration * 1000);
    }

    resolveClash(winnerId) {
        this.clash.active = false;
        if (winnerId === this.net.myId) {
            this.triggerDomainExpansion(true, this.player.pos.clone());
        } else {
            this.ui.showCenterMsg('DOMAIN OVERPOWERED', '', 1500);
        }
    }

    _handleGameplayHotkeys() {
        if (this.mode === 'MENU' || this.paused || !this.player.alive) return;

        if (this.clash.active) {
            if (this.input.hit('KeyE') || this.input.hit('Space')) {
                this.clash.myScore++;
                this.net.broadcast({ type: 'CLASH_SCORE', id: this.net.myId, score: this.clash.myScore });
            }
            return;
        }

        // Keybinds synced directly to bottom HUD bar:
        // F = Ability (Blink; Shift+F = Telekinesis)
        // G = Medkit
        // Q = Flash / Fuga
        // V = Sukuna
        // E = Domain
        if (this.input.hit('KeyF')) {
            if (this.input.down('ShiftLeft')) this.abilitySystem.useTelekinesis();
            else this.abilitySystem.useBlink();
        }
        if (this.input.hit('KeyG')) this.player.useMedkit();
        if (this.input.hit('KeyQ')) this.abilitySystem.useFlashOrFuga();
        if (this.input.hit('KeyV')) {
            if (this.mode === 'TRAINING' || this.sukunaCharge >= 100) {
                this.sukunaCharge = 0;
                this.abilitySystem.activateSukuna();
            } else {
                this.ui.showCenterMsg('VESSEL CHARGING', `${this.sukunaCharge}% / 100% (GET KILLS)`, 1100);
            }
        }
        if (this.input.hit('KeyE')) this.abilitySystem.useDomainExpansion();
    }

    _loop(now) {
        const dt = Math.min(0.05, (now - this._lastTime) / 1000);
        this._lastTime = now;

        if (this.mode === 'MENU') {
            const t = now * 0.00025;
            this.camera.position.set(Math.sin(t) * 32, 16, Math.cos(t) * 32);
            this.camera.lookAt(0, 2, 0);
            if (this.world) this.world.update(dt, null);
            this.ui.renderPreviews(dt);
        } else if (!this.paused) {
            this._handleGameplayHotkeys();

            if (this.streakTimer > 0) {
                this.streakTimer -= dt;
                if (this.streakTimer <= 0) this.streakCount = 0;
            }

            if (this.world) this.world.update(dt, this);
            this.player.update(dt, this.input);
            this.abilitySystem.update(dt);
            this.effects.update(dt, this);

            for (let i = this.bots.length - 1; i >= 0; i--) {
                const b = this.bots[i];
                if (!b.alive) {
                    this.bots.splice(i, 1);
                    continue;
                }
                b.update(dt);
            }

            if (this.mode === 'WAVE' && this.bots.length === 0 && this.player.alive) {
                this.waveCooldown += dt;
                if (this.waveCooldown > 2.4) {
                    this.waveCooldown = 0;
                    this._spawnWave(this.wave + 1);
                }
            }

            if (this.domainActive) {
                this.domainTimer -= dt;
                this.domainTick -= dt;
                if (this.domainTick <= 0 && this.domainIsCaster) {
                    this.domainTick = 0.35;
                    for (const b of this.bots) {
                        if (b.alive && b.pos.distanceTo(this.domainCenter) <= 28) {
                            this.damageBot(b, 38, false, b.pos);
                            if (window.sukunaSlashVfx) window.sukunaSlashVfx(b.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 'cleave');
                        }
                    }
                    if (this.isMultiplayer) {
                        for (const id in this.net.players) {
                            if (id === this.net.myId) continue;
                            const st = this.net.players[id].state;
                            if (st && st.pos && st.alive !== false && new THREE.Vector3(...st.pos).distanceTo(this.domainCenter) <= 28) {
                                this.damageRemotePlayer(id, 32, false, false);
                            }
                        }
                    }
                }
                if (this.domainTimer <= 0) {
                    this.endDomain();
                    if (this.isMultiplayer && this.domainIsCaster) this.net.broadcast({ type: 'DOMAIN_END' });
                }
            }

            if (this.clash.active) {
                this.clash.timer -= dt;
                if (this.clash.timer <= 0 && (!this.isMultiplayer || this.net.isHost)) {
                    const winner = this.clash.myScore >= this.clash.oppScore ? this.net.myId : this.clash.oppId;
                    this.net.broadcast({ type: 'CLASH_RESULT', winnerId: winner });
                    this.resolveClash(winner);
                }
            }

            if (this.isMultiplayer) this.net.update(dt);
            this.ui.updateHUD(this);
        }

        if (audio.ready && this.player) {
            audio.listenerPos.copy(this.player.pos);
            audio.listenerRight.set(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));
        }

        this.renderer.render(this.scene, this.camera);
        this.input.endFrame();
        requestAnimationFrame(t => this._loop(t));
    }
}

if (document.readyState === 'loading') {
    addEventListener('DOMContentLoaded', () => new Game());
} else {
    new Game();
}