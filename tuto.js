// tuto.js
export const tutorialTemplate = `
<div class="modal-overlay" @click.self="showTutorial = false">
    <div class="modal-content">
        <h3>Cara Main 1v1 🧩</h3>
        <div class="tutorial-steps">
            <div class="step">
                <div class="step-num">1</div>
                <div class="step-text">Masukkan nama dan tekan <b>Mula</b>.</div>
            </div>
            <div class="step">
                <div class="step-num">2</div>
                <div class="step-text"><b>Pemain A:</b> Salin ID anda dan hantar pada kawan.</div>
            </div>
            <div class="step">
                <div class="step-num">3</div>
                <div class="step-text"><b>Pemain B:</b> Masukkan ID kawan dalam kotak "ID Lawan" & tekan <b>Sambung</b>.</div>
            </div>
            <div class="step">
                <div class="step-num">4</div>
                <div class="step-text">Bila dah bersambung, grid akan muncul. Siapa jumpa kata dulu, dia menang markah!</div>
            </div>
        </div>
        <button @click="showTutorial = false" class="btn-close-tuto">Faham!</button>
    </div>
</div>
`;
