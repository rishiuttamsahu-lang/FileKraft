// -------------------------------- */
// UI MODULE                      */
// -------------------------------- */

function updateUserUI() {
    const userArea = document.getElementById('user-area');
    if (!userArea) return;

    if (checkLoginStatus()) {
        const user = getCurrentUser();
        userArea.innerHTML = `
            <span class="username">Welcome, ${user.username}</span>
            <button onclick="logout()" class="neon-button auth-button">Logout</button>
        `;
        if (isAdmin()) {
            userArea.innerHTML += `<a href="admin.html" class="neon-button auth-button">Admin Panel</a>`;
        }
    } else {
        userArea.innerHTML = `
            <a href="login.html" class="neon-button auth-button">Login</a>
        `;
    }
}