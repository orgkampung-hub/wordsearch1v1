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

export const playEndSound = (isWin) => {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const now = context.currentTime;
        
        if (isWin) {
            // Bunyi Sorakan (Menang): Nota naik bertalu-talu
            [523, 659, 783, 1046].forEach((f, i) => {
                const osc = context.createOscillator();
                const gain = context.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, now + (i * 0.1));
                gain.gain.setValueAtTime(0.1, now + (i * 0.1));
                gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.1) + 0.8);
                osc.connect(gain); gain.connect(context.destination);
                osc.start(now + (i * 0.1)); osc.stop(now + (i * 0.1) + 1);
            });
        } else {
            // Bunyi "Boo" (Kalah): Nota menurun dan kasar
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 1);
            osc.connect(gain); gain.connect(context.destination);
            osc.start(); osc.stop(now + 1);
        }
    } catch (e) {}
};
