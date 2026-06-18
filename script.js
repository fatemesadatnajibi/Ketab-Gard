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
// ۱. بررسی وضعیت لاگین کاربر به محض باز شدن صفحه و گوش دادن به رویدادهای Auth
async function checkUserStatus() {
    try {
        // ابتدا حتماً اشعار را از سرور دریافت میکنیم تا صفحه خالی نماند
        await loadQuotesFromServer();

        // 📌 گوش دادن به رویدادهای احراز هویت (مهم برای بازیابی رمز عبور)
        client.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                console.log('رویداد بازیابی رمز عبور تشخیص داده شد! هدایت به صفحه تغییر رمز...');
                window.location.href = "reset-password.html";
                return; // جلوگیری از ادامه اجرای کد در این صفحه
            }

            // مدیریت وضعیت نمایش منوهای کاربری بر اساس وجود Session
            if (session && session.user) {
                currentUser = session.user;
                document.getElementById('auth-guest').style.display = 'none';
                document.getElementById('auth-user').style.display = 'block';

                if (currentUser.user_metadata && currentUser.user_metadata.username) {
                    document.getElementById('user-email').innerText = currentUser.user_metadata.username;
                } else {
                    document.getElementById('user-email').innerText = currentUser.email.split('@')[0];
                }

                document.getElementById('love-btn').style.display = 'block';
                document.getElementById('fav-genre-btn').style.display = 'inline-block';
                loadFavorites();
            } else {
                setUserAsGuest();
            }
        });

    } catch (err) {
        console.error("خطا در بررسی وضعیت کاربر:", err.message);
        if (quotesDatabase.length === 0) {
            await loadQuotesFromServer();
        }
    }
}

// تابع کمکی برای حالت مهمان
function setUserAsGuest() {
    
    currentUser = null;
    document.getElementById('auth-guest').style.display = 'block';
    document.getElementById('auth-user').style.display = 'none';
    document.getElementById('love-btn').style.display = 'none';
    document.getElementById('fav-genre-btn').style.display = 'none';
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
            showInfo('از لیست محبوب‌ها حذف شد.');
        }
    } else {
        const { error } = await client.from('favorites').insert([{ user_id: currentUser.id, quote_id: currentQuoteId }]);
        if (!error) {
            favoriteQuotesIds.push(currentQuoteId);
            showSuccess('به لیست محبوب‌ها اضافه شد! ❤️');
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

// ۱. تابع باز کردن مودال ورود و ثبت‌نام
function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'flex'; // باز شدن پاپ‌آپ
    }

    // 🌟 پنهان کردن دکمه ورود/ثبت‌نام بالا سمت چپ به محض باز شدن فرم
    const authBar = document.querySelector('.auth-bar');
    if (authBar && !currentUser) {
        authBar.style.display = 'none';
    }
}

// ۲. تابع بسته شدن مودال (انصراف یا زدن دکمه ضربدر)
function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none'; // بسته شدن پاپ‌آپ
    }

    // 🌟 برگرداندن و ظاهر کردن دوباره دکمه بالا سمت چپ (اگر کاربر لاگین نکرده باشد)
    const authBar = document.querySelector('.auth-bar');
    if (authBar && !currentUser) {
        authBar.style.display = 'block';
    }
}

function switchAuthMode() {
    isSignUpMode = !isSignUpMode;
    const modalTitle = document.getElementById('modal-title');
    const mainAuthBtn = document.getElementById('main-auth-btn');
    const toggleAuthModeBtn = document.getElementById('toggle-auth-mode');
    const loginFields = document.getElementById('login-fields');
    const signupFields = document.getElementById('signup-fields');

    // 🌟 خط جدید: گرفتن کانتینر لینک فراموشی رمز
    const forgotPasswordContainer = document.getElementById('forgot-password-container');

    if (isSignUpMode) {
        modalTitle.innerText = 'ثبت‌نام حساب کاربری';
        mainAuthBtn.innerText = 'ثبت‌نام';
        toggleAuthModeBtn.innerText = 'قبلاً ثبت‌نام کرده‌اید؟ وارد شوید';
        loginFields.style.display = 'none';
        signupFields.style.display = 'block';

        // 🌟 خط جدید: مخفی کردن دکمه فراموشی رمز در حالت ثبت‌نام
        if (forgotPasswordContainer) forgotPasswordContainer.style.display = 'none';
    } else {
        modalTitle.innerText = 'ورود به حساب کاربری';
        mainAuthBtn.innerText = 'ورود';
        toggleAuthModeBtn.innerText = 'حساب کاربری ندارید؟ ثبت‌نام کنید';
        loginFields.style.display = 'block';
        signupFields.style.display = 'none';

        // 🌟 خط جدید: نمایش مجدد دکمه فراموشی رمز در حالت ورود
        if (forgotPasswordContainer) forgotPasswordContainer.style.display = 'block';
    }
}

async function handleAuth() {
    try {
        if (isSignUpMode) {
            // ==========================================
            // ۱. حالت ثبت‌نام کاربر جدید + ورود مستقیم
            // ==========================================
            const username = document.getElementById('auth-username').value.trim();
            const email = document.getElementById('auth-email').value.trim();
            const password = document.getElementById('auth-password').value;

            if (!username || !email || !password) {
                showError('لطفاً همه فیلدها را پر کنید.');
                return;
            }

            if (password.length < 6) {
                showError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
                return;
            }

            // ثبت‌نام در Supabase Auth
            const { data: authData, error: signUpError } = await client.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username
                    }
                }
            });

            if (signUpError) {
                console.error("Sign Up Error:", signUpError);
                throw signUpError;
            }

            if (!authData || !authData.user) {
                throw new Error("کاربر ساخته نشد.");
            }

            // ثبت اطلاعات تکمیلی در جدول profiles
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

            showSuccess('ثبت‌نام و ورود با موفقیت انجام شد! 🎉 خوش آمدید.');
            // ذخیره دیتای کاربر جدید در متغیر عمومی برای مدیریت دکمه هدر
            currentUser = authData.user;

            // بستن مودال بدون بازگشت دکمه ورود در هدر
            closeAuthModal();

