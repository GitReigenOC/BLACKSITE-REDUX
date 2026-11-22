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

const CAMO_COLORS = { 'default': 0xffdd44, 'crimson': 0xff2244, 'cyber': 0x00ffff, 'emerald': 0x00ff66, 'royal': 0xffaa00, 'void': 0xaa00ff, 'dragon': 0xff3b1a };
const CAMO_NAMES = { 'default': 'Standard Issue', 'crimson': 'Crimson (Tracer)', 'cyber': 'Cyber Cyan (Tracer)', 'emerald': 'Emerald Toxic (Tracer)', 'royal': 'Royal Gold (Tracer)', 'void': 'Void Purple (Tracer)', 'dragon': 'Dragon (3D Model)' };
const CAMO_DESCS = { 'default': 'Factory finish.', 'crimson': 'Blood-red digital blocks.', 'cyber': 'Circuit board cyan.', 'emerald': 'Hexagonal green plating.', 'royal': 'Diagonal gold stripes.', 'void': 'Starfield nebula.', 'dragon': 'Custom 3D fire-breathing dragon model.' };

const SKINS = {
    operator: { name: 'OPERATOR', skin: '#e8ecf0', accent: '#ff7a1a' },
    shadow: { name: 'SHADOW', skin: '#2a2f38', accent: '#8a5cff' },
    ember: { name: 'EMBER', skin: '#e8b090', accent: '#ff5a1a' },
    arctic: { name: 'ARCTIC', skin: '#d0e4f0', accent: '#40d0ff' },
    toxic: { name: 'TOXIC', skin: '#9fe0a0', accent: '#3fe08a' },
    void: { name: 'VOID', skin: '#40304a', accent: '#aa00ff' }
};
const WEAPON_CHALLENGES = { rifle: 40, shotgun: 30, sniper: 25, kar98: 40, smg: 30, lmg: 60, ak47: 50, rocket: 25, knife: 15, katana: 20 };

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
        for (let i = 0; i < 55; i++) { x.fillStyle = `hsl(0, ${50 + Math.random() * 50}%, ${8 + Math.random() * 18}%)`; const s = 5 + Math.random() * 22; x.fillRect(Math.random() * 128, Math.random() * 128, s, s); }
        x.fillStyle = '#ff2244';
        for (let i = 0; i < 6; i++) x.fillRect(Math.random() * 128, Math.random() * 128, 3, 3);
    } else if (camo === 'cyber') {
        x.fillStyle = '#05131a'; x.fillRect(0, 0, 128, 128);
        x.strokeStyle = '#00ffff'; x.lineWidth = 1.2; x.shadowColor = '#00ffff'; x.shadowBlur = 3;
        for (let i = 0; i < 10; i++) { x.beginPath(); let px = Math.random() * 128, py = Math.random() * 128; x.moveTo(px, py); for (let j = 0; j < 5; j++) { px += (Math.random() - .5) * 45; py += (Math.random() - .5) * 45; x.lineTo(px, py); } x.stroke(); }
        x.shadowBlur = 0; x.fillStyle = '#00ffff';
        for (let i = 0; i < 12; i++) x.fillRect(Math.random() * 128, Math.random() * 128, 2.5, 2.5);
    } else if (camo === 'emerald') {
        x.fillStyle = '#0a2010'; x.fillRect(0, 0, 128, 128);
        x.strokeStyle = '#00ff66'; x.lineWidth = 1; x.shadowColor = '#00ff66'; x.shadowBlur = 2;
        const hs = 11;
        for (let y = -hs; y < 128 + hs; y += hs * 1.5) for (let xx = -hs; xx < 128 + hs; xx += hs * Math.sqrt(3)) {
            const off = (Math.floor((y + hs) / (hs * 1.5)) % 2) * (hs * Math.sqrt(3) / 2);
            x.beginPath();
            for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const px = xx + off + Math.cos(a) * hs, py = y + Math.sin(a) * hs; if (i === 0) x.moveTo(px, py); else x.lineTo(px, py); }
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
        for (let i = 0; i < 3; i++) { const grad = x.createRadialGradient(Math.random() * 128, Math.random() * 128, 0, Math.random() * 128, Math.random() * 128, 55); grad.addColorStop(0, 'rgba(120,50,200,0.45)'); grad.addColorStop(1, 'rgba(120,50,200,0)'); x.fillStyle = grad; x.fillRect(0, 0, 128, 128); }
        for (let i = 0; i < 80; i++) { const b = Math.random(); x.fillStyle = `rgba(${170 + Math.random() * 85},${100 + Math.random() * 100},255,${b})`; const s = b * 2.8; x.fillRect(Math.random() * 128, Math.random() * 128, s, s); }
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
    load() {
        try {
            let s = localStorage.getItem(SAVE_KEY);
            if (!s) s = localStorage.getItem('blacksite_redux_save_v2');
            if (!s) s = localStorage.getItem('blacksite_redux_save_v3');
            if (s) {
                const parsed = JSON.parse(s);
                this.data = { ...this.data, ...parsed };
                if (!this.data.equippedCamos) this.data.equippedCamos = { rifle: 'default', shotgun: 'default', rocket: 'default', sniper: 'default', knife: 'default', kar98: 'default', smg: 'default', lmg: 'default', ak47: 'default', katana: 'default' };
                if (!this.data.equippedLoadout) this.data.equippedLoadout = ['rifle', 'shotgun', 'rocket', 'knife'];
                if (!this.data.settings) this.data.settings = { volume: 0.6, musicVolume: 0.4, fov: 90, sensitivity: 1, scopeSensitivity: 0.8, invertY: false, uiColor: '#ff7a1a', skinColor: '#e8ecf0' };
                if (this.data.settings.scopeSensitivity === undefined) this.data.settings.scopeSensitivity = 0.8;
                if (!this.data.settings.uiColor) this.data.settings.uiColor = '#ff7a1a';
                if (!this.data.settings.skinColor) this.data.settings.skinColor = '#e8ecf0';
                if (!this.data.playerName) this.data.playerName = 'OPERATOR-' + Math.floor(Math.random() * 999);
                if (!this.data.challenges) this.data.challenges = {};
                if (!this.data.selectedSkin) this.data.selectedSkin = 'operator';

                for (const k of this.data.unlockedWeapons) {
                    if (!this.data.unlockedCamos.includes(k + ':default')) this.data.unlockedCamos.push(k + ':default');
                    if (!this.data.equippedCamos[k]) this.data.equippedCamos[k] = 'default';
                }
                document.documentElement.style.setProperty('--accent', this.data.settings.uiColor);
            }
        } catch (e) { console.error('Save load error', e); }
    },
    save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { console.error('Save error', e); } },
    reset() { if (confirm("Are you sure you want to reset all progress, weapons, camos, and settings?")) { localStorage.removeItem(SAVE_KEY); localStorage.removeItem('blacksite_redux_save_v2'); localStorage.removeItem('blacksite_redux_save_v3'); location.reload(); } }
};
SaveSystem.load();

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
    slide() { this._noise({ dur: .55, gain: .32, freq: 1000, freqEnd: 100, q: .8 }); }
    ui() { this._tone({ freq: 820, freqEnd: 1100, dur: .05, gain: .09, type: 'square' }); }
    waveStart() { this._sweep(280, 700, .5, .25, 'sawtooth'); setTimeout(() => this._sweep(550, 1100, .5, .2, 'sawtooth'), 200); }
    pad() {
        this._sweep(260, 2200, .32, .34, 'sine');
        this._sweep(140, 980, .28, .22, 'triangle');
        this._noise({ dur: .34, gain: .26, freq: 350, freqEnd: 5600, q: 2.2, type: 'bandpass', reverb: true });
        this._sub(85, .22, .38);
    }
    teleport() { this._sweep(2400, 80, .45, .45, 'sine'); this._noise({ dur: .5, gain: .5, freq: 10000, freqEnd: 150, q: 3, type: 'bandpass', reverb: true }); this._sub(120, .3, .4); }
    telekinesis() { this._sweep(50, 200, .7, .45, 'sawtooth', 0, true); this._noise({ dur: .9, gain: .35, freq: 250, freqEnd: 1600, q: 1.5, type: 'bandpass' }); }
    pickup() { this._tone({ freq: 660, freqEnd: 1400, dur: .14, gain: .26 }); setTimeout(() => this._tone({ freq: 990, freqEnd: 2000, dur: .2, gain: .22 }), 90); }
    medkit() { this._tone({ freq: 660, freqEnd: 880, dur: .12, gain: .22, type: 'triangle' }); setTimeout(() => this._tone({ freq: 880, freqEnd: 1320, dur: .18, gain: .2, type: 'triangle' }), 100); setTimeout(() => this._tone({ freq: 1320, dur: .25, gain: .16, type: 'triangle' }), 220); }
    countdown(go) { if (go) this._sweep(400, 1400, .35, .4, 'sawtooth'); else this._tone({ freq: 880, dur: .14, gain: .32, type: 'square' }); }
    perfect() { this._sweep(300, 1400, .7, .55, 'sawtooth', 0, true); this._noise({ dur: .5, gain: .5, freq: 2000, freqEnd: 5000, q: 2, type: 'bandpass' }); this._sub(55, .3, .4); }
    flashbang() { this._noise({ dur: 1.5, gain: .8, freq: 8000, freqEnd: 1000, q: .5, type: 'bandpass', reverb: true }); this._sweep(1000, 100, 1.0, .5, 'sine'); }
    throw() { this._sweep(400, 200, .2, .2, 'sine'); }
    sukuna() { this._sweep(100, 50, 2.0, .8, 'sawtooth', 0, true); this._noise({ dur: 2.0, gain: .6, freq: 800, freqEnd: 100, q: 1, type: 'lowpass' }); }
    domain() { this._sub(30, 3.0, 1.0); this._sweep(200, 50, 2.0, .8, 'sawtooth', 0, true); for (let i = 0; i < 10; i++) setTimeout(() => this._noise({ dur: .3, gain: .5, freq: 5000, freqEnd: 500, q: 2, pan: rand(-1, 1) }), i * 200); }
}

const audio = new AudioEngine();

