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

/* ===== INJECT DYNAMIC STYLES FOR TRAINING ABILITIES & TELEKINESIS/BLINK VIGNETTES ===== */
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
        // High-pitched tinnitus ear-ringing when blinded
        if (intensity > 0.25) {
            this._tone({ freq: 3350, freqEnd: 3180, dur: 2.1 * intensity, gain: 0.24 * intensity, type: 'sine', attack: 0.02 });
        }
    }
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
    dismantle: { kind: 'dismantle', name: 'DISMANTLE', auto: true, rpm: 320, mag: 999, reserve: 999, reloadTime: 0, damage: 52, headMult: 1, limbMult: 1, spreadHip: 0, spreadAds: 0, recoil: 0, range: 110, sound: 'dismantle', price: 0 },
    cleave: { kind: 'cleave', name: 'CLEAVE', auto: false, rpm: 60, mag: 1, reserve: 1, reloadTime: 0, damage: 90, headMult: 1, limbMult: 1, spreadHip: 0, spreadAds: 0, recoil: 0, range: 65, sound: 'knife', price: 0, melee: true }
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
            if (data.targetId === this.myId && this.game.player) {
                this.game.player.triggerTelekinesisVictim();
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
        this.sukunaSlashes = [];
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
        this._sukunaOuterGeo = new THREE.TorusGeometry(1.35, 0.09, 7, 24, Math.PI * 0.92);
        this._sukunaCoreGeo = new THREE.TorusGeometry(1.35, 0.038, 6, 22, Math.PI * 0.86);
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
        if (this.flashes.length >= 34) return;
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

    /* ===== TELEPORT (BLINK STEP) SPATIAL WARP TRAIL ===== */
    blinkTrail(fromPos, toPos) {
        const dist = fromPos.distanceTo(toPos);
        if (dist < 0.2) return;
        const dir = toPos.clone().sub(fromPos).normalize();

        // Departure & arrival cyan spatial rifts
        this.shockRing(fromPos, 0x40d0ff, 2.8, 0.38);
        this.shockRing(toPos, 0xffffff, 3.2, 0.38);
        this.sparks(fromPos.clone().add(new THREE.Vector3(0, 0.9, 0)), 0x40d0ff, 14, 7);
        this.sparks(toPos.clone().add(new THREE.Vector3(0, 0.9, 0)), 0x80f0ff, 16, 8);

        // Energy beam connecting origin -> destination
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0x40d0ff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const beam = new THREE.Mesh(this._tGeo, beamMat);
        beam.position.copy(fromPos).add(new THREE.Vector3(0, 0.95, 0)).addScaledVector(dir, dist * 0.5);
        beam.lookAt(toPos.clone().add(new THREE.Vector3(0, 0.95, 0)));
        beam.scale.set(4.5, 4.5, dist);
        this.scene.add(beam);
        this.flashes.push({ m: beam, l: null, life: 0.38, max: 0.38, base: 1, sharedGeo: true });

        // Translucent cyan afterimage silhouettes along the blink path
        const ghostGeo = new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.28, 1.0, 4, 8) : new THREE.BoxGeometry(0.5, 1.65, 0.32);
        const steps = 3;
        for (let i = 1; i <= steps; i++) {
            const t = i / (steps + 1);
            const gMat = new THREE.MeshBasicMaterial({
                color: 0x40d0ff,
                transparent: true,
                opacity: 0.52 * (1 - t * 0.3),
                wireframe: i % 2 === 1,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const ghost = new THREE.Mesh(ghostGeo, gMat);
            ghost.position.copy(fromPos).lerp(toPos, t);
            ghost.position.y += 0.9;
            this.scene.add(ghost);
            this.flashes.push({ m: ghost, l: null, life: 0.42, max: 0.42, base: 1, sharedGeo: false });
        }
    }

    /* ===== TELEKINESIS PSYCHIC GRAVITY WAVE VISUAL CUE ===== */
    telekinesisWave(origin) {
        this.shockRing(origin, 0xaa00ff, 14.0, 0.65);
        this.shockRing(origin.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xe066ff, 10.0, 0.52);

        // Expanding translucent purple gravity sphere
        const sphere = new THREE.Mesh(
            this._sGeo,
            new THREE.MeshBasicMaterial({
                color: 0x9900ff,
                transparent: true,
                opacity: 0.42,
                wireframe: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        sphere.position.copy(origin).add(new THREE.Vector3(0, 1.0, 0));
        this.scene.add(sphere);
        this.flashes.push({ m: sphere, l: null, life: 0.55, max: 0.55, base: 1, expand: true, expandScale: 24, sharedGeo: true });

        // Rising anti-gravity particles
        for (let i = 0; i < 24; i++) {
            const mat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xbb33ff : 0xffffff, transparent: true, opacity: 0.95 });
            const m = new THREE.Mesh(this._pGeo, mat);
            const ang = rand(0, Math.PI * 2);
            const rad = rand(1.2, 8.5);
            m.position.set(origin.x + Math.cos(ang) * rad, origin.y + rand(0.1, 1.2), origin.z + Math.sin(ang) * rad);
            m.scale.setScalar(rand(0.8, 1.6));
            // Negative gravity (g: -9) makes particles float upward!
            const v = new THREE.Vector3(rand(-0.8, 0.8), rand(3.5, 7.5), rand(-0.8, 0.8));
            this.scene.add(m);
            this.particles.push({ m, v, g: -6, life: rand(0.65, 1.15), max: 1.15 });
        }
    }

    /* ===== SUKUNA TRAVELING SLASH PROJECTILE (DISMANTLE & CLEAVE) ===== */
    spawnSukunaSlash(pos, dir, ownerId, damage, type = 'dismantle', game, rollAngle = null) {
        const isCleave = type === 'cleave';
        const slashGroup = new THREE.Group();
        const scale = isCleave ? 2.15 : 1.05;

        const outerMat = new THREE.MeshBasicMaterial({
            color: isCleave ? 0xff1e38 : 0xff2438,
            transparent: true,
            opacity: 0.96,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const outerMesh = new THREE.Mesh(this._sukunaOuterGeo, outerMat);
        outerMesh.rotation.z = -Math.PI * 0.46;

        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x080002,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        });
        const coreMesh = new THREE.Mesh(this._sukunaCoreGeo, coreMat);
        coreMesh.rotation.z = -Math.PI * 0.43;
        coreMesh.position.z = 0.012;

        const rimMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const rimMesh = new THREE.Mesh(this._arcInnerGeo, rimMat);
        rimMesh.rotation.z = -Math.PI * 0.375;

        slashGroup.add(outerMesh, coreMesh, rimMesh);
        slashGroup.scale.setScalar(scale);
        slashGroup.position.copy(pos);
        slashGroup.lookAt(pos.clone().add(dir));
        slashGroup.rotateZ(rollAngle !== null ? rollAngle : rand(-0.65, 0.65));

        this.scene.add(slashGroup);
        this.sukunaSlashes.push({
            m: slashGroup,
            pos: pos.clone(),
            dir: dir.clone().normalize(),
            speed: isCleave ? 56 : 74,
            life: isCleave ? 1.15 : 1.45,
            maxLife: isCleave ? 1.15 : 1.45,
            ownerId,
            damage,
            type,
            hitRadius: isCleave ? 2.45 : 1.45,
            hitSet: new Set(),
            trailT: 0
        });
    }

    katanaSlashArc(pos, dir, isSuper = false, color = 0xff1e38) {
        if (this.flashes.length >= 34) return;
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
        if (this.flashes.length >= 34) return;
        const m = new THREE.Mesh(this._mGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false }));
        m.position.copy(pos);
        this.scene.add(m);
        this.flashes.push({ m, l: null, life: .045, max: .045, base: 1, sharedGeo: true });
    }

    sparks(pos, color = 0xffbb55, count = 10, speed = 5) {
        const budget = Math.max(0, 200 - this.particles.length);
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
        if (this.flashes.length < 34) {
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
        /* ===== SUKUNA TRAVELING PROJECTILE SLASHES ===== */
        for (let i = this.sukunaSlashes.length - 1; i >= 0; i--) {
            const ss = this.sukunaSlashes[i];
            ss.life -= dt;
            ss.trailT += dt;
            const stepDist = ss.speed * dt;
            const wallHit = world.raycast(ss.pos, ss.dir, stepDist + 0.35);

            ss.pos.addScaledVector(ss.dir, wallHit.hit ? wallHit.dist : stepDist);
            ss.m.position.copy(ss.pos);
            // Expand slightly as the slash wave travels through air
            const grow = 1 + (1 - ss.life / ss.maxLife) * (ss.type === 'cleave' ? 0.85 : 0.45);
            const baseScale = ss.type === 'cleave' ? 2.15 : 1.05;
            ss.m.scale.setScalar(baseScale * grow);

            if (ss.trailT > 0.025) {
                ss.trailT = 0;
                this.sparks(ss.pos, 0xff1e2d, 1, 2.2);
            }

            if (game && ss.ownerId === 'player' && ss.damage > 0) {
                for (const bot of game.bots) {
                    if (!bot.alive || ss.hitSet.has(bot)) continue;
                    const bCenter = bot.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
                    if (bCenter.distanceTo(ss.pos) <= ss.hitRadius) {
                        ss.hitSet.add(bot);
                        game.damageBot(bot, ss.damage, false, bCenter, true);
                        if (window.sukunaSlashVfx) window.sukunaSlashVfx(bCenter, ss.type);
                        audio.katanaHit(ss.type === 'cleave');
                    }
                }
                if (game.isMultiplayer && !game.isCoop() && game.network) {
                    for (const id in game.network.players) {
                        if (id === game.network.myId || ss.hitSet.has(id)) continue;
                        const pData = game.network.players[id];
                        if (!pData || !pData.state || pData.state.alive === false || !pData.state.pos) continue;
                        const rPos = new THREE.Vector3(...pData.state.pos).add(new THREE.Vector3(0, 1.0, 0));
                        if (rPos.distanceTo(ss.pos) <= ss.hitRadius) {
                            ss.hitSet.add(id);
                            game.network.broadcast({
                                type: 'HIT', targetId: id, damage: ss.damage,
                                attackerId: game.network.myId, attackerName: game.network.myName, isMelee: true
                            });
                            game.ui.showHitmarker(false);
                            game.ui.spawnDamageNum(ss.damage, false, rPos, game.camera);
                            if (window.sukunaSlashVfx) window.sukunaSlashVfx(rPos, ss.type);
                            audio.katanaHit(ss.type === 'cleave');
                        }
                    }
                }
            }

            if (wallHit.hit || ss.life <= 0) {
                if (wallHit.hit) {
                    this.scorchMark(wallHit.point, wallHit.normal);
                    if (window.sukunaSlashVfx) window.sukunaSlashVfx(wallHit.point, ss.type);
                    for (const m of world.meshes) {
                        if (m.userData?.destructible && m.position.distanceTo(wallHit.point) < 4.5) {
                            window.damageMapMesh(m, wallHit.point, ss.damage || 50);
                            break;
                        }
                    }
                }
                this.scene.remove(ss.m);
                ss.m.traverse(o => { if (o.material) o.material.dispose(); });
                this.sukunaSlashes.splice(i, 1);
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
        for (const ss of this.sukunaSlashes) {
            this.scene.remove(ss.m);
            ss.m.traverse(o => { if (o.material) o.material.dispose(); });
        }
        this.tracers = []; this.scorchMarks = []; this.particles = []; this.flashes = []; this.rockets = []; this.slashWaves = []; this.sukunaSlashes = [];
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
        addCyl(0.015, 0.017, 0.32, 0, 0.014, -0.62, steel, 10);
        addCyl(0.022, 0.02, 0.07, 0, 0.014, -0.78, dark, 8);
        addBox(0.054, 0.16, 0.078, 0, -0.145, -0.18, dark, 0.24, 0, 0);
        addBox(0.052, 0.15, 0.068, 0, -0.13, 0.04, dark, -0.28, 0, 0);
        addBox(0.062, 0.095, 0.24, 0, -0.005, 0.20, dark);
        addBox(0.056, 0.062, 0.11, 0, 0.095, -0.12, dark);
        addBox(0.042, 0.042, 0.006, 0, 0.098, -0.12, accent);
        mPos.set(0, 0.014, -0.82);
    } else if (kind === 'shotgun') {
        addBox(0.088, 0.085, 0.36, 0, 0, -0.08, metal);
        addCyl(0.024, 0.024, 0.62, 0, 0.026, -0.48, steel, 12);
        addCyl(0.02, 0.02, 0.56, 0, -0.016, -0.45, dark, 12);
        addBox(0.076, 0.068, 0.22, 0, -0.024, -0.38, dark);
        addBox(0.078, 0.014, 0.18, 0, -0.024, -0.38, accent);
        addBox(0.055, 0.14, 0.075, 0, -0.12, 0.08, dark, -0.35, 0, 0);
        addBox(0.068, 0.10, 0.25, 0, -0.02, 0.24, dark);
        mPos.set(0, 0.026, -0.80);
    } else if (kind === 'sniper') {
        addBox(0.084, 0.086, 0.42, 0, 0, -0.08, metal);
        addCyl(0.019, 0.023, 0.78, 0, 0.016, -0.62, steel, 12);
        addBox(0.048, 0.042, 0.11, 0, 0.016, -1.02, dark);
        addBox(0.054, 0.012, 0.09, 0, 0.016, -1.02, accent);
        addCyl(0.032, 0.032, 0.34, 0, 0.088, -0.10, dark, 14);
        addCyl(0.040, 0.034, 0.07, 0, 0.088, -0.28, dark, 14);
        addCyl(0.037, 0.037, 0.05, 0, 0.088, 0.08, dark, 14);
        addBox(0.026, 0.032, 0.03, 0, 0.056, -0.04, steel);
        addBox(0.026, 0.032, 0.03, 0, 0.056, -0.18, steel);
        addBox(0.058, 0.11, 0.08, 0, -0.11, -0.14, dark);
        addBox(0.054, 0.14, 0.07, 0, -0.12, 0.06, dark, -0.25, 0, 0);
        addBox(0.066, 0.11, 0.28, 0, -0.01, 0.26, metal);
        mPos.set(0, 0.016, -1.08);
    } else if (kind === 'kar98') {
        const wood = new THREE.MeshStandardMaterial({ color: isDefault ? 0x5c361e : 0xffffff, map: isDefault ? null : tex, roughness: 0.55, metalness: 0.2 });
        addBox(0.074, 0.076, 0.78, 0, -0.012, -0.18, wood);
        addBox(0.066, 0.105, 0.28, 0, -0.022, 0.26, wood);
        addCyl(0.017, 0.021, 0.72, 0, 0.022, -0.58, steel, 12);
        addBox(0.068, 0.055, 0.26, 0, 0.02, -0.06, dark);
        addCyl(0.024, 0.024, 0.24, 0, 0.072, -0.08, dark, 12);
        addBox(0.018, 0.024, 0.024, 0, 0.048, -0.08, accent);
        mPos.set(0, 0.022, -0.95);
    } else if (kind === 'smg') {
        addBox(0.072, 0.078, 0.32, 0, 0.005, -0.12, metal);
        addCyl(0.022, 0.022, 0.24, 0, 0.012, -0.38, dark, 12);
        addBox(0.044, 0.17, 0.056, 0, -0.135, -0.18, dark, -0.18, 0, 0);
        addBox(0.048, 0.13, 0.064, 0, -0.11, 0.01, dark, -0.25, 0, 0);
        addBox(0.056, 0.012, 0.18, 0, 0.052, -0.14, accent);
        addBox(0.048, 0.065, 0.18, 0, 0.01, 0.14, steel);
        mPos.set(0, 0.012, -0.52);
    } else if (kind === 'lmg') {
        addBox(0.105, 0.105, 0.46, 0, 0.01, -0.14, metal);
        addBox(0.112, 0.032, 0.24, 0, 0.072, -0.10, dark);
        addCyl(0.024, 0.028, 0.56, 0, 0.018, -0.60, steel, 12);
        addBox(0.11, 0.14, 0.13, -0.095, -0.065, -0.16, dark);
        addBox(0.115, 0.016, 0.12, -0.095, -0.03, -0.16, accent);
        addBox(0.056, 0.15, 0.074, 0, -0.13, 0.06, dark, -0.25, 0, 0);
        addBox(0.075, 0.11, 0.26, 0, -0.01, 0.24, dark);
        mPos.set(0, 0.018, -0.90);
    } else if (kind === 'ak47') {
        const wood = new THREE.MeshStandardMaterial({ color: isDefault ? 0x6b3a1e : 0xffffff, map: isDefault ? null : tex, roughness: 0.52, metalness: 0.22 });
        addBox(0.076, 0.078, 0.36, 0, 0.004, -0.10, metal);
        addBox(0.072, 0.072, 0.24, 0, 0.002, -0.38, wood);
        addCyl(0.016, 0.018, 0.36, 0, 0.012, -0.64, steel, 10);
        addCyl(0.012, 0.012, 0.26, 0, 0.044, -0.44, dark, 8);
        addBox(0.054, 0.18, 0.078, 0, -0.145, -0.19, dark, 0.34, 0, 0);
        addBox(0.052, 0.14, 0.068, 0, -0.12, 0.04, wood, -0.28, 0, 0);
        addBox(0.064, 0.105, 0.25, 0, -0.015, 0.22, wood);
        addBox(0.080, 0.012, 0.18, 0, 0.012, -0.12, accent);
        mPos.set(0, 0.012, -0.84);
    } else if (kind === 'rocket') {
        addCyl(0.078, 0.078, 1.08, 0, 0.02, -0.28, metal, 14);
        addCyl(0.092, 0.082, 0.14, 0, 0.02, -0.84, dark, 14);
        addCyl(0.095, 0.08, 0.14, 0, 0.02, 0.28, dark, 14);
        addCyl(0.083, 0.083, 0.08, 0, 0.02, -0.58, accent, 14);
        addBox(0.054, 0.15, 0.074, 0, -0.12, -0.12, dark, -0.2, 0, 0);
        addBox(0.050, 0.13, 0.065, 0, -0.11, -0.42, dark, 0.15, 0, 0);
        addBox(0.05, 0.06, 0.12, -0.085, 0.06, -0.24, dark);
        addBox(0.054, 0.015, 0.09, -0.085, 0.06, -0.24, accent);
        mPos.set(0, 0.02, -0.92);
    } else if (kind === 'knife') {
        addBox(0.032, 0.046, 0.14, 0, -0.02, 0.04, dark);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 8, 16), steel);
        ring.position.set(0, -0.02, 0.125);
        g.add(ring);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.036, 0.22), steel);
        blade.position.set(0, -0.006, -0.12);
        blade.rotation.x = 0.22;
        const edgeGlow = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.008, 0.21), accent);
        edgeGlow.position.set(0, -0.022, -0.12);
        edgeGlow.rotation.x = 0.22;
        g.add(blade, edgeGlow);
        mPos.set(0, 0, -0.25);
    }

    const muzzle = new THREE.Object3D();
    muzzle.position.copy(mPos);
    g.add(muzzle);

    let light = null;
    if (withLight && kind !== 'knife') {
        light = new THREE.PointLight(accentHex, 0, 5.5);
        light.position.copy(mPos);
        g.add(light);
    }

    g.userData = { muzzle, muzzleLight: light };
    return g;
}

