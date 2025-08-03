// Hey there! This handles all the admin login stuff
const API_BASE_URL = 'http://localhost:5000/api';
let currentUser = null;
let adminToken = null;

// We only check if someone's logged in as admin when they're actually on admin pages
// I removed the automatic check because it was keeping people logged in forever (oops!)

// Let's check right away when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // First things first - let's set up all the buttons and stuff
    initializeDOMElements();
    
    // Now let's figure out what page we're on
    const currentPath = window.location.pathname;
    const isAdminPage = currentPath.includes('admin-login') || 
                       currentPath.includes('admin-setup') || 
                       currentPath.includes('admin-test');
    
    // If they're on the login page, clear everything so they can start fresh
    if (currentPath.includes('admin-login')) {
        console.log('Admin login page - clearing any existing sessions for fresh start');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        adminToken = null;
        currentUser = null;
        showGuestInterface();
        return;
    }
    
    // For the main pages, let's see if they're already logged in
    console.log('Checking for existing admin session...');
    const existingToken = localStorage.getItem('adminToken');
    
    if (existingToken) {
        console.log('Found existing admin token, verifying...');
        // Let's double-check this token is still good with the server
        fetch(`${API_BASE_URL}/admin/verify`, {
            headers: {
                'Authorization': `Bearer ${existingToken}`
            }
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                console.log('Valid admin session found, automatically enabling admin interface');
                adminToken = existingToken;
                currentUser = JSON.parse(localStorage.getItem('adminUser'));
                showAdminInterface();
                // Removed automatic success notification - only show on actual login
            } else {
                console.log('Invalid admin token, clearing and showing guest interface');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                adminToken = null;
                currentUser = null;
                showGuestInterface();
            }
        })
        .catch((error) => {
            console.log('Error verifying admin token:', error);
            // If something went wrong, just go to guest mode but keep the token (maybe server is down)
            adminToken = null;
            currentUser = null;
            showGuestInterface();
        });
    } else {
        console.log('No admin session found, starting in guest mode');
        showGuestInterface();
    }
});

function checkAdminAuth() {
    console.log('Checking admin authentication...');
    adminToken = localStorage.getItem('adminToken');
    console.log('Admin token found:', !!adminToken);
    
    if (adminToken) {
        // Let's make sure this token is still valid
        fetch(`${API_BASE_URL}/admin/verify`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        })
        .then(res => res.json())
        .then(result => {
            console.log('Token verification result:', result);
            if (result.success) {
                currentUser = JSON.parse(localStorage.getItem('adminUser'));
                console.log('Admin user loaded:', currentUser);
                showAdminInterface();
            } else {
                console.log('Token invalid, logging out');
                adminLogout();
            }
        })
        .catch((error) => {
            console.log('Token verification failed:', error);
            adminLogout();
        });
    } else {
        console.log('No admin token, showing guest interface');
        showGuestInterface();
    }
}

function showAdminInterface() {
    console.log('=== SWITCHING TO ADMIN MODE ===');
    const adminSection = document.getElementById('admin-nav-section');
    const guestSection = document.getElementById('guest-nav-section');
    
    if (adminSection) {
        console.log('Found the admin section, making it visible');
        adminSection.classList.add('show');
        adminSection.style.display = 'flex';
        console.log('Admin section display:', adminSection.style.display);
    } else {
        console.log('Uh oh! Cannot find the admin section in the HTML');
    }
    
    if (guestSection) {
        console.log('Found the guest section, hiding it now');
        guestSection.style.display = 'none';
    } else {
        console.log('Hmm, guest section is missing too');
    }
}

// This function can be called manually when needed (like when someone clicks a button)
function checkForAdminSession() {
    console.log('Someone asked me to manually check for admin session...');
    checkAdminAuth();
}

function showGuestInterface() {
    console.log('=== SWITCHING TO GUEST MODE ===');
    const adminSection = document.getElementById('admin-nav-section');
    const guestSection = document.getElementById('guest-nav-section');
    
    if (adminSection) {
        console.log('Found admin section, hiding it');
        adminSection.classList.remove('show');
        adminSection.style.display = 'none';
        console.log('Admin section display:', adminSection.style.display);
    } else {
        console.log('Cannot find admin section (that\'s weird)');
    }
    
    if (guestSection) {
        console.log('Found guest section, making it visible');
        guestSection.style.display = 'flex';
    } else {
        console.log('Guest section is also missing (this is bad)');
    }
}

function adminLogout() {
    console.log('=== LOGGING OUT ADMIN ===');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    adminToken = null;
    currentUser = null;
    showGuestInterface();
    console.log('Admin is now logged out, all data cleared');
    
    // Let them know they logged out successfully
    showSuccessNotification('👋 Logged out successfully! You are now in guest mode.');
}

// Sometimes we need to force guest mode (like when things go wrong)
function forceGuestMode() {
    console.log('Force quitting admin mode...');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    adminToken = null;
    currentUser = null;
    showGuestInterface();
    console.log('Forced back to guest mode');
}

// This function clears admin stuff from the main page but keeps the login info saved
function clearMainPageAdminSession() {
    console.log('Clearing admin session variables for main page');
    adminToken = null;
    currentUser = null;
    // Don't actually delete from localStorage - just clear the variables for now
    console.log('Admin session cleared for main page');
}

// Testing function to force logout (helpful for debugging)
function forceLogout() {
    console.log('Force logout called');
    adminLogout();
}

// Making these functions available globally so we can test them in the browser console
window.forceLogout = forceLogout;
window.forceGuestMode = forceGuestMode;
window.checkForAdminSession = checkForAdminSession;
window.clearMainPageAdminSession = clearMainPageAdminSession;

// Functions for the upload modal
function showUploadModal() {
    if (!adminToken) {
        alert('Please login as admin first');
        window.location.href = 'admin-login.html';
        return;
    }
    document.getElementById('upload-modal').style.display = 'block';
    
    // Let's see what storage we're using
    checkStorageStatus();
}

// Check storage status and update indicator
async function checkStorageStatus() {
    const statusElement = document.getElementById('storage-status');
    const iconElement = document.getElementById('storage-icon');
    const textElement = document.getElementById('storage-text');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/storage-status`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.googleDriveEnabled) {
                statusElement.className = 'storage-status google-drive';
                iconElement.className = 'fas fa-cloud';
                textElement.textContent = '☁️ Files will be stored in Google Drive';
            } else {
                statusElement.className = 'storage-status local-storage';
                iconElement.className = 'fas fa-hard-drive';
                textElement.textContent = '💾 Files will be stored locally';
            }
        } else {
            throw new Error('Failed to check storage status');
        }
    } catch (error) {
        console.error('Error checking storage status:', error);
        statusElement.className = 'storage-status local-storage';
        iconElement.className = 'fas fa-hard-drive';
        textElement.textContent = '💾 Files will be stored locally (fallback)';
    }
}

function closeUploadModal() {
    document.getElementById('upload-modal').style.display = 'none';
    document.getElementById('upload-form').reset();
}

// Handle upload form submission
document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleFileUpload();
        });
    }
});

async function handleFileUpload() {
    if (!adminToken) {
        alert('Please login as admin first');
        return;
    }

    const form = document.getElementById('upload-form');
    const formData = new FormData();
    
    // Get form values
    const semester = document.getElementById('upload-semester').value;
    const subject = document.getElementById('upload-subject').value;
    const category = document.getElementById('upload-category').value;
    const title = document.getElementById('upload-title').value;
    const description = document.getElementById('upload-description').value;
    const fileInput = document.getElementById('upload-file');
    
    if (!fileInput.files[0]) {
        alert('Please select a file to upload');
        return;
    }
    
    // Append form data
    formData.append('semester', semester);
    formData.append('subject', subject);
    formData.append('category', category);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', fileInput.files[0]);
    
    const uploadBtn = form.querySelector('.btn-upload');
    const originalText = uploadBtn.innerHTML;
    
    try {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        
        console.log('🔐 Using admin token:', adminToken ? 'Present' : 'Missing');
        console.log('📤 Uploading to:', `${API_BASE_URL}/content/upload`);
        
        const response = await fetch(`${API_BASE_URL}/content/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: formData
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server response not ok:', response.status, errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Upload result:', result);
        
        if (result.success) {
            alert('File uploaded successfully!');
            closeUploadModal();
            // Refresh content if we're viewing the same category
            const modalSubjectTitle = document.getElementById('modal-subject-title').textContent;
            if (modalSubjectTitle && modalSubjectTitle.toLowerCase().includes(subject.toLowerCase())) {
                loadSubjectContent(subject.toLowerCase().replace(/\s+/g, '-'), semester);
            }
        } else {
            alert(result.message || 'Upload failed');
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Upload failed. ';
        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Cannot connect to server. Please check if the server is running on http://localhost:5000';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMessage += 'Authentication failed. Please login as admin again.';
        } else if (error.message.includes('413') || error.message.includes('too large')) {
            errorMessage += 'File is too large. Maximum size is 100MB.';
        } else {
            errorMessage += error.message || 'Please try again.';
        }
        
        alert(errorMessage);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = originalText;
    }
}

// Combined delete content function is below in the file

