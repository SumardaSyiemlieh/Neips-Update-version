// Google Sheets Service for Staff Dashboard - CORS FIXED VERSION
class GoogleSheetsService {
    constructor() {
        this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyj4Qh8tUk4M8dUeSRYI0fShsN2bvhs9Yp8btrTAQTMnV-IafCdO27nsx2KOqprEvR7/exec';
    }

    // CORS-friendly fetch method with JSONP fallback
    async corsFetch(url, options = {}) {
        try {
            console.log('🔄 Attempting regular fetch...');
            const response = await fetch(url, {
                ...options,
                mode: 'cors',
                credentials: 'omit'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Regular fetch successful');
            return result; 

        } catch (error) {
            console.log('🔄 Regular fetch failed, trying JSONP...', error.message);
            return this.jsonpFetch(url);
        }
    }

    // JSONP fallback for CORS issues
    jsonpFetch(url) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
            const script = document.createElement('script');
            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('JSONP request timeout'));
            }, 10000); // 10 second timeout

            function cleanup() {
                clearTimeout(timeoutId);
                delete window[callbackName];
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            }

            window[callbackName] = (data) => {
                cleanup();
                console.log('✅ JSONP fetch successful');
                resolve(data);
            };

            script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
            script.onerror = () => {
                cleanup();
                console.error('❌ JSONP script load failed');
                reject(new Error('JSONP request failed'));
            };

            document.body.appendChild(script);
        });
    }

    // GET methods using CORS-friendly fetch
    async getTasksForCenter(centerName) {
        try {
            console.log(`📋 Fetching tasks for center: ${centerName}`);
            const url = `${this.APPS_SCRIPT_URL}?action=getTasksByCenter&center=${encodeURIComponent(centerName)}`;
            const result = await this.corsFetch(url);
            return result;
        } catch (error) {
            console.error('❌ Error fetching tasks for center:', error);
            throw new Error('Failed to fetch tasks: ' + error.message);
        }
    }

    async getAllStudents() {
        try {
            console.log('📊 Fetching students from Google Sheets...');
            const url = `${this.APPS_SCRIPT_URL}?action=getStudents`;
            const result = await this.corsFetch(url);
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script fetch all error:', error);
            throw new Error('Failed to fetch students: ' + error.message);
        }
    }

    async getAllStaff() {
        try {
            const url = `${this.APPS_SCRIPT_URL}?action=getStaff`;
            const result = await this.corsFetch(url);
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script fetch staff error:', error);
            throw new Error('Failed to fetch staff: ' + error.message);
        }
    }

    async getAllTasks() {
        try {
            const url = `${this.APPS_SCRIPT_URL}?action=getAllTasks`;
            const result = await this.corsFetch(url);
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script fetch tasks error:', error);
            throw new Error('Failed to fetch tasks: ' + error.message);
        }
    }

    async getBatches() {
        try {
            console.log('📚 Fetching batches from Google Sheets...');
            const url = `${this.APPS_SCRIPT_URL}?action=getBatches`;
            const result = await this.corsFetch(url);
            console.log('📊 Batches API Response:', result);
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script fetch batches error:', error);
            throw new Error('Failed to fetch batches: ' + error.message);
        }
    }

    async getMyBatchApprovals(center) {
        try {
            const url = `${this.APPS_SCRIPT_URL}?action=getMyBatchApprovals&center=${encodeURIComponent(center)}`;
            const result = await this.corsFetch(url);
            return result;
        } catch (error) {
            console.error('❌ Error fetching my batch approvals:', error);
            throw new Error('Failed to fetch batch approvals: ' + error.message);
        }
    }

    async getStudentsForCenter(center) {
        try {
            const url = `${this.APPS_SCRIPT_URL}?action=getStudentsForCenter&center=${encodeURIComponent(center)}`;
            const result = await this.corsFetch(url);
            return result;
        } catch (error) {
            console.error('❌ Error fetching students for center:', error);
            throw new Error('Failed to fetch students: ' + error.message);
        }
    }

    // POST methods (unchanged, as they usually don't have CORS issues)
    async sendBatchForApproval(batchData) {
        try {
            console.log('📤 Sending batch for approval:', batchData);

            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'sendBatchForApproval',
                    batchId: batchData.batchId,
                    center: batchData.center,
                    createdBy: batchData.createdBy,
                    timestamp: batchData.timestamp
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Error sending batch for approval:', error);
            throw new Error('Failed to send batch for approval: ' + error.message);
        }
    }

    async completeTask(taskId, notes, center) {
        try {
            console.log(`✅ Completing task: ${taskId}`);

            const formData = new URLSearchParams();
            formData.append('action', 'completeTask');
            formData.append('taskId', taskId);
            formData.append('notes', notes);
            formData.append('center', center);

            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('❌ Error completing task:', error);
            throw new Error('Failed to complete task: ' + error.message);
        }
    }

    async updateTaskStatus(taskId, status, center) {
        try {
            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'updateTaskStatus',
                    taskId: taskId,
                    status: status,
                    center: center
                })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Error updating task status:', error);
            throw new Error('Failed to update task status: ' + error.message);
        }
    }

    async saveBatch(batchData) {
        try {
            console.log('💾 Saving batch to Google Sheets...', batchData);

            const params = new URLSearchParams();
            params.append('action', 'saveBatch');
            params.append('batchData', JSON.stringify(batchData));

            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params
            });

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('❌ Error saving batch:', error);
            throw new Error(`Failed to save batch: ${error.message}`);
        }
    }

    async deleteBatch(batchId) {
        try {
            console.log('🗑️ Deleting batch from Google Sheets...');
            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'deleteBatch',
                    batchId: batchId
                })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Error deleting batch:', error);
            throw new Error('Failed to delete batch: ' + error.message);
        }
    }

    async approveStudent(studentId, project, center) {
        try {
            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'approveStudent',
                    studentId: studentId,
                    project: project,
                    center: center
                })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Error approving student:', error);
            throw new Error('Failed to approve student: ' + error.message);
        }
    }

    async rejectStudent(studentId, rejectionReason, center) {
        try {
            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'rejectStudent',
                    studentId: studentId,
                    rejectionReason: rejectionReason,
                    center: center
                })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Error rejecting student:', error);
            throw new Error('Failed to reject student: ' + error.message);
        }
    }
}

const sheetsService = new GoogleSheetsService();

// Global Variables
let currentCenter = '';
let centerManagerName = '';

// DOM Elements
const dropdowns = document.querySelectorAll('.dropdown');
const menuLinks = document.querySelectorAll('.menu-link');
const contentSections = document.querySelectorAll('.content-section');

// Initialize dashboard with real data
document.addEventListener('DOMContentLoaded', function () {
    initializeStaffDashboard();
});

// Main initialization function
async function initializeStaffDashboard() {
    // Get center from URL or localStorage
    getCurrentCenter();

    // Update UI with center info
    updateCenterInfo();

    // Setup UI components
    setupEventListeners();
    setupHamburgerMenu();
    initializeAnimations();

    // Load real data from Google Sheets
    await loadRealData();
}

// Get the current center from URL parameters
// Get the current center from URL parameters
function getCurrentCenter() {
    const urlParams = new URLSearchParams(window.location.search);
    currentCenter = urlParams.get('center') || localStorage.getItem('currentCenter') || 'NeIPS Center';

    console.log('🏢 Staff Dashboard - Current Center:', currentCenter);

    // Store for later use
    localStorage.setItem('currentCenter', currentCenter);

    // Update the dashboard title immediately
    updateCenterInfo();
}

// Update the dashboard with center information
function updateCenterInfo() {
    // Update page title
    document.title = `${currentCenter} - Staff Dashboard`;

    // Update header title
    const headerTitle = document.getElementById('centerDashboardTitle');
    if (headerTitle) {
        headerTitle.textContent = `${currentCenter} Dashboard`;
    }

    // Update user role in sidebar
    const userRole = document.querySelector('.user-role');
    if (userRole) {
        userRole.textContent = `Center Manager - ${currentCenter}`;
    }
}

// Load all real data from Google Sheets
async function loadRealData() {
    showLoading('Loading center data...');

    try {
        console.log(`📊 Loading REAL data for center: ${currentCenter}`);

        // Load students data
        const studentsResult = await sheetsService.getAllStudents();

        // Load staff data
        const staffResult = await sheetsService.getAllStaff();

        // Load tasks data
        const tasksResult = await sheetsService.getTasksForCenter(currentCenter);

        // Process and display real data
        await processRealData(studentsResult, staffResult, tasksResult);

        hideLoading();

    } catch (error) {
        console.error('❌ Error loading real data:', error);
        hideLoading();
        showError('Failed to load data from database. Using sample data.');
        // Fallback to sample data
        loadSampleData();
    }
}

// Process and display real data
async function processRealData(studentsResult, staffResult, tasksResult) {
    // Process students data
    if (studentsResult.success && studentsResult.students) {
        await processStudentsData(studentsResult.students);
    } else {
        console.log('❌ No students data found');
    }

    // Process staff data
    if (staffResult.status === 'success' && staffResult.data) {
        processStaffData(staffResult.data);
    } else {
        console.log('❌ No staff data found');
    }

    // Process tasks data
    if (tasksResult.success && tasksResult.tasks) {
        processTasksData(tasksResult.tasks);
    } else {
        console.log('❌ No tasks data found');
    }
}

// Process students data and update dashboard
async function processStudentsData(students) {
    console.log(`👨‍🎓 Processing ${students.length} students from database`);

    // Filter students for current center
    const centerStudents = students.filter(student => {
        const studentCenter = student['Address'] || student['Center'] || student.address || student['Training Center'] || '';
        return studentCenter && studentCenter.toLowerCase().includes(currentCenter.toLowerCase());
    });

    console.log(`📍 Found ${centerStudents.length} students for ${currentCenter}`);

    // Calculate various statistics
    const totalStudents = centerStudents.length;
    const approvedStudents = centerStudents.filter(student =>
        (student['Status'] || student.status || '').toLowerCase() === 'approved'
    ).length;

    const pendingStudents = centerStudents.filter(student =>
        (student['Status'] || student.status || '').toLowerCase() === 'pending'
    ).length;

    const completedStudents = centerStudents.filter(student =>
        (student['Status'] || student.status || '').toLowerCase() === 'completed'
    ).length;

    // Count by course/trade
    const courses = {};
    centerStudents.forEach(student => {
        const course = student['Trade'] || student['Course'] || student.trade || 'Unknown';
        courses[course] = (courses[course] || 0) + 1;
    });

    // Update dashboard with real data
    updateDashboardStats({
        totalStudents: totalStudents,
        approvedStudents: approvedStudents,
        pendingStudents: pendingStudents,
        completedStudents: completedStudents,
        courses: courses,
        centerStudents: centerStudents
    });
}

// Process staff data
function processStaffData(staff) {
    const centerStaff = staff.filter(staffMember => {
        const staffCenter = staffMember.center || staffMember['Center'] || '';
        return staffCenter && staffCenter.toLowerCase().includes(currentCenter.toLowerCase());
    });

    console.log(`👨‍💼 Found ${centerStaff.length} staff members for ${currentCenter}`);

    // You can update staff-related stats here
    updateStaffStats(centerStaff.length);
}