class Weapon {
    constructor(def) { Object.assign(this, def); this.maxMag = def.mag; this.maxReserve = def.reserve; this.mag = def.mag; this.reserve = def.reserve; this.cooldown = 0; this.reloading = false; this.reloadTimer = 0; this.boltTimer = 0; this.camo = SaveSystem.data.equippedCamos[def.kind] || 'default'; this.mesh = buildWeaponMesh(def.kind, this.camo, true); this.recoilKick = 0; this.recoilRot = 0; }
    rebuildMesh(camo) {
        this.camo = camo;
        const parent = this.mesh.parent;
        const pos = this.mesh.position.clone();
        const rot = this.mesh.rotation.clone();
        const vis = this.mesh.visible;
        if (parent) parent.remove(this.mesh);
        this.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (Array.isArray(o.material)) o.material.forEach(m => m.dispose()); else o.material.dispose(); } });
        this.mesh = buildWeaponMesh(this.kind, camo, true);
        this.mesh.position.copy(pos);
        this.mesh.rotation.copy(rot);
        this.mesh.visible = vis;
        if (parent) parent.add(this.mesh);
    }
    canFire() { if (this.melee) return this.cooldown <= 0; return this.cooldown <= 0 && this.boltTimer <= 0 && !this.reloading && this.mag > 0; }
    startReload() { if (this.melee || this.reloading || this.mag >= this.maxMag || this.reserve <= 0) return false; this.reloading = true; this.reloadTimer = this.shellReload ? 0.55 : this.reloadTime; audio.reload(); return true; }
    cancelReload() { this.reloading = false; this.reloadTimer = 0; }
    update(dt) {
        if (this.cooldown > 0) this.cooldown -= dt;
        if (this.boltTimer > 0) this.boltTimer -= dt;
        if (this.reloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                if (this.shellReload) {
                    this.mag++;
                    this.reserve--;
                    audio.reloadDone();
                    if (this.mag < this.maxMag && this.reserve > 0) this.reloadTimer = 0.48;
                    else this.reloading = false;
                } else {
                    const need = this.maxMag - this.mag, take = Math.min(need, this.reserve);
                    this.mag += take; this.reserve -= take; this.reloading = false; audio.reloadDone();
                }
            }
        }
        this.recoilKick = damp(this.recoilKick, 0, 16, dt);
        this.recoilRot = damp(this.recoilRot, 0, 14, dt);
        if (this.mesh.userData.muzzleLight) this.mesh.userData.muzzleLight.intensity = damp(this.mesh.userData.muzzleLight.intensity, 0, 35, dt);
        if (this.mesh.userData.isDragon) {
            const t = performance.now() * 0.004;
            if (this.mesh.userData.wingL) this.mesh.userData.wingL.rotation.z = Math.sin(t) * 0.22;
            if (this.mesh.userData.wingR) this.mesh.userData.wingR.rotation.z = -Math.sin(t) * 0.22;
            if (this.mesh.userData.jawGroup) this.mesh.userData.jawGroup.rotation.x = 0.24 + Math.sin(t * 1.4) * 0.08 + this.recoilRot * 0.5;
            if (this.mesh.userData.flameCore) {
                const s = 0.8 + Math.sin(t * 4) * 0.25 + this.recoilKick * 8;
                this.mesh.userData.flameCore.scale.set(s, s, s * 1.3);
            }
        }
    }
}

class AbilitySystem {
    constructor(scene, game) {
        this.scene = scene; this.game = game; this.pickups = []; this.active = {};
        this.spawnTimer = 16; this.types = ['speed', 'damage', 'shield', 'telekinesis', 'teleport', 'infinity'];
        this.colors = { speed: 0x3fe08a, damage: 0xff5a1a, shield: 0x40d0ff, telekinesis: 0xaa00ff, teleport: 0xffffff, infinity: 0x00ffff };
        this.labels = { speed: 'OVERDRIVE · 1.45× SPD', damage: 'OVERCHARGE · 1.5× DMG', shield: 'AEGIS · +100 ARMOR', telekinesis: 'TELEKINESIS [F]', teleport: 'BLINK STEP [F]', infinity: 'LIMITLESS (INVULN)' };
    }
    spawnInitial(points) {
        const list = points && points.length ? points : [new THREE.Vector3(-12, 0.5, 0), new THREE.Vector3(12, 0.5, 0), new THREE.Vector3(0, 0.5, -14)];
        for (let i = 0; i < Math.min(3, list.length); i++) this._spawnAt(list[i], pick(this.types));
    }
    _spawnAt(pos, pType) {
        if (this.pickups.length >= 4) return;
        const type = pType || pick(this.types); const col = this.colors[type];
        const g = new THREE.Group(); g.position.copy(pos); g.position.y = Math.max(pos.y, 0.2) + 0.9;
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 3 }));
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.04, 6, 20), new THREE.MeshBasicMaterial({ color: col })); ring.rotation.x = Math.PI / 2;
        g.add(core, ring); this.scene.add(g); this.pickups.push({ g, core, ring, type, phase: rand(0, 6.28) });
    }
    spawnPickupAt(posArr, pType) {
        this._spawnAt(new THREE.Vector3(posArr[0], posArr[1], posArr[2]), pType);
    }
    update(dt, player) {
        if (!this.game.isMultiplayer || this.game.network.isHost) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                this.spawnTimer = 16;
                const pts = this.game.world.spawnPoints;
                if (pts && pts.length) {
                    const pt = pick(pts);
                    const pType = pick(this.types);
                    this._spawnAt(pt, pType);
                    if (this.game.isMultiplayer && this.game.network.isHost) {
                        this.game.network.broadcast({ type: 'POWERUP_SPAWN', pos: [pt.x, pt.y, pt.z], pType });
                    }
                }
            }
        }
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const p = this.pickups[i]; p.phase += dt * 3; p.core.rotation.y += dt * 2.5; p.core.rotation.x += dt * 1.3; p.ring.rotation.z += dt * 2;
            p.g.position.y += Math.sin(p.phase) * 0.004;
            if (player && player.alive && player.pos.distanceTo(p.g.position) < 1.8) { this.grant(p.type, player); audio.pickup(); this._remove(i); }
        }
        for (const k in this.active) {
            this.active[k] -= dt;
            if (this.active[k] <= 0) delete this.active[k];
        }
    }
    grant(type, player) {
        const isTraining = this.game && this.game.mode === 'training';
        const dur = isTraining ? 999 : 25;
        if (type === 'shield') {
            player.shield = Math.min(100, player.shield + 100);
            this.active.shield = isTraining ? 999 : 6;
        } else if (type === 'telekinesis' || type === 'teleport') {
            this.active[type] = dur;
        } else {
            this.active[type] = dur;
        }
    }
    has(type) { return (this.active[type] || 0) > 0; }
    _remove(i) { const p = this.pickups[i]; this.scene.remove(p.g); p.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); this.pickups.splice(i, 1); }
    clear() { while (this.pickups.length) this._remove(0); this.active = {}; }
}

