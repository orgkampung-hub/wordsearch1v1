import { generateGrid } from './placeword.js';

export const useGame = (state) => {
    
    const handleCellClick = (r, c, char) => {
        // Tap 1
        if (state.selectedCells.value.length === 0) {
            state.selectedCells.value.push({ r, c, char });
            return;
        }

        // Tap 2: Batalkan jika tap tempat sama
        const start = state.selectedCells.value[0];
        if (start.r === r && start.c === c) {
            state.selectedCells.value = [];
            return;
        }

        // Proses Pemilihan
        const end = { r, c, char };
        const word = checkWord(start, end, state.grid.value, state.words.value);

        if (word && !state.foundWords.value.includes(word)) {
            markWordFound(start, end, word, true, state);
            
            // Jika multiplayer, hantar data ke lawan
            if (state.mode.value === 'multi' && window.currentConn) {
                window.currentConn.send({
                    type: 'FOUND',
                    start,
                    end,
                    word
                });
            }
        }
        
        // Reset Tap
        state.selectedCells.value = [];
    };

    const checkWord = (s, e, grid, allWords) => {
        let str = "";
        // Horizontal
        if (s.r === e.r) {
            const min = Math.min(s.c, e.c);
            const max = Math.max(s.c, e.c);
            for (let i = min; i <= max; i++) str += grid[s.r][i];
        } 
        // Vertical
        else if (s.c === e.c) {
            const min = Math.min(s.r, e.r);
            const max = Math.max(s.r, e.r);
            for (let i = min; i <= max; i++) str += grid[i][s.c];
        }

        const rev = str.split('').reverse().join('');
        if (allWords.includes(str)) return str;
        if (allWords.includes(rev)) return rev;
        return null;
    };

    const markWordFound = (s, e, word, isLocal, state) => {
        state.foundWords.value.push(word);
        
        if (isLocal) {
            state.myScore.value += 10;
            // Vibrate Neon Effect
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        } else {
            state.opponentScore.value += 10;
            if (navigator.vibrate) navigator.vibrate(200); // Getar panjang sikit jika lawan jumpa
        }

        // Simpan koordinat untuk CSS .found (Neon Green)
        const minR = Math.min(s.r, e.r), maxR = Math.max(s.r, e.r);
        const minC = Math.min(s.c, e.c), maxC = Math.max(s.c, e.c);

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                state.foundCoordinates.value.push({ r, c });
            }
        }

        if (state.foundWords.value.length === state.words.value.length) {
            setTimeout(() => alert("GAME TAMAT!"), 500);
        }
    };

    return { handleCellClick };
};