/* ===== SUKUNA VFX / MAP DESTRUCTION (POOLED & ZERO-LEAK) ===== */
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
        try { cleanup(); } catch (_) {}
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
            if (['Space', 'KeyR', 'KeyF', 'KeyE', 'KeyQ', 'KeyG', 'KeyB', 'KeyN', 'KeyM', 'KeyT', 'KeyV', 'KeyH', 'KeyZ', 'KeyX', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(c)) e.preventDefault();
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
    rifle: { kind: 'rifle', name: 'MK-7 CARBINE', auto: true, rpm: 620, mag: 30, reserve: 240, reloadTime: 1.9, damage: 24, headMult: 2.5, limbMult: .75, spreadHip: .025, spreadAds: .004, recoil: 0.7, range: 200, sound: 'rifle', price: 0 },
    shotgun: { kind: 'shotgun', name: 'BREACHER 12G', auto: false, rpm: 75, mag: 6, reserve: 36, reloadTime: 2.6, damage: 22, pellets: 8, headMult: 2.0, limbMult: .75, spreadHip: .09, spreadAds: .05, recoil: 1.5, range: 30, sound: 'shotgun', falloff: true, price: 0, shellReload: true },
    sniper: { kind: 'sniper', name: 'LONGBOW .50', auto: false, rpm: 35, mag: 5, reserve: 30, reloadTime: 3.2, damage: 95, headMult: 5.0, limbMult: .75, spreadHip: .06, spreadAds: 0, recoil: 3.0, range: 1000, sound: 'sniper', boltTime: .55, price: 800 },
    kar98: { kind: 'kar98', name: 'KAR98K', auto: false, rpm: 45, mag: 5, reserve: 30, reloadTime: 2.8, damage: 80, headMult: 3.0, limbMult: .8, spreadHip: .05, spreadAds: 0, recoil: 4.0, range: 500, sound: 'kar98', boltTime: .8, price: 1200 },
    smg: { kind: 'smg', name: 'MP-5', auto: true, rpm: 900, mag: 40, reserve: 240, reloadTime: 1.8, damage: 18, headMult: 2.0, limbMult: .8, spreadHip: .04, spreadAds: .01, recoil: 0.5, range: 150, sound: 'smg', price: 500 },
    lmg: { kind: 'lmg', name: 'M249 SAW', auto: true, rpm: 750, mag: 100, reserve: 200, reloadTime: 4.0, damage: 30, headMult: 2.5, limbMult: .75, spreadHip: .06, spreadAds: .01, recoil: 1.2, range: 300, sound: 'lmg', price: 1500 },
    ak47: { kind: 'ak47', name: 'AK-47', auto: true, rpm: 600, mag: 30, reserve: 120, reloadTime: 2.2, damage: 35, headMult: 3.0, limbMult: .75, spreadHip: .03, spreadAds: .005, recoil: 1.8, range: 250, sound: 'ak47', price: 1000 },
    rocket: { kind: 'rocket', name: 'HAVOC RL', auto: false, rpm: 55, mag: 3, reserve: 9, reloadTime: 2.8, damage: 120, splashDamage: 55, splashRadius: 5.5, spreadHip: .008, spreadAds: .003, recoil: 2.0, range: 300, sound: 'rocket', projectile: true, rocketSpeed: 42, price: 0 },
    knife: { kind: 'knife', name: 'TACTICAL KARAMBIT', auto: false, rpm: 140, mag: 1, reserve: 1, reloadTime: 0, damage: 45, headMult: 3, limbMult: 1, spreadHip: 0, spreadAds: 0, recoil: 0, range: 2.4, sound: 'knife', price: 0, melee: true, backstabMult: 999 },
    katana: { kind: 'katana', name: 'REDLINER KATANA', auto: false, rpm: 175, mag: 1, reserve: 1, reloadTime: 0, damage: 85, superDamage: 125, headMult: 2.0, limbMult: 1, spreadHip: 0, spreadAds: 0, recoil: 0, range: 3.9, sound: 'katana', price: 2000, melee: true, backstabMult: 999 },
    dismantle: { kind: 'dismantle', name: 'DISMANTLE', auto: true, rpm: 300, mag: 999, reserve: 999, reloadTime: 0, damage: 50, headMult: 1, limbMult: 1, spreadHip: 0, spreadAds: 0, recoil: 0, range: 100, sound: 'dismantle', price: 0 },
    cleave: { kind: 'cleave', name: 'CLEAVE', auto: false, rpm: 60, mag: 1, reserve: 1, reloadTime: 0, damage: 80, headMult: 1, limbMult: 1, spreadHip: 0, spreadAds: 0, recoil: 0, range: 30, sound: 'knife', price: 0, melee: true }
};

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
        } else if (data.type === 'HIT') {
            if (data.targetId === this.myId) {
                const attackerPos = (data.attackerId && this.players[data.attackerId] && this.players[data.attackerId].state && this.players[data.attackerId].state.pos)
                    ? new THREE.Vector3(...this.players[data.attackerId].state.pos) : null;
                this.game.lastAttacker = data.attackerId || 'Unknown';
                this.game.lastAttackerName = data.attackerName || 'RIVAL';
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
                const curW = this.game.player && this.game.player.currentWeapon;
                if (curW && WEAPON_CHALLENGES[curW.kind]) {
                    const prevKills = SaveSystem.data.challenges[curW.kind] || 0;
                    const nextKills = prevKills + 1;
                    SaveSystem.data.challenges[curW.kind] = nextKills;
                    const goal = WEAPON_CHALLENGES[curW.kind];
                    if (prevKills < goal && nextKills >= goal) {
                        SaveSystem.data.points += 1000;
                        this.game.pointsEarned += 1000;
                        this.game.ui.showCenterMsg(`${curW.name} MASTERED!`, '+1000 PTS MASTERY REWARD', 2200);
                    }
                }
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
            if (data.targetId === this.myId && this.game.player) { this.game.player.tkFreezeTimer = 2.5; this.game.player.vel.y = -30; }
            if (this.isHost) this.broadcast(data);
        } else if (data.type === 'FLASH') {
            if (this.game.player && this.game.player.pos.distanceTo(new THREE.Vector3(...data.pos)) < 15) {
                const toFlash = new THREE.Vector3(...data.pos).sub(this.game.camera.position).normalize();
                const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.game.camera.quaternion);
                if (toFlash.dot(forward) > 0.5) { this.game.ui.flashbang(); this.game.player.confusedTimer = 2.0; }
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
            if (pData.state.tkFreezeTimer > 0) { mesh.rotation.x = Math.sin(performance.now() * .01) * 0.1; mesh.position.y += Math.sin(performance.now() * .01) * 0.05; }
            else { mesh.rotation.x = damp(mesh.rotation.x, 0, 10, dt); }
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
        else mesh.rotation.x = damp(mesh.rotation.x, 0, 10, dt);
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
        const tbody = document.getElementById('lbBody'); tbody.innerHTML = '';
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

/* ===== REWORKED MAPS, ANIMATED 3D JUMP PADS, EXPLOSIVE BARRELS & SUPPLY CRATES ===== */
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
                scene.add(obelisk);
            }
            this._addBox(3.4, 0.4, 12, -13, 1.2, -13, mats.glass);
            this._addBox(3.4, 0.4, 12, 13, 1.2, -13, mats.glass);
            this._addBox(3.4, 0.4, 12, -13, 1.2, 13, mats.glass);
            this._addBox(3.4, 0.4, 12, 13, 1.2, 13, mats.glass);

            this._addJumpPad(0, 2.1, 0, 23, 5, 0x00ffff);
            for (const [px, pz] of [[-21, -21], [21, -21], [-21, 21], [21, 21]]) {
                this._addJumpPad(px, 2.3, pz, 22, 8.5, 0xaa00ff);
            }

            this._addBarrel(-8, 0.5, 0);
            this._addBarrel(8, 0.5, 0);
            this._addSupplyCrate(0, 0.5, 11);
            this._addSupplyCrate(0, 0.5, -11);

            this.playerSpawn.set(0, 2.2, 8);
            this.spawnPoints = [new THREE.Vector3(0, 2.2, 8), new THREE.Vector3(-21, 2.5, -21), new THREE.Vector3(21, 2.5, -21), new THREE.Vector3(-21, 2.5, 21), new THREE.Vector3(21, 2.5, 21)];
            this.botSpawns = [...this.spawnPoints];

        } else if (map === 'zenith') {
            this._addBox(64, 1, 64, 0, -.5, 0, mats.floor);
            this._addBox(64, wallH, 1, 0, wallH / 2, 32, mats.wall);
            this._addBox(64, wallH, 1, 0, wallH / 2, -32, mats.wall);
            this._addBox(1, wallH, 64, 32, wallH / 2, 0, mats.wall);
            this._addBox(1, wallH, 64, -32, wallH / 2, 0, mats.wall);

            this._addBox(18, 0.7, 18, 0, 0.35, 0, mats.walk);
            this._addBox(18.4, 0.14, 0.25, 0, 0.75, 9, mats.ember, true);
            this._addBox(18.4, 0.14, 0.25, 0, 0.75, -9, mats.ember, true);
            this._addBox(0.25, 0.14, 18.4, 9, 0.75, 0, mats.ice, true);
            this._addBox(0.25, 0.14, 18.4, -9, 0.75, 0, mats.ice, true);

            this._addBox(4.2, 16, 4.2, 0, 8, 0, mats.pillar);
            this._addBox(11, 0.5, 11, 0, 7.5, 0, mats.walk);
            this._addBox(11.3, 1.1, 0.25, 0, 8.3, 5.5, mats.glass);
            this._addBox(11.3, 1.1, 0.25, 0, 8.3, -5.5, mats.glass);

            for (const [tx, tz] of [[-21, -21], [21, -21], [-21, 21], [21, 21]]) {
                this._addBox(10, 11, 10, tx, 5.5, tz, mats.pillar);
                this._addBox(12.5, 0.5, 12.5, tx, 5.5, tz, mats.walk);
                this._addBox(10.5, 0.5, 10.5, tx, 11.0, tz, mats.walk);
                this._addBox(10.6, 1.1, 0.25, tx, 11.8, tz + (tz > 0 ? -5.1 : 5.1), mats.glass);
            }

            this._addBox(3.4, 0.4, 30, -21, 5.5, 0, mats.walk);
            this._addBox(3.4, 0.4, 30, 21, 5.5, 0, mats.walk);
            this._addBox(30, 0.4, 3.4, 0, 5.5, -21, mats.walk);
            this._addBox(30, 0.4, 3.4, 0, 5.5, 21, mats.walk);

            this._addBunker(-11, 0, 0, Math.PI / 2, mats);
            this._addBunker(11, 0, 0, -Math.PI / 2, mats);
            this._addBunker(0, 0, -13, 0, mats);
            this._addBunker(0, 0, 13, Math.PI, mats);
            for (const [cx, cz] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) {
                this._addBox(3.2, 2.2, 3.2, cx, 1.1, cz, mats.crate);
            }

            this._addJumpPad(0, 0.7, 5.8, 24, 5, 0x00b8ff);
            for (const [px, pz] of [[-14, -21], [14, -21], [-14, 21], [14, 21]]) {
                this._addJumpPad(px, 0.0, pz, 22, 6, 0xffaa00);
            }

            this._addBarrel(-6, 0.7, -6);
            this._addBarrel(6, 0.7, 6);
            this._addSupplyCrate(-14, 0, 0);
            this._addSupplyCrate(14, 0, 0);

            this.playerSpawn.set(0, 0.8, 16);
            this.spawnPoints = [new THREE.Vector3(-15, .2, -15), new THREE.Vector3(15, .2, -15), new THREE.Vector3(-15, .2, 15), new THREE.Vector3(15, .2, 15), new THREE.Vector3(0, 0.8, 16), new THREE.Vector3(0, 0.8, -16)];
            this.botSpawns = [...this.spawnPoints];

        } else {
            /* ===== REWORKED BLACKSITE (MULTI-TIER TACTICAL CITADEL) ===== */
            this._addBox(64, 1, 64, 0, -.5, 0, mats.floor);
            this._addBox(64, wallH, 1, 0, wallH / 2, 32, mats.wall);
            this._addBox(64, wallH, 1, 0, wallH / 2, -32, mats.wall);
            this._addBox(1, wallH, 64, 32, wallH / 2, 0, mats.wall);
            this._addBox(1, wallH, 64, -32, wallH / 2, 0, mats.wall);

            this._addBox(14, 0.5, 14, 0, 0.25, 0, mats.walk);
            this._addBox(14.3, 0.14, 0.25, 0, 0.55, 7, mats.ember, true);
            this._addBox(14.3, 0.14, 0.25, 0, 0.55, -7, mats.ember, true);
            this._addBox(0.25, 0.14, 14.3, 7, 0.55, 0, mats.ice, true);
            this._addBox(0.25, 0.14, 14.3, -7, 0.55, 0, mats.ice, true);

            this._addBox(8.5, 0.45, 8.5, 0, 3.6, 0, mats.walk);
            for (const [px, pz] of [[-3.3, -3.3], [3.3, -3.3], [-3.3, 3.3], [3.3, 3.3]]) {
                this._addBox(0.95, 3.6, 0.95, px, 1.8, pz, mats.pillar);
                this._addBox(1.05, 0.18, 1.05, px, 3.2, pz, mats.ember, true);
            }
            this._addBox(8.7, 0.95, 0.22, 0, 4.3, 4.2, mats.glass);
            this._addBox(8.7, 0.95, 0.22, 0, 4.3, -4.2, mats.glass);

            this._addBox(3.4, 0.35, 13.5, 0, 3.6, -11.0, mats.walk);
            this._addBox(3.4, 0.35, 13.5, 0, 3.6, 11.0, mats.walk);
            this._addRamp(3.4, 3.6, 7.2, 0, 0.0, -21.2, 'z', 1, mats.walk);
            this._addRamp(3.4, 3.6, 7.2, 0, 0.0, 21.2, 'z', -1, mats.walk);

            this._addBox(12, 0.4, 5.2, -17.5, 3.6, 0, mats.walk);
            this._addBox(12, 0.4, 5.2, 17.5, 3.6, 0, mats.walk);
            this._addRamp(4.4, 3.6, 7.0, -17.5, 0.0, 6.0, 'z', -1, mats.walk);
            this._addRamp(4.4, 3.6, 7.0, 17.5, 0.0, -6.0, 'z', 1, mats.walk);
            this._addBox(12.2, 1.0, 0.22, -17.5, 4.3, -2.5, mats.glass);
            this._addBox(12.2, 1.0, 0.22, 17.5, 4.3, 2.5, mats.glass);

            this._addBunker(0, 0, 15.5, Math.PI, mats);
            this._addBunker(0, 0, -15.5, 0, mats);
            this._addBunker(-11.5, 0, 0, Math.PI / 2, mats);
            this._addBunker(11.5, 0, 0, -Math.PI / 2, mats);

            for (const [cx, cz] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) {
                this._addBox(3.4, 2.4, 3.4, cx, 1.2, cz, mats.crate);
                this._addBox(2.2, 1.8, 2.2, cx + (cx > 0 ? -2.2 : 2.2), 0.9, cz + (cz > 0 ? -1.4 : 1.4), mats.crate);
            }
            for (const [px, pz] of [[-23, -23], [23, -23], [-23, 23], [23, 23]]) {
                this._addBox(3.2, 8.5, 3.2, px, 4.25, pz, mats.pillar);
                this._addBox(3.4, 0.22, 3.4, px, 3.0, pz, mats.ice, true);
                this._addBox(3.4, 0.22, 3.4, px, 6.0, pz, mats.ember, true);
            }

            this._addJumpPad(-22, 0, 0, 22, 7.5, 0x40d0ff);
            this._addJumpPad(22, 0, 0, 22, 7.5, 0x40d0ff);
            this._addJumpPad(0, 0, -25.5, 22, 7.0, 0xff7a1a);
            this._addJumpPad(0, 0, 25.5, 22, 7.0, 0xff7a1a);

            this._addBarrel(-6.5, 0, 8.5);
            this._addBarrel(6.5, 0, -8.5);
            this._addBarrel(-15, 0, -15);
            this._addBarrel(15, 0, 15);
            this._addSupplyCrate(-22, 0, 12);
            this._addSupplyCrate(22, 0, -12);

            this.playerSpawn.set(0, .2, 26);
            this.spawnPoints = [new THREE.Vector3(-23, .2, -16), new THREE.Vector3(23, .2, -16), new THREE.Vector3(-23, .2, 16), new THREE.Vector3(23, .2, 16), new THREE.Vector3(0, .2, -26), new THREE.Vector3(0, .2, 26), new THREE.Vector3(-17.5, 4.0, 0), new THREE.Vector3(17.5, 4.0, 0)];
            this.botSpawns = [...this.spawnPoints];
        }
        for (let i = 0; i < 6; i++) {
            const b = new THREE.Mesh(new THREE.BoxGeometry(64.5, .25, .25), i % 2 ? mats.ice : mats.ember); b.position.set(0, 11.4, -25 + i * 10); scene.add(b);
        }
    }

    getSafeSpawnPoint(network) {
        const rawCandidates = (this.spawnPoints && this.spawnPoints.length > 0)
            ? this.spawnPoints
            : [this.playerSpawn];

        const isPadSafe = (pt) => {
            if (!this.jumpPads || this.jumpPads.length === 0) return true;
            for (const pad of this.jumpPads) {
                const dx = pt.x - pad.pos.x;
                const dz = pt.z - pad.pos.z;
                if (dx * dx + dz * dz < 14.5) return false;
            }
            return true;
        };

        let candidates = rawCandidates.filter(isPadSafe);
        if (candidates.length === 0) {
            const fallback = this.playerSpawn.clone();
            if (this.jumpPads) {
                for (const pad of this.jumpPads) {
                    const dx = fallback.x - pad.pos.x;
                    const dz = fallback.z - pad.pos.z;
                    if (dx * dx + dz * dz < 14.5) {
                        const ang = Math.atan2(dz, dx) || 0.8;
                        fallback.x = pad.pos.x + Math.cos(ang) * 4.5;
                        fallback.z = pad.pos.z + Math.sin(ang) * 4.5;
                    }
                }
            }
            candidates = [fallback];
        }

        const occupied = [];
        if (network && network.players) {
            for (const id in network.players) {
                if (id === network.myId) continue;
                const s = network.players[id].state;
                if (s && s.pos && s.alive !== false) occupied.push(new THREE.Vector3(...s.pos));
            }
        }
        if (occupied.length === 0) return pick(candidates).clone();
        let best = candidates[0], bestMin = -1;
        for (const c of candidates) {
            let minD = Infinity;
            for (const o of occupied) minD = Math.min(minD, c.distanceTo(o));
            if (minD > bestMin) { bestMin = minD; best = c; }
        }
        return best.clone();
    }

    update(dt, player, bots, game) {
        const now = performance.now() * 0.001;
        if (this._spinProp) {
            this._spinProp.rotation.y += dt * 0.6;
            this._spinProp.rotation.x += dt * 0.25;
        }
        if (this.mapId === 'foundry' && player && player.alive && player.pos.y < -0.15) {
            player.vel.y = 24;
            player.onGround = false;
            player.onHit(20, false, null);
            audio.pad();
            if (game && game.ui) game.ui.showCenterMsg('THERMAL UPDRAFT', 'AVOID MOLTEN CHANNELS', 900);
        }
        for (const b of this.barrels) {
            if (!b.alive) {
                b.respawnTimer -= dt;
                if (b.respawnTimer <= 0) {
                    b.alive = true;
                    b.mesh.visible = true;
                }
            } else {
                b.cyl.rotation.y += dt * 0.6;
            }
        }
        for (const sc of this.supplyCrates) {
            sc.holo.rotation.y += dt * 2.2;
            sc.holo.position.y = 0.65 + Math.sin(now * 3.5) * 0.08;
            if (sc.cooldown > 0) {
                sc.cooldown -= dt;
                sc.holo.visible = false;
                continue;
            }
            sc.holo.visible = true;
            if (player && player.alive && player.pos.distanceTo(sc.pos) < 1.85) {
                sc.cooldown = 14;
                for (const w of player.weapons) {
                    if (w && !w.melee) {
                        w.mag = w.maxMag;
                        w.reserve = w.maxReserve;
                    }
                }
                player.flashbangs = Math.min(player.maxFlashbangs, player.flashbangs + 1);
                if (player.medkits < player.maxMedkits) player.medkits++;
                audio.pickup();
                if (game && game.ui) game.ui.showCenterMsg('SUPPLY RESTOCK', 'AMMO · MEDKIT · FLASH REPLENISHED', 1100);
            }
        }
        for (const pad of this.jumpPads) {
            if (pad.cooldown > 0) pad.cooldown -= dt;
            pad.phase += dt * 3.4;
            if (pad.core && pad.core.material) {
                pad.core.material.emissiveIntensity = 3.0 + Math.sin(pad.phase * 2) * 0.9;
            }
            if (pad.light) {
                pad.light.intensity = 9 + Math.sin(pad.phase * 2) * 3;
            }
            if (pad.beam) {
                pad.beam.rotation.y += dt * 1.8;
            }
            if (pad.rings) {
                for (let i = 0; i < pad.rings.length; i++) {
                    const ring = pad.rings[i];
                    const cycle = ((pad.phase * 0.45) + i / pad.rings.length) % 1;
                    ring.position.y = 0.25 + cycle * 2.1;
                    const s = 1.0 - cycle * 0.38;
                    ring.scale.set(s, s, 1);
                    ring.material.opacity = Math.sin(cycle * Math.PI) * 0.9;
                }
            }

            if (player && player.alive && pad.cooldown <= 0 && (player._padGraceTimer || 0) <= 0) {
                const dx = player.pos.x - pad.pos.x;
                const dz = player.pos.z - pad.pos.z;
                const dy = player.pos.y - pad.pos.y;
                if (dx * dx + dz * dz < 3.2 && Math.abs(dy) < 1.45) {
                    player.vel.y = pad.boostY;
                    player.onGround = false;
                    player.sliding = false;
                    const fwdX = -Math.sin(player.yaw);
                    const fwdZ = -Math.cos(player.yaw);
                    player.vel.x += fwdX * pad.forwardBoost;
                    player.vel.z += fwdZ * pad.forwardBoost;
                    pad.cooldown = 0.45;
                    audio.pad();
                    if (game && game.effects) {
                        game.effects.jumpPadBurst(pad.pos, pad.colorHex);
                    }
                }
            }
            for (const bot of bots) {
                if (!bot.alive) continue;
                const dx = bot.pos.x - pad.pos.x, dz = bot.pos.z - pad.pos.z, dy = bot.pos.y - pad.pos.y;
                if (dx * dx + dz * dz < 3.2 && Math.abs(dy) < 1.45) {
                    bot.vel.y = pad.boostY * 0.85;
                    bot.onGround = false;
                }
            }
        }
    }

    _hasHeadroom(pos, r, newY, h) {
        for (let i = 0; i < this.colliders.length; i++) {
            const c = this.colliders[i];
            if (pos.x + r <= c.min.x + 0.01 || pos.x - r >= c.max.x - 0.01) continue;
            if (pos.z + r <= c.min.z + 0.01 || pos.z - r >= c.max.z - 0.01) continue;
            if (newY < c.max.y - 0.02 && newY + h > c.min.y + 0.02) return false;
        }
        return true;
    }

    moveAndSlide(pos, vel, radius, height, dt) {
        const maxMove = Math.max(Math.abs(vel.x * dt), Math.abs(vel.y * dt), Math.abs(vel.z * dt));
        const steps = maxMove > 0.35 ? Math.min(4, Math.ceil(maxMove / 0.35)) : 1;
        const sdt = dt / steps;
        let grounded = false;

        for (let s = 0; s < steps; s++) {
            pos.x += vel.x * sdt;
            this._resolveAxis(pos, vel, radius, height, 'x');
            pos.z += vel.z * sdt;
            this._resolveAxis(pos, vel, radius, height, 'z');
            pos.y += vel.y * sdt;

            for (let i = 0; i < this.colliders.length; i++) {
                const c = this.colliders[i];
                if (pos.x + radius <= c.min.x || pos.x - radius >= c.max.x ||
                    pos.z + radius <= c.min.z || pos.z - radius >= c.max.z) continue;
                if (pos.y < c.max.y && pos.y + height > c.min.y) {
                    const penTop = c.max.y - pos.y;
                    const penBot = (pos.y + height) - c.min.y;
                    if (vel.y <= 0 && penTop <= 0.52 && penTop <= penBot) {
                        pos.y = c.max.y;
                        vel.y = 0;
                        grounded = true;
                    } else if (vel.y > 0 && penBot <= 0.52) {
                        pos.y = c.min.y - height;
                        vel.y = 0;
                    }
                }
            }
        }
        return grounded;
    }

    _resolveAxis(pos, vel, r, h, axis) {
        for (let i = 0; i < this.colliders.length; i++) {
            const c = this.colliders[i];
            if (pos.y + h <= c.min.y + 0.05 || pos.y >= c.max.y - 0.05) continue;
            if (axis === 'x') {
                if (pos.z + r <= c.min.z || pos.z - r >= c.max.z) continue;
                if (pos.x + r > c.min.x && pos.x - r < c.max.x) {
                    const stepH = c.max.y - pos.y;
                    if (stepH > 0 && stepH <= 0.42 && vel.y <= 2.5 && this._hasHeadroom(pos, r * 0.9, c.max.y, h)) {
                        pos.y = c.max.y;
                        continue;
                    }
                    if (vel.x > 0) pos.x = c.min.x - r;
                    else if (vel.x < 0) pos.x = c.max.x + r;
                    vel.x = 0;
                }
            } else {
                if (pos.x + r <= c.min.x || pos.x - r >= c.max.x) continue;
                if (pos.z + r > c.min.z && pos.z - r < c.max.z) {
                    const stepH = c.max.y - pos.y;
                    if (stepH > 0 && stepH <= 0.42 && vel.y <= 2.5 && this._hasHeadroom(pos, r * 0.9, c.max.y, h)) {
                        pos.y = c.max.y;
                        continue;
                    }
                    if (vel.z > 0) pos.z = c.min.z - r;
                    else if (vel.z < 0) pos.z = c.max.z + r;
                    vel.z = 0;
                }
            }
        }
    }

    raycast(origin, dir, maxDist) {
        let bestT = maxDist; const hitPoint = new THREE.Vector3(), normal = new THREE.Vector3();
        for (let i = 0; i < this.colliders.length; i++) {
            const c = this.colliders[i]; let tmin = 0, tmax = bestT, hitAxis = -1, hitSign = 1;
            for (let a = 0; a < 3; a++) {
                const o = origin.getComponent(a), d = dir.getComponent(a); const mn = c.min.getComponent(a), mx = c.max.getComponent(a);
                if (Math.abs(d) < 1e-7) { if (o < mn || o > mx) { tmin = Infinity; break; } }
                else {
                    const inv = 1 / d; let t1 = (mn - o) * inv, t2 = (mx - o) * inv, s = -1;
                    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; s = 1; }
                    if (t1 > tmin) { tmin = t1; hitAxis = a; hitSign = s; }
                    if (t2 < tmax) tmax = t2;
                    if (tmin > tmax) { tmin = Infinity; break; }
                }
            }
            if (tmin < bestT && tmin >= 0) {
                bestT = tmin;
                hitPoint.copy(origin).addScaledVector(dir, tmin);
                normal.set(0, 0, 0);
                if (hitAxis >= 0) normal.setComponent(hitAxis, hitSign);
            }
        }
        return { hit: bestT < maxDist, dist: bestT, point: hitPoint, normal };
    }

    dispose() {
        const disposedGeos = new Set();
        const disposedMats = new Set();
        for (let i = 0; i < this.meshes.length; i++) {
            const root = this.meshes[i];
            this.scene.remove(root);
            root.traverse(o => {
                if (o.geometry && !disposedGeos.has(o.geometry)) {
                    disposedGeos.add(o.geometry);
                    o.geometry.dispose();
                }
                if (o.material) {
                    const mats = Array.isArray(o.material) ? o.material : [o.material];
                    for (const mat of mats) {
                        if (mat && !disposedMats.has(mat)) {
                            disposedMats.add(mat);
                            mat.dispose();
                        }
                    }
                }
            });
        }
        this.meshes = [];
        this.colliders = [];
        this.jumpPads = [];
        this.barrels = [];
        this.supplyCrates = [];
        this.spawnPoints = [];
        this.botSpawns = [];
        this._spinProp = null;
    }
}

class EffectsSystem {
    constructor(scene) {
        this.scene = scene;
        this.tracers = [];
        this.particles = [];
        this.flashes = [];
        this.rockets = [];
        this.slashWaves = [];
        this.scorchMarks = [];

        this._tGeo = new THREE.CylinderGeometry(.016, .016, 1, 5);
        this._tGeo.rotateX(Math.PI / 2);
        this._pGeo = new THREE.BoxGeometry(.09, .09, .09);
        this._sGeo = new THREE.SphereGeometry(0.5, 12, 12);
        this._mGeo = new THREE.SphereGeometry(0.18, 6, 6);
        this._scorchGeo = new THREE.CircleGeometry(0.11, 8);
        this._ringGeo = new THREE.RingGeometry(0.45, 1.35, 24);
        this._arcOuterGeo = new THREE.TorusGeometry(1.45, 0.055, 6, 22, Math.PI * 0.85);
        this._arcInnerGeo = new THREE.TorusGeometry(1.38, 0.025, 5, 18, Math.PI * 0.75);
    }