// B.Sc. Computer Science Semester Data Structure
const bscCSData = {
    1: {
        title: 'First Semester',
        subjects: {
            'programming-fundamentals': {
                title: 'Programming Fundamentals',
                code: 'CSC101',
                icon: 'fas fa-code',
                description: 'Introduction to programming with C language'
            },
            'computer-fundamentals': {
                title: 'Computer Fundamentals',
                code: 'CSC102',
                icon: 'fas fa-desktop',
                description: 'Basic computer concepts and architecture'
            },
            'mathematics-1': {
                title: 'Mathematics I',
                code: 'MAT101',
                icon: 'fas fa-square-root-alt',
                description: 'Calculus and analytical geometry'
            },
            'english': {
                title: 'English Communication',
                code: 'ENG101',
                icon: 'fas fa-book',
                description: 'Communication skills and technical writing'
            },
            'physics': {
                title: 'Physics',
                code: 'PHY101',
                icon: 'fas fa-atom',
                description: 'Basic physics concepts for computer science'
            }
        }
    },
    2: {
        title: 'Second Semester',
        subjects: {
            'object-oriented-programming': {
                title: 'Object Oriented Programming',
                code: 'CSC201',
                icon: 'fas fa-cubes',
                description: 'OOP concepts using C++ and Java'
            },
            'data-structures': {
                title: 'Data Structures',
                code: 'CSC202',
                icon: 'fas fa-sitemap',
                description: 'Linear and non-linear data structures'
            },
            'discrete-mathematics': {
                title: 'Discrete Mathematics',
                code: 'MAT201',
                icon: 'fas fa-calculator',
                description: 'Logic, sets, and discrete structures'
            },
            'digital-electronics': {
                title: 'Digital Electronics',
                code: 'ELC201',
                icon: 'fas fa-microchip',
                description: 'Digital circuits and logic design'
            },
            'mathematics-2': {
                title: 'Mathematics II',
                code: 'MAT202',
                icon: 'fas fa-square-root-alt',
                description: 'Advanced calculus and linear algebra'
            }
        }
    },
    3: {
        title: 'Third Semester',
        subjects: {
            'database-management': {
                title: 'Database Management Systems',
                code: 'CSC301',
                icon: 'fas fa-database',
                description: 'Database design and SQL programming'
            },
            'computer-networks': {
                title: 'Computer Networks',
                code: 'CSC302',
                icon: 'fas fa-network-wired',
                description: 'Network protocols and architectures'
            },
            'algorithms': {
                title: 'Algorithm Analysis',
                code: 'CSC303',
                icon: 'fas fa-project-diagram',
                description: 'Algorithm design and complexity analysis'
            },
            'operating-systems': {
                title: 'Operating Systems',
                code: 'CSC304',
                icon: 'fas fa-cogs',
                description: 'OS concepts and system programming'
            },
            'statistics': {
                title: 'Statistics',
                code: 'STA301',
                icon: 'fas fa-chart-bar',
                description: 'Statistical methods for computer science'
            }
        }
    },
    4: {
        title: 'Fourth Semester',
        subjects: {
            'web-development': {
                title: 'Web Development',
                code: 'CSC401',
                icon: 'fas fa-globe',
                description: 'HTML, CSS, JavaScript, and web frameworks'
            },
            'software-engineering': {
                title: 'Software Engineering',
                code: 'CSC402',
                icon: 'fas fa-tools',
                description: 'Software development lifecycle and methodologies'
            },
            'computer-graphics': {
                title: 'Computer Graphics',
                code: 'CSC403',
                icon: 'fas fa-paint-brush',
                description: 'Graphics programming and visualization'
            },
            'numerical-methods': {
                title: 'Numerical Methods',
                code: 'MAT401',
                icon: 'fas fa-calculator',
                description: 'Computational mathematics and algorithms'
            },
            'system-analysis': {
                title: 'System Analysis & Design',
                code: 'CSC404',
                icon: 'fas fa-drafting-compass',
                description: 'System design and analysis techniques'
            }
        }
    },
    5: {
        title: 'Fifth Semester',
        subjects: {
            'artificial-intelligence': {
                title: 'Artificial Intelligence',
                code: 'CSC501',
                icon: 'fas fa-brain',
                description: 'AI concepts and machine learning basics'
            },
            'compiler-design': {
                title: 'Compiler Design',
                code: 'CSC502',
                icon: 'fas fa-code-branch',
                description: 'Language processing and compiler construction'
            },
            'mobile-computing': {
                title: 'Mobile Computing',
                code: 'CSC503',
                icon: 'fas fa-mobile-alt',
                description: 'Mobile app development and technologies'
            },
            'information-security': {
                title: 'Information Security',
                code: 'CSC504',
                icon: 'fas fa-shield-alt',
                description: 'Cybersecurity and data protection'
            },
            'elective-1': {
                title: 'Elective I',
                code: 'CSC505',
                icon: 'fas fa-star',
                description: 'Choose from available specialization subjects'
            }
        }
    },
    6: {
        title: 'Sixth Semester',
        subjects: {
            'project-work': {
                title: 'Final Year Project',
                code: 'CSC601',
                icon: 'fas fa-project-diagram',
                description: 'Capstone project and research work'
            },
            'cloud-computing': {
                title: 'Cloud Computing',
                code: 'CSC602',
                icon: 'fas fa-cloud',
                description: 'Cloud platforms and distributed computing'
            },
            'data-mining': {
                title: 'Data Mining',
                code: 'CSC603',
                icon: 'fas fa-search',
                description: 'Data analysis and knowledge discovery'
            },
            'human-computer-interaction': {
                title: 'Human Computer Interaction',
                code: 'CSC604',
                icon: 'fas fa-users',
                description: 'UI/UX design and usability principles'
            },
            'elective-2': {
                title: 'Elective II',
                code: 'CSC605',
                icon: 'fas fa-star',
                description: 'Advanced specialization subject'
            },
            'internship': {
                title: 'Industrial Training',
                code: 'CSC606',
                icon: 'fas fa-building',
                description: 'Practical industry experience'
            }
        }
    }
};

// Comprehensive Notes Content for B.Sc. Computer Science
const notesDatabase = {};

// Sample content structure for each subject
const sampleContentStructure = {
    'teacher-notes': [],
    'student-notes': [],
    'resources': [],
    'assignments': [],
    'pyqs': [],
    'syllabus': []
};

// DOM Elements
let navToggle, navMenu, modal, modalTitle, modalContentArea;

// Initialize DOM elements when page loads
function initializeDOMElements() {
    navToggle = document.getElementById('nav-toggle');
    navMenu = document.getElementById('nav-menu');
    modal = document.getElementById('subject-modal');
    modalTitle = document.getElementById('modal-subject-title');
    modalContentArea = document.getElementById('modal-content-area');
    
    console.log('DOM Elements initialized:', {
        navToggle: !!navToggle,
        navMenu: !!navMenu,
        modal: !!modal
    });
    
    // Add event listeners
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            console.log('Mobile nav toggle clicked');
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    } else {
        console.error('Navigation elements not found:', { navToggle, navMenu });
    }
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu && navToggle) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });
}

// Global variables
let selectedSemester = 0;

// Navigation functionality will be initialized in DOMContentLoaded

// Update active nav link based on scroll position
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Smooth scroll function
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth'
        });
    }
}



// Semester selection functionality
function selectSemester(semesterNumber) {
    selectedSemester = semesterNumber;
    
    if (bscCSData[semesterNumber]) {
        const semester = bscCSData[semesterNumber];
        
        // Update UI
        document.getElementById('selected-semester-info').textContent = semester.title;
        
        // Load subjects
        loadSubjects(semester.subjects);
        
        // Show subjects section
        document.getElementById('semesters').style.display = 'none';
        document.getElementById('subjects-list').style.display = 'block';
        
        // Add animation and scroll
        const subjectsSection = document.getElementById('subjects-list');
        subjectsSection.classList.add('fade-in');
        subjectsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Load subjects for selected semester
function loadSubjects(subjects) {
    const container = document.getElementById('subjects-container');
    container.innerHTML = '';
    
    Object.keys(subjects).forEach((subjectKey, index) => {
        const subject = subjects[subjectKey];
        const subjectCard = document.createElement('div');
        subjectCard.className = 'subject-card';
        subjectCard.style.animationDelay = `${index * 0.1}s`;
        
        // Add click event listener
        subjectCard.addEventListener('click', () => {
            console.log('Subject card clicked:', subject.title);
            openSubject(subjectKey, subject);
        });
        
        // Also keep the onclick for backup
        subjectCard.onclick = () => openSubject(subjectKey, subject);
        
        subjectCard.innerHTML = `
            <div class="subject-icon">
                <i class="${subject.icon}"></i>
            </div>
            <h3>${subject.title}</h3>
            <p>${subject.description}</p>
            <span class="subject-code">${subject.code}</span>
        `;
        
        container.appendChild(subjectCard);
    });
}

// Navigation functions
function goBackToCourses() {
    document.getElementById('semesters').style.display = 'none';
    document.getElementById('subjects').style.display = 'block';
    document.getElementById('subjects').scrollIntoView({ behavior: 'smooth' });
}

function goBackToSemesters() {
    document.getElementById('subjects-list').style.display = 'none';
    document.getElementById('semesters').style.display = 'block';
    document.getElementById('semesters').scrollIntoView({ behavior: 'smooth' });
}

// Open subject modal
function openSubject(subjectKey, subjectData) {
    console.log('Opening subject:', subjectData.title);
    
    const modal = document.getElementById('subject-modal');
    const modalTitle = document.getElementById('modal-subject-title');
    
    if (modal && modalTitle) {
        modalTitle.textContent = subjectData.title;
        
        // Show modal with proper animation
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Add show class after a small delay for animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        console.log('Modal should be visible now');
        
        // Initialize the first tab
        showTab('teacher-notes');
    } else {
        console.error('Modal elements not found');
        console.log('Modal element:', modal);
        console.log('Modal title element:', modalTitle);
        alert('Modal not found. Please check if the HTML contains the subject-modal element.');
    }
}

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
    if (event.target === document.getElementById('add-content-modal')) {
        closeAddContentModal();
    }
});

// Close modal
function closeModal() {
    const modal = document.getElementById('subject-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400);
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
}

// Debug function to check modal elements
function debugModalElements() {
    console.log('Checking modal elements:');
    console.log('subject-modal:', document.getElementById('subject-modal'));
    console.log('modal-subject-title:', document.getElementById('modal-subject-title'));
    console.log('modal-content-area:', document.getElementById('modal-content-area'));
    
    // Also check if modal tabs exist
    const modalTabs = document.querySelector('.modal-tabs');
    console.log('modal-tabs:', modalTabs);
    
    if (!document.getElementById('subject-modal')) {
        console.error('Subject modal not found in HTML!');
    }
}

// Content management storage (using MongoDB API)
let contentDatabase = {}; // Cache for frontend

// API helper functions
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        // Fallback to localStorage if API is not available
        return handleOfflineMode(url, options);
    }
}

// Fallback to localStorage when server is not available
function handleOfflineMode(url, options) {
    console.warn('Server not available, using offline mode with localStorage');
    const localData = JSON.parse(localStorage.getItem('contentDatabase')) || {};
    
    if (options.method === 'POST') {
        // Handle adding content offline
        return { success: true, message: 'Content will be synced when server is available' };
    }
    
    // Return cached data for GET requests
    return { success: true, data: [] };
}

// Load content from MongoDB
async function loadContentFromDatabase(semester, subject, tab) {
    try {
        const params = new URLSearchParams();
        if (semester) params.append('semester', semester);
        if (subject) params.append('subject', subject);
        if (tab) params.append('category', tab); // Changed from 'tab' to 'category'
        
        const result = await apiRequest(`/content?${params.toString()}`);
        
        if (result.success) {
            return result.data || [];
        }
        return [];
    } catch (error) {
        console.error('Error loading content:', error);
        return [];
    }
}

// Add content to MongoDB
async function addContentToDatabase(contentData) {
    try {
        const result = await apiRequest('/content', {
            method: 'POST',
            body: JSON.stringify(contentData)
        });
        
        if (result.success) {
            return result;
        }
        throw new Error(result.message || 'Failed to add content');
    } catch (error) {
        console.error('Error adding content:', error);
        throw error;
    }
}

// Simple content display - no complex modals needed

// Complex modal functions removed - using simple upload instead

