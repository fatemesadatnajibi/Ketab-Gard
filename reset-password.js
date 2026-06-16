const SUPABASE_URL = 'https://shnuggkkwvyixdmlnugl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Lih64HUZIiKkxniY28yOPA_NL7Hz7km';

const client = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

async function updatePassword() {

    const newPassword =
        document.getElementById('new-password').value;

    if (newPassword.length < 6) {
        alert("رمز باید حداقل 6 کاراکتر باشد");
        return;
    }

    const { error } =
        await client.auth.updateUser({
            password: newPassword
        });

    if (error) {
        alert(error.message);
        return;
    }

    alert("رمز عبور با موفقیت تغییر کرد");

    window.location.href = "index.html";
}