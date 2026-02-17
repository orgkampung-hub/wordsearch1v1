# 🧩 Word Search Neon (P2P Multiplayer)

Satu permainan cari kata bertema **Neon Cyberpunk** yang dibina menggunakan Vue.js dan PeerJS. Permainan ini menyokong mod **Single Player** dan **Multiplayer (1v1)** secara masa nyata (real-time) tanpa memerlukan server backend yang kompleks.

## ✨ Ciri-Ciri Utama

* **P2P Multiplayer**: Main bersama kawan menggunakan ID unik melalui teknologi WebRTC (PeerJS).
* **Penjana Grid Pintar**: Grid 10x10 dihasilkan secara automatik dengan algoritma yang menyokong 8 arah (mendatar, menegak, dan menyerong).
* **Sistem Sesi WINS**: Penjejakan jumlah kemenangan (WINS) dalam satu sesi permainan yang menyeronokkan.
* **UI Neon Responsif**: Reka bentuk yang dioptimumkan untuk peranti mudah alih dengan kesan animasi *glow* dan *pulsing*.
* **Sistem Handshake**: Pertukaran nama pemain secara automatik untuk memastikan identiti lawan sentiasa selari.

## 🚀 Teknologi Yang Digunakan

* **Frontend**: [Vue.js 3](https://vuejs.org/) (Composition API)
* **P2P Connection**: [PeerJS](https://peerjs.com/)
* **Styling**: CSS3 (Flexbox, CSS Grid, Keyframe Animations)
* **Data**: JSON (Senarai perkataan Bahasa Melayu yang dikategorikan)

## 📁 Struktur Fail

* `index.html` - Struktur utama dan UI aplikasi.
* `script.js` - Logik utama permainan, pengurusan state, dan sambungan P2P.
* `placeword.js` - Algoritma penjanaan grid dan peletakan perkataan.
* `game.css` - Gaya visual scoreboard, grid, dan sel huruf.
* `winning.css` - Gaya visual untuk overlay kemenangan.
* `words.json` - Pangkalan data perkataan (120+ perkataan unik).

## 🎮 Cara Bermula

1.  **Muat Turun**: Pastikan semua fail berada dalam satu folder yang sama.
2.  **Jalankan**: Gunakan *Live Server* (contohnya melalui VS Code) untuk membuka `index.html`.
3.  **Login**: Masukkan nama anda untuk menjana ID unik.
4.  **Multiplayer**:
    * **Pemain 1 (Host)**: Berikan ID anda kepada kawan.
    * **Pemain 2 (Guest)**: Masukkan ID kawan anda dan tekan **Connect & Play**.

## 🛠️ Logik Permainan

* **Skor**: Setiap perkataan yang dijumpai memberi **10 mata**.
* **Kemenangan**: Pemain dengan skor tertinggi selepas grid selesai dikira pemenang dan mendapat **+1 WIN**.
* **Reset**: Menekan butang **TAMAT & RESET** akan memuat semula halaman dan mengosongkan jumlah kemenangan sesi tersebut.

## 📝 Nota Pembangunan
Permainan ini menggunakan sistem *Peer-to-Peer*. Pastikan kedua-dua peranti mempunyai sambungan internet yang stabil untuk memastikan pertukaran data (koordinat perkataan yang dijumpai) berjalan lancar.
