const SUPABASE_URL = 'https://shnuggkkwvyixdmlnugl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Lih64HUZIiKkxniY28yOPA_NL7Hz7km';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let quotesDatabase = [];
let currentGenre = 'all';
let filteredQuotes = [];
let currentUser = null;
let currentQuoteId = null;
let favoriteQuotesIds = []; // لیست آی‌دی شعر‌هایی که کاربر لایک کرده
let isSignUpMode = false;

// ۱. بررسی وضعیت لاگین کاربر به محض باز شدن صفحه (نسخه بدون باگ)
async function checkUserStatus() {
    try {
        // ابتدا حتماً اشعار را از سرور دریافت میکنیم تا صفحه خالی نماند
        await loadQuotesFromServer();

        // دریافت اطلاعات کاربر لاگین شده
        const { data: { user }, error } = await client.auth.getUser();

        if (error) throw error;

        if (user) {
            currentUser = user;
            document.getElementById('auth-guest').style.display = 'none';
            document.getElementById('auth-user').style.display = 'block';

            // 📌 استخراج امن نام کاربری از متادیتا بدون ایجاد ارور
            if (user.user_metadata && user.user_metadata.username) {
                document.getElementById('user-email').innerText = user.user_metadata.username;
            } else {
                document.getElementById('user-email').innerText = user.email.split('@')[0];
            }

            document.getElementById('love-btn').style.display = 'block';
            document.getElementById('fav-genre-btn').style.display = 'inline-block';

            // بارگذاری لایک‌های این کاربر
            await loadFavorites();
        } else {
            // اگر کاربر لاگین نکرده باشد
            currentUser = null;
            document.getElementById('auth-guest').style.display = 'block';
            document.getElementById('auth-user').style.display = 'none';
            document.getElementById('love-btn').style.display = 'none';
            document.getElementById('fav-genre-btn').style.display = 'none';
        }
    } catch (err) {
        console.error("خطا در بررسی وضعیت کاربر:", err.message);
        if (quotesDatabase.length === 0) {
            await loadQuotesFromServer();
        }
    }
}

// ۲. دریافت اشعار از سرور سوپابیس
async function loadQuotesFromServer() {
    if (quotesDatabase.length > 0) return;
    try {
        const { data, error } = await client.from('quotes').select('*');
        if (error) throw error;

        quotesDatabase = data || [];
        filterQuotesByGenre();
        nextRandomQuote();
    } catch (error) {
        console.error("خطا در دریافت اشعار:", error.message);
        document.getElementById('quote-text').innerText = "خطا در بارگذاری اطلاعات از سرور ابری.";
    }
}

// ۳. بارگذاری لیست علاقه‌مندی‌های کاربر از دیتابیس
async function loadFavorites() {
    if (!currentUser) return;
    try {
        const { data, error } = await client
            .from('favorites')
            .select('quote_id')
            .eq('user_id', currentUser.id);

        if (error) throw error;

        if (data) {
            favoriteQuotesIds = data.map(f => f.quote_id);
            updateHeartIcon();
        }
    } catch (error) {
        console.error("خطا در دریافت لیست لایک‌ها:", error.message);
    }
}

// ۴. تغییر وضعیت لایک (افزودن یا حذف از علاقه‌مندی‌ها)
async function toggleFavorite() {
    if (!currentUser || !currentQuoteId) return;

    const isFav = favoriteQuotesIds.includes(currentQuoteId);

    if (isFav) {
        const { error } = await client.from('favorites').delete().eq('user_id', currentUser.id).eq('quote_id', currentQuoteId);
        if (!error) {
            favoriteQuotesIds = favoriteQuotesIds.filter(id => id !== currentQuoteId);
            alert('از لیست محبوب‌ها حذف شد.');
        }
    } else {
        const { error } = await client.from('favorites').insert([{ user_id: currentUser.id, quote_id: currentQuoteId }]);
        if (!error) {
            favoriteQuotesIds.push(currentQuoteId);
            alert('به لیست محبوب‌ها اضافه شد! ❤️');
        }
    }
    updateHeartIcon();
}

