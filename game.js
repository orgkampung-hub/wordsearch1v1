import { generateGrid } from './placeword.js';
import { playBeep, playEndSound } from './sound.js'; 

export const useGame = (state) => {
    
    const handleCellClick = (r, c, char) => {
        if (state.selectedCells.value.length === 0) {
            state.selectedCells.value.push({ r, c, char });
            return;
        }

        const start = state.selectedCells.value[0];
        if (start.r === r && start.c === c) {
            state.selectedCells.value = [];
            return;
        }

        const end = { r, c, char };
        const word = checkWord(start, end, state.grid.value, state.words.value);

        if (word && !state.foundWords.value.includes(word)) {
            markWordFound(start, end, word, true, state);
            
            if (state.mode.value === 'multi' && window.currentConn) {
                window.currentConn.send({
                    type: 'FOUND',
                    start,
                    end,
                    word
                });
            }
        }
        state.selectedCells.value = [];
    };

    const checkWord = (s, e, grid, allWords) => {
        const dr = Math.sign(e.r - s.r); 
        const dc = Math.sign(e.c - s.c); 
        const steps = Math.max(Math.abs(e.r - s.r), Math.abs(e.c - s.c));

        if (dr !== 0 && dc !== 0 && Math.abs(e.r - s.r) !== Math.abs(e.c - s.c)) return null;

        let str = "";
        for (let i = 0; i <= steps; i++) {
            str += grid[s.r + (dr * i)][s.c + (dc * i)];
        }

        const rev = str.split('').reverse().join('');
        if (allWords.includes(str)) return str;
        if (allWords.includes(rev)) return rev;
        return null;
    };

    const markWordFound = (s, e, word, isLocal, state) => {
        state.foundWords.value.push(word);
        
        playBeep(isLocal ? 800 : 400);

        if (isLocal) {
            state.myScore.value += 10;
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        } else {
            state.opponentScore.value += 10;
        }

        const dr = Math.sign(e.r - s.r);
        const dc = Math.sign(e.c - s.c);
        const steps = Math.max(Math.abs(e.r - s.r), Math.abs(e.c - s.c));

        // EFEK WAVE: Masukkan koordinat satu demi satu dengan delay
        for (let i = 0; i <= steps; i++) {
            setTimeout(() => {
                state.foundCoordinates.value.push({ 
                    r: s.r + (dr * i), 
                    c: s.c + (dc * i) 
                });
            }, i * 70); // 70ms delay setiap huruf untuk kesan "flow"
        }

        if (state.foundWords.value.length === state.words.value.length && state.words.value.length > 0) {
            const won = state.myScore.value >= state.opponentScore.value;
            
            // Delay modal sikit supaya wave sempat habis
            setTimeout(() => {
                playEndSound(won);
                state.showWinner.value = true;

                if (state.mode.value === 'multi' && window.currentConn) {
                    window.currentConn.send({
                        type: 'GAMEOVER'
                    });
                }
            }, (steps * 70) + 500);
            
            console.log("Pusingan Tamat");
        }
    };

    return { handleCellClick };
};
