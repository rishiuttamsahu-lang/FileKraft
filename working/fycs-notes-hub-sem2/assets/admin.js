// Admin Panel Enhancements

// Global variables for pagination
let currentPage = 1;
let notesPerPage = 10;
let allNotes = [];
let filteredNotes = [];
let currentDeleteId = null;

// Show loader
function showLoader(loaderId) {
    const loader = document.getElementById(loaderId);
    if (loader) {
        loader.style.display = 'block';
    }
}

// Hide loader
function hideLoader(loaderId) {
    const loader = document.getElementById(loaderId);
    if (loader) {
        loader.style.display = 'none';
    }
}

// Dashboard functions
function updateDashboardStats() {
    const notes = getAllNotes();
    
    // Total notes
    document.getElementById('total-notes').textContent = notes.length;
    
    // Unique subjects
    const subjects = [...new Set(notes.map(note => note.subject))];
    document.getElementById('total-subjects').textContent = subjects.length;
    
    // Uploads this month
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const uploadsThisMonth = notes.filter(note => {
        const noteDate = new Date(note.date);
        return noteDate.getMonth() === thisMonth && noteDate.getFullYear() === thisYear;
    }).length;
    
    document.getElementById('uploads-month').textContent = uploadsThisMonth;
    
    // Most active subject
    const subjectCounts = {};
    notes.forEach(note => {
        subjectCounts[note.subject] = (subjectCounts[note.subject] || 0) + 1;
    });
    
    let mostActiveSubject = '-';
    let maxCount = 0;
    for (const [subject, count] of Object.entries(subjectCounts)) {
        if (count > maxCount) {
            maxCount = count;
            mostActiveSubject = subject;
        }
    }
    
    document.getElementById('most-active-subject').textContent = mostActiveSubject;
    
    // Recent uploads (last 5)
    const recentNotes = [...notes].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    }).slice(0, 5);
    
    const recentUploadsList = document.getElementById('recent-uploads-list');
    recentUploadsList.innerHTML = '';
    
    if (recentNotes.length === 0) {
        recentUploadsList.innerHTML = '<p>No recent uploads</p>';
        return;
    }
    
    const list = document.createElement('ul');
    recentNotes.forEach(note => {
        const item = document.createElement('li');
        item.textContent = `${note.title} (${note.subject}) - ${note.date}`;
        list.appendChild(item);
    });
    
    recentUploadsList.appendChild(list);
}

// Form validation
function validateUploadForm() {
    let isValid = true;
    
    // Clear previous errors
    document.getElementById('subject-error').textContent = '';
    document.getElementById('title-error').textContent = '';
    document.getElementById('file-error').textContent = '';
    
    // Validate subject
    const subject = document.getElementById('subject-select').value;
    if (!subject) {
        document.getElementById('subject-error').textContent = 'Please select a subject';
        isValid = false;
    }
    
    // Validate title
    const title = document.getElementById('note-title').value.trim();
    if (!title) {
        document.getElementById('title-error').textContent = 'Please enter a title';
        isValid = false;
    }
    
    // Validate file
    const fileInput = document.getElementById('note-file');
    const file = fileInput.files[0];
    if (!file) {
        document.getElementById('file-error').textContent = 'Please select a PDF file';
        isValid = false;
    } else {
        // Check file type
        if (file.type !== 'application/pdf') {
            document.getElementById('file-error').textContent = 'Please select a PDF file';
            isValid = false;
        }
        
        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            document.getElementById('file-error').textContent = 'File size must be less than 50MB';
            isValid = false;
        }
    }
    
    return isValid;
}

// PDF Preview
function setupPdfPreview() {
    const fileInput = document.getElementById('note-file');
    const previewContainer = document.getElementById('preview-container');
    const pdfPreview = document.getElementById('pdf-preview');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            const fileURL = URL.createObjectURL(file);
            pdfPreview.src = fileURL;
            previewContainer.style.display = 'block';
        } else {
            previewContainer.style.display = 'none';
        }
    });
}

// Drag and drop functionality
function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('note-file');
    
    // Click on drop zone to trigger file input
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                // Set the file to the hidden input
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                // Trigger change event to update preview
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
            } else {
                document.getElementById('file-error').textContent = 'Please drop a PDF file';
            }
        }
    });
}

