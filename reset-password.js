// 📌 حتماً آدرس و کلید اصلی خودتان را اینجا بگذارید
const SUPABASE_URL = 'https://shnuggkkwvyixdmlnugl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Lih64HUZIiKkxniY28yOPA_NL7Hz7km';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updatePassword() {
    const newPassword = document.getElementById('new-password').value.trim();

    if (newPassword.length < 6) {
        alert("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.");
        return;
    }

    try {
        const { error } = await client.auth.updateUser({
            password: newPassword
        });

        if (error) {
            alert("خطا در تغییر رمز: " + error.message);
            return;
        }

        alert("رمز عبور شما با موفقیت تغییر کرد! 🎉 اکنون وارد حساب خود می‌شوید.");
        
        // هدایت مستقیم به صفحه اصلی پروژه روی همان پورت یا دامنه
        window.location.href = "index.html";
        
    } catch (err) {
        alert("خطای غیرمنتظره: " + err.message);
    }
}