const SUPABASE_URL = 'https://shnuggkkwvyixdmlnugl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Lih64HUZIiKkxniY28yOPA_NL7Hz7km';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let musicalQuotes = [];

async function loadLibrary() {
    try {
        const grid = document.getElementById('vinylGrid');
        if (!grid) return;

        const { data, error } = await client
            .from('quotes')
            .select('*')
            .eq('has_audio', true);

        if (error) throw error;

        if (!data || data.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <span class="icon">🎵</span>
                    <p>هیچ اثری با ستون فعال صوتی پیدا نشد.</p>
                </div>
            `;
            return;
        }

        musicalQuotes = data;
        let html = '';

        data.forEach((song, index) => {
            const labelChar = song.source ? song.source.substring(0, 1) : '🎧';
            html += `
                <div class="vinyl-card" onclick="playSong(${index})">
                    <div class="mini-vinyl">
                        <div class="mini-label">
                            <span>${labelChar}</span>
                        </div>
                    </div>
                    <div class="vinyl-name">${song.source || 'اثر صوتی'}</div>
                    <div class="vinyl-artist">${song.singer || 'خواننده نامشخص'}</div>
                    <span class="play-badge">▶ شنیدن آوا</span>
                </div>
            `;
        });

        grid.innerHTML = html;

    } catch (error) {
        console.error('خطای ارتباط با سرور:', error.message);
        const grid = document.getElementById('vinylGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <span class="icon">❌</span>
                    <p>خطا در برقراری ارتباط با بانک اطلاعاتی.</p>
                </div>
            `;
        }
    }
}

function playSong(index) {
    // برای کارکرد درست بعدی/قبلی، کل لیست را همراه ایندکس کلیک شده ذخیره می‌کنیم
    localStorage.setItem('player_playlist', JSON.stringify(musicalQuotes));
    localStorage.setItem('player_current_index', index);
    
    window.location.href = 'player.html';
}

window.onload = loadLibrary;