// Manage Notes functions
function filterAndSortNotes() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const sortBy = document.getElementById('sort-by').value;
    const filterSubject = document.getElementById('filter-subject').value;
    
    let result = [...allNotes];
    
    // Apply search filter
    if (searchTerm) {
        result = result.filter(note => 
            note.title.toLowerCase().includes(searchTerm) || 
            note.subject.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply subject filter
    if (filterSubject !== 'all') {
        result = result.filter(note => note.subject === filterSubject);
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    filteredNotes = result;
    renderNotesTable();
}

function renderNotesTable() {
    const tableBody = document.getElementById('manage-notes-table-body');
    if (!tableBody) return;
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * notesPerPage;
    const endIndex = startIndex + notesPerPage;
    const paginatedNotes = filteredNotes.slice(startIndex, endIndex);
    
    // Render notes
    tableBody.innerHTML = '';
    
    if (paginatedNotes.length === 0) {
        const row = tableBody.insertRow();
        row.innerHTML = '<td colspan="4" style="text-align: center;">No notes found</td>';
        updatePagination();
        return;
    }
    
    paginatedNotes.forEach(note => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${note.title}</td>
            <td>${note.subject}</td>
            <td>${note.date}</td>
            <td class="action-buttons">
                <button onclick="openPdfInNewTab('${note.fileUrl}')" class="neon-button">View PDF</button>
                <button onclick="showDeleteConfirmation(${note.id})" class="neon-button delete-button">Delete</button>
            </td>
        `;
    });
    
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredNotes.length / notesPerPage);
    
    document.getElementById('current-page').textContent = currentPage;
    
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

function showDeleteConfirmation(noteId) {
    currentDeleteId = noteId;
    document.getElementById('confirmation-modal').style.display = 'flex';
}

function hideDeleteConfirmation() {
    document.getElementById('confirmation-modal').style.display = 'none';
    currentDeleteId = null;
}

function performDelete() {
    if (currentDeleteId) {
        deleteNote(currentDeleteId);
        hideDeleteConfirmation();
        // Refresh the table
        loadManageNotesTable();
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    // Dashboard stats
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
        updateDashboardStats();
    }
    
    // Upload form enhancements
    const uploadForm = document.getElementById('upload-note-form');
    if (uploadForm) {
        // Setup PDF preview
        setupPdfPreview();
        
        // Setup drag and drop
        setupDragAndDrop();
        
        // Real-time validation
        document.getElementById('subject-select').addEventListener('change', validateUploadForm);
        document.getElementById('note-title').addEventListener('input', validateUploadForm);
        document.getElementById('note-file').addEventListener('change', validateUploadForm);
        
        // Form submission
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateUploadForm()) {
                return;
            }
            
            const subject = document.getElementById('subject-select').value;
            const title = document.getElementById('note-title').value.trim();
            const file = document.getElementById('note-file').files[0];
            
            try {
                // Show loader
                document.getElementById('upload-button-loader').style.display = 'inline-block';
                document.querySelector('#upload-note-form .button-text').style.display = 'none';
                
                await createNote(subject, title, file);
                
                // Success
                alert('Note uploaded successfully!');
                uploadForm.reset();
                document.getElementById('preview-container').style.display = 'none';
                updateDashboardStats(); // Update dashboard stats
            } catch (error) {
                alert('Error uploading note: ' + error.message);
            } finally {
                // Hide loader
                document.getElementById('upload-button-loader').style.display = 'none';
                document.querySelector('#upload-note-form .button-text').style.display = 'inline';
            }
        });
    }
    
    // Manage notes enhancements
    const manageSection = document.getElementById('manage');
    if (manageSection) {
        // Load notes
        allNotes = getAllNotes();
        filteredNotes = [...allNotes];
        
        // Setup search and filters
        document.getElementById('search-input').addEventListener('input', () => {
            currentPage = 1;
            filterAndSortNotes();
        });
        
        document.getElementById('sort-by').addEventListener('change', () => {
            currentPage = 1;
            filterAndSortNotes();
        });
        
        document.getElementById('filter-subject').addEventListener('change', () => {
            currentPage = 1;
            filterAndSortNotes();
        });
        
        // Setup pagination
        document.getElementById('prev-page').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderNotesTable();
            }
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            const totalPages = Math.ceil(filteredNotes.length / notesPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderNotesTable();
            }
        });
        
        // Initial render
        renderNotesTable();
    }
    
    // Setup confirmation modal
    document.getElementById('cancel-delete').addEventListener('click', hideDeleteConfirmation);
    document.getElementById('confirm-delete').addEventListener('click', performDelete);
    
    // Close modal when clicking outside
    document.getElementById('confirmation-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('confirmation-modal')) {
            hideDeleteConfirmation();
        }
    });
    
    // Subject Management
    const subjectsSection = document.getElementById('subjects');
    if (subjectsSection) {
        loadSubjectsTable();
        
        // Add subject form
        document.getElementById('add-subject-form').addEventListener('submit', function(e) {
            e.preventDefault();
            addSubject();
        });
    }
    
    // Card Manager
    const cardsSection = document.getElementById('cards');
    if (cardsSection) {
        loadCardsList();
        
        // Add card form
        document.getElementById('add-card-form').addEventListener('submit', function(e) {
            e.preventDefault();
            addCard();
        });
    }
});
// Subject Management Functions

// Get all subjects from localStorage
function getAllSubjects() {
    let subjects = localStorage.getItem('subjects');
    return subjects ? JSON.parse(subjects) : [
        'oop', 'cc', 'algo', 'minor', 'mm2', 'evs', 'hrm', 'hindi',
        'python', 'oop-practical', 'algo-practical', 'webdev', 'extra-material'
    ];
}

// Save subjects to localStorage
function saveSubjects(subjects) {
    localStorage.setItem('subjects', JSON.stringify(subjects));
}

// Card Management Functions

// Get all cards from localStorage
function getAllCards() {
    let cards = localStorage.getItem('cards');
    if (cards) {
        return JSON.parse(cards);
    } else {
        // Default cards
        return [
            { id: 1, title: 'OOP', url: 'subjects/oop.html', category: 'theory' },
            { id: 2, title: 'Co-Cirriculum', url: 'subjects/cc.html', category: 'theory' },
            { id: 3, title: 'Algorithms', url: 'subjects/algo.html', category: 'theory' },
            { id: 4, title: 'Minor Project', url: 'subjects/minor.html', category: 'theory' },
            { id: 5, title: 'MM-II', url: 'subjects/mm2.html', category: 'theory' },
            { id: 6, title: 'EVS', url: 'subjects/evs.html', category: 'theory' },
            { id: 7, title: 'HRM', url: 'subjects/hrm.html', category: 'theory' },
            { id: 8, title: 'Hindi', url: 'subjects/hindi.html', category: 'theory' },
            { id: 9, title: 'Python', url: 'practical-notes/python.html', category: 'practical' },
            { id: 10, title: 'OOP Practical', url: 'practical-notes/oop-practical.html', category: 'practical' },
            { id: 11, title: 'Algorithms Practical', url: 'practical-notes/algo-practical.html', category: 'practical' },
            { id: 12, title: 'Web Development', url: 'practical-notes/webdev.html', category: 'practical' },
            { id: 13, title: 'Extra Material', url: 'practical-notes/extra-material.html', category: 'extra' }
        ];
    }
}

// Save cards to localStorage
function saveCards(cards) {
    localStorage.setItem('cards', JSON.stringify(cards));
}

// Add a new card
function addCard() {
    const cardTitle = document.getElementById('card-title').value.trim();
    const cardUrl = document.getElementById('card-url').value.trim();
    const cardCategory = document.getElementById('card-category').value;
    const titleError = document.getElementById('card-title-error');
    const urlError = document.getElementById('card-url-error');
    const successMessage = document.getElementById('card-action-message');
    
    // Clear messages
    titleError.textContent = '';
    urlError.textContent = '';
    successMessage.textContent = '';
    
    // Validate input
    if (!cardTitle) {
        titleError.textContent = 'Please enter a card title';
        return;
    }
    
    if (!cardUrl) {
        urlError.textContent = 'Please enter a card URL';
        return;
    }
    
    // Get existing cards
    let cards = getAllCards();
    
    // Generate new ID
    const newId = cards.length > 0 ? Math.max(...cards.map(card => card.id)) + 1 : 1;
    
    // Create new card object
    const newCard = {
        id: newId,
        title: cardTitle,
        url: cardUrl,
        category: cardCategory
    };
    
    // Add to cards array
    cards.push(newCard);
    
    // Save to localStorage
    saveCards(cards);
    
    // Reset form
    document.getElementById('add-card-form').reset();
    
    // Show success message
    successMessage.textContent = 'Card added successfully!';
    
    // Refresh cards list
    loadCardsList();
    
    // Update index.html
    updateIndexPage();
}

// Delete a card
function deleteCard(cardId) {
    if (confirm('Are you sure you want to delete this card?')) {
        let cards = getAllCards();
        cards = cards.filter(card => card.id !== cardId);
        saveCards(cards);
        loadCardsList();
        updateIndexPage();
    }
}

// Edit a card
function editCard(cardId) {
    const cards = getAllCards();
    const card = cards.find(c => c.id === cardId);
    
    if (card) {
        const newTitle = prompt('Enter new title:', card.title);
        const newUrl = prompt('Enter new URL:', card.url);
        const newCategory = prompt('Enter new category (theory/practical):', card.category);
        
        if (newTitle !== null && newUrl !== null && newCategory !== null) {
            card.title = newTitle;
            card.url = newUrl;
            card.category = newCategory;
            
            saveCards(cards);
            loadCardsList();
            updateIndexPage();
        }
    }
}

// Load cards list in admin panel
function loadCardsList() {
    const cardsTableBody = document.getElementById('cards-table-body');
    const cards = getAllCards();
    
    if (cards.length === 0) {
        cardsTableBody.innerHTML = '<tr><td colspan="4">No cards found.</td></tr>';
        return;
    }
    
    let cardsHTML = '';
    
    cards.forEach(card => {
        cardsHTML += `
            <tr>
                <td>${card.title}</td>
                <td>${card.url}</td>
                <td>${card.category}</td>
                <td>
                    <button class="neon-button small" onclick="editCard(${card.id})">Edit</button>
                    <button class="neon-button small delete-note-button" onclick="deleteCard(${card.id})">Delete</button>
                </td>
            </tr>
        `;
    });
    
    cardsTableBody.innerHTML = cardsHTML;
}

// Update index.html with current cards
function updateIndexPage() {
    // Get all cards
    const cards = getAllCards();
    
    // Separate theory, practical, and extra material cards
    const theoryCards = cards.filter(card => card.category === 'theory');
    const practicalCards = cards.filter(card => card.category === 'practical');
    const extraMaterielCards = cards.filter(card => card.category === 'extra');
    
    // Update theory section
    const theoryGrid = document.getElementById('theory-cards-container');
    if (theoryGrid) {
        theoryGrid.innerHTML = '';
        theoryCards.forEach(card => {
            const cardElement = document.createElement('a');
            cardElement.href = card.url;
            cardElement.className = 'subject-card glass-block';
            cardElement.innerHTML = `<h3>${card.title}</h3>`;
            theoryGrid.appendChild(cardElement);
        });
    }
    
    // Update practical section
    const practicalGrid = document.getElementById('practical-cards-container');
    if (practicalGrid) {
        practicalGrid.innerHTML = '';
        practicalCards.forEach(card => {
            const cardElement = document.createElement('a');
            cardElement.href = card.url;
            cardElement.className = 'subject-card glass-block';
            cardElement.innerHTML = `<h3>${card.title}</h3>`;
            practicalGrid.appendChild(cardElement);
        });
    }
    
    // Update extra material section
    const extraMaterialGrid = document.getElementById('extra-material-container');
    if (extraMaterialGrid) {
        extraMaterialGrid.innerHTML = '';
        extraMaterielCards.forEach(card => {
            const cardElement = document.createElement('a');
            cardElement.href = card.url;
            cardElement.className = 'subject-card glass-block';
            cardElement.innerHTML = `<h3>${card.title}</h3>`;
            extraMaterialGrid.appendChild(cardElement);
        });
    }
}

// Add a new subject
function addSubject() {
    const subjectName = document.getElementById('subject-name').value.trim();
    const subjectCategory = document.getElementById('subject-category').value;
    const errorMessage = document.getElementById('subject-name-error');
    const successMessage = document.getElementById('subject-action-message');
    
    // Clear messages
    errorMessage.textContent = '';
    successMessage.textContent = '';
    
    // Validate input
    if (!subjectName) {
        errorMessage.textContent = 'Please enter a subject name';
        return;
    }
    
    // Get existing subjects
    let subjects = getAllSubjects();
    
    // Check for duplicates (case insensitive)
    if (subjects.some(s => s.toLowerCase() === subjectName.toLowerCase())) {
        errorMessage.textContent = 'Subject already exists';
        return;
    }
    
    // Add new subject
    const subjectSlug = subjectName.toLowerCase().replace(/\s+/g, '-');
    subjects.push(subjectSlug);
    saveSubjects(subjects);
    
    // Update categorized subjects
    const categorizedSubjects = getCategorizedSubjects();
    
    // Add to the selected category
    if (subjectCategory === 'theory') {
        categorizedSubjects.theory.push(subjectSlug);
    } else {
        categorizedSubjects.practical.push(subjectSlug);
    }
    
    saveCategorizedSubjects(categorizedSubjects);
    
    // Clear form
    document.getElementById('add-subject-form').reset();
    
    // Show success message
    successMessage.textContent = 'Subject added successfully!';
    successMessage.style.color = 'green';
    
    // Reload subjects table
    loadSubjectsTable();
    
    // Update subject dropdowns across the site
    updateSubjectDropdowns(subjects);
}

// Load subjects into the table
function loadSubjectsTable() {
    const tableBody = document.getElementById('subjects-table-body');
    if (!tableBody) return;
    
    const subjects = getAllSubjects();
    tableBody.innerHTML = '';
    
    if (subjects.length === 0) {
        const row = tableBody.insertRow();
        row.innerHTML = '<td colspan="2" style="text-align: center;">No subjects found</td>';
        return;
    }
    
    const categorizedSubjects = getCategorizedSubjects();
    
    subjects.forEach((subject, index) => {
        // Determine category
        let category = 'Theory';
        if (categorizedSubjects.practical.includes(subject)) {
            category = 'Practical';
        }
        
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>
                <span class="subject-name-display">${subject}</span>
                <input type="text" class="subject-name-edit" value="${subject}" style="display: none; width: 100%; padding: 5px;" />
            </td>
            <td>
                <select class="category-select" data-index="${index}" data-original="${category}" style="display: none;">
                    <option value="Theory" ${category === 'Theory' ? 'selected' : ''}>Theory</option>
                    <option value="Practical" ${category === 'Practical' ? 'selected' : ''}>Practical</option>
                </select>
                <span class="category-display">${category}</span>
            </td>
            <td class="action-buttons">
                <button class="neon-button edit-subject-btn" data-index="${index}" data-original="${subject}">Edit</button>
                <button class="neon-button delete-button delete-subject-btn" data-index="${index}" data-subject="${subject}">Delete</button>
                <button class="neon-button save-subject-btn" data-index="${index}" style="display: none;">Save</button>
                <button class="neon-button cancel-subject-btn" data-index="${index}" data-original="${subject}" style="display: none;">Cancel</button>
            </td>
        `;
    });
    
    // Add event listeners for edit, delete, save, and cancel buttons
    document.querySelectorAll('.edit-subject-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const originalName = this.getAttribute('data-original');
            enableSubjectEdit(index, originalName);
        });
    });
    
    document.querySelectorAll('.delete-subject-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const subjectName = this.getAttribute('data-subject');
            deleteSubject(index, subjectName);
        });
    });
    
    document.querySelectorAll('.save-subject-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            saveSubjectEdit(index);
        });
    });
    
    document.querySelectorAll('.cancel-subject-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const originalName = this.getAttribute('data-original');
            cancelSubjectEdit(index, originalName);
        });
    });
}

