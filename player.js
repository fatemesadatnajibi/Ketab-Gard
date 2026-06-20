let allSongs = [];
let currentIndex = 0;
const audio = new Audio();
let isPlaying = false;

// المان‌ها
const trackName = document.getElementById('track-name');
const trackSinger = document.getElementById('track-singer');
const lyricsContent = document.getElementById('lyrics-content');
const playBtn = document.getElementById('play-btn');
const progressBar = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const durationTimeEl = document.getElementById('duration-time');
const vinylDisc = document.getElementById('vinyl-disc');
const toneArm = document.getElementById('tone-arm');
const labelTitle = document.getElementById('label-title');
const labelArtist = document.getElementById('label-artist');

function initPlayer() {
    const playlistRaw = localStorage.getItem('player_playlist');
    const indexRaw = localStorage.getItem('player_current_index');

    if (!playlistRaw || indexRaw === null) {
        if(trackName) trackName.innerText = 'آوایی انتخاب نشده است.';
        return;
    }

    allSongs = JSON.parse(playlistRaw);
    currentIndex = parseInt(indexRaw, 10);

    renderSong();
    
    // اجرای اتوماتیک موزیک بلافاصله پس از ورود با یک تاخیر کوتاه برای حس طبیعی حرکت بازو
    setTimeout(toggleAudio, 500);
}

function renderSong() {
    if (allSongs.length === 0) return;
    const song = allSongs[currentIndex];

    audio.pause();
    isPlaying = false;
    if(playBtn) playBtn.innerText = '▶';
    if(vinylDisc) vinylDisc.classList.remove('spinning');
    if(toneArm) toneArm.classList.remove('active');

    if(trackName) trackName.innerText = song.source || 'اثر صوتی';
    if(trackSinger) trackSinger.innerText = song.singer || 'خواننده نامشخص';
    if(labelTitle) labelTitle.innerText = song.source || 'نغمه قلم';
    if(labelArtist) labelArtist.innerText = song.singer || 'آوا';
    if(lyricsContent) lyricsContent.innerHTML = (song.text || 'متنی برای این اثر صوتی ثبت نشده است.').replace(/\n/g, '<br>');

    if (song.audio_url) {
        audio.src = song.audio_url;
    }

    if(progressBar) progressBar.value = 0;
    if(currentTimeEl) currentTimeEl.innerText = '0:00';
    if(durationTimeEl) durationTimeEl.innerText = '0:00';
}

function toggleAudio() {
    if (!audio.src) return;

    if (isPlaying) {
        audio.pause();
        if(playBtn) playBtn.innerText = '▶';
        if(vinylDisc) vinylDisc.classList.remove('spinning');
        if(toneArm) toneArm.classList.remove('active');
        isPlaying = false;
    } else {
        audio.play().catch(err => console.error("خطای بارگذاری فایل صوتی:", err.message));
        if(playBtn) playBtn.innerText = '⏸';
        if(vinylDisc) vinylDisc.classList.add('spinning');
        if(toneArm) toneArm.classList.add('active');
        isPlaying = true;
    }
}

function playNext() {
    if (allSongs.length <= 1) return;
    currentIndex = (currentIndex + 1) % allSongs.length;
    localStorage.setItem('player_current_index', currentIndex); // بروزرسانی جایگاه
    renderSong();
    setTimeout(toggleAudio, 400);
}

function playPrevious() {
    if (allSongs.length <= 1) return;
    currentIndex = (currentIndex - 1 + allSongs.length) % allSongs.length;
    localStorage.setItem('player_current_index', currentIndex); // بروزرسانی جایگاه
    renderSong();
    setTimeout(toggleAudio, 400);
}

// گوش به زنگ‌های نوار تایم لاین
audio.addEventListener('timeupdate', () => {
    if (!audio.duration || isNaN(audio.duration)) return;
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    if(progressBar) progressBar.value = progressPercent;
    if(currentTimeEl) currentTimeEl.innerText = formatTime(audio.currentTime);
    if(durationTimeEl) durationTimeEl.innerText = formatTime(audio.duration);
});

if(progressBar) {
    progressBar.addEventListener('input', () => {
        if (!audio.duration) return;
        audio.currentTime = (progressBar.value * audio.duration) / 100;
    });
}

audio.addEventListener('ended', playNext);

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function exitPlayer() {
    audio.pause();
    window.location.href = 'songs.html';
}

window.onload = initPlayer;