// بروزرسانی آیکون لایک با تصاویر
function updateHeartIcon() {
    const loveBtn = document.getElementById('love-btn');
    if (!loveBtn) return;

    let heartImg = loveBtn.querySelector('img');

    if (!heartImg) {
        loveBtn.innerText = '';
        heartImg = document.createElement('img');
        heartImg.className = 'heart-icon-img';
        loveBtn.appendChild(heartImg);
    }

    if (favoriteQuotesIds.includes(currentQuoteId)) {
        heartImg.src = 'Icons8/icons8-heart-50.png';
    } else {
        heartImg.src = 'Icons8/icons8-heart-50-2.png';
    }
}

// ۵. نمایش اشعار لایک شده
function showFavorites(element) {
    currentGenre = 'favorites';
    document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');

    filteredQuotes = quotesDatabase.filter(q => favoriteQuotesIds.includes(q.id));
    nextRandomQuote();
}

// نمایش شعر بعدی
function nextRandomQuote() {
    if (filteredQuotes.length === 0) {
        document.getElementById('quote-text').innerText = currentGenre === 'favorites' ? "هنوز هیچ شعری را ذخیره نکرده‌اید!" : "شاهکاری در این دسته‌بندی یافت نشد.";
        document.getElementById('quote-source').innerText = "";
        currentQuoteId = null;
        document.getElementById('love-btn').style.display = 'none';
        return;
    }

    if (currentUser && currentGenre !== 'favorites') document.getElementById('love-btn').style.display = 'block';

    document.getElementById('next-btn').style.display = 'inline-block';
    document.getElementById('info-box').style.display = 'none';

    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const selectedQuote = filteredQuotes[randomIndex];

    currentQuoteId = selectedQuote.id;
    updateHeartIcon();

    document.getElementById('quote-text').innerHTML = selectedQuote.text.replace(/\n/g, '<br>');
    document.getElementById('quote-source').innerText = selectedQuote.source;
    document.getElementById('info-content').innerText = selectedQuote.info || "توضیحات و تفسیری برای این اثر ثبت نشده است.";
    document.getElementById('quote-link').href = selectedQuote.link || "https://ganjoor.net";
}

function filterQuotesByGenre() {
    if (currentGenre === 'all') filteredQuotes = [...quotesDatabase];
    else if (currentGenre !== 'favorites') filteredQuotes = quotesDatabase.filter(q => q.genre === currentGenre);
}

function changeGenre(genre, element) {
    currentGenre = genre;
    document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    filterQuotesByGenre();
    nextRandomQuote();
}

// جابه‌جایی بین متن شعر و متن درباره اثر
function toggleInfo() {
    const poemWrapper = document.getElementById('poem-content-wrapper');
    const infoBox = document.getElementById('info-box');
    const toggleBtn = document.getElementById('toggle-btn');
    const nextBtn = document.getElementById('next-btn');

    if (infoBox.style.display === 'none' || infoBox.style.display === '') {
        poemWrapper.style.display = 'none';
        infoBox.style.display = 'block';
        toggleBtn.innerText = 'بازگشت به شعر ↩';
        nextBtn.style.display = 'none';
    } else {
        poemWrapper.style.display = 'block';
        infoBox.style.display = 'none';
        toggleBtn.innerText = 'درباره اثر';
        nextBtn.style.display = 'inline-block';
    }
}

// مدیریت فرم‌های ورود و ثبت‌نام (Auth)
function openAuthModal() { document.getElementById('auth-modal').style.display = 'flex'; }
function closeAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }

function switchAuthMode() {
    isSignUpMode = !isSignUpMode;
    const loginFields = document.getElementById('login-fields');
    const signupFields = document.getElementById('signup-fields');
    const modalTitle = document.getElementById('modal-title');
    const mainBtn = document.getElementById('main-auth-btn');
    const toggleTxt = document.getElementById('toggle-auth-mode');

    if (isSignUpMode) {
        loginFields.style.display = 'none';
        signupFields.style.display = 'block';
        modalTitle.innerText = 'ساخت حساب کاربری';
        mainBtn.innerText = 'ثبت‌نام';
        toggleTxt.innerText = 'قبلاً ثبت‌نام کرده‌اید؟ وارد شوید';
    } else {
        loginFields.style.display = 'block';
        signupFields.style.display = 'none';
        modalTitle.innerText = 'ورود به حساب';
        mainBtn.innerText = 'ورود';
        toggleTxt.innerText = 'حساب ندارید؟ ثبت‌نام کنید';
    }
}

