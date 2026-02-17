import { generateGrid } from './placeword.js';
import { playBeep, playEndSound } from './sound.js';

const { createApp, ref, onMounted } = Vue; 

createApp({
    setup() {
        const screen = ref('login');
        const mode = ref('single'); 
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
        const myWins = ref(0);
        const opponentWins = ref(0);
        const selectedCells = ref([]);
        const foundCoordinates = ref([]);
        let peer = null;
        let conn = null;

        onMounted(() => {
            const savedName = localStorage.getItem('ws_user_name');
            if (savedName) { myName.value = savedName; isNameSaved.value = true; }
        });

        const handleLogin = () => {
            if (!myName.value) return;
            localStorage.setItem('ws_user_name', myName.value);
            myId.value = Math.random().toString(36).substring(2, 6).toUpperCase();
            peer = new Peer(myId.value);
            peer.on('open', () => screen.value = 'menu');
            peer.on('connection', c => { conn = c; setupConnection(); });
        };

        const setupConnection = () => {
            conn.on('open', () => {
                screen.value = 'game'; mode.value = 'multi';
                conn.send({ type: 'HANDSHAKE', name: myName.value });
            });
            conn.on('data', async (data) => {
                if (data.type === 'HANDSHAKE') {
                    opponentName.value = data.name;
                    if (!data.isReply) conn.send({ type: 'HANDSHAKE', name: myName.value, isReply: true });
                    if (myId.value < conn.peer) await nextGame(true); 
                }
                if (data.type === 'START') {
                    resetGameState();
                    grid.value = data.grid; words.value = data.words;
                    myWins.value = data.winsYou; opponentWins.value = data.winsOpp;
                }
                if (data.type === 'FOUND') markWordFound(data.start, data.end, data.word, false);
            });
        };

        const nextGame = async (isFirst = false) => {
            if (!isFirst) {
                if (myScore.value > opponentScore.value) {
                    myWins.value++;
                    // playEndSound dialihkan ke markWordFound untuk trigger automatik
                } else if (opponentScore.value > myScore.value) {
                    opponentWins.value++;
                }
            }
            resetGameState();
            await createNewGrid();
            if (mode.value === 'multi' && conn) {
                conn.send({ type: 'START', grid: grid.value, words: words.value, winsYou: opponentWins.value, winsOpp: myWins.value });
            }
        };

        const resetGameState = () => {
            grid.value = []; words.value = []; foundWords.value = [];
            foundCoordinates.value = []; myScore.value = 0; opponentScore.value = 0;
            selectedCells.value = [];
        };

        const createNewGrid = async () => {
            try {
                const res = await fetch('words.json');
                const data = await res.json();
                const gameData = generateGrid(10, data.list);
                grid.value = gameData.grid;
                words.value = gameData.words;
            } catch (err) { console.error(err); }
        };

        const handleCellClick = (r, c, char) => {
            if (selectedCells.value.length === 0) {
                selectedCells.value.push({ r, c, char });
            } else {
                const start = selectedCells.value[0], end = { r, c, char };
                const word = checkWord(start, end);
                if (word) {
                    markWordFound(start, end, word, true);
                    if (mode.value === 'multi' && conn) conn.send({ type: 'FOUND', start, end, word });
                }
                selectedCells.value = [];
            }
        };

        const checkWord = (s, e) => {
            const dr = Math.sign(e.r - s.r), dc = Math.sign(e.c - s.c);
            const steps = Math.max(Math.abs(e.r - s.r), Math.abs(e.c - s.c));
            if (dr !== 0 && dc !== 0 && Math.abs(e.r - s.r) !== Math.abs(e.c - s.c)) return null;
            let str = "";
            for (let i = 0; i <= steps; i++) str += grid.value[s.r + dr * i][s.c + dc * i];
            const rev = str.split('').reverse().join('');
            if (words.value.includes(str) && !foundWords.value.includes(str)) return str;
            if (words.value.includes(rev) && !foundWords.value.includes(rev)) return rev;
            return null;
        };

        const markWordFound = (s, e, word, isLocal) => {
            foundWords.value.push(word);
            playBeep(isLocal ? 800 : 400);

            if (isLocal) { 
                myScore.value += 10; 
                if (navigator.vibrate) navigator.vibrate(100); 
            } else { 
                opponentScore.value += 10; 
            }

            // LOGIK BARU: Main bunyi Menang/Kalah sebaik sahaja perkataan terakhir dijumpai
            if (foundWords.value.length === words.value.length && words.value.length > 0) {
                if (myScore.value > opponentScore.value) {
                    playEndSound(true); // Sorakan/Menang
                } else if (opponentScore.value > myScore.value) {
                    playEndSound(false); // Boo/Kalah
                }
            }

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
            startSinglePlayer: async () => { mode.value = 'single'; screen.value = 'game'; await createNewGrid(); },
            connectToPeer: () => { conn = peer.connect(peerIdInput.value.toUpperCase()); setupConnection(); },
            handleLogin, nextGame, exitGame: () => window.location.reload(),
            deleteName: () => { localStorage.clear(); window.location.reload(); }
        };
    }
}).mount('#app');