    tracer(from, to, color = 0xffdd44) {
        const dist = from.distanceTo(to);
        if (dist < .05) return;
        if (this.tracers.length >= 44) {
            const old = this.tracers.shift();
            this.scene.remove(old.m);
            old.m.material.dispose();
        }
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .94, blending: THREE.AdditiveBlending, depthWrite: false });
        const m = new THREE.Mesh(this._tGeo, mat);
        m.position.copy(from).addScaledVector(to.clone().sub(from).normalize(), dist * .5);
        m.lookAt(to);
        m.scale.set(1, 1, dist);
        this.scene.add(m);
        this.tracers.push({ m, life: .09, max: .09 });
    }

    scorchMark(pos, normal) {
        if (!normal || normal.lengthSq() < 0.1) return;
        const m = new THREE.Mesh(
            this._scorchGeo,
            new THREE.MeshBasicMaterial({ color: 0x090b0e, transparent: true, opacity: 0.72, depthWrite: false })
        );
        m.position.copy(pos).addScaledVector(normal, 0.015);
        m.lookAt(pos.clone().add(normal));
        this.scene.add(m);
        this.scorchMarks.push({ m, life: 7.0 });
        if (this.scorchMarks.length > 42) {
            const old = this.scorchMarks.shift();
            this.scene.remove(old.m);
            old.m.material.dispose();
        }
    }

    shockRing(pos, color = 0xff8c24, maxScale = 4.5, dur = 0.36) {
        if (this.flashes.length >= 26) return;
        const ring = new THREE.Mesh(
            this._ringGeo,
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(pos).add(new THREE.Vector3(0, 0.18, 0));
        this.scene.add(ring);
        this.flashes.push({ m: ring, l: null, life: dur, max: dur, base: 1, expand: true, expandScale: maxScale, sharedGeo: true });
    }

    jumpPadBurst(pos, color = 0xff8c24) {
        this.shockRing(pos, color, 2.8, 0.34);
        this.sparks(pos.clone().add(new THREE.Vector3(0, 0.4, 0)), color, 12, 7);
    }

    katanaSlashArc(pos, dir, isSuper = false, color = 0xff1e38) {
        if (this.flashes.length >= 26) return;
        const arcGroup = new THREE.Group();
        const scaleMult = isSuper ? 1.32 : 0.95;
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const mesh = new THREE.Mesh(this._arcOuterGeo, mat);
        mesh.rotation.z = -Math.PI * 0.425;
        arcGroup.add(mesh);

        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const innerMesh = new THREE.Mesh(this._arcInnerGeo, innerMat);
        innerMesh.rotation.z = -Math.PI * 0.375;
        arcGroup.add(innerMesh);

        arcGroup.scale.setScalar(scaleMult);
        arcGroup.position.copy(pos).addScaledVector(dir, 1.35);
        arcGroup.lookAt(pos.clone().addScaledVector(dir, 5));
        arcGroup.rotateZ(rand(-0.55, 0.55));
        arcGroup.rotateX(rand(-0.25, 0.25));

        this.scene.add(arcGroup);
        this.flashes.push({
            m: arcGroup,
            l: null,
            life: isSuper ? 0.25 : 0.17,
            max: isSuper ? 0.25 : 0.17,
            base: 1,
            isKatanaArc: true,
            sharedGeo: true
        });
    }

    katanaParry(pos) {
        this.shockRing(pos, 0x40e0ff, 2.2, 0.28);
        this.sparks(pos, 0x40e0ff, 16, 8);
        this.sparks(pos, 0xffffff, 8, 6);
    }

    spawnSlashWave(pos, dir, ownerId, damage, game) {
        const waveGroup = new THREE.Group();
        const outer = new THREE.Mesh(
            this._arcOuterGeo,
            new THREE.MeshBasicMaterial({ color: 0xff1e38, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        outer.rotation.z = -Math.PI * 0.425;
        const core = new THREE.Mesh(
            this._arcInnerGeo,
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        core.rotation.z = -Math.PI * 0.375;
        waveGroup.add(outer, core);
        waveGroup.position.copy(pos);
        waveGroup.lookAt(pos.clone().add(dir));
        this.scene.add(waveGroup);
        this.slashWaves.push({
            m: waveGroup,
            pos: pos.clone(),
            dir: dir.clone().normalize(),
            speed: 40,
            life: 0.55,
            ownerId,
            damage,
            hitSet: new Set()
        });
    }

    muzzleFlash(pos, color = 0xffb347) {
        if (this.flashes.length >= 26) return;
        const m = new THREE.Mesh(this._mGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false }));
        m.position.copy(pos);
        this.scene.add(m);
        this.flashes.push({ m, l: null, life: .045, max: .045, base: 1, sharedGeo: true });
    }

    sparks(pos, color = 0xffbb55, count = 10, speed = 5) {
        const budget = Math.max(0, 180 - this.particles.length);
        const spawnCount = Math.min(count, budget);
        for (let i = 0; i < spawnCount; i++) {
            const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
            const m = new THREE.Mesh(this._pGeo, mat);
            m.position.copy(pos);
            const s = rand(.5, 1.45);
            m.scale.set(s, s, s);
            const v = new THREE.Vector3(rand(-1, 1), rand(.2, 1.4), rand(-1, 1)).normalize().multiplyScalar(rand(speed * .4, speed));
            this.scene.add(m);
            this.particles.push({ m, v, g: 14, life: rand(.18, .44), max: .44 });
        }
    }

    explosion(pos, color = 0xff7722) {
        this.sparks(pos, 0xffaa33, 22, 12);
        this.sparks(pos, color, 16, 8);
        this.shockRing(pos, color, 6.5, 0.38);
        if (this.flashes.length < 26) {
            const sphere = new THREE.Mesh(this._sGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
            sphere.position.copy(pos);
            const l = this.flashes.filter(f => f.l).length < 4 ? new THREE.PointLight(color, 22, 20, 2) : null;
            if (l) { l.position.copy(pos); this.scene.add(l); }
            this.scene.add(sphere);
            this.flashes.push({ m: sphere, l, life: .34, max: .34, base: 22, expand: true, expandScale: 9.5, sharedGeo: true });
        }
    }

    spawnRocket(pos, dir, speed, owner, weaponDef) {
        const g = new THREE.Group();
        const isFuga = weaponDef && weaponDef.isFuga;
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(isFuga ? .11 : .07, isFuga ? .05 : .07, isFuga ? .85 : .55, 8),
            new THREE.MeshBasicMaterial({ color: isFuga ? 0xff4500 : 0x3a424d })
        );
        body.rotation.x = Math.PI / 2;
        const head = new THREE.Mesh(
            new THREE.ConeGeometry(isFuga ? .16 : .09, isFuga ? .32 : .22, 8),
            new THREE.MeshBasicMaterial({ color: isFuga ? 0xfff0a0 : 0xff6a1a })
        );
        head.rotation.x = Math.PI / 2;
        head.position.z = isFuga ? .48 : .35;
        g.add(body, head);
        if (isFuga) {
            const halo = new THREE.Mesh(
                new THREE.TorusGeometry(0.28, 0.03, 6, 18),
                new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })
            );
            g.add(halo);
        }
        g.position.copy(pos);
        g.lookAt(pos.clone().add(dir));
        this.scene.add(g);
        this.rockets.push({ g, pos: pos.clone(), vel: dir.clone().multiplyScalar(speed), life: 4.5, owner, def: weaponDef, smokeT: 0 });
    }

    update(dt, world, targets, onRocketHit, game) {
        for (let i = this.tracers.length - 1; i >= 0; i--) {
            const t = this.tracers[i]; t.life -= dt;
            if (t.life <= 0) { this.scene.remove(t.m); t.m.material.dispose(); this.tracers.splice(i, 1); }
            else t.m.material.opacity = t.life / t.max;
        }
        for (let i = this.scorchMarks.length - 1; i >= 0; i--) {
            const sm = this.scorchMarks[i]; sm.life -= dt;
            if (sm.life <= 0) { this.scene.remove(sm.m); sm.m.material.dispose(); this.scorchMarks.splice(i, 1); }
            else if (sm.life < 1.5) sm.m.material.opacity = (sm.life / 1.5) * 0.72;
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i]; p.life -= dt;
            if (p.life <= 0) { this.scene.remove(p.m); p.m.material.dispose(); this.particles.splice(i, 1); }
            else {
                p.v.y -= p.g * dt;
                p.m.position.addScaledVector(p.v, dt);
                p.m.rotation.x += 5 * dt;
                p.m.rotation.y += 4 * dt;
                p.m.material.opacity = Math.max(0, p.life / p.max);
            }
        }
        for (let i = this.flashes.length - 1; i >= 0; i--) {
            const f = this.flashes[i]; f.life -= dt;
            if (f.life <= 0) {
                this.scene.remove(f.m);
                if (f.m.traverse) {
                    f.m.traverse(o => {
                        if (!f.sharedGeo && o.geometry) o.geometry.dispose();
                        if (o.material) o.material.dispose();
                    });
                }
                if (f.l) this.scene.remove(f.l);
                this.flashes.splice(i, 1);
            } else {
                const k = f.life / f.max;
                if (f.isKatanaArc) {
                    f.m.scale.multiplyScalar(1 + dt * 1.4);
                    f.m.children.forEach(c => { if (c.material) c.material.opacity = k; });
                } else {
                    if (f.m.material) f.m.material.opacity = k;
                    if (f.expand) f.m.scale.setScalar(1 + (1 - k) * (f.expandScale || 9));
                }
                if (f.l) f.l.intensity = f.base * k;
            }
        }
        for (let i = this.slashWaves.length - 1; i >= 0; i--) {
            const sw = this.slashWaves[i];
            sw.life -= dt;
            sw.pos.addScaledVector(sw.dir, sw.speed * dt);
            sw.m.position.copy(sw.pos);
            sw.m.scale.setScalar(1 + (0.55 - sw.life) * 1.4);
            sw.m.children.forEach(c => { if (c.material) c.material.opacity = Math.max(0, sw.life / 0.55); });
            if (game && sw.ownerId === 'player') {
                for (const bot of game.bots) {
                    if (!bot.alive || sw.hitSet.has(bot)) continue;
                    if (bot.pos.clone().add(new THREE.Vector3(0, 1.0, 0)).distanceTo(sw.pos) < 2.2) {
                        sw.hitSet.add(bot);
                        game.damageBot(bot, sw.damage, false, sw.pos, true);
                        this.sparks(sw.pos, 0xff1e38, 10, 7);
                    }
                }
                if (game.isMultiplayer && !game.isCoop() && game.network) {
                    for (const id in game.network.players) {
                        if (id === game.network.myId || sw.hitSet.has(id)) continue;
                        const pData = game.network.players[id];
                        if (!pData || !pData.state || pData.state.alive === false || !pData.state.pos) continue;
                        const rPos = new THREE.Vector3(...pData.state.pos).add(new THREE.Vector3(0, 1.0, 0));
                        if (rPos.distanceTo(sw.pos) < 2.2) {
                            sw.hitSet.add(id);
                            game.network.broadcast({
                                type: 'HIT', targetId: id, damage: sw.damage,
                                attackerId: game.network.myId, attackerName: game.network.myName, isMelee: true
                            });
                            game.ui.showHitmarker(false);
                            game.ui.spawnDamageNum(sw.damage, false, rPos, game.camera);
                            audio.katanaHit(false);
                        }
                    }
                }
            }
            const wallHit = world.raycast(sw.pos, sw.dir, sw.speed * dt + 0.5);
            if (wallHit.hit || sw.life <= 0) {
                if (wallHit.hit) this.sparks(wallHit.point, 0xff1e38, 8, 6);
                this.scene.remove(sw.m);
                sw.m.traverse(o => { if (o.material) o.material.dispose(); });
                this.slashWaves.splice(i, 1);
            }
        }
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i]; r.life -= dt; r.smokeT += dt;
            if (r.smokeT > .03) {
                r.smokeT = 0;
                this.sparks(r.pos, (r.def && r.def.isFuga) ? 0xff8800 : 0x888888, 1, 1.2);
            }
            const step = r.vel.clone().multiplyScalar(dt);
            const dist = step.length();
            const dir = step.clone().normalize();
            const wHit = world.raycast(r.pos, dir, dist + .15);
            let eHit = null;
            for (const t of targets) {
                if (!t.alive || t === r.owner) continue;
                const toT = t.pos.clone().add(new THREE.Vector3(0, .9, 0)).sub(r.pos);
                const proj = toT.dot(dir);
                if (proj > 0 && proj < dist + .4 && toT.sub(dir.clone().multiplyScalar(proj)).length() < .68) { eHit = t; break; }
            }
            if (wHit.hit || eHit || r.life <= 0) {
                const hitPos = wHit.hit ? wHit.point : (eHit ? eHit.pos.clone().add(new THREE.Vector3(0, .9, 0)) : r.pos);
                const expColor = (r.def && r.def.isFuga) ? 0xff5500 : 0xff7722;
                this.explosion(hitPos, expColor);
                audio.explosion(hitPos);
                if (onRocketHit) onRocketHit(hitPos, r.def, r.owner);
                this.scene.remove(r.g);
                r.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
                this.rockets.splice(i, 1);
            } else {
                r.pos.add(step);
                r.g.position.copy(r.pos);
                if (r.def && r.def.isFuga) r.g.rotation.z += dt * 14;
            }
        }
    }

    clear() {
        for (const t of this.tracers) { this.scene.remove(t.m); t.m.material.dispose(); }
        for (const sm of this.scorchMarks) { this.scene.remove(sm.m); sm.m.material.dispose(); }
        for (const p of this.particles) { this.scene.remove(p.m); p.m.material.dispose(); }
        for (const f of this.flashes) {
            this.scene.remove(f.m);
            if (f.m.traverse) f.m.traverse(o => { if (!f.sharedGeo && o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
            if (f.l) this.scene.remove(f.l);
        }
        for (const r of this.rockets) {
            this.scene.remove(r.g);
            r.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
        }
        for (const sw of this.slashWaves) {
            this.scene.remove(sw.m);
            sw.m.traverse(o => { if (o.material) o.material.dispose(); });
        }
        this.tracers = []; this.scorchMarks = []; this.particles = []; this.flashes = []; this.rockets = []; this.slashWaves = [];
    }
}

function buildDragonGun(withLight = true) {
    const g = new THREE.Group();
    const scaleMat = new THREE.MeshStandardMaterial({ color: 0x990b12, metalness: 0.78, roughness: 0.24 });
    const darkScaleMat = new THREE.MeshStandardMaterial({ color: 0x24070a, metalness: 0.85, roughness: 0.32 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffb627, metalness: 0.92, roughness: 0.16 });
    const emberMat = new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff3b00, emissiveIntensity: 3.8 });
    const membraneMat = new THREE.MeshStandardMaterial({ color: 0x450508, emissive: 0x550800, emissiveIntensity: 0.85, side: THREE.DoubleSide, roughness: 0.42 });

    for (let i = 0; i < 4; i++) {
        const t = i / 3;
        const w = 0.115 - t * 0.022;
        const h = 0.135 - t * 0.025;
        const seg = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), i % 2 === 0 ? scaleMat : darkScaleMat);
        seg.position.set(0, -0.015 + Math.sin(t * Math.PI) * 0.015, -0.38 + i * 0.145);
        g.add(seg);

        const bellyPlate = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 0.032, 0.13), goldMat);
        bellyPlate.position.set(0, -0.08 + t * 0.01, -0.38 + i * 0.145);
        g.add(bellyPlate);
    }

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.15, 0.082), darkScaleMat);
    grip.position.set(0, -0.14, 0.02);
    grip.rotation.x = -0.32;
    g.add(grip);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.035, -0.52);

    const cranium = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.105, 0.19), scaleMat);
    const browL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.15), goldMat);
    browL.position.set(-0.048, 0.045, -0.03);
    const browR = browL.clone();
    browR.position.x = 0.048;

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.062, 0.17), scaleMat);
    snout.position.set(0, 0.012, -0.14);
    const nostrilL = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), emberMat);
    nostrilL.position.set(-0.026, 0.032, -0.21);
    const nostrilR = nostrilL.clone();
    nostrilR.position.x = 0.026;

    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.038, -0.06);
    jawGroup.rotation.x = 0.26;
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.034, 0.16), darkScaleMat);
    jaw.position.set(0, 0, -0.07);
    jawGroup.add(jaw);

    for (const sx of [-0.028, 0.028]) {
        const upperFang = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.035, 5), goldMat);
        upperFang.rotation.x = Math.PI;
        upperFang.position.set(sx, -0.025, -0.19);
        headGroup.add(upperFang);

        const lowerFang = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.03, 5), goldMat);
        lowerFang.position.set(sx * 0.85, 0.022, -0.13);
        jawGroup.add(lowerFang);
    }

    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.022, 0.038), emberMat);
    eyeL.position.set(-0.056, 0.024, -0.04);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.056;

    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.21, 6), goldMat);
    hornL.position.set(-0.044, 0.095, 0.05);
    hornL.rotation.set(-0.68, 0, 0.25);
    const hornR = hornL.clone();
    hornR.position.x = 0.044;
    hornR.rotation.z = -0.25;

    const subHornL = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.12, 5), scaleMat);
    subHornL.position.set(-0.058, 0.045, 0.055);
    subHornL.rotation.set(-0.55, 0, 0.48);
    const subHornR = subHornL.clone();
    subHornR.position.x = 0.058;
    subHornR.rotation.z = -0.48;

    const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.16, 8), emberMat);
    flameCore.rotation.x = -Math.PI / 2;
    flameCore.position.set(0, -0.015, -0.22);

    headGroup.add(cranium, browL, browR, snout, nostrilL, nostrilR, jawGroup, eyeL, eyeR, hornL, hornR, subHornL, subHornR, flameCore);

    const buildWing = (side) => {
        const wg = new THREE.Group();
        wg.position.set(side * 0.052, 0.025, -0.16);
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.008, 0.26, 6), goldMat);
        arm.rotation.z = side * -1.15;
        arm.rotation.x = -0.25;
        arm.position.set(side * 0.11, 0.05, -0.04);

        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.045, 5), goldMat);
        claw.position.set(side * 0.22, 0.105, -0.08);
        claw.rotation.set(-0.6, 0, side * -0.5);

        const geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, -0.06),
            new THREE.Vector3(side * 0.23, 0.11, -0.14),
            new THREE.Vector3(side * 0.20, 0.03, 0.14),
            new THREE.Vector3(0, 0, -0.06),
            new THREE.Vector3(side * 0.20, 0.03, 0.14),
            new THREE.Vector3(0, -0.01, 0.12)
        ]);
        geo.computeVertexNormals();
        const membrane = new THREE.Mesh(geo, membraneMat);
        wg.add(arm, claw, membrane);
        return wg;
    };
    const wingL = buildWing(-1);
    const wingR = buildWing(1);

    for (let i = 0; i < 6; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.068 - i * 0.004, 4), goldMat);
        spike.position.set(0, 0.068, -0.42 + i * 0.095);
        spike.rotation.x = -0.38;
        g.add(spike);
    }

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.28, 6), scaleMat);
    tail.rotation.x = Math.PI / 2 + 0.36;
    tail.position.set(0, -0.085, 0.19);
    const tailBlade = new THREE.Mesh(new THREE.OctahedronGeometry(0.028, 0), emberMat);
    tailBlade.scale.set(0.5, 0.5, 1.8);
    tailBlade.position.set(0, -0.135, 0.32);

    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, -0.015, -0.76);
    const light = withLight ? new THREE.PointLight(0xff4500, 0, 6) : null;
    if (light) light.position.copy(muzzle.position);

    g.add(headGroup, wingL, wingR, tail, tailBlade, muzzle);
    if (light) g.add(light);
    g.userData = { muzzle, muzzleLight: light, isDragon: true, flameCore, wingL, wingR, jawGroup };
    return g;
}

function buildKatanaMesh(camo = 'default') {
    const g = new THREE.Group();
    const tex = generateCamoTexture(camo);
    const isCustom = camo && camo !== 'default';

    const bladeMat = new THREE.MeshStandardMaterial({
        color: isCustom ? 0xffffff : 0xdce4ee,
        map: isCustom ? tex : null,
        metalness: 0.94,
        roughness: 0.14
    });
    const edgeGlowColor = isCustom ? (CAMO_COLORS[camo] || 0xff1e38) : 0xff1e38;
    const edgeMat = new THREE.MeshStandardMaterial({
        color: edgeGlowColor,
        emissive: edgeGlowColor,
        emissiveIntensity: 3.2,
        metalness: 0.5,
        roughness: 0.2
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
    g.add(kashira);

    const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.014, 16), guardMat);
    tsuba.rotation.x = Math.PI / 2;
    const tsubaRim = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.004, 6, 18), goldAccent);
    const habaki = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.038, 0.042), goldAccent);
    habaki.position.set(0, 0.004, -0.024);
    g.add(tsuba, tsubaRim, habaki);

    const segs = 7;
    const segLen = 0.155;
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

    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.06, -1.15);
    g.add(muzzle);

    g.userData = { muzzle, muzzleLight: null, isKatana: true };
    return g;
}

function buildWeaponMesh(kind, camo = 'default', withLight = true) {
    if (camo === 'dragon' && kind !== 'knife' && kind !== 'katana') return buildDragonGun(withLight);
    if (kind === 'katana') return buildKatanaMesh(camo);

    const g = new THREE.Group();
    const isDefault = !camo || camo === 'default';
    const tex = generateCamoTexture(camo);
    const metal = new THREE.MeshStandardMaterial({
        color: isDefault ? 0x222a35 : 0xffffff,
        map: isDefault ? null : tex,
        metalness: isDefault ? 0.86 : 0.68,
        roughness: isDefault ? 0.24 : 0.34
    });
    const dark = new THREE.MeshStandardMaterial({ color: 0x0d1117, metalness: 0.75, roughness: 0.38 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x627082, metalness: 0.92, roughness: 0.2 });
    const accentHex = isDefault ? 0xff7a1a : (CAMO_COLORS[camo] || 0xff7a1a);
    const accent = new THREE.MeshStandardMaterial({ color: 0x1a0e05, emissive: accentHex, emissiveIntensity: 2.5 });

    const addBox = (w, h, d, x, y, z, mat, rx = 0, ry = 0, rz = 0) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        if (rx || ry || rz) m.rotation.set(rx, ry, rz);
        g.add(m);
        return m;
    };
    const addCyl = (rTop, rBot, len, x, y, z, mat, segs = 10, rx = Math.PI / 2) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, segs), mat);
        m.position.set(x, y, z);
        m.rotation.x = rx;
        g.add(m);
        return m;
    };

    let mPos = new THREE.Vector3(0, 0.015, -0.78);

    if (kind === 'rifle') {
        addBox(0.076, 0.075, 0.34, 0, 0.005, -0.10, metal);
        addBox(0.068, 0.055, 0.28, 0, -0.048, -0.08, dark);
        addBox(0.072, 0.082, 0.26, 0, 0.002, -0.38, metal);
        addBox(0.046, 0.018, 0.56, 0, 0.052, -0.22, dark);
        addBox(0.082, 0.012, 0.22, 0, 0.005, -0.38, accent);
        addCyl(0.015, 0.017, 0.32, 0, 0.014, -0.62, steel);
        addCyl(0.022, 0.020, 0.065, 0, 0.014, -0.78, dark);
        addBox(0.052, 0.22, 0.095, 0, -0.16, -0.12, dark, 0.22);
        addBox(0.056, 0.02, 0.105, 0, -0.26, -0.14, accent, 0.22);
        addBox(0.048, 0.145, 0.078, 0, -0.14, 0.03, dark, -0.34);
        addBox(0.044, 0.08, 0.07, 0, -0.075, -0.34, dark, 0.45);
        addBox(0.062, 0.056, 0.11, 0, 0.088, -0.13, dark);
        addBox(0.068, 0.062, 0.085, 0, 0.09, -0.13, metal);
        addBox(0.044, 0.034, 0.008, 0, 0.09, -0.186, accent);
        addCyl(0.022, 0.022, 0.22, 0, 0.005, 0.16, steel);
        addBox(0.055, 0.11, 0.16, 0, -0.02, 0.24, dark);
        mPos.set(0, 0.014, -0.82);
    } else if (kind === 'ak47') {
        const wood = new THREE.MeshStandardMaterial({ color: 0x7c3f1d, roughness: 0.62 });
        addBox(0.078, 0.105, 0.42, 0, -0.015, -0.14, metal);
        addBox(0.072, 0.045, 0.36, 0, 0.045, -0.13, dark);
        addBox(0.058, 0.115, 0.29, 0, -0.048, 0.20, wood, -0.12);
        addBox(0.076, 0.084, 0.23, 0, -0.006, -0.42, wood);
        addCyl(0.014, 0.014, 0.22, 0, 0.042, -0.43, dark);
        addCyl(0.016, 0.018, 0.36, 0, 0.012, -0.66, steel);
        addBox(0.014, 0.045, 0.022, 0, 0.042, -0.81, dark);
        addCyl(0.021, 0.019, 0.05, 0, 0.012, -0.85, accent);
        addBox(0.054, 0.26, 0.098, 0, -0.175, -0.13, dark, 0.46);
        addBox(0.048, 0.14, 0.075, 0, -0.135, 0.02, wood, -0.35);
        mPos.set(0, 0.012, -0.88);
    } else if (kind === 'smg') {
        addBox(0.068, 0.115, 0.38, 0, -0.018, -0.12, metal);
        addBox(0.044, 0.016, 0.36, 0, 0.048, -0.12, dark);
        addCyl(0.024, 0.024, 0.22, 0, 0.01, -0.41, dark, 12);
        addBox(0.072, 0.012, 0.18, 0, 0.01, -0.41, accent);
        addBox(0.042, 0.24, 0.066, 0, -0.16, -0.14, dark, 0.14);
        addBox(0.046, 0.13, 0.07, 0, -0.13, 0.02, dark, -0.32);
        addBox(0.052, 0.042, 0.085, 0, 0.074, -0.11, dark);
        addBox(0.038, 0.028, 0.008, 0, 0.076, -0.15, accent);
        mPos.set(0, 0.01, -0.54);
    } else if (kind === 'lmg') {
        addBox(0.115, 0.145, 0.58, 0, -0.015, -0.18, metal);
        addBox(0.105, 0.095, 0.32, 0, 0.01, -0.54, dark);
        addBox(0.112, 0.016, 0.28, 0, 0.01, -0.54, accent);
        addCyl(0.022, 0.024, 0.44, 0, 0.018, -0.76, steel);
        addCyl(0.032, 0.028, 0.08, 0, 0.018, -0.98, dark);
        addBox(0.135, 0.175, 0.175, -0.085, -0.115, -0.16, dark);
        addBox(0.055, 0.025, 0.12, -0.055, -0.01, -0.16, accent);
        addBox(0.065, 0.065, 0.15, 0, 0.095, -0.14, dark);
        addCyl(0.009, 0.009, 0.24, -0.05, -0.08, -0.62, steel, 6, 1.35);
        addCyl(0.009, 0.009, 0.24, 0.05, -0.08, -0.62, steel, 6, 1.35);
        mPos.set(0, 0.018, -1.03);
    } else if (kind === 'shotgun') {
        addBox(0.086, 0.115, 0.44, 0, -0.015, -0.12, metal);
        addCyl(0.023, 0.025, 0.56, 0, 0.024, -0.56, steel);
        addCyl(0.019, 0.019, 0.50, 0, -0.026, -0.53, dark);
        addBox(0.088, 0.072, 0.21, 0, -0.032, -0.44, dark);
        addBox(0.092, 0.016, 0.18, 0, -0.032, -0.44, accent);
        for (let s = 0; s < 4; s++) {
            addCyl(0.011, 0.011, 0.065, -0.05, -0.008, -0.02 - s * 0.036, accent, 8, 0);
        }
        addBox(0.055, 0.14, 0.08, 0, -0.135, 0.03, dark, -0.35);
        addBox(0.064, 0.115, 0.25, 0, -0.045, 0.20, dark, -0.14);
        mPos.set(0, 0.024, -0.86);
    } else if (kind === 'sniper' || kind === 'kar98') {
        const isKar = kind === 'kar98';
        const bodyMat = isKar ? new THREE.MeshStandardMaterial({ color: 0x6e3a1e, roughness: 0.65 }) : metal;
        addBox(0.082, 0.115, 0.56, 0, -0.015, -0.14, bodyMat);
        addCyl(0.019, 0.022, 0.78, 0, 0.018, -0.76, steel);
        addBox(0.042, 0.038, 0.095, 0, 0.018, -1.16, dark);
        addBox(0.046, 0.014, 0.085, 0, 0.018, -1.16, accent);
        addCyl(0.028, 0.026, 0.34, 0, 0.082, -0.12, dark, 12);
        addCyl(0.036, 0.030, 0.09, 0, 0.082, -0.31, dark, 12);
        addCyl(0.032, 0.032, 0.06, 0, 0.082, 0.06, dark, 12);
        addBox(0.034, 0.034, 0.008, 0, 0.082, -0.356, accent);
        addCyl(0.008, 0.008, 0.08, 0.048, 0.022, -0.06, steel, 6, 0);
        addBox(0.052, 0.145, 0.12, 0, -0.135, -0.14, dark);
        addBox(0.062, 0.12, 0.28, 0, -0.045, 0.24, bodyMat, -0.1);
        mPos.set(0, 0.018, -1.22);
    } else if (kind === 'rocket') {
        addCyl(0.088, 0.088, 1.15, 0, 0.035, -0.30, metal, 14);
        addCyl(0.098, 0.094, 0.14, 0, 0.035, -0.86, dark, 14);
        addCyl(0.095, 0.098, 0.14, 0, 0.035, 0.26, dark, 14);
        addBox(0.195, 0.02, 0.82, 0, 0.035, -0.30, accent);
        addBox(0.075, 0.07, 0.13, -0.095, 0.085, -0.36, dark);
        addBox(0.055, 0.048, 0.008, -0.095, 0.085, -0.428, accent);
        addBox(0.052, 0.16, 0.085, 0, -0.12, -0.14, dark, -0.2);
        addBox(0.048, 0.14, 0.075, 0, -0.11, -0.44, dark, 0.15);
        mPos.set(0, 0.035, -0.94);
    } else if (kind === 'knife') {
        addBox(0.032, 0.044, 0.19, 0, -0.012, 0.02, dark);
        addBox(0.036, 0.014, 0.15, 0, -0.012, 0.02, accent);
        addBox(0.014, 0.044, 0.30, 0, 0.002, -0.22, steel);
        addBox(0.008, 0.012, 0.28, 0, -0.018, -0.22, accent);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.09, 4), steel);
        tip.rotation.x = -Math.PI / 2;
        tip.position.set(0, 0.002, -0.41);
        g.add(tip);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.006, 6, 14), steel);
        ring.position.set(0, -0.012, 0.13);
        g.add(ring);
        mPos.set(0, 0, -0.46);
    }

    const muzzle = new THREE.Object3D();
    muzzle.position.copy(mPos);
    g.add(muzzle);
    let light = null;
    if (withLight) {
        light = new THREE.PointLight(accentHex, 0, 6);
        light.position.copy(mPos);
        g.add(light);
    }
    g.userData = { muzzle, muzzleLight: light };
    return g;
}

