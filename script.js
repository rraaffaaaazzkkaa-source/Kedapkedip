let track = null;
let isStrobeOn = false;
let strobeInterval = null;
let flashState = false;

const toggleBtn = document.getElementById('toggle-btn');
const statusText = document.getElementById('status');
const speedInput = document.getElementById('speed');
const speedValue = document.getElementById('speed-value');

// Update teks indikator kecepatan saat slider digeser
speedInput.addEventListener('input', () => {
    speedValue.textContent = `${speedInput.value} ms`;
    // Jika strobe sedang jalan, restart interval untuk menerapkan kecepatan baru
    if (isStrobeOn) {
        stopStrobeLoop();
        startStrobeLoop();
    }
});

toggleBtn.addEventListener('click', async () => {
    if (!isStrobeOn) {
        await initCameraAndTorch();
    } else {
        stopStrobe();
    }
});

// Fungsi untuk meminta izin kamera dan mengambil track video
async function initCameraAndTorch() {
    try {
        statusText.textContent = "Meminta izin kamera...";
        
        // Meminta akses ke kamera belakang
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" } }
        });
        
        track = stream.getVideoTracks()[0];
        
        // Cek apakah perangkat mendukung fitur senter (torch)
        const capabilities = track.getCapabilities();
        if (!capabilities.torch) {
            alert("Maaf, perangkat atau browser Anda tidak mendukung kontrol senter.");
            stopStream(stream);
            statusText.textContent = "Tidak Didukung";
            return;
        }

        // Mulai loop kedap-kedip
        isStrobeOn = true;
        toggleBtn.textContent = "STOP";
        toggleBtn.className = "btn-stop";
        statusText.textContent = "Kedap-kedip Aktif";
        startStrobeLoop();

    } catch (error) {
        console.error("Gagal mengakses senter:", error);
        alert("Gagal mengakses kamera/senter. Pastikan Anda menggunakan HTTPS dan memberi izin kamera.");
        statusText.textContent = "Mati (Error)";
    }
}

// Fungsi untuk menjalankan loop kedip
function startStrobeLoop() {
    const speed = parseInt(speedInput.value);
    
    strobeInterval = setInterval(async () => {
        if (!track) return;
        try {
            flashState = !flashState;
            await track.applyConstraints({
                advanced: [{ torch: flashState }]
            });
        } catch (err) {
            console.error("Gagal mengubah status senter:", err);
        }
    }, speed);
}

// Fungsi untuk menghentikan interval loop
function stopStrobeLoop() {
    if (strobeInterval) {
        clearInterval(strobeInterval);
    }
}

// Fungsi penuh untuk mematikan mode strobe dan membebaskan kamera
function stopStrobe() {
    isStrobeOn = false;
    stopStrobeLoop();
    
    if (track) {
        // Matikan senter secara mutlak sebelum stop track
        track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
        track.stop(); // Melepas kunci kamera agar baterai tidak boros
        track = null;
    }
    
    toggleBtn.textContent = "MULAI";
    toggleBtn.className = "btn-start";
    statusText.textContent = "Mati";
}

// Fungsi pembantu jika perangkat tidak punya senter
function stopStream(stream) {
    stream.getTracks().forEach(track => track.stop());
}
