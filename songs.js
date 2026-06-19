// اتصال به سرور سوپابیس
const SUPABASE_URL = 'https://shnuggkkwvyixdmlnugl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Lih64HUZIiKkxniY28yOPA_NL7Hz7km';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// متغیرهای مدیریت پخش صوتی
let musicalQuotes = [];
let currentIndex = 0;
const audio = new Audio(); 
let isPlaying = false;

// المان‌های صفحه HTML
const trackImg = document.getElementById('track-img');
const trackName = document.getElementById('track-name');
const trackSinger = document.getElementById('track-singer');
const lyricsContent = document.getElementById('lyrics-content');
const playBtn = document.getElementById('play-btn');
const progressBar = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const durationTimeEl = document.getElementById('duration-time');

// ۱. دریافت اشعار موزیکال از سوپابیس
async function loadSongsFromServer() {
    try {
        console.log("در حال برقراری ارتباط با سوپابیس برای دریافت اشعار صوتی...");
        
        const { data, error } = await client
            .from('quotes')
            .select('*')
            .eq('has_audio', true); 

        if (error) throw error;

        console.log("دیتای دریافتی از سرور:", data);

        if (!data || data.length === 0) {
            console.warn("هشدار: هیچ رکوردی در دیتابیس پیدا نشد که ستون has_audio آن true باشد!");
            if (trackName) trackName.innerText = "اثری یافت نشد.";
            if (lyricsContent) lyricsContent.innerText = "لطفاً مطمئن شوید در جدول quotes سوپابیس، تیک ستون has_audio را برای حداقل یک شعر فعال کرده‌اید.";
            return;
        }

        musicalQuotes = data;
        renderCurrentSong(); 
    } catch (error) {
        console.error("خطای جدی در بارگذاری اطلاعات:", error.message);
        if (trackName) trackName.innerText = "خطا در اتصال به سرور.";
        if (lyricsContent) lyricsContent.innerText = "مشکلی در دریافت اطلاعات پیش آمد: " + error.message;
    }
}

// ۲. رندر کردن اطلاعات آهنگ فعلی روی صفحه
function renderCurrentSong() {
    if (musicalQuotes.length === 0) return;
    
    const currentTrack = musicalQuotes[currentIndex];
    console.log("در حال نمایش آهنگ فعلی:", currentTrack);

    // متوقف کردن آهنگ قبلی
    audio.pause();
    isPlaying = false;
    if (playBtn) playBtn.innerText = '▶';
    if (trackImg) trackImg.classList.remove('rotating');

    // تزریق اطلاعات دیتابیس به المان‌های صفحه (با بررسی وجود فیلدها)
    if (trackName) trackName.innerText = currentTrack.source || currentTrack.title || "اثر صوتی";
    if (trackSinger) trackSinger.innerText = currentTrack.singer || "خواننده نامشخص";
    
    // مدیریت نمایش متن شعر (بررسی ستون text یا content در دیتابیس شما)
    const rawText = currentTrack.text || currentTrack.content || "متنی برای این اثر ثبت نشده است.";
    if (lyricsContent) lyricsContent.innerHTML = rawText.replace(/\n/g, '<br>');
    
    if (trackImg) {
        trackImg.src = currentTrack.cover_url || 'Icons8/icons8-heart-50.png';
    }
    
    // تنظیم سورس صوتی
    if (currentTrack.audio_url) {
        audio.src = currentTrack.audio_url;
        console.log("لینک آهنگ با موفقیت به پلیر داده شد:", currentTrack.audio_url);
    } else {
        console.error("خطا: فیلد audio_url برای این شعر در دیتابیس خالی است!");
    }

    if (progressBar) progressBar.value = 0;
    if (currentTimeEl) currentTimeEl.innerText = "0:00";
    if (durationTimeEl) durationTimeEl.innerText = "0:00";
}

// ۳. دکمه Play/Pause
function toggleAudio() {
    if (!audio.src) {
        console.error("آهنگی برای پخش بارگذاری نشده است.");
        return;
    }

    if (isPlaying) {
        audio.pause();
        if (playBtn) playBtn.innerText = '▶';
        if (trackImg) trackImg.classList.remove('rotating');
    } else {
        audio.play().catch(err => console.error("مرورگر اجازه پخش خودکار صوتی را نداد:", err.message));
        if (playBtn) playBtn.innerText = '⏸';
        if (trackImg) trackImg.classList.add('rotating');
    }
    isPlaying = !isPlaying;
}

function playNextSong() {
    if (musicalQuotes.length <= 1) return;
    currentIndex = (currentIndex + 1) % musicalQuotes.length;
    renderCurrentSong();
    setTimeout(() => toggleAudio(), 300);
}

function playPreviousSong() {
    if (musicalQuotes.length <= 1) return;
    currentIndex = (currentIndex - 1 + musicalQuotes.length) % musicalQuotes.length;
    renderCurrentSong();
    setTimeout(() => toggleAudio(), 300);
}

// به‌روزرسانی نوار زمان
audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    if (progressBar) progressBar.value = progressPercent;
    if (currentTimeEl) currentTimeEl.innerText = formatTime(audio.currentTime);
    if (durationTimeEl) durationTimeEl.innerText = formatTime(audio.duration);
});

if (progressBar) {
    progressBar.addEventListener('input', () => {
        if (!audio.duration) return;
        audio.currentTime = (progressBar.value * audio.duration) / 100;
    });
}

audio.addEventListener('ended', () => {
    playNextSong();
});

function formatTime(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

window.onload = loadSongsFromServer;