function buildMenuCharacter(scene) {
    const g = new THREE.Group();
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x161d26, metalness: 0.85, roughness: 0.25 });
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.32, 0.18, 24), pedMat);
    ped.position.y = 0.09;
    ped.receiveShadow = true;
    g.add(ped);

    const accentColor = new THREE.Color(SaveSystem.data.settings.uiColor || '#ff7a1a');
    const pedRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.18, 0.028, 8, 36),
        new THREE.MeshBasicMaterial({ color: accentColor })
    );
    pedRing.rotation.x = Math.PI / 2;
    pedRing.position.y = 0.19;
    g.add(pedRing);

    const armorMat = new THREE.MeshStandardMaterial({ color: SaveSystem.data.settings.skinColor || '#e8ecf0', metalness: 0.35, roughness: 0.45 });
    const underMat = new THREE.MeshStandardMaterial({ color: 0x181f29, metalness: 0.45, roughness: 0.65 });
    const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 1.8 });

    const charRoot = new THREE.Group();
    charRoot.position.y = 0.18;

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.78, 0.21), underMat);
    legL.position.set(-0.14, 0.39, 0); legL.castShadow = true;
    const legR = legL.clone(); legR.position.x = 0.14;

    const shinL = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.38, 0.23), armorMat);
    shinL.position.set(-0.14, 0.24, 0.01);
    const shinR = shinL.clone(); shinR.position.x = 0.14;

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.68, 0.28), armorMat);
    torso.position.set(0, 1.12, 0); torso.castShadow = true;

    const chestCore = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.31), accentMat);
    chestCore.position.set(0, 1.22, 0);

    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.46, 0.16), underMat);
    pack.position.set(0, 1.15, -0.2);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), armorMat);
    head.position.set(0, 1.66, 0); head.castShadow = true;

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.10, 0.04), accentMat);
    visor.position.set(0, 1.67, 0.16);

    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.18), armorMat);
    armL.position.set(-0.37, 1.14, 0.06);
    armL.rotation.set(-0.35, 0, 0.12);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.18), armorMat);
    armR.position.set(0.37, 1.14, 0.12);
    armR.rotation.set(-0.65, 0, -0.12);

    charRoot.add(legL, legR, shinL, shinR, torso, chestCore, pack, head, visor, armL, armR);

    const primaryKind = (SaveSystem.data.equippedLoadout && SaveSystem.data.equippedLoadout[0]) || 'rifle';
    const primaryCamo = (SaveSystem.data.equippedCamos && SaveSystem.data.equippedCamos[primaryKind]) || 'default';
    const wMesh = buildWeaponMesh(primaryKind, primaryCamo, false);
    wMesh.scale.setScalar(0.88);
    wMesh.position.set(0.22, 1.05, 0.32);
    wMesh.rotation.set(0.1, -Math.PI * 0.72, -0.15);
    charRoot.add(wMesh);

    g.add(charRoot);
    g.userData = { charRoot, pedRing, armorMat, accentMat };
    scene.add(g);
    return g;
}

function buildRemoteAvatar(name, skinColor = '#e8ecf0', uiColor = '#ff7a1a') {
    const group = new THREE.Group();
    const armorMat = new THREE.MeshStandardMaterial({ color: skinColor || '#e8ecf0', metalness: 0.35, roughness: 0.45 });
    const underMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.45, roughness: 0.65 });
    const accentMat = new THREE.MeshStandardMaterial({ color: uiColor || '#ff7a1a', emissive: uiColor || '#ff7a1a', emissiveIntensity: 1.8 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.76, 0.30), armorMat);
    body.position.set(0, 1.10, 0);
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), armorMat);
    head.position.set(0, 1.68, 0);
    head.castShadow = true;
    group.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.10, 0.04), accentMat);
    visor.position.set(0, 1.69, -0.17);
    group.add(visor);

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.20), underMat);
    legL.position.set(-0.15, 0.36, 0);
    legL.castShadow = true;
    const legR = legL.clone();
    legR.position.x = 0.15;
    group.add(legL, legR);

    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.58, 0.16), armorMat);
    armL.position.set(-0.37, 1.12, -0.05);
    const armR = armL.clone();
    armR.position.x = 0.37;
    group.add(armL, armR);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = uiColor || '#ff7a1a';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((name || 'PLAYER').toUpperCase(), 128, 32);

    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(1.8, 0.45, 1);
    sprite.position.set(0, 2.22, 0);
    group.add(sprite);

    group.userData.legs = [legL, legR];
    group.userData.arms = [armL, armR];
    group.userData.name = name;
    return group;
}

class AbilitySystem {
    constructor(scene, world, effects, ui, game) {
        this.scene = scene; this.world = world; this.effects = effects; this.ui = ui; this.game = game;
        this.types = [
            { id: 'speed', name: 'OVERDRIVE', color: 0x00ffff, dur: 12 },
            { id: 'damage', name: 'OVERCHARGE', color: 0xff2244, dur: 12 },
            { id: 'shield', name: 'AEGIS SHIELD', color: 0xffaa00, dur: 14 },
            { id: 'telekinesis', name: 'TELEKINESIS', color: 0xaa00ff, dur: 10 },
            { id: 'teleport', name: 'BLINK STEP', color: 0x40d0ff, dur: 12 },
            { id: 'infinity', name: 'LIMITLESS', color: 0x0088ff, dur: 10 }
        ];
        this.pickups = [];
        this.active = {};
        this.spawnTimer = 6;
        this._spawnInitial();
    }
    _spawnInitial() {
        const pts = this.world.spawnPoints && this.world.spawnPoints.length ? this.world.spawnPoints : [new THREE.Vector3(0, 0.5, 0)];
        for (let i = 0; i < Math.min(3, pts.length); i++) {
            const p = pts[i];
            const t = this.types[i % this.types.length];
            this.spawnPickupAt([p.x, p.y + 0.8, p.z], t.id);
        }
    }
    spawnPickupAt(posArr, typeId) {
        const def = this.types.find(t => t.id === typeId) || pick(this.types);
        const g = new THREE.Group();
        g.position.set(posArr[0], posArr[1], posArr[2]);
        const core = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.32, 0),
            new THREE.MeshBasicMaterial({ color: def.color })
        );
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.46, 0.03, 6, 18),
            new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.75 })
        );
        g.add(core, ring);
        this.scene.add(g);
        this.pickups.push({ g, core, ring, pos: g.position, def, phase: rand(0, Math.PI * 2) });
    }
    has(id) { return (this.active[id] || 0) > 0; }
    grant(id, dur = 12) {
        const def = this.types.find(t => t.id === id) || { id, name: id.toUpperCase(), color: 0xffaa00, dur };
        this.active[id] = Math.max(this.active[id] || 0, dur);
        this.ui.showCenterMsg(def.name + ' ACTIVATED', `[F] TO USE SPECIAL ABILITY`, 1400);
    }
    update(dt) {
        for (const id in this.active) {
            if (this.active[id] > 0) {
                this.active[id] -= dt;
                if (this.active[id] <= 0) delete this.active[id];
            }
        }
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.pickups.length < 4) {
            this.spawnTimer = 16;
            const pts = this.world.spawnPoints && this.world.spawnPoints.length ? this.world.spawnPoints : [new THREE.Vector3(0, 0.5, 0)];
            const sp = pick(pts);
            const def = pick(this.types);
            const posArr = [sp.x, sp.y + 0.8, sp.z];
            this.spawnPickupAt(posArr, def.id);
            if (this.game.isMultiplayer && this.game.network && this.game.network.isHost) {
                this.game.network.broadcast({ type: 'POWERUP_SPAWN', pos: posArr, pType: def.id });
            }
        }
        const player = this.game.player;
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pk = this.pickups[i];
            pk.phase += dt * 3;
            pk.core.rotation.y += dt * 2.2;
            pk.core.rotation.x += dt * 1.4;
            pk.ring.rotation.x = Math.sin(pk.phase * 0.7) * 0.8;
            pk.ring.rotation.y += dt * 2.5;
            pk.g.position.y = pk.pos.y + Math.sin(pk.phase) * 0.004;

            if (player && player.alive && player.pos.distanceTo(pk.g.position) < 1.8) {
                this.grant(pk.def.id, pk.def.dur);
                if (pk.def.id === 'shield') player.shield = Math.min(player.maxShield, player.shield + 60);
                audio.pickup();
                this.scene.remove(pk.g);
                pk.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
                this.pickups.splice(i, 1);
            }
        }
    }
    clear() {
        for (const pk of this.pickups) {
            this.scene.remove(pk.g);
            pk.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
        }
        this.pickups = [];
        this.active = {};
    }
}

class Player {
    constructor(camera, scene, input, world, effects, abilitySystem) {
        this.camera = camera; this.scene = scene; this.input = input; this.world = world; this.effects = effects; this.abilitySystem = abilitySystem;
        this.pos = world.playerSpawn.clone(); this.vel = new THREE.Vector3();
        this.yaw = 0; this.pitch = 0;
        this.radius = 0.42; this.standHeight = 1.75; this.crouchHeight = 1.05; this.height = this.standHeight;
        this.eyeOffset = 1.58; this.currentEye = this.eyeOffset;
        this.onGround = false; this.crouching = false; this.sliding = false; this.slideTimer = 0; this.slideDir = new THREE.Vector3();
        this.health = 100; this.maxHealth = 100; this.shield = 0; this.maxShield = 100; this.alive = true;
        this.medkits = 2; this.maxMedkits = 3;
        this.flashbangs = 2; this.maxFlashbangs = 3;
        this.ads = 0; this.recoilPitch = 0; this.recoilYaw = 0;
        this.walkPhase = 0; this.stepTimer = 0;
        this.tkFreezeTimer = 0; this.confusedTimer = 0;
        this._padGraceTimer = 0;

        this.katanaCombo = 0;
        this.katanaComboTimer = 0;
        this.katanaDashCooldown = 0;
        this.parryTimer = 0;
        this.parryCooldown = 0;

        this.sukunaTimer = 0;
        this.sukunaMaxTimer = 35;
        this.cleaveCooldown = 0;
        this.fugaCooldown = 0;
        this.domainCooldown = 0;
        this._savedLoadout = null;

        this.weaponHolder = new THREE.Group();
        this.camera.add(this.weaponHolder);

        this.weapons = [];
        this.currentSlot = 0;
        this.equipLoadout(SaveSystem.data.equippedLoadout);
    }

    get currentWeapon() { return this.weapons[this.currentSlot]; }

    equipLoadout(slotKinds) {
        for (const w of this.weapons) {
            if (w && w.mesh) {
                this.weaponHolder.remove(w.mesh);
                w.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
            }
        }
        this.weapons = slotKinds.map(kind => {
            const def = WEAPON_DEFS[kind] || WEAPON_DEFS.rifle;
            const camo = (SaveSystem.data.equippedCamos && SaveSystem.data.equippedCamos[kind]) || 'default';
            const mesh = buildWeaponMesh(kind, camo, true);
            mesh.position.set(0.26, -0.24, -0.45);
            mesh.visible = false;
            this.weaponHolder.add(mesh);
            return {
                ...def,
                camo,
                mesh,
                mag: def.mag,
                maxMag: def.mag,
                reserve: def.reserve,
                maxReserve: def.reserve,
                cooldown: 0,
                reloading: 0,
                swingAnim: 0
            };
        });
        this.switchSlot(0, true);
    }

    switchSlot(idx, silent = false) {
        if (idx < 0 || idx >= this.weapons.length || !this.weapons[idx]) return;
        this.weapons.forEach((w, i) => { if (w && w.mesh) w.mesh.visible = (i === idx); });
        this.currentSlot = idx;
        this.ads = 0;
        const w = this.currentWeapon;
        if (!silent && w) {
            if (w.kind === 'katana') audio.katanaDraw();
            else audio.ui();
        }
    }

    reset(spawnPos) {
        if (spawnPos) this.pos.copy(spawnPos);
        else this.pos.copy(this.world.playerSpawn);
        this.vel.set(0, 0, 0);
        this.onGround = false;
        this.crouching = false;
        this.sliding = false;
        this.slideTimer = 0;
        this.tkFreezeTimer = 0;
        this.confusedTimer = 0;
        this._padGraceTimer = 0.6;
        this.parryTimer = 0;
        this._resetViewState();
    }

    _resetViewState() {
        this.ads = 0;
        this.recoilPitch = 0;
        this.recoilYaw = 0;
        this.weaponHolder.position.set(0, 0, 0);
        this.weaponHolder.rotation.set(0, 0, 0);
        this.camera.fov = SaveSystem.data.settings.fov || 90;
        this.camera.updateProjectionMatrix();
    }

    activateSukuna(game) {
        if (this.sukunaTimer > 0) return;
        this.sukunaTimer = this.sukunaMaxTimer;
        this.health = this.maxHealth;
        this.shield = Math.max(this.shield, 50);
        this._savedLoadout = this.weapons.map(w => w.kind);
        for (const w of this.weapons) {
            if (w && w.mesh) {
                this.weaponHolder.remove(w.mesh);
                w.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
            }
        }
        const disDef = WEAPON_DEFS.dismantle;
        this.weapons = [{
            ...disDef,
            camo: 'crimson',
            mesh: null,
            mag: 999,
            maxMag: 999,
            reserve: 999,
            maxReserve: 999,
            cooldown: 0,
            reloading: 0,
            swingAnim: 0
        }];
        this.currentSlot = 0;
        if (window.sukunaHandVfx) window.sukunaHandVfx.spawn(this.camera);
        audio.sukuna();
        if (game && game.ui) {
            game.ui.showCenterMsg('RYOMEN SUKUNA', 'LMB: DISMANTLE · RMB: CLEAVE · Q: FUGA · E: DOMAIN', 3200);
        }
        if (game && game.isMultiplayer && game.network) {
            game.network.broadcast({ type: 'SUKUNA', playerId: game.network.myId });
        }
    }

    deactivateSukuna(game) {
        if (this.sukunaTimer <= 0) return;
        this.sukunaTimer = 0;
        if (window.sukunaHandVfx) window.sukunaHandVfx.remove();
        this.equipLoadout(this._savedLoadout || SaveSystem.data.equippedLoadout);
        this._savedLoadout = null;
        if (game && game.domainActive && game.domainOwner) {
            game.endDomain();
            if (game.isMultiplayer && game.network) game.network.broadcast({ type: 'DOMAIN_END' });
        }
    }

    useDomainExpansion(game) {
        if (this.sukunaTimer <= 0 || this.domainCooldown > 0) return;
        this.domainCooldown = 14;
        if (game.isMultiplayer && game.network) {
            if (game.network.isHost) {
                game.network.processDomainIntent(game.network.myId);
            } else {
                game.network.broadcast({ type: 'DOMAIN_INTENT', playerId: game.network.myId });
            }
        } else {
            game.triggerDomainExpansion(true, this.pos.clone());
        }
    }

