// 1. Fungsi asas untuk cipta bunyi (Generator)
export const playBeep = (freq = 440, duration = 0.15) => {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, context.currentTime);
        gain.gain.setValueAtTime(0.05, context.currentTime);
        osc.connect(gain); gain.connect(context.destination);
        osc.start(); osc.stop(context.currentTime + duration);
    } catch (e) {}
};

// 2. FUNGSI INI YANG KAU NAK (Bila jumpa perkataan)
export const playFoundSound = (isLocal) => {
    // Kalau kau yang jumpa: Bunyi Tinggi (800Hz)
    // Kalau lawan yang jumpa: Bunyi Rendah (400Hz)
    const freq = isLocal ? 800 : 400;
    playBeep(freq, 0.15);
};

// 3. Fungsi bunyi tamat game (Menang/Kalah)
export const playEndSound = (isWin) => {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const now = context.currentTime;
        if (isWin) {
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = context.createOscillator();
                const gain = context.createGain();
                osc.frequency.setValueAtTime(freq, now + (i * 0.1));
                gain.gain.setValueAtTime(0.1, now + (i * 0.1));
                gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.1) + 0.3);
                osc.connect(gain); gain.connect(context.destination);
                osc.start(now + (i * 0.1)); osc.stop(now + (i * 0.1) + 0.4);
            });
        } else {
            [392.00, 261.63].forEach((freq, i) => {
                const osc = context.createOscillator();
                const gain = context.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + (i * 0.2));
                gain.gain.setValueAtTime(0.05, now + (i * 0.2));
                gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.2) + 0.5);
                osc.connect(gain); gain.connect(context.destination);
                osc.start(now + (i * 0.2)); osc.stop(now + (i * 0.2) + 0.6);
            });
        }
    } catch (e) {}
};