// Enable editing for a subject
function enableSubjectEdit(index, originalName) {
    const row = document.querySelector(`.edit-subject-btn[data-index="${index}"]`).closest('tr');
    const displayName = row.querySelector('.subject-name-display');
    const editInput = row.querySelector('.subject-name-edit');
    const categoryDisplay = row.querySelector('.category-display');
    const categorySelect = row.querySelector('.category-select');
    const editBtn = row.querySelector('.edit-subject-btn');
    const deleteBtn = row.querySelector('.delete-subject-btn');
    const saveBtn = row.querySelector('.save-subject-btn');
    const cancelBtn = row.querySelector('.cancel-subject-btn');
    
    // Switch to edit mode
    displayName.style.display = 'none';
    editInput.style.display = 'block';
    categoryDisplay.style.display = 'none';
    categorySelect.style.display = 'block';
    editBtn.style.display = 'none';
    deleteBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
    
    // Focus the input
    editInput.focus();
}

// Save edited subject
function saveSubjectEdit(index) {
    const row = document.querySelector(`.save-subject-btn[data-index="${index}"]`).closest('tr');
    const editInput = row.querySelector('.subject-name-edit');
    const categorySelect = row.querySelector('.category-select');
    const newName = editInput.value.trim();
    const newCategory = categorySelect.value;
    const originalName = row.querySelector('.cancel-subject-btn').getAttribute('data-original');
    
    if (!newName) {
        alert('Subject name cannot be empty');
        return;
    }
    
    // Get subjects
    let subjects = getAllSubjects();
    
    // Check for duplicates (excluding the current subject)
    const newSlug = newName.toLowerCase().replace(/\s+/g, '-');
    if (newSlug.toLowerCase() !== originalName.toLowerCase() && 
        subjects.some(s => s.toLowerCase() === newSlug.toLowerCase())) {
        alert('A subject with this name already exists');
        return;
    }
    
    // Update subject
    subjects[index] = newSlug;
    saveSubjects(subjects);
    
    // Update categorized subjects
    const categorizedSubjects = getCategorizedSubjects();
    
    // Remove from both categories
    const theoryIndex = categorizedSubjects.theory.indexOf(originalName);
    if (theoryIndex !== -1) {
        categorizedSubjects.theory.splice(theoryIndex, 1);
    }
    
    const practicalIndex = categorizedSubjects.practical.indexOf(originalName);
    if (practicalIndex !== -1) {
        categorizedSubjects.practical.splice(practicalIndex, 1);
    }
    
    // Add to the selected category
    if (newCategory === 'Theory') {
        categorizedSubjects.theory.push(newSlug);
    } else {
        categorizedSubjects.practical.push(newSlug);
    }
    
    saveCategorizedSubjects(categorizedSubjects);
    
    // Reload table
    loadSubjectsTable();
    
    // Update subject dropdowns across the site
    updateSubjectDropdowns(subjects);
}