// ==================== TASK STATUS FIX ====================

// Fix the processTasksData function - UPDATE ONLY THIS PART
function processTasksData(tasks) {
    console.log('🔄 Processing tasks data for display:', tasks);

    if (!tasks || !Array.isArray(tasks)) {
        console.log('❌ No tasks array found');
        allTasks = [];
        currentTasks = [];
        return;
    }

    allTasks = tasks.map(task => {
        // Handle different possible field names from Google Sheets
        const taskId = task.TaskID || task.taskId || task.id || task['Task ID'] || '';
        const title = task.Title || task.title || 'Untitled Task';
        const description = task.Description || task.description || 'No description';

        // FIX: Proper status handling for display
        let status = task.Status || task.status || 'Assigned';

        // Map to display statuses
        if (status.toLowerCase() === 'completed') {
            status = 'Completed';
        } else if (status.toLowerCase() === 'assigned') {
            status = 'Pending'; // Show assigned tasks as Pending
        } else {
            status = 'Pending'; // Default to Pending
        }

        const priority = task.Priority || task.priority || 'Medium';
        const dueDate = task.DueDate || task.dueDate || task['Due Date'];
        const assignedBy = task.AssignedBy || task.assignedBy || 'Admin';
        const assignedDate = task.AssignedDate || task.assignedDate || task['Assigned Date'];
        const completionNotes = task.CompletionNotes || task.completionNotes || task['Completion Notes'];
        const center = task.Center || task.center || currentCenter;

        // Calculate overdue status
        let isOverdue = false;
        if (dueDate && status !== 'Completed') {
            try {
                const due = new Date(dueDate);
                const now = new Date();
                isOverdue = due < now;
            } catch (e) {
                console.warn('Error parsing due date:', e);
            }
        }

        return {
            TaskID: taskId,
            Title: title,
            Description: description,
            Status: status, // This is the fixed status for display
            Priority: priority,
            DueDate: dueDate,
            AssignedBy: assignedBy,
            AssignedDate: assignedDate,
            CompletionNotes: completionNotes,
            Center: center,
            IsOverdue: isOverdue
        };
    });

    currentTasks = [...allTasks];
    displayTasks();
    updateTaskStats();
}

// Update dashboard statistics with real data
function updateDashboardStats(data) {
    console.log('📈 Updating dashboard with real data:', data);

    // Update main stats cards
    updateStatCard('.stat-card.primary h3', data.totalStudents);
    updateStatCard('.stat-card.success h3', data.approvedStudents);
    updateStatCard('.stat-card.warning h3', data.pendingStudents);
    updateStatCard('.stat-card.info h3', data.completedStudents);

    // Update main dashboard cards
    updateMainCard('.fresh-skilling .stat-number', data.totalStudents);
    updateMainCard('.reskilling .stat-number', data.completedStudents);
    updateMainCard('.upskilling .stat-number', Object.keys(data.courses).length); // Number of courses
    updateMainCard('.self-employed .stat-number', data.approvedStudents);

    // Update progress bars based on completion rate
    const completionRate = data.totalStudents > 0 ? Math.round((data.completedStudents / data.totalStudents) * 100) : 0;
    updateProgressBar('.fresh-skilling .progress-fill', completionRate);
    updateProgressBar('.reskilling .progress-fill', completionRate);
    updateProgressBar('.upskilling .progress-fill', Math.min(completionRate, 100));
    updateProgressBar('.self-employed .progress-fill', Math.min(completionRate + 20, 100));

    // Update progress text
    updateProgressText('.fresh-skilling .progress-text', `${completionRate}% Completion Rate`);
    updateProgressText('.reskilling .progress-text', `${completionRate}% Success Rate`);
    updateProgressText('.upskilling .progress-text', `${Math.min(completionRate, 100)}% Placement Rate`);
    updateProgressText('.self-employed .progress-text', `${Math.min(completionRate + 20, 100)}% Business Success`);

    // Update additional details
    updateCardDetail('.fresh-skilling .detail-value', Object.keys(data.courses).length); // Number of batches (using course count)
    updateCardDetail('.reskilling .detail-value', data.totalStudents);
    updateCardDetail('.upskilling .detail-value', data.approvedStudents);
    updateCardDetail('.self-employed .detail-value', `${completionRate}%`);
}

// Update individual stat card
function updateStatCard(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        animateValue(selector, 0, value, 1500);
    }
}

// Update main card stat
function updateMainCard(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = value;
    }
}

// Update progress bar
function updateProgressBar(selector, percentage) {
    const element = document.querySelector(selector);
    if (element) {
        element.style.width = `${percentage}%`;
    }
}

// Update progress text
function updateProgressText(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = text;
    }
}

// Update card detail
function updateCardDetail(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = value;
    }
}

// Update staff stats
function updateStaffStats(staffCount) {
    console.log(`👨‍💼 Center has ${staffCount} staff members`);
}

// Update task stats
function updateTaskStats(completed, pending, total) {
    console.log(`✅ Tasks: ${completed} completed, ${pending} pending, ${total} total`);
}

// Fallback to sample data if real data fails
function loadSampleData() {
    console.log('📊 Loading sample data as fallback');

    const sampleData = {
        totalStudents: 45,
        approvedStudents: 32,
        pendingStudents: 10,
        completedStudents: 28,
        courses: { 'Fashion Designing': 15, 'Craft Baking': 12, 'Mobile Repair': 18 }
    };

    updateDashboardStats(sampleData);
}

// Animation functions
function initializeAnimations() {
    // Animate stats cards on load
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });

    // Animate main cards
    const mainCards = document.querySelectorAll('.main-card');
    mainCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';

        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }, 800 + (index * 200));
    });
}

// Animate number counting
function animateValue(selector, start, end, duration) {
    const element = document.querySelector(selector);
    if (!element) return;

    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value + (selector.includes('info') ? '%' : '');

        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}


function logout() {
    console.log('🚪 Showing logout confirmation...');

    // Create logout modal
    const logoutModal = document.createElement('div');
    logoutModal.className = 'logout-modal-overlay';
    logoutModal.id = 'logoutModal';
    logoutModal.style.display = 'flex';

    logoutModal.innerHTML = `
        <div class="logout-modal">
            <div class="logout-modal-header">
                <div class="logout-icon">
                    <i class="fas fa-sign-out-alt"></i>
                </div>
                <h2 class="logout-title">Confirm Logout</h2>
                <p class="logout-message">Are you sure you want to logout from ${currentCenter}?</p>
            </div>
            <div class="logout-buttons">
                <button class="btn-logout-cancel" onclick="closeLogoutModal()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="btn-logout-confirm" onclick="confirmLogout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(logoutModal);

    // Close modal when clicking outside
    logoutModal.addEventListener('click', function (e) {
        if (e.target === logoutModal) {
            closeLogoutModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function logoutKeyHandler(e) {
        if (e.key === 'Escape') {
            closeLogoutModal();
            document.removeEventListener('keydown', logoutKeyHandler);
        }
    });
}

function closeLogoutModal() {
    console.log('❌ Logout cancelled');
    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal) {
        logoutModal.remove();
    }
}

function confirmLogout() {
    console.log('✅ Logout confirmed, redirecting to home...');

    // Show loading state
    const confirmBtn = document.querySelector('.btn-logout-confirm');
    if (confirmBtn) {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
        confirmBtn.disabled = true;
    }

    // Clear all staff-related data from localStorage
    localStorage.removeItem('currentCenter');
    localStorage.removeItem('centerCode');
    localStorage.removeItem('staffLoggedIn');
    localStorage.removeItem('staffEmail');
    localStorage.removeItem('staffData');

    // Wait a moment for user to see the loading state
    setTimeout(() => {
        // Redirect to index.html (go up TWO levels to reach the root)
        window.location.href = '../../index.html';
    }, 1000);
}
// Dynamic Content Loading - FIXED VERSION
function loadContent(sectionId) {
    console.log(`📂 Loading content for: ${sectionId}`);

    // Hide all content sections
    contentSections.forEach(section => {
        section.classList.remove('active');
    });

    // Show the selected section
    const targetSection = document.getElementById(`${sectionId}-content`);
    if (targetSection) {
        targetSection.classList.add('active');

        // Initialize section-specific functionality when content is loaded
        setTimeout(() => {
            initializeSection(sectionId);
        }, 100);
    } else {
        // If section doesn't exist, create it dynamically
        createContentSection(sectionId);
    }

    // Update active menu item
    menuLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-target') === sectionId) {
            link.classList.add('active');
        }
    });

    // Close dropdowns
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
    });
}
function createContentSection(sectionId) {
    const dynamicContent = document.getElementById('dynamic-content');

    // Remove existing dynamically created sections
    const existingSection = document.getElementById(`${sectionId}-content`);
    if (existingSection) {
        existingSection.remove();
    }

    const newSection = document.createElement('div');
    newSection.className = 'content-section active';
    newSection.id = `${sectionId}-content`;

    switch (sectionId) {
        case 'create-batch':
            newSection.innerHTML = getBatchManagementHTML();
            break;
        case 'manage-attendance':
            newSection.innerHTML = getAttendanceManagementHTML();
            break;
        case 'add-staff':
            newSection.innerHTML = getAddStaffHTML();
            break;
        case 'task-management':
            newSection.innerHTML = getTaskManagementHTML();
            break;
        default:
            newSection.innerHTML = `<div class="content-placeholder"><h2>${sectionId.replace('-', ' ').toUpperCase()} Content</h2><p>This section is under development.</p></div>`;
    }

    dynamicContent.appendChild(newSection);

    // Initialize section-specific functionality
    initializeSection(sectionId);
}

// Task Management HTML
function getTaskManagementHTML() {
    return `
            <div class="batch-management">
                <div class="batch-header">
                    <h2><i class="fas fa-tasks"></i> Task Management - <span id="currentCenterName">${currentCenter}</span></h2>
                    <div class="header-actions">
                        <button class="btn-primary" onclick="refreshTasks()">
                            <i class="fas fa-sync-alt"></i> Refresh Tasks
                        </button>
                    </div>
                </div>

                <!-- Task Filters -->
                <div class="batch-filters">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label for="task-status-filter">Status</label>
                            <select id="task-status-filter" onchange="filterTasks()">
                                <option value="all">All Tasks</option>
                                <option value="pending">Pending</option>
                                <option value="in progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="task-priority-filter">Priority</label>
                            <select id="task-priority-filter" onchange="filterTasks()">
                                <option value="all">All Priorities</option>
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Tasks Container -->
                <div class="tasks-container">
                    <div class="tasks-stats">
                        <div class="task-stat-card">
                            <div class="stat-icon pending">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="pending-tasks-count">0</h3>
                                <p>Pending</p>
                            </div>
                        </div>
                        <div class="task-stat-card">
                            <div class="stat-icon in-progress">
                                <i class="fas fa-spinner"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="progress-tasks-count">0</h3>
                                <p>In Progress</p>
                            </div>
                        </div>
                        <div class="task-stat-card">
                            <div class="stat-icon completed">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="completed-tasks-count">0</h3>
                                <p>Completed</p>
                            </div>
                        </div>
                        <div class="task-stat-card">
                            <div class="stat-icon overdue">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="overdue-tasks-count">0</h3>
                                <p>Overdue</p>
                            </div>
                        </div>
                    </div>

                    <!-- Tasks List -->
                    <div class="tasks-list" id="tasks-list">
                        <div class="loading-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Loading tasks...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
}