// Close add content modal
function closeAddContentModal() {
    const addContentModal = document.getElementById('add-content-modal');
    if (addContentModal) {
        addContentModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Save content
async function saveContent(event) {
    event.preventDefault();
    
    const addContentModal = document.getElementById('add-content-modal');
    const tabName = addContentModal.dataset.tabName;
    const subjectKey = addContentModal.dataset.subjectKey;
    const title = document.getElementById('content-title-input').value.trim();
    const description = document.getElementById('content-description-input').value.trim();
    const type = document.getElementById('content-type-select').value;
    const fileInput = document.getElementById('file-upload-input');
    const manualSize = document.getElementById('content-size-input').value.trim();
    
    if (!title || !description) {
        alert('Please fill in both title and description.');
        return;
    }
    
    // Get current semester from the UI
    const currentSemester = getCurrentSemester();
    
    try {
        // Show loading state
        const saveButton = document.querySelector('.save-btn');
        const originalText = saveButton.textContent;
        saveButton.textContent = 'Uploading...';
        saveButton.disabled = true;
        
        let result;
        
        if (fileInput.files && fileInput.files[0]) {
            // Upload with file
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('semester', currentSemester);
            formData.append('subject', subjectKey);
            formData.append('category', tabName); // Changed from 'tab' to 'category'
            formData.append('title', title);
            formData.append('description', description);
            formData.append('type', type);
            
            result = await uploadContentWithFile(formData);
        } else {
            // Upload without file (metadata only)
            const contentData = {
                semester: currentSemester,
                subject: subjectKey,
                category: tabName, // Changed from 'tab' to 'category'
                title: title,
                description: description,
                type: type,
                size: manualSize || 'Unknown size'
            };
            
            result = await addContentToDatabase(contentData);
        }
        
        // Close modal
        closeAddContentModal();
        
        // Refresh the current tab display
        await showTab(tabName);
        
        // Show success message
        const fileUploadedText = fileInput.files && fileInput.files[0] ? ' and file uploaded' : '';
        showSuccessNotification(`${type} added successfully${fileUploadedText} to ${tabName.replace('-', ' ')}!`);
        
    } catch (error) {
        console.error('Error saving content:', error);
        alert('Failed to save content. Please try again.');
        
        // Restore button state
        const saveButton = document.querySelector('.save-btn');
        if (saveButton) {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }
    }
}

// Upload content with file
async function uploadContentWithFile(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/content/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: formData // Don't set Content-Type header, let browser set it for FormData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            return result;
        }
        throw new Error(result.message || 'Failed to upload content');
    } catch (error) {
        console.error('Error uploading content with file:', error);
        throw error;
    }
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to get current semester
function getCurrentSemester() {
    const selectedSemesterInfo = document.getElementById('selected-semester-info');
    if (selectedSemesterInfo && selectedSemesterInfo.textContent) {
        const match = selectedSemesterInfo.textContent.match(/(\d+)/);
        return match ? parseInt(match[1]) : 1;
    }
    return 1; // Default to semester 1
}

// Show success notification
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Update showTab function to use MongoDB content
async function showTab(tabName) {
    console.log('showTab called with:', tabName);
    
    const tabButtons = document.querySelectorAll('.tab-button');
    const modalContentArea = document.getElementById('modal-content-area');
    
    if (!modalContentArea) {
        console.error('modal-content-area not found');
        return;
    }
    
    console.log('Found', tabButtons.length, 'tab buttons');
    
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Find and activate the clicked tab
    tabButtons.forEach(button => {
        if (button.textContent.toLowerCase().includes(tabName.replace('-', ' '))) {
            button.classList.add('active');
        }
    });
    
    // Get current subject key from modal title
    const modalTitle = document.getElementById('modal-subject-title').textContent;
    const currentSubjectKey = findSubjectKeyByTitle(modalTitle);
    const currentSemester = getCurrentSemester();
    
    // Show loading state
    modalContentArea.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #666;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>Loading ${tabName.replace('-', ' ')}...</p>
        </div>
    `;
    
    try {
        // Load content from MongoDB
        const content = await loadContentFromDatabase(currentSemester, currentSubjectKey, tabName);
        
        if (content && content.length > 0) {
            displayTabContent(tabName, content);
        } else {
            // Check if we have real content for this subject and tab
            const realContent = notesDatabase[currentSubjectKey] && notesDatabase[currentSubjectKey][tabName];
            if (realContent) {
                displayRealContent(tabName, realContent);
            } else {
                displayTabContent(tabName, sampleContentStructure[tabName] || []);
            }
        }
    } catch (error) {
        console.error('Error loading tab content:', error);
        modalContentArea.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #ff6b6b;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Error loading content. Please try again.</p>
                <button class="add-content-btn" onclick="showTab('${tabName}')" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Find subject key by title
function findSubjectKeyByTitle(title) {
    for (let semesterNum in bscCSData) {
        const subjects = bscCSData[semesterNum].subjects;
        for (let key in subjects) {
            if (subjects[key].title === title) {
                return key;
            }
        }
    }
    return null;
}

// Display tab content (updated for MongoDB format)
function displayTabContent(tabName, items) {
    if (!items || items.length === 0) {
        modalContentArea.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <div class="tab-header">
                    <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>No ${tabName.replace('-', ' ')} available yet.</p>
                    <p style="font-size: 0.9rem;">Upload files directly below:</p>
                </div>
                
                <!-- Simple File Upload Section -->
                <div class="simple-upload-section" style="margin-top: 2rem;">
                    <h3>📁 Upload ${tabName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    
                    <!-- Title Input Field -->
                    <div style="margin: 20px auto; max-width: 400px;">
                        <label for="upload-title-${tabName}" style="display: block; color: #fff; font-weight: 500; margin-bottom: 8px;">
                            📝 Topic/Title:
                        </label>
                        <input type="text" id="upload-title-${tabName}" 
                               placeholder="e.g., Introduction to Programming, Data Structures Chapter 1, etc."
                               style="
                                   width: 100%;
                                   padding: 12px;
                                   border: 1px solid #555;
                                   border-radius: 8px;
                                   background: #2a2a2a;
                                   color: #fff;
                                   font-size: 14px;
                                   box-sizing: border-box;
                               ">
                        <small style="color: #888; font-size: 12px;">Enter what this file is about</small>
                    </div>
                    
                    <div class="upload-area" style="
                        border: 2px dashed #555;
                        border-radius: 12px;
                        padding: 40px;
                        margin: 20px auto;
                        max-width: 400px;
                        background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                        cursor: pointer;
                        transition: all 0.3s ease;
                    " onclick="handleUploadClick('${tabName}')">
                        <input type="file" id="simple-file-input-${tabName}" 
                               accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar" 
                               style="display: none;">
                        <div>
                            <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #666; margin-bottom: 15px;"></i>
                            <h4 style="color: #fff; margin-bottom: 10px;">Click here to select file</h4>
                            <p id="file-info-${tabName}" style="color: #888; font-size: 0.9rem;">No file selected</p>
                            <small style="color: #888;">Max 100MB | PDF, DOC, PPT, Images, Videos, etc.</small>
                        </div>
                    </div>
                    
                    <div id="upload-status-${tabName}" style="
                        margin: 15px 0;
                        padding: 10px;
                        background: #333;
                        border-radius: 8px;
                        color: #fff;
                    ">Ready to upload</div>
                </div>
            </div>
        `;
        
        // Add event listeners for this specific tab
        setupSimpleUpload(tabName);
        return;
    }

    let content = `
        <div class="tab-content-header">
            <h3>${tabName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
            <button class="add-content-btn-small" onclick="scrollToUploadSection('${tabName}')" title="Upload new ${tabName.replace('-', ' ')}">
                <i class="fas fa-plus"></i> Upload New
            </button>
        </div>
    `;
    
    items.forEach(item => {
        // Format date for display
        const itemDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 
                        item.date || new Date().toLocaleDateString();
        
        // Get appropriate icon for file type
        const getFileIcon = (type) => {
            const iconMap = {
                'PDF': 'fa-file-pdf',
                'DOC': 'fa-file-word',
                'PPT': 'fa-file-powerpoint', 
                'VIDEO': 'fa-file-video',
                'AUDIO': 'fa-file-audio',
                'LINK': 'fa-link',
                'TEXT': 'fa-file-text'
            };
            return iconMap[type.toUpperCase()] || 'fa-file';
        };
        
        const deleteButtonHtml = adminToken ? `
            <button class="delete-btn" onclick="deleteContent('${item._id || item.id}', '${item.title}')" 
                    title="Delete this file">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        ` : '';
        
        content += `
            <div class="content-item animate-in" id="content-item-${item._id || item.id}">
                <div class="content-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                    </div>
                    ${deleteButtonHtml}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; font-size: 0.8rem; color: #888;">
                    <span><i class="fas ${getFileIcon(item.type)}"></i> ${item.type} • ${item.size}</span>
                    <span><i class="fas fa-calendar"></i> ${itemDate}</span>
                </div>
                <div class="content-actions" style="margin-top: 10px; display: flex; gap: 10px;">
                    ${item.fileUrl ? 
                        `<button class="download-btn" onclick="downloadFile('${item.fileUrl}', '${item.originalFileName || item.title}')" style="
                            background: #28a745;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            padding: 8px 16px;
                            cursor: pointer;
                            font-size: 14px;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                            transition: all 0.3s ease;
                        ">
                            <i class="fas fa-download"></i> Download File
                        </button>` :
                        `<button class="download-btn" onclick="downloadItem('${item.title}', '${item.type}')" style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            padding: 8px 16px;
                            cursor: pointer;
                            font-size: 14px;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                            opacity: 0.6;
                        ">
                            <i class="fas fa-info-circle"></i> No File Available
                        </button>`
                    }
                </div>
            </div>
        `;
    });
    
    // Add upload section at the end for adding more files (hidden by default)
    content += `
        <div class="upload-section-divider" id="upload-section-${tabName}" style="
            margin: 2rem 0;
            padding: 1rem 0;
            border-top: 1px solid #444;
            text-align: center;
            display: none;
        ">
            <h4 style="color: #888; margin-bottom: 1rem;">📁 Upload More Files</h4>
            
            <!-- Title Input Field -->
            <div style="margin: 20px auto; max-width: 400px;">
                <label for="upload-title-${tabName}" style="display: block; color: #fff; font-weight: 500; margin-bottom: 8px;">
                    📝 Topic/Title:
                </label>
                <input type="text" id="upload-title-${tabName}" 
                       placeholder="e.g., Introduction to Programming, Data Structures Chapter 1, etc."
                       style="
                           width: 100%;
                           padding: 12px;
                           border: 1px solid #555;
                           border-radius: 8px;
                           background: #2a2a2a;
                           color: #fff;
                           font-size: 14px;
                           box-sizing: border-box;
                       ">
                <small style="color: #888; font-size: 12px;">Enter what this file is about</small>
            </div>
            
            <div class="upload-area" style="
                border: 2px dashed #555;
                border-radius: 12px;
                padding: 30px;
                margin: 20px auto;
                max-width: 400px;
                background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                cursor: pointer;
                transition: all 0.3s ease;
            " onclick="handleUploadClick('${tabName}')">
                <input type="file" id="simple-file-input-${tabName}" 
                       accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar" 
                       style="display: none;">
                <div>
                    <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: #666; margin-bottom: 10px;"></i>
                    <h4 style="color: #fff; margin-bottom: 8px;">Click here to select file</h4>
                    <p id="file-info-${tabName}" style="color: #888; font-size: 0.9rem;">No file selected</p>
                    <small style="color: #888;">Max 100MB | PDF, DOC, PPT, Images, Videos, etc.</small>
                </div>
            </div>
            
            <div id="upload-status-${tabName}" style="
                margin: 15px 0;
                padding: 10px;
                background: #333;
                border-radius: 8px;
                color: #fff;
            ">Ready to upload</div>
            
            <button onclick="hideUploadSection('${tabName}')" style="
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 10px;
            ">
                <i class="fas fa-times"></i> Cancel
            </button>
        </div>
    `;
    
    modalContentArea.innerHTML = content;
    
    // Set up upload functionality for this tab
    setupSimpleUpload(tabName);
    
    // Trigger animations for new content
    setTimeout(() => {
        const contentItems = modalContentArea.querySelectorAll('.content-item');
        contentItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('animate-in');
            }, index * 100);
        });
    }, 50);
}

// Display real content (for subjects that have detailed content)
function displayRealContent(tabName, contentArray) {
    let content = '';
    contentArray.forEach((item, index) => {
        content += `
            <div class="content-item real-content-item">
                <h4>${item.title}</h4>
                <div class="content-body">
                    ${item.content}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; font-size: 0.8rem; color: #888;">
                    <span><i class="fas fa-user"></i> ${item.author}</span>
                    <span><i class="fas fa-calendar"></i> ${item.date}</span>
                </div>
            </div>
        `;
    });
    
    modalContentArea.innerHTML = content;
}

// Download actual file
function downloadFile(fileUrl, fileName) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download item (placeholder function for items without files)
function downloadItem(title, type) {
    // In a real implementation, this would trigger an actual download
    alert(`No file available for: ${title} (${type})\n\nThis content was added without a file upload.`);
}

// Handle upload click with title validation
function handleUploadClick(tabName) {
    // Check admin authentication first
    if (!adminToken) {
        const uploadStatus = document.getElementById(`upload-status-${tabName}`);
        uploadStatus.textContent = '🔒 Admin login required to upload files';
        uploadStatus.style.background = '#dc3545';
        uploadStatus.style.color = '#fff';
        
        // Just show the message, don't redirect
        return;
    }
    
    const titleInput = document.getElementById(`upload-title-${tabName}`);
    const uploadStatus = document.getElementById(`upload-status-${tabName}`);
    
    if (!titleInput.value.trim()) {
        uploadStatus.textContent = '⚠️ Please enter a topic/title first';
        uploadStatus.style.background = '#ffc107';
        uploadStatus.style.color = '#000';
        titleInput.focus();
        titleInput.style.borderColor = '#ffc107';
        
        // Reset warning after 3 seconds
        setTimeout(() => {
            uploadStatus.textContent = 'Ready to upload';
            uploadStatus.style.background = '#333';
            uploadStatus.style.color = '#fff';
            titleInput.style.borderColor = '#555';
        }, 3000);
        return;
    }
    
    // Title is provided, proceed with file selection
    document.getElementById(`simple-file-input-${tabName}`).click();
}