// Cancel subject edit
function cancelSubjectEdit(index, originalName) {
    const row = document.querySelector(`.cancel-subject-btn[data-index="${index}"]`).closest('tr');
    const displayName = row.querySelector('.subject-name-display');
    const editInput = row.querySelector('.subject-name-edit');
    const categoryDisplay = row.querySelector('.category-display');
    const categorySelect = row.querySelector('.category-select');
    const editBtn = row.querySelector('.edit-subject-btn');
    const deleteBtn = row.querySelector('.delete-subject-btn');
    const saveBtn = row.querySelector('.save-subject-btn');
    const cancelBtn = row.querySelector('.cancel-subject-btn');
    
    // Revert to display mode
    displayName.style.display = 'inline';
    editInput.style.display = 'none';
    categoryDisplay.style.display = 'inline';
    categorySelect.style.display = 'none';
    editBtn.style.display = 'inline-block';
    deleteBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    
    // Reset input value
    editInput.value = originalName;
}

// Delete a subject
function deleteSubject(index, subjectName) {
    if (confirm(`Are you sure you want to delete the subject "${subjectName}"? This will not affect existing notes with this subject.`)) {
        // Get subjects
        let subjects = getAllSubjects();
        
        // Remove subject
        subjects.splice(index, 1);
        saveSubjects(subjects);
        
        // Update categorized subjects
        const categorizedSubjects = getCategorizedSubjects();
        
        // Remove from theory category
        const theoryIndex = categorizedSubjects.theory.indexOf(subjectName);
        if (theoryIndex !== -1) {
            categorizedSubjects.theory.splice(theoryIndex, 1);
        }
        
        // Remove from practical category
        const practicalIndex = categorizedSubjects.practical.indexOf(subjectName);
        if (practicalIndex !== -1) {
            categorizedSubjects.practical.splice(practicalIndex, 1);
        }
        
        saveCategorizedSubjects(categorizedSubjects);
        
        // Reload table
        loadSubjectsTable();
        
        // Update subject dropdowns across the site
        updateSubjectDropdowns(subjects);
    }
}

