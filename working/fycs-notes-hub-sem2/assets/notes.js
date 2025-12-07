// -------------------------------- */
// NOTES MODULE                     */
// -------------------------------- */

function initializeNotes() {
    if (!localStorage.getItem('notes')) {
        localStorage.setItem('notes', JSON.stringify([]));
    }
}

async function createNote(subject, title, file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const fileUrl = event.target.result; // Base64 encoded file
            const notes = JSON.parse(localStorage.getItem('notes')) || [];
            const newNote = {
                id: Date.now(),
                subject: subject,
                title: title,
                date: new Date().toLocaleDateString(),
                fileUrl: fileUrl
            };
            notes.push(newNote);
            localStorage.setItem('notes', JSON.stringify(notes));
            resolve(newNote);
        };
        reader.onerror = function(error) {
            reject(error);
        };
        reader.readAsDataURL(file); // Read file as base64
    });
}

function deleteNote(id) {
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes = notes.filter(note => note.id !== id);
    localStorage.setItem('notes', JSON.stringify(notes));
    // Optionally, trigger a UI update if on the manage notes page
    if (window.location.pathname.includes('admin.html')) {
        loadManageNotesTable();
    }
}

function loadNotesBySubject(subject) {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    return notes.filter(note => note.subject === subject);
}

function getAllNotes() {
    return JSON.parse(localStorage.getItem('notes')) || [];
}

function generateNoteCard(note, isAdminView = false) {
    const cardHtml = `
        <div class="note-card glass-block" style="animation: fadeUp 0.6s ease forwards;">
            <h3>${note.title}</h3>
            <p class="note-date">${note.date}</p>
            <p class="note-subject">${note.subject}</p>
            <div class="card-actions">
                <button onclick="openPdfInNewTab('${note.fileUrl}')" class="neon-button view-pdf-button">View PDF</button>
                ${isAdminView ? `<button onclick="deleteNote(${note.id})" class="neon-button delete-button">Delete</button>` : ''}
            </div>
        </div>
    `;
    return cardHtml;
}

function loadManageNotesTable() {
    const tableBody = document.getElementById('manage-notes-table-body');
    if (!tableBody) return;

    const notes = getAllNotes();
    tableBody.innerHTML = ''; // Clear existing rows

    notes.forEach(note => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${note.title}</td>
            <td>${note.subject}</td>
            <td>${note.date}</td>
            <td class="action-buttons">
                <button onclick="openPdfInNewTab('${note.fileUrl}')" class="neon-button">View PDF</button>
                <button onclick="deleteNote(${note.id})" class="neon-button delete-button">Delete</button>
            </td>
        `;
    });
}

function openPdfInNewTab(base64Pdf) {
    const byteCharacters = atob(base64Pdf.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
}