function getBatchManagementHTML() {
    return `
            <div class="batch-management">
                <div class="batch-header">
                    <h2><i class="fas fa-layer-group"></i> Batch Management - <span id="currentCenterBatchName">${currentCenter}</span></h2>
                    <div class="header-actions">
                        <button class="btn-primary" onclick="loadBatchesFromDatabase()">
                            <i class="fas fa-sync-alt"></i> Refresh Batches
                        </button>
                        <button class="btn-success" onclick="showCreateBatchModal()">
                            <i class="fas fa-plus"></i> Create New Batch
                        </button>
                    </div>
                </div>

                <!-- Batch Filters -->
                <div class="batch-filters">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label for="batch-status-filter">Status</label>
                            <select id="batch-status-filter" onchange="filterBatches()">
                                <option value="all">All Batches</option>
                                <option value="Active">Active</option>
                                <option value="Upcoming">Upcoming</option>
                                <option value="Completed">Completed</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="batch-trade-filter">Trade</label>
                            <select id="batch-trade-filter" onchange="filterBatches()">
                                <option value="all">All Trades</option>
                                <!-- Trades will be populated dynamically -->
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Batches Container -->
                <div class="batches-container">
                    <div class="batches-stats">
                        <div class="batch-stat-card">
                            <div class="stat-icon total">
                                <i class="fas fa-layer-group"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="total-batches-count">0</h3>
                                <p>Total Batches</p>
                            </div>
                        </div>
                        <div class="batch-stat-card">
                            <div class="stat-icon active">
                                <i class="fas fa-play-circle"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="active-batches-count">0</h3>
                                <p>Active Batches</p>
                            </div>
                        </div>
                        <div class="batch-stat-card">
                            <div class="stat-icon upcoming">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="upcoming-batches-count">0</h3>
                                <p>Upcoming Batches</p>
                            </div>
                        </div>
                        <div class="batch-stat-card">
                            <div class="stat-icon capacity">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="total-capacity">0</h3>
                                <p>Total Capacity</p>
                            </div>
                        </div>
                    </div>

                    <!-- Batches List -->
                    <div class="batches-list" id="batches-list">
                        <div class="loading-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Loading batches from database...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Create Batch Modal -->
            <div id="createBatchModal" class="modal-overlay" style="display: none;">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-plus-circle"></i> Create New Batch</h3>
                        <button class="close-modal" onclick="closeCreateBatchModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="createBatchForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="batchSector">Sector *</label>
                                    <select id="batchSector" required>
                                        <option value="">Select Sector</option>
                                        <option value="Apparel Make-Ups & Home Furnishing">Apparel Make-Ups & Home Furnishing</option>
                                        <option value="Construction">Construction</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="IT & ITES">IT & ITES</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="batchTrade">Trade *</label>
                                    <input type="text" id="batchTrade" required placeholder="e.g., SM - Fashion Designer">
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="batchMaxCapacity">Max Capacity *</label>
                                    <input type="number" id="batchMaxCapacity" required min="1" max="50" value="30">
                                </div>
                                <div class="form-group">
                                    <label for="batchFaculty">Faculty *</label>
                                    <input type="text" id="batchFaculty" required placeholder="Faculty Name">
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="batchStartDate">Start Date *</label>
                                    <input type="date" id="batchStartDate" required>
                                </div>
                                <div class="form-group">
                                    <label for="batchEndDate">End Date *</label>
                                    <input type="date" id="batchEndDate" required>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="batchStartTime">Start Time *</label>
                                    <input type="time" id="batchStartTime" required value="09:00">
                                </div>
                                <div class="form-group">
                                    <label for="batchEndTime">End Time *</label>
                                    <input type="time" id="batchEndTime" required value="17:00">
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="batchStatus">Status *</label>
                                <select id="batchStatus" required>
                                    <option value="Upcoming">Upcoming</option>
                                    <option value="Active">Active</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <input type="hidden" id="batchCenter" value="${currentCenter}">
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="closeCreateBatchModal()">Cancel</button>
                        <button class="btn-primary" onclick="createNewBatch()">
                            <i class="fas fa-save"></i> Create Batch
                        </button>
                    </div>
                </div>
            </div>
        `;
}
function getAttendanceManagementHTML() {
    return `
            <div class="batch-management">
                <div class="batch-header">
                    <h2><i class="fas fa-clipboard-check"></i> Attendance Management</h2>
                    <button class="btn-primary">
                        <i class="fas fa-download"></i> Export Report
                    </button>
                </div>
                <div class="content-placeholder">
                    <h3>Attendance Management System</h3>
                    <p>Track and manage student attendance records.</p>
                </div>
            </div>
        `;
}

function getAddStaffHTML() {
    return `
            <div class="batch-management">
                <div class="batch-header">
                    <h2><i class="fas fa-user-plus"></i> Staff Management</h2>
                    <button class="btn-primary">
                        <i class="fas fa-plus"></i> Add New Staff
                    </button>
                </div>
                <div class="content-placeholder">
                    <h3>Staff Management System</h3>
                    <p>Add and manage staff members for your center.</p>
                </div>
            </div>
        `;
}

function initializeSection(sectionId) {
    console.log(`🔄 Initializing section: ${sectionId}`);

    switch (sectionId) {
        case 'create-batch':
            initializeBatchManagement(); // This will now load real data
            break;
        case 'manage-attendance':
            initializeAttendanceManagement();
            break;
        case 'add-staff':
            initializeStaffManagement();
            break;
        case 'task-management':
            initializeTaskManagement();
            break;
        default:
            console.log(`No specific initialization for section: ${sectionId}`);
    }
}
function initializeBatchManagement() {
    console.log('🚀 Initializing batch management for:', currentCenter);

    // Update center name in the batch management section
    const centerNameElement = document.getElementById('currentCenterBatchName');
    if (centerNameElement) {
        centerNameElement.textContent = currentCenter;
    }

    loadBatchesFromDatabase();
}

function initializeAttendanceManagement() {
    console.log('Initializing attendance management...');
}

function initializeStaffManagement() {
    console.log('Initializing staff management...');
}

// ==================== TASK MANAGEMENT SYSTEM ====================

let allTasks = [];
let currentTasks = [];
let taskPollingInterval = null;

// Initialize task management
function initializeTaskManagement() {
    console.log('🚀 Initializing task management for:', currentCenter);

    // Update center name display
    const centerNameElement = document.getElementById('currentCenterName');
    if (centerNameElement) {
        centerNameElement.textContent = currentCenter;
    }

    loadTasks();

    // Set up auto-refresh every 30 seconds
    taskPollingInterval = setInterval(() => {
        if (document.getElementById('task-management-content')?.classList.contains('active')) {
            console.log('🔄 Auto-refreshing tasks...');
            loadTasks();
        }
    }, 30000);

    // Start real-time notifications
    startTaskNotifications();
}
// Optimized task loading with caching
let tasksCache = null;
let lastTaskFetch = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

// Load tasks from Google Sheets

async function loadTasks() {
    console.log('📋 Loading tasks for center:', currentCenter);

    const tasksList = document.getElementById('tasks-list');
    if (tasksList) {
        tasksList.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading tasks...</p>
                </div>
            `;
    }

    // Use cache if available and recent
    const now = Date.now();
    if (tasksCache && (now - lastTaskFetch) < CACHE_DURATION) {
        console.log('🔄 Using cached tasks');
        allTasks = tasksCache;
        currentTasks = [...allTasks];
        displayTasks();
        updateTaskStats();
        return;
    }

    try {
        const result = await sheetsService.getTasksForCenter(currentCenter);
        console.log('📊 Tasks API Response:', result);

        if (result.success && result.tasks) {
            // Process and cache task data
            allTasks = result.tasks.map(task => ({
                TaskID: task.TaskID || task.taskId || task.id,
                Title: task.Title || task.title || 'Untitled Task',
                Description: task.Description || task.description || 'No description',
                Priority: task.Priority || task.priority || 'Medium',
                Status: task.Status || task.status || 'pending',
                DueDate: task.DueDate || task.dueDate,
                AssignedBy: task.AssignedBy || task.assignedBy || 'Admin',
                AssignedDate: task.AssignedDate || task.assignedDate,
                CompletionNotes: task.CompletionNotes || task.completionNotes,
                Center: task.Center || task.center || currentCenter,
                IsOverdue: task.IsOverdue || false
            }));

            // Update cache
            tasksCache = [...allTasks];
            lastTaskFetch = Date.now();

            currentTasks = [...allTasks];
            displayTasks();
            updateTaskStats();

        } else {
            throw new Error(result.message || 'No tasks data received');
        }

    } catch (error) {
        console.error('❌ Error loading tasks:', error);
        const tasksList = document.getElementById('tasks-list');
        if (tasksList) {
            tasksList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to Load Tasks</h3>
                        <p>Error: ${error.message}</p>
                        <button class="btn-primary" onclick="loadTasks()" style="margin-top: 15px;">
                            <i class="fas fa-sync-alt"></i> Try Again
                        </button>
                    </div>
                `;
        }
        allTasks = [];
        currentTasks = [];
        updateTaskStats();
    }
}


