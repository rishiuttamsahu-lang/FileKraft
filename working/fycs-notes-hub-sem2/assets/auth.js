// -------------------------------- */
// AUTHENTICATION MODULE          */
// -------------------------------- */

function initializeAuth() {
    if (!localStorage.getItem('users')) {
        const adminUser = { username: 'admin', password: 'admin123' };
        localStorage.setItem('users', JSON.stringify([adminUser]));
    }
    if (!localStorage.getItem('isLoggedIn')) {
        localStorage.setItem('isLoggedIn', 'false');
    }
}

function signup(username, password, confirmPassword) {
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userExists = users.some(user => user.username === username);

    if (userExists) {
        alert("Username already exists.");
        return;
    }

    const newUser = { username, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    alert("Signup successful! Please log in.");
    window.location.href = 'login.html';
}

function login(username, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify({ username: user.username }));
        window.location.href = 'index.html';
    } else {
        alert("Invalid username or password.");
    }
}

function logout() {
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function checkLoginStatus() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.username === 'admin';
}

function enforceLogin() {
    // Allows access to login and signup pages
    const currentPage = window.location.pathname.split('/').pop();
    if (!checkLoginStatus() && currentPage !== 'login.html' && currentPage !== 'signup.html') {
        window.location.href = 'login.html';
    }
}

function enforceAdmin() {
    if (!isAdmin()) {
        alert("Access denied. Admin only.");
        window.location.href = 'index.html';
    }
}