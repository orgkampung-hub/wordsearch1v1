import { generateGrid } from './placeword.js';

const { createApp, ref, onMounted } = Vue; 

createApp({
    setup() {
        const screen = ref('login');
        const mode = ref('multi'); 
        const isNameSaved = ref(false);
        const myId = ref('');
        const myName = ref('');
        const peerIdInput = ref('');
        const opponentName = ref('Lawan');
        
        const grid = ref([]);
        const words = ref([]);
        const foundWords = ref([]);
        const myScore = ref(0);
        const opponentScore = ref(0);
        
        // PASTI: Reset sifar setiap kali setup dijalankan
        const myWins = ref(0);
        const opponentWins = ref(0);
        
        const selectedCells = ref([]);
        const foundCoordinates = ref([]);

        let peer = null;
        let conn = null;

        const playBeep = (freq = 440, duration = 0.15) => {
            try {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = context.createOscillator();
                const gain = context.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, context.currentTime);
                gain.gain.setValueAtTime(0.05, context.currentTime);
                oscillator.connect(gain); gain.connect(context.destination);
                oscillator.start(); oscillator.stop(context.currentTime + duration);
            } catch (e) {}
        };

        onMounted(() => {
            const savedName = localStorage.getItem('ws_user_name');
            if (savedName) {
                myName.value = savedName;
                isNameSaved.value = true;
            }
        });

        const handleLogin = () => {
            if (!myName.value) return;
            localStorage.setItem('ws_user_name', myName.value);
            myId.value = Math.random().toString(36).substring(2, 6).toUpperCase();
            peer = new Peer(myId.value);
            peer.on('open', () => screen.value = 'menu');
            
            peer.on('connection', c => {
                conn = c;
                setupConnection();
            });
        };

        const deleteName = () => {
            localStorage.removeItem('ws_user_name');
            window.location.reload();
        };

        const resetGameState = () => {
            grid.value = []; words.value = []; foundWords.value = [];
            foundCoordinates.value = []; myScore.value = 0; opponentScore.value = 0;
            selectedCells.value = [];
        };

        const createNewGrid = async () => {
            const res = await fetch('words.json');
            const data = await res.json();
            const gameData = generateGrid(10, data.list.map(w => w.toUpperCase()));
            grid.value = gameData.grid;
            words.value = gameData.words;
        };

        const startSinglePlayer = async () => {
            mode.value = 'single';
            screen.value = 'game';
            myWins.value = 0; opponentWins.value = 0; // RESET MUTLAK
            resetGameState();
            await createNewGrid();
        };

        const connectToPeer = () => {
            if (!peerIdInput.value) return alert('ID Lawan!');
            conn = peer.connect(peerIdInput.value.toUpperCase());
            setupConnection();
        };

        const setupConnection = () => {
            conn.on('open', () => {
                screen.value = 'game';
                mode.value = 'multi';
                // Handshake: Hantar nama sendiri sebaik sahaja open
                conn.send({ type: 'HANDSHAKE', name: myName.value });
            });

            conn.on('data', async (data) => {
                if (data.type === 'HANDSHAKE') {
                    opponentName.value = data.name;
                    // Balas balik jika kita yang terima connection
                    if (myId.value < conn.peer) {
                        conn.send({ type: 'HANDSHAKE_REPLY', name: myName.value });
                        await nextGame(true); // Host mulakan game pertama
                    }
                }
                if (data.type === 'HANDSHAKE_REPLY') {
                    opponentName.value = data.name;
                }
                if (data.type === 'START') {
                    resetGameState();
                    grid.value = data.grid;
                    words.value = data.words;
                    myWins.value = data.winsGuest; 
                    opponentWins.value = data.winsHost;
                }
                if (data.type === 'FOUND') markWordFound(data.start, data.end, data.word, false);
            });
        };

        const nextGame = async (isFirst = false) => {
            if (!isFirst) {
                if (myScore.value > opponentScore.value) myWins.value++;
                else if (opponentScore.value > myScore.value) opponentWins.value++;
            }
            
            resetGameState();
            if (mode.value === 'single') {
                await createNewGrid();
            } else {
                await createNewGrid();
                conn.send({ 
                    type: 'START', 
                    grid: grid.value, 
                    words: words.value, 
                    winsHost: myWins.value, 
                    winsGuest: opponentWins.value 
                });
            }
        };

        const handleCellClick = (r, c, char) => {
            if (foundWords.value.length === words.value.length) return;
            if (selectedCells.value.length === 0) {
                selectedCells.value.push({ r, c, char });
            } else {
                const start = selectedCells.value[0];
                const end = { r, c, char };
                const word = checkWord(start, end);
                if (word) {
                    markWordFound(start, end, word, true);
                    if (mode.value === 'multi') conn.send({ type: 'FOUND', start, end, word });
                }
                selectedCells.value = [];
            }
        };

        const checkWord = (s, e) => {
            let str = "";
            const dr = Math.sign(e.r - s.r), dc = Math.sign(e.c - s.c);
            const steps = Math.max(Math.abs(e.r - s.r), Math.abs(e.c - s.c));
            if (dr !== 0 && dc !== 0 && Math.abs(e.r - s.r) !== Math.abs(e.c - s.c)) return null;
            for (let i = 0; i <= steps; i++) str += grid.value[s.r + dr * i][s.c + dc * i];
            if (words.value.includes(str) && !foundWords.value.includes(str)) return str;
            const rev = str.split('').reverse().join('');
            if (words.value.includes(rev) && !foundWords.value.includes(rev)) return rev;
            return null;
        };

        const markWordFound = (s, e, word, isLocal) => {
            foundWords.value.push(word);
            playBeep(isLocal ? 800 : 400);
            if (isLocal) { myScore.value += 10; if (navigator.vibrate) navigator.vibrate(100); }
            else opponentScore.value += 10;
            
            const dr = Math.sign(e.r - s.r), dc = Math.sign(e.c - s.c);
            const steps = Math.max(Math.abs(e.r - s.r), Math.abs(e.c - s.c));
            for (let i = 0; i <= steps; i++) {
                const r = s.r + dr * i, c = s.c + dc * i;
                foundCoordinates.value.push({ r, c, animate: true });
                setTimeout(() => {
                    const idx = foundCoordinates.value.findIndex(coord => coord.r === r && coord.c === c && coord.animate);
                    if (idx !== -1) foundCoordinates.value[idx].animate = false;
                }, 600);
            }
        };

        return { 
            screen, mode, myId, myName, peerIdInput, opponentName, grid, words, isNameSaved,
            myScore, opponentScore, myWins, opponentWins, foundWords, handleCellClick, 
            isSelected: (r, c) => selectedCells.value.some(cell => cell.r === r && cell.c === c),
            isFound: (r, c) => foundCoordinates.value.some(coord => coord.r === r && coord.c === c),
            shouldAnimate: (r, c) => foundCoordinates.value.some(coord => coord.r === r && coord.c === c && coord.animate),
            startSinglePlayer, connectToPeer, handleLogin, deleteName, nextGame
        };
    }
}).mount('#app');