class Player {
    constructor(camera, world, effects, input, abilitySystem) {
        this.camera = camera; this.world = world; this.effects = effects; this.input = input; this.abilitySystem = abilitySystem;
        this.pos = world.playerSpawn.clone(); this.vel = new THREE.Vector3();
        this.yaw = 0; this.pitch = 0; this.radius = .4; this.standHeight = 1.75; this.crouchHeight = 1.05; this.height = this.standHeight;
        this.onGround = false; this.crouching = false; this.sliding = false;
        this.slideTimer = 0; this.slideCooldown = 0; this.slideDir = new THREE.Vector3();
        this.health = 100; this.maxHealth = 100; this.shield = 0; this.alive = true;
        this.stamina = 100; this.maxStamina = 100;
        this.medkits = 2; this.maxMedkits = 2; this.healTimer = 0;
        this.flashbangs = 2; this.maxFlashbangs = 2;
        this.tkFreezeTimer = 0; this.tkLiftStage = false; this.confusedTimer = 0;

        // Blink / Teleport warp transition state
        this.blinkTimer = 0;
        this.blinkDuration = 0.11;
        this.blinkFrom = new THREE.Vector3();
        this.blinkTo = new THREE.Vector3();

        // Rich FPS Camera Movement state
        this.camRoll = 0;
        this.camBobX = 0;
        this.camBobY = 0;
        this.landDip = 0;
        this.slidePitchKick = 0;
        this.fovOffset = 0;

        // Katana / Melee combos, dash, parry, and Sukuna state
        this.katanaCombo = 0;
        this.katanaComboTimer = 0;
        this.katanaDashTimer = 0;
        this.parryTimer = 0;
        this.parryCooldown = 0;
        this.sukunaTimer = 0;
        this.sukunaSkills = { cleave: 0, fuga: 0, domain: 0 };

        // Killstreak rewards
        this.streaks = { uav: false, uavTimer: 0, stim: false, stimTimer: 0, orbital: false };

        this.weaponHolder = new THREE.Group(); this.camera.add(this.weaponHolder);
        this.weapons = [];
        this.weaponIdx = 0; this.ads = 0; this.walkPhase = 0; this.footstepT = 0;
        this.recoilPitch = 0; this.recoilYaw = 0; this.shake = 0; this.damageTint = 0;
        this.baseFov = SaveSystem.data.settings.fov; this.camera.fov = this.baseFov; this.camera.updateProjectionMatrix();
        this._semiLock = false; this.triggerDown = false;
        this._padGraceTimer = 0;
        this._tkCooldown = 0;
        this._tpCooldown = 0;
        this._resetViewState();
        this.loadEquippedWeapons();
    }
    loadEquippedWeapons() {
        for (const w of this.weapons) {
            this.weaponHolder.remove(w.mesh);
            w.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (Array.isArray(o.material)) o.material.forEach(m => m.dispose()); else o.material.dispose(); } });
        }
        const loadout = SaveSystem.data.equippedLoadout || ['rifle', 'shotgun', 'rocket', 'knife'];
        this.weapons = loadout.map(k => new Weapon(WEAPON_DEFS[k] || WEAPON_DEFS.rifle));
        this.weapons.forEach((w, i) => { w.mesh.visible = (i === 0); this.weaponHolder.add(w.mesh); });
        this.weaponIdx = 0;
    }
    get currentWeapon() { return this.weapons[this.weaponIdx]; }
    switchWeapon(idx) {
        if (idx === this.weaponIdx || idx < 0 || idx >= this.weapons.length) return;
        const cur = this.currentWeapon;
        if (cur) { cur.cancelReload(); cur.mesh.visible = false; }
        this.weaponIdx = idx;
        const next = this.currentWeapon;
        if (next) {
            next.mesh.visible = true;
            next.mesh.position.set(0.28, -0.34, -0.35);
            if (next.kind === 'katana') {
                next.mesh.rotation.set(0.2, 0.35, -0.35);
                audio.katanaDraw();
            } else {
                next.mesh.rotation.set(0.15, 0, 0);
            }
        }
        this.ads = 0;
        this.parryTimer = 0;
        this.katanaCombo = 0;
    }
    _resetViewState() {
        this.recoilPitch = 0;
        this.recoilYaw = 0;
        this.shake = 0;
        this.ads = 0;
        this.camRoll = 0;
        this.camBobX = 0;
        this.camBobY = 0;
        this.landDip = 0;
        this.slidePitchKick = 0;
        this.fovOffset = 0;
        this.camera.fov = this.baseFov;
        this.camera.updateProjectionMatrix();
        if (this.weaponHolder) {
            this.weaponHolder.position.set(0, 0, 0);
            this.weaponHolder.rotation.set(0, 0, 0);
        }
    }
    reset(spawnPos) {
        this.pos.copy(spawnPos);
        this.vel.set(0, 0, 0);
        this.yaw = 0;
        this.pitch = 0;
        this.health = this.maxHealth;
        this.shield = 0;
        this.alive = true;
        this.stamina = this.maxStamina;
        this.medkits = 2;
        this.flashbangs = 2;
        this.sliding = false;
        this.slideTimer = 0;
        this.slideCooldown = 0;
        this.blinkTimer = 0;
        this.crouching = false;
        this.height = this.standHeight;
        this.tkFreezeTimer = 0;
        this.tkLiftStage = false;
        this.confusedTimer = 0;
        this.katanaCombo = 0;
        this.katanaComboTimer = 0;
        this.katanaDashTimer = 0;
        this.parryTimer = 0;
        this.parryCooldown = 0;
        this.sukunaTimer = 0;
        this.sukunaSkills = { cleave: 0, fuga: 0, domain: 0 };
        this.streaks = { uav: false, uavTimer: 0, stim: false, stimTimer: 0, orbital: false };
        this._padGraceTimer = 0.6;
        if (window.sukunaHandVfx) window.sukunaHandVfx.remove();
        this._resetViewState();
        for (const w of this.weapons) { w.mag = w.maxMag; w.reserve = w.maxReserve; w.cancelReload(); w.cooldown = 0; }
        this.switchWeapon(0);
    }
    triggerTelekinesisVictim() {
        this.tkFreezeTimer = 1.45;
        this.tkLiftStage = true;
        this.vel.y = 11.5;
        this.onGround = false;
        this.sliding = false;
        audio.telekinesis();
        if (this.effects) {
            this.effects.shockRing(this.pos, 0xaa00ff, 3.2, 0.5);
            this.effects.sparks(this.pos.clone().add(new THREE.Vector3(0, 1, 0)), 0xbb33ff, 14, 6);
        }
        const psyEl = document.getElementById('psyOverlay');
        if (psyEl) {
            psyEl.style.opacity = '1';
            setTimeout(() => { psyEl.style.opacity = '0'; }, 1350);
        }
    }
    update(dt, game) {
        if (!this.alive) return;
        const isTraining = game && game.mode === 'training';
        if (this._padGraceTimer > 0) this._padGraceTimer -= dt;
        if (this._tkCooldown > 0) this._tkCooldown -= dt;
        if (this._tpCooldown > 0) this._tpCooldown -= dt;
        if (this.slideCooldown > 0) this.slideCooldown -= dt;

        if (this.tkFreezeTimer > 0) {
            this.tkFreezeTimer -= dt;
            if (this.tkFreezeTimer > 0.32) {
                // Anti-gravity upward float phase
                this.vel.y = damp(this.vel.y, Math.sin(performance.now() * 0.008) * 1.4, 8, dt);
                this.vel.x *= 0.88;
                this.vel.z *= 0.88;
                this.camRoll = damp(this.camRoll, Math.sin(performance.now() * 0.006) * 0.09, 8, dt);
            } else if (this.tkLiftStage) {
                // Reverse gravity slam phase
                this.tkLiftStage = false;
                this.vel.y = -32;
                this.shake = Math.max(this.shake, 0.45);
            }
            this.pos.addScaledVector(this.vel, dt);
            this.world.moveAndSlide(this.pos, this.vel, this.radius, this.height, dt);
            this._updateCameraAndWeapon(dt, false, false, false);
            return;
        }
        if (this.confusedTimer > 0) this.confusedTimer -= dt;

        // Smooth Blink / Teleport Warp Interpolation
        if (this.blinkTimer > 0) {
            this.blinkTimer = Math.max(0, this.blinkTimer - dt);
            const t = 1 - (this.blinkTimer / this.blinkDuration);
            const ease = 1 - Math.pow(1 - t, 3);
            this.pos.lerpVectors(this.blinkFrom, this.blinkTo, ease);
            this.vel.y = 0;
            if (this.blinkTimer <= 0) {
                this.pos.copy(this.blinkTo);
                this.effects.shockRing(this.pos, 0x40d0ff, 2.8, 0.28);
            }
            this._updateCameraAndWeapon(dt, false, false, false);
            return;
        }

        // Sukuna timer & cooldowns
        if (this.sukunaTimer > 0) {
            this.sukunaTimer -= dt;
            if (this.sukunaTimer <= 0) {
                if (window.sukunaHandVfx) window.sukunaHandVfx.remove();
            }
        }
        for (const s in this.sukunaSkills) {
            if (this.sukunaSkills[s] > 0) {
                this.sukunaSkills[s] = Math.max(0, this.sukunaSkills[s] - dt * (isTraining ? 12 : 1));
            }
        }

        // Killstreak timers
        if (this.streaks.uav) {
            this.streaks.uavTimer -= dt;
            if (this.streaks.uavTimer <= 0) this.streaks.uav = false;
        }
        if (this.streaks.stim) {
            this.streaks.stimTimer -= dt;
            if (this.streaks.stimTimer <= 0) this.streaks.stim = false;
        }

        // Katana combo & parry timers
        if (this.katanaComboTimer > 0) {
            this.katanaComboTimer -= dt;
            if (this.katanaComboTimer <= 0) this.katanaCombo = 0;
        }
        if (this.parryTimer > 0) this.parryTimer -= dt;
        if (this.parryCooldown > 0) this.parryCooldown -= dt;
        if (this.katanaDashTimer > 0) this.katanaDashTimer -= dt;

        // Training Grounds instant ability hotkeys [5]-[0] so you never have to wait for spawns!
        if (isTraining) {
            if (this.input.hit('Digit5')) {
                this.abilitySystem.grant('teleport', this);
                this._triggerTeleport(game);
            }
            if (this.input.hit('Digit6')) {
                this.abilitySystem.grant('telekinesis', this);
                this._triggerTelekinesis(game);
            }
            if (this.input.hit('Digit7')) {
                if (this.abilitySystem.has('infinity')) {
                    delete this.abilitySystem.active.infinity;
                    game.ui.showCenterMsg('LIMITLESS OFF', '', 700);
                } else {
                    this.abilitySystem.grant('infinity', this);
                    game.ui.showCenterMsg('LIMITLESS (INVULNERABLE)', 'ACTIVE IN TRAINING', 900);
                }
            }
            if (this.input.hit('Digit8')) {
                if (this.abilitySystem.has('speed')) {
                    delete this.abilitySystem.active.speed;
                    game.ui.showCenterMsg('OVERDRIVE SPEED OFF', '', 700);
                } else {
                    this.abilitySystem.grant('speed', this);
                    game.ui.showCenterMsg('OVERDRIVE SPEED (1.45×)', 'ACTIVE IN TRAINING', 900);
                }
            }
            if (this.input.hit('Digit9')) {
                if (this.abilitySystem.has('damage')) {
                    delete this.abilitySystem.active.damage;
                    game.ui.showCenterMsg('OVERCHARGE DAMAGE OFF', '', 700);
                } else {
                    this.abilitySystem.grant('damage', this);
                    game.ui.showCenterMsg('OVERCHARGE DAMAGE (1.5×)', 'ACTIVE IN TRAINING', 900);
                }
            }
            if (this.input.hit('Digit0')) {
                this.abilitySystem.grant('shield', this);
                game.ui.showCenterMsg('AEGIS SHIELD +100', 'ARMOR CHARGED', 900);
            }
        }

        // Sukuna toggle [V]
        if (this.input.hit('KeyV')) {
            if (this.sukunaTimer > 0) {
                this.sukunaTimer = 0;
                if (window.sukunaHandVfx) window.sukunaHandVfx.remove();
            } else if (game.kills >= 2 || isTraining) {
                this.sukunaTimer = isTraining ? 999 : 60;
                this.health = 1000;
                this.maxHealth = 1000;
                audio.sukuna();
                game.ui.showCenterMsg("RYOMEN SUKUNA", isTraining ? "TRAINING VESSEL UNLEASHED" : "YOU ARE NOW THE KING OF CURSES", 3000);
                if (window.sukunaHandVfx) window.sukunaHandVfx.spawn(this.camera);
                if (game.isMultiplayer) game.network.broadcast({ type: 'SUKUNA', playerId: game.network.myId });
            }
        }

        // Streak activations [Z] Stim, [X] Orbital Strike (also freely usable in Training!)
        if (this.input.hit('KeyZ') && (this.streaks.stim || isTraining)) {
            this.streaks.stimTimer = 10;
            this.health = Math.min(this.maxHealth, this.health + 50);
            this.stamina = this.maxStamina;
            audio.medkit();
            game.ui.showCenterMsg('OVERDRIVE STIM', '+50 HP · 1.4× SPEED FOR 10S', 1400);
            if (!isTraining) this.streaks.stim = false;
        }
        if (this.input.hit('KeyX') && (this.streaks.orbital || isTraining)) {
            if (!isTraining) this.streaks.orbital = false;
            const aimDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const hit = this.world.raycast(this.camera.position, aimDir, 120);
            const strikeCenter = hit.hit ? hit.point : this.pos.clone().addScaledVector(aimDir, 25);
            game.triggerOrbitalStrike(strikeCenter);
            game.ui.showCenterMsg('ORBITAL STRIKE INBOUND', 'IMPACT IMMINENT', 1600);
        }

        // Sukuna abilities [Q] Fuga, [E] Domain Expansion
        if (this.sukunaTimer > 0) {
            if (this.input.hit('KeyQ') && this.sukunaSkills.fuga <= 0) {
                this.sukunaSkills.fuga = isTraining ? 0.5 : 8;
                const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                const startPos = this.camera.position.clone().addScaledVector(dir, 0.8);
                if (window.sukunaHandVfx) window.sukunaHandVfx.swing('dismantle');
                this.effects.spawnRocket(startPos, dir, 56, 'player', { damage: 240, splashDamage: 160, splashRadius: 11, isFuga: true });
                audio.shoot('rocket', startPos);
                game.ui.showCenterMsg('FUGA · DIVINE FLAME', 'OPEN', 900);
            }
            if (this.input.hit('KeyE') && this.sukunaSkills.domain <= 0) {
                this.sukunaSkills.domain = isTraining ? 2.0 : 25;
                if (game.isMultiplayer) {
                    if (game.network.isHost) {
                        game.network.processDomainIntent(game.network.myId);
                    } else {
                        game.network.broadcast({ type: 'DOMAIN_INTENT', playerId: game.network.myId });
                    }
                } else {
                    game.ui.showCenterMsg("DOMAIN EXPANSION", "MALEVOLENT SHRINE", 3500);
                    game.triggerDomainExpansion(true, this.pos.clone());
                }
            }
        }

        if (this.input.hit('KeyG') && this.medkits > 0 && this.health < this.maxHealth && this.healTimer <= 0) { this.healTimer = 1.6; }
        if (this.healTimer > 0) {
            this.healTimer -= dt;
            if (this.healTimer <= 0) { this.medkits--; this.health = Math.min(this.maxHealth, this.health + 45); audio.medkit(); }
        }
        if (this.input.hit('KeyQ') && this.flashbangs > 0 && this.sukunaTimer <= 0) {
            this.flashbangs--;
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            game.throwFlashbang(this.camera.position.clone().addScaledVector(dir, 0.6), dir.multiplyScalar(22).add(this.vel.clone().multiplyScalar(0.5)), true);
        }

        const w = this.currentWeapon;
        const isScoped = w && (w.kind === 'sniper' || w.kind === 'kar98') && this.ads > 0.35;
        const sensMult = isScoped ? (SaveSystem.data.settings.scopeSensitivity || 0.8) : 1.0;
        const confMult = this.confusedTimer > 0 ? -0.6 : 1;
        const sens = .0022 * this.input.sensitivity * sensMult * confMult;
        this.yaw -= this.input.mouseDX * sens;
        this.pitch -= this.input.mouseDY * sens * (this.input.invertY ? -1 : 1);
        this.pitch = clamp(this.pitch, -1.48, 1.48);

        if (this.input.hit('Digit1')) this.switchWeapon(0);
        if (this.input.hit('Digit2')) this.switchWeapon(1);
        if (this.input.hit('Digit3')) this.switchWeapon(2);
        if (this.input.hit('Digit4')) this.switchWeapon(3);
        if (this.input.wheel !== 0) this.switchWeapon((this.weaponIdx + this.input.wheel + this.weapons.length) % this.weapons.length);

        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
        let fwd = 0, strafe = 0;
        if (this.input.down('KeyW')) fwd += 1;
        if (this.input.down('KeyS')) fwd -= 1;
        if (this.input.down('KeyD')) strafe += 1;
        if (this.input.down('KeyA')) strafe -= 1;
        const moveDir = new THREE.Vector3().addScaledVector(forward, fwd).addScaledVector(right, strafe);
        if (moveDir.lengthSq() > 0) moveDir.normalize();

        const currentHorizSpeed = Math.hypot(this.vel.x, this.vel.z);
        const sprinting = this.input.down('ShiftLeft') && moveDir.dot(forward) > .2 && !this.crouching && this.ads < .3;
        const crouchHeld = this.input.down('KeyC') || this.input.down('ControlLeft');
        const crouchTapped = this.input.hit('KeyC') || this.input.hit('ControlLeft');

        /* ===== FIXED SLIDING MECHANICS ===== */
        // Trigger slide if tapping or holding crouch while sprinting OR moving fast on the ground
        if ((crouchTapped || crouchHeld) && this.onGround && !this.sliding && this.slideCooldown <= 0 && (sprinting || currentHorizSpeed > 6.8)) {
            this.sliding = true;
            this.slideTimer = 0.86;
            this.slideCooldown = 0.4;
            this.slideDir.copy(moveDir.lengthSq() > 0 ? moveDir : forward);
            const speedBoost = this.abilitySystem.has('speed') ? 1.25 : 1.0;
            const initialSlideSpeed = Math.max(16.5 * speedBoost, currentHorizSpeed * 1.15);
            this.vel.x = this.slideDir.x * initialSlideSpeed;
            this.vel.z = this.slideDir.z * initialSlideSpeed;
            this.effects.sparks(this.pos.clone().add(new THREE.Vector3(0, 0.1, 0)), 0xffaa44, 6, 3.5);
            audio.slide();
        }
        if (this.sliding) {
            this.slideTimer -= dt;
            // Cancel slide if timer expires, player falls off ledge, or player taps C again after 0.18s
            if (this.slideTimer <= 0 || !this.onGround || (crouchTapped && this.slideTimer < 0.68)) {
                this.sliding = false;
            }
        }
        this.crouching = crouchHeld || this.sliding;

        const targetH = this.crouching ? this.crouchHeight : this.standHeight;
        if (!this.crouching && this.height < this.standHeight - 0.02) {
            if (this.world._hasHeadroom(this.pos, this.radius * 0.9, this.pos.y, this.standHeight)) {
                this.height = damp(this.height, this.standHeight, 14, dt);
            } else {
                this.crouching = true;
            }
        } else {
            this.height = damp(this.height, targetH, 16, dt);
        }

        let baseSpeed = 8.4;
        if (this.sukunaTimer > 0) baseSpeed *= 1.45;
        if (this.abilitySystem.has('speed')) baseSpeed *= 1.45;
        if (this.streaks.stimTimer > 0) baseSpeed *= 1.38;
        if (w && w.kind === 'katana') baseSpeed *= 1.16;

        let targetSpeed = this.sliding ? 15.8 : (this.crouching ? baseSpeed * 0.52 : (sprinting ? baseSpeed * 1.44 : baseSpeed));
        if (this.ads > .3 && !this.sliding) targetSpeed *= .68;
        const wishVel = this.sliding ? this.slideDir.clone().multiplyScalar(targetSpeed) : moveDir.clone().multiplyScalar(targetSpeed);

        if (this.katanaDashTimer > 0) {
            const dashDir = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
            this.vel.x = dashDir.x * 23;
            this.vel.z = dashDir.z * 23;
        } else if (this.onGround) {
            if (this.sliding) {
                // Smooth deceleration curve during slide with slight steering control
                const slideRatio = clamp(this.slideTimer / 0.86, 0, 1);
                const slideSpeed = lerp(7.8, 17.2, Math.pow(slideRatio, 0.62)) * (this.abilitySystem.has('speed') ? 1.2 : 1.0);
                const steerDir = this.slideDir.clone().addScaledVector(right, strafe * 0.14).normalize();
                this.vel.x = damp(this.vel.x, steerDir.x * slideSpeed, 14, dt);
                this.vel.z = damp(this.vel.z, steerDir.z * slideSpeed, 14, dt);
            } else {
                const accel = 18;
                this.vel.x = damp(this.vel.x, wishVel.x, accel, dt);
                this.vel.z = damp(this.vel.z, wishVel.z, accel, dt);
            }
        } else {
            const airAccel = 4.2;
            const curHoriz = Math.hypot(this.vel.x, this.vel.z);
            this.vel.x += wishVel.x * airAccel * dt;
            this.vel.z += wishVel.z * airAccel * dt;
            const newHoriz = Math.hypot(this.vel.x, this.vel.z);
            const maxAir = Math.max(targetSpeed * 1.15, curHoriz);
            if (newHoriz > maxAir) {
                const s = maxAir / newHoriz;
                this.vel.x *= s;
                this.vel.z *= s;
            }
        }

        if (this.input.hit('Space') && this.onGround) {
            if (this.sliding) {
                // Slide-Jump momentum preservation!
                this.vel.y = 10.2;
                this.vel.x *= 1.12;
                this.vel.z *= 1.12;
                this.sliding = false;
                this.crouching = false;
                audio.jump();
            } else {
                this.vel.y = 9.4;
                this.onGround = false;
                this.crouching = false;
                audio.jump();
            }
        }

        // Ability [F] activation: Teleport (Blink Step) or Telekinesis
        if (this.input.hit('KeyF')) {
            if (this.abilitySystem.has('teleport') && this._tpCooldown <= 0) {
                this._triggerTeleport(game);
            } else if (this.abilitySystem.has('telekinesis') && this._tkCooldown <= 0) {
                this._triggerTelekinesis(game);
            } else if (w && w.kind === 'katana' && this.parryCooldown <= 0) {
                this.parryTimer = 0.45;
                this.parryCooldown = 1.6;
                audio.katanaParry();
                game.ui.showCenterMsg('DEFLECT STANCE', 'PARRY READY', 600);
            }
        }

        this.vel.y -= 26 * dt;
        const wasGrounded = this.onGround;
        const preLandVelY = this.vel.y;
        this.onGround = this.world.moveAndSlide(this.pos, this.vel, this.radius, this.height, dt);
        if (!wasGrounded && this.onGround) {
            audio.land();
            this.landDip = clamp(-preLandVelY * 0.015, 0.03, 0.24);
            this.shake = Math.max(this.shake, clamp(-preLandVelY * 0.008, 0.02, 0.14));
        }

        const isKatana = w && w.kind === 'katana';
        if (isKatana) {
            this.ads = 0;
            if (this.input.hit('MouseRight') || (this.input.right && this.parryCooldown <= 0 && this.parryTimer <= 0 && !this._rmbLock)) {
                if (!this._rmbLock && this.parryCooldown <= 0) {
                    this.parryTimer = 0.45;
                    this.parryCooldown = 1.55;
                    audio.katanaParry();
                    game.ui.showCenterMsg('DEFLECT STANCE', 'PARRY ACTIVE', 600);
                }
            }
            this._rmbLock = this.input.right;
        } else {
            const wantAds = this.input.right && w && !w.reloading && w.kind !== 'knife';
            this.ads = damp(this.ads, wantAds ? 1 : 0, 14, dt);
        }

        if (this.input.hit('KeyR') && w) w.startReload();
        if (w && w.mag === 0 && !w.reloading && w.reserve > 0 && !w.melee) w.startReload();

        const wantFire = this.input.left;
        if (!wantFire) this._semiLock = false;
        if (w) {
            w.update(dt);
            const firePressed = w.auto ? wantFire : (wantFire && !this._semiLock);
            if (firePressed) {
                if (this.sukunaTimer > 0) {
                    this._fireDismantle(w, game);
                    this._semiLock = true;
                } else if (w.canFire()) {
                    this._fire(w, game);
                    this._semiLock = true;
                } else if (w.mag === 0 && w.reserve === 0 && !w.melee && !this._semiLock) {
                    audio.empty();
                    this._semiLock = true;
                }
            }
            if (this.sukunaTimer > 0 && this.input.right && this.sukunaSkills.cleave <= 0) {
                this.sukunaSkills.cleave = isTraining ? 0.35 : 3.0;
                this._fireCleave(game);
            }
        }
        this.triggerDown = wantFire;

        if (w && w.kind === 'katana') {
            if (this.parryTimer > 0) {
                w.mesh.position.set(0.06, -0.08, -0.34);
                w.mesh.rotation.set(0.15, 0.85, 1.15);
            } else {
                const swingT = Math.max(0, w.cooldown / (60 / w.rpm));
                if (swingT > 0.05) {
                    const slashPhase = Math.sin(swingT * Math.PI);
                    if (this.katanaCombo === 1) {
                        w.mesh.position.set(0.24 - slashPhase * 0.42, -0.18 + slashPhase * 0.08, -0.35 - slashPhase * 0.14);
                        w.mesh.rotation.set(0.1 - slashPhase * 0.5, 0.25 - slashPhase * 1.4, -0.3 + slashPhase * 1.5);
                    } else if (this.katanaCombo === 2) {
                        w.mesh.position.set(-0.18 + slashPhase * 0.44, -0.16 + slashPhase * 0.1, -0.35 - slashPhase * 0.14);
                        w.mesh.rotation.set(0.1 - slashPhase * 0.5, -0.35 + slashPhase * 1.4, 1.1 - slashPhase * 1.5);
                    } else {
                        w.mesh.position.set(0.14, -0.05 - slashPhase * 0.24, -0.32 - slashPhase * 0.24);
                        w.mesh.rotation.set(0.45 - slashPhase * 1.65, 0.05, 0.0);
                    }
                } else {
                    const hSpeed = Math.hypot(this.vel.x, this.vel.z);
                    const bob = Math.sin(this.walkPhase) * 0.012 * clamp(hSpeed / 8, 0, 1);
                    w.mesh.position.x = damp(w.mesh.position.x, 0.25 + bob, 14, dt);
                    w.mesh.position.y = damp(w.mesh.position.y, -0.21 + Math.abs(bob), 14, dt);
                    w.mesh.position.z = damp(w.mesh.position.z, -0.34, 14, dt);
                    w.mesh.rotation.x = damp(w.mesh.rotation.x, 0.14, 14, dt);
                    w.mesh.rotation.y = damp(w.mesh.rotation.y, 0.28, 14, dt);
                    w.mesh.rotation.z = damp(w.mesh.rotation.z, -0.32, 14, dt);
                }
            }
        }

        const hSpeed = Math.hypot(this.vel.x, this.vel.z);
        if (this.onGround && hSpeed > .6 && !this.sliding) {
            this.walkPhase += dt * hSpeed * 1.45;
            this.footstepT -= dt * (sprinting ? 1.5 : 1);
            if (this.footstepT <= 0) { this.footstepT = .44; audio.footstep(); }
        }

        this._updateCameraAndWeapon(dt, sprinting, this.sliding, isScoped);
    }

    _triggerTeleport(game) {
        const isTraining = game && game.mode === 'training';
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const hit = this.world.raycast(this.camera.position, dir, 15);
        const dist = hit.hit ? Math.max(1.2, hit.dist - 0.85) : 15;

        this.blinkFrom.copy(this.pos);
        this.blinkTo.copy(this.pos).addScaledVector(dir, dist);
        this.blinkTo.y = Math.max(this.blinkTo.y, 0.25);

        // Ensure destination is not stuck inside a collider
        const testVel = new THREE.Vector3();
        this.world.moveAndSlide(this.blinkTo, testVel, this.radius, this.height, 0.016);

        this.blinkTimer = this.blinkDuration;
        this.vel.y = Math.max(0, this.vel.y);
        this.fovOffset = Math.max(this.fovOffset, 18);
        this.shake = Math.max(this.shake, 0.14);

        this.effects.blinkTrail(this.blinkFrom, this.blinkTo);
        audio.teleport();

        const blinkEl = document.getElementById('blinkOverlay');
        if (blinkEl) {
            blinkEl.style.opacity = '1';
            setTimeout(() => { blinkEl.style.opacity = '0'; }, 180);
        }

        if (game.isMultiplayer && game.network) {
            game.network.broadcast({
                type: 'TELEPORT_VFX',
                senderId: game.network.myId,
                from: [this.blinkFrom.x, this.blinkFrom.y, this.blinkFrom.z],
                to: [this.blinkTo.x, this.blinkTo.y, this.blinkTo.z]
            });
        }

        if (isTraining) {
            this._tpCooldown = 0.35;
        } else {
            delete this.abilitySystem.active.teleport;
        }
    }

    _triggerTelekinesis(game) {
        const isTraining = game && game.mode === 'training';
        audio.telekinesis();
        this.effects.telekinesisWave(this.pos);
        this.shake = Math.max(this.shake, 0.28);

        const psyEl = document.getElementById('psyOverlay');
        if (psyEl) {
            psyEl.style.opacity = '0.85';
            setTimeout(() => { psyEl.style.opacity = '0'; }, 450);
        }

        let liftedCount = 0;
        for (const b of game.bots) {
            if (b.alive && b.pos.distanceTo(this.pos) < 20) {
                liftedCount++;
                b.applyTelekinesisLift(this.pos);
                game.damageBot(b, 25, false, b.pos.clone().add(new THREE.Vector3(0, 1.2, 0)));
            }
        }
        if (game.isMultiplayer && game.network) {
            game.network.broadcast({
                type: 'TK_VFX',
                senderId: game.network.myId,
                origin: [this.pos.x, this.pos.y, this.pos.z]
            });
            for (const id in game.network.players) {
                if (id === game.network.myId) continue;
                const pData = game.network.players[id];
                if (pData.state && pData.state.pos && new THREE.Vector3(...pData.state.pos).distanceTo(this.pos) < 20) {
                    liftedCount++;
                    game.network.broadcast({ type: 'TK_FREEZE', targetId: id });
                    game.network.broadcast({ type: 'HIT', targetId: id, damage: 35, attackerId: game.network.myId, attackerName: game.network.myName });
                }
            }
        }
        game.ui.showCenterMsg('TELEKINESIS', liftedCount > 0 ? `${liftedCount} TARGET${liftedCount > 1 ? 'S' : ''} SUSPENDED` : 'GRAVITY PULSE', 950);

        if (isTraining) {
            this._tkCooldown = 0.5;
        } else {
            delete this.abilitySystem.active.telekinesis;
        }
    }

    _updateCameraAndWeapon(dt, sprinting, sliding, isScoped) {
        const w = this.currentWeapon;
        const hSpeed = Math.hypot(this.vel.x, this.vel.z);

        // Strafe input for camera roll
        let strafe = 0;
        if (this.input.down('KeyD')) strafe += 1;
        if (this.input.down('KeyA')) strafe -= 1;

        // 1. Dynamic Camera Roll (slide tilt + strafe lean)
        const targetRoll = sliding ? -0.115 : (-strafe * 0.026 * (1 - this.ads * 0.7));
        this.camRoll = damp(this.camRoll, targetRoll, 11, dt);

        // 2. Slide upward pitch kick
        const targetSlidePitch = sliding ? 0.032 : 0;
        this.slidePitchKick = damp(this.slidePitchKick, targetSlidePitch, 12, dt);

        // 3. Landing dip recovery
        this.landDip = damp(this.landDip, 0, 14, dt);

        // 4. Head bobbing on camera
        const bobScale = (this.onGround && !sliding && hSpeed > 0.6)
            ? clamp(hSpeed / 11, 0, 1) * (1 - this.ads * 0.82) * (sprinting ? 0.052 : 0.03)
            : 0;
        const targetBobY = Math.abs(Math.sin(this.walkPhase)) * bobScale;
        const targetBobX = Math.cos(this.walkPhase * 0.5) * bobScale * 0.65;
        this.camBobY = damp(this.camBobY, targetBobY, 16, dt);
        this.camBobX = damp(this.camBobX, targetBobX, 16, dt);

        // 5. Dynamic FOV surge (sprint, slide, blink)
        const moveFovTarget = sliding ? 9.5 : (sprinting ? 5.0 : 0);
        this.fovOffset = damp(this.fovOffset, moveFovTarget, 9, dt);

        this.recoilPitch = damp(this.recoilPitch, 0, 10, dt);
        this.recoilYaw = damp(this.recoilYaw, 0, 12, dt);
        this.shake = damp(this.shake, 0, 14, dt);
        this.damageTint = damp(this.damageTint, 0, 4, dt);

        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
        const eyeY = this.pos.y + this.height - .12 - this.landDip + this.camBobY;
        this.camera.position.set(
            this.pos.x + right.x * this.camBobX + rand(-this.shake, this.shake) * .12,
            eyeY + rand(-this.shake, this.shake) * .12,
            this.pos.z + right.z * this.camBobX + rand(-this.shake, this.shake) * .12
        );
        _e1.set(
            this.pitch + this.recoilPitch + this.slidePitchKick,
            this.yaw + this.recoilYaw,
            this.camRoll + rand(-this.shake, this.shake) * 0.03,
            'YXZ'
        );
        this.camera.quaternion.setFromEuler(_e1);

        const zoomFov = w && (w.kind === 'sniper' || w.kind === 'kar98') ? 26 : 62;
        const targetFov = lerp(this.baseFov + this.fovOffset, zoomFov, this.ads);
        if (Math.abs(this.camera.fov - targetFov) > .05) {
            this.camera.fov = damp(this.camera.fov, targetFov, 14, dt);
            this.camera.updateProjectionMatrix();
        }

        if (w && w.kind !== 'katana') {
            const hipX = w.kind === 'knife' ? 0.2 : 0.22;
            const hipY = w.kind === 'knife' ? -0.18 : -0.2;
            const hipZ = w.kind === 'knife' ? -0.35 : -0.38;
            const adsX = 0, adsY = -0.145, adsZ = -0.26;
            const bob = Math.sin(this.walkPhase) * .009 * clamp(hSpeed / 8, 0, 1) * (1 - this.ads * .8);
            const wx = lerp(hipX, adsX, this.ads) + bob;
            const wy = lerp(hipY, adsY, this.ads) + Math.abs(bob) * .7;
            const wz = lerp(hipZ, adsZ, this.ads) + w.recoilKick;
            w.mesh.position.x = damp(w.mesh.position.x, wx, 18, dt);
            w.mesh.position.y = damp(w.mesh.position.y, wy, 18, dt);
            w.mesh.position.z = damp(w.mesh.position.z, wz, 22, dt);
            const relRot = w.reloading ? -.45 : 0;
            const sprintRot = (sprinting && !w.reloading && this.ads < .2) ? -.28 : 0;
            const slideTilt = sliding ? 0.16 : 0;
            w.mesh.rotation.x = damp(w.mesh.rotation.x, w.recoilRot + relRot + sprintRot, 16, dt);
            w.mesh.rotation.y = damp(w.mesh.rotation.y, 0, 16, dt);
            w.mesh.rotation.z = damp(w.mesh.rotation.z, slideTilt, 14, dt);
            w.mesh.visible = !isScoped && this.sukunaTimer <= 0;
        } else if (w && w.kind === 'katana') {
            w.mesh.visible = this.sukunaTimer <= 0;
        }
    }

    _fireDismantle(w, game) {
        w.cooldown = 0.17;
        const origin = this.camera.position.clone();
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        if (window.sukunaHandVfx) window.sukunaHandVfx.swing('dismantle');
        audio.shoot('dismantle', origin);

        const spawnPos = origin.clone().addScaledVector(dir, 1.15);
        const rollAngle = rand(-0.7, 0.7);
        this.effects.spawnSukunaSlash(spawnPos, dir, 'player', 52, 'dismantle', game, rollAngle);
        this.shake = Math.max(this.shake, 0.09);

        if (game.isMultiplayer && game.network) {
            game.network.broadcast({
                type: 'SUKUNA_SLASH',
                senderId: game.network.myId,
                origin: [spawnPos.x, spawnPos.y, spawnPos.z],
                dir: [dir.x, dir.y, dir.z],
                slashType: 'dismantle'
            });
        }
    }

    _fireCleave(game) {
        const origin = this.camera.position.clone();
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        if (window.sukunaHandVfx) window.sukunaHandVfx.swing('cleave');
        audio.shoot('dismantle', origin);
        this.shake = Math.max(this.shake, 0.34);

        const spawnPos = origin.clone().addScaledVector(dir, 1.3);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        // Fire a heavy 3-slash X-barrage of Cleave projectiles!
        const angles = [0, -0.78, 0.78];
        const spreads = [0, -0.055, 0.055];
        for (let i = 0; i < 3; i++) {
            const shotDir = dir.clone().addScaledVector(right, spreads[i]).normalize();
            this.effects.spawnSukunaSlash(spawnPos, shotDir, 'player', 110, 'cleave', game, angles[i]);
            if (game.isMultiplayer && game.network) {
                game.network.broadcast({
                    type: 'SUKUNA_SLASH',
                    senderId: game.network.myId,
                    origin: [spawnPos.x, spawnPos.y, spawnPos.z],
                    dir: [shotDir.x, shotDir.y, shotDir.z],
                    slashType: 'cleave'
                });
            }
        }
        game.ui.showCenterMsg('CLEAVE', 'HEAVY SLASH BARRAGE', 750);
    }

    _fire(w, game) {
        w.cooldown = 60 / w.rpm;
        const dmgMult = this.abilitySystem.has('damage') ? 1.5 : 1.0;

        if (w.melee) {
            const isKatana = w.kind === 'katana';
            const isSuper = isKatana && (this.katanaCombo === 2);
            const curCombo = this.katanaCombo;

            if (isKatana) {
                audio.katanaSlash(isSuper, curCombo);
                this.katanaCombo = (this.katanaCombo + 1) % 3;
                this.katanaComboTimer = 1.25;
                if (this.onGround && !this.crouching) {
                    this.katanaDashTimer = isSuper ? 0.16 : 0.10;
                }
                this.shake = Math.max(this.shake, isSuper ? 0.26 : 0.12);
                const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                this.effects.katanaSlashArc(this.camera.position, dir, isSuper, CAMO_COLORS[w.camo] || 0xff1e38);
                if (isSuper) {
                    this.effects.spawnSlashWave(
                        this.camera.position.clone().addScaledVector(dir, 1.1),
                        dir,
                        'player',
                        Math.round(70 * dmgMult),
                        game
                    );
                }
                if (game.isMultiplayer && game.network) {
                    const endP = this.camera.position.clone().addScaledVector(dir, w.range);
                    game.network.broadcast({
                        type: 'SHOOT',
                        senderId: game.network.myId,
                        origin: [this.camera.position.x, this.camera.position.y, this.camera.position.z],
                        to: [endP.x, endP.y, endP.z],
                        weapon: 'katana',
                        color: CAMO_COLORS[w.camo] || 0xff1e38
                    });
                }
            } else {
                w.recoilKick = -0.25;
                w.recoilRot = -0.8;
                audio.shoot(w.sound, this.camera.position);
            }

            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const meleeDmg = isKatana ? (isSuper ? (w.superDamage || 125) : w.damage) : w.damage;
            let hitSomething = false;

            for (const bot of game.bots) {
                if (!bot.alive) continue;
                const toBot = bot.pos.clone().add(new THREE.Vector3(0, 1.0, 0)).sub(this.camera.position);
                const dist = toBot.length();
                const dotMin = isKatana ? 0.55 : 0.72;
                if (dist <= w.range && toBot.normalize().dot(dir) > dotMin) {
                    const botFwd = new THREE.Vector3(Math.sin(bot.yaw), 0, Math.cos(bot.yaw));
                    const isBackstab = botFwd.dot(dir) > 0.5;
                    const dmg = Math.round((isBackstab ? 999 : meleeDmg) * dmgMult);
                    game.damageBot(bot, dmg, isBackstab, bot.pos.clone().add(new THREE.Vector3(0, 1, 0)), true);
                    hitSomething = true;
                    if (isBackstab) game.ui.showCenterMsg('BACKSTAB!', 'INSTANT KILL', 900);
                    else if (isSuper) game.ui.showCenterMsg('CRIMSON CLEAVE!', `${dmg} DMG`, 700);
                }
            }

            if (game.isMultiplayer && !game.isCoop() && game.network) {
                for (const id in game.network.players) {
                    if (id === game.network.myId) continue;
                    const pData = game.network.players[id];
                    if (!pData || !pData.state || pData.state.alive === false || !pData.state.pos) continue;
                    const rPos = new THREE.Vector3(...pData.state.pos).add(new THREE.Vector3(0, 1.0, 0));
                    const toR = rPos.clone().sub(this.camera.position);
                    const dist = toR.length();
                    const dotMin = isKatana ? 0.55 : 0.72;
                    if (dist <= w.range && toR.normalize().dot(dir) > dotMin) {
                        const rFwd = new THREE.Vector3(-Math.sin(pData.state.yaw || 0), 0, -Math.cos(pData.state.yaw || 0));
                        const isBackstab = rFwd.dot(dir) > 0.5;
                        const dmg = Math.round((isBackstab ? 999 : meleeDmg) * dmgMult);
                        game.network.broadcast({ type: 'HIT', targetId: id, damage: dmg, attackerId: game.network.myId, attackerName: game.network.myName, isMelee: true, headshot: isBackstab });
                        game.ui.showHitmarker(isBackstab);
                        game.ui.spawnDamageNum(dmg, isBackstab, rPos, this.camera);
                        hitSomething = true;
                        if (isBackstab) game.ui.showCenterMsg('BACKSTAB!', 'INSTANT KILL', 900);
                    }
                }
            }
            if (hitSomething && isKatana) audio.katanaHit(isSuper);
            return;
        }

        w.mag--; if (w.boltTime) w.boltTimer = w.boltTime;
        w.recoilKick = .09 * w.recoil; w.recoilRot = .14 * w.recoil;
        this.recoilPitch += .022 * w.recoil * lerp(1, .55, this.ads);
        this.recoilYaw += rand(-.012, .012) * w.recoil;
        this.shake = Math.max(this.shake, .16 * w.recoil);

        if (w.mesh.userData.muzzleLight) w.mesh.userData.muzzleLight.intensity = 7;
        const muzzleWorld = new THREE.Vector3(); w.mesh.userData.muzzle.getWorldPosition(muzzleWorld);
        const tracerColor = CAMO_COLORS[w.camo] || 0xffdd44;
        this.effects.muzzleFlash(muzzleWorld, tracerColor); audio.shoot(w.sound, muzzleWorld);

        const baseDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        if (w.projectile) {
            this.effects.spawnRocket(this.camera.position.clone().addScaledVector(baseDir, .6), baseDir, w.rocketSpeed, 'player', { ...w, damage: Math.round(w.damage * dmgMult), splashDamage: Math.round(w.splashDamage * dmgMult) });
            return;
        }

        const pellets = w.pellets || 1; const spread = lerp(w.spreadHip, w.spreadAds, this.ads);
        for (let p = 0; p < pellets; p++) {
            const dir = baseDir.clone(); dir.x += rand(-spread, spread); dir.y += rand(-spread, spread); dir.z += rand(-spread, spread); dir.normalize();
            game.fireRay(this.camera.position, dir, muzzleWorld, w, 'player', tracerColor, dmgMult);
        }
    }
    onHit(dmg, isMelee = false, attackerPos = null) {
        if (!this.alive || this.abilitySystem.has('infinity')) return;
        if (this.parryTimer > 0 && this.currentWeapon && this.currentWeapon.kind === 'katana') {
            this.parryTimer = 0.25;
            this.parryCooldown = 0.5;
            this.health = Math.min(this.maxHealth, this.health + 15);
            this.effects.katanaParry(this.pos.clone().add(new THREE.Vector3(0, 1.2, 0)));
            audio.katanaParry();
            if (window.game && window.game.ui) window.game.ui.showCenterMsg('KATANA PARRY!', 'BLOCKED +15 HP', 800);
            return;
        }
        if (isMelee) {
            this.health -= dmg;
        } else {
            if (this.shield > 0) { const absorb = Math.min(this.shield, dmg); this.shield -= absorb; dmg -= absorb; }
            this.health -= dmg;
        }
        this.damageTint = Math.min(1, this.damageTint + .65); this.shake = Math.max(this.shake, .32);
        if (attackerPos && window.game && window.game.ui) {
            window.game.ui.showDamageDirection(attackerPos, this.pos, this.yaw);
        }
        if (this.health <= 0) { this.health = 0; this.alive = false; }
    }
}