setTimeout(() => {
                location.reload();
            }, 2000);

            return; // توقف کامل اجرای تابع بعد از ثبت‌نام موفق

        } else {
            // ==========================================
            // ۲. حالت ورود هوشمند و ترکیبی (ایمیل یا نام کاربری)
            // ==========================================
            const inputLogin = document.getElementById('login-identifier').value.trim();
            const password = document.getElementById('login-password').value;

            if (!inputLogin || !password) {
                showError('لطفاً مشخصات ورود و رمز عبور خود را وارد کنید.');
                return;
            }

            let emailToLogin = inputLogin;

            // 🔍 بررسی هوشمند: اگر ورودی شامل @ نباشد، یعنی کاربر نام کاربری وارد کرده است
            if (!inputLogin.includes('@')) {
                // پیدا کردن ایمیل متناظر با نام کاربری از جدول profiles
                const { data: profile, error: profileError } = await client
                    .from('profiles')
                    .select('email')
                    .eq('username', inputLogin)
                    .maybeSingle();

                if (profileError) {
                    console.error("خطا در بررسی نام کاربری:", profileError.message);
                }

                if (!profile) {
                    showError('نام کاربری یافت نشد. لطفا در صورت داشتن ایمیل، آن را وارد کنید.');
                    return;
                }

                // جایگزینی ایمیلِ پیدا شده به جای نام کاربری برای ورود به سوپابیس
                emailToLogin = profile.email;
            }

            // ورود نهایی به بخش احراز هویت Supabase با ایمیل مشخص شده
            const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
                email: emailToLogin,
                password: password
            });

            if (signInError) throw signInError;

            showSuccess('خوش آمدید! 🎉');

            // ذخیره اطلاعات کاربر لاگین شده در متغیر عمومی سایت
            if (signInData && signInData.user) {
                currentUser = signInData.user;
            }

            // بستن مودال و مخفی ماندن دکمه ورود هدر
            closeAuthModal();

            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    } catch (error) {
        console.error("Auth Error:", error);
        showError(error.message || 'خطایی در فرآیند احراز هویت رخ داد.');
    }
}

async function logout() {
    await client.auth.signOut();
    showInfo('از حساب خود خارج شدید.');
    setUserAsGuest();
        setTimeout(() => {
        const container = document.getElementById('notificationContainer');
        if (container) container.innerHTML = '';
    }, 3000);
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

// ============================================
//   فراموشی رمز عبور (بدون prompt)
// ============================================
function forgotPassword() {
    document.getElementById('forgot-password-container').style.display = 'none';
    document.getElementById('login-fields').style.display = 'none';
    
    // 👇 مخفی کردن دکمه‌ها با id
    document.getElementById('main-auth-btn').style.display = 'none';
    document.querySelector('.actions-auth .btn-secondary').style.display = 'none';
    
    document.getElementById('toggle-auth-mode').style.display = 'none';
    document.getElementById('modal-title').innerText = 'بازیابی رمز عبور';
    document.getElementById('forgot-password-section').style.display = 'block';
}

function closeForgotPassword() {
    document.getElementById('forgot-password-section').style.display = 'none';
    document.getElementById('forgot-password-container').style.display = 'block';
    document.getElementById('login-fields').style.display = 'block';
    
    // 👇 برگردوندن دکمه‌ها
    document.getElementById('main-auth-btn').style.display = 'block';
    document.querySelector('.actions-auth .btn-secondary').style.display = 'block';
    
    document.getElementById('toggle-auth-mode').style.display = 'block';
    document.getElementById('modal-title').innerText = 'ورود به حساب کاربری';
    document.getElementById('reset-email-input').value = '';
}

async function sendResetEmail() {
    const email = document.getElementById('reset-email-input').value.trim();
    
    if (!email) {
        showError('لطفاً ایمیل خود را وارد کنید.');
        return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        showError('لطفاً یک ایمیل معتبر وارد کنید.');
        return;
    }
    
    const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname.replace('index.html', '') + 'reset-password.html'
    });
    
    if (error) {
        showError("خطا: " + error.message);
        return;
    }
    
    showSuccess("ایمیل بازیابی رمز عبور ارسال شد. 📧");
    closeForgotPassword();
    document.getElementById('reset-email-input').value = '';
}
// ============================================
//   سیستم پیام‌های سفارشی (جایگزین alert)
// ============================================

function showNotification(message, type = 'info', duration = 4000) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    // حذف نوتیفیکیشن‌های قبلی (اختیاری)
    // container.innerHTML = '';

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // آیکون‌ها بر اساس نوع پیام
    const icons = {
        success: '✅',
        error: '❌',
        info: '📖'
    };

    notification.innerHTML = `
        <span style="margin-left: 10px;">${icons[type] || '📖'}</span>
        <span>${message}</span>
        <button class="close-btn" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(notification);

    // حذف خودکار بعد از مدت زمان مشخص
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'fadeOut 0.4s ease forwards';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 400);
            }
        }, duration);
    }

    return notification;
}

// ===== توابع میانبر برای انواع پیام =====
function showSuccess(message, duration = 4000) {
    showNotification(message, 'success', duration);
}

function showError(message, duration = 4000) {
    showNotification(message, 'error', duration);
}

function showInfo(message, duration = 4000) {
    showNotification(message, 'info', duration);
}
