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
        
        // Kemenangan sesi (Reset bila keluar/refresh)
        const myWins = ref(0);
        const opponentWins = ref(0);
        
        const selectedCells = ref([]);
        const foundCoordinates = ref([]);

        let peer = null;
        let conn = null;

        // Bunyi Beep Sintetik (Tanpa fail luaran)
        const playBeep = (freq = 440, duration = 0.15) => {
            try {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = context.createOscillator();
                const gain = context.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, context.currentTime);
                gain.gain.setValueAtTime(0.1, context.currentTime);
                oscillator.connect(gain);
                gain.connect(context.destination);
                oscillator.start();
                oscillator.stop(context.currentTime + duration);
            } catch (e) { console.log("Audio ralat"); }
        };

        onMounted(() => {
            const savedName = localStorage.getItem('ws_user_name');
            if (savedName) {
                myName.value = savedName;
                isNameSaved.value = true;
            }
        });

        const generateShortId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

        const handleLogin = () => {
            if (!myName.value) return;
            localStorage.setItem('ws_user_name', myName.value);
            
            const shortId = generateShortId();
            myId.value = shortId;
            peer = new Peer(shortId);

            peer.on('open', () => { screen.value = 'menu'; });

            // PENTING: Untuk Host (Phone 1) terima connection
            peer.on('connection', c => {
                conn = c;
                mode.value = 'multi';
                // Ambil nama Guest dari metadata
                if (conn.metadata) {
                    opponentName.value = conn.metadata.name;
                    opponentWins.value = conn.metadata.wins || 0;
                }
                setupConnection();
            });

            peer.on('error', err => {
                if(err.type === 'unavailable-id') handleLogin();
                else alert('Ralat: ' + err.type);
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
            const allWords = data.list.map(w => w.toUpperCase());
            const gameData = generateGrid(10, allWords);
            grid.value = gameData.grid;
            words.value = gameData.words;
        };

        const nextGame = async () => {
            // Update skor sesi
            if (myScore.value > opponentScore.value) myWins.value++;
            else if (opponentScore.value > myScore.value) opponentWins.value++;
            
            resetGameState();
            if (mode.value === 'single') {
                await createNewGrid();
            } else if (conn && myId.value < conn.peer) {
                await createNewGrid();
                // Host hantar grid baru & data sesi terkini
                conn.send({ 
                    type: 'START', 
                    grid: grid.value, 
                    words: words.value, 
                    hostName: myName.value,
                    wins: { host: myWins.value, guest: opponentWins.value } 
                });
            }
        };

        const startSinglePlayer = async () => {
            mode.value = 'single';
            screen.value = 'game';
            resetGameState();
            myWins.value = 0; 
            await createNewGrid();
        };

        const connectToPeer = () => {
            if (!peerIdInput.value) return alert('ID Lawan!');
            // Guest hantar nama kita dalam metadata semasa mula connect
            conn = peer.connect(peerIdInput.value, { 
                metadata: { name: myName.value, wins: myWins.value } 
            });
            mode.value = 'multi';
            setupConnection();
        };

        const setupConnection = () => {
            conn.on('open', () => {
                // Untuk Guest (Phone 2), ambil nama Host dari metadata
                if (conn.metadata) {
                    opponentName.value = conn.metadata.name;
                    opponentWins.value = conn.metadata.wins || 0;
                }
                screen.value = 'game';
                if (myId.value < conn.peer) initMultiplayer();
            });

            conn.on('data', (data) => {
                if (data.type === 'START') {
                    resetGameState();
                    grid.value = data.grid;
                    words.value = data.words;
                    
                    // Guest terima nama Host secara rasmi
                    if (data.hostName) opponentName.value = data.hostName;

                    // Sinkronkan jumlah kemenangan sesi (Host vs Guest)
                    if (data.wins) {
                        if (myId.value < conn.peer) { // Saya Host
                            myWins.value = data.wins.host;
                            opponentWins.value = data.wins.guest;
                        } else { // Saya Guest
                            myWins.value = data.wins.guest;
                            opponentWins.value = data.wins.host;
                        }
                    }
                } else if (data.type === 'FOUND') {
                    markWordFound(data.start, data.end, data.word, false);
                }
            });
        };

        const initMultiplayer = async () => {
            await createNewGrid();
            // Host hantar grid pusingan pertama & identitinya
            conn.send({ 
                type: 'START', 
                grid: grid.value, 
                words: words.value, 
                hostName: myName.value,
                wins: { host: myWins.value, guest: opponentWins.value } 
            });
        };

        const handleCellClick = (r, c, char) => {
            if (foundWords.value.length === words.value.length && words.value.length > 0) return;
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
            for (let i = 0; i <= steps; i++) {
                const row = s.r + dr * i;
                const col = s.c + dc * i;
                str += grid.value[row][col];
            }
            const rev = str.split('').reverse().join('');
            if (words.value.includes(str) && !foundWords.value.includes(str)) return str;
            if (words.value.includes(rev) && !foundWords.value.includes(rev)) return rev;
            return null;
        };

        const markWordFound = (s, e, word, isLocal) => {
            foundWords.value.push(word);
            playBeep(isLocal ? 880 : 440);
            if (isLocal) { 
                myScore.value += 10; 
                if (navigator.vibrate) navigator.vibrate(100); 
            } else { 
                opponentScore.value += 10; 
            }
            
            const distR = e.r - s.r, distC = e.c - s.c;
            const steps = Math.max(Math.abs(distR), Math.abs(distC));
            const dr = distR === 0 ? 0 : distR / steps, dc = distC === 0 ? 0 : dc / steps;
            
            for (let i = 0; i <= steps; i++) {
                const r = s.r + dr * i, c = s.c + dc * i;
                foundCoordinates.value.push({ r, c, animate: true });
                setTimeout(() => {
                    const cell = foundCoordinates.value.find(coord => coord.r === r && coord.c === c);
                    if (cell) cell.animate = false;
                }, 600);
            }
        };

        const isSelected = (r, c) => selectedCells.value.some(cell => cell.r === r && cell.c === c);
        const isFound = (r, c) => foundCoordinates.value.some(coord => coord.r === r && coord.c === c);
        const shouldAnimate = (r, c) => foundCoordinates.value.some(coord => coord.r === r && coord.c === c && coord.animate);

        return { 
            screen, mode, myId, myName, peerIdInput, opponentName, grid, words, isNameSaved,
            myScore, opponentScore, myWins, opponentWins, foundWords, handleCellClick, 
            isSelected, isFound, shouldAnimate, startSinglePlayer, connectToPeer, handleLogin, deleteName, nextGame
        };
    }
}).mount('#app');