// Update subject dropdowns across the site
function updateSubjectDropdowns(subjects) {
    // Get categorized subjects from localStorage or use defaults
    const categorizedSubjects = getCategorizedSubjects();
    
    // Update upload form subject dropdown
    const subjectSelect = document.getElementById('subject-select');
    if (subjectSelect) {
        // Store the current selection
        const currentValue = subjectSelect.value;
        
        // Clear existing options except the first one
        while (subjectSelect.children.length > 1) {
            subjectSelect.removeChild(subjectSelect.lastChild);
        }
        
        // Add theory subjects
        const theoryGroup = document.createElement('optgroup');
        theoryGroup.label = 'Theory';
        
        // Add practical subjects
        const practicalGroup = document.createElement('optgroup');
        practicalGroup.label = 'Practical';
        
        // Categorize subjects
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject.charAt(0).toUpperCase() + subject.slice(1).replace(/-/g, ' ');
            
            // Check if subject is categorized as practical
            if (categorizedSubjects.practical.includes(subject)) {
                practicalGroup.appendChild(option);
            } else {
                theoryGroup.appendChild(option);
            }
        });
        
        // Add groups to select
        if (theoryGroup.children.length > 0) {
            subjectSelect.appendChild(theoryGroup);
        }
        if (practicalGroup.children.length > 0) {
            subjectSelect.appendChild(practicalGroup);
        }
        
        // Restore selection if it still exists
        if (currentValue && subjects.includes(currentValue)) {
            subjectSelect.value = currentValue;
        }
    }
    
    // Update manage notes filter dropdown
    const filterSubject = document.getElementById('filter-subject');
    if (filterSubject) {
        // Store the current selection
        const currentValue = filterSubject.value;
        
        // Clear existing options except the first one
        while (filterSubject.children.length > 1) {
            filterSubject.removeChild(filterSubject.lastChild);
        }
        
        // Add subjects to filter
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject.charAt(0).toUpperCase() + subject.slice(1).replace(/-/g, ' ');
            filterSubject.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (currentValue && (currentValue === 'all' || subjects.includes(currentValue))) {
            filterSubject.value = currentValue;
        }
    }
    
    // Update index.html subject grids
    updateIndexPageSubjects(subjects, categorizedSubjects);
}