// Display tasks in the UI
function displayTasks() {
    const tasksList = document.getElementById('tasks-list');

    if (currentTasks.length === 0) {
        tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No Tasks Assigned</h3>
                    <p>You don't have any tasks assigned to ${currentCenter} yet.</p>
                    <p>Tasks assigned by admin will appear here automatically.</p>
                    <button class="btn-primary" onclick="loadTasks()" style="margin-top: 15px;">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            `;
        return;
    }

    let html = '';
    currentTasks.forEach((task) => {
        const taskId = task.TaskID;
        const title = task.Title;
        const description = task.Description;
        const priority = task.Priority;
        const status = task.Status;
        const dueDate = task.DueDate;
        const assignedBy = task.AssignedBy;
        const assignedDate = task.AssignedDate;
        const completionNotes = task.CompletionNotes;
        const isOverdue = task.IsOverdue;

        const formattedDueDate = dueDate ? formatTaskDate(dueDate) : 'Not set';
        const formattedAssignedDate = assignedDate ? formatTaskDate(assignedDate) : 'Recently';

        const isCompleted = status.toLowerCase() === 'completed';

        html += `
                <div class="task-item ${isOverdue ? 'overdue' : ''} ${isCompleted ? 'completed' : ''}" data-task-id="${taskId}">
                    <div class="task-header">
                        <div class="task-title-section">
                            <h3 class="task-title">${escapeHtml(title)}</h3>
                            <span class="task-priority priority-${priority.toLowerCase()}">${priority}</span>
                        </div>
                        <div class="task-status-section">
                            <span class="task-status status-${status.toLowerCase().replace(' ', '-')}">${formatStatus(status)}</span>
                            ${isOverdue ? '<span class="overdue-badge">OVERDUE</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="task-body">
                        <p class="task-description">${escapeHtml(description)}</p>
                        
                        <div class="task-meta">
                            <div class="meta-item">
                                <i class="fas fa-calendar"></i>
                                <span><strong>Due:</strong> ${formattedDueDate}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-user-shield"></i>
                                <span><strong>Assigned by:</strong> ${escapeHtml(assignedBy)}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <span><strong>Assigned:</strong> ${formattedAssignedDate}</span>
                            </div>
                        </div>

                        ${completionNotes ? `
                        <div class="completion-notes">
                            <strong>Completion Notes:</strong> ${escapeHtml(completionNotes)}
                        </div>
                        ` : ''}
                    </div>

                    <div class="task-actions">
                        ${!isCompleted ? `
                        <button class="btn-action btn-start" onclick="updateTaskStatus('${taskId}', 'In Progress')">
                            <i class="fas fa-play"></i> Start
                        </button>
                        <button class="btn-action btn-complete" onclick="showCompletionModal('${taskId}')">
                            <i class="fas fa-check"></i> Complete
                        </button>
                        ` : ''}
                        
                        ${status.toLowerCase() === 'in progress' ? `
                        <button class="btn-action btn-complete" onclick="showCompletionModal('${taskId}')">
                            <i class="fas fa-check"></i> Complete
                        </button>
                        ` : ''}

                        <button class="btn-action btn-view" onclick="viewTaskDetails('${taskId}')">
                            <i class="fas fa-eye"></i> Details
                        </button>
                    </div>
                </div>
            `;
    });

    tasksList.innerHTML = html;
}

// Update task status
async function updateTaskStatus(taskId, newStatus) {
    showLoading('Updating task status...');

    try {
        const result = await sheetsService.updateTaskStatus(taskId, newStatus, currentCenter);

        if (result.success) {
            showSuccess('Task status updated successfully!');
            loadTasks(); // Reload tasks
        } else {
            throw new Error(result.message || 'Failed to update task status');
        }
    } catch (error) {
        console.error('❌ Error updating task status:', error);
        showError('Failed to update task: ' + error.message);
    }

    hideLoading();
}

// Show completion modal
function showCompletionModal(taskId) {
    const task = allTasks.find(t => t.TaskID === taskId);

    if (!task) {
        showError('Task not found');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Complete Task: ${escapeHtml(task.Title)}</h3>
                    <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="completion-notes">Completion Notes *</label>
                        <textarea id="completion-notes" placeholder="Describe what was completed, any challenges faced, results achieved..." rows="4" required></textarea>
                        <small>These notes will be visible to admin</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="completeTask('${taskId}')">
                        <i class="fas fa-check"></i> Mark Complete
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Complete task
async function completeTask(taskId) {
    const notes = document.getElementById('completion-notes')?.value.trim();

    if (!notes) {
        showError('Please provide completion notes');
        return;
    }

    showLoading('Completing task...');

    try {
        const result = await sheetsService.completeTask(taskId, notes, currentCenter);

        if (result.success) {
            showSuccess('Task completed successfully! Admin has been notified.');
            closeModal();
            // Clear cache to force refresh
            tasksCache = null;
            loadTasks();
        } else {
            throw new Error(result.message || 'Failed to complete task');
        }
    } catch (error) {
        console.error('❌ Error completing task:', error);
        showError('Failed to complete task: ' + error.message);
    }

    hideLoading();
}
// View task details
function viewTaskDetails(taskId) {
    const task = allTasks.find(t => t.TaskID === taskId);

    if (!task) {
        showError('Task not found');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Task Details</h3>
                    <button class="close-modal" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="task-detail-section">
                        <h4>${escapeHtml(task.Title)}</h4>
                        <p class="task-description">${escapeHtml(task.Description)}</p>
                    </div>
                    
                    <div class="task-details-grid">
                        <div class="detail-item">
                            <strong>Priority:</strong>
                            <span class="priority-${task.Priority.toLowerCase()}">${task.Priority}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Status:</strong>
                            <span class="status-${task.Status.toLowerCase().replace(' ', '-')}">${formatStatus(task.Status)}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Due Date:</strong>
                            <span>${task.DueDate ? formatTaskDate(task.DueDate) : 'Not set'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Assigned By:</strong>
                            <span>${escapeHtml(task.AssignedBy)}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Assigned Date:</strong>
                            <span>${task.AssignedDate ? formatTaskDate(task.AssignedDate) : 'Recently'}</span>
                        </div>
                    </div>

                    ${task.CompletionNotes ? `
                    <div class="task-detail-section">
                        <h5>Completion Notes</h5>
                        <div class="completion-notes-detail">
                            ${escapeHtml(task.CompletionNotes)}
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="closeModal()">Close</button>
                    ${task.Status.toLowerCase() !== 'completed' ? `
                    <button class="btn-success" onclick="closeModal(); showCompletionModal('${taskId}');">
                        <i class="fas fa-check"></i> Mark Complete
                    </button>
                    ` : ''}
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Fix the filterTasks function
function filterTasks() {
    const statusFilter = document.getElementById('task-status-filter').value;
    const priorityFilter = document.getElementById('task-priority-filter').value;

    currentTasks = allTasks.filter(task => {
        const taskStatus = task.Status.toLowerCase();
        const taskPriority = task.Priority.toLowerCase();

        const statusMatch = statusFilter === 'all' ||
            (statusFilter === 'overdue' && task.IsOverdue) ||
            (statusFilter === 'pending' && taskStatus === 'pending') ||
            (statusFilter === 'in progress' && taskStatus === 'in progress') ||
            (statusFilter === 'completed' && taskStatus === 'completed');

        const priorityMatch = priorityFilter === 'all' || taskPriority === priorityFilter;

        return statusMatch && priorityMatch;
    });

    displayTasks();
    updateTaskStats();
}

// Fix the updateTaskStats function - REPLACE ONLY THIS FUNCTION
function updateTaskStats() {
    // Count tasks that are NOT completed
    const pending = allTasks.filter(t => t.Status.toLowerCase() !== 'completed').length;
    const inProgress = allTasks.filter(t => t.Status.toLowerCase() === 'in progress').length;
    const completed = allTasks.filter(t => t.Status.toLowerCase() === 'completed').length;
    const overdue = allTasks.filter(t => t.IsOverdue).length;

    // Update the display
    document.getElementById('pending-tasks-count').textContent = pending;
    document.getElementById('progress-tasks-count').textContent = inProgress;
    document.getElementById('completed-tasks-count').textContent = completed;
    document.getElementById('overdue-tasks-count').textContent = overdue;

    console.log(`📊 Task Stats - Pending: ${pending}, In Progress: ${inProgress}, Completed: ${completed}, Overdue: ${overdue}`);
}

// Refresh tasks
function refreshTasks() {
    loadTasks();
}

// ==================== REAL-TIME TASK NOTIFICATIONS ====================

function startTaskNotifications() {
    // Check for new tasks every 10 seconds
    setInterval(async () => {
        try {
            const result = await sheetsService.getTasksForCenter(currentCenter);
            if (result.success && result.tasks) {
                checkForNewTasks(result.tasks);
            }
        } catch (error) {
            console.error('❌ Error checking for new tasks:', error);
        }
    }, 10000);
}

function checkForNewTasks(latestTasks) {
    const newTasks = latestTasks.filter(newTask => {
        return !allTasks.some(existingTask => existingTask.TaskID === newTask.TaskID);
    });

    newTasks.forEach(task => {
        showNewTaskNotification(task);
    });

    // Update tasks list if there are new tasks
    if (newTasks.length > 0) {
        allTasks = latestTasks;
        currentTasks = [...allTasks];

        if (document.getElementById('task-management-content')?.classList.contains('active')) {
            displayTasks();
            updateTaskStats();
        }
    }
}

function showNewTaskNotification(task) {
    const notification = document.createElement('div');
    notification.className = 'staff-notification';
    notification.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="background: rgba(255,255,255,0.3); padding: 10px; border-radius: 50%; margin-right: 12px;">
                    <i class="fas fa-tasks"></i>
                </div>
                <strong style="font-size: 16px;">🎯 New Task Assigned!</strong>
            </div>
            <div style="font-size: 14px; line-height: 1.5;">
                <div style="font-weight: bold; margin-bottom: 8px;">${escapeHtml(task.Title)}</div>
                <div style="margin: 8px 0; opacity: 0.9;">${escapeHtml(task.Description)}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">
                    <div><strong>Due:</strong> ${task.DueDate ? formatTaskDate(task.DueDate) : 'Not set'}</div>
                    <div><strong>Priority:</strong> <span style="color: #ffdd59;">${task.Priority || 'Medium'}</span></div>
                </div>
            </div>
            <div style="margin-top: 15px; display: flex; gap: 8px;">
                <button onclick="this.parentElement.parentElement.remove(); loadContent('task-management')" style="background: #00b894; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; flex: 1;">
                    ✅ View Tasks
                </button>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #ff6b6b; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">
                    ❌ Dismiss
                </button>
            </div>
        `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);

    playNotificationSound();
}

// ==================== STUDENT MANAGEMENT ====================

async function loadStudentsSection() {
    try {
        showLoading('Loading students...');
        const result = await sheetsService.getStudentsForCenter(currentCenter);

        if (result.success && result.students) {
            displayStudents(result.students);
        } else {
            displayStudents([]);
        }
    } catch (error) {
        console.error('❌ Error loading students:', error);
        displayStudents([]);
    } finally {
        hideLoading();
    }
}

function displayStudents(students) {
    // Implementation for displaying students table
    console.log(`📊 Displaying ${students.length} students`);
    // Add your student display logic here
}

async function approveStudentWithProject(studentId) {
    const projectSelect = document.getElementById(`project-${studentId}`);
    const selectedProject = projectSelect?.value;

    if (!selectedProject) {
        showError('Please select a project before approving the student.');
        projectSelect?.focus();
        return;
    }

    if (confirm(`Approve student and assign to project: ${selectedProject}?`)) {
        showLoading('Approving student and assigning project...');

        try {
            const result = await sheetsService.approveStudent(studentId, selectedProject, currentCenter);

            if (result.success) {
                showSuccess(`Student approved successfully! Assigned to ${selectedProject}.`);
                // Refresh students list
                loadStudentsSection();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Error approving student:', error);
            showError('Failed to approve student: ' + error.message);
        } finally {
            hideLoading();
        }
    }
}

async function rejectStudent(studentId) {
    const reason = prompt('Please enter rejection reason:');
    if (reason) {
        showLoading('Rejecting student...');

        try {
            const result = await sheetsService.rejectStudent(studentId, reason, currentCenter);

            if (result.success) {
                showSuccess('Student rejected successfully! Notification sent.');
                // Refresh students list
                loadStudentsSection();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Error rejecting student:', error);
            showError('Failed to reject student: ' + error.message);
        } finally {
            hideLoading();
        }
    }
}

// ==================== UTILITY FUNCTIONS ====================

function formatTaskDate(dateString) {
    if (!dateString) return 'Not set';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'in progress': 'In Progress',
        'completed': 'Completed',
        'overdue': 'Overdue'
    };
    return statusMap[status.toLowerCase()] || status;
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;

        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);
    } catch (e) {
        console.log('Notification sound not supported');
    }
}

// UI Utility functions
function showLoading(message = 'Loading...') {
    let loading = document.getElementById('loadingOverlay');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loadingOverlay';
        loading.innerHTML = `
                <div class="loading-content">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>${message}</p>
                </div>
            `;
        document.body.appendChild(loading);
    }
    loading.style.display = 'flex';
}

function hideLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.style.display = 'none';
    }
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Existing UI setup functions
function setupEventListeners() {
    // Dropdown functionality
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        if (toggle) {
            toggle.addEventListener('click', function (e) {
                e.preventDefault();
                dropdown.classList.toggle('active');
            });
        }
    });
    document.addEventListener('click', function (e) {
        if (e.target.closest('.btn-primary') && e.target.closest('.btn-primary').textContent.includes('Create New Batch')) {
            e.preventDefault();
            showCreateBatchForm();
        }
    });
    // Menu navigation
    menuLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            if (target && !this.classList.contains('dropdown-toggle')) {
                loadContent(target);
            }
        });
    });

    // Submenu navigation
    const submenuLinks = document.querySelectorAll('.dropdown-menu a');
    submenuLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const submenu = this.getAttribute('data-submenu');
            navigateToSubmenu(submenu);
        });
    });
}

function setupHamburgerMenu() {
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const closeSidebar = document.querySelector('.close-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    function toggleSidebar() {
        if (sidebar) {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        }
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleSidebar);
    if (closeSidebar) closeSidebar.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    menuLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (window.innerWidth <= 1024) {
                toggleSidebar();
            }
        });
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 1024 && sidebar) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
}

function navigateToSubmenu(submenu) {
    showNotification(`Opening: ${submenu.replace('-', ' ').toUpperCase()}`);
    console.log(`Navigating to submenu: ${submenu}`);
}

// Placeholder functions
function createNewBatch() {
    showSuccess('Create New Batch functionality will be implemented here!');
}

// Add CSS for new elements
function injectStyles() {
    const styles = `
            .content-placeholder {
                padding: 60px 30px;
                text-align: center;
                background: white;
                border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                margin: 30px;
            }
            
            .content-placeholder h2,
            .content-placeholder h3 {
                color: #1e3c72;
                margin-bottom: 15px;
            }
            
            .content-placeholder p {
                color: #7f8c8d;
                font-size: 16px;
            }
            
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            
            .modal-content {
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #1e3c72;
                padding-bottom: 15px;
            }
            
            .modal-header h3 {
                color: #1e3c72;
                margin: 0;
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
            
            .modal-footer {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            
            #loadingOverlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255,255,255,0.9);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                flex-direction: column;
            }
            
            .loading-content {
                text-align: center;
            }
            
            .loading-content i {
                font-size: 48px;
                color: #1e3c72;
                margin-bottom: 15px;
            }
            
            .notification-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                border-left: 4px solid #1e3c72;
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
            }
            
            .notification-toast.success {
                border-left-color: #28a745;
            }
            
            .notification-toast.error {
                border-left-color: #dc3545;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            /* Task Management Styles */
            .tasks-container {
                margin-top: 20px;
            }

            .tasks-stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }

            .task-stat-card {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .stat-icon {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }

            .stat-icon.pending { background: #fff3cd; color: #856404; }
            .stat-icon.in-progress { background: #d1ecf1; color: #0c5460; }
            .stat-icon.completed { background: #d4edda; color: #155724; }
            .stat-icon.overdue { background: #f8d7da; color: #721c24; }

            .stat-info h3 {
                margin: 0;
                font-size: 24px;
                font-weight: bold;
            }

            .stat-info p {
                margin: 0;
                color: #6c757d;
            }

            .tasks-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .task-item {
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                border-left: 4px solid #007bff;
            }

            .task-item.overdue {
                border-left-color: #dc3545;
            }

            .task-item.completed {
                border-left-color: #28a745;
                opacity: 0.8;
            }

            .task-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 15px;
            }

            .task-title-section {
                flex: 1;
            }

            .task-title {
                margin: 0 0 5px 0;
                color: #1e3c72;
            }

            .task-priority {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            }

            .priority-urgent { background: #dc3545; color: white; }
            .priority-high { background: #fd7e14; color: white; }
            .priority-medium { background: #ffc107; color: black; }
            .priority-low { background: #28a745; color: white; }

            .task-status-section {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .task-status {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
            }

            .status-pending { background: #fff3cd; color: #856404; }
            .status-in-progress { background: #d1ecf1; color: #0c5460; }
            .status-completed { background: #d4edda; color: #155724; }
            .status-overdue { background: #f8d7da; color: #721c24; }

            .overdue-badge {
                background: #dc3545;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
            }

            .task-body {
                margin-bottom: 15px;
            }

            .task-description {
                color: #6c757d;
                margin-bottom: 15px;
            }

            .task-meta {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 15px;
            }

            .meta-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }

            .meta-item i {
                color: #6c757d;
                width: 16px;
            }

            .completion-notes {
                background: #f8f9fa;
                padding: 10px;
                border-radius: 5px;
                border-left: 3px solid #28a745;
            }

            .task-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .btn-action {
                padding: 8px 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .btn-start { background: #17a2b8; color: white; }
            .btn-complete { background: #28a745; color: white; }
            .btn-view { background: #6c757d; color: white; }

            .btn-action:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }

            .loading-state, .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: #6c757d;
            }

            .loading-state i, .empty-state i {
                font-size: 48px;
                margin-bottom: 15px;
                display: block;
            }
            .close-modal {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.3s ease;
    }

    .close-modal:hover {
        background: #f5f5f5;
        color: #333;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #1e3c72;
        padding-bottom: 15px;
    }

    .modal-header h3 {
        color: #1e3c72;
        margin: 0;
        flex: 1;
    }
            /* Staff Notification Styles */
            .staff-notification {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                border-left: 5px solid #ffd700;
                z-index: 10000;
                max-width: 400px;
                animation: slideInLeft 0.5s ease-out;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            @keyframes slideInLeft {
                from {
                    transform: translateX(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

      /* Logout Modal Styles */
        .logout-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        }

        .logout-modal {
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            animation: modalSlideIn 0.3s ease-out;
            border: 3px solid #1e3c72;
        }

        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-50px) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .logout-icon {
            font-size: 48px;
            color: #ff6b6b;
            margin-bottom: 15px;
        }

        .logout-title {
            color: #1e3c72;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .logout-message {
            color: #666;
            font-size: 16px;
            margin-bottom: 25px;
            line-height: 1.5;
        }

        .logout-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
        }

        .btn-logout-confirm {
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.3s ease;
            flex: 1;
        }

        .btn-logout-cancel {
            background: linear-gradient(135deg, #6c757d, #5a6268);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.3s ease;
            flex: 1;
        }

        .btn-logout-confirm:hover {
            background: linear-gradient(135deg, #ee5a52, #ff6b6b);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
        }

        .btn-logout-cancel:hover {
            background: linear-gradient(135deg, #5a6268, #6c757d);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(108, 117, 125, 0.4);
        }

        .logout-modal-header {
            margin-bottom: 20px;
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
// Inject styles when page loads
injectStyles();

// Export for global access
window.staffDashboard = {
    loadTasks,
    completeTask,
    updateTaskStatus,
    refreshTasks,
    loadStudentsSection,
    approveStudentWithProject,
    rejectStudent
};
// ==================== BATCH MANAGEMENT SYSTEM ====================

// ==================== BATCH MANAGEMENT SYSTEM ====================

// ==================== BATCH MANAGEMENT SYSTEM ====================

let allBatches = [];
let currentBatches = [];
let currentBatchStudents = [];

function initializeBatchManagement() {
    console.log('🚀 Initializing batch management for:', currentCenter);

    // Update center name in the batch management section
    const centerNameElement = document.getElementById('currentCenterBatchName');
    if (centerNameElement) {
        centerNameElement.textContent = currentCenter;
    }

    loadBatchesFromDatabase();

    // Start auto-refresh for batch updates
    startBatchAutoRefresh();

    console.log('✅ Batch management initialized with auto-refresh');
}
// Show create batch form (modal)
function showCreateBatchForm() {
    console.log('📝 Opening create batch form...');

    const modal = document.getElementById('createBatchModal');
    if (modal) {
        // Generate batch ID
        const batchId = 'BATCH-' + currentCenter.replace(/\s+/g, '-').toUpperCase() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        document.getElementById('batch-id').value = batchId;

        // Set default dates
        const today = new Date();
        document.getElementById('start-date').value = today.toISOString().split('T')[0];

        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);
        document.getElementById('end-date').value = endDate.toISOString().split('T')[0];

        // Reset student list
        currentBatchStudents = [];
        updateStudentList();

        modal.style.display = 'flex';
    } else {
        console.error('❌ Create batch modal not found!');
        showError('Create batch modal not found. Please refresh the page.');
    }
}

function closeCreateBatchModal() {
    console.log('🔒 Closing create batch modal');
    const modal = document.getElementById('createBatchModal');
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        const form = document.getElementById('createBatchForm');
        if (form) form.reset();
        currentBatchStudents = [];
        updateStudentList();
    }
}

// Save batch function
async function saveBatch() {
    const form = document.getElementById('createBatchForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const batchData = {
        BatchID: document.getElementById('batch-id').value,
        Sector: document.getElementById('sector').value,
        Trade: document.getElementById('trade').value,
        MaxCapacity: parseInt(document.getElementById('max-capacity').value),
        StartDate: document.getElementById('start-date').value,
        EndDate: document.getElementById('end-date').value,
        StartTime: document.getElementById('start-time').value,
        EndTime: document.getElementById('end-time').value,
        Faculty: document.getElementById('faculty').value,
        Status: document.getElementById('batch-status').value,
        Students: currentBatchStudents,
        Center: currentCenter,
        CreatedDate: new Date().toISOString(),
        LastUpdated: new Date().toISOString()
    };

    console.log('💾 Saving batch data:', batchData);

    showLoading('Creating new batch...');

    try {
        const result = await sheetsService.saveBatch(batchData);

        if (result.success) {
            showSuccess('Batch created successfully!');
            closeCreateBatchModal();
            // Refresh batches list
            await loadBatchesFromDatabase();
        } else {
            throw new Error(result.message || 'Failed to create batch');
        }
    } catch (error) {
        console.error('❌ Error creating batch:', error);
        showError('Failed to create batch: ' + error.message);
    }

    hideLoading();
}

// Show add student modal
function showAddStudentModal() {
    const modal = document.getElementById('addStudentModal');
    if (modal) {
        modal.style.display = 'flex';
        // Clear previous search results
        document.getElementById('student-search-results').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>Search for students to add to this batch</p>
                </div>
            `;
    }
}

// Close add student modal
function closeAddStudentModal() {
    console.log('🔒 Closing add student modal');
    const modal = document.getElementById('addStudentModal');
    if (modal) {
        modal.style.display = 'none';
        // Clear search fields
        document.getElementById('student-search').value = '';
        document.getElementById('manual-student-name').value = '';
        document.getElementById('manual-student-id').value = '';
        // Clear search results
        const searchResults = document.getElementById('student-search-results');
        if (searchResults) {
            searchResults.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>Search for students to add to this batch</p>
                    </div>
                `;
        }
    }
}

// Add manual student
function addManualStudent() {
    const name = document.getElementById('manual-student-name').value.trim();
    const id = document.getElementById('manual-student-id').value.trim();

    if (!name) {
        showError('Please enter student name');
        return;
    }

    if (currentBatchStudents.length >= 30) {
        showError('Maximum capacity reached (30 students)');
        return;
    }

    const student = {
        id: id || 'STD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        name: name,
        addedDate: new Date().toISOString()
    };

    currentBatchStudents.push(student);
    updateStudentList();

    // Clear form
    document.getElementById('manual-student-name').value = '';
    document.getElementById('manual-student-id').value = '';

    showSuccess('Student added successfully!');
}

// Update student list display
function updateStudentList() {
    const studentList = document.getElementById('student-list');
    const studentCount = document.getElementById('student-count');

    studentCount.textContent = currentBatchStudents.length;

    if (currentBatchStudents.length === 0) {
        studentList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-plus"></i>
                    <p>No students added yet. Add students to this batch.</p>
                </div>
            `;
        return;
    }

    let html = '';
    currentBatchStudents.forEach((student, index) => {
        html += `
                <div class="student-item">
                    <div class="student-info">
                        <i class="fas fa-user-graduate"></i>
                        <div>
                            <strong>${escapeHtml(student.name)}</strong>
                            <small>ID: ${escapeHtml(student.id)}</small>
                        </div>
                    </div>
                    <button class="btn-remove" onclick="removeStudent(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
    });

    studentList.innerHTML = html;
}

// Remove student from batch
function removeStudent(index) {
    currentBatchStudents.splice(index, 1);
    updateStudentList();
    showSuccess('Student removed from batch');
}

// Search students (placeholder function)
function searchStudents() {
    showNotification('Student search functionality will be implemented in the next update');
}

// Import students from sheet (placeholder function)
function importStudentsFromSheet() {
    showNotification('Import students functionality will be implemented in the next update');
}

// Export to Excel (placeholder function)
function exportToExcel() {
    showNotification('Export to Excel functionality will be implemented in the next update');
}

// Load batches from database
// Load batches from database - FIXED VERSION
async function loadBatchesFromDatabase() {
    console.log('📚 Loading batches from database for:', currentCenter);

    const batchTableBody = document.getElementById('batch-table-body');
    if (batchTableBody) {
        batchTableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="no-data">Loading batches from database...</td>
                </tr>
            `;
    }

    try {
        const result = await sheetsService.getBatches();
        console.log('📊 Batches API Response:', result);

        if (result.success && result.batches) {
            // Process the batches data
            processBatchesData(result.batches);

            // Update the table info
            updateBatchTableInfo();
        } else {
            throw new Error(result.message || 'No batches data received');
        }

    } catch (error) {
        console.error('❌ Error loading batches:', error);
        const batchTableBody = document.getElementById('batch-table-body');
        if (batchTableBody) {
            batchTableBody.innerHTML = `
                    <tr>
                        <td colspan="10" class="no-data">
                            <div class="empty-state">
                                <i class="fas fa-exclamation-triangle"></i>
                                <p>Failed to load batches: ${error.message}</p>
                                <button class="btn-primary" onclick="loadBatchesFromDatabase()" style="margin-top: 10px;">
                                    <i class="fas fa-sync-alt"></i> Try Again
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
        }
    }
}
// Update displayBatchesTable to show approval status
function displayBatchesTable() {
    const batchTableBody = document.getElementById('batch-table-body');

    if (allBatches.length === 0) {
        batchTableBody.innerHTML = `
            <tr>
                <td colspan="10" class="no-data">
                    <div class="empty-state">
                        <i class="fas fa-layer-group"></i>
                        <h4>No Batches Found</h4>
                        <p>No batches have been created for ${currentCenter} yet.</p>
                        <button class="btn-primary" onclick="showCreateBatchForm()" style="margin-top: 10px;">
                            <i class="fas fa-plus"></i> Create First Batch
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    allBatches.forEach((batch) => {
        const studentCount = Array.isArray(batch.Students) ? batch.Students.length : 0;
        const studentText = `${studentCount}/${batch.MaxCapacity}`;

        // Determine approval status display
        // In the batch table display, make sure you're checking the correct status
        // In your displayBatchesTable function, update the status badge section:
        const approvalStatus = batch.approval_status || batch.ApprovalStatus || 'draft';
        let statusBadge = '';
        let approvalButton = '';

        if (approvalStatus === 'draft') {
            approvalButton = `
        <button class="btn-action btn-approval" onclick="sendForApproval('${batch.BatchID}')" title="Send for Approval">
            <i class="fas fa-paper-plane"></i> Send for Approval
        </button>
    `;
            statusBadge = '<span class="status-badge status-draft">Draft</span>';
        } else if (approvalStatus === 'pending') {
            statusBadge = '<span class="status-badge status-pending">⏳ Pending Approval</span>';
        } else if (approvalStatus === 'approved') {
            statusBadge = '<span class="status-badge status-approved">✅ Approved</span>';
        } else if (approvalStatus === 'rejected') {
            statusBadge = `<span class="status-badge status-rejected">❌ Rejected${batch.approval_notes ? ' - ' + batch.approval_notes : ''}</span>`;
            approvalButton = `
        <button class="btn-action btn-approval" onclick="sendForApproval('${batch.BatchID}')" title="Resubmit for Approval">
            <i class="fas fa-redo"></i> Resubmit
        </button>
    `;
        }

        html += `
            <tr>
                <td>${escapeHtml(batch.BatchID)}</td>
                <td>${escapeHtml(batch.Sector)}</td>
                <td>${escapeHtml(batch.Trade)}</td>
                <td>${studentText}</td>
                <td>${formatBatchDate(batch.StartDate)}</td>
                <td>${formatBatchDate(batch.EndDate)}</td>
                <td>${batch.StartTime} - ${batch.EndTime}</td>
                <td>${escapeHtml(batch.Faculty)}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewBatchStudents('${batch.BatchID}')" title="View Students">
                            <i class="fas fa-users"></i>
                        </button>
                        ${approvalStatus === 'draft' || approvalStatus === 'rejected' ? `
                        <button class="btn-action btn-edit" onclick="editBatch('${batch.BatchID}')" title="Edit Batch">
                            <i class="fas fa-edit"></i>
                        </button>
                        ` : ''}
                        ${approvalButton}
                        ${approvalStatus === 'draft' ? `
                        <button class="btn-action btn-delete" onclick="deleteBatch('${batch.BatchID}')" title="Delete Batch">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });

    batchTableBody.innerHTML = html;
}

// Add new CSS styles for status badges in staff-dashboard.css or inline
const approvalStyles = `
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: bold;
        display: inline-block;
    }
    .status-draft {
        background: #e9ecef;
        color: #495057;
    }
    .status-pending {
        background: #fff3cd;
        color: #856404;
    }
    .status-approved {
        background: #d4edda;
        color: #155724;
    }
    .status-rejected {
        background: #f8d7da;
        color: #721c24;
    }
    .btn-approval {
        background: #17a2b8 !important;
        color: white !important;
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = approvalStyles;
document.head.appendChild(styleSheet);
// Update batch statistics
function updateBatchStats() {
    const totalBatches = allBatches.length;
    const activeBatches = allBatches.filter(batch => batch.Status === 'Active').length;
    const upcomingBatches = allBatches.filter(batch => batch.Status === 'Upcoming').length;
    const totalCapacity = allBatches.reduce((sum, batch) => sum + (batch.MaxCapacity || 0), 0);

    // Safe updates with null checks
    safeUpdateElement('total-batches-count', totalBatches);
    safeUpdateElement('active-batches-count', activeBatches);
    safeUpdateElement('upcoming-batches-count', upcomingBatches);
    safeUpdateElement('total-capacity', totalCapacity);
}

// Helper function for safe element updates
function safeUpdateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}
// Process batches data from Google Sheets
function processBatchesData(batches) {
    // Filter batches for current center
    const centerBatches = batches.filter(batch => {
        const batchCenter = batch.Center || batch.center || '';
        return batchCenter && batchCenter.toLowerCase().includes(currentCenter.toLowerCase());
    });

    console.log(`📍 Found ${centerBatches.length} batches for ${currentCenter}`, centerBatches);

    // Process batch data
    allBatches = centerBatches.map(batch => {
        // Parse students data if it's a string
        let students = [];
        try {
            if (typeof batch.Students === 'string') {
                students = JSON.parse(batch.Students);
            } else if (Array.isArray(batch.Students)) {
                students = batch.Students;
            }
        } catch (e) {
            console.warn('❌ Error parsing students data:', e);
            students = [];
        }

        return {
            BatchID: batch.BatchID || batch.batchId || batch['Batch ID'] || '',
            Sector: batch.Sector || batch.sector || 'General',
            Trade: batch.Trade || batch.trade || 'Unknown Trade',
            MaxCapacity: parseInt(batch.MaxCapacity || batch.maxCapacity || batch['Max Capacity'] || 30),
            StartDate: batch.StartDate || batch.startDate || batch['Start Date'] || '',
            EndDate: batch.EndDate || batch.endDate || batch['End Date'] || '',
            StartTime: batch.StartTime || batch.startTime || batch['Start Time'] || '09:00',
            EndTime: batch.EndTime || batch.endTime || batch['End Time'] || '17:00',
            Faculty: batch.Faculty || batch.faculty || 'Not Assigned',
            Status: batch.Status || batch.status || 'Upcoming',
            Students: students,
            Center: batch.Center || batch.center || currentCenter,
            CreatedDate: batch.CreatedDate || batch.createdDate || batch['Created Date'] || '',
            LastUpdated: batch.LastUpdated || batch.lastUpdated || batch['Last Updated'] || '',
            // ADD THESE LINES FOR APPROVAL STATUS:
            approval_status: batch.approval_status || batch.ApprovalStatus || 'draft',
            approval_notes: batch.approval_notes || batch.ApprovalNotes || '',
            approved_by: batch.approved_by || batch.ApprovedBy || '',
            approval_date: batch.approval_date || batch.ApprovalDate || ''
        };
    });

    currentBatches = [...allBatches];
    displayBatchesTable();
    updateBatchStats();
}
// Update batch table information
function updateBatchTableInfo() {
    const tableInfo = document.getElementById('batch-table-info');
    if (tableInfo && allBatches.length > 0) {
        tableInfo.textContent = `Showing ${allBatches.length} batches`;
    } else if (tableInfo) {
        tableInfo.textContent = 'Showing 0 batches';
    }
}

// View batch details
function viewBatchDetails(batchId) {
    const batch = allBatches.find(b => b.BatchID === batchId);
    if (!batch) {
        showError('Batch not found');
        return;
    }

    const studentCount = Array.isArray(batch.Students) ? batch.Students.length : 0;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>Batch Details: ${escapeHtml(batch.Trade)}</h3>
                    <button class="close-modal" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="batch-details-grid">
                        <div class="detail-section">
                            <h4>Basic Information</h4>
                            <div class="detail-item">
                                <label>Batch ID:</label>
                                <span>${batch.BatchID}</span>
                            </div>
                            <div class="detail-item">
                                <label>Status:</label>
                                <span class="status-badge status-${batch.Status.toLowerCase()}">${batch.Status}</span>
                            </div>
                            <div class="detail-item">
                                <label>Sector:</label>
                                <span>${escapeHtml(batch.Sector)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Trade:</label>
                                <span>${escapeHtml(batch.Trade)}</span>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Schedule & Faculty</h4>
                            <div class="detail-item">
                                <label>Faculty:</label>
                                <span>${escapeHtml(batch.Faculty)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Start Date:</label>
                                <span>${formatBatchDate(batch.StartDate)}</span>
                            </div>
                            <div class="detail-item">
                                <label>End Date:</label>
                                <span>${formatBatchDate(batch.EndDate)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Timing:</label>
                                <span>${batch.StartTime} - ${batch.EndTime}</span>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Enrollment</h4>
                            <div class="detail-item">
                                <label>Capacity:</label>
                                <span>${studentCount} / ${batch.MaxCapacity} students</span>
                            </div>
                            <div class="progress-container">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${(studentCount / batch.MaxCapacity) * 100}%"></div>
                                </div>
                                <span class="progress-text">${Math.round((studentCount / batch.MaxCapacity) * 100)}% filled</span>
                            </div>
                        </div>
                    </div>

                    ${studentCount > 0 ? `
                    <div class="students-section">
                        <h4>Enrolled Students (${studentCount})</h4>
                        <div class="students-list">
                            ${batch.Students.map(student => `
                                <div class="student-item">
                                    <i class="fas fa-user-graduate"></i>
                                    <div class="student-info">
                                        <strong>${escapeHtml(student.name || 'Unknown Student')}</strong>
                                        <small>ID: ${escapeHtml(student.id || 'N/A')}</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeModal()">Close</button>
                    <button class="btn-primary" onclick="editBatch('${batch.BatchID}')">
                        <i class="fas fa-edit"></i> Edit Batch
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Add this time validation function
function validateAndFormatTime(timeValue) {
    if (!timeValue) return '09:00';

    // If it's already in HH:mm format, return as is
    if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}$/)) {
        return timeValue;
    }

    // If it's a date string, extract the time part
    if (typeof timeValue === 'string' && timeValue.includes('T')) {
        try {
            const date = new Date(timeValue);
            if (!isNaN(date.getTime())) {
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            }
        } catch (e) {
            console.warn('Error parsing time:', e);
        }
    }

    // Default fallback
    return '09:00';
}
// Fix the saveBatch function to handle null values
async function saveBatch() {
    const form = document.getElementById('createBatchForm');
    if (!form) {
        showError('Form not found. Please refresh the page.');
        return;
    }

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // FIX: Safe element access with null checks
    const batchData = {
        BatchID: document.getElementById('batch-id')?.value || '',
        Sector: document.getElementById('sector')?.value || '',
        Trade: document.getElementById('trade')?.value || '',
        MaxCapacity: parseInt(document.getElementById('max-capacity')?.value || '30'),
        StartDate: document.getElementById('start-date')?.value || '',
        EndDate: document.getElementById('end-date')?.value || '',
        StartTime: document.getElementById('batchStartTime')?.value || '09:00',
        EndTime: document.getElementById('batchEndTime')?.value || '17:00',
        Faculty: document.getElementById('faculty')?.value || '',
        Status: document.getElementById('batch-status')?.value || 'Upcoming',
        Students: currentBatchStudents,
        Center: currentCenter,
        CreatedDate: new Date().toISOString(),
        LastUpdated: new Date().toISOString()
    };

    console.log('💾 Saving batch data:', batchData);

    // Validate required fields
    if (!batchData.Sector || !batchData.Trade || !batchData.StartDate || !batchData.EndDate) {
        showError('Please fill in all required fields');
        return;
    }

    showLoading('Creating new batch...');

    try {
        const result = await sheetsService.saveBatch(batchData);

        if (result.success) {
            showSuccess('Batch created successfully!');
            closeCreateBatchModal();
            // Refresh batches list
            await loadBatchesFromDatabase();
        } else {
            throw new Error(result.message || 'Failed to create batch');
        }
    } catch (error) {
        console.error('❌ Error creating batch:', error);
        showError('Failed to create batch: ' + error.message);
    }

    hideLoading();
}
// Update the editBatch function to use time validation
function editBatch(batchId) {
    console.log('✏️ Editing batch:', batchId);

    const batch = allBatches.find(b => b.BatchID === batchId);
    if (!batch) {
        showError('Batch not found');
        return;
    }

    // Show the create batch modal first
    showCreateBatchForm();

    // Wait a moment for the modal to render, then populate with existing data
    setTimeout(() => {
        // Populate the create batch form with existing data
        document.getElementById('batch-id').value = batch.BatchID;
        document.getElementById('sector').value = batch.Sector;
        document.getElementById('trade').value = batch.Trade;
        document.getElementById('max-capacity').value = batch.MaxCapacity;
        document.getElementById('start-date').value = formatDateForInput(batch.StartDate);
        document.getElementById('end-date').value = formatDateForInput(batch.EndDate);

        // FIX: Use time validation function
        document.getElementById('batchStartTime').value = validateAndFormatTime(batch.StartTime);
        document.getElementById('batchEndTime').value = validateAndFormatTime(batch.EndTime);

        document.getElementById('faculty').value = batch.Faculty;
        document.getElementById('batch-status').value = batch.Status;

        // Load existing students
        currentBatchStudents = Array.isArray(batch.Students) ? [...batch.Students] : [];
        updateStudentList();

        // Change the title to indicate editing
        const modalTitle = document.querySelector('#createBatchModal h3');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Batch';
        }

        // Change save button text and function
        const saveButton = document.querySelector('#createBatchModal .btn-primary');
        if (saveButton) {
            saveButton.textContent = 'Update Batch';
            saveButton.onclick = function () { updateBatch(batchId); };
        }
    }, 100);
}

// Update batch function - FIXED VERSION
async function updateBatch(batchId) {
    const form = document.getElementById('createBatchForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Use the correct field IDs from your HTML
    const batchData = {
        BatchID: batchId, // Use the existing batch ID
        Sector: document.getElementById('sector').value,
        Trade: document.getElementById('trade').value,
        MaxCapacity: parseInt(document.getElementById('max-capacity').value),
        StartDate: document.getElementById('start-date').value,
        EndDate: document.getElementById('end-date').value,
        StartTime: document.getElementById('batchStartTime').value,
        EndTime: document.getElementById('batchEndTime').value,
        Faculty: document.getElementById('faculty').value,
        Status: document.getElementById('batch-status').value,
        Students: currentBatchStudents,
        Center: currentCenter,
        LastUpdated: new Date().toISOString()
    };

    console.log('💾 Updating batch data:', batchData);

    showLoading('Updating batch...');

    try {
        const result = await sheetsService.saveBatch(batchData);

        if (result.success) {
            showSuccess('Batch updated successfully!');
            closeCreateBatchModal();
            // Refresh batches list
            await loadBatchesFromDatabase();
        } else {
            throw new Error(result.message || 'Failed to update batch');
        }
    } catch (error) {
        console.error('❌ Error updating batch:', error);
        showError('Failed to update batch: ' + error.message);
    }

    hideLoading();
}

// View students for a batch
function viewBatchStudents(batchId) {
    console.log('👥 Viewing students for batch:', batchId);

    const batch = allBatches.find(b => b.BatchID === batchId);
    if (!batch) {
        showError('Batch not found');
        return;
    }

    const students = Array.isArray(batch.Students) ? batch.Students : [];
    const modal = document.getElementById('view-students-modal');
    const studentsList = document.getElementById('batch-students-list');

    if (modal && studentsList) {
        // Update modal title
        const title = document.getElementById('view-students-title');
        if (title) {
            title.textContent = `Students - ${batch.Trade} (${students.length}/${batch.MaxCapacity})`;
        }

        // Populate students list
        if (students.length === 0) {
            studentsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-user-friends"></i>
                        <h4>No Students Enrolled</h4>
                        <p>No students have been added to this batch yet.</p>
                        <button class="btn-primary" onclick="closeViewStudentsModal(); editBatch('${batchId}');">
                            <i class="fas fa-user-plus"></i> Add Students
                        </button>
                    </div>
                `;
        } else {
            let html = `
                    <div class="students-header">
                        <div class="students-count">
                            <i class="fas fa-users"></i>
                            <span>${students.length} students enrolled</span>
                        </div>
                        <button class="btn-secondary" onclick="closeViewStudentsModal(); editBatch('${batchId}');">
                            <i class="fas fa-edit"></i> Manage Students
                        </button>
                    </div>
                    <div class="students-grid">
                `;

            students.forEach((student, index) => {
                html += `
        <div class="student-card">
            <div class="student-avatar">
                <i class="fas fa-user-graduate"></i>
            </div>
            <div class="student-info">
                <h4>${escapeHtml(student.name || 'Unknown Student')}</h4>
                <p class="student-id">ID: ${escapeHtml(student.id || 'N/A')}</p>
                ${student.email ? `<p class="student-email">Email: ${escapeHtml(student.email)}</p>` : ''}
                ${student.phone ? `<p class="student-phone">Phone: ${escapeHtml(student.phone)}</p>` : ''}
                ${student.course ? `<p class="student-course">Course: ${escapeHtml(student.course)}</p>` : ''}
                <p class="student-added">Added: ${formatBatchDate(student.addedDate || '')}</p>
            </div>
            <div class="student-actions">
                <button class="btn-action btn-edit" onclick="showEditStudentModal('${batchId}', ${index})" title="Edit Student">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-remove" onclick="removeStudentFromBatch('${batchId}', ${index})" title="Remove Student">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
            });

            html += `</div>`;
            studentsList.innerHTML = html;
        }

        modal.style.display = 'flex';
    }
}

// Remove student from batch
function removeStudentFromBatch(batchId, studentIndex) {
    if (!confirm('Are you sure you want to remove this student from the batch?')) {
        return;
    }

    const batch = allBatches.find(b => b.BatchID === batchId);
    if (!batch) {
        showError('Batch not found');
        return;
    }

    // Remove student locally
    if (Array.isArray(batch.Students)) {
        batch.Students.splice(studentIndex, 1);

        // Update the batch in Google Sheets
        updateBatchInSheets(batch);

        // Refresh the view
        viewBatchStudents(batchId);
        showSuccess('Student removed from batch');
    }
}

// Update batch in Google Sheets (helper function)
async function updateBatchInSheets(batchData) {
    showLoading('Updating batch...');

    try {
        const result = await sheetsService.saveBatch(batchData);
        if (result.success) {
            console.log('✅ Batch updated in sheets');
            // Refresh the batches list
            await loadBatchesFromDatabase();
        } else {
            throw new Error(result.message || 'Failed to update batch');
        }
    } catch (error) {
        console.error('❌ Error updating batch in sheets:', error);
        showError('Failed to update batch: ' + error.message);
    }

    hideLoading();
}

// Utility function to format date for input field
function formatDateForInput(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch (e) {
        return dateString;
    }
}

// Also update the closeCreateBatchModal function to properly reset to create mode:
function closeCreateBatchModal() {
    console.log('🔒 Closing create batch modal');
    const modal = document.getElementById('createBatchModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('createBatchForm').reset();
        currentBatchStudents = [];
        updateStudentList();

        // Reset modal title and button to create mode
        const modalTitle = modal.querySelector('h3');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Create New Batch';
        }

        const saveButton = modal.querySelector('.btn-primary');
        if (saveButton) {
            saveButton.textContent = 'Save Batch';
            saveButton.onclick = function () { saveBatch(); };
        }
    }
}
// Delete batch
// Delete batch
async function deleteBatch(batchId) {
    if (!confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
        return;
    }

    showLoading('Deleting batch...');

    try {
        const result = await sheetsService.deleteBatch(batchId);

        if (result.success) {
            // Remove from local arrays
            allBatches = allBatches.filter(batch => batch.BatchID !== batchId);
            currentBatches = [...allBatches];

            // Update UI
            displayBatchesTable();
            updateBatchStats();

            showSuccess(result.message || 'Batch deleted successfully!');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error in delete batch process:', error);
        showError('Failed to delete batch: ' + error.message);
    }

    hideLoading();
}

// Utility function to format batch date
function formatBatchDate(dateString) {
    if (!dateString) return 'Not set';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// Close modal function - FIXED VERSION
function closeModal() {
    console.log('🔒 Closing modal...');

    // Close all dynamically created modals (task modals, view batch details, etc.)
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        // Only close modals that are NOT the main create batch or add student modals
        if (!modal.id || (modal.id !== 'createBatchModal' && modal.id !== 'addStudentModal' && modal.id !== 'view-students-modal')) {
            console.log('🗑️ Removing modal:', modal);
            modal.remove();
        }
    });
}
function closeViewStudentsModal() {
    console.log('🔒 Closing view students modal');
    const modal = document.getElementById('view-students-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}
// Add this validation helper function
function validateTimeInput(timeString) {
    if (!timeString) return '09:00';

    // Basic HH:mm format validation
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (timeRegex.test(timeString)) {
        return timeString;
    }

    console.warn('Invalid time format, using default:', timeString);
    return '09:00';
}
// Add this helper function for safe form value access
function getFormValue(elementId, defaultValue = '') {
    const element = document.getElementById(elementId);
    return element ? element.value : defaultValue;
}

// Update your form data collection to use this helper
const batchData = {
    BatchID: getFormValue('batch-id'),
    Sector: getFormValue('sector'),
    Trade: getFormValue('trade'),
    MaxCapacity: parseInt(getFormValue('max-capacity', '30')),
    StartDate: getFormValue('start-date'),
    EndDate: getFormValue('end-date'),
    StartTime: validateAndFormatTime(getFormValue('batchStartTime')),
    EndTime: validateAndFormatTime(getFormValue('batchEndTime')),
    Faculty: getFormValue('faculty'),
    Status: getFormValue('batch-status', 'Upcoming'),
    Students: currentBatchStudents,
    Center: currentCenter,
    CreatedDate: new Date().toISOString(),
    LastUpdated: new Date().toISOString()
};
// ==================== STUDENT EDIT FUNCTIONALITY ====================

// Show edit student modal
function showEditStudentModal(batchId, studentIndex) {
    const batch = allBatches.find(b => b.BatchID === batchId);
    if (!batch || !batch.Students || !batch.Students[studentIndex]) {
        showError('Student not found');
        return;
    }

    const student = batch.Students[studentIndex];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-edit"></i> Edit Student</h3>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="editStudentForm">
                    <div class="form-group">
                        <label for="editStudentName">Student Name *</label>
                        <input type="text" id="editStudentName" value="${escapeHtml(student.name || '')}" required>
                    </div>
                    <div class="form-group">
                        <label for="editStudentId">Student ID *</label>
                        <input type="text" id="editStudentId" value="${escapeHtml(student.id || '')}" required>
                    </div>
                    <div class="form-group">
                        <label for="editStudentEmail">Email</label>
                        <input type="email" id="editStudentEmail" value="${escapeHtml(student.email || '')}">
                    </div>
                    <div class="form-group">
                        <label for="editStudentPhone">Phone</label>
                        <input type="tel" id="editStudentPhone" value="${escapeHtml(student.phone || '')}">
                    </div>
                    <div class="form-group">
                        <label for="editStudentCourse">Course/Trade</label>
                        <input type="text" id="editStudentCourse" value="${escapeHtml(student.course || student.trade || '')}">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn-danger" onclick="removeStudentFromBatch('${batchId}', ${studentIndex})">
                    <i class="fas fa-trash"></i> Remove
                </button>
                <button class="btn-primary" onclick="updateStudent('${batchId}', ${studentIndex})">
                    <i class="fas fa-save"></i> Update Student
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Update student information
function updateStudent(batchId, studentIndex) {
    const batch = allBatches.find(b => b.BatchID === batchId);
    if (!batch || !batch.Students || !batch.Students[studentIndex]) {
        showError('Student not found');
        return;
    }

    const name = document.getElementById('editStudentName').value.trim();
    const id = document.getElementById('editStudentId').value.trim();

    if (!name || !id) {
        showError('Student Name and ID are required');
        return;
    }

    // Update student data
    batch.Students[studentIndex] = {
        ...batch.Students[studentIndex], // Keep existing data
        name: name,
        id: id,
        email: document.getElementById('editStudentEmail').value.trim(),
        phone: document.getElementById('editStudentPhone').value.trim(),
        course: document.getElementById('editStudentCourse').value.trim(),
        lastUpdated: new Date().toISOString()
    };

    // Update the batch in Google Sheets
    updateBatchInSheets(batch);

    showSuccess('Student information updated successfully!');
    closeModal();

    // Refresh the student view
    setTimeout(() => {
        viewBatchStudents(batchId);
    }, 500);
}

// Enhanced remove student function with confirmation
function removeStudentFromBatch(batchId, studentIndex) {
    const batch = allBatches.find(b => b.BatchID === batchId);
    if (!batch || !batch.Students || !batch.Students[studentIndex]) {
        showError('Student not found');
        return;
    }

    const studentName = batch.Students[studentIndex].name || 'Unknown Student';

    if (!confirm(`Are you sure you want to remove "${studentName}" from this batch? This action cannot be undone.`)) {
        return;
    }

    // Remove student locally
    batch.Students.splice(studentIndex, 1);

    // Update the batch in Google Sheets
    updateBatchInSheets(batch);

    showSuccess('Student removed from batch successfully!');
    closeModal();

    // Refresh the student view
    setTimeout(() => {
        viewBatchStudents(batchId);
    }, 500);
}
// Send batch for admin approval - FIXED VERSION
async function sendForApproval(batchId) {
    if (!confirm('Send this batch for admin approval? Once sent, you cannot edit until approved.')) {
        return;
    }

    showLoading('Sending for admin approval...');

    try {
        const batchData = {
            batchId: batchId,
            center: currentCenter,
            createdBy: 'Staff - ' + currentCenter,
            timestamp: new Date().toISOString()
        };

        console.log('📤 Sending batch for approval:', batchData);

        const result = await sheetsService.sendBatchForApproval(batchData);

        if (result.success) {
            showSuccess('Batch sent for admin approval! You will be notified when approved.');
            // Refresh batches list to show updated status
            await loadBatchesFromDatabase();
        } else {
            throw new Error(result.message || 'Failed to send for approval');
        }
    } catch (error) {
        console.error('Error sending for approval:', error);
        showError('Failed to send for approval: ' + error.message);
    }

    hideLoading();
}// Add this to your initializeBatchManagement function
function initializeBatchManagement() {
    console.log('🚀 Initializing batch management for:', currentCenter);

    const centerNameElement = document.getElementById('currentCenterBatchName');
    if (centerNameElement) {
        centerNameElement.textContent = currentCenter;
    }

    loadBatchesFromDatabase();

    // ADD THIS - Auto refresh every 30 seconds
    setInterval(() => {
        if (document.getElementById('create-batch-content')?.classList.contains('active')) {
            console.log('🔄 Auto-refreshing batches...');
            loadBatchesFromDatabase();
        }
    }, 30000);
}
// ==================== BATCH APPROVAL AUTO-REFRESH ====================

let batchPollingInterval = null;

function startBatchAutoRefresh() {
    console.log('🔄 Starting batch auto-refresh...');

    // Clear any existing interval
    if (batchPollingInterval) {
        clearInterval(batchPollingInterval);
    }

    // Check for updates every 10 seconds when batch management is active
    batchPollingInterval = setInterval(() => {
        if (document.getElementById('create-batch-content')?.classList.contains('active')) {
            console.log('🔄 Auto-checking for batch updates...');
            checkForBatchUpdates();
        }
    }, 10000); // Check every 10 seconds
}

async function checkForBatchUpdates() {
    try {
        const result = await sheetsService.getBatches();

        if (result.success && result.batches) {
            const latestBatches = result.batches;

            // Check if any batch status has changed
            const hasChanges = hasBatchStatusChanged(latestBatches);

            if (hasChanges) {
                console.log('🔄 Batch status changes detected, refreshing...');
                processBatchesData(latestBatches);
                showBatchUpdateNotification();
            }
        }
    } catch (error) {
        console.error('❌ Error checking for batch updates:', error);
    }
}

function hasBatchStatusChanged(latestBatches) {
    if (allBatches.length !== latestBatches.length) return true;

    for (let i = 0; i < latestBatches.length; i++) {
        const latestBatch = latestBatches[i];
        const currentBatch = allBatches.find(b => b.BatchID === latestBatch.BatchID);

        if (!currentBatch) return true;

        const latestStatus = latestBatch.approval_status || latestBatch.ApprovalStatus || 'draft';
        const currentStatus = currentBatch.approval_status || currentBatch.ApprovalStatus || 'draft';

        if (latestStatus !== currentStatus) {
            console.log(`🔄 Status changed for ${latestBatch.BatchID}: ${currentStatus} -> ${latestStatus}`);
            return true;
        }
    }

    return false;
}

function showBatchUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'staff-notification';
    notification.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="background: rgba(255,255,255,0.3); padding: 10px; border-radius: 50%; margin-right: 12px;">
                <i class="fas fa-sync-alt"></i>
            </div>
            <strong style="font-size: 16px;">🔄 Batch Status Updated!</strong>
        </div>
        <div style="font-size: 14px; line-height: 1.5;">
            <div style="margin: 8px 0; opacity: 0.9;">Batch approval status has been updated. Refresh to see changes.</div>
        </div>
        <div style="margin-top: 15px; display: flex; gap: 8px;">
            <button onclick="this.parentElement.parentElement.remove(); loadBatchesFromDatabase()" style="background: #00b894; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; flex: 1;">
                ✅ Refresh Now
            </button>
            <button onclick="this.parentElement.parentElement.remove()" style="background: #ff6b6b; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">
                ❌ Dismiss
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 8000);

    playNotificationSound();
}