    onHit(dmg, isMelee = false, attackerPos = null) {
        if (!this.alive) return;
        if (this.abilitySystem && this.abilitySystem.has('infinity')) {
            if (window.game && window.game.effects) {
                window.game.effects.shockRing(this.pos, 0x0088ff, 2.0, 0.22);
            }
            return;
        }
        let rem = dmg;
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, rem);
            this.shield -= absorbed;
            rem -= absorbed;
        }
        this.health = Math.max(0, this.health - rem);
        if (window.game) {
            window.game.addShake(Math.min(0.45, dmg * 0.008));
            if (window.game.ui) window.game.ui.damageFlash(attackerPos, this.pos, this.yaw);
        }
        if (this.health <= 0 && this.alive) {
            this.alive = false;
            if (window.game) window.game.onPlayerDied();
        }
    }

    update(dt, game) {
        if (!this.alive) return;
        if (this._padGraceTimer > 0) this._padGraceTimer -= dt;
        if (this.tkFreezeTimer > 0) this.tkFreezeTimer -= dt;
        if (this.confusedTimer > 0) this.confusedTimer -= dt;
        if (this.katanaComboTimer > 0) {
            this.katanaComboTimer -= dt;
            if (this.katanaComboTimer <= 0) this.katanaCombo = 0;
        }
        if (this.katanaDashCooldown > 0) this.katanaDashCooldown -= dt;
        if (this.parryTimer > 0) this.parryTimer -= dt;
        if (this.parryCooldown > 0) this.parryCooldown -= dt;
        if (this.cleaveCooldown > 0) this.cleaveCooldown -= dt;
        if (this.fugaCooldown > 0) this.fugaCooldown -= dt;
        if (this.domainCooldown > 0) this.domainCooldown -= dt;

        if (this.sukunaTimer > 0) {
            this.sukunaTimer -= dt;
            if (this.sukunaTimer <= 0) this.deactivateSukuna(game);
        }

        // Mouse look
        const baseSens = (SaveSystem.data.settings.sensitivity || 1) * 0.0022;
        const scopeMult = this.ads > 0.3 ? (SaveSystem.data.settings.scopeSensitivity || 0.8) * 0.55 : 1.0;
        const sens = baseSens * scopeMult;
        const invY = SaveSystem.data.settings.invertY ? -1 : 1;
        const confSign = this.confusedTimer > 0 ? -0.5 : 1;
        this.yaw -= this.input.mouseDX * sens * confSign;
        this.pitch = clamp(this.pitch - this.input.mouseDY * sens * invY * confSign, -Math.PI * 0.48, Math.PI * 0.48);

        // Recoil recovery
        this.recoilPitch = damp(this.recoilPitch, 0, 12, dt);
        this.recoilYaw = damp(this.recoilYaw, 0, 12, dt);

        // Weapon switching
        if (this.sukunaTimer <= 0) {
            if (this.input.hit('Digit1')) this.switchSlot(0);
            if (this.input.hit('Digit2')) this.switchSlot(1);
            if (this.input.hit('Digit3')) this.switchSlot(2);
            if (this.input.hit('Digit4')) this.switchSlot(3);
            if (this.input.wheel !== 0) {
                const next = (this.currentSlot + (this.input.wheel > 0 ? 1 : -1) + this.weapons.length) % this.weapons.length;
                this.switchSlot(next);
            }
        }

        // Movement vectors
        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
        const moveDir = new THREE.Vector3();
        if (this.input.down('KeyW')) moveDir.add(forward);
        if (this.input.down('KeyS')) moveDir.sub(forward);
        if (this.input.down('KeyD')) moveDir.add(right);
        if (this.input.down('KeyA')) moveDir.sub(right);
        if (moveDir.lengthSq() > 0) moveDir.normalize();

        const sprinting = this.input.down('ShiftLeft') && moveDir.dot(forward) > 0.2 && !this.crouching && this.ads < 0.3;
        const crouchHeld = this.input.down('KeyC') || this.input.down('ControlLeft');

        if (crouchHeld && sprinting && this.onGround && !this.sliding && this.slideTimer <= 0) {
            this.sliding = true;
            this.slideTimer = 0.72;
            this.slideDir.copy(moveDir);
            audio.slide();
        }
        if (this.sliding) {
            this.slideTimer -= dt;
            if (this.slideTimer <= 0 || !crouchHeld || !this.onGround) this.sliding = false;
        }
        this.crouching = crouchHeld || this.sliding;

        const targetH = this.crouching ? this.crouchHeight : this.standHeight;
        if (targetH > this.height && !this.world._hasHeadroom(this.pos, this.radius * 0.9, this.pos.y, targetH)) {
            this.crouching = true;
        } else {
            this.height = damp(this.height, targetH, 16, dt);
        }
        const targetEye = this.crouching ? 0.88 : this.eyeOffset;
        this.currentEye = damp(this.currentEye, targetEye, 16, dt);

        if (this.tkFreezeTimer <= 0) {
            let speed = 8.4;
            if (sprinting) speed = 12.2;
            if (this.crouching) speed = 4.6;
            if (this.ads > 0.3) speed *= 0.68;
            if (this.currentWeapon && this.currentWeapon.kind === 'katana') speed *= 1.16;
            if (this.sukunaTimer > 0) speed *= 1.32;
            if (this.abilitySystem && this.abilitySystem.has('speed')) speed *= 1.4;
            if (game && game.overdriveTimer > 0) speed *= 1.35;

            if (this.sliding) {
                const slideSpd = 15.5 * (this.slideTimer / 0.72 + 0.35);
                this.vel.x = damp(this.vel.x, this.slideDir.x * slideSpd, 10, dt);
                this.vel.z = damp(this.vel.z, this.slideDir.z * slideSpd, 10, dt);
            } else {
                const accel = this.onGround ? 14 : 4.5;
                this.vel.x = damp(this.vel.x, moveDir.x * speed, accel, dt);
                this.vel.z = damp(this.vel.z, moveDir.z * speed, accel, dt);
            }

            if (this.input.hit('Space') && this.onGround) {
                this.vel.y = 9.4;
                this.onGround = false;
                this.sliding = false;
                audio.jump();
            }
        } else {
            this.vel.x = damp(this.vel.x, 0, 8, dt);
            this.vel.z = damp(this.vel.z, 0, 8, dt);
        }

        const wasGrounded = this.onGround;
        this.vel.y -= 24 * dt;
        this.onGround = this.world.moveAndSlide(this.pos, this.vel, this.radius, this.height, dt);
        if (!wasGrounded && this.onGround) audio.land();

        if (this.pos.y < this.world.killY) {
            this.alive = false;
            game.onPlayerDied();
            return;
        }

        // Footsteps & viewmodel bob
        const hSpeed = Math.hypot(this.vel.x, this.vel.z);
        if (this.onGround && hSpeed > 1.2 && !this.sliding) {
            this.walkPhase += dt * hSpeed * 1.45;
            this.stepTimer -= dt * (hSpeed / 8);
            if (this.stepTimer <= 0) {
                this.stepTimer = 0.42;
                audio.footstep();
            }
        } else {
            this.walkPhase = damp(this.walkPhase, 0, 8, dt);
        }

        // Camera transform
        this.camera.position.set(this.pos.x, this.pos.y + this.currentEye, this.pos.z);
        _e1.set(this.pitch + this.recoilPitch, this.yaw + this.recoilYaw, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(_e1);

        // Medkit [E] (when not Sukuna)
        if (this.sukunaTimer <= 0 && this.input.hit('KeyE')) {
            if (this.medkits > 0 && this.health < this.maxHealth) {
                this.medkits--;
                this.health = Math.min(this.maxHealth, this.health + 55);
                audio.medkit();
                game.ui.showCenterMsg('MEDKIT USED', '+55 HP RESTORED', 900);
            }
        }

        // Flashbang [G]
        if (this.input.hit('KeyG') && this.flashbangs > 0) {
            this.flashbangs--;
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const throwVel = dir.multiplyScalar(20).add(new THREE.Vector3(0, 4.5, 0));
            game.spawnFlashbang(this.camera.position.clone().addScaledVector(dir, 0.04), throwVel, true);
            audio.throw();
        }

        // Active Ability [F]
        if (this.input.hit('KeyF')) {
            if (this.abilitySystem.has('teleport')) {
                const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                const hit = this.world.raycast(this.camera.position, dir, 14);
                const dist = hit.hit ? Math.max(1, hit.dist - 0.8) : 14;
                this.pos.addScaledVector(dir, dist);
                this.pos.y = Math.max(this.pos.y, 0.25);
                this.vel.y = Math.max(0, this.vel.y);
                this.effects.shockRing(this.pos, 0x40d0ff, 2.5, 0.25);
                audio.teleport();
                delete this.abilitySystem.active.teleport;
            } else if (this.abilitySystem.has('telekinesis')) {
                audio.telekinesis();
                for (const b of game.bots) {
                    if (b.alive && b.pos.distanceTo(this.pos) < 18) {
                        b.vel.y = 14;
                        b.onGround = false;
                        b.confusedTimer = 2.5;
                        game.damageBot(b, 35, false, b.pos.clone().add(new THREE.Vector3(0, 1, 0)));
                    }
                }
                if (game.isMultiplayer && game.network) {
                    for (const id in game.network.players) {
                        if (id === game.network.myId) continue;
                        const s = game.network.players[id].state;
                        if (s && s.pos && new THREE.Vector3(...s.pos).distanceTo(this.pos) < 18) {
                            game.network.broadcast({ type: 'TK_FREEZE', targetId: id });
                        }
                    }
                }
                delete this.abilitySystem.active.telekinesis;
            }
        }

        // Sukuna Special Skills
        if (this.sukunaTimer > 0) {
            if (this.input.hit('KeyE')) this.useDomainExpansion(game);
            if (this.input.hit('KeyQ') && this.fugaCooldown <= 0) {
                this.fugaCooldown = 6.5;
                const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                const origin = this.camera.position.clone().addScaledVector(dir, 0.8);
                this.effects.spawnRocket(origin, dir, 52, 'player', {
                    damage: 220, splashDamage: 140, splashRadius: 8.5, isFuga: true
                });
                if (window.sukunaHandVfx) window.sukunaHandVfx.swing('dismantle');
                audio.shoot('rocket', origin);
                game.ui.showCenterMsg('FUGA // OPEN', 'DIVINE FLAME LAUNCHED', 1100);
            }
            if (this.input.right && this.cleaveCooldown <= 0) {
                this.cleaveCooldown = 1.6;
                if (window.sukunaHandVfx) window.sukunaHandVfx.swing('cleave');
                audio.katanaSlash(true, 2, this.pos);
                game.addShake(0.28);
                const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                const origin = this.camera.position.clone().addScaledVector(fwd, 3.2);
                if (window.sukunaSlashVfx) window.sukunaSlashVfx(origin, 'cleave');
                for (const b of game.bots) {
                    if (!b.alive) continue;
                    const toB = b.pos.clone().add(new THREE.Vector3(0, 1, 0)).sub(this.camera.position);
                    if (toB.length() < 9.5 && toB.normalize().dot(fwd) > 0.35) {
                        game.damageBot(b, 140, false, b.pos.clone().add(new THREE.Vector3(0, 1, 0)), true);
                    }
                }
                if (game.isMultiplayer && !game.isCoop() && game.network) {
                    for (const id in game.network.players) {
                        if (id === game.network.myId) continue;
                        const s = game.network.players[id].state;
                        if (!s || s.alive === false || !s.pos) continue;
                        const rPos = new THREE.Vector3(...s.pos).add(new THREE.Vector3(0, 1, 0));
                        const toR = rPos.clone().sub(this.camera.position);
                        if (toR.length() < 9.5 && toR.normalize().dot(fwd) > 0.35) {
                            game.network.broadcast({
                                type: 'HIT', targetId: id, damage: 140,
                                attackerId: game.network.myId, attackerName: game.network.myName, isMelee: true
                            });
                            game.ui.showHitmarker(false);
                            game.ui.spawnDamageNum(140, false, rPos, game.camera);
                        }
                    }
                }
            }
        }

        // ADS & Weapon Update
        const w = this.currentWeapon;
        if (!w) return;
        if (w.cooldown > 0) w.cooldown -= dt;
        if (w.swingAnim > 0) w.swingAnim = Math.max(0, w.swingAnim - dt * 5);

        const wantsAds = this.input.right && !w.melee && this.sukunaTimer <= 0 && w.reloading <= 0;
        this.ads = damp(this.ads, wantsAds ? 1 : 0, 14, dt);

        // Sniper Scope Overlay & FOV
        const baseFov = SaveSystem.data.settings.fov || 90;
        const isScoped = (w.kind === 'sniper' || w.kind === 'kar98') && this.ads > 0.65;
        const targetFov = isScoped ? 26 : lerp(baseFov, baseFov * 0.72, this.ads);
        if (Math.abs(this.camera.fov - targetFov) > 0.05) {
            this.camera.fov = damp(this.camera.fov, targetFov, 16, dt);
            this.camera.updateProjectionMatrix();
        }
        const scopeEl = document.getElementById('scope');
        if (scopeEl) scopeEl.classList.toggle('show', isScoped);
        if (w.mesh) w.mesh.visible = !isScoped;

        // Katana Right-Click Parry / Dash
        if (w.kind === 'katana' && this.input.right && this.parryCooldown <= 0 && this.parryTimer <= 0) {
            this.parryTimer = 0.45;
            this.parryCooldown = 1.25;
            audio.katanaDraw();
            if (this.katanaDashCooldown <= 0 && this.input.down('ShiftLeft')) {
                this.katanaDashCooldown = 2.0;
                const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
                this.vel.x = fwd.x * 24;
                this.vel.z = fwd.z * 24;
                this.effects.katanaSlashArc(this.camera.position, fwd, true, 0xff1e38);
                audio.katanaSlash(true, 1, this.pos);
            }
        }

        // Reloading
        if (this.input.hit('KeyR') && !w.melee && w.reloading <= 0 && w.mag < w.maxMag && (w.reserve > 0 || game.mode === 'training')) {
            w.reloading = w.reloadTime;
            audio.reload();
        }
        if (w.reloading > 0) {
            w.reloading -= dt;
            if (w.reloading <= 0) {
                w.reloading = 0;
                if (game.mode === 'training') {
                    w.mag = w.maxMag;
                } else {
                    const need = w.maxMag - w.mag;
                    const take = Math.min(need, w.reserve);
                    w.mag += take;
                    w.reserve -= take;
                }
                audio.reloadDone();
            }
        }

        // Firing
        const firePressed = w.auto ? this.input.left : (this.input.left && !this._prevLeft);
        this._prevLeft = this.input.left;
        if (firePressed && w.cooldown <= 0 && w.reloading <= 0) {
            if (w.kind === 'katana' || w.kind === 'knife') {
                this._fireMelee(w, game);
            } else if (w.kind === 'dismantle') {
                this._fireDismantle(w, game);
            } else {
                this._fireGun(w, game);
            }
        }

        // Viewmodel positioning, bob & swing
        if (w.mesh) {
            const hipX = 0.26, hipY = -0.24, hipZ = -0.45;
            const adsX = 0.0, adsY = -0.175, adsZ = -0.36;
            const bobX = Math.cos(this.walkPhase) * 0.014 * (1 - this.ads * 0.75);
            const bobY = Math.abs(Math.sin(this.walkPhase)) * 0.014 * (1 - this.ads * 0.75);
            const reloadDip = w.reloading > 0 ? Math.sin((w.reloading / w.reloadTime) * Math.PI) * 0.14 : 0;

            w.mesh.position.set(
                lerp(hipX, adsX, this.ads) + bobX,
                lerp(hipY, adsY, this.ads) - bobY - reloadDip,
                lerp(hipZ, adsZ, this.ads) + w.swingAnim * 0.06
            );

            if (w.kind === 'katana') {
                const parryRot = this.parryTimer > 0 ? 0.95 : 0;
                const swingRot = Math.sin(w.swingAnim * Math.PI);
                w.mesh.rotation.set(
                    -swingRot * 0.9 + parryRot * 0.4,
                    parryRot * 0.9 - swingRot * 0.5,
                    parryRot * 1.1 + swingRot * 1.2
                );
            } else if (w.kind === 'knife') {
                const stab = Math.sin(w.swingAnim * Math.PI);
                w.mesh.position.z -= stab * 0.24;
                w.mesh.rotation.set(-stab * 0.5, 0, 0);
            } else {
                w.mesh.rotation.set(
                    w.swingAnim * 0.14 - reloadDip * 1.8,
                    0,
                    0
                );
            }

            if (w.mesh.userData.muzzleLight && w.mesh.userData.muzzleLight.intensity > 0) {
                w.mesh.userData.muzzleLight.intensity = damp(w.mesh.userData.muzzleLight.intensity, 0, 35, dt);
            }
            if (w.mesh.userData.isDragon) {
                const t = performance.now() * 0.004;
                if (w.mesh.userData.wingL) w.mesh.userData.wingL.rotation.z = Math.sin(t) * 0.14;
                if (w.mesh.userData.wingR) w.mesh.userData.wingR.rotation.z = -Math.sin(t) * 0.14;
            }
        }
    }

    _fireDismantle(w, game) {
        w.cooldown = 60 / w.rpm;
        if (window.sukunaHandVfx) window.sukunaHandVfx.swing('dismantle');
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const origin = this.camera.position.clone();
        const wHit = this.world.raycast(origin, dir, w.range);
        const endPt = wHit.hit ? wHit.point : origin.clone().addScaledVector(dir, w.range);

        if (window.sukunaSlashVfx) window.sukunaSlashVfx(endPt, 'dismantle');
        audio.shoot('dismantle', origin);
        game.addShake(0.08);

        if (wHit.hit) {
            this.effects.scorchMark(wHit.point, wHit.normal);
            for (const m of this.world.meshes) {
                if (m.userData?.destructible && m.position.distanceTo(wHit.point) < 4.5) {
                    window.damageMapMesh(m, wHit.point, w.damage);
                    break;
                }
            }
        }

        for (const b of game.bots) {
            if (!b.alive) continue;
            const bCenter = b.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
            const toB = bCenter.clone().sub(origin);
            const proj = toB.dot(dir);
            if (proj > 0 && proj <= (wHit.dist + 0.5)) {
                const perp = toB.sub(dir.clone().multiplyScalar(proj)).length();
                if (perp < 1.15) {
                    game.damageBot(b, w.damage, false, bCenter, true);
                    if (window.sukunaSlashVfx) window.sukunaSlashVfx(bCenter, 'dismantle');
                }
            }
        }

        if (game.isMultiplayer && !game.isCoop() && game.network) {
            for (const id in game.network.players) {
                if (id === game.network.myId) continue;
                const s = game.network.players[id].state;
                if (!s || s.alive === false || !s.pos) continue;
                const rPos = new THREE.Vector3(...s.pos).add(new THREE.Vector3(0, 1.0, 0));
                const toR = rPos.clone().sub(origin);
                const proj = toR.dot(dir);
                if (proj > 0 && proj <= (wHit.dist + 0.5)) {
                    const perp = toR.sub(dir.clone().multiplyScalar(proj)).length();
                    if (perp < 1.15) {
                        game.network.broadcast({
                            type: 'HIT', targetId: id, damage: w.damage,
                            attackerId: game.network.myId, attackerName: game.network.myName, isMelee: true
                        });
                        game.ui.showHitmarker(false);
                        game.ui.spawnDamageNum(w.damage, false, rPos, game.camera);
                        if (window.sukunaSlashVfx) window.sukunaSlashVfx(rPos, 'dismantle');
                    }
                }
            }
        }
    }

    _fireMelee(w, game) {
        w.cooldown = 60 / w.rpm;
        w.swingAnim = 1.0;
        const isKatana = w.kind === 'katana';
        const isSuper = isKatana && this.katanaCombo === 2;
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const origin = this.camera.position.clone();
        const tracerColor = CAMO_COLORS[w.camo] || 0xff1e38;

        if (isKatana) {
            audio.katanaSlash(isSuper, this.katanaCombo, this.pos);
            this.effects.katanaSlashArc(origin, fwd, isSuper, tracerColor);
            if (isSuper) {
                this.effects.spawnSlashWave(origin.clone().addScaledVector(fwd, 1.0), fwd, 'player', 70, game);
            }
            this.katanaCombo = (this.katanaCombo + 1) % 3;
            this.katanaComboTimer = 1.35;
        } else {
            audio.shoot('knife', this.pos);
        }

        const baseDmg = isSuper ? (w.superDamage || w.damage * 1.45) : w.damage;
        const dmgMult = (this.abilitySystem && this.abilitySystem.has('damage')) ? 1.5 : 1.0;

        for (const b of game.bots) {
            if (!b.alive) continue;
            const bCenter = b.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
            const toB = bCenter.clone().sub(origin);
            const dist = toB.length();
            if (dist <= w.range && toB.normalize().dot(fwd) > 0.45) {
                const botFwd = new THREE.Vector3(-Math.sin(b.yaw), 0, -Math.cos(b.yaw));
                const isBackstab = botFwd.dot(fwd) > 0.65;
                const finalDmg = isBackstab ? Math.max(baseDmg * 3, b.health + 10) : baseDmg * dmgMult;
                game.damageBot(b, finalDmg, isBackstab, bCenter, true);
                this.effects.sparks(bCenter, tracerColor, 10, 6);
                if (isKatana) audio.katanaHit(isBackstab);
            }
        }

        if (game.isMultiplayer && !game.isCoop() && game.network) {
            for (const id in game.network.players) {
                if (id === game.network.myId) continue;
                const s = game.network.players[id].state;
                if (!s || s.alive === false || !s.pos) continue;
                const rPos = new THREE.Vector3(...s.pos).add(new THREE.Vector3(0, 1.0, 0));
                const toR = rPos.clone().sub(origin);
                const dist = toR.length();
                if (dist <= w.range && toR.normalize().dot(fwd) > 0.45) {
                    const rFwd = new THREE.Vector3(-Math.sin(s.yaw || 0), 0, -Math.cos(s.yaw || 0));
                    const isBackstab = rFwd.dot(fwd) > 0.65;
                    const finalDmg = isBackstab ? 250 : Math.round(baseDmg * dmgMult);
                    game.network.broadcast({
                        type: 'HIT', targetId: id, damage: finalDmg, headshot: isBackstab,
                        attackerId: game.network.myId, attackerName: game.network.myName, isMelee: true
                    });
                    game.ui.showHitmarker(isBackstab);
                    game.ui.spawnDamageNum(Math.round(finalDmg), isBackstab, rPos, game.camera);
                    if (isKatana) audio.katanaHit(isBackstab);
                }
            }
            game.network.broadcast({
                type: 'SHOOT', senderId: game.network.myId, weapon: w.kind,
                origin: [origin.x, origin.y, origin.z],
                to: [origin.x + fwd.x * 2, origin.y + fwd.y * 2, origin.z + fwd.z * 2],
                color: tracerColor
            });
        }
    }

    _fireGun(w, game) {
        if (w.mag <= 0) {
            audio.empty();
            if (w.reserve > 0 || game.mode === 'training') {
                w.reloading = w.reloadTime;
                audio.reload();
            }
            return;
        }
        if (game.mode !== 'training' && !(game.overdriveTimer > 0)) {
            w.mag--;
        }
        w.cooldown = 60 / w.rpm;
        w.swingAnim = 1.0;

        const muzzleWorld = new THREE.Vector3();
        if (w.mesh && w.mesh.userData.muzzle) {
            w.mesh.getWorldPosition(muzzleWorld);
            w.mesh.userData.muzzle.getWorldPosition(muzzleWorld);
            if (w.mesh.userData.muzzleLight) w.mesh.userData.muzzleLight.intensity = 10;
        } else {
            muzzleWorld.copy(this.camera.position);
        }

        const tracerColor = CAMO_COLORS[w.camo] || 0xffdd44;
        this.effects.muzzleFlash(muzzleWorld, tracerColor);
        audio.shoot(w.sound, this.pos);
        game.addShake(w.recoil * 0.032);

        const recScale = 1 - this.ads * 0.35;
        this.recoilPitch += w.recoil * 0.022 * recScale;
        this.recoilYaw += rand(-0.012, 0.012) * w.recoil * recScale;

        if (w.projectile) {
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            this.effects.spawnRocket(muzzleWorld, dir, w.rocketSpeed || 42, 'player', w);
            return;
        }

        const pellets = w.pellets || 1;
        const spread = lerp(w.spreadHip, w.spreadAds, this.ads);
        const origin = this.camera.position.clone();
        const dmgMult = (this.abilitySystem && this.abilitySystem.has('damage')) ? 1.5 : 1.0;

        for (let p = 0; p < pellets; p++) {
            const dir = new THREE.Vector3(
                rand(-spread, spread),
                rand(-spread, spread),
                -1
            ).normalize().applyQuaternion(this.camera.quaternion);

            const wHit = this.world.raycast(origin, dir, w.range);
            let maxD = wHit.hit ? wHit.dist : w.range;

            // Check Explosive Barrels
            for (const barrel of this.world.barrels) {
                if (!barrel.alive) continue;
                const toB = barrel.pos.clone().sub(origin);
                const proj = toB.dot(dir);
                if (proj > 0 && proj < maxD) {
                    const perp = toB.sub(dir.clone().multiplyScalar(proj)).length();
                    if (perp < 0.55) {
                        maxD = proj;
                        barrel.alive = false;
                        barrel.mesh.visible = false;
                        barrel.respawnTimer = 18;
                        this.effects.explosion(barrel.pos, 0xff5500);
                        audio.explosion(barrel.pos);
                        game._onRocketHit(barrel.pos, { splashDamage: 110, splashRadius: 6.5 }, 'player');
                    }
                }
            }

            // Check Bots
            let bestBot = null, bestBotDist = maxD, bestHead = false, bestPoint = null;
            for (const b of game.bots) {
                if (!b.alive) continue;
                const hitRes = b.raycast(origin, dir, bestBotDist);
                if (hitRes.hit && hitRes.dist < bestBotDist) {
                    bestBot = b;
                    bestBotDist = hitRes.dist;
                    bestHead = hitRes.head;
                    bestPoint = hitRes.point;
                }
            }

            // Check Remote Players in Multiplayer
            let bestRemoteId = null, bestRemoteDist = bestBotDist, bestRemoteHead = false, bestRemotePoint = null;
            if (game.isMultiplayer && !game.isCoop() && game.network) {
                for (const id in game.network.players) {
                    if (id === game.network.myId) continue;
                    const s = game.network.players[id].state;
                    if (!s || s.alive === false || !s.pos) continue;
                    const pBase = new THREE.Vector3(...s.pos);
                    const headPos = pBase.clone().add(new THREE.Vector3(0, 1.65, 0));
                    const bodyPos = pBase.clone().add(new THREE.Vector3(0, 0.95, 0));

                    const toH = headPos.clone().sub(origin);
                    const projH = toH.dot(dir);
                    if (projH > 0 && projH < bestRemoteDist && toH.sub(dir.clone().multiplyScalar(projH)).length() < 0.28) {
                        bestRemoteId = id; bestRemoteDist = projH; bestRemoteHead = true;
                        bestRemotePoint = origin.clone().addScaledVector(dir, projH);
                    } else {
                        const toB = bodyPos.clone().sub(origin);
                        const projB = toB.dot(dir);
                        if (projB > 0 && projB < bestRemoteDist && toB.sub(dir.clone().multiplyScalar(projB)).length() < 0.44) {
                            bestRemoteId = id; bestRemoteDist = projB; bestRemoteHead = false;
                            bestRemotePoint = origin.clone().addScaledVector(dir, projB);
                        }
                    }
                }
            }

            let endPoint = wHit.hit ? wHit.point : origin.clone().addScaledVector(dir, w.range);

            if (bestRemoteId && bestRemotePoint) {
                endPoint = bestRemotePoint;
                let dmg = w.damage * (bestRemoteHead ? w.headMult : 1.0) * dmgMult;
                if (w.falloff && bestRemoteDist > 12) dmg *= clamp(1 - (bestRemoteDist - 12) / (w.range - 12) * 0.65, 0.35, 1);
                game.network.broadcast({
                    type: 'HIT', targetId: bestRemoteId, damage: Math.round(dmg), headshot: bestRemoteHead,
                    attackerId: game.network.myId, attackerName: game.network.myName, isMelee: false
                });
                game.ui.showHitmarker(bestRemoteHead);
                game.ui.spawnDamageNum(Math.round(dmg), bestRemoteHead, bestRemotePoint, game.camera);
                this.effects.sparks(bestRemotePoint, bestRemoteHead ? 0xff4444 : 0xffaa33, 6, 4);
                audio.hit(bestRemoteHead);
            } else if (bestBot && bestPoint) {
                endPoint = bestPoint;
                let dmg = w.damage * (bestHead ? w.headMult : 1.0) * dmgMult;
                if (w.falloff && bestBotDist > 12) dmg *= clamp(1 - (bestBotDist - 12) / (w.range - 12) * 0.65, 0.35, 1);
                game.damageBot(bestBot, Math.round(dmg), bestHead, bestPoint, false);
                this.effects.sparks(bestPoint, bestHead ? 0xff4444 : 0xffaa33, 6, 4);
            } else if (wHit.hit) {
                this.effects.scorchMark(wHit.point, wHit.normal);
                this.effects.sparks(wHit.point, 0xffaa44, 4, 3.5);
            }

            this.effects.tracer(muzzleWorld, endPoint, tracerColor);
            if (game.isMultiplayer && game.network && p === 0) {
                game.network.broadcast({
                    type: 'SHOOT', senderId: game.network.myId, weapon: w.kind,
                    origin: [muzzleWorld.x, muzzleWorld.y, muzzleWorld.z],
                    to: [endPoint.x, endPoint.y, endPoint.z],
                    color: tracerColor
                });
            }
        }
    }
}