// Simple upload function - just like the test page
function setupSimpleUpload(tabName) {
    const fileInput = document.getElementById(`simple-file-input-${tabName}`);
    const fileInfo = document.getElementById(`file-info-${tabName}`);
    const uploadStatus = document.getElementById(`upload-status-${tabName}`);
    const titleInput = document.getElementById(`upload-title-${tabName}`);
    const uploadArea = document.querySelector('.upload-area');
    
    if (!fileInput || !fileInfo || !uploadStatus || !titleInput) {
        console.error('Simple upload elements not found for tab:', tabName);
        return;
    }
    
    console.log('✅ Setting up simple upload for:', tabName);
    
    // File selection handler
    fileInput.addEventListener('change', async function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            const title = titleInput.value.trim();
            
            console.log('✅ File selected:', file.name, file.size, 'Title:', title);
            
            // Update UI
            fileInfo.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            uploadStatus.textContent = 'Uploading...';
            uploadStatus.style.background = '#007bff';
            uploadArea.style.borderColor = '#28a745';
            uploadArea.style.background = 'linear-gradient(135deg, #1a2e1a, #2a4a2a)';
            
            // Upload file with custom title
            try {
                const result = await uploadFileDirectly(file, tabName, title);
                
                if (result.success) {
                    uploadStatus.textContent = '✅ Upload successful!';
                    uploadStatus.style.background = '#28a745';
                    
                    // Clear the form
                    titleInput.value = '';
                    fileInput.value = '';
                    
                    // Refresh the tab content after successful upload
                    setTimeout(() => {
                        showTab(tabName);
                    }, 1000);
                } else {
                    throw new Error(result.message || 'Upload failed');
                }
            } catch (error) {
                console.error('Upload error:', error);
                
                let errorMessage = '❌ Upload failed: ';
                if (error.message.includes('Failed to fetch')) {
                    errorMessage += 'Cannot connect to server. Please check if the server is running.';
                } else if (error.message.includes('Authentication')) {
                    errorMessage += error.message;
                    // Just show the message, don't redirect
                } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    errorMessage += 'Please login as admin first.';
                    // Just show the message, don't redirect
                } else if (error.message.includes('413') || error.message.includes('too large')) {
                    errorMessage += 'File is too large (max 100MB).';
                } else {
                    errorMessage += error.message || 'Please try again.';
                }
                
                uploadStatus.textContent = errorMessage;
                uploadStatus.style.background = '#dc3545';
                
                // Reset after error
                setTimeout(() => {
                    fileInput.value = '';
                    fileInfo.textContent = 'No file selected';
                    uploadStatus.textContent = 'Ready to upload';
                    uploadStatus.style.background = '#333';
                    uploadArea.style.borderColor = '#555';
                    uploadArea.style.background = 'linear-gradient(135deg, #1a1a1a, #2a2a2a)';
                }, 3000);
            }
        }
    });
}

