// 📌 حتماً آدرس و کلید اصلی خودتان را اینجا بگذارید
const SUPABASE_URL = 'https://shnuggkkwvyixdmlnugl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Lih64HUZIiKkxniY28yOPA_NL7Hz7km';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
//   سیستم پیام‌های سفارشی (برای صفحه ریست)
// ============================================

function showNotification(message, type = 'info', duration = 4000) {
    // حذف نوتیفیکیشن‌های قبلی
    const oldNotif = document.querySelector('.custom-notification');
    if (oldNotif) oldNotif.remove();
    
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        background: linear-gradient(135deg, #070f1e, #0a1628);
        border: 2px solid ${type === 'success' ? '#4ecdc4' : type === 'error' ? '#ff6b6b' : '#d4af37'};
        border-radius: 16px;
        padding: 16px 24px;
        color: #f1ebd9;
        font-family: "B Nazanin", "Tanha", sans-serif;
        font-size: 1.1rem;
        text-align: center;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        animation: slideDown 0.5s ease forwards;
        direction: rtl;
    `;
    
    const icons = { success: '', error: '', info: '' };
    notification.innerHTML = `
        <span style="margin-left:10px;">${icons[type] || ''}</span>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(255,255,255,0.3);font-size:1.2rem;cursor:pointer;">✕</button>
    `;
    
    document.body.appendChild(notification);
    
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
}

function showSuccess(msg) { showNotification(msg, 'success'); }
function showError(msg) { showNotification(msg, 'error'); }
function showInfo(msg) { showNotification(msg, 'info'); }

// ============================================
//   تابع اصلی تغییر رمز
// ============================================

async function updatePassword() {
    const newPassword = document.getElementById('new-password').value.trim();

    if (newPassword.length < 6) {
        showError("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.");
        return;
    }

    try {
        const { error } = await client.auth.updateUser({
            password: newPassword
        });

        if (error) {
            showError("خطا در تغییر رمز: " + error.message);
            return;
        }

        showSuccess("رمز عبور شما با موفقیت تغییر کرد! ");
        
        // هدایت بعد از ۲ ثانیه
        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);
        
    } catch (err) {
        showError("خطای غیرمنتظره: " + err.message);
    }
}