import { generateGrid } from './placeword.js';

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
        
        // Simpan jumlah kemenangan keseluruhan (Match Score)
        const myWins = ref(0);
        const opponentWins = ref(0);
        
        const selectedCells = ref([]);
        const foundCoordinates = ref([]);

        let peer = null;
        let conn = null;

        onMounted(() => {
            const savedName = localStorage.getItem('ws_user_name');
            if (savedName) {
                myName.value = savedName;
                isNameSaved.value = true;
            }
            // Load jumlah kemenangan dari storage jika ada
            myWins.value = parseInt(localStorage.getItem('ws_wins') || '0');
        });

        const generateShortId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

        const handleLogin = () => {
            if (!myName.value) return;
            localStorage.setItem('ws_user_name', myName.value);
            const shortId = generateShortId();
            myId.value = shortId;
            peer = new Peer(shortId);
            peer.on('open', () => screen.value = 'menu');
            peer.on('connection', c => {
                conn = c;
                mode.value = 'multi';
                setupConnection();
            });
            peer.on('error', err => {
                if(err.type === 'unavailable-id') handleLogin();
                else alert('Ralat: ' + err.type);
            });
        };

        const deleteName = () => {
            localStorage.removeItem('ws_user_name');
            localStorage.removeItem('ws_wins');
            window.location.reload();
        };

        const startSinglePlayer = async () => {
            mode.value = 'single';
            screen.value = 'game';
            resetGameState();
            await createNewGrid();
        };

        // Fungsi untuk pusingan seterusnya
        const nextGame = async () => {
            if (myScore.value > opponentScore.value) {
                myWins.value++;
                localStorage.setItem('ws_wins', myWins.value);
            } else if (opponentScore.value > myScore.value) {
                opponentWins.value++;
            }
            
            resetGameState();
            if (mode.value === 'single') {
                await createNewGrid();
            } else if (conn && myId.value < conn.peer) {
                // Host janakan grid baru untuk multiplayer
                await createNewGrid();
                conn.send({ type: 'START', grid: grid.value, words: words.value });
            }
        };

        const resetGameState = () => {
            grid.value = [];
            words.value = [];
            foundWords.value = [];
            foundCoordinates.value = [];
            myScore.value = 0;
            opponentScore.value = 0;
            selectedCells.value = [];
        };

        const createNewGrid = async () => {
            const allWordsList = await loadWords();
            const gameData = generateGrid(10, allWordsList);
            grid.value = gameData.grid;
            words.value = gameData.words;
        };

        const connectToPeer = () => {
            if (!peerIdInput.value) return alert('ID Lawan diperlukan!');
            conn = peer.connect(peerIdInput.value, { metadata: { name: myName.value, wins: myWins.value } });
            mode.value = 'multi';
            setupConnection();
        };

        const setupConnection = () => {
            conn.on('open', () => {
                opponentName.value = conn.metadata?.name || "Lawan";
                opponentWins.value = conn.metadata?.wins || 0;
                screen.value = 'game';
                initMultiplayer();
            });
            conn.on('data', (data) => {
                if (data.type === 'START') {
                    resetGameState();
                    grid.value = data.grid;
                    words.value = data.words;
                } else if (data.type === 'FOUND') {
                    markWordFound(data.start, data.end, data.word, false);
                }
            });
        };

        const loadWords = async () => {
            const res = await fetch('words.json');
            const data = await res.json();
            return data.list.map(w => w.toUpperCase());
        };

        const initMultiplayer = async () => {
            if (myId.value < conn.peer) { 
                await createNewGrid();
                conn.send({ type: 'START', grid: grid.value, words: words.value });
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
                    if (mode.value === 'multi' && conn) conn.send({ type: 'FOUND', start, end, word });
                }
                selectedCells.value = [];
            }
        };

        const checkWord = (s, e) => {
            let str = "";
            const distR = e.r - s.r, distC = e.c - s.c;
            const steps = Math.max(Math.abs(distR), Math.abs(distC));
            if (distR !== 0 && distC !== 0 && Math.abs(distR) !== Math.abs(distC)) return null;
            const dr = distR === 0 ? 0 : distR / steps, dc = distC === 0 ? 0 : distC / steps;
            for (let i = 0; i <= steps; i++) str += grid.value[s.r + dr * i][s.c + dc * i];
            const rev = str.split('').reverse().join('');
            if (words.value.includes(str) && !foundWords.value.includes(str)) return str;
            if (words.value.includes(rev) && !foundWords.value.includes(rev)) return rev;
            return null;
        };

        const highlightCoordinates = (s, e) => {
            const distR = e.r - s.r, distC = e.c - s.c;
            const steps = Math.max(Math.abs(distR), Math.abs(distC));
            const dr = distR === 0 ? 0 : distR / steps, dc = distC === 0 ? 0 : distC / steps;
            for (let i = 0; i <= steps; i++) foundCoordinates.value.push({ r: s.r + dr * i, c: s.c + dc * i });
        };

        const markWordFound = (s, e, word, isLocal) => {
            foundWords.value.push(word);
            if (isLocal) { 
                myScore.value += 10; 
                if (navigator.vibrate) navigator.vibrate(100); 
            } else { 
                opponentScore.value += 10; 
            }
            highlightCoordinates(s, e);
        };

        const isSelected = (r, c) => selectedCells.value.some(cell => cell.r === r && cell.c === c);
        const isFound = (r, c) => foundCoordinates.value.some(coord => coord.r === r && coord.c === c);

        return { 
            screen, mode, myId, myName, peerIdInput, opponentName, grid, words, isNameSaved,
            myScore, opponentScore, myWins, opponentWins, foundWords, handleCellClick, 
            isSelected, isFound, startSinglePlayer, connectToPeer, handleLogin, deleteName, nextGame
        };
    }
}).mount('#app');