class Bot {
    constructor(scene, world, effects, spawnPos, wave = 1, role = 'grunt') {
        this.scene = scene; this.world = world; this.effects = effects;
        this.pos = spawnPos.clone(); this.vel = new THREE.Vector3();
        this.yaw = rand(0, Math.PI * 2);
        this.role = role;
        this.isDummy = role === 'dummy' || role === 'dummy_moving';
        this.isBoss = role === 'boss';

        const waveScale = 1 + Math.max(0, wave - 1) * 0.14;
        if (this.isDummy) {
            this.maxHealth = 250; this.speed = role === 'dummy_moving' ? 4.2 : 0; this.damage = 0; this.fireRate = 999; this.scale = 1.0;
        } else if (this.isBoss) {
            this.maxHealth = Math.round(900 * waveScale); this.speed = 4.6; this.damage = Math.round(18 * waveScale); this.fireRate = 0.28; this.scale = 1.65;
        } else if (role === 'heavy') {
            this.maxHealth = Math.round(185 * waveScale); this.speed = 3.8; this.damage = Math.round(14 * waveScale); this.fireRate = 0.55; this.scale = 1.22;
        } else if (role === 'phantom') {
            this.maxHealth = Math.round(85 * waveScale); this.speed = 6.8; this.damage = Math.round(11 * waveScale); this.fireRate = 0.38; this.scale = 0.96;
        } else {
            this.maxHealth = Math.round(100 * waveScale); this.speed = 5.0; this.damage = Math.round(10 * waveScale); this.fireRate = 0.5; this.scale = 1.0;
        }
        this.health = this.maxHealth;
        this.alive = true;
        this.onGround = false;
        this.fireTimer = rand(0.4, 1.2);
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
        this.strafeTimer = rand(1.0, 2.5);
        this.confusedTimer = 0;
        this.deathTimer = 0;
        this.walkPhase = rand(0, Math.PI * 2);
        this.patrolOrigin = spawnPos.clone();

        this._buildMesh();
    }

    _buildMesh() {
        const g = new THREE.Group();
        const colors = {
            grunt: { armor: 0x3b4754, visor: 0xff5a1a },
            heavy: { armor: 0x5c3424, visor: 0xffaa00 },
            phantom: { armor: 0x262238, visor: 0xb050ff },
            boss: { armor: 0x3a0c14, visor: 0xff1a2a },
            dummy: { armor: 0x2e3b47, visor: 0x3fe08a },
            dummy_moving: { armor: 0x2a454a, visor: 0x40d0ff }
        };
        const pal = colors[this.role] || colors.grunt;
        const armorMat = new THREE.MeshStandardMaterial({ color: pal.armor, metalness: 0.55, roughness: 0.45 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x12161d, metalness: 0.65, roughness: 0.5 });
        const visorMat = new THREE.MeshBasicMaterial({ color: pal.visor });

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.78, 0.30), armorMat);
        torso.position.y = 1.12; torso.castShadow = true;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), armorMat);
        head.position.y = 1.70; head.castShadow = true;
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.10, 0.04), visorMat);
        visor.position.set(0, 1.71, -0.17);

        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.74, 0.20), darkMat);
        legL.position.set(-0.15, 0.37, 0); legL.castShadow = true;
        const legR = legL.clone(); legR.position.x = 0.15;

        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.58, 0.16), armorMat);
        armL.position.set(-0.37, 1.14, -0.05);
        const armR = armL.clone(); armR.position.x = 0.37;

        g.add(torso, head, visor, legL, legR, armL, armR);

        if (!this.isDummy) {
            const wKind = this.isBoss ? 'lmg' : (this.role === 'heavy' ? 'shotgun' : (this.role === 'phantom' ? 'smg' : 'rifle'));
            const wm = buildWeaponMesh(wKind, 'default', false);
            wm.scale.setScalar(0.65);
            wm.position.set(0.26, 1.08, -0.26);
            g.add(wm);
        }

        // World-space floating HP bar
        const hpBg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.1), new THREE.MeshBasicMaterial({ color: 0x090c10, side: THREE.DoubleSide }));
        hpBg.position.set(0, 2.08, 0);
        const hpFg = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.065), new THREE.MeshBasicMaterial({ color: pal.visor, side: THREE.DoubleSide }));
        hpFg.position.set(0, 2.08, 0.005);
        g.add(hpBg, hpFg);

        g.scale.setScalar(this.scale);
        g.position.copy(this.pos);
        this.scene.add(g);

        this.root = g;
        this.legs = [legL, legR];
        this.hpFg = hpFg;
        this.hpBg = hpBg;
    }

    resetHealth() {
        this.health = this.maxHealth;
        this.alive = true;
        if (this.hpFg) {
            this.hpFg.scale.x = 1;
            this.hpFg.position.x = 0;
        }
    }

    hit(dmg) {
        if (!this.alive) return false;
        this.health = Math.max(0, this.health - dmg);
        const frac = clamp(this.health / this.maxHealth, 0, 1);
        if (this.hpFg) {
            this.hpFg.scale.x = Math.max(0.001, frac);
            this.hpFg.position.x = -(1 - frac) * 0.43;
        }
        if (this.health <= 0) {
            if (this.isDummy) {
                this.resetHealth();
                return false;
            }
            this.alive = false;
            this.deathTimer = 1.6;
            return true;
        }
        return false;
    }

    raycast(origin, dir, maxDist) {
        if (!this.alive) return { hit: false, dist: maxDist };
        const s = this.scale;
        const headCenter = this.pos.clone().add(new THREE.Vector3(0, 1.70 * s, 0));
        const bodyCenter = this.pos.clone().add(new THREE.Vector3(0, 0.98 * s, 0));

        const toH = headCenter.clone().sub(origin);
        const projH = toH.dot(dir);
        if (projH > 0 && projH < maxDist) {
            const perpH = toH.sub(dir.clone().multiplyScalar(projH)).length();
            if (perpH < 0.28 * s) {
                return { hit: true, dist: projH, head: true, point: origin.clone().addScaledVector(dir, projH) };
            }
        }

        const toB = bodyCenter.clone().sub(origin);
        const projB = toB.dot(dir);
        if (projB > 0 && projB < maxDist) {
            const perpB = toB.sub(dir.clone().multiplyScalar(projB)).length();
            if (perpB < 0.45 * s) {
                return { hit: true, dist: projB, head: false, point: origin.clone().addScaledVector(dir, projB) };
            }
        }
        return { hit: false, dist: maxDist };
    }

    update(dt, player, onFire) {
        if (!this.alive) {
            this.deathTimer -= dt;
            this.root.rotation.z = damp(this.root.rotation.z, Math.PI / 2, 8, dt);
            this.root.position.y = damp(this.root.position.y, this.pos.y - 0.5, 5, dt);
            if (this.deathTimer <= 0) {
                this.dispose();
                return true;
            }
            return false;
        }

        if (this.confusedTimer > 0) this.confusedTimer -= dt;

        // Billboard HP bar toward player camera
        if (player && player.camera && this.hpBg && this.hpFg) {
            this.hpBg.lookAt(player.camera.position);
            this.hpFg.lookAt(player.camera.position);
        }

        if (this.role === 'dummy') {
            this.vel.y -= 24 * dt;
            this.onGround = this.world.moveAndSlide(this.pos, this.vel, 0.42 * this.scale, 1.8 * this.scale, dt);
            this.root.position.copy(this.pos);
            return false;
        }

        if (this.role === 'dummy_moving') {
            this.strafeTimer += dt * 1.8;
            const targetX = this.patrolOrigin.x + Math.sin(this.strafeTimer) * 6.5;
            this.vel.x = (targetX - this.pos.x) * 4.5;
            this.vel.z = 0;
            this.vel.y -= 24 * dt;
            this.onGround = this.world.moveAndSlide(this.pos, this.vel, 0.42, 1.8, dt);
            this.root.position.copy(this.pos);
            this.walkPhase += dt * Math.abs(this.vel.x) * 2.5;
            const sw = Math.sin(this.walkPhase) * 0.55;
            if (this.legs[0]) this.legs[0].rotation.x = sw;
            if (this.legs[1]) this.legs[1].rotation.x = -sw;
            return false;
        }

        if (player && player.alive && this.confusedTimer <= 0) {
            const toP = player.pos.clone().sub(this.pos);
            const dist = Math.hypot(toP.x, toP.z);
            const desiredYaw = Math.atan2(-toP.x, -toP.z);
            let diff = desiredYaw - this.yaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.yaw += diff * Math.min(1, dt * 7.5);

            this.strafeTimer -= dt;
            if (this.strafeTimer <= 0) {
                this.strafeTimer = rand(1.1, 2.4);
                this.strafeDir *= -1;
            }

            const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
            const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
            const move = new THREE.Vector3();
            const idealDist = this.isBoss ? 11 : (this.role === 'heavy' ? 8 : 13);
            if (dist > idealDist) move.add(fwd);
            else if (dist < idealDist * 0.55) move.sub(fwd);
            move.addScaledVector(right, this.strafeDir * 0.65);
            if (move.lengthSq() > 0) move.normalize();

            this.vel.x = damp(this.vel.x, move.x * this.speed, 10, dt);
            this.vel.z = damp(this.vel.z, move.z * this.speed, 10, dt);

            this.fireTimer -= dt;
            if (this.fireTimer <= 0 && dist < 44) {
                this.fireTimer = this.fireRate * rand(0.85, 1.3);
                const eyeOrigin = this.pos.clone().add(new THREE.Vector3(0, 1.35 * this.scale, 0));
                const targetPt = player.pos.clone().add(new THREE.Vector3(0, 1.25, 0));
                const shotDir = targetPt.sub(eyeOrigin).normalize();
                const los = this.world.raycast(eyeOrigin, shotDir, dist);
                if (!los.hit || los.dist >= dist - 0.5) {
                    if (onFire) onFire(this, eyeOrigin, shotDir);
                }
            }
        } else {
            this.vel.x = damp(this.vel.x, 0, 8, dt);
            this.vel.z = damp(this.vel.z, 0, 8, dt);
        }

        this.vel.y -= 24 * dt;
        this.onGround = this.world.moveAndSlide(this.pos, this.vel, 0.42 * this.scale, 1.8 * this.scale, dt);
        this.root.position.copy(this.pos);
        this.root.rotation.y = this.yaw;

        const hSpeed = Math.hypot(this.vel.x, this.vel.z);
        if (hSpeed > 0.4 && this.onGround) {
            this.walkPhase += dt * hSpeed * 2.2;
            const sw = Math.sin(this.walkPhase) * 0.55;
            if (this.legs[0]) this.legs[0].rotation.x = sw;
            if (this.legs[1]) this.legs[1].rotation.x = -sw;
        }
        return false;
    }

    dispose() {
        if (!this.root) return;
        this.scene.remove(this.root);
        const geos = new Set(), mats = new Set();
        this.root.traverse(o => {
            if (o.geometry && !geos.has(o.geometry)) { geos.add(o.geometry); o.geometry.dispose(); }
            if (o.material && !mats.has(o.material)) { mats.add(o.material); o.material.dispose(); }
        });
        this.root = null;
    }
}

class UI {
    constructor(game) {
        this.game = game;
        this.els = {
            hud: document.getElementById('hud'),
            crosshair: document.getElementById('crosshair'),
            hitmarker: document.getElementById('hitmarker'),
            damageFlash: document.getElementById('damageFlash'),
            damageArrow: document.getElementById('damageArrow'),
            flashOverlay: document.getElementById('flashOverlay'),
            centerMsg: document.getElementById('centerMsg'),
            cmSub: document.getElementById('cmSub'),
            killFeed: document.getElementById('killFeed'),
            hpVal: document.getElementById('hpVal'),
            hpBar: document.getElementById('hpBar'),
            shieldVal: document.getElementById('shieldVal'),
            shieldBar: document.getElementById('shieldBar'),
            medCount: document.getElementById('medCount'),
            flashCount: document.getElementById('flashCount'),
            wepName: document.getElementById('wepName'),
            magVal: document.getElementById('magVal'),
            resVal: document.getElementById('resVal'),
            reloadMsg: document.getElementById('reloadMsg'),
            waveNum: document.getElementById('waveNum'),
            aliveCount: document.getElementById('aliveCount'),
            killsCount: document.getElementById('killsCount'),
            pointsCount: document.getElementById('pointsCount'),
            skullPop: document.getElementById('skullPop'),
            buffBadges: document.getElementById('buffBadges'),
            abilityHud: document.getElementById('abilityHud'),
            radar: document.getElementById('radar'),
            bossBar: document.getElementById('bossBar'),
            bossFill: document.getElementById('bossFill'),
            bossName: document.getElementById('bossName')
        };
        this._cmTimer = 0;
        this._hmTimer = 0;
        this._dmgTimer = 0;
        this._flashTimer = 0;
        this._skullTimer = 0;
    }

    setInGame(active) {
        if (this.els.hud) this.els.hud.style.display = active ? 'block' : 'none';
    }

    showCenterMsg(title, sub = '', durMs = 1500) {
        if (!this.els.centerMsg) return;
        this.els.centerMsg.textContent = title;
        if (this.els.cmSub) this.els.cmSub.textContent = sub;
        this.els.centerMsg.classList.add('show');
        if (this.els.cmSub) this.els.cmSub.classList.toggle('show', !!sub);
        clearTimeout(this._cmTimer);
        this._cmTimer = setTimeout(() => {
            this.els.centerMsg.classList.remove('show');
            if (this.els.cmSub) this.els.cmSub.classList.remove('show');
        }, durMs);
    }

    showHitmarker(head = false) {
        if (!this.els.hitmarker) return;
        this.els.hitmarker.classList.remove('show', 'head');
        void this.els.hitmarker.offsetWidth;
        this.els.hitmarker.classList.add('show');
        if (head) this.els.hitmarker.classList.add('head');
        clearTimeout(this._hmTimer);
        this._hmTimer = setTimeout(() => this.els.hitmarker.classList.remove('show', 'head'), 180);
    }

    popSkull() {
        if (!this.els.skullPop) return;
        this.els.skullPop.classList.remove('show');
        void this.els.skullPop.offsetWidth;
        this.els.skullPop.classList.add('show');
        clearTimeout(this._skullTimer);
        this._skullTimer = setTimeout(() => this.els.skullPop.classList.remove('show'), 520);
    }

    damageFlash(attackerPos, playerPos, playerYaw) {
        if (this.els.damageFlash) {
            this.els.damageFlash.classList.add('show');
            clearTimeout(this._dmgTimer);
            this._dmgTimer = setTimeout(() => this.els.damageFlash.classList.remove('show'), 220);
        }
        if (attackerPos && playerPos && this.els.damageArrow) {
            const dx = attackerPos.x - playerPos.x;
            const dz = attackerPos.z - playerPos.z;
            const worldAng = Math.atan2(-dx, -dz);
            const relAng = worldAng - playerYaw;
            this.els.damageArrow.style.transform = `translate(-50%, -50%) rotate(${-relAng}rad)`;
            this.els.damageArrow.classList.add('show');
            setTimeout(() => this.els.damageArrow.classList.remove('show'), 450);
        }
    }

    flashbang() {
        if (!this.els.flashOverlay) return;
        this.els.flashOverlay.style.opacity = '1';
        clearTimeout(this._flashTimer);
        this._flashTimer = setTimeout(() => { this.els.flashOverlay.style.opacity = '0'; }, 1600);
    }

    addKillFeed(text, headshot = false) {
        if (!this.els.killFeed) return;
        const item = document.createElement('div');
        item.className = 'kf-item' + (headshot ? ' head' : '');
        item.textContent = headshot ? `${text} [HEADSHOT]` : text;
        this.els.killFeed.appendChild(item);
        while (this.els.killFeed.children.length > 5) {
            this.els.killFeed.removeChild(this.els.killFeed.firstChild);
        }
        setTimeout(() => { if (item.parentNode) item.remove(); }, 4500);
    }

