let audioCtx = null;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
};

// Bunyi "Beep" yang lebih lembut
export const playBeep = (freq = 800, duration = 0.2) => {
    try {
        const context = getCtx();
        const osc = context.createOscillator();
        const gain = context.createGain();

        // Guna 'triangle' supaya bunyi lebih "retro game" dan tak tajam macam 'sine'
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(freq, context.currentTime);
        
        // Volume bermula kuat sikit (0.1) dan hilang cepat (decay)
        gain.gain.setValueAtTime(0.1, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(context.destination);
        
        osc.start();
        osc.stop(context.currentTime + duration);
    } catch (e) {}
};

// Bunyi Tamat Game yang lebih gempak
export const playEndSound = (isWin) => {
    try {
        const context = getCtx();
        const now = context.currentTime;

        if (isWin) {
            // Nota "Level Up": Ceria dan pantas
            [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
                const osc = context.createOscillator();
                const gain = context.createGain();
                osc.type = 'square'; // Bunyi 8-bit klasik
                osc.frequency.setValueAtTime(f, now + (i * 0.1));
                gain.gain.setValueAtTime(0.05, now + (i * 0.1));
                gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.1) + 0.3);
                osc.connect(gain); gain.connect(context.destination);
                osc.start(now + (i * 0.1)); osc.stop(now + (i * 0.1) + 0.4);
            });
        } else {
            // Bunyi "Game Over": Berat dan menurun
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(70, now + 0.5);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.5);
            osc.connect(gain); gain.connect(context.destination);
            osc.start(); osc.stop(now + 0.5);
        }
    } catch (e) {}
};
