import { generateGrid } from './placeword.js';
import { playBeep, playEndSound } from './sound.js';
import { useGame } from './game.js';

const { createApp, ref, onMounted } = Vue; 

createApp({
    setup() {
        const screen = ref('login');
        const mode = ref('single'); 
        const isNameSaved = ref(false);
        const showTutorial = ref(false); 
        const showWinner = ref(false); 
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

        const { handleCellClick } = useGame({
            grid, words, foundWords, myScore, opponentScore, 
            mode, selectedCells, foundCoordinates, showWinner
        });

        onMounted(() => {
            const savedName = localStorage.getItem('ws_user_name');
            if (savedName) { myName.value = savedName; isNameSaved.value = true; }
        });

        const createNewGrid = async () => {
            try {
                const res = await fetch('words.json');
                const data = await res.json();
                const gameData = generateGrid(10, data.list);
                grid.value = gameData.grid;
                words.value = gameData.words;
            } catch (err) { console.error("Gagal jana grid:", err); }
        };

        const resetGameState = () => {
            grid.value = []; words.value = []; foundWords.value = [];
            foundCoordinates.value = []; myScore.value = 0; opponentScore.value = 0;
            selectedCells.value = [];
        };

        const setupConnection = () => {
            window.currentConn = conn;
            conn.on('open', () => {
                screen.value = 'game'; mode.value = 'multi';
                conn.send({ type: 'HANDSHAKE', name: myName.value });
                playBeep(200, 0.05); 
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
                    showWinner.value = false; 
                    screen.value = 'game';
                }
                if (data.type === 'FOUND') {
                    const dr = Math.sign(data.end.r - data.start.r);
                    const dc = Math.sign(data.end.c - data.start.c);
                    const steps = Math.max(Math.abs(data.end.r - data.start.r), Math.abs(data.end.c - data.start.c));

                    // EFEK WAVE UNTUK LAWAN
                    for (let i = 0; i <= steps; i++) {
                        setTimeout(() => {
                            foundCoordinates.value.push({ 
                                r: data.start.r + (dr * i), 
                                c: data.start.c + (dc * i) 
                            });
                        }, i * 70);
                    }
                    
                    foundWords.value.push(data.word);
                    opponentScore.value += 10;
                    playBeep(400, 0.2);
                }
                
                if (data.type === 'GAMEOVER') {
                    // Delay sikit supaya sempat tengok wave terakhir lawan habis
                    setTimeout(() => {
                        const won = myScore.value >= opponentScore.value;
                        playEndSound(won);
                        showWinner.value = true;
                    }, 800);
                }
            });
        };

        const handleLogin = () => {
            if (!myName.value) return;
            localStorage.setItem('ws_user_name', myName.value);
            myId.value = Math.random().toString(36).substring(2, 6).toUpperCase();
            peer = new Peer(myId.value);
            peer.on('open', () => {
                screen.value = 'menu';
                playBeep(200, 0.01);
            });
            peer.on('connection', c => { conn = c; setupConnection(); });
        };

        const nextGame = async (isFirst = false) => {
            if (!isFirst) {
                if (myScore.value > opponentScore.value) myWins.value++;
                else if (opponentScore.value > myScore.value) opponentWins.value++;
            }
            resetGameState();
            await createNewGrid();
            if (mode.value === 'multi' && conn) {
                conn.send({ 
                    type: 'START', 
                    grid: grid.value, 
                    words: words.value, 
                    winsYou: opponentWins.value, 
                    winsOpp: myWins.value 
                });
            }
        };

        return { 
            screen, mode, myId, myName, peerIdInput, opponentName, grid, words, isNameSaved,
            showTutorial, showWinner, myScore, opponentScore, myWins, opponentWins, foundWords, handleCellClick, 
            isSelected: (r, c) => selectedCells.value.some(cell => cell.r === r && cell.c === c),
            isFound: (r, c) => foundCoordinates.value.some(coord => coord.r === r && coord.c === c),
            startSinglePlayer: async () => { 
                mode.value = 'single'; 
                screen.value = 'game'; 
                showWinner.value = false;
                await createNewGrid(); 
                playBeep(600, 0.1);
            },
            handleNextGame: () => {
                showWinner.value = false;
                nextGame(false);
            },
            connectToPeer: () => { 
                if(!peerIdInput.value) return;
                conn = peer.connect(peerIdInput.value.toUpperCase()); 
                setupConnection(); 
            },
            handleLogin, nextGame, exitGame: () => window.location.reload(),
            deleteName: () => { localStorage.clear(); window.location.reload(); }
        };
    }
}).mount('#app');