// 📌 مدیریت کامل عملیات ورود دوگانه (Username/Email) یا ثبت‌نام
async function handleAuth() {
    try {
        if (isSignUpMode) {
            // ==========================================
            // ۱. حالت ثبت‌نام کاربر جدید
            // ==========================================
            const username = document.getElementById('auth-username').value.trim();
            const email = document.getElementById('auth-email').value.trim();
            const password = document.getElementById('auth-password').value;

            if (!username || !email || !password) {
                alert('لطفاً همه فیلدها را پر کنید.');
                return;
            }

            if (password.length < 6) {
                alert('رمز عبور باید حداقل ۶ کاراکتر باشد.');
                return;
            }

            const { data: authData, error: signUpError } =
await client.auth.signUp({
    email: email,
    password: password,
    options: {
        data: {
            username: username
        }
    }
});

if (signUpError) {
    console.error(signUpError);
    throw signUpError;
}

if (!authData.user) {
    throw new Error("User was not created");
}

const { error: profileInsertError } = await client
    .from('profiles')
    .insert({
        id: authData.user.id,
        username: username,
        email: email
    });

if (profileInsertError) {
    console.error("Profile Insert Error:", profileInsertError);
    throw profileInsertError;
}

alert('ثبت‌نام با موفقیت انجام شد! 🎉');
switchAuthMode();

        } else {
            // ==========================================
            // ۲. حالت ورود هوشمند و ترکیبی (ایمیل یا نام کاربری)
            // ==========================================
            const inputLogin = document.getElementById('login-identifier').value.trim();
            const password = document.getElementById('login-password').value;

            if (!inputLogin || !password) {
                alert('لطفاً مشخصات ورود و رمز عبور خود را وارد کنید.');
                return;
            }

            let emailToLogin = inputLogin;

            // 🔍 بررسی هوشمند: اگر فیلد ورودی شامل کاراکتر @ نباشد، یعنی کاربر Username وارد کرده است
            if (!inputLogin.includes('@')) {
                // جستجوی ایمیل واقعی بر اساس نام کاربری از جدول عمومی profiles
                const { data: profile, error: profileError } = await client
                    .from('profiles')
                    .select('email')
                    .eq('username', inputLogin)
                    .maybeSingle(); // استفاده از maybeSingle برای جلوگیری از ایجاد خطا در صورت پیدا نشدن

                if (profileError) {
                    console.error("خطا در بررسی نام کاربری:", profileError.message);
                }

                if (!profile) {
                    alert('نام کاربری یافت نشد. لطفا در صورت داشتن ایمیل، آن را وارد کنید.');
                    return;
                }

                // جایگزینی ایمیلِ کشف شده به جای نام کاربری
                emailToLogin = profile.email;
            }

            // ورود نهایی به بخش احراز هویت Supabase با ایمیل به دست آمده
            const { error: signInError } = await client.auth.signInWithPassword({
                email: emailToLogin,
                password: password
            });

            if (signInError) throw signInError;

            alert('خوش آمدید! 🎉');
            closeAuthModal();
            location.reload();
        }
    } catch (error) {
    console.error(error);

    alert(error.message);
}
}

async function logout() {
    await client.auth.signOut();
    alert('از حساب خود خارج شدید.');
    location.reload();
}

window.onload = checkUserStatus;

// تابع هوشمند نمایش و پنهان کردن رمز عبور
function togglePasswordVisibility(inputId, imgId) {
    const passwordInput = document.getElementById(inputId);
    const eyeImage = document.getElementById(imgId);

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeImage.src = 'Icons8/icons8-eye-48.png';
    } else {
        passwordInput.type = 'password';
        eyeImage.src = 'Icons8/icons8-eye-48 (1).png';
    }
}

async function forgotPassword() {

    const email =
        prompt("ایمیل خود را وارد کنید");

    if (!email) return;

    const { error } =
        await client.auth.resetPasswordForEmail(
            email,
            {
                redirectTo: "http://127.0.0.1:5500/reset-password.html"
            }
        );

    if (error) {
        alert(error.message);
        return;
    }

    alert(
        "لینک بازیابی رمز عبور به ایمیل شما ارسال شد"
    );
}