class Bot {
    constructor(scene, world, effects, spawnPos, wave, type = 'normal', isDummy = false, isMovingDummy = false) {
        this.scene = scene; this.world = world; this.effects = effects;
        this.pos = spawnPos.clone(); this.vel = new THREE.Vector3();
        this.type = type; this.isDummy = isDummy; this.isMovingDummy = isMovingDummy;

        const scale = type === 'boss' ? 1.65 : (type === 'tank' ? 1.35 : (type === 'rusher' ? 0.92 : 1.0));
        this.radius = .44 * scale; this.height = 1.8 * scale;
        this.maxHealth = isDummy ? 100 : (type === 'boss' ? (400 + wave * 80) : (type === 'tank' ? (160 + wave * 35) : (type === 'rusher' ? (65 + wave * 12) : (85 + wave * 20))));
        this.health = this.maxHealth; this.alive = true; this.onGround = false; this.yaw = rand(0, Math.PI * 2);
        this.fireCd = rand(.6, 1.6); this.strafeDir = pick([-1, 1]); this.strafeT = rand(1, 2.5);
        this.hitFlash = 0; this.walkPhase = rand(0, 6); this.confusedTimer = 0;

        // Telekinesis anti-gravity lift & slam state
        this.tkLiftTimer = 0;
        this.tkTargetY = 0;
        this.tkCasterPos = new THREE.Vector3();
        this.tkSlamPending = false;

        this.state = isDummy ? 'DUMMY' : 'PATROL'; this.stateT = 0; this.patrolTarget = this._pickPatrol();
        this.lastKnownPlayerPos = null; this.loseSightTimer = 0;
        this.flankDir = pick([-1, 1]);

        if (isDummy) { this.speed = isMovingDummy ? 4.5 : 0; this.accuracy = 0; this.fireRate = 999; this.damage = 0; }
        else if (type === 'boss') { this.speed = 4.6; this.accuracy = 0.045; this.fireRate = 0.14; this.damage = 14 + wave * 2; }
        else if (type === 'tank') { this.speed = 3.2; this.accuracy = 0.08; this.fireRate = 0.85; this.damage = 18 + wave * 3; }
        else if (type === 'rusher') { this.speed = 7.4; this.accuracy = 0.09; this.fireRate = 0.45; this.damage = 10 + wave * 2; }
        else { this.speed = clamp(4.6 + wave * .25, 4.6, 7.6); this.accuracy = clamp(.085 - wave * .005, .035, .085); this.fireRate = clamp(1.15 - wave * .08, .38, 1.15); this.damage = Math.round(12 + wave * 2.5); }

        this._buildMesh(scale);
    }
    _buildMesh(scale) {
        this.root = new THREE.Group(); this.root.position.copy(this.pos); this.root.scale.set(scale, scale, scale);
        let armorHex = 0x262e38, eyeHex = 0xff5a1a;
        if (this.isDummy) { armorHex = this.isMovingDummy ? 0x2a6a9c : 0x2a8c5a; eyeHex = 0x40d0ff; }
        else if (this.type === 'boss') { armorHex = 0x1a0808; eyeHex = 0xff0000; }
        else if (this.type === 'tank') { armorHex = 0x4a2a1a; eyeHex = 0xffaa00; }
        else if (this.type === 'rusher') { armorHex = 0x2a1a4a; eyeHex = 0xd040ff; }

        const armor = new THREE.MeshStandardMaterial({ color: armorHex, metalness: .65, roughness: .35 });
        const trim = new THREE.MeshStandardMaterial({ color: 0x3b4654, metalness: .7, roughness: .4 });
        const eyeMat = new THREE.MeshStandardMaterial({ color: eyeHex, emissive: eyeHex, emissiveIntensity: 3.5 });
        this.armorMat = armor; this.baseArmorColor = new THREE.Color(armorHex);

        const torso = new THREE.Mesh(new THREE.BoxGeometry(.62, .72, .34), armor); torso.position.y = 1.06; torso.castShadow = true;
        const chest = new THREE.Mesh(new THREE.BoxGeometry(.5, .42, .38), trim); chest.position.y = 1.14;
        const head = new THREE.Mesh(new THREE.BoxGeometry(.36, .36, .36), armor); head.position.y = 1.62; head.castShadow = true;
        const visor = new THREE.Mesh(new THREE.BoxGeometry(.3, .1, .04), eyeMat); visor.position.set(0, 1.63, .19);
        const legGeo = new THREE.BoxGeometry(.22, .68, .24);
        this.legL = new THREE.Mesh(legGeo, trim); this.legL.position.set(-.17, .34, 0);
        this.legR = new THREE.Mesh(legGeo, trim); this.legR.position.set(.17, .34, 0);
        const armGeo = new THREE.BoxGeometry(.18, .6, .2);
        this.armL = new THREE.Mesh(armGeo, trim); this.armL.position.set(-.42, 1.05, 0);
        this.armR = new THREE.Mesh(armGeo, trim); this.armR.position.set(.42, 1.05, .1);
        const gun = new THREE.Mesh(new THREE.BoxGeometry(.09, .1, .6), new THREE.MeshStandardMaterial({ color: 0x11151b, metalness: .8 }));
        gun.position.set(.42, 1.02, .38);

        // Telekinesis gravity suspension halo (hidden until lifted)
        this.tkRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.68, 0.045, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0xbb33ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
        );
        this.tkRing.rotation.x = Math.PI / 2;
        this.tkRing.position.y = 0.9;
        this.tkRing.visible = false;