    spawnDamageNum(dmg, head, worldPos, camera = window.game?.camera) {
        if (!camera || !worldPos) return;
        const p = worldPos.clone().project(camera);
        if (p.z > 1) return;
        const x = (p.x * 0.5 + 0.5) * innerWidth + rand(-14, 14);
        const y = (-p.y * 0.5 + 0.5) * innerHeight - 10;
        const el = document.createElement('div');
        el.className = 'dmg-num' + (head ? ' head' : '');
        el.textContent = Math.round(dmg);
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 680);
    }

    updateHealth(player) {
        if (!player) return;
        const hp = Math.ceil(player.health);
        const sh = Math.ceil(player.shield);
        if (this.els.hpVal) this.els.hpVal.textContent = hp;
        if (this.els.hpBar) {
            this.els.hpBar.style.width = `${clamp((player.health / player.maxHealth) * 100, 0, 100)}%`;
            this.els.hpBar.style.background = hp <= 30 ? 'var(--danger)' : 'var(--accent)';
        }
        if (this.els.shieldVal) this.els.shieldVal.textContent = sh;
        if (this.els.shieldBar) this.els.shieldBar.style.width = `${clamp((player.shield / player.maxShield) * 100, 0, 100)}%`;
        if (this.els.medCount) this.els.medCount.textContent = player.medkits;
        if (this.els.flashCount) this.els.flashCount.textContent = player.flashbangs;
    }

    updateWeapon(player) {
        if (!player || !player.currentWeapon) return;
        const w = player.currentWeapon;
        if (this.els.wepName) {
            this.els.wepName.textContent = player.sukunaTimer > 0 ? 'RYOMEN SUKUNA // DISMANTLE' : w.name;
        }
        if (this.els.magVal) {
            this.els.magVal.textContent = (w.melee || player.sukunaTimer > 0) ? '∞' : w.mag;
        }
        if (this.els.resVal) {
            this.els.resVal.textContent = (w.melee || player.sukunaTimer > 0) ? '∞' : (this.game.mode === 'training' ? '∞' : w.reserve);
        }
        if (this.els.reloadMsg) {
            this.els.reloadMsg.classList.toggle('show', w.reloading > 0);
        }
        for (let i = 0; i < 4; i++) {
            const slotEl = document.getElementById(`slot${i}`);
            if (slotEl) {
                slotEl.classList.toggle('active', player.currentSlot === i);
                const nameSpan = slotEl.querySelector('.s-name');
                if (nameSpan && player.weapons[i]) nameSpan.textContent = player.weapons[i].name.split(' ')[0];
            }
        }
    }

    updateTopStats(game) {
        if (this.els.waveNum) {
            if (game.mode === 'training') this.els.waveNum.textContent = 'TRN';
            else if (game.isMultiplayer) this.els.waveNum.textContent = game.mode.toUpperCase();
            else this.els.waveNum.textContent = String(game.wave).padStart(2, '0');
        }
        if (this.els.aliveCount) {
            const aliveBots = game.bots.filter(b => b.alive && !b.isDummy).length;
            this.els.aliveCount.textContent = game.isMultiplayer ? Object.keys(game.network.players).length : aliveBots;
        }
        if (this.els.killsCount) this.els.killsCount.textContent = game.kills;
        if (this.els.pointsCount) this.els.pointsCount.textContent = SaveSystem.data.points;
    }

    updateBuffs(abilitySystem, player, game) {
        if (this.els.buffBadges) {
            const badges = [];
            if (abilitySystem) {
                for (const id in abilitySystem.active) {
                    const sec = Math.ceil(abilitySystem.active[id]);
                    if (sec > 0) badges.push(`<div class="buff-badge">${id.toUpperCase()} ${sec}S</div>`);
                }
            }
            if (player && player.sukunaTimer > 0) {
                badges.push(`<div class="buff-badge" style="border-color:#ff1e38;color:#ff1e38">SUKUNA ${Math.ceil(player.sukunaTimer)}S</div>`);
            }
            if (game && game.overdriveTimer > 0) {
                badges.push(`<div class="buff-badge" style="border-color:#00ffff;color:#00ffff">OVERDRIVE ${Math.ceil(game.overdriveTimer)}S</div>`);
            }
            if (game && game.streakRewards) {
                if (game.streakRewards.stim) badges.push(`<div class="buff-badge" style="border-color:#3fe08a;color:#3fe08a">[Z] STIM READY</div>`);
                if (game.streakRewards.orbital) badges.push(`<div class="buff-badge" style="border-color:#ffaa00;color:#ffaa00">[X] ORBITAL READY</div>`);
                if (game.streakRewards.sukuna) badges.push(`<div class="buff-badge" style="border-color:#ff1e38;color:#ff1e38">[V] SUKUNA READY</div>`);
            }
            this.els.buffBadges.innerHTML = badges.join('');
        }
        if (this.els.abilityHud && abilitySystem) {
            if (abilitySystem.has('teleport')) this.els.abilityHud.textContent = '[F] BLINK TELEPORT READY';
            else if (abilitySystem.has('telekinesis')) this.els.abilityHud.textContent = '[F] TELEKINESIS SLAM READY';
            else if (player && player.sukunaTimer > 0) this.els.abilityHud.textContent = '[E] DOMAIN EXPANSION · [Q] FUGA';
            else this.els.abilityHud.textContent = '';
        }
    }

    updateRadarAndBoss(game) {
        const boss = game.bots.find(b => b.alive && b.isBoss);
        if (this.els.bossBar) {
            if (boss) {
                this.els.bossBar.classList.add('show');
                if (this.els.bossName) this.els.bossName.textContent = 'OMEGA WARDEN // TITAN';
                if (this.els.bossFill) this.els.bossFill.style.width = `${clamp((boss.health / boss.maxHealth) * 100, 0, 100)}%`;
            } else {
                this.els.bossBar.classList.remove('show');
            }
        }

        const canvas = this.els.radar;
        if (!canvas || !game.player) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2, r = w / 2 - 4;
        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(10, 14, 20, 0.78)';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const p = game.player;
        const scale = r / 38;
        const cosY = Math.cos(-p.yaw), sinY = Math.sin(-p.yaw);

        const plotDot = (wx, wz, color, size = 3.2) => {
            const dx = wx - p.pos.x;
            const dz = wz - p.pos.z;
            const rx = (dx * cosY - dz * sinY) * scale;
            const rz = (dx * sinY + dz * cosY) * scale;
            const d = Math.hypot(rx, rz);
            const clampScale = d > r - 5 ? (r - 5) / d : 1;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx + rx * clampScale, cy + rz * clampScale, size, 0, Math.PI * 2);
            ctx.fill();
        };

        for (const b of game.bots) {
            if (!b.alive) continue;
            plotDot(b.pos.x, b.pos.z, b.isBoss ? '#ffaa00' : (b.isDummy ? '#3fe08a' : '#ff3b3b'), b.isBoss ? 5 : 3);
        }
        if (game.isMultiplayer && game.network) {
            for (const id in game.network.players) {
                if (id === game.network.myId) continue;
                const s = game.network.players[id].state;
                if (s && s.pos && s.alive !== false) plotDot(s.pos[0], s.pos[2], '#ff3b3b', 3.5);
            }
        }

        // Player center arrow
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 5);
        ctx.lineTo(cx - 3.5, cy + 4);
        ctx.lineTo(cx + 3.5, cy + 4);
        ctx.closePath();
        ctx.fill();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('c');
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(innerWidth, innerHeight);
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(SaveSystem.data.settings.fov || 90, innerWidth / innerHeight, 0.1, 400);
        this.scene.add(this.camera);

        this.input = new Input(this.canvas);
        this.ui = new UI(this);
        this.network = new NetworkManager(this);

        this.state = 'MENU';
        this.running = true;
        this.paused = false;
        this.mode = 'wave';
        this.selectedMap = 'blacksite';
        this.isMultiplayer = false;
        this.wave = 1;
        this.kills = 0;
        this.pointsEarned = 0;
        this.waveCooldown = 0;
        this.respawnTimer = 0;
        this.shake = 0;

        this.killStreak = 0;
        this.multiKillCount = 0;
        this.multiKillTimer = 0;
        this.overdriveTimer = 0;
        this.streakRewards = { stim: false, orbital: false, sukuna: false };

        this.world = null;
        this.effects = null;
        this.abilitySystem = null;
        this.player = null;
        this.bots = [];
        this.remoteMeshes = {};
        this._remoteDeathState = {};
        this.medkitDrops = [];
        this.flashbangs = [];
        this.targets = [];

        this.domainActive = false;
        this.domainOwner = false;
        this.domainTimer = 0;
        this.domainTickTimer = 0;
        this.domainCenter = new THREE.Vector3();
        this.domainGroup = null;

        this.clash = { active: false, oppId: null, timer: 0, myScore: 0, oppScore: 0 };

        this.menuChar = buildMenuCharacter(this.scene);
        this._setupMenuLights();
        this._setupEvents();
        this._populateUI();
        music.playMenu();

        this._lastTime = performance.now();
        requestAnimationFrame((t) => this._loop(t));
    }

    _setupMenuLights() {
        this._clearSceneLights();
        this.scene.background = new THREE.Color(0x0b0f17);
        this.scene.fog = new THREE.FogExp2(0x0b0f17, 0.045);
        this.scene.add(new THREE.AmbientLight(0x607898, 1.4));
        const key = new THREE.DirectionalLight(0xfff0dc, 2.4);
        key.position.set(3, 5, 4);
        key.castShadow = true;
        this.scene.add(key);
        const rim = new THREE.DirectionalLight(new THREE.Color(SaveSystem.data.settings.uiColor || '#ff7a1a'), 1.8);
        rim.position.set(-3, 3, -3);
        this.scene.add(rim);
        this.camera.position.set(0, 1.35, 3.1);
        this.camera.lookAt(0, 1.15, 0);
    }

    _clearSceneLights() {
        const toRemove = [];
        this.scene.traverse(o => { if (o.isLight && o.parent === this.scene) toRemove.push(o); });
        toRemove.forEach(l => this.scene.remove(l));
    }

    isCoop() {
        return this.isMultiplayer && this.mode === 'COOP';
    }

    addShake(amt) {
        this.shake = Math.min(0.6, this.shake + amt);
    }

    _setupEvents() {
        addEventListener('resize', () => {
            this.camera.aspect = innerWidth / innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(innerWidth, innerHeight);
        });

        this.input.onLockChange = (locked) => {
            if (this.state === 'PLAYING' && !locked && !this.paused && !this.clash.active) {
                this._pause();
            }
        };

        this.input.onTab = (down) => {
            const lb = document.getElementById('leaderboard');
            if (!lb) return;
            if (down && this.state === 'PLAYING' && this.isMultiplayer) {
                this.network.updateLeaderboard();
                lb.classList.add('show');
            } else {
                lb.classList.remove('show');
            }
        };

        addEventListener('keydown', (e) => {
            if (document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            if (this.clash && this.clash.active && e.code === 'Space') {
                e.preventDefault();
                this.clash.myScore++;
                this._updateClashUI();
                if (this.isMultiplayer && this.network) {
                    this.network.broadcast({ type: 'CLASH_SCORE', id: this.network.myId, score: this.clash.myScore });
                }
                return;
            }

            if (this.state !== 'PLAYING' || this.paused) return;

            if (e.code === 'KeyB') {
                if (this.mode === 'training') this.spawnTrainingDummy(e.shiftKey);
            } else if (e.code === 'KeyN') {
                if (this.mode === 'training') this.spawnTrainingDummy(true);
            } else if (e.code === 'KeyM') {
                if (this.mode === 'training') this.clearTrainingDummies();
            } else if (e.code === 'KeyT') {
                if (this.mode === 'training' && this.world) {
                    const sp = this.world.getSafeSpawnPoint(null);
                    this.bots.push(new Bot(this.scene, this.world, this.effects, sp, 5, 'boss'));
                    this.ui.showCenterMsg('TITAN BOSS SPAWNED', 'OMEGA WARDEN DEPLOYED', 1400);
                }
            } else if (e.code === 'KeyH') {
                if (this.mode === 'training' && this.player) {
                    this.player.health = this.player.maxHealth;
                    this.player.shield = this.player.maxShield;
                    this.player.medkits = this.player.maxMedkits;
                    this.player.flashbangs = this.player.maxFlashbangs;
                    this.resetTrainingDummies();
                    audio.medkit();
                    this.ui.showCenterMsg('VITALS & DUMMIES RESET', '', 900);
                }
            } else if (e.code === 'KeyV') {
                if (this.mode === 'training' && this.player) {
                    if (this.player.sukunaTimer > 0) this.player.deactivateSukuna(this);
                    else this.player.activateSukuna(this);
                } else if (this.streakRewards.sukuna && this.player) {
                    this.streakRewards.sukuna = false;
                    this.player.activateSukuna(this);
                }
            } else if (e.code === 'KeyZ') {
                if (this.streakRewards.stim && this.player) {
                    this.streakRewards.stim = false;
                    this.overdriveTimer = 10;
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + 45);
                    audio.pickup();
                    this.ui.showCenterMsg('OVERDRIVE STIM', 'INFINITE MAG · +35% SPEED · +45 HP', 1600);
                }
            } else if (e.code === 'KeyX') {
                if (this.streakRewards.orbital && this.player) {
                    this.streakRewards.orbital = false;
                    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                    const hit = this.world.raycast(this.camera.position, dir, 80);
                    const strikePos = hit.hit ? hit.point : this.player.pos.clone().addScaledVector(dir, 18);
                    this.effects.explosion(strikePos, 0xffaa00);
                    audio.explosion(strikePos);
                    this._onRocketHit(strikePos, { splashDamage: 240, splashRadius: 12 }, 'player');
                    this.ui.showCenterMsg('ORBITAL STRIKE', 'TACTICAL BARRAGE IMPACT', 1500);
                }
            }
        });

        // Menu & Panel Navigation
        const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', () => { audio.init(); audio.ui(); fn(); }); };
        const showPanel = (id) => {
            document.querySelectorAll('.overlay-panel').forEach(p => p.classList.add('hidden'));
            if (id) document.getElementById(id)?.classList.remove('hidden');
        };

        bind('btnSolo', () => { this.isMultiplayer = false; this._startGame('wave', this.selectedMap, false); });
        bind('btnTraining', () => { this.isMultiplayer = false; this._startGame('training', this.selectedMap, false); });
        bind('btnMulti', () => { showPanel('mpPanel'); this.network.refreshPublicServers(); });
        bind('btnLoadout', () => { this._renderLoadoutPanel(); showPanel('loadoutPanel'); });
        bind('btnShop', () => { this._renderShopPanel(); showPanel('shopPanel'); });
        bind('btnMaps', () => { this._renderMapsPanel(); showPanel('mapsPanel'); });
        bind('btnSettings', () => { this._syncSettingsUI(); showPanel('settingsPanel'); });

        document.querySelectorAll('.btn-close-panel').forEach(btn => {
            btn.addEventListener('click', () => { audio.ui(); showPanel(null); });
        });

        // Training banner controls
        bind('btnTrainSpawn', () => this.spawnTrainingDummy(false));
        bind('btnTrainMoving', () => this.spawnTrainingDummy(true));
        bind('btnTrainReset', () => this.resetTrainingDummies());
        bind('btnTrainClear', () => this.clearTrainingDummies());

        // Pause & Game Over controls
        bind('btnResume', () => this._resume());
        bind('btnRestart', () => this._startGame(this.mode, this.selectedMap, this.isMultiplayer));
        bind('btnQuit', () => this._quitToMenu());
        bind('btnRetry', () => this._startGame(this.mode, this.selectedMap, this.isMultiplayer));
        bind('btnOverMenu', () => this._quitToMenu());

        // Multiplayer controls
        bind('btnHostPriv', () => { this.isMultiplayer = true; showPanel(null); this.network.host(parseInt(document.getElementById('hostMax')?.value || '4', 10), false); });
        bind('btnHostPub', () => { this.isMultiplayer = true; showPanel(null); this.network.host(parseInt(document.getElementById('hostMax')?.value || '4', 10), true); });
        bind('btnJoinCode', () => {
            const code = (document.getElementById('joinCodeInput')?.value || '').trim().toUpperCase();
            if (!code) { alert('Enter a room code.'); return; }
            this.isMultiplayer = true; showPanel(null); this.network.join(code);
        });
        bind('btnRefreshServers', () => this.network.refreshPublicServers());
        bind('btnStartMatch', () => this.network.startMatch());
        bind('btnLeaveLobby', () => { document.getElementById('waitingLobby')?.classList.remove('show'); this.network.disconnect(); });

        // Settings bindings
        const bindRange = (id, key, valId, suffix = '', onChange = null) => {
            const el = document.getElementById(id);
            const vEl = document.getElementById(valId);
            if (!el) return;
            el.addEventListener('input', () => {
                const v = parseFloat(el.value);
                SaveSystem.data.settings[key] = v;
                if (vEl) vEl.textContent = v + suffix;
                if (onChange) onChange(v);
                SaveSystem.save();
            });
        };
        bindRange('setVol', 'volume', 'setVolVal', '', v => audio.setVolume(v));
        bindRange('setMusic', 'musicVolume', 'setMusicVal', '', v => audio.setMusicVolume(v));
        bindRange('setFov', 'fov', 'setFovVal', '°', v => { this.camera.fov = v; this.camera.updateProjectionMatrix(); });
        bindRange('setSens', 'sensitivity', 'setSensVal', 'x');
        bindRange('setScopeSens', 'scopeSensitivity', 'setScopeSensVal', 'x');

        const invEl = document.getElementById('setInvert');
        if (invEl) invEl.addEventListener('change', () => { SaveSystem.data.settings.invertY = invEl.checked; SaveSystem.save(); });

        const nameEl = document.getElementById('setPlayerName');
        if (nameEl) nameEl.addEventListener('change', () => {
            const clean = nameEl.value.trim().slice(0, 16) || 'OPERATOR';
            SaveSystem.data.playerName = clean;
            this.network.myName = clean;
            SaveSystem.save();
        });

        bind('btnResetSave', () => SaveSystem.reset());
    }

    _syncSettingsUI() {
        const s = SaveSystem.data.settings;
        const set = (id, val, txtId, suf = '') => {
            const el = document.getElementById(id);
            if (el) el.value = val;
            const t = document.getElementById(txtId);
            if (t) t.textContent = val + suf;
        };
        set('setVol', s.volume, 'setVolVal');
        set('setMusic', s.musicVolume, 'setMusicVal');
        set('setFov', s.fov, 'setFovVal', '°');
        set('setSens', s.sensitivity, 'setSensVal', 'x');
        set('setScopeSens', s.scopeSensitivity, 'setScopeSensVal', 'x');
        const invEl = document.getElementById('setInvert');
        if (invEl) invEl.checked = !!s.invertY;
        const nameEl = document.getElementById('setPlayerName');
        if (nameEl) nameEl.value = SaveSystem.data.playerName;
    }

    _populateUI() {
        this._syncSettingsUI();
        const ptsEl = document.getElementById('menuPoints');
        if (ptsEl) ptsEl.textContent = SaveSystem.data.points;
    }

    _renderLoadoutPanel() {
        const grid = document.getElementById('loadoutGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const eq = SaveSystem.data.equippedLoadout;
        Object.keys(WEAPON_DEFS).forEach(kind => {
            if (kind === 'dismantle' || kind === 'cleave') return;
            const def = WEAPON_DEFS[kind];
            const unlocked = SaveSystem.data.unlockedWeapons.includes(kind);
            const slotIdx = eq.indexOf(kind);
            const card = document.createElement('div');
            card.className = 'card-item' + (slotIdx >= 0 ? ' equipped' : '') + (!unlocked ? ' locked' : '');
            card.innerHTML = `<div class="c-title">${def.name}</div><div class="c-sub">${unlocked ? (slotIdx >= 0 ? `EQUIPPED [SLOT ${slotIdx + 1}]` : 'CLICK TO EQUIP') : `LOCKED (${def.price} PTS)`}</div>`;
            if (unlocked) {
                card.addEventListener('click', () => {
                    audio.ui();
                    if (slotIdx < 0) {
                        const targetSlot = def.melee ? 3 : 0;
                        eq[targetSlot] = kind;
                        SaveSystem.save();
                        this._renderLoadoutPanel();
                        this._rebuildMenuCharacter();
                    }
                });
            }
            grid.appendChild(card);
        });
    }

    _renderShopPanel() {
        const ptsEl = document.getElementById('shopPoints');
        if (ptsEl) ptsEl.textContent = SaveSystem.data.points;
        const grid = document.getElementById('shopGrid');
        if (!grid) return;
        grid.innerHTML = '';
        Object.keys(WEAPON_DEFS).forEach(kind => {
            if (kind === 'dismantle' || kind === 'cleave') return;
            const def = WEAPON_DEFS[kind];
            if (def.price <= 0) return;
            const owned = SaveSystem.data.unlockedWeapons.includes(kind);
            const card = document.createElement('div');
            card.className = 'card-item' + (owned ? ' equipped' : '');
            card.innerHTML = `<div class="c-title">${def.name}</div><div class="c-sub">${owned ? 'OWNED' : `${def.price} PTS`}</div>`;
            if (!owned) {
                card.addEventListener('click', () => {
                    if (SaveSystem.data.points >= def.price) {
                        SaveSystem.data.points -= def.price;
                        SaveSystem.data.unlockedWeapons.push(kind);
                        SaveSystem.data.unlockedCamos.push(kind + ':default');
                        SaveSystem.data.equippedCamos[kind] = 'default';
                        SaveSystem.save();
                        audio.pickup();
                        this._renderShopPanel();
                        this._populateUI();
                    } else {
                        audio.empty();
                    }
                });
            }
            grid.appendChild(card);
        });
    }

    _renderMapsPanel() {
        const grid = document.getElementById('mapsGrid');
        if (!grid) return;
        const maps = [
            { id: 'blacksite', name: 'BLACKSITE CITADEL', desc: 'Multi-tier tactical compound with central bridge & ramps.' },
            { id: 'foundry', name: 'SMELTER FOUNDRY', desc: 'Molten channels, thermal updrafts & industrial catwalks.' },
            { id: 'abyss', name: 'VOID ABYSS', desc: 'Suspended platforms, glass bridges & grav-launchers.' },
            { id: 'void', name: 'OBELISK SANCTUM', desc: 'Stepped obsidian pyramid surrounded by floating islands.' },
            { id: 'zenith', name: 'ZENITH SPIRE', desc: 'High-altitude sky-deck with corner sniper towers.' }
        ];
        grid.innerHTML = '';
        maps.forEach(m => {
            const card = document.createElement('div');
            card.className = 'card-item' + (this.selectedMap === m.id ? ' equipped' : '');
            card.innerHTML = `<div class="c-title">${m.name}</div><div class="c-sub">${m.desc}</div>`;
            card.addEventListener('click', () => {
                audio.ui();
                this.selectedMap = m.id;
                this._renderMapsPanel();
            });
            grid.appendChild(card);
        });
    }

    _rebuildMenuCharacter() {
        if (this.menuChar) {
            this.scene.remove(this.menuChar);
            this.menuChar.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
            this.menuChar = null;
        }
        if (this.state === 'MENU') this.menuChar = buildMenuCharacter(this.scene);
    }

    _cleanupMatch() {
        window.cleanupAllStandaloneVfx();
        this.endDomain();
        for (const b of this.bots) b.dispose();
        this.bots = [];
        for (const id in this.remoteMeshes) {
            this.scene.remove(this.remoteMeshes[id]);
            this.remoteMeshes[id].traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
        }
        this.remoteMeshes = {};
        this._remoteDeathState = {};
        for (const mk of this.medkitDrops) {
            this.scene.remove(mk.g);
            mk.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
        }
        this.medkitDrops = [];
        for (const fb of this.flashbangs) {
            this.scene.remove(fb.m);
            fb.m.geometry.dispose(); fb.m.material.dispose();
        }
        this.flashbangs = [];
        for (const tg of this.targets) {
            this.scene.remove(tg.mesh);
            tg.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
        }
        this.targets = [];
        if (this.effects) { this.effects.clear(); this.effects = null; }
        if (this.abilitySystem) { this.abilitySystem.clear(); this.abilitySystem = null; }
        if (this.player && this.player.weaponHolder) {
            this.camera.remove(this.player.weaponHolder);
            this.player = null;
        }
        if (this.world) { this.world.dispose(); this.world = null; }
    }

    _startGame(mode, mapId, isMultiplayer = false) {
        audio.init();
        this._cleanupMatch();
        if (this.menuChar) {
            this.scene.remove(this.menuChar);
            this.menuChar.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
            this.menuChar = null;
        }
        this._clearSceneLights();

        this.mode = mode || 'wave';
        this.selectedMap = mapId || this.selectedMap || 'blacksite';
        this.isMultiplayer = isMultiplayer;
        this.state = 'PLAYING';
        this.paused = false;
        this.wave = 1;
        this.kills = 0;
        this.pointsEarned = 0;
        this.waveCooldown = 0;
        this.respawnTimer = 0;
        this.killStreak = 0;
        this.multiKillCount = 0;
        this.multiKillTimer = 0;
        this.overdriveTimer = 0;
        this.streakRewards = { stim: false, orbital: false, sukuna: false };

        document.getElementById('menu')?.classList.add('hidden');
        document.getElementById('pausePanel')?.classList.remove('show');
        document.getElementById('overPanel')?.classList.remove('show');
        document.querySelectorAll('.overlay-panel').forEach(p => p.classList.add('hidden'));

        const banner = document.getElementById('trainingBanner');
        if (banner) banner.classList.toggle('show', this.mode === 'training');

        this.world = new World(this.scene, this.selectedMap);
        this.effects = new EffectsSystem(this.scene);
        this.abilitySystem = new AbilitySystem(this.scene, this.world, this.effects, this.ui, this);
        this.player = new Player(this.camera, this.scene, this.input, this.world, this.effects, this.abilitySystem);

        const spawnPt = this.world.getSafeSpawnPoint(this.isMultiplayer ? this.network : null);
        this.player.reset(spawnPt);

        this.ui.setInGame(true);
        this.input.lock();

        if (this.mode === 'training') {
            music.playTraining();
            this.spawnTrainingDummy(false);
            this.spawnTrainingDummy(false);
            this.spawnTrainingDummy(true);
            this.ui.showCenterMsg('TRAINING GROUNDS', 'UNLIMITED AMMO · [B] DUMMY · [N] MOVING · [T] BOSS · [V] SUKUNA', 2600);
        } else if (this.isMultiplayer) {
            music.playPVP();
            if (this.mode === 'COOP') this._spawnWave(1);
            this.ui.showCenterMsg(this.mode.toUpperCase() + ' MATCH LIVE', 'ELIMINATE HOSTILES', 1800);
        } else {
            if (this.selectedMap === 'foundry') music.playFoundry();
            else if (this.selectedMap === 'abyss') music.playAbyss();
            else music.playWave();
            this._spawnWave(1);
        }
    }

    _pause() {
        if (this.state !== 'PLAYING') return;
        this.paused = true;
        this.input.unlock();
        document.getElementById('pausePanel')?.classList.add('show');
    }

    _resume() {
        if (this.state !== 'PLAYING') return;
        this.paused = false;
        document.getElementById('pausePanel')?.classList.remove('show');
        this.input.lock();
    }

    _quitToMenu() {
        this._cleanupMatch();
        if (this.isMultiplayer) this.network.disconnect();
        this.isMultiplayer = false;
        this.paused = false;
        this.state = 'MENU';
        this.input.unlock();

        this.ui.setInGame(false);
        document.getElementById('pausePanel')?.classList.remove('show');
        document.getElementById('overPanel')?.classList.remove('show');
        document.getElementById('trainingBanner')?.classList.remove('show');
        document.getElementById('waitingLobby')?.classList.remove('show');
        document.getElementById('scope')?.classList.remove('show');
        document.getElementById('clashOverlay')?.classList.remove('show');
        document.getElementById('menu')?.classList.remove('hidden');

        this._setupMenuLights();
        this.menuChar = buildMenuCharacter(this.scene);
        this._populateUI();
        music.playMenu();
    }

    _spawnWave(w) {
        this.wave = w;
        const isBossWave = (w % 5 === 0);
        const count = isBossWave ? (2 + Math.floor(w * 0.8)) : (3 + w * 2);
        for (let i = 0; i < count; i++) {
            const sp = this.world.botSpawns[i % this.world.botSpawns.length].clone();
            sp.x += rand(-2.5, 2.5); sp.z += rand(-2.5, 2.5);
            let role = 'grunt';
            if (w >= 2 && i % 4 === 3) role = 'heavy';
            else if (w >= 3 && i % 3 === 2) role = 'phantom';
            this.bots.push(new Bot(this.scene, this.world, this.effects, sp, w, role));
        }
        if (isBossWave) {
            const bsp = this.world.botSpawns[0].clone();
            this.bots.push(new Bot(this.scene, this.world, this.effects, bsp, w, 'boss'));
            this.ui.showCenterMsg(`WAVE ${String(w).padStart(2, '0')} · TITAN BOSS`, 'OMEGA WARDEN DEPLOYED', 2400);
        } else {
            this.ui.showCenterMsg(`WAVE ${String(w).padStart(2, '0')}`, `${count} HOSTILES INBOUND`, 1800);
        }
        audio.waveStart();
    }

    spawnTrainingDummy(moving = false) {
        if (!this.world) return;
        const sp = this.world.getSafeSpawnPoint(null);
        sp.x += rand(-3, 3);
        sp.z += rand(-3, 3);
        this.bots.push(new Bot(this.scene, this.world, this.effects, sp, 1, moving ? 'dummy_moving' : 'dummy'));
    }

    resetTrainingDummies() {
        for (const b of this.bots) {
            if (b.isDummy) b.resetHealth();
        }
    }

    clearTrainingDummies() {
        for (let i = this.bots.length - 1; i >= 0; i--) {
            if (this.bots[i].isDummy) {
                this.bots[i].dispose();
                this.bots.splice(i, 1);
            }
        }
    }

    damageBot(bot, dmg, isHead = false, hitPoint = null, isMelee = false) {
        if (!bot || !bot.alive) return;
        this.ui.showHitmarker(isHead);
        if (hitPoint) this.ui.spawnDamageNum(dmg, isHead, hitPoint, this.camera);
        audio.hit(isHead);

        const killed = bot.hit(dmg);
        if (killed) {
            this.kills++;
            const pts = (bot.isBoss ? 500 : 100) + (isHead ? 25 : 0);
            this.pointsEarned += pts;
            SaveSystem.data.points += pts;

            const curW = this.player && this.player.currentWeapon;
            if (curW && WEAPON_CHALLENGES[curW.kind]) {
                const prev = SaveSystem.data.challenges[curW.kind] || 0;
                const next = prev + 1;
                SaveSystem.data.challenges[curW.kind] = next;
                const goal = WEAPON_CHALLENGES[curW.kind];
                if (prev < goal && next >= goal) {
                    SaveSystem.data.points += 1000;
                    this.pointsEarned += 1000;
                    this.ui.showCenterMsg(`${curW.name} MASTERED!`, '+1000 PTS MASTERY REWARD', 2200);
                }
            }
            SaveSystem.save();

            this.ui.popSkull();
            this.ui.addKillFeed(`YOU ✕ ${bot.role.toUpperCase()}`, isHead);
            audio.kill();
            if (Math.random() < 0.45 || bot.isBoss) this.spawnMedkitDrop(bot.pos.clone());
            this._registerKillStreak(bot.pos);
        }
    }

    _onBotFire(bot, origin, dir) {
        const spread = bot.isBoss ? 0.04 : 0.065;
        const d = dir.clone().add(new THREE.Vector3(rand(-spread, spread), rand(-spread, spread), rand(-spread, spread))).normalize();
        const endPt = origin.clone().addScaledVector(d, 44);
        this.effects.tracer(origin, endPt, bot.isBoss ? 0xff2244 : 0xff9933);
        audio.shoot(bot.isBoss ? 'lmg' : 'rifle', origin);

        if (this.player && this.player.alive) {
            const pCenter = this.player.pos.clone().add(new THREE.Vector3(0, 1.1, 0));
            const toP = pCenter.clone().sub(origin);
            const proj = toP.dot(d);
            if (proj > 0 && proj < 44 && toP.sub(d.clone().multiplyScalar(proj)).length() < 0.55) {
                this.player.onHit(bot.damage, false, bot.pos);
            }
        }
    }

    _onRocketHit(hitPos, weaponDef, owner) {
        const radius = (weaponDef && weaponDef.splashRadius) || 5.5;
        const maxDmg = (weaponDef && weaponDef.splashDamage) || 75;

        for (const b of this.bots) {
            if (!b.alive) continue;
            const d = b.pos.clone().add(new THREE.Vector3(0, 1.0, 0)).distanceTo(hitPos);
            if (d <= radius) {
                const falloff = 1 - (d / radius) * 0.65;
                this.damageBot(b, Math.round(maxDmg * falloff), false, b.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), false);
            }
        }

        if (this.isMultiplayer && !this.isCoop() && this.network && owner === 'player') {
            for (const id in this.network.players) {
                if (id === this.network.myId) continue;
                const s = this.network.players[id].state;
                if (!s || s.alive === false || !s.pos) continue;
                const rPos = new THREE.Vector3(...s.pos).add(new THREE.Vector3(0, 1.0, 0));
                const d = rPos.distanceTo(hitPos);
                if (d <= radius) {
                    const dmg = Math.round(maxDmg * (1 - (d / radius) * 0.65));
                    this.network.broadcast({
                        type: 'HIT', targetId: id, damage: dmg,
                        attackerId: this.network.myId, attackerName: this.network.myName, isMelee: false
                    });
                    this.ui.showHitmarker(false);
                    this.ui.spawnDamageNum(dmg, false, rPos, this.camera);
                }
            }
        }

        if (this.player && this.player.alive) {
            const pPos = this.player.pos.clone().add(new THREE.Vector3(0, 0.9, 0));
            const d = pPos.distanceTo(hitPos);
            if (d <= radius) {
                const factor = 1 - (d / radius);
                const push = pPos.sub(hitPos).normalize().multiplyScalar(14 * factor);
                this.player.vel.add(push);
                this.player.vel.y = Math.max(this.player.vel.y, 11 * factor);
                this.player.onGround = false;
                if (!(weaponDef && weaponDef.isFuga && owner === 'player')) {
                    this.player.onHit(Math.round(maxDmg * 0.35 * factor), false, hitPos);
                }
            }
        }
    }

    onPlayerDied() {
        if (this.player && this.player.sukunaTimer > 0) this.player.deactivateSukuna(this);
        if (this.mode === 'training') {
            this.ui.showCenterMsg('RESPAWNING...', '', 900);
            const sp = this.world.getSafeSpawnPoint(null);
            this.player.reset(sp);
            this.player.health = this.player.maxHealth;
            this.player.alive = true;
            return;
        }
        if (this.isMultiplayer) {
            this.respawnTimer = 3.0;
            this.ui.showCenterMsg('ELIMINATED', 'RESPAWNING IN 3 SECONDS...', 2800);
            if (this.network) {
                this.network.broadcast({
                    type: 'KILL',
                    killerId: this.lastAttacker || 'unknown',
                    killerName: this.lastAttackerName || 'HOSTILE',
                    victimId: this.network.myId,
                    victimName: this.network.myName,
                    headshot: !!this.lastHitHeadshot,
                    deathPos: [this.player.pos.x, this.player.pos.y, this.player.pos.z]
                });
            }
            return;
        }

        this.state = 'OVER';
        this.input.unlock();
        this.ui.setInGame(false);
        document.getElementById('scope')?.classList.remove('show');
        const over = document.getElementById('overPanel');
        if (over) {
            document.getElementById('overWave').textContent = this.wave;
            document.getElementById('overKills').textContent = this.kills;
            document.getElementById('overPts').textContent = '+' + this.pointsEarned;
            over.classList.add('show');
        }
        music.playMenu();
    }

    spawnMedkitDrop(pos) {
        const g = new THREE.Group();
        g.position.set(pos.x, Math.max(0.35, pos.y + 0.35), pos.z);
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(0.45, 0.25, 0.35),
            new THREE.MeshBasicMaterial({ color: 0x162b22 })
        );
        const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.27, 0.08), new THREE.MeshBasicMaterial({ color: 0x3fe08a }));
        const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.27, 0.24), new THREE.MeshBasicMaterial({ color: 0x3fe08a }));
        g.add(box, cross1, cross2);
        this.scene.add(g);
        this.medkitDrops.push({ g, life: 25 });
    }

    spawnFlashbang(pos, vel, isPlayer = true) {
        const m = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        m.position.copy(pos);
        this.scene.add(m);
        this.flashbangs.push({ m, pos: pos.clone(), vel: vel.clone(), timer: 1.5, isPlayer });
    }

    _updateMedkitsAndFlashbangs(dt) {
        for (let i = this.medkitDrops.length - 1; i >= 0; i--) {
            const mk = this.medkitDrops[i];
            mk.life -= dt;
            mk.g.rotation.y += dt * 2.4;
            if (this.player && this.player.alive && this.player.pos.distanceTo(mk.g.position) < 1.6) {
                if (this.player.health < this.player.maxHealth) {
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
                } else if (this.player.medkits < this.player.maxMedkits) {
                    this.player.medkits++;
                }
                audio.pickup();
                mk.life = 0;
            }
            if (mk.life <= 0) {
                this.scene.remove(mk.g);
                mk.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
                this.medkitDrops.splice(i, 1);
            }
        }

        for (let i = this.flashbangs.length - 1; i >= 0; i--) {
            const fb = this.flashbangs[i];
            fb.timer -= dt;
            fb.vel.y -= 22 * dt;
            const grounded = this.world.moveAndSlide(fb.pos, fb.vel, 0.1, 0.18, dt);
            if (grounded) {
                fb.vel.x *= 0.6;
                fb.vel.z *= 0.6;
            }
            fb.m.position.copy(fb.pos);
            fb.m.rotation.x += dt * 8;
            if (fb.timer <= 0) {
                this.effects.explosion(fb.pos, 0xffffff);
                audio.flashbang();
                for (const b of this.bots) {
                    if (b.alive && b.pos.distanceTo(fb.pos) < 16) b.confusedTimer = 3.5;
                }
                if (this.isMultiplayer && this.network && fb.isPlayer) {
                    this.network.broadcast({ type: 'FLASH', pos: [fb.pos.x, fb.pos.y, fb.pos.z] });
                }
                this.scene.remove(fb.m);
                fb.m.geometry.dispose(); fb.m.material.dispose();
                this.flashbangs.splice(i, 1);
            }
        }
    }

    _registerKillStreak(pos) {
        this.killStreak++;
        this.multiKillCount++;
        this.multiKillTimer = 3.5;
        if (this.multiKillCount >= 2) {
            const labels = ['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'QUADRA KILL', 'UNSTOPPABLE'];
            const label = labels[Math.min(this.multiKillCount, 5)] || 'MULTI KILL';
            audio.multikill(this.multiKillCount);
            this.ui.showCenterMsg(label, `${this.killStreak} KILL STREAK`, 1100);
        }
        if (this.killStreak === 3 && !this.streakRewards.stim) {
            this.streakRewards.stim = true;
            this.ui.showCenterMsg('STREAK UNLOCKED [3]', 'PRESS [Z] FOR OVERDRIVE STIM', 1800);
        } else if (this.killStreak === 5 && !this.streakRewards.orbital) {
            this.streakRewards.orbital = true;
            this.ui.showCenterMsg('STREAK UNLOCKED [5]', 'PRESS [X] FOR ORBITAL STRIKE', 1800);
        } else if (this.killStreak === 7 && !this.streakRewards.sukuna) {
            this.streakRewards.sukuna = true;
            this.ui.showCenterMsg('VESSEL AWAKENED [7]', 'PRESS [V] TO BECOME RYOMEN SUKUNA', 2200);
        }
    }

    triggerDomainExpansion(isOwner, centerPos) {
        this.endDomain();
        this.domainActive = true;
        this.domainOwner = isOwner;
        this.domainTimer = 10.0;
        this.domainTickTimer = 0.25;
        this.domainCenter.copy(centerPos || this.player.pos);

        const g = new THREE.Group();
        g.position.copy(this.domainCenter);

        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(24, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
            new THREE.MeshBasicMaterial({ color: 0x6b0010, transparent: true, opacity: 0.22, side: THREE.BackSide, depthWrite: false })
        );
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(24, 0.22, 8, 48),
            new THREE.MeshBasicMaterial({ color: 0xff1e2d })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.25;

        const shrine = new THREE.Group();
        const darkWood = new THREE.MeshBasicMaterial({ color: 0x160306 });
        const crimson = new THREE.MeshBasicMaterial({ color: 0xff1e2d });
        for (const [px, pz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) {
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 4.2, 8), darkWood);
            pillar.position.set(px, 2.1, pz);
            shrine.add(pillar);
        }
        const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.8, 4), crimson);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 4.9;
        shrine.add(roof);

        g.add(dome, ring, shrine);
        this.scene.add(g);
        this.domainGroup = g;

        audio.domain();
        this.ui.showCenterMsg('DOMAIN EXPANSION', 'MALEVOLENT SHRINE', 2600);
    }

    endDomain() {
        this.domainActive = false;
        this.domainOwner = false;
        this.domainTimer = 0;
        if (this.domainGroup) {
            this.scene.remove(this.domainGroup);
            const geos = new Set(), mats = new Set();
            this.domainGroup.traverse(o => {
                if (o.geometry && !geos.has(o.geometry)) { geos.add(o.geometry); o.geometry.dispose(); }
                if (o.material && !mats.has(o.material)) { mats.add(o.material); o.material.dispose(); }
            });
            this.domainGroup = null;
        }
    }

    _updateDomain(dt) {
        if (!this.domainActive) return;
        this.domainTimer -= dt;
        this.domainTickTimer -= dt;
        if (this.domainTickTimer <= 0) {
            this.domainTickTimer = 0.35;
            const randPt = this.domainCenter.clone().add(new THREE.Vector3(rand(-16, 16), rand(0.8, 4.5), rand(-16, 16)));
            if (window.sukunaSlashVfx) window.sukunaSlashVfx(randPt, 'cleave');

            if (this.domainOwner) {
                for (const b of this.bots) {
                    if (b.alive && b.pos.distanceTo(this.domainCenter) <= 24) {
                        const hitPt = b.pos.clone().add(new THREE.Vector3(0, 1.1, 0));
                        this.damageBot(b, 42, false, hitPt, true);
                        if (window.sukunaSlashVfx) window.sukunaSlashVfx(hitPt, 'dismantle');
                    }
                }
                if (this.isMultiplayer && !this.isCoop() && this.network) {
                    for (const id in this.network.players) {
                        if (id === this.network.myId) continue;
                        const s = this.network.players[id].state;
                        if (!s || s.alive === false || !s.pos) continue;
                        const rPos = new THREE.Vector3(...s.pos);
                        if (rPos.distanceTo(this.domainCenter) <= 24) {
                            this.network.broadcast({
                                type: 'HIT', targetId: id, damage: 34,
                                attackerId: this.network.myId, attackerName: this.network.myName, isMelee: true
                            });
                            if (window.sukunaSlashVfx) window.sukunaSlashVfx(rPos.add(new THREE.Vector3(0, 1.1, 0)), 'dismantle');
                        }
                    }
                }
            }
        }
        if (this.domainTimer <= 0) {
            this.endDomain();
            if (this.domainOwner && this.isMultiplayer && this.network) {
                this.network.broadcast({ type: 'DOMAIN_END' });
            }
        }
    }

    beginClash(oppId, duration = 6) {
        this.clash = { active: true, oppId, timer: duration, myScore: 0, oppScore: 0 };
        document.getElementById('clashOverlay')?.classList.add('show');
        this._updateClashUI();
        audio.domain();
    }

    _updateClashUI() {
        const total = Math.max(1, this.clash.myScore + this.clash.oppScore);
        const pct = clamp((this.clash.myScore / total) * 100, 10, 90);
        const bar = document.getElementById('clashBarFill');
        if (bar) bar.style.width = `${pct}%`;
        const tEl = document.getElementById('clashTimer');
        if (tEl) tEl.textContent = `${Math.max(0, this.clash.timer).toFixed(1)}S`;
    }

    resolveClash(winnerId) {
        this.clash.active = false;
        document.getElementById('clashOverlay')?.classList.remove('show');
        if (winnerId === this.network.myId) {
            this.triggerDomainExpansion(true, this.player.pos.clone());
        } else {
            this.ui.showCenterMsg('DOMAIN OVERWHELMED', 'ENEMY SHRINE DOMINATED', 2000);
        }
    }

    _updateClash(dt) {
        if (!this.clash.active) return;
        this.clash.timer -= dt;
        this._updateClashUI();
        if (this.clash.timer <= 0 && this.isMultiplayer && this.network && this.network.isHost) {
            const winnerId = this.clash.myScore >= this.clash.oppScore ? this.network.myId : this.clash.oppId;
            this.network.broadcast({ type: 'CLASH_RESULT', winnerId });
            this.resolveClash(winnerId);
        }
    }

    _loop(now = performance.now()) {
        if (!this.running) return;
        requestAnimationFrame((t) => this._loop(t));

        const dt = Math.min(0.05, Math.max(0.001, (now - this._lastTime) / 1000));
        this._lastTime = now;

        if (this.state === 'MENU') {
            if (this.menuChar && this.menuChar.userData.charRoot) {
                this.menuChar.userData.charRoot.rotation.y = Math.sin(now * 0.0008) * 0.45;
            }
            this.renderer.render(this.scene, this.camera);
            this.input.endFrame();
            return;
        }

        if (this.state !== 'PLAYING' || this.paused) {
            this.renderer.render(this.scene, this.camera);
            this.input.endFrame();
            return;
        }

        if (this.multiKillTimer > 0) {
            this.multiKillTimer -= dt;
            if (this.multiKillTimer <= 0) this.multiKillCount = 0;
        }
        if (this.overdriveTimer > 0) this.overdriveTimer -= dt;

        if (this.isMultiplayer && this.player && !this.player.alive && this.respawnTimer > 0) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                const sp = this.world.getSafeSpawnPoint(this.network);
                this.player.reset(sp);
                this.player.health = this.player.maxHealth;
                this.player.alive = true;
            }
        }

        if (this.player) this.player.update(dt, this);
        if (this.world) this.world.update(dt, this.player, this.bots, this);

        for (let i = this.bots.length - 1; i >= 0; i--) {
            const remove = this.bots[i].update(dt, this.player, (bot, origin, dir) => this._onBotFire(bot, origin, dir));
            if (remove) this.bots.splice(i, 1);
        }

        if (this.effects) {
            this.effects.update(dt, this.world, this.bots, (pos, def, owner) => this._onRocketHit(pos, def, owner), this);
        }
        if (this.abilitySystem) this.abilitySystem.update(dt);
        if (this.isMultiplayer && this.network) this.network.update(dt);

        this._updateMedkitsAndFlashbangs(dt);
        this._updateDomain(dt);
        this._updateClash(dt);

        // Solo / Co-op Wave Progression
        if ((this.mode === 'wave' || this.mode === 'COOP') && (!this.isMultiplayer || this.network.isHost)) {
            const livingBots = this.bots.filter(b => b.alive && !b.isDummy).length;
            if (livingBots === 0) {
                if (this.waveCooldown <= 0) {
                    this.waveCooldown = 3.5;
                    this.ui.showCenterMsg(`WAVE ${String(this.wave).padStart(2, '0')} CLEARED`, 'NEXT WAVE IN 3.5S', 2600);
                } else {
                    this.waveCooldown -= dt;
                    if (this.waveCooldown <= 0) {
                        this._spawnWave(this.wave + 1);
                    }
                }
            }
        }

        // Camera Screen Shake & Spatial Audio Listener
        if (this.shake > 0) {
            this.camera.position.x += rand(-this.shake, this.shake) * 0.25;
            this.camera.position.y += rand(-this.shake, this.shake) * 0.25;
            this.shake = damp(this.shake, 0, 14, dt);
        }
        audio.listenerPos.copy(this.camera.position);
        audio.listenerRight.set(1, 0, 0).applyQuaternion(this.camera.quaternion);

        // HUD Updates
        this.ui.updateHealth(this.player);
        this.ui.updateWeapon(this.player);
        this.ui.updateTopStats(this);
        this.ui.updateBuffs(this.abilitySystem, this.player, this);
        this.ui.updateRadarAndBoss(this);

        this.renderer.render(this.scene, this.camera);
        this.input.endFrame();
    }
}

window.game = new Game();