// Get categorized subjects from localStorage
function getCategorizedSubjects() {
    const stored = localStorage.getItem('categorizedSubjects');
    if (stored) {
        return JSON.parse(stored);
    }
    
    // Default categorization
    return {
        theory: ['oop', 'cc', 'algo', 'minor', 'mm2', 'evs', 'hrm', 'hindi'],
        practical: ['python', 'oop-practical', 'algo-practical', 'webdev', 'extra-material']
    };
}

// Save categorized subjects to localStorage
function saveCategorizedSubjects(categorizedSubjects) {
    localStorage.setItem('categorizedSubjects', JSON.stringify(categorizedSubjects));
}

// Update index.html subject grids
function updateIndexPageSubjects(subjects, categorizedSubjects) {
    // Update theory subjects grid
    const theoryGrid = document.querySelector('#theory-subjects .subject-grid');
    if (theoryGrid) {
        theoryGrid.innerHTML = '';
        categorizedSubjects.theory.forEach(subject => {
            if (subjects.includes(subject)) {
                const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1).replace(/-/g, ' ');
                const subjectLink = subject.replace(/\s+/g, '-').toLowerCase();
                const subjectCard = document.createElement('a');
                subjectCard.href = subject.includes('practical') ? `practical-notes/${subjectLink}.html` : `subjects/${subjectLink}.html`;
                subjectCard.className = 'subject-card glass-block';
                subjectCard.innerHTML = `<h3>${subjectName}</h3>`;
                theoryGrid.appendChild(subjectCard);
            }
        });
    }
    
    // Update practical subjects grid
    const practicalGrid = document.querySelector('#practical-notes .subject-grid');
    if (practicalGrid) {
        practicalGrid.innerHTML = '';
        categorizedSubjects.practical.forEach(subject => {
            if (subjects.includes(subject)) {
                const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1).replace(/-/g, ' ');
                const subjectLink = subject.replace(/\s+/g, '-').toLowerCase();
                const subjectCard = document.createElement('a');
                subjectCard.href = `practical-notes/${subjectLink}.html`;
                subjectCard.className = 'subject-card glass-block';
                subjectCard.innerHTML = `<h3>${subjectName}</h3>`;
                practicalGrid.appendChild(subjectCard);
            }
        });
    }
}