        // Flashbang stun halo above head (hidden until flashed)
        this.stunRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.28, 0.025, 6, 16),
            new THREE.MeshBasicMaterial({ color: 0xffee55, transparent: true, opacity: 0.92 })
        );
        this.stunRing.rotation.x = Math.PI / 2;
        this.stunRing.position.y = 1.98;
        this.stunRing.visible = false;

        const barBg = new THREE.Mesh(new THREE.PlaneGeometry(.75, .09), new THREE.MeshBasicMaterial({ color: 0x0a0d12, side: THREE.DoubleSide }));
        barBg.position.y = 2.02;
        this.barFill = new THREE.Mesh(new THREE.PlaneGeometry(.71, .055), new THREE.MeshBasicMaterial({ color: eyeHex, side: THREE.DoubleSide }));
        this.barFill.position.set(0, 2.02, .005);
        this.hpGroup = new THREE.Group(); this.hpGroup.add(barBg, this.barFill);
        this.root.add(torso, chest, head, visor, this.legL, this.legR, this.armL, this.armR, gun, this.tkRing, this.stunRing, this.hpGroup);
        this.scene.add(this.root);
    }
    applyTelekinesisLift(casterPos) {
        this.tkLiftTimer = 1.25;
        this.tkTargetY = this.pos.y + 3.8;
        if (casterPos) this.tkCasterPos.copy(casterPos);
        this.tkSlamPending = true;
        this.onGround = false;
        this.vel.y = 9.5;
        this.confusedTimer = Math.max(this.confusedTimer, 2.4);
        if (this.tkRing) this.tkRing.visible = true;
        if (this.effects) {
            this.effects.shockRing(this.pos, 0xaa00ff, 2.2, 0.45);
        }
    }
    _pickPatrol() { const pts = this.world.botSpawns; return pts && pts.length ? pick(pts).clone() : new THREE.Vector3(rand(-20, 20), 0, rand(-20, 20)); }
    _hasLOS(playerPos) {
        const eye = this.pos.clone().add(new THREE.Vector3(0, this.height * .85, 0));
        const target = playerPos.clone().add(new THREE.Vector3(0, 1.3, 0));
        const toP = target.clone().sub(eye); const dist = toP.length();
        if (dist > 45) return false;
        const wHit = this.world.raycast(eye, toP.clone().normalize(), dist);
        return !wHit.hit;
    }
    update(dt, player, game) {
        if (!this.alive) return;
        this.hitFlash = damp(this.hitFlash, 0, 14, dt);
        this.armorMat.emissive.setHex(this.hitFlash > .1 ? 0xffffff : 0x000000);
        this.armorMat.emissiveIntensity = this.hitFlash * 2;
        if (this.confusedTimer > 0) this.confusedTimer -= dt;

        // Update stun halo above head when flashed/stunned
        if (this.stunRing) {
            this.stunRing.visible = this.confusedTimer > 0;
            if (this.stunRing.visible) {
                this.stunRing.rotation.z += dt * 5;
                this.stunRing.position.y = 1.98 + Math.sin(performance.now() * 0.01) * 0.04;
            }
        }

        // Telekinesis anti-gravity suspension & slam physics!
        if (this.tkLiftTimer > 0) {
            this.tkLiftTimer -= dt;
            const heightDiff = this.tkTargetY - this.pos.y;
            this.vel.y = clamp(heightDiff * 6.5, -2, 11) + Math.sin(performance.now() * 0.01) * 1.2;
            this.vel.x *= 0.88;
            this.vel.z *= 0.88;
            this.onGround = this.world.moveAndSlide(this.pos, this.vel, this.radius, this.height, dt);
            this.root.position.copy(this.pos);
            this.root.rotation.z = Math.sin(performance.now() * 0.008) * 0.28;
            this.root.rotation.x = Math.cos(performance.now() * 0.007) * 0.22;
            if (this.tkRing) {
                this.tkRing.visible = true;
                this.tkRing.rotation.z += dt * 6;
                this.tkRing.scale.setScalar(1 + Math.sin(performance.now() * 0.015) * 0.14);
            }
            this.hpGroup.lookAt(player.camera.position);
            return;
        } else {
            this.root.rotation.z = damp(this.root.rotation.z, 0, 12, dt);
            this.root.rotation.x = damp(this.root.rotation.x, 0, 12, dt);
            if (this.tkRing) this.tkRing.visible = false;
            if (this.tkSlamPending) {
                this.tkSlamPending = false;
                this.vel.y = -34;
                this.effects.shockRing(this.pos, 0xaa00ff, 2.8, 0.36);
                this.effects.sparks(this.pos.clone().add(new THREE.Vector3(0, 0.4, 0)), 0xbb33ff, 12, 7);
                if (game && game.damageBot) {
                    game.damageBot(this, 55, false, this.pos.clone().add(new THREE.Vector3(0, 0.8, 0)));
                }
            }
        }

        if (this.isDummy) {
            if (this.isMovingDummy) {
                this.strafeT -= dt; if (this.strafeT <= 0) { this.strafeT = 2.2; this.strafeDir *= -1; }
                this.vel.x = this.strafeDir * this.speed; this.vel.z = 0; this.yaw = 0;
                this.walkPhase += dt * 7; this.legL.rotation.x = Math.sin(this.walkPhase) * .5; this.legR.rotation.x = -Math.sin(this.walkPhase) * .5;
            } else { this.vel.x = 0; this.vel.z = 0; }
            this.vel.y -= 26 * dt; this.onGround = this.world.moveAndSlide(this.pos, this.vel, this.radius, this.height, dt);
            this.root.position.copy(this.pos); this.root.rotation.y = this.yaw; this.hpGroup.lookAt(player.camera.position);
            return;
        }

        const toP = _v1.subVectors(player.pos, this.pos); const dist = Math.hypot(toP.x, toP.z);
        const hasLOS = player.alive && this._hasLOS(player.pos);
        if (hasLOS) { this.lastKnownPlayerPos = player.pos.clone(); this.loseSightTimer = 4.0; }
        else if (this.loseSightTimer > 0) this.loseSightTimer -= dt;

        if (!player.alive) this.state = 'PATROL';
        else if (this.confusedTimer > 0) this.state = 'CONFUSED';
        else if (this.health < this.maxHealth * 0.25 && this.type !== 'rusher' && this.type !== 'boss') this.state = 'RETREAT';
        else if (hasLOS) {
            if (this.type === 'rusher' || this.type === 'boss') this.state = 'RUSH';
            else if (dist < 16) this.state = 'ENGAGE';
            else this.state = 'FLANK';
        } else if (this.loseSightTimer > 0 && this.lastKnownPlayerPos) this.state = 'HUNT';
        else this.state = 'PATROL';

        let desiredVelX = 0, desiredVelZ = 0, targetYaw = this.yaw;

        if (this.state === 'CONFUSED') {
            this.yaw += dt * 4.5;
            desiredVelX = Math.cos(this.yaw) * this.speed * 0.35;
            desiredVelZ = Math.sin(this.yaw) * this.speed * 0.35;
        } else if (this.state === 'PATROL') {
            const toT = this.patrolTarget.clone().sub(this.pos); toT.y = 0;
            if (toT.length() < 2.2) this.patrolTarget = this._pickPatrol();
            toT.normalize(); desiredVelX = toT.x * this.speed * 0.65; desiredVelZ = toT.z * this.speed * 0.65;
            targetYaw = Math.atan2(toT.x, toT.z);
        } else if (this.state === 'HUNT') {
            const toL = this.lastKnownPlayerPos.clone().sub(this.pos); toL.y = 0;
            if (toL.length() < 1.5) this.loseSightTimer = 0;
            else { toL.normalize(); desiredVelX = toL.x * this.speed * 0.9; desiredVelZ = toL.z * this.speed * 0.9; targetYaw = Math.atan2(toL.x, toL.z); }
        } else if (this.state === 'RETREAT') {
            const away = new THREE.Vector3(-toP.x, 0, -toP.z).normalize();
            desiredVelX = away.x * this.speed * 1.1; desiredVelZ = away.z * this.speed * 1.1;
            targetYaw = Math.atan2(toP.x, toP.z);
        } else if (this.state === 'RUSH') {
            const fwd = new THREE.Vector3(toP.x, 0, toP.z).normalize();
            const side = new THREE.Vector3(-fwd.z, 0, fwd.x).multiplyScalar(this.flankDir * 0.35);
            const dir = fwd.add(side).normalize();
            desiredVelX = dir.x * this.speed * 1.15; desiredVelZ = dir.z * this.speed * 1.15;
            targetYaw = Math.atan2(toP.x, toP.z);
        } else if (this.state === 'FLANK') {
            const fwd = new THREE.Vector3(toP.x, 0, toP.z).normalize();
            const side = new THREE.Vector3(-fwd.z, 0, fwd.x).multiplyScalar(this.flankDir * 0.85);
            const dir = fwd.multiplyScalar(0.55).add(side).normalize();
            desiredVelX = dir.x * this.speed; desiredVelZ = dir.z * this.speed;
            targetYaw = Math.atan2(toP.x, toP.z);
        } else {
            this.strafeT -= dt; if (this.strafeT <= 0) { this.strafeT = rand(1.1, 2.4); this.strafeDir *= -1; }
            const fwd = new THREE.Vector3(toP.x, 0, toP.z).normalize(); const side = new THREE.Vector3(-fwd.z, 0, fwd.x);
            let moveF = 0; if (dist > 14) moveF = .6; else if (dist < 6) moveF = -.6;
            desiredVelX = (fwd.x * moveF + side.x * this.strafeDir * .85) * this.speed;
            desiredVelZ = (fwd.z * moveF + side.z * this.strafeDir * .85) * this.speed;
            targetYaw = Math.atan2(toP.x, toP.z);
        }

        let dyaw = targetYaw - this.yaw; while (dyaw > Math.PI) dyaw -= Math.PI * 2; while (dyaw < -Math.PI) dyaw += Math.PI * 2;
        this.yaw += dyaw * clamp(8 * dt, 0, 1);

        if (this.onGround && Math.hypot(desiredVelX, desiredVelZ) > 0.5) {
            const probeDir = new THREE.Vector3(desiredVelX, 0, desiredVelZ).normalize();
            const wallCheck = this.world.raycast(this.pos.clone().add(new THREE.Vector3(0, 0.5, 0)), probeDir, 1.3);
            if (wallCheck.hit) { this.vel.y = 9.0; this.onGround = false; }
        }

        this.vel.x = damp(this.vel.x, desiredVelX, 10, dt); this.vel.z = damp(this.vel.z, desiredVelZ, 10, dt); this.vel.y -= 26 * dt;
        this.onGround = this.world.moveAndSlide(this.pos, this.vel, this.radius, this.height, dt);
        this.root.position.copy(this.pos); this.root.rotation.y = this.yaw;
        const hSpd = Math.hypot(this.vel.x, this.vel.z);
        if (hSpd > .4) { this.walkPhase += dt * hSpd * 1.9; this.legL.rotation.x = Math.sin(this.walkPhase) * .55; this.legR.rotation.x = -Math.sin(this.walkPhase) * .55; }
        else { this.legL.rotation.x = damp(this.legL.rotation.x, 0, 10, dt); this.legR.rotation.x = damp(this.legR.rotation.x, 0, 10, dt); }
        this.hpGroup.lookAt(player.camera.position);

        this.fireCd -= dt;
        if (this.fireCd <= 0 && hasLOS && this.confusedTimer <= 0) {
            this.fireCd = this.fireRate * rand(.8, 1.25);
            const eye = this.pos.clone().add(new THREE.Vector3(0, this.height * .82, 0));
            const target = player.pos.clone().add(new THREE.Vector3(0, player.height * .7, 0));
            const dir = target.sub(eye).normalize();
            dir.x += rand(-this.accuracy, this.accuracy); dir.y += rand(-this.accuracy, this.accuracy); dir.z += rand(-this.accuracy, this.accuracy); dir.normalize();
            game.botFire(this, eye, dir);
        }
    }
    takeDamage(dmg, head) {
        if (!this.alive) return false; this.health -= dmg; this.hitFlash = 1;
        const k = clamp(this.health / this.maxHealth, 0, 1); this.barFill.scale.x = Math.max(.001, k); this.barFill.position.x = -(1 - k) * .355;
        if (this.health <= 0) { this.alive = false; this.dispose(); return true; }
        return false;
    }
    dispose() {
        this.scene.remove(this.root);
        const disposedGeos = new Set();
        const disposedMats = new Set();
        this.root.traverse(o => {
            if (o.geometry && !disposedGeos.has(o.geometry)) { disposedGeos.add(o.geometry); o.geometry.dispose(); }
            if (o.material && !disposedMats.has(o.material)) { disposedMats.add(o.material); o.material.dispose(); }
        });
    }
}

class UI {
    constructor() {
        const $ = id => document.getElementById(id);
        this.els = {
            hpVal: $('hpVal'), hpFill: $('hpFill'), shieldVal: $('shieldVal'), shieldFill: $('shieldFill'),
            medkitCount: $('medkitCount'), flashbangCount: $('flashbangCount'),
            waveVal: $('waveVal'), scoreVal: $('scoreVal'), enemiesVal: $('enemiesVal'),
            weaponName: $('weaponName'), ammoCur: $('ammoCur'), ammoRes: $('ammoRes'),
            reloadBar: $('reloadBar'), reloadFill: $('reloadFill'),
            xhair: $('xhair'), scope: $('scope'), hitmarker: $('hitmarker'), dmgVignette: $('dmgVignette'),
            killFeed: $('killFeed'), centerBanner: $('centerBanner'), cbTitle: $('cbTitle'), cbSub: $('cbSub'),
            pauseOverlay: $('pauseOverlay'), endOverlay: $('endOverlay'), endTitle: $('endTitle'), endStats: $('endStats'),
            dmgLayer: $('dmgLayer'), pointsDisplay: $('pointsDisplay'), shopPoints: $('shopPoints'),
            abilityHud: $('abilityHud'), streakHud: $('streakHud'), dirIndicator: $('dirIndicator'),
            clashOverlay: $('clashOverlay'), clashYouBar: $('clashYouBar'), clashOppBar: $('clashOppBar'),
            clashTimer: $('clashTimer'), flashOverlay: $('flashOverlay'),
            deathCam: $('deathCam'), dcKiller: $('dcKiller'), dcWeapon: $('dcWeapon'), dcTimer: $('dcTimer'),
            skullPop: $('skullPop'), speedVal: $('speedVal'),
            radarWrap: $('radarWrap'), radarDots: $('radarDots')
        };
        // Ensure psychic & blink overlays exist
        if (!document.getElementById('psyOverlay')) {
            const p = document.createElement('div');
            p.id = 'psyOverlay';
            document.body.appendChild(p);
        }
        if (!document.getElementById('blinkOverlay')) {
            const b = document.createElement('div');
            b.id = 'blinkOverlay';
            document.body.appendChild(b);
        }
        this._hmTimer = null; this._cbTimer = null; this._flashRaf = 0; this._dirTimer = null; this._skullTimer = null;
    }
    showHitmarker(head) {
        const hm = this.els.hitmarker; if (!hm) return; hm.className = 'show' + (head ? ' head' : '');
        clearTimeout(this._hmTimer); this._hmTimer = setTimeout(() => { hm.className = ''; }, 140);
    }
    popSkull() {
        const sk = this.els.skullPop; if (!sk) return;
        sk.classList.remove('show');
        void sk.offsetWidth;
        sk.classList.add('show');
        clearTimeout(this._skullTimer);
        this._skullTimer = setTimeout(() => sk.classList.remove('show'), 700);
    }
    showDamageDirection(attackerPos, playerPos, playerYaw) {
        const ind = this.els.dirIndicator; if (!ind || !attackerPos || !playerPos) return;
        const dx = attackerPos.x - playerPos.x;
        const dz = attackerPos.z - playerPos.z;
        const angleToAttacker = Math.atan2(-dx, -dz);
        let rel = angleToAttacker - playerYaw;
        while (rel > Math.PI) rel -= Math.PI * 2;
        while (rel < -Math.PI) rel += Math.PI * 2;
        const deg = -rel * (180 / Math.PI);
        ind.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
        ind.classList.add('show');
        clearTimeout(this._dirTimer);
        this._dirTimer = setTimeout(() => ind.classList.remove('show'), 650);
    }
    addKillFeed(text, head) {
        if (!this.els.killFeed) return;
        const el = document.createElement('div'); el.className = 'kf-item' + (head ? ' head' : ''); el.textContent = text;
        this.els.killFeed.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 350); }, 2800);
    }
    showCenterMsg(title, sub, dur = 1600) {
        if (!this.els.cbTitle || !this.els.centerBanner) return;
        this.els.cbTitle.textContent = title; this.els.cbSub.textContent = sub || '';
        this.els.centerBanner.classList.add('show');
        clearTimeout(this._cbTimer); this._cbTimer = setTimeout(() => this.els.centerBanner.classList.remove('show'), dur);
    }
    flashbang(intensity = 1.0) {
        const el = this.els.flashOverlay;
        if (!el) return;
        if (this._flashRaf) cancelAnimationFrame(this._flashRaf);
        const peak = clamp(intensity, 0.35, 1.0);
        // Disable CSS transition during initial snap so it flashes instantaneously
        el.style.transition = 'none';
        el.style.opacity = String(peak);
        const start = performance.now();
        const holdMs = 550 * peak;
        const fadeMs = 1950 * peak;
        const step = (now) => {
            const elapsed = now - start;
            if (elapsed <= holdMs) {
                el.style.opacity = String(peak);
                this._flashRaf = requestAnimationFrame(step);
            } else if (elapsed <= holdMs + fadeMs) {
                const t = (elapsed - holdMs) / fadeMs;
                const val = peak * Math.pow(1 - t, 1.6);
                el.style.opacity = val.toFixed(3);
                this._flashRaf = requestAnimationFrame(step);
            } else {
                el.style.opacity = '0';
                el.style.transition = '';
                this._flashRaf = 0;
            }
        };
        this._flashRaf = requestAnimationFrame(step);
    }
    spawnDamageNum(dmg, head, worldPos, camera) {
        if (!this.els.dmgLayer) return;
        const p = worldPos.clone().project(camera); if (p.z > 1) return;
        const x = (p.x * .5 + .5) * innerWidth + rand(-18, 18), y = (-p.y * .5 + .5) * innerHeight + rand(-10, 10);
        const el = document.createElement('div'); el.className = 'dmg-num' + (head ? ' head' : ''); el.textContent = dmg;
        el.style.left = x + 'px'; el.style.top = y + 'px'; this.els.dmgLayer.appendChild(el);
        setTimeout(() => el.remove(), 700);
    }
    update(player, game) {
        if (!player) return;
        const hp = Math.ceil(player.health);
        if (this.els.hpVal) {
            this.els.hpVal.textContent = hp;
            this.els.hpVal.className = 'num' + (hp <= 25 ? ' low' : '');
        }
        if (this.els.hpFill) this.els.hpFill.style.width = clamp(player.health / player.maxHealth * 100, 0, 100) + '%';
        if (this.els.shieldVal) this.els.shieldVal.textContent = Math.ceil(player.shield);
        if (this.els.shieldFill) this.els.shieldFill.style.width = clamp(player.shield, 0, 100) + '%';
        if (this.els.medkitCount) this.els.medkitCount.textContent = player.medkits;
        if (this.els.flashbangCount) this.els.flashbangCount.textContent = player.flashbangs;

        if (this.els.speedVal) {
            const spd = Math.round(Math.hypot(player.vel.x, player.vel.z) * 10);
            this.els.speedVal.textContent = spd;
        }

        if (this.els.waveVal) {
            if (game.isMultiplayer) this.els.waveVal.textContent = game.mode === 'PVP' ? 'PVP' : (game.mode === '1V1' ? '1V1' : 'COOP');
            else this.els.waveVal.textContent = game.mode === 'training' ? 'TRN' : game.wave;
        }
        if (this.els.scoreVal) this.els.scoreVal.textContent = game.kills;
        if (this.els.enemiesVal) {
            if (game.isMultiplayer && !game.isCoop()) this.els.enemiesVal.textContent = Object.keys(game.network.players).length;
            else this.els.enemiesVal.textContent = game.bots.filter(b => b.alive).length;
        }

        const w = player.currentWeapon;
        if (w) {
            if (this.els.weaponName) {
                if (player.sukunaTimer > 0) {
                    this.els.weaponName.textContent = 'MALEVOLENT VESSEL · LMB DISMANTLE · RMB CLEAVE · Q FUGA · E DOMAIN';
                } else if (w.kind === 'katana') {
                    const cLabel = player.parryTimer > 0 ? 'PARRY ACTIVE' : `COMBO ${player.katanaCombo + 1}/3`;
                    this.els.weaponName.textContent = `${w.name} · ${cLabel}`;
                } else {
                    this.els.weaponName.textContent = w.name;
                }
            }
            if (this.els.ammoCur) {
                this.els.ammoCur.textContent = (w.melee || player.sukunaTimer > 0) ? '∞' : w.mag;
                this.els.ammoCur.className = 'cur' + (!w.melee && player.sukunaTimer <= 0 && w.mag <= Math.ceil(w.maxMag * .25) ? ' low' : '');
            }
            if (this.els.ammoRes) this.els.ammoRes.textContent = (w.melee || player.sukunaTimer > 0) ? '' : '/ ' + w.reserve;
            if (this.els.reloadBar) {
                if (w.reloading && !w.melee) {
                    this.els.reloadBar.classList.add('show');
                    const maxT = w.shellReload ? 0.55 : w.reloadTime;
                    this.els.reloadFill.style.width = clamp((1 - w.reloadTimer / maxT) * 100, 0, 100) + '%';
                } else if (player.healTimer > 0) {
                    this.els.reloadBar.classList.add('show');
                    this.els.reloadFill.style.width = clamp((1 - player.healTimer / 1.6) * 100, 0, 100) + '%';
                } else {
                    this.els.reloadBar.classList.remove('show');
                }
            }
            const isScoped = (w.kind === 'sniper' || w.kind === 'kar98') && player.ads > .35;
            if (this.els.scope) this.els.scope.classList.toggle('show', isScoped);
            if (this.els.xhair) {
                this.els.xhair.style.opacity = isScoped ? 0 : 1;
                const spreadPx = clamp(6 + ((w.spreadHip || 0) * (1 - player.ads) + (w.spreadAds || 0) * player.ads) * 320 + Math.hypot(player.vel.x, player.vel.z) * .7 + player.recoilPitch * 120, 4, 48);
                this.els.xhair.style.setProperty('--spread', spreadPx + 'px');
            }
        }
        if (this.els.dmgVignette) this.els.dmgVignette.style.opacity = player.damageTint * .9;

        if (this.els.abilityHud) {
            const activeKeys = Object.keys(game.abilitySystem.active);
            const isTraining = game.mode === 'training';
            let html = activeKeys.map(k => {
                const timeText = isTraining ? '∞' : `${Math.ceil(game.abilitySystem.active[k])}s`;
                return `<div class="ab-pill ${k}">${game.abilitySystem.labels[k] || k.toUpperCase()} (${timeText})</div>`;
            }).join('');
            if (player.sukunaTimer > 0) {
                const sTime = isTraining ? '∞' : `${Math.ceil(player.sukunaTimer)}s`;
                html += `<div class="ab-pill damage">SUKUNA VESSEL (${sTime})</div>`;
            }
            this.els.abilityHud.innerHTML = html;
        }

        if (this.els.streakHud) {
            const pills = [];
            if (player.streaks.uavTimer > 0) pills.push(`<div class="streak-pill uav">UAV RECON (${Math.ceil(player.streaks.uavTimer)}s)</div>`);
            if (player.streaks.stim || player.streaks.stimTimer > 0) {
                pills.push(player.streaks.stimTimer > 0
                    ? `<div class="streak-pill stim">STIM ACTIVE (${Math.ceil(player.streaks.stimTimer)}s)</div>`
                    : `<div class="streak-pill stim">OVERDRIVE STIM READY [Z]</div>`);
            }
            if (player.streaks.orbital) pills.push(`<div class="streak-pill orbital">ORBITAL STRIKE READY [X]</div>`);
            this.els.streakHud.innerHTML = pills.join('');
        }

        if (this.els.radarDots && this.els.radarWrap && this.els.radarWrap.style.display !== 'none') {
            this._updateRadar(player, game);
        }
    }
    _updateRadar(player, game) {
        const dots = [];
        const maxRange = 45;
        const scale = 60 / maxRange;
        const cos = Math.cos(player.yaw);
        const sin = Math.sin(player.yaw);
        const addDot = (worldPos, cls) => {
            const dx = worldPos.x - player.pos.x;
            const dz = worldPos.z - player.pos.z;
            const rx = dx * cos - dz * sin;
            const rz = dx * sin + dz * cos;
            const dist = Math.hypot(rx, rz);
            const clamped = Math.min(dist, maxRange);
            const ratio = dist > 0.001 ? (clamped / dist) : 0;
            const px = 65 + rx * ratio * scale;
            const py = 65 + rz * ratio * scale;
            dots.push(`<div class="radar-dot ${cls}" style="left:${px.toFixed(1)}px;top:${py.toFixed(1)}px"></div>`);
        };
        for (const b of game.bots) {
            if (b.alive) addDot(b.pos, 'enemy');
        }
        if (game.isMultiplayer && game.network) {
            for (const id in game.network.players) {
                if (id === game.network.myId) continue;
                const pData = game.network.players[id];
                if (pData && pData.state && pData.state.alive !== false && pData.state.pos) {
                    addDot(new THREE.Vector3(...pData.state.pos), game.isCoop() ? 'ally' : 'enemy');
                }
            }
        }
        for (const p of game.abilitySystem.pickups) {
            addDot(p.g.position, 'pickup');
        }
        this.els.radarDots.innerHTML = dots.join('');
    }
    updatePoints() {
        const pts = SaveSystem.data.points;
        if (this.els.pointsDisplay) this.els.pointsDisplay.textContent = pts;
        if (this.els.shopPoints) this.els.shopPoints.textContent = pts;
    }
}