// Direct file upload function with custom title
async function uploadFileDirectly(file, tabName, customTitle) {
    // Check admin authentication
    if (!adminToken) {
        throw new Error('Admin authentication required. Please login as admin first.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('semester', getCurrentSemester());
    formData.append('subject', findSubjectKeyByTitle(document.getElementById('modal-subject-title').textContent));
    formData.append('category', tabName); // Changed from 'tab' to 'category'
    formData.append('title', customTitle || file.name); // Use custom title or filename
    formData.append('description', `${customTitle} - ${file.name}`);
    formData.append('type', getFileType(file.name));
    
    try {
        console.log('🚀 Uploading file with admin token:', !!adminToken);
        
        const response = await fetch(`${API_BASE_URL}/content/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: formData
        });
        
        console.log('📡 Upload response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                adminLogout();
                throw new Error('Authentication expired. Please login again.');
            } else if (response.status === 413) {
                throw new Error('File too large. Maximum size is 100MB.');
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        }
        
        const result = await response.json();
        console.log('✅ Upload result:', result);
        
        return result;
    } catch (error) {
        console.error('Direct upload error:', error);
        
        // Provide specific error messages
        if (error.message.includes('Failed to fetch')) {
            return { success: false, message: 'Cannot connect to server. Please check if the server is running on http://localhost:5000' };
        } else if (error.message.includes('Authentication')) {
            return { success: false, message: error.message };
        } else {
            return { success: false, message: error.message };
        }
    }
}

// Helper function to get file type based on extension
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const typeMap = {
        'pdf': 'PDF',
        'doc': 'DOC', 'docx': 'DOC',
        'ppt': 'PPT', 'pptx': 'PPT',
        'txt': 'TEXT',
        'jpg': 'IMAGE', 'jpeg': 'IMAGE', 'png': 'IMAGE', 'gif': 'IMAGE',
        'mp4': 'VIDEO',
        'mp3': 'AUDIO',
        'zip': 'ZIP', 'rar': 'ZIP'
    };
    return typeMap[ext] || 'FILE';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('EduHub loaded successfully!');
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Register Service Worker for offline functionality
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }

    // Animation Controller for smooth transitions
    initAnimations();
});

// Smooth Animation System
function initAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animate-in')) {
                animateElement(entry.target);
            }
        });
    }, observerOptions);

    // Animate element with stagger effect
    function animateElement(element) {
        if (element.classList.contains('semester-card') || 
            element.classList.contains('resource-card') || 
            element.classList.contains('feature')) {
            
            const siblings = Array.from(element.parentElement.children);
            const index = siblings.indexOf(element);
            
            setTimeout(() => {
                element.classList.add('animate-in');
            }, index * 100);
        } else {
            element.classList.add('animate-in');
        }
    }

    // Observe elements for animation
    function observeElements() {
        const selectors = ['.section-title', '.semester-card', '.resource-card', '.feature', '.content-item'];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => observer.observe(el));
        });
    }

    // Initial observation
    observeElements();

    // Enhanced modal animations
    const originalShowModal = window.showModal;
    const originalCloseModal = window.closeModal;

    if (originalShowModal) {
        window.showModal = function() {
            const modal = document.getElementById('subject-modal');
            if (modal) {
                modal.style.display = 'block';
                setTimeout(() => modal.classList.add('show'), 10);
            }
            originalShowModal.apply(this, arguments);
        };
    }

    if (originalCloseModal) {
        window.closeModal = function() {
            const modal = document.getElementById('subject-modal');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.style.display = 'none', 400);
                return;
            }
            originalCloseModal.apply(this, arguments);
        };
    }

    // Re-observe when new content loads
    const originalLoadSubjects = window.loadSubjects;
    if (originalLoadSubjects) {
        window.loadSubjects = function() {
            originalLoadSubjects.apply(this, arguments);
            setTimeout(() => {
                document.querySelectorAll('.subject-card').forEach(el => observer.observe(el));
            }, 100);
        };
    }
}

// Delete content function
async function deleteContent(contentId, titleOrTabName, title) {
    // Handle different parameter patterns for backward compatibility
    const finalTitle = title || titleOrTabName;
    
    // Check admin authentication
    if (!adminToken) {
        alert('Please login as admin first');
        return;
    }
    
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete "${finalTitle}"?\n\nThis action cannot be undone.`);
    
    if (!confirmed) {
        return;
    }
    
    try {
        // Show loading state
        const contentItem = document.getElementById(`content-item-${contentId}`);
        if (contentItem) {
            contentItem.style.opacity = '0.5';
            contentItem.style.pointerEvents = 'none';
        }
        
        console.log(`🗑️ Deleting content ID: ${contentId}`);
        
        // Try to delete from server with admin authentication
        const response = await fetch(`${API_BASE_URL}/content/${contentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        console.log('Delete response:', result);
        
        if (result.success) {
            // Remove the item from DOM with animation
            if (contentItem) {
                contentItem.style.transform = 'translateX(-100%)';
                contentItem.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    contentItem.remove();
                    
                    // Check if this was the last item, refresh the current tab instead of page reload
                    const remainingItems = document.querySelectorAll('.content-item');
                    if (remainingItems.length === 0) {
                        // Get current active tab and refresh it instead of reloading page
                        const activeTab = document.querySelector('.tab-button.active');
                        if (activeTab) {
                            const tabText = activeTab.textContent.toLowerCase().trim();
                            let tabName = '';
                            
                            // Map button text to tab names
                            if (tabText.includes('teacher')) tabName = 'teacher-notes';
                            else if (tabText.includes('student')) tabName = 'student-notes';
                            else if (tabText.includes('resource')) tabName = 'resources';
                            else if (tabText.includes('assignment')) tabName = 'assignments';
                            else if (tabText.includes('pyq') || tabText.includes('previous')) tabName = 'pyqs';
                            else if (tabText.includes('syllabus')) tabName = 'syllabus';
                            
                            console.log('Last item deleted, refreshing tab:', tabName);
                            if (tabName) {
                                showTab(tabName); // Refresh current tab instead of page reload
                            }
                        }
                    }
                }, 300);
            }
            
            // Show success notification
            showSuccessNotification(`"${finalTitle}" deleted successfully!`);
            
        } else {
            throw new Error(result.message || 'Delete failed');
        }
        
    } catch (error) {
        console.error('Error deleting content:', error);
        
        // Restore the item state
        const contentItem = document.getElementById(`content-item-${contentId}`);
        if (contentItem) {
            contentItem.style.opacity = '1';
            contentItem.style.pointerEvents = 'auto';
        }
        
        // Show more specific error message
        let errorMessage = error.message;
        if (error.message.includes('fetch')) {
            errorMessage = 'Server connection failed. Please check if the server is running.';
        } else if (error.message.includes('Not Found') || error.message.includes('404')) {
            errorMessage = 'File not found. It may have already been deleted.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMessage = 'Authentication failed. Please login again.';
        }
        
        alert(`Failed to delete "${finalTitle}": ${errorMessage}`);
    }
}

// Scroll to upload section when "Upload New" button is clicked
function scrollToUploadSection(tabName) {
    const uploadSection = document.getElementById(`upload-section-${tabName}`);
    if (uploadSection) {
        // Show the upload section with animation
        uploadSection.style.display = 'block';
        uploadSection.style.opacity = '0';
        uploadSection.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            uploadSection.style.transition = 'all 0.3s ease';
            uploadSection.style.opacity = '1';
            uploadSection.style.transform = 'translateY(0)';
            
            // Scroll to it
            uploadSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
            
            // Focus on title input
            const titleInput = document.getElementById(`upload-title-${tabName}`);
            if (titleInput) {
                setTimeout(() => {
                    titleInput.focus();
                }, 500);
            }
        }, 10);
    }
}

// Hide upload section when cancel button is clicked
function hideUploadSection(tabName) {
    const uploadSection = document.getElementById(`upload-section-${tabName}`);
    if (uploadSection) {
        uploadSection.style.transition = 'all 0.3s ease';
        uploadSection.style.opacity = '0';
        uploadSection.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            uploadSection.style.display = 'none';
            
            // Clear the form
            const titleInput = document.getElementById(`upload-title-${tabName}`);
            const fileInput = document.getElementById(`simple-file-input-${tabName}`);
            const fileInfo = document.getElementById(`file-info-${tabName}`);
            const uploadStatus = document.getElementById(`upload-status-${tabName}`);
            
            if (titleInput) titleInput.value = '';
            if (fileInput) fileInput.value = '';
            if (fileInfo) fileInfo.textContent = 'No file selected';
            if (uploadStatus) {
                uploadStatus.textContent = 'Ready to upload';
                uploadStatus.style.background = '#333';
                uploadStatus.style.color = '#fff';
            }
        }, 300);
    }
}

// Fallback delete function for JSON storage
async function deleteFromJsonStorage(contentId) {
    try {
        // This would need to be implemented on the server side for JSON storage
        // For now, return a simple response
        return {
            success: true,
            message: 'Content deleted from local storage'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

// Quick Access Resource Functions
// Show All Assignments with Year Selection
function showAllAssignments() {
    console.log('🎯 showAllAssignments called');
    
    // Remove any existing modals first
    const existingModal = document.querySelector('.year-selection-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add styles first if they don't exist
    if (!document.getElementById('year-modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'year-modal-styles';
        styles.textContent = `
            .year-selection-modal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 99999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                animation: fadeIn 0.3s ease !important;
                background: rgba(0, 0, 0, 0.8) !important;
                backdrop-filter: blur(5px) !important;
            }
            
            .year-modal-content {
                position: relative !important;
                background: linear-gradient(135deg, #1a1a1a, #2a2a2a) !important;
                border-radius: 15px !important;
                padding: 2rem !important;
                max-width: 500px !important;
                width: 90% !important;
                border: 1px solid #444 !important;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
                animation: slideIn 0.3s ease !important;
                z-index: 99999 !important;
            }
            
            .year-modal-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 1.5rem !important;
                padding-bottom: 1rem !important;
                border-bottom: 1px solid #444 !important;
            }
            
            .year-modal-header h2 {
                color: #fff !important;
                margin: 0 !important;
                font-size: 1.5rem !important;
            }
            
            .year-modal-close {
                background: none !important;
                border: none !important;
                color: #888 !important;
                font-size: 2rem !important;
                cursor: pointer !important;
                padding: 0 !important;
                width: 40px !important;
                height: 40px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 50% !important;
                transition: all 0.3s ease !important;
            }
            
            .year-modal-close:hover {
                background: #333 !important;
                color: #fff !important;
            }
            
            .year-modal-body p {
                color: #ccc !important;
                margin-bottom: 2rem !important;
                text-align: center !important;
            }
            
            .year-options {
                display: flex !important;
                flex-direction: column !important;
                gap: 1rem !important;
            }
            
            .year-btn {
                background: linear-gradient(135deg, #2a2a2a, #1a1a1a) !important;
                border: 1px solid #444 !important;
                border-radius: 10px !important;
                padding: 1.5rem !important;
                color: #fff !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                display: flex !important;
                align-items: center !important;
                gap: 1rem !important;
                text-align: left !important;
            }
            
            .year-btn:hover {
                background: linear-gradient(135deg, #3a3a3a, #2a2a2a) !important;
                border-color: #007bff !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 5px 15px rgba(0, 123, 255, 0.2) !important;
            }
            
            .year-btn i {
                font-size: 2rem !important;
                color: #007bff !important;
                min-width: 50px !important;
            }
            
            .year-btn span {
                font-size: 1.2rem !important;
                font-weight: 600 !important;
                flex: 1 !important;
            }
            
            .year-btn small {
                color: #888 !important;
                font-size: 0.9rem !important;
                display: block !important;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes slideIn {
                from { 
                    opacity: 0;
                    transform: translateY(-20px) scale(0.9);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;
        document.head.appendChild(styles);
        console.log('✅ Year modal styles added with !important');
    }
    
    // Create year selection modal with simpler structure
    const yearModal = document.createElement('div');
    yearModal.className = 'year-selection-modal';
    yearModal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 99999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(0, 0, 0, 0.8) !important;
    `;
    
    yearModal.innerHTML = `
        <div class="year-modal-content">
            <div class="year-modal-header">
                <h2>📋 Select Academic Year</h2>
                <button class="year-modal-close" onclick="closeYearModal()">&times;</button>
            </div>
            <div class="year-modal-body">
                <p>Choose the academic year to view assignments and PYQs:</p>
                <div class="year-options">
                    <button class="year-btn" onclick="showAssignmentsBySemester(1)">
                        <i class="fas fa-graduation-cap"></i>
                        <div style="flex: 1;">
                            <span>First Year</span>
                            <small>Semester 1 & 2</small>
                        </div>
                    </button>
                    <button class="year-btn" onclick="showAssignmentsBySemester(3)">
                        <i class="fas fa-graduation-cap"></i>
                        <div style="flex: 1;">
                            <span>Second Year</span>
                            <small>Semester 3 & 4</small>
                        </div>
                    </button>
                    <button class="year-btn" onclick="showAssignmentsBySemester(5)">
                        <i class="fas fa-graduation-cap"></i>
                        <div style="flex: 1;">
                            <span>Third Year</span>
                            <small>Semester 5 & 6</small>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    console.log('📦 Modal HTML created');
    
    // Add click event to overlay for closing
    yearModal.addEventListener('click', function(e) {
        if (e.target === yearModal) {
            closeYearModal();
        }
    });
    
    document.body.appendChild(yearModal);
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Modal added to DOM and overflow hidden');
    
    // Force display and check if modal is visible
    setTimeout(() => {
        const modalElement = document.querySelector('.year-selection-modal');
        if (modalElement) {
            console.log('✅ Modal element found in DOM');
            console.log('Modal computed style display:', window.getComputedStyle(modalElement).display);
            console.log('Modal computed style visibility:', window.getComputedStyle(modalElement).visibility);
            console.log('Modal computed style z-index:', window.getComputedStyle(modalElement).zIndex);
        } else {
            console.error('❌ Modal element NOT found in DOM');
        }
    }, 100);
}

// Close year selection modal
function closeYearModal() {
    console.log('🔴 closeYearModal called');
    const yearModal = document.querySelector('.year-selection-modal');
    if (yearModal) {
        console.log('✅ Found year modal, removing...');
        yearModal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            yearModal.remove();
            document.body.style.overflow = 'auto';
            console.log('✅ Year modal removed and overflow restored');
        }, 300);
    } else {
        console.error('❌ Year modal not found');
    }
}

// Show assignments by semester
async function showAssignmentsBySemester(startSemester) {
    console.log('🎯 showAssignmentsBySemester called with semester:', startSemester);
    
    // Close the year modal first
    closeYearModal();
    
    // Wait a bit for the year modal to close
    setTimeout(() => {
        console.log('📅 Creating assignments modal for semester:', startSemester);
        
        // Determine the year name and semesters
        let yearName, semesters;
        if (startSemester === 1) {
            yearName = 'First Year';
            semesters = [1, 2];
        } else if (startSemester === 3) {
            yearName = 'Second Year';
            semesters = [3, 4];
        } else if (startSemester === 5) {
            yearName = 'Third Year';
            semesters = [5, 6];
        }
        
        // Add assignments modal styles if they don't exist
        if (!document.getElementById('assignments-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'assignments-modal-styles';
            styles.textContent = `
                .assignments-modal {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    z-index: 99999 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    animation: fadeIn 0.3s ease !important;
                    background: rgba(0, 0, 0, 0.8) !important;
                    backdrop-filter: blur(5px) !important;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                
                @keyframes slideIn {
                    from { 
                        opacity: 0; 
                        transform: translateY(-50px) scale(0.95); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                }
                
                .assignments-modal-content {
                    position: relative !important;
                    background: linear-gradient(135deg, #1a1a1a, #2a2a2a) !important;
                    border-radius: 15px !important;
                    max-width: 800px !important;
                    width: 95% !important;
                    max-height: 90vh !important;
                    border: 1px solid #444 !important;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
                    animation: slideIn 0.3s ease !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                
                .assignments-modal-header {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    padding: 1.5rem 2rem !important;
                    border-bottom: 1px solid #444 !important;
                    background: #1a1a1a !important;
                }
                
                .assignments-modal-header h2 {
                    color: #fff !important;
                    margin: 0 !important;
                    font-size: 1.5rem !important;
                }
                
                .assignments-modal-close {
                    background: none !important;
                    border: none !important;
                    color: #888 !important;
                    font-size: 2rem !important;
                    cursor: pointer !important;
                    padding: 0 !important;
                    width: 40px !important;
                    height: 40px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border-radius: 50% !important;
                    transition: all 0.3s ease !important;
                }
                
                .assignments-modal-close:hover {
                    background: #333 !important;
                    color: #fff !important;
                }
                
                .assignments-modal-body {
                    flex: 1 !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                
                .semester-tabs {
                    display: flex !important;
                    background: #2a2a2a !important;
                    border-bottom: 1px solid #444 !important;
                }
                
                .semester-tab {
                    flex: 1 !important;
                    background: none !important;
                    border: none !important;
                    color: #888 !important;
                    padding: 1rem !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    border-bottom: 3px solid transparent !important;
                }
                
                .semester-tab:hover {
                    background: #333 !important;
                    color: #fff !important;
                }
                
                .semester-tab.active {
                    color: #007bff !important;
                    border-bottom-color: #007bff !important;
                    background: #333 !important;
                }
                
                .assignments-content {
                    flex: 1 !important;
                    overflow-y: auto !important;
                    padding: 2rem !important;
                }
                
                .loading-assignments {
                    text-align: center !important;
                    color: #666 !important;
                    padding: 3rem !important;
                }
                
                .assignment-item {
                    background: #2a2a2a !important;
                    border: 1px solid #444 !important;
                    border-radius: 10px !important;
                    padding: 1.5rem !important;
                    margin-bottom: 1rem !important;
                    transition: all 0.3s ease !important;
                }
                
                .assignment-item:hover {
                    border-color: #007bff !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 5px 15px rgba(0, 123, 255, 0.1) !important;
                }
                
                .assignment-header {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: flex-start !important;
                    margin-bottom: 1rem !important;
                }
                
                .assignment-title {
                    color: #fff !important;
                    font-size: 1.2rem !important;
                    font-weight: 600 !important;
                    margin: 0 0 0.5rem 0 !important;
                }
                
                .assignment-subject {
                    color: #007bff !important;
                    font-size: 0.9rem !important;
                    font-weight: 500 !important;
                }
                
                .assignment-description {
                    color: #ccc !important;
                    margin-bottom: 1rem !important;
                    line-height: 1.5 !important;
                }
                
                .assignment-meta {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    font-size: 0.8rem !important;
                    color: #888 !important;
                    margin-bottom: 1rem !important;
                }
                
                .assignment-actions {
                    display: flex !important;
                    gap: 0.5rem !important;
                }
                
                .download-assignment-btn {
                    background: #28a745 !important;
                    color: white !important;
                    border: none !important;
                    border-radius: 6px !important;
                    padding: 8px 16px !important;
                    cursor: pointer !important;
                    font-size: 14px !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 5px !important;
                    transition: all 0.3s ease !important;
                }
                
                .download-assignment-btn:hover {
                    background: #218838 !important;
                    transform: translateY(-1px) !important;
                }
                
                .no-assignments {
                    text-align: center !important;
                    color: #666 !important;
                    padding: 3rem !important;
                }
                
                .no-assignments i {
                    font-size: 3rem !important;
                    margin-bottom: 1rem !important;
                    opacity: 0.5 !important;
                }
                
                .subject-section {
                    margin-bottom: 2rem !important;
                }
                
                .subject-section h3 {
                    color: #007bff !important;
                    margin-bottom: 1rem !important;
                    font-size: 1.3rem !important;
                }
            `;
            document.head.appendChild(styles);
            console.log('✅ Assignments modal styles added');
        }
        
        // Create assignments display modal
        const assignmentsModal = document.createElement('div');
        assignmentsModal.className = 'assignments-modal';
        assignmentsModal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 99999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: rgba(0, 0, 0, 0.8) !important;
        `;
        
        assignmentsModal.innerHTML = `
            <div class="assignments-modal-content">
                <div class="assignments-modal-header">
                    <h2>📋 ${yearName} - Assignments & PYQs</h2>
                    <button class="assignments-modal-close" onclick="closeAssignmentsModal()">&times;</button>
                </div>
                <div class="assignments-modal-body">
                    <div class="semester-tabs">
                        ${semesters.map(sem => `
                            <button class="semester-tab ${sem === startSemester ? 'active' : ''}" 
                                    onclick="loadSemesterAssignments(${sem})">
                                Semester ${sem}
                            </button>
                        `).join('')}
                    </div>
                    <div id="assignments-content" class="assignments-content">
                        <div class="loading-assignments">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p>Loading assignments and PYQs...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add click event to close when clicking outside
        assignmentsModal.addEventListener('click', function(e) {
            if (e.target === assignmentsModal) {
                closeAssignmentsModal();
            }
        });
        
        console.log('📦 Assignments modal HTML created');
        
        document.body.appendChild(assignmentsModal);
        document.body.style.overflow = 'hidden';
        
        console.log('✅ Assignments modal added to DOM');
        
        // Load initial semester assignments
        setTimeout(() => {
            loadSemesterAssignments(startSemester);
        }, 100);
        
    }, 400); // Wait for year modal to close
}

// Load assignments for specific semester
async function loadSemesterAssignments(semester) {
    console.log('📚 loadSemesterAssignments called for semester:', semester);
    
    // Update active tab
    const tabs = document.querySelectorAll('.semester-tab');
    console.log('🏷️ Found', tabs.length, 'semester tabs');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.includes(`Semester ${semester}`)) {
            tab.classList.add('active');
            console.log('✅ Activated tab for Semester', semester);
        }
    });
    
    const contentArea = document.getElementById('assignments-content');
    if (!contentArea) {
        console.error('❌ assignments-content area not found!');
        return;
    }
    
    console.log('📝 Setting loading state for assignments content');
    contentArea.innerHTML = `
        <div class="loading-assignments">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>Loading Semester ${semester} assignments and PYQs...</p>
        </div>
    `;
    
    try {
        console.log('🔄 Starting to load content from database for semester', semester);
        
        // Load assignments and PYQs for this semester
        const assignmentsPromise = loadContentFromDatabase(semester, null, 'assignments');
        const pyqsPromise = loadContentFromDatabase(semester, null, 'pyqs');
        
        const [assignments, pyqs] = await Promise.all([assignmentsPromise, pyqsPromise]);
        
        console.log('📋 Loaded assignments:', assignments.length);
        console.log('📝 Loaded PYQs:', pyqs.length);
        
        const allContent = [...assignments, ...pyqs];
        
        if (allContent.length === 0) {
            console.log('📭 No content found for semester', semester);
            contentArea.innerHTML = `
                <div class="no-assignments">
                    <i class="fas fa-folder-open"></i>
                    <h3>No assignments or PYQs found</h3>
                    <p>No assignments or previous year questions have been uploaded for Semester ${semester} yet.</p>
                </div>
            `;
            return;
        }
        
        console.log('📊 Grouping content by subject');
        // Group content by subject
        const groupedContent = {};
        allContent.forEach(item => {
            const subjectTitle = getSubjectTitleByKey(item.subject, semester);
            if (!groupedContent[subjectTitle]) {
                groupedContent[subjectTitle] = [];
            }
            groupedContent[subjectTitle].push(item);
        });
        
        let contentHTML = '';
        Object.keys(groupedContent).forEach(subjectTitle => {
            const items = groupedContent[subjectTitle];
            
            contentHTML += `
                <div class="subject-section">
                    <h3 style="color: #007bff; margin-bottom: 1rem; font-size: 1.3rem;">
                        📚 ${subjectTitle}
                    </h3>
                    ${items.map(item => `
                        <div class="assignment-item">
                            <div class="assignment-header">
                                <div>
                                    <h4 class="assignment-title">${item.title}</h4>
                                    <div class="assignment-subject">${item.category.toUpperCase()}</div>
                                </div>
                                ${adminToken ? `
                                    <button class="delete-btn" onclick="deleteContent('${item._id}', '${item.title}')" 
                                            title="Delete this item" style="
                                        background: #dc3545;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        padding: 6px 10px;
                                        cursor: pointer;
                                        font-size: 12px;
                                    ">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                ` : ''}
                            </div>
                            <div class="assignment-description">${item.description}</div>
                            <div class="assignment-meta">
                                <span><i class="fas fa-file"></i> ${item.type} • ${item.size}</span>
                                <span><i class="fas fa-calendar"></i> ${new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div class="assignment-actions">
                                ${item.fileUrl ? `
                                    <button class="download-assignment-btn" onclick="downloadFile('${item.fileUrl}', '${item.originalFileName || item.title}')">
                                        <i class="fas fa-download"></i> Download
                                    </button>
                                ` : `
                                    <button class="download-assignment-btn" style="background: #6c757d; opacity: 0.6;" onclick="downloadItem('${item.title}', '${item.type}')">
                                        <i class="fas fa-info-circle"></i> No File
                                    </button>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        });
        
        contentArea.innerHTML = contentHTML;
        
    } catch (error) {
        console.error('Error loading semester assignments:', error);
        contentArea.innerHTML = `
            <div class="no-assignments">
                <i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i>
                <h3>Error Loading Content</h3>
                <p>Failed to load assignments and PYQs for Semester ${semester}.</p>
                <button onclick="loadSemesterAssignments(${semester})" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 10px 20px;
                    cursor: pointer;
                    margin-top: 1rem;
                ">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Helper function to get subject title by key and semester
function getSubjectTitleByKey(subjectKey, semester) {
    for (let semesterNum in bscCSData) {
        if (parseInt(semesterNum) === semester) {
            const subjects = bscCSData[semesterNum].subjects;
            if (subjects[subjectKey]) {
                return subjects[subjectKey].title;
            }
        }
    }
    return subjectKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Close assignments modal
function closeAssignmentsModal() {
    console.log('🚪 Closing assignments modal');
    const assignmentsModal = document.querySelector('.assignments-modal');
    if (assignmentsModal) {
        console.log('📱 Assignments modal found, closing with animation');
        assignmentsModal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            assignmentsModal.remove();
            document.body.style.overflow = 'auto';
            console.log('✅ Assignments modal closed and removed');
        }, 300);
    } else {
        console.log('❌ Assignments modal not found');
    }
}

// Show All PYQs function (for the PYQs quick access button)
function showAllPYQs() {
    console.log('🎯 showAllPYQs called');
    
    // Remove any existing modals first
    const existingModal = document.querySelector('.pyqs-year-selection-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add styles first if they don't exist
    if (!document.getElementById('pyqs-modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'pyqs-modal-styles';
        styles.textContent = `
            .pyqs-year-selection-modal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 99999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                animation: fadeIn 0.3s ease !important;
                background: rgba(0, 0, 0, 0.8) !important;
                backdrop-filter: blur(5px) !important;
            }
            
            .pyqs-year-modal-content {
                position: relative !important;
                background: linear-gradient(135deg, #1a1a1a, #2a2a2a) !important;
                border-radius: 15px !important;
                padding: 2rem !important;
                max-width: 500px !important;
                width: 90% !important;
                border: 1px solid #444 !important;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
                animation: slideIn 0.3s ease !important;
                z-index: 99999 !important;
            }
            
            .pyqs-year-modal-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 1.5rem !important;
                padding-bottom: 1rem !important;
                border-bottom: 1px solid #444 !important;
            }
            
            .pyqs-year-modal-header h2 {
                color: #fff !important;
                margin: 0 !important;
                font-size: 1.5rem !important;
            }
            
            .pyqs-year-modal-close {
                background: none !important;
                border: none !important;
                color: #888 !important;
                font-size: 2rem !important;
                cursor: pointer !important;
                padding: 0 !important;
                width: 40px !important;
                height: 40px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 50% !important;
                transition: all 0.3s ease !important;
            }
            
            .pyqs-year-modal-close:hover {
                background: #333 !important;
                color: #fff !important;
            }
        `;
        document.head.appendChild(styles);
        console.log('✅ PYQs modal styles added');
    }
    
    // Create PYQs year selection modal
    const pyqsYearModal = document.createElement('div');
    pyqsYearModal.className = 'pyqs-year-selection-modal';
    pyqsYearModal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 99999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(0, 0, 0, 0.8) !important;
    `;
    
    pyqsYearModal.innerHTML = `
        <div class="pyqs-year-modal-content">
            <div class="pyqs-year-modal-header">
                <h2>📝 Select Academic Year - Previous Year Questions</h2>
                <button class="pyqs-year-modal-close" onclick="closePYQsYearModal()">&times;</button>
            </div>
            <div class="year-modal-body">
                <p style="color: #ccc; margin-bottom: 2rem; text-align: center;">Choose the academic year to view Previous Year Questions:</p>
                <div class="year-options">
                    <button class="year-btn" onclick="showPYQsBySemester(1)">
                        <i class="fas fa-graduation-cap"></i>
                        <div style="flex: 1;">
                            <span>First Year</span>
                            <small>Semester 1 & 2 PYQs</small>
                        </div>
                    </button>
                    <button class="year-btn" onclick="showPYQsBySemester(3)">
                        <i class="fas fa-graduation-cap"></i>
                        <div style="flex: 1;">
                            <span>Second Year</span>
                            <small>Semester 3 & 4 PYQs</small>
                        </div>
                    </button>
                    <button class="year-btn" onclick="showPYQsBySemester(5)">
                        <i class="fas fa-graduation-cap"></i>
                        <div style="flex: 1;">
                            <span>Third Year</span>
                            <small>Semester 5 & 6 PYQs</small>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add click event to overlay for closing
    pyqsYearModal.addEventListener('click', function(e) {
        if (e.target === pyqsYearModal) {
            closePYQsYearModal();
        }
    });
    
    document.body.appendChild(pyqsYearModal);
    document.body.style.overflow = 'hidden';
    
    console.log('✅ PYQs modal added to DOM');
}

// Close PYQs year selection modal
function closePYQsYearModal() {
    console.log('🔴 closePYQsYearModal called');
    const pyqsYearModal = document.querySelector('.pyqs-year-selection-modal');
    if (pyqsYearModal) {
        console.log('✅ Found PYQs year modal, removing...');
        pyqsYearModal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            pyqsYearModal.remove();
            document.body.style.overflow = 'auto';
            console.log('✅ PYQs year modal removed and overflow restored');
        }, 300);
    } else {
        console.error('❌ PYQs year modal not found');
    }
}

// Show PYQs by semester
async function showPYQsBySemester(startSemester) {
    console.log('🎯 showPYQsBySemester called with semester:', startSemester);
    
    // Close the year modal first
    closePYQsYearModal();
    
    // Wait a bit for the year modal to close
    setTimeout(() => {
        console.log('📝 Creating PYQs modal for semester:', startSemester);
        
        // Determine the year name and semesters
        let yearName, semesters;
        if (startSemester === 1) {
            yearName = 'First Year';
            semesters = [1, 2];
        } else if (startSemester === 3) {
            yearName = 'Second Year';
            semesters = [3, 4];
        } else if (startSemester === 5) {
            yearName = 'Third Year';
            semesters = [5, 6];
        }
        
        // Add PYQs display modal styles if they don't exist
        if (!document.getElementById('pyqs-display-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'pyqs-display-modal-styles';
            styles.textContent = `
                .pyqs-modal {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    z-index: 99999 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    animation: fadeIn 0.3s ease !important;
                    background: rgba(0, 0, 0, 0.8) !important;
                    backdrop-filter: blur(5px) !important;
                }
                
                .pyqs-modal-content {
                    position: relative !important;
                    background: linear-gradient(135deg, #1a1a1a, #2a2a2a) !important;
                    border-radius: 15px !important;
                    max-width: 800px !important;
                    width: 95% !important;
                    max-height: 90vh !important;
                    border: 1px solid #444 !important;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
                    animation: slideIn 0.3s ease !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                
                .pyqs-modal-header {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    padding: 1.5rem 2rem !important;
                    border-bottom: 1px solid #444 !important;
                    background: #1a1a1a !important;
                }
                
                .pyqs-modal-header h2 {
                    color: #fff !important;
                    margin: 0 !important;
                    font-size: 1.5rem !important;
                }
                
                .pyqs-modal-close {
                    background: none !important;
                    border: none !important;
                    color: #888 !important;
                    font-size: 2rem !important;
                    cursor: pointer !important;
                    padding: 0 !important;
                    width: 40px !important;
                    height: 40px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border-radius: 50% !important;
                    transition: all 0.3s ease !important;
                }
                
                .pyqs-modal-close:hover {
                    background: #333 !important;
                    color: #fff !important;
                }
                
                .pyqs-modal-body {
                    flex: 1 !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                
                .pyqs-semester-tabs {
                    display: flex !important;
                    background: #2a2a2a !important;
                    border-bottom: 1px solid #444 !important;
                }
                
                .pyqs-semester-tab {
                    flex: 1 !important;
                    background: none !important;
                    border: none !important;
                    color: #888 !important;
                    padding: 1rem !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    border-bottom: 3px solid transparent !important;
                }
                
                .pyqs-semester-tab:hover {
                    background: #333 !important;
                    color: #fff !important;
                }
                
                .pyqs-semester-tab.active {
                    color: #007bff !important;
                    border-bottom-color: #007bff !important;
                    background: #333 !important;
                }
                
                .pyqs-content {
                    flex: 1 !important;
                    overflow-y: auto !important;
                    padding: 2rem !important;
                }
                
                .loading-pyqs {
                    text-align: center !important;
                    color: #666 !important;
                    padding: 3rem !important;
                }
                
                .pyq-item {
                    background: #2a2a2a !important;
                    border: 1px solid #444 !important;
                    border-radius: 10px !important;
                    padding: 1.5rem !important;
                    margin-bottom: 1rem !important;
                    transition: all 0.3s ease !important;
                }
                
                .pyq-item:hover {
                    border-color: #007bff !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 5px 15px rgba(0, 123, 255, 0.1) !important;
                }
                
                .no-pyqs {
                    text-align: center !important;
                    color: #666 !important;
                    padding: 3rem !important;
                }
                
                .no-pyqs i {
                    font-size: 3rem !important;
                    margin-bottom: 1rem !important;
                    opacity: 0.5 !important;
                }
            `;
            document.head.appendChild(styles);
            console.log('✅ PYQs display modal styles added');
        }
        
        // Create PYQs display modal
        const pyqsModal = document.createElement('div');
        pyqsModal.className = 'pyqs-modal';
        pyqsModal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 99999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: rgba(0, 0, 0, 0.8) !important;
        `;
        
        pyqsModal.innerHTML = `
            <div class="pyqs-modal-content">
                <div class="pyqs-modal-header">
                    <h2>📝 ${yearName} - Previous Year Questions</h2>
                    <button class="pyqs-modal-close" onclick="closePYQsModal()">&times;</button>
                </div>
                <div class="pyqs-modal-body">
                    <div class="pyqs-semester-tabs">
                        ${semesters.map(sem => `
                            <button class="pyqs-semester-tab ${sem === startSemester ? 'active' : ''}" 
                                    onclick="loadSemesterPYQs(${sem})">
                                Semester ${sem}
                            </button>
                        `).join('')}
                    </div>
                    <div id="pyqs-content" class="pyqs-content">
                        <div class="loading-pyqs">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p>Loading Previous Year Questions...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add click event to close when clicking outside
        pyqsModal.addEventListener('click', function(e) {
            if (e.target === pyqsModal) {
                closePYQsModal();
            }
        });
        
        console.log('📦 PYQs modal HTML created');
        
        document.body.appendChild(pyqsModal);
        document.body.style.overflow = 'hidden';
        
        console.log('✅ PYQs modal added to DOM');
        
        // Load initial semester PYQs
        setTimeout(() => {
            loadSemesterPYQs(startSemester);
        }, 100);
        
    }, 400); // Wait for year modal to close
}

// Close PYQs modal
function closePYQsModal() {
    console.log('🚪 Closing PYQs modal');
    const pyqsModal = document.querySelector('.pyqs-modal');
    if (pyqsModal) {
        console.log('📱 PYQs modal found, closing with animation');
        pyqsModal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            pyqsModal.remove();
            document.body.style.overflow = 'auto';
            console.log('✅ PYQs modal closed and removed');
        }, 300);
    } else {
        console.log('❌ PYQs modal not found');
    }
}

// Load PYQs for specific semester
async function loadSemesterPYQs(semester) {
    console.log('📚 loadSemesterPYQs called for semester:', semester);
    
    // Update active tab
    const tabs = document.querySelectorAll('.pyqs-semester-tab');
    console.log('🏷️ Found', tabs.length, 'PYQs semester tabs');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.includes(`Semester ${semester}`)) {
            tab.classList.add('active');
            console.log('✅ Activated PYQs tab for Semester', semester);
        }
    });
    
    const contentArea = document.getElementById('pyqs-content');
    if (!contentArea) {
        console.error('❌ pyqs-content area not found!');
        return;
    }
    
    console.log('📝 Setting loading state for PYQs content');
    contentArea.innerHTML = `
        <div class="loading-pyqs">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>Loading Semester ${semester} Previous Year Questions...</p>
        </div>
    `;
    
    try {
        console.log('🔄 Starting to load PYQs from database for semester', semester);
        
        // Load only PYQs for this semester
        const pyqs = await loadContentFromDatabase(semester, null, 'pyqs');
        
        console.log('📝 Loaded PYQs:', pyqs.length);
        
        if (pyqs.length === 0) {
            console.log('📭 No PYQs found for semester', semester);
            contentArea.innerHTML = `
                <div class="no-pyqs">
                    <i class="fas fa-file-alt"></i>
                    <h3>No Previous Year Questions found</h3>
                    <p>No Previous Year Questions have been uploaded for Semester ${semester} yet.</p>
                </div>
            `;
            return;
        }
        
        console.log('📊 Grouping PYQs by subject');
        // Group content by subject
        const contentBySubject = {};
        pyqs.forEach(item => {
            const subject = item.subject || 'General';
            if (!contentBySubject[subject]) {
                contentBySubject[subject] = [];
            }
            contentBySubject[subject].push(item);
        });
        
        let contentHTML = '';
        Object.keys(contentBySubject).forEach(subject => {
            const subjectTitle = getSubjectTitleByKey(subject, semester) || subject;
            
            contentHTML += `
                <div class="subject-section">
                    <h3>📚 ${subjectTitle}</h3>
                    <div class="subject-content">
            `;
            
            contentBySubject[subject].forEach(item => {
                const itemDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 
                                item.date || new Date().toLocaleDateString();
                
                const deleteButtonHtml = adminToken ? `
                    <button class="delete-btn" onclick="deleteContent('${item._id || item.id}', '${item.title}')" 
                            title="Delete this PYQ">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                ` : '';
                
                contentHTML += `
                    <div class="pyq-item" id="content-item-${item._id || item.id}">
                        <div class="assignment-header">
                            <div>
                                <h4 class="assignment-title">${item.title}</h4>
                                <p class="assignment-subject">${subjectTitle}</p>
                            </div>
                            ${deleteButtonHtml}
                        </div>
                        <p class="assignment-description">${item.description}</p>
                        <div class="assignment-meta">
                            <span><i class="fas fa-file-alt"></i> ${item.type} • ${item.size}</span>
                            <span><i class="fas fa-calendar"></i> ${itemDate}</span>
                        </div>
                        <div class="assignment-actions">
                            ${item.fileUrl ? 
                                `<button class="download-assignment-btn" onclick="downloadFile('${item.fileUrl}', '${item.originalFileName || item.title}')">
                                    <i class="fas fa-download"></i> Download PYQ
                                </button>` :
                                `<button class="download-assignment-btn" onclick="downloadItem('${item.title}', '${item.type}')" style="background: #6c757d; opacity: 0.6;">
                                    <i class="fas fa-info-circle"></i> No File Available
                                </button>`
                            }
                        </div>
                    </div>
                `;
            });
            
            contentHTML += `
                    </div>
                </div>
            `;
        });
        
        contentArea.innerHTML = contentHTML;
        console.log('✅ PYQs content displayed successfully');
        
    } catch (error) {
        console.error('❌ Error loading PYQs:', error);
        contentArea.innerHTML = `
            <div class="loading-pyqs" style="color: #dc3545;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Error loading Previous Year Questions</p>
                <p style="font-size: 0.9rem; color: #999;">${error.message}</p>
            </div>
        `;
    }
}

// Show All Syllabus function (for the Syllabus quick access button)
function showAllSyllabus() {
    console.log('🎯 showAllSyllabus called');
    
    // Remove any existing modals first
    const existingModal = document.querySelector('.syllabus-year-selection-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add styles first if they don't exist
    if (!document.getElementById('syllabus-modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'syllabus-modal-styles';
        styles.textContent = `
            .syllabus-year-selection-modal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 99999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                animation: fadeIn 0.3s ease !important;
                background: rgba(0, 0, 0, 0.8) !important;
                backdrop-filter: blur(5px) !important;
            }
            
            .syllabus-year-modal-content {
                position: relative !important;
                background: linear-gradient(135deg, #1a1a1a, #2a2a2a) !important;
                border-radius: 15px !important;
                padding: 2rem !important;
                max-width: 500px !important;
                width: 90% !important;
                border: 1px solid #444 !important;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
                animation: slideIn 0.3s ease !important;
                z-index: 99999 !important;
            }
            
            .syllabus-year-modal-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 1.5rem !important;
                padding-bottom: 1rem !important;
                border-bottom: 1px solid #444 !important;
            }
            
            .syllabus-year-modal-header h2 {
                color: #fff !important;
                margin: 0 !important;
                font-size: 1.5rem !important;
            }
            
            .syllabus-year-modal-close {
                background: none !important;
                border: none !important;
                color: #888 !important;
                font-size: 2rem !important;
                cursor: pointer !important;
                padding: 0 !important;
                width: 40px !important;
                height: 40px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 50% !important;
                transition: all 0.3s ease !important;
            }
            
            .syllabus-year-modal-close:hover {
                background: #333 !important;
                color: #fff !important;
            }
        `;
        document.head.appendChild(styles);
        console.log('✅ Syllabus modal styles added');
    }
    
    // Create Syllabus year selection modal
    const syllabusYearModal = document.createElement('div');
    syllabusYearModal.className = 'syllabus-year-selection-modal';
    syllabusYearModal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 99999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(0, 0, 0, 0.8) !important;
    `;
    
    syllabusYearModal.innerHTML = `
        <div class="syllabus-year-modal-content">
            <div class="syllabus-year-modal-header">
                <h2>📚 Select Academic Year - Syllabus</h2>
                <button class="syllabus-year-modal-close" onclick="closeSyllabusYearModal()">&times;</button>
            </div>
            <div class="year-modal-body">
                <p style="color: #ccc; margin-bottom: 2rem; text-align: center;">Choose the academic year to view Syllabus:</p>
                <div class="year-options">
                    <button class="year-btn" onclick="showSyllabusBySemester(1)">
                        <i class="fas fa-graduation-cap"></i>
                        <div style="flex: 1;">
                            <span>First Year</span>
                            <small>Semester 1 & 2 Syllabus</small>
                        </div>
                    </button>
                    <button class="year-btn" onclick="showSyllabusBySemester(3)">
                        <i class="fas fa-graduation-cap"></i>
                        <div style="flex: 1;">
                            <span>Second Year</span>
                            <small>Semester 3 & 4 Syllabus</small>
                        </div>
                    </button>
                    <button class="year-btn" onclick="showSyllabusBySemester(5)">
                        <i class="fas fa-graduation-cap"></i>
                        <div style="flex: 1;">
                            <span>Third Year</span>
                            <small>Semester 5 & 6 Syllabus</small>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add click event to overlay for closing
    syllabusYearModal.addEventListener('click', function(e) {
        if (e.target === syllabusYearModal) {
            closeSyllabusYearModal();
        }
    });
    
    document.body.appendChild(syllabusYearModal);
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Syllabus modal added to DOM');
}

// Close Syllabus year selection modal
function closeSyllabusYearModal() {
    console.log('🔴 closeSyllabusYearModal called');
    const syllabusYearModal = document.querySelector('.syllabus-year-selection-modal');
    if (syllabusYearModal) {
        console.log('✅ Found Syllabus year modal, removing...');
        syllabusYearModal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            syllabusYearModal.remove();
            document.body.style.overflow = 'auto';
            console.log('✅ Syllabus year modal removed and overflow restored');
        }, 300);
    } else {
        console.error('❌ Syllabus year modal not found');
    }
}

// Show Syllabus by semester
async function showSyllabusBySemester(startSemester) {
    console.log('🎯 showSyllabusBySemester called with semester:', startSemester);
    
    // Close the year modal first
    closeSyllabusYearModal();
    
    // Wait a bit for the year modal to close
    setTimeout(() => {
        console.log('📚 Creating Syllabus modal for semester:', startSemester);
        
        // Determine the year name and semesters
        let yearName, semesters;
        if (startSemester === 1) {
            yearName = 'First Year';
            semesters = [1, 2];
        } else if (startSemester === 3) {
            yearName = 'Second Year';
            semesters = [3, 4];
        } else if (startSemester === 5) {
            yearName = 'Third Year';
            semesters = [5, 6];
        }
        
        // Add Syllabus display modal styles if they don't exist
        if (!document.getElementById('syllabus-display-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'syllabus-display-modal-styles';
            styles.textContent = `
                .syllabus-modal {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    z-index: 99999 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    animation: fadeIn 0.3s ease !important;
                    background: rgba(0, 0, 0, 0.8) !important;
                    backdrop-filter: blur(5px) !important;
                }
                
                .syllabus-modal-content {
                    position: relative !important;
                    background: linear-gradient(135deg, #1a1a1a, #2a2a2a) !important;
                    border-radius: 15px !important;
                    max-width: 800px !important;
                    width: 95% !important;
                    max-height: 90vh !important;
                    border: 1px solid #444 !important;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
                    animation: slideIn 0.3s ease !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                
                .syllabus-modal-header {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    padding: 1.5rem 2rem !important;
                    border-bottom: 1px solid #444 !important;
                    background: #1a1a1a !important;
                }
                
                .syllabus-modal-header h2 {
                    color: #fff !important;
                    margin: 0 !important;
                    font-size: 1.5rem !important;
                }
                
                .syllabus-modal-close {
                    background: none !important;
                    border: none !important;
                    color: #888 !important;
                    font-size: 2rem !important;
                    cursor: pointer !important;
                    padding: 0 !important;
                    width: 40px !important;
                    height: 40px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border-radius: 50% !important;
                    transition: all 0.3s ease !important;
                }
                
                .syllabus-modal-close:hover {
                    background: #333 !important;
                    color: #fff !important;
                }
                
                .syllabus-modal-body {
                    flex: 1 !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                
                .syllabus-semester-tabs {
                    display: flex !important;
                    background: #2a2a2a !important;
                    border-bottom: 1px solid #444 !important;
                }
                
                .syllabus-semester-tab {
                    flex: 1 !important;
                    background: none !important;
                    border: none !important;
                    color: #888 !important;
                    padding: 1rem !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    border-bottom: 3px solid transparent !important;
                }
                
                .syllabus-semester-tab:hover {
                    background: #333 !important;
                    color: #fff !important;
                }
                
                .syllabus-semester-tab.active {
                    color: #007bff !important;
                    border-bottom-color: #007bff !important;
                    background: #333 !important;
                }
                
                .syllabus-content {
                    flex: 1 !important;
                    overflow-y: auto !important;
                    padding: 2rem !important;
                }
                
                .loading-syllabus {
                    text-align: center !important;
                    color: #666 !important;
                    padding: 3rem !important;
                }
                
                .syllabus-item {
                    background: #2a2a2a !important;
                    border: 1px solid #444 !important;
                    border-radius: 10px !important;
                    padding: 1.5rem !important;
                    margin-bottom: 1rem !important;
                    transition: all 0.3s ease !important;
                }
                
                .syllabus-item:hover {
                    border-color: #007bff !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 5px 15px rgba(0, 123, 255, 0.1) !important;
                }
                
                .no-syllabus {
                    text-align: center !important;
                    color: #666 !important;
                    padding: 3rem !important;
                }
                
                .no-syllabus i {
                    font-size: 3rem !important;
                    margin-bottom: 1rem !important;
                    opacity: 0.5 !important;
                }
            `;
            document.head.appendChild(styles);
            console.log('✅ Syllabus display modal styles added');
        }
        
        // Create Syllabus display modal
        const syllabusModal = document.createElement('div');
        syllabusModal.className = 'syllabus-modal';
        syllabusModal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 99999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: rgba(0, 0, 0, 0.8) !important;
        `;
        
        syllabusModal.innerHTML = `
            <div class="syllabus-modal-content">
                <div class="syllabus-modal-header">
                    <h2>📚 ${yearName} - Syllabus</h2>
                    <button class="syllabus-modal-close" onclick="closeSyllabusModal()">&times;</button>
                </div>
                <div class="syllabus-modal-body">
                    <div class="syllabus-semester-tabs">
                        ${semesters.map(sem => `
                            <button class="syllabus-semester-tab ${sem === startSemester ? 'active' : ''}" 
                                    onclick="loadSemesterSyllabus(${sem})">
                                Semester ${sem}
                            </button>
                        `).join('')}
                    </div>
                    <div id="syllabus-content" class="syllabus-content">
                        <div class="loading-syllabus">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p>Loading Syllabus...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add click event to close when clicking outside
        syllabusModal.addEventListener('click', function(e) {
            if (e.target === syllabusModal) {
                closeSyllabusModal();
            }
        });
        
        console.log('📦 Syllabus modal HTML created');
        
        document.body.appendChild(syllabusModal);
        document.body.style.overflow = 'hidden';
        
        console.log('✅ Syllabus modal added to DOM');
        
        // Load initial semester Syllabus
        setTimeout(() => {
            loadSemesterSyllabus(startSemester);
        }, 100);
        
    }, 400); // Wait for year modal to close
}

// Close Syllabus modal
function closeSyllabusModal() {
    console.log('🚪 Closing Syllabus modal');
    const syllabusModal = document.querySelector('.syllabus-modal');
    if (syllabusModal) {
        console.log('📱 Syllabus modal found, closing with animation');
        syllabusModal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            syllabusModal.remove();
            document.body.style.overflow = 'auto';
            console.log('✅ Syllabus modal closed and removed');
        }, 300);
    } else {
        console.log('❌ Syllabus modal not found');
    }
}

// Load Syllabus for specific semester
async function loadSemesterSyllabus(semester) {
    console.log('📚 loadSemesterSyllabus called for semester:', semester);
    
    // Update active tab
    const tabs = document.querySelectorAll('.syllabus-semester-tab');
    console.log('🏷️ Found', tabs.length, 'Syllabus semester tabs');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.includes(`Semester ${semester}`)) {
            tab.classList.add('active');
            console.log('✅ Activated Syllabus tab for Semester', semester);
        }
    });
    
    const contentArea = document.getElementById('syllabus-content');
    if (!contentArea) {
        console.error('❌ syllabus-content area not found!');
        return;
    }
    
    console.log('📝 Setting loading state for Syllabus content');
    contentArea.innerHTML = `
        <div class="loading-syllabus">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>Loading Semester ${semester} Syllabus...</p>
        </div>
    `;
    
    try {
        console.log('🔄 Starting to load Syllabus from database for semester', semester);
        
        // Load only Syllabus for this semester
        const syllabus = await loadContentFromDatabase(semester, null, 'syllabus');
        
        console.log('📚 Loaded Syllabus:', syllabus.length);
        
        if (syllabus.length === 0) {
            console.log('📭 No Syllabus found for semester', semester);
            contentArea.innerHTML = `
                <div class="no-syllabus">
                    <i class="fas fa-book"></i>
                    <h3>No Syllabus found</h3>
                    <p>No Syllabus has been uploaded for Semester ${semester} yet.</p>
                </div>
            `;
            return;
        }
        
        console.log('📊 Grouping Syllabus by subject');
        // Group content by subject
        const contentBySubject = {};
        syllabus.forEach(item => {
            const subject = item.subject || 'General';
            if (!contentBySubject[subject]) {
                contentBySubject[subject] = [];
            }
            contentBySubject[subject].push(item);
        });
        
        let contentHTML = '';
        Object.keys(contentBySubject).forEach(subject => {
            const subjectTitle = getSubjectTitleByKey(subject, semester) || subject;
            
            contentHTML += `
                <div class="subject-section">
                    <h3>📚 ${subjectTitle}</h3>
                    <div class="subject-content">
            `;
            
            contentBySubject[subject].forEach(item => {
                const itemDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 
                                item.date || new Date().toLocaleDateString();
                
                const deleteButtonHtml = adminToken ? `
                    <button class="delete-btn" onclick="deleteContent('${item._id || item.id}', '${item.title}')" 
                            title="Delete this Syllabus">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                ` : '';
                
                contentHTML += `
                    <div class="syllabus-item" id="content-item-${item._id || item.id}">
                        <div class="assignment-header">
                            <div>
                                <h4 class="assignment-title">${item.title}</h4>
                                <p class="assignment-subject">${subjectTitle}</p>
                            </div>
                            ${deleteButtonHtml}
                        </div>
                        <p class="assignment-description">${item.description}</p>
                        <div class="assignment-meta">
                            <span><i class="fas fa-book"></i> ${item.type} • ${item.size}</span>
                            <span><i class="fas fa-calendar"></i> ${itemDate}</span>
                        </div>
                        <div class="assignment-actions">
                            ${item.fileUrl ? 
                                `<button class="download-assignment-btn" onclick="downloadFile('${item.fileUrl}', '${item.originalFileName || item.title}')">
                                    <i class="fas fa-download"></i> Download Syllabus
                                </button>` :
                                `<button class="download-assignment-btn" onclick="downloadItem('${item.title}', '${item.type}')" style="background: #6c757d; opacity: 0.6;">
                                    <i class="fas fa-info-circle"></i> No File Available
                                </button>`
                            }
                        </div>
                    </div>
                `;
            });
            
            contentHTML += `
                    </div>
                </div>
            `;
        });
        
        contentArea.innerHTML = contentHTML;
        console.log('✅ Syllabus content displayed successfully');
        
    } catch (error) {
        console.error('❌ Error loading Syllabus:', error);
        contentArea.innerHTML = `
            <div class="loading-syllabus" style="color: #dc3545;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Error loading Syllabus</p>
                <p style="font-size: 0.9rem; color: #999;">${error.message}</p>
            </div>
        `;
    }
}
document.addEventListener('DOMContentLoaded',function(){
    const navToggle=document.getElementById('nav-toggle');
    const navMenu=document.getElementById('nav-menu');
    navToggle.addEventListener('click',function(){
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
    const navLinks=document.querySelectorAll('.nav-link');
    navLinks.forEach(link =>{
        link.addEventListener('click',function(){
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
    document.addEventListener('click',function(e){
        if(!navMenu.contains(e.target) && !navToggle.contains(e.target)){
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
});