function buildRemoteAvatar(name, skinColor = '#e8ecf0', uiColor = '#ff7a1a') {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(skinColor), metalness: 0.45, roughness: 0.45 });
    const accentMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(uiColor), emissive: new THREE.Color(uiColor), emissiveIntensity: 1.5 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x161b22, metalness: 0.7, roughness: 0.35 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.32), bodyMat); torso.position.y = 1.06; torso.castShadow = true;
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.36), darkMat); vest.position.y = 1.14;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.06, 0.38), accentMat); stripe.position.y = 1.24;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), bodyMat); head.position.y = 1.62; head.castShadow = true;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.10, 0.05), accentMat); visor.position.set(0, 1.63, -0.18);

    const legGeo = new THREE.BoxGeometry(0.21, 0.68, 0.23);
    const legL = new THREE.Mesh(legGeo, darkMat); legL.position.set(-0.16, 0.34, 0);
    const legR = new THREE.Mesh(legGeo, darkMat); legR.position.set(0.16, 0.34, 0);

    const armGeo = new THREE.BoxGeometry(0.17, 0.58, 0.19);
    const armL = new THREE.Mesh(armGeo, bodyMat); armL.position.set(-0.40, 1.05, 0);
    const armR = new THREE.Mesh(armGeo, bodyMat); armR.position.set(0.40, 1.05, -0.08);

    const tkRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.04, 8, 22),
        new THREE.MeshBasicMaterial({ color: 0xbb33ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
    );
    tkRing.rotation.x = Math.PI / 2;
    tkRing.position.y = 0.95;
    tkRing.visible = false;

    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(10, 14, 20, 0.72)'; ctx.fillRect(16, 12, 224, 40);
    ctx.strokeStyle = uiColor; ctx.lineWidth = 3; ctx.strokeRect(16, 12, 224, 40);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(name || 'PLAYER', 128, 32);
    const tagTex = new THREE.CanvasTexture(canvas);
    const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTex, transparent: true }));
    tag.position.y = 2.08; tag.scale.set(1.5, 0.38, 1);

    g.add(torso, vest, stripe, head, visor, legL, legR, armL, armR, tkRing, tag);
    g.userData = { legs: [legL, legR], arms: [armL, armR], tkRing };
    return g;
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(innerWidth, innerHeight); this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.48;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(SaveSystem.data.settings.fov, innerWidth / innerHeight, .08, 250);
        this.scene.add(this.camera);

        this.input = new Input(this.canvas);
        this.ui = new UI();
        this.network = new NetworkManager(this);
        this.effects = new EffectsSystem(this.scene);
        this.abilitySystem = new AbilitySystem(this.scene, this);

        this.world = null; this.player = null; this.bots = [];
        this.remoteMeshes = {}; this._remoteDeathState = {};
        this.medkitDrops = []; this.flashbangs = [];
        this.mode = 'wave'; this.selectedMap = 'blacksite';
        this.isMultiplayer = false; this.running = false; this.paused = false;
        this.wave = 1; this.kills = 0; this.pointsEarned = 0;
        this.waveClearTimer = 0; this.countdownTimer = 0; this.countdownLastSec = 0;
        this.domainActive = false; this.domainGroup = null; this.domainCenter = null; this.domainTimer = 0;
        this.clash = null; this.respawnTimer = 0;
        this.lastAttacker = null; this.lastAttackerName = 'RIVAL'; this.lastHitHeadshot = false;
        this._streakCount = 0; this._streakTimer = 0;
        this._orbStrikes = [];

        this.selectedShopWeapon = 'rifle';
        this.selectedShopCamo = 'default';
        this.selectedLoadoutSlot = 0;

        this._setupUI();
        this._bindEvents();
        this._buildMenuPreview();
        music.playMenu();

        this._lastTime = performance.now();
        requestAnimationFrame(t => this._loop(t));
    }

    isCoop() { return this.mode === 'COOP'; }

    _buildMenuPreview() {
        const container = document.getElementById('menuPreview');
        if (!container || typeof THREE === 'undefined') return;
        this._previewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this._previewRenderer.setSize(container.clientWidth || 320, container.clientHeight || 420);
        this._previewRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        container.appendChild(this._previewRenderer.domElement);

        this._previewScene = new THREE.Scene();
        this._previewCam = new THREE.PerspectiveCamera(42, (container.clientWidth || 320) / (container.clientHeight || 420), 0.1, 50);
        this._previewCam.position.set(0, 1.35, 3.2);
        this._previewCam.lookAt(0, 1.05, 0);

        this._previewScene.add(new THREE.AmbientLight(0xffffff, 1.5));
        const key = new THREE.DirectionalLight(0xfff0dd, 2.2); key.position.set(2, 4, 3); this._previewScene.add(key);
        const rim = new THREE.DirectionalLight(0x40d0ff, 1.4); rim.position.set(-2, 2, -2); this._previewScene.add(rim);

        this._rebuildMenuAvatar();
    }

    _rebuildMenuAvatar() {
        if (!this._previewScene) return;
        if (this._previewAvatar) {
            this._previewScene.remove(this._previewAvatar);
            this._previewAvatar.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
        }
        const av = buildRemoteAvatar(SaveSystem.data.playerName, SaveSystem.data.settings.skinColor, SaveSystem.data.settings.uiColor);
        const primaryKind = (SaveSystem.data.equippedLoadout && SaveSystem.data.equippedLoadout[0]) || 'rifle';
        const camo = (SaveSystem.data.equippedCamos && SaveSystem.data.equippedCamos[primaryKind]) || 'default';
        const wm = buildWeaponMesh(primaryKind, camo, false);
        wm.scale.set(0.75, 0.75, 0.75);
        wm.position.set(0.32, 1.05, -0.32);
        av.add(wm);
        this._previewAvatar = av;
        this._previewScene.add(av);
    }

    _setupUI() {
        this.ui.updatePoints();
        const nameInput = document.getElementById('playerNameInput');
        if (nameInput) {
            nameInput.value = SaveSystem.data.playerName;
            nameInput.addEventListener('change', () => {
                const val = nameInput.value.trim().toUpperCase().slice(0, 16) || ('OPERATOR-' + Math.floor(Math.random() * 999));
                nameInput.value = val;
                SaveSystem.data.playerName = val;
                this.network.myName = val;
                SaveSystem.save();
                this._rebuildMenuAvatar();
            });
        }
        this._renderSkinGrid();
    }

    _renderSkinGrid() {
        const grid = document.getElementById('skinGrid');
        if (!grid) return;
        grid.innerHTML = '';
        Object.keys(SKINS).forEach(k => {
            const sk = SKINS[k];
            const card = document.createElement('div');
            card.className = 'skinCard' + (SaveSystem.data.selectedSkin === k ? ' selected' : '');
            card.innerHTML = `<div class="skinSwatch" style="background:linear-gradient(135deg, ${sk.skin} 55%, ${sk.accent} 55%)"></div><div class="skinName">${sk.name}</div>`;
            card.addEventListener('click', () => {
                audio.ui();
                SaveSystem.data.selectedSkin = k;
                SaveSystem.data.settings.skinColor = sk.skin;
                SaveSystem.data.settings.uiColor = sk.accent;
                document.documentElement.style.setProperty('--accent', sk.accent);
                SaveSystem.save();
                this._renderSkinGrid();
                this._rebuildMenuAvatar();
            });
            grid.appendChild(card);
        });
    }

    _bindEvents() {
        const $ = id => document.getElementById(id);
        const startAudio = () => audio.init();

        document.querySelectorAll('#mapSelect .mapCard').forEach(card => {
            card.addEventListener('click', () => {
                startAudio(); audio.ui();
                document.querySelectorAll('#mapSelect .mapCard').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedMap = card.dataset.map;
            });
        });

        $('btnPlay').addEventListener('click', () => { startAudio(); audio.ui(); this.isMultiplayer = false; this._startGame('wave', this.selectedMap, false); });
        $('btnTraining').addEventListener('click', () => { startAudio(); audio.ui(); this.isMultiplayer = false; this._startGame('training', this.selectedMap, false); });
        $('btnMultiplayer').addEventListener('click', () => { startAudio(); audio.ui(); $('mpPanel').classList.remove('hidden'); this.network.refreshPublicServers(); });
        $('btnCloseMp').addEventListener('click', () => { audio.ui(); $('mpPanel').classList.add('hidden'); });
        $('btnHostPrivate').addEventListener('click', () => { startAudio(); audio.ui(); this.isMultiplayer = true; $('mpPanel').classList.add('hidden'); this.network.host(parseInt($('hostMaxPlayers').value, 10) || 4, false); });
        $('btnHostPublic').addEventListener('click', () => { startAudio(); audio.ui(); this.isMultiplayer = true; $('mpPanel').classList.add('hidden'); this.network.host(parseInt($('hostMaxPlayers').value, 10) || 4, true); });
        $('btnRefreshPublic').addEventListener('click', () => { startAudio(); audio.ui(); this.network.refreshPublicServers(); });
        $('btnJoin').addEventListener('click', () => {
            startAudio(); audio.ui();
            const code = $('joinCode').value.trim().toUpperCase();
            if (!code) { alert('Enter a room code!'); return; }
            this.isMultiplayer = true; $('mpPanel').classList.add('hidden'); this.network.join(code);
        });
        $('btnLeaveLobby').addEventListener('click', () => { audio.ui(); $('waitingLobby').classList.remove('show'); this.network.disconnect(); this.isMultiplayer = false; });
        $('btnStartMatch').addEventListener('click', () => { audio.ui(); this.network.startMatch(); });

        $('btnShop').addEventListener('click', () => { startAudio(); audio.ui(); $('shopPanel').classList.remove('hidden'); this._renderShop(); });
        $('btnCloseShop').addEventListener('click', () => { audio.ui(); $('shopPanel').classList.add('hidden'); this._rebuildMenuAvatar(); });
        $('btnLoadout').addEventListener('click', () => { startAudio(); audio.ui(); $('loadoutPanel').classList.remove('hidden'); this._renderLoadout(); });
        $('btnCloseLoadout').addEventListener('click', () => { audio.ui(); $('loadoutPanel').classList.add('hidden'); this._rebuildMenuAvatar(); });
        $('btnChallenges').addEventListener('click', () => { startAudio(); audio.ui(); $('challengesPanel').classList.remove('hidden'); this._renderChallenges(); });
        $('btnCloseChallenges').addEventListener('click', () => { audio.ui(); $('challengesPanel').classList.add('hidden'); });

        $('btnSettings').addEventListener('click', () => { startAudio(); audio.ui(); $('settingsPanel').classList.remove('hidden'); this._syncSettingsUI(); });
        $('btnCloseSettings').addEventListener('click', () => { audio.ui(); $('settingsPanel').classList.add('hidden'); SaveSystem.save(); });
        $('btnResume').addEventListener('click', () => { audio.ui(); this._setPaused(false); this.input.lock(); });
        $('btnRestart').addEventListener('click', () => { audio.ui(); this._setPaused(false); this._startGame(this.mode, this.selectedMap, this.isMultiplayer); });
        $('btnQuit').addEventListener('click', () => { audio.ui(); this._quitToMenu(); });
        $('btnPlayAgain').addEventListener('click', () => { audio.ui(); $('endOverlay').classList.remove('show'); this._startGame(this.mode, this.selectedMap, this.isMultiplayer); });
        $('btnEndMenu').addEventListener('click', () => { audio.ui(); this._quitToMenu(); });

        // Training buttons (base dummy/bot controls)
        $('tgAddDummy')?.addEventListener('click', () => { audio.ui(); this._spawnTrainingBot(true, false); });
        $('tgAddMoving')?.addEventListener('click', () => { audio.ui(); this._spawnTrainingBot(true, true); });
        $('tgAddBoss')?.addEventListener('click', () => { audio.ui(); this._spawnTrainingBot(false, false, 'boss'); });
        $('tgResetHp')?.addEventListener('click', () => { audio.ui(); if (this.player) { this.player.health = this.player.maxHealth; this.player.shield = 100; this.player.medkits = 2; this.player.flashbangs = 2; } });
        $('tgClear')?.addEventListener('click', () => { audio.ui(); this._clearBots(); });

        const bindSlider = (id, valId, key, mult = 1, suffix = '', cb = null) => {
            const el = $(id); if (!el) return;
            el.addEventListener('input', () => {
                const v = parseFloat(el.value);
                SaveSystem.data.settings[key] = v;
                const vEl = $(valId);
                if (vEl) vEl.textContent = Math.round(v * mult) + suffix;
                if (cb) cb(v);
            });
        };
        bindSlider('setVol', 'valVol', 'volume', 100, '%', v => audio.setVolume(v));
        bindSlider('setMusic', 'valMusic', 'musicVolume', 100, '%', v => audio.setMusicVolume(v));
        bindSlider('setFov', 'valFov', 'fov', 1, '', v => { if (this.player) this.player.baseFov = v; this.camera.fov = v; this.camera.updateProjectionMatrix(); });
        bindSlider('setSens', 'valSens', 'sensitivity', 100, '%', v => { this.input.sensitivity = v; });
        bindSlider('setScopeSens', 'valScopeSens', 'scopeSensitivity', 100, '%');
        $('setInvert')?.addEventListener('change', e => { SaveSystem.data.settings.invertY = e.target.checked; this.input.invertY = e.target.checked; });
        $('setUiColor')?.addEventListener('input', e => { SaveSystem.data.settings.uiColor = e.target.value; document.documentElement.style.setProperty('--accent', e.target.value); });
        $('setSkinColor')?.addEventListener('input', e => { SaveSystem.data.settings.skinColor = e.target.value; this._rebuildMenuAvatar(); });
        $('btnResetSave')?.addEventListener('click', () => SaveSystem.reset());

        this.input.onLockChange = (locked) => {
            if (!this.running) return;
            if (!locked && this.player && this.player.alive && !$('endOverlay').classList.contains('show')) {
                this._setPaused(true);
            }
        };
        this.input.onTab = (down) => {
            if (!this.running) return;
            if (this.isMultiplayer) {
                this.network.updateLeaderboard();
                $('leaderboardOverlay').classList.toggle('show', down);
            }
        };

        addEventListener('keydown', e => {
            if (!this.running || this.paused) return;
            if (this.mode === 'training') {
                if (e.code === 'KeyB') this._spawnTrainingBot(true, false);
                if (e.code === 'KeyN') this._spawnTrainingBot(true, true);
                if (e.code === 'KeyT') this._spawnTrainingBot(false, false, 'boss');
                if (e.code === 'KeyH' && this.player) { this.player.health = this.player.maxHealth; this.player.shield = 100; this.player.medkits = 2; this.player.flashbangs = 2; }
                if (e.code === 'KeyM') this._clearBots();
            }
        });

        addEventListener('resize', () => {
            this.camera.aspect = innerWidth / innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(innerWidth, innerHeight);
        });
    }

    _setupTrainingAbilityBar() {
        const banner = document.getElementById('trainingBanner');
        if (!banner) return;
        let row = banner.querySelector('.tg-ability-row');
        if (row) row.remove();
        row = document.createElement('div');
        row.className = 'tg-ability-row';

        const makeBtn = (label, cls, onClick) => {
            const b = document.createElement('button');
            b.className = 'tg-btn ' + cls;
            b.textContent = label;
            b.addEventListener('click', () => {
                audio.ui();
                onClick();
                if (this.running && !this.paused) this.input.lock();
            });
            row.appendChild(b);
        };

        makeBtn('Teleport [5/F]', 'ab', () => {
            if (!this.player) return;
            this.abilitySystem.grant('teleport', this.player);
            this.player._triggerTeleport(this);
        });
        makeBtn('Telekinesis [6/F]', 'ab', () => {
            if (!this.player) return;
            this.abilitySystem.grant('telekinesis', this.player);
            this.player._triggerTelekinesis(this);
        });
        makeBtn('Infinity [7]', 'ab', () => {
            if (!this.player) return;
            this.abilitySystem.grant('infinity', this.player);
            this.ui.showCenterMsg('LIMITLESS (INVULNERABLE)', 'ACTIVE IN TRAINING', 900);
        });
        makeBtn('Speed [8]', 'ab', () => {
            if (!this.player) return;
            this.abilitySystem.grant('speed', this.player);
            this.ui.showCenterMsg('OVERDRIVE SPEED (1.45×)', 'ACTIVE IN TRAINING', 900);
        });
        makeBtn('Damage [9]', 'ab', () => {
            if (!this.player) return;
            this.abilitySystem.grant('damage', this.player);
            this.ui.showCenterMsg('OVERCHARGE DAMAGE (1.5×)', 'ACTIVE IN TRAINING', 900);
        });
        makeBtn('Shield [0]', 'ab', () => {
            if (!this.player) return;
            this.abilitySystem.grant('shield', this.player);
            this.ui.showCenterMsg('AEGIS SHIELD +100', 'ARMOR CHARGED', 900);
        });
        makeBtn('Sukuna [V]', 'sukuna', () => {
            if (!this.player) return;
            this.player.sukunaTimer = 999;
            this.player.health = 1000;
            this.player.maxHealth = 1000;
            audio.sukuna();
            if (window.sukunaHandVfx) window.sukunaHandVfx.spawn(this.camera);
            this.ui.showCenterMsg('RYOMEN SUKUNA', 'LMB DISMANTLE · RMB CLEAVE · Q FUGA · E DOMAIN', 2000);
        });
        makeBtn('Orbital [X]', 'ab', () => {
            if (!this.player) return;
            const aimDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const hit = this.world.raycast(this.camera.position, aimDir, 120);
            const strikeCenter = hit.hit ? hit.point : this.player.pos.clone().addScaledVector(aimDir, 25);
            this.triggerOrbitalStrike(strikeCenter);
        });

        banner.appendChild(row);
    }

    _syncSettingsUI() {
        const s = SaveSystem.data.settings;
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        const txt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('setVol', s.volume); txt('valVol', Math.round(s.volume * 100) + '%');
        set('setMusic', s.musicVolume); txt('valMusic', Math.round(s.musicVolume * 100) + '%');
        set('setFov', s.fov); txt('valFov', s.fov);
        set('setSens', s.sensitivity); txt('valSens', Math.round(s.sensitivity * 100) + '%');
        set('setScopeSens', s.scopeSensitivity || 0.8); txt('valScopeSens', Math.round((s.scopeSensitivity || 0.8) * 100) + '%');
        const inv = document.getElementById('setInvert'); if (inv) inv.checked = !!s.invertY;
        set('setUiColor', s.uiColor);
        set('setSkinColor', s.skinColor);
    }

    _renderShop() {
        const list = document.getElementById('shopWeaponList');
        const camosEl = document.getElementById('shopCamos');
        const previewEl = document.getElementById('shopPreview');
        if (!list || !camosEl) return;
        list.innerHTML = '';
        const keys = ['rifle', 'smg', 'shotgun', 'ak47', 'kar98', 'sniper', 'lmg', 'rocket', 'knife', 'katana'];
        keys.forEach(k => {
            const def = WEAPON_DEFS[k];
            const owned = SaveSystem.data.unlockedWeapons.includes(k);
            const btn = document.createElement('div');
            btn.className = 'shopTab' + (this.selectedShopWeapon === k ? ' selected' : '');
            btn.innerHTML = `<div class="name">${def.name}</div><div class="status">${owned ? 'OWNED' : def.price + ' PTS'}</div>`;
            btn.addEventListener('click', () => {
                audio.ui();
                this.selectedShopWeapon = k;
                this.selectedShopCamo = SaveSystem.data.equippedCamos[k] || 'default';
                this._renderShop();
            });
            list.appendChild(btn);
        });

        const wDef = WEAPON_DEFS[this.selectedShopWeapon];
        const wOwned = SaveSystem.data.unlockedWeapons.includes(this.selectedShopWeapon);
        if (previewEl) {
            previewEl.innerHTML = `
                <div class="title">${wDef.name}</div>
                <div class="stat">DMG: ${wDef.damage} · RPM: ${wDef.rpm} · ${wOwned ? 'UNLOCKED' : wDef.price + ' PTS'}</div>
                ${!wOwned ? `<button class="btn primary" id="btnBuyCurWeapon" style="margin-top:8px;">UNLOCK (${wDef.price} PTS)</button>` : ''}
            `;
            document.getElementById('btnBuyCurWeapon')?.addEventListener('click', () => {
                if (SaveSystem.data.points < wDef.price) { alert('Not enough points!'); return; }
                SaveSystem.data.points -= wDef.price;
                SaveSystem.data.unlockedWeapons.push(this.selectedShopWeapon);
                SaveSystem.data.unlockedCamos.push(this.selectedShopWeapon + ':default');
                SaveSystem.data.equippedCamos[this.selectedShopWeapon] = 'default';
                SaveSystem.save();
                this.ui.updatePoints();
                audio.pickup();
                this._renderShop();
            });
        }

        camosEl.innerHTML = '';
        const camoPrices = { default: 0, crimson: 350, cyber: 500, emerald: 500, royal: 750, void: 900, dragon: 2500 };
        Object.keys(CAMO_COLORS).forEach(cKey => {
            if (cKey === 'dragon' && (this.selectedShopWeapon === 'knife' || this.selectedShopWeapon === 'katana')) return;
            const fullKey = this.selectedShopWeapon + ':' + cKey;
            const cOwned = SaveSystem.data.unlockedCamos.includes(fullKey);
            const equipped = SaveSystem.data.equippedCamos[this.selectedShopWeapon] === cKey;
            const price = camoPrices[cKey] || 400;
            const card = document.createElement('div');
            card.className = 'camoCard' + (equipped ? ' equipped' : '');
            const hex = '#' + CAMO_COLORS[cKey].toString(16).padStart(6, '0');
            card.innerHTML = `
                <div class="camoPreview" style="background:radial-gradient(circle, ${hex}55, #0a0d12);border-color:${hex}">
                    <span class="camoName">${CAMO_NAMES[cKey]}</span>
                </div>
                <div class="camoDesc">${CAMO_DESCS[cKey]}</div>
                <button class="btn ${equipped ? 'active' : (cOwned ? 'primary' : '')}" style="width:100%;padding:6px;font-size:11px;">
                    ${equipped ? 'EQUIPPED' : (cOwned ? 'EQUIP' : (!wOwned ? 'LOCKED' : price + ' PTS'))}
                </button>
            `;
            card.querySelector('button').addEventListener('click', () => {
                if (!wOwned) { alert('Unlock the weapon first!'); return; }
                if (cOwned) {
                    SaveSystem.data.equippedCamos[this.selectedShopWeapon] = cKey;
                    SaveSystem.save();
                    audio.ui();
                    if (this.player) {
                        const pw = this.player.weapons.find(w => w.kind === this.selectedShopWeapon);
                        if (pw) pw.rebuildMesh(cKey);
                    }
                    this._renderShop();
                } else {
                    if (SaveSystem.data.points < price) { alert('Not enough points!'); return; }
                    SaveSystem.data.points -= price;
                    SaveSystem.data.unlockedCamos.push(fullKey);
                    SaveSystem.data.equippedCamos[this.selectedShopWeapon] = cKey;
                    SaveSystem.save();
                    this.ui.updatePoints();
                    audio.pickup();
                    this._renderShop();
                }
            });
            camosEl.appendChild(card);
        });
    }

    _renderLoadout() {
        const slotsEl = document.getElementById('loadoutSlots');
        const listEl = document.getElementById('loadoutWeaponList');
        if (!slotsEl || !listEl) return;
        slotsEl.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const k = SaveSystem.data.equippedLoadout[i] || 'rifle';
            const def = WEAPON_DEFS[k] || WEAPON_DEFS.rifle;
            const slot = document.createElement('div');
            slot.className = 'loadoutSlot' + (this.selectedLoadoutSlot === i ? ' selected' : '');
            slot.innerHTML = `<div class="slotNum">SLOT ${i + 1}</div><div class="slotWep">${def.name}</div>`;
            slot.addEventListener('click', () => { audio.ui(); this.selectedLoadoutSlot = i; this._renderLoadout(); });
            slotsEl.appendChild(slot);
        }
        listEl.innerHTML = '';
        SaveSystem.data.unlockedWeapons.forEach(k => {
            const def = WEAPON_DEFS[k]; if (!def) return;
            const item = document.createElement('div');
            item.className = 'loadoutItem';
            item.innerHTML = `<div class="name">${def.name}</div><div class="stat">DMG ${def.damage} · RPM ${def.rpm}</div>`;
            item.addEventListener('click', () => {
                audio.ui();
                SaveSystem.data.equippedLoadout[this.selectedLoadoutSlot] = k;
                SaveSystem.save();
                if (this.player) this.player.loadEquippedWeapons();
                this._renderLoadout();
            });
            listEl.appendChild(item);
        });
    }

    _renderChallenges() {
        const list = document.getElementById('challengesList');
        if (!list) return;
        list.innerHTML = '';
        Object.keys(WEAPON_CHALLENGES).forEach(k => {
            const def = WEAPON_DEFS[k];
            const goal = WEAPON_CHALLENGES[k];
            const cur = Math.min(goal, SaveSystem.data.challenges[k] || 0);
            const pct = Math.round((cur / goal) * 100);
            const card = document.createElement('div');
            card.className = 'challengeCard';
            card.innerHTML = `
                <div class="ch-title"><span>${def.name} MASTERY</span><span>${cur} / ${goal} KILLS</span></div>
                <div class="ch-desc">Eliminate ${goal} targets with ${def.name} (+1000 PTS)</div>
                <div class="ch-bar"><div class="ch-fill" style="width:${pct}%"></div></div>
            `;
            list.appendChild(card);
        });
    }

    _setPaused(p) {
        this.paused = p;
        document.getElementById('pauseOverlay').classList.toggle('show', p);
        if (p) this.input.unlock();
    }

    _quitToMenu() {
        this.running = false;
        this.paused = false;
        this.input.unlock();
        window.cleanupAllStandaloneVfx();
        this.endDomain();
        this.effects.clear();
        this.abilitySystem.clear();
        this._clearBots();
        for (const id in this.remoteMeshes) {
            this.scene.remove(this.remoteMeshes[id]);
            delete this.remoteMeshes[id];
        }
        for (const m of this.medkitDrops) { this.scene.remove(m.g); m.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
        this.medkitDrops = [];
        for (const f of this.flashbangs) { this.scene.remove(f.m); f.m.geometry.dispose(); f.m.material.dispose(); }
        this.flashbangs = [];
        if (this.world) { this.world.dispose(); this.world = null; }
        if (this.isMultiplayer) { this.network.disconnect(); this.isMultiplayer = false; }

        document.getElementById('pauseOverlay').classList.remove('show');
        document.getElementById('endOverlay').classList.remove('show');
        document.getElementById('waitingLobby').classList.remove('show');
        document.getElementById('deathCam').classList.remove('show');
        document.getElementById('trainingBanner').classList.remove('show');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('menu').classList.remove('hidden');
        this.ui.updatePoints();
        music.playMenu();
    }

    _startGame(mode, mapId, isMultiplayer) {
        this.mode = mode;
        this.selectedMap = mapId || 'blacksite';
        this.isMultiplayer = isMultiplayer;
        this.running = true;
        this.paused = false;
        this.wave = 1;
        this.kills = 0;
        this.pointsEarned = 0;
        this.waveClearTimer = 0;
        this._streakCount = 0;
        this._streakTimer = 0;

        window.cleanupAllStandaloneVfx();
        this.endDomain();
        this.effects.clear();
        this.abilitySystem.clear();
        this._clearBots();
        for (const id in this.remoteMeshes) {
            this.scene.remove(this.remoteMeshes[id]);
            delete this.remoteMeshes[id];
        }
        if (this.world) this.world.dispose();
        this.world = new World(this.scene, this.selectedMap);

        if (!this.player) {
            this.player = new Player(this.camera, this.world, this.effects, this.input, this.abilitySystem);
        } else {
            this.player.world = this.world;
            this.player.loadEquippedWeapons();
        }
        const sp = this.world.getSafeSpawnPoint(this.isMultiplayer ? this.network : null);
        this.player.reset(sp);

        document.getElementById('menu').classList.add('hidden');
        document.getElementById('endOverlay').classList.remove('show');
        document.getElementById('pauseOverlay').classList.remove('show');
        document.getElementById('deathCam').classList.remove('show');
        document.getElementById('hud').classList.remove('hidden');

        const tb = document.getElementById('trainingBanner');
        if (mode === 'training') {
            tb.classList.add('show');
            this._setupTrainingAbilityBar();
        } else {
            tb.classList.remove('show');
        }

        const radar = document.getElementById('radarWrap');
        if (radar) radar.style.display = 'block';

        this.abilitySystem.spawnInitial(this.world.spawnPoints);

        if (mode === 'training') {
            this._spawnTrainingBot(true, false);
            this._spawnTrainingBot(true, true);
            music.playTraining();
            this.ui.showCenterMsg('TRAINING GROUNDS', 'ALL ABILITIES UNLOCKED [5-0, V, Z, X]', 2400);
        } else if (isMultiplayer && !this.isCoop()) {
            music.playPVP();
            this.ui.showCenterMsg(mode + ' MATCH', 'ELIMINATE ALL RIVALS', 2000);
        } else {
            this.countdownTimer = 3.0;
            this.countdownLastSec = 4;
            if (this.selectedMap === 'foundry') music.playFoundry();
            else if (this.selectedMap === 'abyss') music.playAbyss();
            else music.playWave();
        }

        this.input.lock();
    }

    _spawnTrainingBot(isDummy, isMoving, type = 'normal') {
        const sp = this.world.getSafeSpawnPoint(null);
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const target = this.player.pos.clone().addScaledVector(dir, 10);
        target.x = clamp(target.x, -26, 26);
        target.z = clamp(target.z, -26, 26);
        target.y = this.player.pos.y + 0.5;
        const bot = new Bot(this.scene, this.world, this.effects, target || sp, 1, type, isDummy, isMoving);
        this.bots.push(bot);
    }

    _clearBots() {
        for (const b of this.bots) b.dispose();
        this.bots = [];
    }

    _spawnWave(wave) {
        const count = Math.min(18, 3 + wave * 2);
        for (let i = 0; i < count; i++) {
            const sp = pick(this.world.botSpawns).clone();
            sp.x += rand(-2, 2); sp.z += rand(-2, 2);
            let type = 'normal';
            if (wave % 5 === 0 && i === 0) type = 'boss';
            else if (wave >= 3 && i % 4 === 1) type = 'rusher';
            else if (wave >= 4 && i % 5 === 2) type = 'tank';
            this.bots.push(new Bot(this.scene, this.world, this.effects, sp, wave, type, false, false));
        }
        audio.waveStart();
        this.ui.showCenterMsg(`WAVE ${wave}`, `${count} HOSTILES INBOUND`, 1800);
    }

    _registerKillStreak(pos) {
        this._streakCount++;
        this._streakTimer = 8.0;
        if (this._streakCount === 2) { audio.multikill(1); this.ui.showCenterMsg('DOUBLE KILL', '+50 BONUS PTS', 1100); SaveSystem.data.points += 50; }
        else if (this._streakCount === 3) { audio.multikill(2); this.player.streaks.uav = true; this.player.streaks.uavTimer = 25; this.ui.showCenterMsg('TRIPLE KILL · UAV ONLINE', 'RADAR SWEEP ACTIVE', 1400); }
        else if (this._streakCount === 4) { audio.multikill(3); this.player.streaks.stim = true; this.ui.showCenterMsg('QUAD KILL · STIM READY', 'PRESS [Z] TO ACTIVATE', 1500); }
        else if (this._streakCount >= 5) { audio.multikill(4); this.player.streaks.orbital = true; this.ui.showCenterMsg('RAMPAGE · ORBITAL STRIKE', 'PRESS [X] TO CALL STRIKE', 1800); }
    }

    damageBot(bot, dmg, head, hitPos, isMelee = false) {
        if (!bot || !bot.alive) return;
        this.ui.showHitmarker(head);
        if (hitPos) {
            this.ui.spawnDamageNum(dmg, head, hitPos, this.camera);
            this.effects.sparks(hitPos, head ? 0xff4040 : 0xffaa33, head ? 10 : 5, 5);
        }
        audio.hit(head);
        const killed = bot.takeDamage(dmg, head);
        if (killed) {
            const deathPos = bot.pos.clone();
            this.kills++;
            const pts = (bot.type === 'boss' ? 300 : 50) + (head ? 25 : 0);
            this.pointsEarned += pts;
            SaveSystem.data.points += pts;
            const curW = this.player && this.player.currentWeapon;
            if (curW && WEAPON_CHALLENGES[curW.kind]) {
                SaveSystem.data.challenges[curW.kind] = (SaveSystem.data.challenges[curW.kind] || 0) + 1;
            }
            SaveSystem.save();
            this.ui.updatePoints();
            this.ui.popSkull();
            this.ui.addKillFeed(`${this.network.myName} ✕ ${bot.type.toUpperCase()}`, head);
            audio.kill();
            this._registerKillStreak(deathPos);
            if (Math.random() < 0.45) this.spawnMedkitDrop(deathPos);
        }
    }

    fireRay(origin, dir, muzzlePos, weaponDef, owner, tracerColor, dmgMult = 1) {
        const maxDist = weaponDef.range || 200;
        const wHit = this.world.raycast(origin, dir, maxDist);
        let bestDist = wHit.hit ? wHit.dist : maxDist;
        let hitBot = null;
        let hitHead = false;
        let hitRemoteId = null;

        // Check explosive barrels
        for (const b of this.world.barrels) {
            if (!b.alive) continue;
            const toB = b.pos.clone().sub(origin);
            const proj = toB.dot(dir);
            if (proj > 0 && proj < bestDist) {
                const perp = toB.sub(dir.clone().multiplyScalar(proj)).length();
                if (perp < 0.55) {
                    bestDist = proj;
                    b.alive = false;
                    b.mesh.visible = false;
                    b.respawnTimer = 18;
                    this.effects.explosion(b.pos, 0xff4500);
                    audio.explosion(b.pos);
                    for (const bot of this.bots) {
                        if (bot.alive && bot.pos.distanceTo(b.pos) < 6.5) {
                            this.damageBot(bot, 140, false, bot.pos.clone().add(new THREE.Vector3(0, 1, 0)));
                        }
                    }
                    break;
                }
            }
        }

        // Check bots
        for (const bot of this.bots) {
            if (!bot.alive) continue;
            const headCenter = bot.pos.clone().add(new THREE.Vector3(0, bot.height * 0.88, 0));
            const toH = headCenter.clone().sub(origin);
            const projH = toH.dot(dir);
            if (projH > 0 && projH < bestDist && toH.sub(dir.clone().multiplyScalar(projH)).length() < 0.28) {
                bestDist = projH; hitBot = bot; hitHead = true; hitRemoteId = null; continue;
            }
            const bodyCenter = bot.pos.clone().add(new THREE.Vector3(0, bot.height * 0.48, 0));
            const toB = bodyCenter.clone().sub(origin);
            const projB = toB.dot(dir);
            if (projB > 0 && projB < bestDist && toB.sub(dir.clone().multiplyScalar(projB)).length() < bot.radius * 1.15) {
                bestDist = projB; hitBot = bot; hitHead = false; hitRemoteId = null;
            }
        }

        // Check remote players in multiplayer PvP
        if (this.isMultiplayer && !this.isCoop() && this.network) {
            for (const id in this.network.players) {
                if (id === this.network.myId) continue;
                const pData = this.network.players[id];
                if (!pData || !pData.state || pData.state.alive === false || !pData.state.pos) continue;
                const rBase = new THREE.Vector3(...pData.state.pos);
                const rHead = rBase.clone().add(new THREE.Vector3(0, 1.6, 0));
                const toH = rHead.clone().sub(origin);
                const projH = toH.dot(dir);
                if (projH > 0 && projH < bestDist && toH.sub(dir.clone().multiplyScalar(projH)).length() < 0.28) {
                    bestDist = projH; hitRemoteId = id; hitHead = true; hitBot = null; continue;
                }
                const rBody = rBase.clone().add(new THREE.Vector3(0, 0.95, 0));
                const toB = rBody.clone().sub(origin);
                const projB = toB.dot(dir);
                if (projB > 0 && projB < bestDist && toB.sub(dir.clone().multiplyScalar(projB)).length() < 0.48) {
                    bestDist = projB; hitRemoteId = id; hitHead = false; hitBot = null;
                }
            }
        }

        const endPt = origin.clone().addScaledVector(dir, bestDist);
        this.effects.tracer(muzzlePos || origin, endPt, tracerColor);

        if (this.isMultiplayer && this.network && owner === 'player') {
            this.network.broadcast({
                type: 'SHOOT', senderId: this.network.myId,
                origin: [(muzzlePos || origin).x, (muzzlePos || origin).y, (muzzlePos || origin).z],
                to: [endPt.x, endPt.y, endPt.z], weapon: weaponDef.kind, color: tracerColor
            });
        }

        if (hitBot) {
            const mult = hitHead ? (weaponDef.headMult || 2) : 1;
            const falloff = weaponDef.falloff ? clamp(1 - bestDist / 40, 0.35, 1) : 1;
            const dmg = Math.round(weaponDef.damage * mult * falloff * dmgMult);
            this.damageBot(hitBot, dmg, hitHead, endPt);
        } else if (hitRemoteId) {
            const mult = hitHead ? (weaponDef.headMult || 2) : 1;
            const dmg = Math.round(weaponDef.damage * mult * dmgMult);
            this.network.broadcast({ type: 'HIT', targetId: hitRemoteId, damage: dmg, attackerId: this.network.myId, attackerName: this.network.myName, headshot: hitHead });
            this.ui.showHitmarker(hitHead);
            this.ui.spawnDamageNum(dmg, hitHead, endPt, this.camera);
            audio.hit(hitHead);
        } else if (wHit.hit) {
            this.effects.sparks(wHit.point, 0xffcc77, 5, 4);
            this.effects.scorchMark(wHit.point, wHit.normal);
            for (const m of this.world.meshes) {
                if (m.userData?.destructible && m.position.distanceTo(wHit.point) < 3.5) {
                    window.damageMapMesh(m, wHit.point, weaponDef.damage);
                    break;
                }
            }
        }
    }

    botFire(bot, origin, dir) {
        const wHit = this.world.raycast(origin, dir, 60);
        const toP = this.player.pos.clone().add(new THREE.Vector3(0, this.player.height * 0.65, 0)).sub(origin);
        const distP = toP.length();
        const hitPlayer = this.player.alive && (!wHit.hit || wHit.dist > distP) && toP.normalize().dot(dir) > 0.965;
        const endPt = hitPlayer ? this.player.pos.clone().add(new THREE.Vector3(0, 1.1, 0)) : (wHit.hit ? wHit.point : origin.clone().addScaledVector(dir, 50));
        this.effects.tracer(origin, endPt, 0xff451a);
        audio.shoot('rifle', origin);
        if (hitPlayer) {
            this.lastAttacker = 'bot';
            this.lastAttackerName = bot.type.toUpperCase() + ' UNIT';
            this.player.onHit(bot.damage, false, bot.pos);
            if (!this.player.alive) this.onPlayerDied();
        }
    }

    _onRocketHit(pos, def, owner) {
        const radius = (def && def.splashRadius) || 5.5;
        const maxDmg = (def && def.splashDamage) || 65;
        for (const bot of this.bots) {
            if (!bot.alive) continue;
            const d = bot.pos.distanceTo(pos);
            if (d < radius) {
                const dmg = Math.round(maxDmg * (1 - d / radius));
                this.damageBot(bot, dmg, false, bot.pos.clone().add(new THREE.Vector3(0, 1, 0)));
            }
        }
        if (this.isMultiplayer && !this.isCoop() && this.network) {
            for (const id in this.network.players) {
                if (id === this.network.myId) continue;
                const pData = this.network.players[id];
                if (!pData || !pData.state || pData.state.alive === false || !pData.state.pos) continue;
                const rPos = new THREE.Vector3(...pData.state.pos);
                const d = rPos.distanceTo(pos);
                if (d < radius) {
                    const dmg = Math.round(maxDmg * (1 - d / radius));
                    this.network.broadcast({ type: 'HIT', targetId: id, damage: dmg, attackerId: this.network.myId, attackerName: this.network.myName });
                }
            }
        }
        if (this.player && this.player.alive) {
            const d = this.player.pos.distanceTo(pos);
            if (d < radius) {
                const dmg = Math.round(maxDmg * 0.45 * (1 - d / radius));
                if (dmg > 0) {
                    this.player.onHit(dmg, false, pos);
                    if (!this.player.alive) this.onPlayerDied();
                }
            }
        }
    }

    spawnMedkitDrop(pos) {
        const g = new THREE.Group();
        g.position.set(pos.x, Math.max(pos.y, 0.2) + 0.45, pos.z);
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.28, 0.35), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x3fe08a, emissiveIntensity: 0.6 }));
        const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.31, 0.08), new THREE.MeshBasicMaterial({ color: 0x3fe08a }));
        const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.31, 0.22), new THREE.MeshBasicMaterial({ color: 0x3fe08a }));
        g.add(box, cross1, cross2);
        this.scene.add(g);
        this.medkitDrops.push({ g, life: 22 });
    }

    throwFlashbang(pos, vel, isPlayer = true) {
        const m = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10),
            new THREE.MeshStandardMaterial({ color: 0xd0d8e0, emissive: 0xffffff, emissiveIntensity: 0.8, metalness: 0.8 })
        );
        m.position.copy(pos);
        this.scene.add(m);
        audio.throw();
        this.flashbangs.push({ m, pos: pos.clone(), vel: vel.clone(), timer: 1.45, isPlayer });
    }

    applyFlashbangToPlayer(fbPos) {
        if (!this.player || !this.player.alive) return;
        const eyePos = this.player.camera.position;
        const toFlash = fbPos.clone().sub(eyePos);
        const dist = toFlash.length();
        if (dist > 24) return;

        const dirToFlash = toFlash.clone().normalize();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.camera.quaternion);
        const dot = dirToFlash.dot(forward);

        // Check line-of-sight wall occlusion
        const wallHit = this.world.raycast(eyePos, dirToFlash, dist);
        const occluded = wallHit.hit && wallHit.dist < dist - 0.4;

        // Flash player if looking toward it OR within close blast radius (< 6m)
        if (!occluded && (dot > -0.2 || dist < 6.5)) {
            const distFactor = clamp(1 - dist / 24, 0.25, 1.0);
            const angleFactor = dot > 0.35 ? 1.0 : (dot > -0.2 ? 0.65 : 0.45);
            const intensity = clamp(distFactor * angleFactor * 1.25, 0.38, 1.0);
            this.ui.flashbang(intensity);
            audio.flashbang(intensity, fbPos);
            this.player.confusedTimer = Math.max(this.player.confusedTimer, 1.8 * intensity);
        } else {
            audio.flashbang(0.2, fbPos);
        }
    }

    _updateMedkitsAndFlashbangs(dt) {
        for (let i = this.medkitDrops.length - 1; i >= 0; i--) {
            const mk = this.medkitDrops[i];
            mk.life -= dt;
            mk.g.rotation.y += dt * 2.2;
            if (this.player && this.player.alive && this.player.pos.distanceTo(mk.g.position) < 1.6 && this.player.health < this.player.maxHealth) {
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);
                audio.medkit();
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
            fb.vel.y -= 24 * dt;
            const grounded = this.world.moveAndSlide(fb.pos, fb.vel, 0.08, 0.16, dt);
            if (grounded) { fb.vel.x *= 0.85; fb.vel.z *= 0.85; }
            fb.m.position.copy(fb.pos);
            fb.m.rotation.x += dt * 8;
            fb.m.rotation.z += dt * 6;
            if (fb.timer <= 0) {
                this.effects.explosion(fb.pos, 0xffffff);
                // Blind nearby bots
                for (const b of this.bots) {
                    if (b.alive && b.pos.distanceTo(fb.pos) < 18) {
                        b.confusedTimer = 3.8;
                    }
                }
                // Blind local player (solo, training, or multiplayer self-flash!)
                this.applyFlashbangToPlayer(fb.pos);
                // Broadcast to multiplayer peers
                if (this.isMultiplayer && this.network && fb.isPlayer) {
                    this.network.broadcast({ type: 'FLASH', pos: [fb.pos.x, fb.pos.y, fb.pos.z] });
                }
                this.scene.remove(fb.m);
                fb.m.geometry.dispose(); fb.m.material.dispose();
                this.flashbangs.splice(i, 1);
            }
        }
    }

    triggerOrbitalStrike(center) {
        for (let i = 0; i < 6; i++) {
            this._orbStrikes.push({
                pos: center.clone().add(new THREE.Vector3(rand(-5.5, 5.5), 0, rand(-5.5, 5.5))),
                delay: 0.4 + i * 0.25
            });
        }
    }

    triggerDomainExpansion(isCaster, center) {
        this.endDomain();
        this.domainActive = true;
        this.domainCenter = center.clone();
        this.domainTimer = 14;
        audio.domain();

        const g = new THREE.Group();
        g.position.copy(center);
        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(28, 24, 16),
            new THREE.MeshBasicMaterial({ color: 0x1a0205, transparent: true, opacity: 0.45, side: THREE.BackSide })
        );
        const wire = new THREE.Mesh(
            new THREE.SphereGeometry(28.1, 18, 12),
            new THREE.MeshBasicMaterial({ color: 0xff1e2d, wireframe: true, transparent: true, opacity: 0.35 })
        );
        const shrineBase = new THREE.Mesh(
            new THREE.BoxGeometry(4.5, 3.2, 4.5),
            new THREE.MeshStandardMaterial({ color: 0x24060a, emissive: 0x880814, emissiveIntensity: 1.5 })
        );
        shrineBase.position.set(0, 1.6, -6);
        const shrineRoof = new THREE.Mesh(
            new THREE.ConeGeometry(4.2, 2.2, 4),
            new THREE.MeshStandardMaterial({ color: 0x120204, emissive: 0xff1e2d, emissiveIntensity: 1.2 })
        );
        shrineRoof.rotation.y = Math.PI / 4;
        shrineRoof.position.set(0, 4.1, -6);
        g.add(dome, wire, shrineBase, shrineRoof);
        this.scene.add(g);
        this.domainGroup = g;
        this._domainCaster = isCaster;
        this._domainSlashT = 0;
    }

    endDomain() {
        this.domainActive = false;
        if (this.domainGroup) {
            this.scene.remove(this.domainGroup);
            this.domainGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
            this.domainGroup = null;
        }
    }

    beginClash(oppId, duration = 6) {
        this.clash = { active: true, oppId, timer: duration, score: 0, oppScore: 0 };
        document.getElementById('clashOverlay')?.classList.add('show');
    }

    resolveClash(winnerId) {
        this.clash = null;
        document.getElementById('clashOverlay')?.classList.remove('show');
        if (winnerId === this.network.myId) {
            this.ui.showCenterMsg('DOMAIN CLASH WON!', 'MALEVOLENT SHRINE EXPANDED', 2200);
            this.triggerDomainExpansion(true, this.player.pos.clone());
        } else {
            this.ui.showCenterMsg('DOMAIN CLASH LOST', 'ENEMY DOMAIN OVERWHELMED YOU', 2200);
        }
    }

    onPlayerDied() {
        this.input.unlock();
        if (window.sukunaHandVfx) window.sukunaHandVfx.remove();
        if (this.isMultiplayer) {
            this.respawnTimer = 3.5;
            document.getElementById('dcKiller').textContent = this.lastAttackerName || 'RIVAL';
            document.getElementById('dcWeapon').textContent = this.lastHitHeadshot ? 'HEADSHOT ELIMINATION' : 'ELIMINATED';
            document.getElementById('deathCam').classList.add('show');
            if (this.network) {
                this.network.broadcast({
                    type: 'KILL', killerId: this.lastAttacker, killerName: this.lastAttackerName,
                    victimId: this.network.myId, victimName: this.network.myName,
                    headshot: this.lastHitHeadshot, deathPos: [this.player.pos.x, this.player.pos.y, this.player.pos.z]
                });
            }
        } else {
            this.running = false;
            document.getElementById('endTitle').textContent = 'OPERATIVE DOWN';
            document.getElementById('endStats').textContent = `WAVE ${this.wave} · ${this.kills} KILLS · +${this.pointsEarned} PTS`;
            document.getElementById('endOverlay').classList.add('show');
        }
    }

    _loop(now) {
        const dt = Math.min(0.05, (now - this._lastTime) / 1000);
        this._lastTime = now;

        if (!this.running && this._previewRenderer && this._previewScene && this._previewCam) {
            if (this._previewAvatar) this._previewAvatar.rotation.y += dt * 0.7;
            this._previewRenderer.render(this._previewScene, this._previewCam);
        }

        if (this.running && !this.paused) {
            if (this._streakTimer > 0) {
                this._streakTimer -= dt;
                if (this._streakTimer <= 0) this._streakCount = 0;
            }

            if (this.countdownTimer > 0) {
                this.countdownTimer -= dt;
                const sec = Math.ceil(this.countdownTimer);
                if (sec !== this.countdownLastSec && sec > 0) {
                    this.countdownLastSec = sec;
                    audio.countdown(false);
                    this.ui.showCenterMsg(`WAVE ${this.wave}`, `STARTING IN ${sec}...`, 850);
                }
                if (this.countdownTimer <= 0) {
                    audio.countdown(true);
                    this._spawnWave(this.wave);
                }
            } else if (this.mode === 'wave' && !this.isMultiplayer) {
                const aliveBots = this.bots.filter(b => b.alive).length;
                if (aliveBots === 0 && this.waveClearTimer <= 0) {
                    this.waveClearTimer = 2.5;
                    audio.perfect();
                    this.ui.showCenterMsg(`WAVE ${this.wave} CLEARED`, '+150 WAVE BONUS PTS', 1800);
                    SaveSystem.data.points += 150;
                    this.pointsEarned += 150;
                    SaveSystem.save();
                    this.ui.updatePoints();
                } else if (this.waveClearTimer > 0) {
                    this.waveClearTimer -= dt;
                    if (this.waveClearTimer <= 0) {
                        this.wave++;
                        this._spawnWave(this.wave);
                    }
                }
            }

            if (this.respawnTimer > 0) {
                this.respawnTimer -= dt;
                const dcT = document.getElementById('dcTimer');
                if (dcT) dcT.textContent = Math.max(0, this.respawnTimer).toFixed(1) + 's';
                if (this.respawnTimer <= 0) {
                    document.getElementById('deathCam').classList.remove('show');
                    const sp = this.world.getSafeSpawnPoint(this.network);
                    this.player.reset(sp);
                    this.input.lock();
                }
            }

            if (this.domainActive && this.domainCenter) {
                this.domainTimer -= dt;
                this._domainSlashT -= dt;
                if (this._domainSlashT <= 0) {
                    this._domainSlashT = 0.22;
                    const rPos = this.domainCenter.clone().add(new THREE.Vector3(rand(-14, 14), rand(0.5, 3.5), rand(-14, 14)));
                    if (window.sukunaSlashVfx) window.sukunaSlashVfx(rPos, 'cleave');
                    if (this._domainCaster) {
                        for (const b of this.bots) {
                            if (b.alive && b.pos.distanceTo(this.domainCenter) < 28) {
                                this.damageBot(b, 28, false, b.pos.clone().add(new THREE.Vector3(0, 1, 0)));
                            }
                        }
                    }
                }
                if (this.domainTimer <= 0) {
                    this.endDomain();
                    if (this.isMultiplayer && this.network.isHost) this.network.broadcast({ type: 'DOMAIN_END' });
                }
            }

            for (let i = this._orbStrikes.length - 1; i >= 0; i--) {
                const os = this._orbStrikes[i];
                os.delay -= dt;
                if (os.delay <= 0) {
                    this.effects.explosion(os.pos, 0x40d0ff);
                    audio.explosion(os.pos);
                    this._onRocketHit(os.pos, { splashRadius: 7.5, splashDamage: 160 }, 'player');
                    this._orbStrikes.splice(i, 1);
                }
            }

            this.player.update(dt, this);
            this.world.update(dt, this.player, this.bots, this);
            this.abilitySystem.update(dt, this.player);
            for (const b of this.bots) b.update(dt, this.player, this);
            this.effects.update(dt, this.world, this.bots, (pos, def, owner) => this._onRocketHit(pos, def, owner), this);
            this._updateMedkitsAndFlashbangs(dt);
            if (this.isMultiplayer) this.network.update(dt);

            audio.listenerPos.copy(this.camera.position);
            audio.listenerRight.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
            this.ui.update(this.player, this);
            this.input.endFrame();
        }

        if (this.running) {
            this.renderer.render(this.scene, this.camera);
        }
        requestAnimationFrame(t => this._loop(t));
    }
}

window.game = new Game();