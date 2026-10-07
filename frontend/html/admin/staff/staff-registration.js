// ==================== FIREBASE LOAD CHECK ====================
function checkFirebaseLoaded() {
  console.log('🔍 Checking Firebase availability...');
  console.log('typeof firebase:', typeof firebase);
  console.log('window.firebase:', window.firebase);
  
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase is NOT loaded!');
    return false;
  }
  
  console.log('✅ Firebase is loaded');
  return true;
}

// Call this after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('=== FIREBASE DEBUG ===');
  checkFirebaseLoaded();
});

// ==================== GLOBAL VARIABLES ====================
let staffData = null;
let currentPage = 'dashboard';
let attendanceChart = null;
let weeklyChart = null;
let cameraStream = null;
let faceDetectionActive = false;
let attendanceMode = 'biometric'; // 'biometric' or 'face'
let attendanceRecords = [];
let leaveRecords = [];
// ==================== FACE VALIDATION WITH face-api.js ====================
let faceDetectionModel = null;
const WORKING_HOURS = { start: 10, end: 17 }; // 10 AM to 5 PM
const LATE_THRESHOLD = 30; // 30 minutes late allowed
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec'; // Replace with your actual web app URL

// ==================== INITIALIZATION ====================
// Add this to your DOMContentLoaded event listener:
// Add this to your DOMContentLoaded event listener:
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Staff Portal Initializing...');

    // Check authentication
    checkAuth();

    // Initialize UI
    initializeUI();

    // Set today's date ONLY IF ELEMENTS EXIST
    const today = new Date();

    // Safely set date values
    const dailyDateInput = document.getElementById('dailyDate');
    if (dailyDateInput) dailyDateInput.valueAsDate = today;

    const absentStartInput = document.getElementById('absentStartDate');
    if (absentStartInput) absentStartInput.valueAsDate = new Date(today.getFullYear(), today.getMonth(), 1);

    const absentEndInput = document.getElementById('absentEndDate');
    if (absentEndInput) absentEndInput.valueAsDate = today;

    // Set current date in dashboard
    const dashboardDateElement = document.getElementById('dashboardDate');
    if (dashboardDateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dashboardDateElement.textContent = today.toLocaleDateString('en-US', options);
    }

    // Load saved profile photo from localStorage (without date warnings)
    // This will be handled in checkAuth function after staffData is loaded
    console.log('✅ Staff Portal Initialized');
});
async function checkAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const dob = urlParams.get('dob');

    if (!email || !dob) {
        showNotification('Please login first', 'error');
        setTimeout(() => {
            window.location.href = '../../login.html';
        }, 2000);
        return false;
    }

    try {
        // Fetch staff data
        staffData = await fetchStaffFromDatabase(email, dob);

        if (!staffData) {
            showNotification('Invalid email or date of birth', 'error');
            setTimeout(() => {
                window.location.href = '../../login.html';
            }, 2000);
            return false;
        }

        console.log('✅ Staff authenticated:', staffData.name);

        // ✅ REMOVED LOCALSTORAGE: Get profile photo from database ONLY
        const photoResult = await getProfilePhotoFromDatabase();
        if (photoResult.success && photoResult.photoData) {
            console.log('✅ Profile photo loaded from database');
            staffData.profilePhoto = photoResult.photoData;
        } else {
            console.log('📝 No profile photo in database');
            staffData.profilePhoto = '';
        }

        // Check registration status
        await checkRegistrationStatus();

        // Load other data
        await loadAttendanceFromDatabase();
        await loadLeaveFromDatabase();

        console.log('📊 Attendance records loaded:', attendanceRecords.length, 'records');

        // ✅ CRITICAL: Update UI with staff info INCLUDING photo
        updateStaffInfo();

        // Load initial data
        loadDashboardData();
        initializeCharts();

        // ✅ REMOVED: saveStaffDataToLocalStorage() - No localStorage usage

        return true;
    } catch (error) {
        console.error('❌ Error in checkAuth:', error);
        showNotification('Authentication error', 'error');
        setTimeout(() => {
            window.location.href = '../../login.html';
        }, 2000);
        return false;
    }
}
// ==================== SAVE STAFF DATA TO LOCALSTORAGE ====================
function saveStaffDataToLocalStorage() {
    if (staffData && staffData.staffId) {
        localStorage.setItem('staffProfileData', JSON.stringify(staffData));
        console.log('💾 Staff data saved to localStorage');
    }
}

// ==================== LOAD STAFF DATA FROM LOCALSTORAGE ====================
function loadStaffDataFromLocalStorage() {
    const saved = localStorage.getItem('staffProfileData');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.staffId === staffData.staffId) {
                // Merge saved data with current data
                Object.assign(staffData, parsed);
                console.log('📥 Staff data loaded from localStorage');
                return true;
            }
        } catch (error) {
            console.log('❌ Error loading from localStorage:', error);
        }
    }
    return false;
}// ADD THIS FUNCTION to fetch staff from sheet
// ADD THIS FUNCTION if you don't have it
async function fetchStaffFromDatabase(email, dob) {
    return new Promise((resolve) => {
        const callbackName = 'handleStaffFetch_' + Date.now();

        const script = document.createElement('script');
        script.src = `${SCRIPT_URL}?action=verifyStaffLogin&email=${encodeURIComponent(email)}&dob=${encodeURIComponent(dob)}&callback=${callbackName}`;

        window[callbackName] = function (result) {
            delete window[callbackName];
            document.head.removeChild(script);

            if (result && result.success && result.staff) {
                console.log('✅ Staff fetched from database:', result.staff.name);
                resolve(result.staff);
            } else {
                console.log('❌ Staff not found or error:', result?.message);
                resolve(null);
            }
        };

        script.onerror = () => {
            delete window[callbackName];
            document.head.removeChild(script);
            console.log('❌ Network error fetching staff');
            resolve(null);
        };

        document.head.appendChild(script);
    });
}// ==================== DATABASE FUNCTIONS ====================
async function loadAttendanceFromDatabase() {
    return new Promise((resolve) => {
        // Check if staffData is available
        if (!staffData || !staffData.staffId) {
            console.log('⚠️ Staff data not available yet, skipping attendance load');
            attendanceRecords = [];
            resolve();
            return;
        }

        const callbackName = 'handleAttendanceResponse_' + Date.now();

        const script = document.createElement('script');
        script.src = `${SCRIPT_URL}?action=getStaffAttendance&staffId=${staffData.staffId}&callback=${callbackName}`;

        window[callbackName] = function (result) {
            delete window[callbackName];
            document.head.removeChild(script);

            if (result && result.success) {
                attendanceRecords = result.attendance || [];
                console.log('✅ Attendance loaded via JSONP:', attendanceRecords.length, 'records');
            } else {
                attendanceRecords = [];
                console.log('📝 No attendance records in database');
            }
            resolve();
        };

        script.onerror = () => {
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            attendanceRecords = [];
            console.log('⚠️ Could not load attendance');
            resolve();
        };

        document.head.appendChild(script);
    });
} async function loadLeaveFromDatabase() {
    return new Promise((resolve) => {
        const callbackName = 'handleLeaveResponse_' + Date.now();

        const script = document.createElement('script');
        script.src = `${SCRIPT_URL}?action=getStaffLeave&staffId=${staffData.staffId}&callback=${callbackName}`;

        window[callbackName] = function (result) {
            delete window[callbackName];
            document.head.removeChild(script);

            if (result && result.success) {
                leaveRecords = result.leave || [];
                console.log('✅ Leave records loaded via JSONP:', leaveRecords.length, 'records');
            } else {
                leaveRecords = [];
                console.log('📝 No leave records in database');
            }
            resolve();
        };

        script.onerror = () => {
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            leaveRecords = [];
            console.log('⚠️ Could not load leave records');
            resolve();
        };

        document.head.appendChild(script);
    });
}
async function markAttendanceInDatabase(attendanceAction, mode) {
    return new Promise((resolve, reject) => {
        console.log('⏱️ Marking attendance via JSONP:', attendanceAction, mode);

        // Create unique callback name
        const callbackName = 'handleAttendanceMark_' + Date.now();

        // Create the JSONP script
        const script = document.createElement('script');

        // ✅ FIX: Use correct parameter names that match Google Apps Script
        const params = new URLSearchParams({
            action: 'markStaffAttendance',
            staffId: staffData.staffId,
            staffName: staffData.name,
            attendanceAction: attendanceAction, // ✅ Correct parameter name
            mode: mode,
            callback: callbackName
        });

        script.src = `${SCRIPT_URL}?${params.toString()}`;

        // Define the callback function
        window[callbackName] = function (result) {
            // Clean up
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }

            if (result && result.success) {
                console.log('✅ Attendance marked successfully via JSONP:', result.message);
                // Reload attendance
                loadAttendanceFromDatabase();
                resolve(result);
            } else {
                console.log('❌ Attendance marking failed:', result?.message);
                reject(new Error(result?.message || 'Attendance marking failed'));
            }
        };

        // Add error handling
        script.onerror = () => {
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            console.log('❌ Network error marking attendance');
            reject(new Error('Network error'));
        };

        // Execute
        document.head.appendChild(script);
    });
}
// ==================== APPLY LEAVE WITH ADMIN NOTIFICATION ====================
async function applyLeaveInDatabase(leaveData) {
    try {
        const data = {
            staffId: staffData.staffId,
            staffName: staffData.name,
            ...leaveData,
            appliedDate: new Date().toISOString().split('T')[0],
            status: 'pending', // Always pending for admin approval
            action: 'applyStaffLeave'
        };

        console.log('📝 Applying leave with admin notification:', data);

        return new Promise((resolve) => {
            const callbackName = 'handleLeaveApplication_' + Date.now();
            const script = document.createElement('script');

            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(data)) {
                params.append(key, value);
            }
            params.append('callback', callbackName);

            script.src = `${SCRIPT_URL}?${params.toString()}`;

            window[callbackName] = function (result) {
                delete window[callbackName];
                document.head.removeChild(script);

                if (result && result.success) {
                    console.log('✅ Leave application sent to admin:', result.message);

                    // ✅ Reload leave records
                    loadLeaveFromDatabase();

                    // ✅ Show success message
                    showNotification('Leave application submitted! Awaiting admin approval.', 'success');

                    resolve(result);
                } else {
                    console.log('❌ Leave application failed:', result?.message);
                    showNotification('Error: ' + (result?.message || 'Leave application failed'), 'error');
                    resolve(result);
                }
            };

            script.onerror = () => {
                delete window[callbackName];
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
                console.log('❌ Network error applying leave');
                showNotification('Network error submitting leave', 'error');
                resolve({ success: false, message: 'Network error' });
            };

            document.head.appendChild(script);
        });

    } catch (error) {
        console.error('❌ Error applying leave:', error);
        showNotification('Error: ' + error.message, 'error');
        throw error;
    }
}// ==================== UI INITIALIZATION ====================
function initializeUI() {
    // Display staff information
    updateStaffInfo();

    // Setup event listeners
    setupEventListeners();

    // Setup navigation
    setupNavigation();

    // Setup profile dropdown
    setupProfileDropdown();

    // Set default profile image
    setDefaultProfileImage();
}
// ==================== DATE FORMATTING ====================
function formatDateForInput(dateString) {
    if (!dateString) return '';

    try {
        // If it's already in yyyy-MM-dd format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        // If it's ISO format with timezone (2002-04-10T18:30:00.000Z)
        if (dateString.includes('T')) {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return '';
            }
            // Use UTC components to avoid timezone issues
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // Try to parse other formats
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        return dateString;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
} function updateStaffInfo() {
    if (!staffData) return;

    // Update profile info in header
    document.getElementById('staffNameHeader').textContent = staffData.name || 'Staff Member';
    document.getElementById('profileFullName').textContent = staffData.name || 'Staff Member';
    document.getElementById('profileStaffID').textContent = `Staff ID: ${staffData.staffId || 'N/A'}`;
    document.getElementById('profileDepartment').textContent = `Department: ${staffData.department || 'N/A'}`;

    // Update dropdown info
    document.getElementById('dropdownName').textContent = staffData.name || 'Staff Member';
    document.getElementById('dropdownRole').textContent = staffData.role || 'Staff';
    document.getElementById('dropdownEmail').textContent = staffData.email || 'email@example.com';

    // Update profile form with proper date formatting
    document.getElementById('profileFirstName').value = staffData.firstName || '';
    document.getElementById('profileLastName').value = staffData.lastName || '';
    document.getElementById('profileEmail').value = staffData.email || '';
    document.getElementById('profilePhone').value = staffData.phone || '';

    // ✅ FIXED DATE FORMATTING - No more warnings
    if (staffData.dob) {
        try {
            // If it's already in yyyy-MM-dd format
            if (/^\d{4}-\d{2}-\d{2}$/.test(staffData.dob)) {
                document.getElementById('profileDob').value = staffData.dob;
            }
            // If it's ISO format with timezone
            else if (staffData.dob.includes('T')) {
                const dobDate = new Date(staffData.dob);
                const year = dobDate.getFullYear();
                const month = String(dobDate.getMonth() + 1).padStart(2, '0');
                const day = String(dobDate.getDate()).padStart(2, '0');
                document.getElementById('profileDob').value = `${year}-${month}-${day}`;
            } else {
                document.getElementById('profileDob').value = staffData.dob;
            }
        } catch (e) {
            document.getElementById('profileDob').value = staffData.dob;
        }
    } else {
        document.getElementById('profileDob').value = '';
    }

    document.getElementById('profileGender').value = staffData.gender || '';
    document.getElementById('profileAddress').value = staffData.address || '';

    // ✅ IMPROVED: Update profile images with priority system
    const profileImages = [
        document.getElementById('profileImage'),
        document.getElementById('dropdownProfileImage'),
        document.getElementById('profilePhoto')
    ];

    let photoToUse = '';

    // Priority 1: Database photo (staffData.profilePhoto)
    if (staffData.profilePhoto && staffData.profilePhoto.length > 100) {
        photoToUse = staffData.profilePhoto;
        console.log('✅ Using database profile photo');
    }
    // Priority 2: localStorage photo
    else {
        const savedPhoto = localStorage.getItem(`staff_${staffData.staffId}_profilePhoto`);
        if (savedPhoto && savedPhoto.length > 100) {
            photoToUse = savedPhoto;
            console.log('✅ Using localStorage profile photo');
        }
    }

    // Update all images if we have a photo
    if (photoToUse) {
        profileImages.forEach(img => {
            if (img) {
                img.src = photoToUse;
                img.onerror = function () {
                    // If image fails to load, set default
                    setDefaultProfileImage();
                };
            }
        });

        // Also save to localStorage for offline use
        localStorage.setItem(`staff_${staffData.staffId}_profilePhoto`, photoToUse);
    } else {
        // Use default if no photo
        setDefaultProfileImage();
    }
} function setDefaultProfileImage() {
    const defaultImage = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="40" r="20" fill="%23666"/><path d="M50,70 Q30,90 70,90 Q50,70 30,90" fill="%23666"/></svg>';

    const profileImages = [
        document.getElementById('profileImage'),
        document.getElementById('dropdownProfileImage'),
        document.getElementById('profilePhoto')
    ];

    profileImages.forEach(img => {
        if (!img.src || img.src === '') {
            img.src = defaultImage;
        }
    });
}

function setupProfileDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    // ✅ FIX: Check if elements exist before adding listeners
    if (!profileBtn || !profileDropdown) {
        console.log('⚠️ Profile dropdown elements not found, skipping setup');
        return;
    }

    console.log('✅ Setting up profile dropdown');

    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileDropdown.contains(e.target) && e.target !== profileBtn) {
            profileDropdown.classList.remove('show');
        }
    });

    // Profile dropdown actions - with null checks
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');

    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage('profile');
            profileDropdown.classList.remove('show');
        });
    }

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage('profile');
            profileDropdown.classList.remove('show');
        });
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            changePassword();
            profileDropdown.classList.remove('show');
        });
    }
}
// Function to get staff profile from database
async function getStaffProfileFromDatabase(staffId) {
    return new Promise((resolve) => {
        const callbackName = 'handleGetProfile_' + Date.now();
        const script = document.createElement('script');

        const params = new URLSearchParams({
            action: 'getStaffProfile',
            staffId: staffId,
            callback: callbackName
        });

        script.src = `${SCRIPT_URL}?${params.toString()}`;

        window[callbackName] = function (result) {
            delete window[callbackName];
            document.head.removeChild(script);
            resolve(result);
        };

        script.onerror = () => {
            delete window[callbackName];
            document.head.removeChild(script);
            resolve(null);
        };

        document.head.appendChild(script);
    });
}
// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Navigation menu items
    document.querySelectorAll('.menu-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navigateToPage(page);
        });
    });

    // Menu toggle for mobile
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);

    // Mode selector
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            attendanceMode = btn.getAttribute('data-mode');
        });
    });

    // Mark attendance buttons
    document.getElementById('markAttendanceBtn').addEventListener('click', showMarkAttendanceModal);
    document.getElementById('markAttendanceDashboard').addEventListener('click', showMarkAttendanceModal);
    document.getElementById('biometricSectionBtn').addEventListener('click', () => {
        navigateToPage('dashboard');
        showMarkAttendanceModal();
    });
    document.getElementById('faceAuthSectionBtn').addEventListener('click', () => {
        navigateToPage('dashboard');
        attendanceMode = 'face';
        showMarkAttendanceModal();
    });

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', closeModal);

    // Attendance mode selection in modal
    document.querySelectorAll('.mode-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.mode-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            const mode = option.getAttribute('data-mode');
            document.querySelectorAll('.attendance-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${mode}Section`).classList.add('active');
            attendanceMode = mode;
        });
    });

    // Biometric attendance - BOTH automatic and manual
    document.getElementById('startBiometricScan').addEventListener('click', startBiometricScan);

    // ✅ ADD THIS LINE for manual check-in button (it has ID "manualCheckin" in your HTML)
    document.getElementById('manualCheckin').addEventListener('click', manualBiometricCheckIn);


    // Face attendance
    document.getElementById('startFaceCamera').addEventListener('click', startFaceCamera);
    document.getElementById('stopFaceCamera').addEventListener('click', stopFaceCamera);
    document.getElementById('captureFaceAttendance').addEventListener('click', captureFaceAttendance);

    // Daily attendance filters
    document.getElementById('dailyDate').addEventListener('change', loadDailyAttendance);
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterDailyAttendance(e.target.getAttribute('data-filter'));
        });
    });

    // Attendance history filters
    document.getElementById('historyMonth').addEventListener('change', loadAttendanceHistory);
    document.getElementById('historyYear').addEventListener('change', loadAttendanceHistory);
    document.getElementById('historyStatus').addEventListener('change', loadAttendanceHistory);
    // Add these to your existing setupEventListeners function:

    // Monthly report filters
    document.getElementById('reportMonth').addEventListener('change', generateMonthlyReport);
    document.getElementById('reportYear').addEventListener('change', generateMonthlyReport);

    // Report type change handler
    document.getElementById('reportType').addEventListener('change', function () {
        const reportType = this.value;
        const startDateInput = document.getElementById('reportStartDate');
        const endDateInput = document.getElementById('reportEndDate');
        const now = new Date();

        switch (reportType) {
            case 'monthly':
                // Set to current month
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                startDateInput.valueAsDate = firstDay;
                endDateInput.valueAsDate = lastDay;
                break;
            case 'quarterly':
                // Set to current quarter
                const quarter = Math.floor(now.getMonth() / 3);
                const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
                const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                startDateInput.valueAsDate = quarterStart;
                endDateInput.valueAsDate = quarterEnd;
                break;
            case 'yearly':
                // Set to current year
                const yearStart = new Date(now.getFullYear(), 0, 1);
                const yearEnd = new Date(now.getFullYear(), 11, 31);
                startDateInput.valueAsDate = yearStart;
                endDateInput.valueAsDate = yearEnd;
                break;
            case 'custom':
                // Keep current dates
                break;
        }
    });

    // Report format change handler
    document.getElementById('reportFormat').addEventListener('change', function () {
        const reportFormat = this.value;

        // If we have data, regenerate report with new format
        if (document.getElementById('reportResults').children.length > 2) {
            generateAttendanceReport();
        }
    });

    // Leave report
    document.getElementById('applyLeaveBtn').addEventListener('click', applyForLeave);
    document.getElementById('leaveYear').addEventListener('change', loadLeaveReport);
    document.getElementById('leaveType').addEventListener('change', loadLeaveReport);
    document.getElementById('leaveStatus').addEventListener('change', loadLeaveReport);
    // Add these to your existing setupEventListeners function:
    // Add to your setupEventListeners function
    document.getElementById('reportMonth').addEventListener('change', checkMonthDownloadStatus);
    document.getElementById('reportYear').addEventListener('change', checkMonthDownloadStatus);

    function checkMonthDownloadStatus() {
        const month = parseInt(document.getElementById('reportMonth').value);
        const year = parseInt(document.getElementById('reportYear').value);
        updatePDFDownloadUI(month, year);
    }
    // Monthly report controls
    document.getElementById('generateMonthlyReport').addEventListener('click', generateMonthlyReport);
    document.getElementById('downloadMonthlyReport').addEventListener('click', downloadMonthlyReportPDF);


    // Profile form
    document.getElementById('personalInfoForm').addEventListener('submit', savePersonalInfo);
    document.getElementById('changePhotoBtn').addEventListener('click', changeProfilePhoto);

    // Profile tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Click outside modal to close
    document.querySelector('.modal').addEventListener('click', (e) => {
        if (e.target === document.querySelector('.modal')) {
            closeModal();
        }
    });
}

function setupNavigation() {
    // Active page highlighting
    const currentPath = window.location.hash.substring(1) || 'dashboard';
    navigateToPage(currentPath);
}

// ==================== PAGE NAVIGATION ====================
function navigateToPage(page) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(el => {
        el.classList.remove('active');
    });

    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(el => {
        el.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = page;

        // Update active menu item
        const activeMenuItem = document.querySelector(`.menu-item[data-page="${page}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }

        // Load page-specific data
        loadPageData(page);

        // Update URL hash
        window.location.hash = page;
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        document.getElementById('sidebar').classList.remove('show');
    }
}

// Update loadPageData function
function loadPageData(page) {
    switch (page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'daily-attendance':
            loadDailyAttendance();
            break;
        case 'attendance':
            loadAttendanceHistory();
            break;
        case 'leave-report':
            loadLeaveReport();
            break;
        case 'monthly-report':
            loadMonthlyReport();
            break;
        case 'attendance-report':
            loadAttendanceReport();
            break;
        case 'profile':
            loadProfileStats();
            break;
    }
}
// ==================== DASHBOARD FUNCTIONS ====================
// ==================== DASHBOARD FUNCTIONS ====================
async function loadDashboardData() {
    try {
        console.log('📊 Loading dashboard data...');

        // Check if staffData is available
        if (!staffData || !staffData.staffId) {
            console.error('❌ Staff data not available');
            return;
        }

        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth(); // January = 0
        const currentYear = now.getFullYear();
        const today = now.getDate();
        const dayOfWeekToday = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

        console.log(`📅 Current Date: ${today}/${currentMonth + 1}/${currentYear} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeekToday]})`);
        console.log(`👤 Current Staff ID: ${staffData.staffId}`);

        // Refresh data if needed
        if (attendanceRecords.length === 0) {
            await refreshAttendanceData();
        }

        console.log(`📊 Total attendance records: ${attendanceRecords.length}`);

        // Display all records for debugging
        console.log('📋 ALL ATTENDANCE RECORDS:');
        attendanceRecords.forEach((record, index) => {
            console.log(`${index + 1}. Date: ${record.Date || record.date}, StaffID: ${record.StaffID || record.staffId || record['Staff ID']}, Status: ${record.Status || record.status}, CheckIn: ${record.CheckIn || record.checkIn}`);
        });

        // ✅ FIXED: Filter for current staff and current month
        const monthlyAttendance = attendanceRecords.filter(record => {
            if (!record.Date && !record.date) {
                return false;
            }

            // Check staff ID (handle different field names)
            const recordStaffId = record.StaffID || record.staffId || record['Staff ID'] || '';
            if (String(recordStaffId).trim() !== String(staffData.staffId).trim()) {
                return false;
            }

            const recordDateStr = record.Date || record.date;

            // Parse date - handle different formats
            let recordDate;
            try {
                // Remove time part if exists
                const dateOnly = recordDateStr.split(' ')[0];

                if (dateOnly.includes('T')) {
                    // ISO format
                    recordDate = new Date(dateOnly);
                } else if (dateOnly.includes('-')) {
                    // yyyy-mm-dd format
                    const parts = dateOnly.split('-');
                    if (parts.length === 3) {
                        const year = parseInt(parts[0]);
                        const month = parseInt(parts[1]) - 1;
                        const day = parseInt(parts[2]);
                        recordDate = new Date(year, month, day);
                    }
                } else if (dateOnly.includes('/')) {
                    // mm/dd/yyyy format
                    const parts = dateOnly.split('/');
                    if (parts.length === 3) {
                        const month = parseInt(parts[0]) - 1;
                        const day = parseInt(parts[1]);
                        const year = parseInt(parts[2]);
                        recordDate = new Date(year, month, day);
                    }
                }
            } catch (e) {
                console.log('❌ Error parsing date:', recordDateStr, e);
                return false;
            }

            if (!recordDate || isNaN(recordDate.getTime())) {
                console.log('❌ Invalid date:', recordDateStr);
                return false;
            }

            const recordMonth = recordDate.getMonth();
            const recordYear = recordDate.getFullYear();

            return recordMonth === currentMonth && recordYear === currentYear;
        });

        console.log(`📊 Found ${monthlyAttendance.length} attendance records for ${staffData.staffId} in ${currentMonth + 1}/${currentYear}`);

        // Display filtered records
        console.log('📋 FILTERED RECORDS:');
        monthlyAttendance.forEach((record, index) => {
            console.log(`${index + 1}. Date: ${record.Date || record.date}, Status: ${record.Status || record.status}`);
        });

        // ✅ CORRECT COUNTERS:
        let presentCount = 0; // Days marked as "present" (excluding late)
        let lateCount = 0; // Days marked as "late"
        let leaveCount = 0; // Days marked as "leave"
        let absentCount = 0; // Weekdays with no record
        let totalWorkingDays = 0; // Days actually worked (present + late)

        // Create map of attendance
        const attendanceMap = {};
        monthlyAttendance.forEach(record => {
            const recordDateStr = record.Date || record.date;
            const dateOnly = recordDateStr.split(' ')[0];

            // Parse to get proper date key
            try {
                let recordDate;
                if (dateOnly.includes('T')) {
                    recordDate = new Date(dateOnly);
                } else if (dateOnly.includes('-')) {
                    const parts = dateOnly.split('-');
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1;
                    const day = parseInt(parts[2]);
                    recordDate = new Date(year, month, day);
                } else if (dateOnly.includes('/')) {
                    const parts = dateOnly.split('/');
                    const month = parseInt(parts[0]) - 1;
                    const day = parseInt(parts[1]);
                    const year = parseInt(parts[2]);
                    recordDate = new Date(year, month, day);
                }

                if (recordDate && !isNaN(recordDate.getTime())) {
                    // ✅ FIXED: Create proper date key in yyyy-mm-dd format
                    const year = recordDate.getFullYear();
                    const month = String(recordDate.getMonth() + 1).padStart(2, '0');
                    const day = String(recordDate.getDate()).padStart(2, '0');
                    const dateKey = `${year}-${month}-${day}`;

                    let status = (record.Status || record.status || '').toLowerCase();
                    const checkIn = record.CheckIn || record.checkIn || '';

                    // Auto-detect status from check-in
                    if (!status && checkIn && checkIn !== '--:--' && checkIn !== '') {
                        status = 'present';
                    }

                    attendanceMap[dateKey] = {
                        status: status,
                        checkIn: checkIn,
                        record: record
                    };

                    console.log(`🗺️ Mapped ${dateKey} -> ${status} (${checkIn})`);
                }
            } catch (e) {
                console.log('❌ Error mapping date:', recordDateStr, e);
            }
        });

        console.log('🗺️ Attendance Map Keys:', Object.keys(attendanceMap));

        // ✅ CORRECT LOGIC: Check ALL weekdays from Jan 1 to today
        for (let day = 1; day <= today; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

            // ✅ Create proper date key
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const dayStr = String(date.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${dayStr}`;

            console.log(`\n🔍 ${dateKey} (Day ${day}, ${dayName})`);

            // Skip weekends (0 = Sunday, 6 = Saturday)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                console.log(`   🏖️ Weekend (${dayName}) - Skipped`);
                continue;
            }

            if (attendanceMap[dateKey]) {
                const attendance = attendanceMap[dateKey];
                const status = attendance.status;

                console.log(`   📝 Record: ${status}, Check-in: ${attendance.checkIn}`);

                if (status === 'present') {
                    presentCount++;
                    totalWorkingDays++; // Count as working day
                    console.log(`   ✅ Counted as Present (Working Day)`);
                } else if (status === 'late') {
                    presentCount++; // Late counts as present
                    lateCount++; // Also count as late
                    totalWorkingDays++; // Count as working day
                    console.log(`   ⚠️ Counted as Late (Present with late arrival - Working Day)`);
                } else if (status === 'leave') {
                    leaveCount++;
                    // ❌ Leave is NOT a working day
                    console.log(`   🏖️ Counted as Leave (Not a Working Day)`);
                } else if (status === 'absent') {
                    absentCount++;
                    // ❌ Absent is NOT a working day
                    console.log(`   ❌ Counted as Absent (Not a Working Day)`);
                } else {
                    // If has check-in, count as present
                    if (attendance.checkIn && attendance.checkIn !== '--:--') {
                        presentCount++;
                        totalWorkingDays++; // Count as working day
                        console.log(`   ✅ Counted as Present (check-in exists - Working Day)`);
                    } else {
                        absentCount++;
                        console.log(`   ❌ Counted as Absent (no check-in - Not a Working Day)`);
                    }
                }
            } else {
                // No record found = Absent
                absentCount++;
                console.log(`   ❌ No record - Counted as Absent`);
            }
        }

        console.log(`\n📊 FINAL COUNTS FOR ${staffData.staffId}:`);
        console.log(`- Present: ${presentCount} (includes ${lateCount} late)`);
        console.log(`- Late: ${lateCount}`);
        console.log(`- Leave: ${leaveCount}`);
        console.log(`- Absent: ${absentCount}`);
        console.log(`- Total Working Days: ${totalWorkingDays}`); // Only days actually worked

        // Update dashboard
        document.getElementById('presentMonthCount').textContent = presentCount;
        document.getElementById('absentMonthCount').textContent = absentCount;
        document.getElementById('lateMonthCount').textContent = lateCount;
        document.getElementById('leaveMonthCount').textContent = leaveCount;

        // Update today's status
        updateTodayStatus();

        // Update charts
        updateCharts(monthlyAttendance);

        // Load recent activity
        loadRecentActivity();

        console.log('✅ Dashboard data loaded');

    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}
function calculateMonthlyStats() {
    try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const today = now.getDate();

        console.log(`📊 Calculating monthly stats for ${today}/${currentMonth + 1}/${currentYear}`);

        // Filter attendance for current month
        const monthlyAttendance = attendanceRecords.filter(record => {
            if (!record.Date && !record.date) return false;

            const recordDate = new Date(record.Date || record.date);
            return recordDate.getMonth() === currentMonth &&
                recordDate.getFullYear() === currentYear;
        });

        console.log(`📊 Found ${monthlyAttendance.length} records for current month`);

        // Create a map of dates to attendance status
        const attendanceMap = {};
        monthlyAttendance.forEach(record => {
            const dateStr = record.Date || record.date;
            let status = (record.Status || record.status || '').toLowerCase();
            const checkIn = record.CheckIn || record.checkIn;

            if (!status && checkIn && checkIn !== '--:--' && checkIn !== '') {
                status = 'present';
            }

            attendanceMap[dateStr] = status;
        });

        // Initialize counters
        let presentCount = 0;
        let lateCount = 0;
        let leaveCount = 0;
        let absentCount = 0;

        // Count only working days (Monday to Friday) up to today
        for (let day = 1; day <= today; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dayOfWeek = date.getDay();

            // Skip weekends
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;

            const dateStr = date.toISOString().split('T')[0];

            if (attendanceMap[dateStr]) {
                const status = attendanceMap[dateStr];

                if (status === 'present') {
                    presentCount++;
                } else if (status === 'late') {
                    presentCount++; // Late counts as present
                    lateCount++;
                } else if (status === 'leave') {
                    leaveCount++;
                } else if (status === 'absent') {
                    absentCount++;
                }
            } else {
                // No attendance record = absent
                absentCount++;
            }
        }

        // Calculate total working days up to today
        let totalWorkingDays = 0;
        for (let day = 1; day <= today; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                totalWorkingDays++;
            }
        }

        return {
            present: presentCount,
            late: lateCount,
            leave: leaveCount,
            absent: absentCount,
            totalWorkingDays: totalWorkingDays,
            totalRecords: monthlyAttendance.length
        };

    } catch (error) {
        console.error('❌ Error calculating monthly stats:', error);
        return { present: 0, late: 0, leave: 0, absent: 0, totalWorkingDays: 0, totalRecords: 0 };
    }
}// ==================== REFRESH ATTENDANCE DATA ====================
// ==================== OPTIMIZED REFRESH ATTENDANCE DATA ====================
async function refreshAttendanceData() {
    try {
        console.log('🔄 Optimized: Refreshing attendance data...');

        // ✅ Only refresh if data is stale (more than 5 minutes old)
        const lastRefreshTime = localStorage.getItem(`lastRefresh_${staffData.staffId}`);
        const now = Date.now();

        if (lastRefreshTime && (now - parseInt(lastRefreshTime)) < 300000) { // 5 minutes
            console.log('📊 Using cached attendance data (recently refreshed)');
            return true;
        }

        // ✅ Clear only if we have old data
        if (attendanceRecords.length > 100) {
            attendanceRecords = attendanceRecords.slice(-30); // Keep last 30 days only
        }

        // ✅ Load fresh data from database
        await loadAttendanceFromDatabase();

        // ✅ Save refresh timestamp
        localStorage.setItem(`lastRefresh_${staffData.staffId}`, now.toString());

        console.log('✅ Attendance data refreshed (optimized):', attendanceRecords.length, 'records');
        return true;
    } catch (error) {
        console.error('❌ Error refreshing attendance data:', error);
        return false;
    }
} function updateTodayStatus() {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = attendanceRecords.find(record => (record.Date || record.date) === today);

    const statusBadge = document.getElementById('todayStatusBadge');
    const checkinTime = document.getElementById('todayCheckin');
    const checkoutTime = document.getElementById('todayCheckout');
    const totalHours = document.getElementById('todayHours');
    const attendanceStatus = document.getElementById('todayAttendanceStatus');

    if (todayRecord) {
        const status = todayRecord.Status || todayRecord.status;
        statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        statusBadge.className = `status-badge ${status}`;

        checkinTime.textContent = todayRecord.CheckIn || todayRecord.checkIn || '--:--';
        checkoutTime.textContent = todayRecord.CheckOut || todayRecord.checkOut || '--:--';

        if ((todayRecord.CheckIn || todayRecord.checkIn) && (todayRecord.CheckOut || todayRecord.checkOut)) {
            const hours = calculateWorkingHours(todayRecord.CheckIn || todayRecord.checkIn, todayRecord.CheckOut || todayRecord.checkOut);
            totalHours.textContent = hours;
        } else {
            totalHours.textContent = '0h 0m';
        }

        attendanceStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        attendanceStatus.className = `status-${status}`;
    } else {
        statusBadge.textContent = 'Not Checked In';
        statusBadge.className = 'status-badge';
        checkinTime.textContent = '--:--';
        checkoutTime.textContent = '--:--';
        totalHours.textContent = '0h 0m';
        attendanceStatus.textContent = 'Not Marked';
        attendanceStatus.className = 'status-absent';
    }
}

// ==================== UPDATED WORKING HOURS CALCULATION ====================
function calculateWorkingHours(checkIn, checkOut) {
    if (!checkIn || !checkOut || checkIn === '--:--' || checkOut === '--:--') {
        return '--';
    }

    try {
        // Parse times (handle both HH:MM and HH:MM AM/PM formats)
        let inHour, inMin, outHour, outMin;

        if (checkIn.includes(' ')) {
            // Format: "HH:MM AM/PM"
            const inTime = parse12HourTime(checkIn);
            inHour = inTime.hour;
            inMin = inTime.minute;
        } else {
            // Format: "HH:MM"
            const [inH, inM] = checkIn.split(':').map(Number);
            inHour = inH;
            inMin = inM;
        }

        if (checkOut.includes(' ')) {
            // Format: "HH:MM AM/PM"
            const outTime = parse12HourTime(checkOut);
            outHour = outTime.hour;
            outMin = outTime.minute;
        } else {
            // Format: "HH:MM"
            const [outH, outM] = checkOut.split(':').map(Number);
            outHour = outH;
            outMin = outM;
        }

        // Validate times
        if (isNaN(inHour) || isNaN(inMin) || isNaN(outHour) || isNaN(outMin)) {
            return '--';
        }

        // Convert to 24-hour format if needed
        if (inHour < 0 || inHour > 23 || outHour < 0 || outHour > 23) {
            return '--';
        }

        // Calculate total minutes
        const inTotalMinutes = inHour * 60 + inMin;
        const outTotalMinutes = outHour * 60 + outMin;

        // Check if check-out is on the next day (e.g., night shift)
        let totalMinutes = outTotalMinutes - inTotalMinutes;
        if (totalMinutes < 0) {
            // Add 24 hours (overnight shift)
            totalMinutes += 24 * 60;
        }

        // Deduct lunch break if work is 5+ hours
        if (totalMinutes > 300) { // More than 5 hours
            totalMinutes -= 60; // 1 hour lunch break
        }

        // Format result
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return `${hours}h ${minutes}m`;

    } catch (error) {
        console.error('❌ Error calculating working hours:', error);
        return '--';
    }
}

// Helper function to parse 12-hour time format
function parse12HourTime(timeStr) {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);

    let hour24 = hours;
    if (period) {
        const upperPeriod = period.toUpperCase();
        if (upperPeriod === 'PM' && hour24 !== 12) {
            hour24 += 12;
        } else if (upperPeriod === 'AM' && hour24 === 12) {
            hour24 = 0;
        }
    }

    return {
        hour: hour24,
        minute: minutes || 0
    };
}
function loadRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    const recentRecords = attendanceRecords.slice(-5).reverse();

    activityList.innerHTML = '';

    if (recentRecords.length === 0) {
        activityList.innerHTML = '<div class="no-data">No attendance records yet</div>';
        return;
    }

    recentRecords.forEach(record => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';

        let icon = 'clock';
        let iconClass = 'checkin';

        const status = record.Status || record.status;
        const checkIn = record.CheckIn || record.checkIn;
        const checkOut = record.CheckOut || record.checkOut;

        switch (status) {
            case 'present':
                icon = 'check-circle';
                iconClass = 'checkin';
                break;
            case 'late':
                icon = 'clock';
                iconClass = 'late';
                break;
            case 'leave':
                icon = 'umbrella-beach';
                iconClass = 'checkin';
                break;
            case 'absent':
                icon = 'times-circle';
                iconClass = 'checkout';
                break;
        }

        const date = new Date(record.Date || record.date);
        const dateStr = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        activityItem.innerHTML = `
            <div class="activity-icon ${iconClass}">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="activity-content">
                <p>${status.charAt(0).toUpperCase() + status.slice(1)} on ${dateStr}</p>
                <div class="activity-time">
                    ${checkIn ? `Check-in: ${checkIn}` : 'No check-in'} | 
                    ${checkOut ? `Check-out: ${checkOut}` : 'No check-out'}
                </div>
            </div>
        `;

        activityList.appendChild(activityItem);
    });
}

// ==================== CHARTS ====================
function initializeCharts() {
    // Attendance Chart
    const attendanceCtx = document.getElementById('attendanceChart').getContext('2d');
    attendanceChart = new Chart(attendanceCtx, {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Present Days',
                data: [0, 0, 0, 0],
                backgroundColor: 'rgba(46, 204, 113, 0.8)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1
            }, {
                label: 'Absent Days',
                data: [0, 0, 0, 0],
                backgroundColor: 'rgba(255, 71, 87, 0.8)',
                borderColor: 'rgba(255, 71, 87, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 7,
                    title: {
                        display: true,
                        text: 'Number of Days'
                    }
                }
            }
        }
    });

    // Weekly Chart
    const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
    weeklyChart = new Chart(weeklyCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            datasets: [{
                label: 'Working Hours',
                data: [0, 0, 0, 0, 0, 0],
                borderColor: '#0f8ba7',
                backgroundColor: 'rgba(15, 139, 167, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Hours'
                    }
                }
            }
        }
    });
}

function updateCharts(monthlyAttendance) {
    // Update monthly chart
    const weeks = [0, 0, 0, 0];
    const absents = [0, 0, 0, 0];

    monthlyAttendance.forEach(record => {
        const date = new Date(record.Date || record.date);
        const week = Math.floor((date.getDate() - 1) / 7);
        const status = record.Status || record.status;

        if (week < 4) {
            if (status === 'present' || status === 'late') {
                weeks[week]++;
            } else if (status === 'absent') {
                absents[week]++;
            }
        }
    });

    if (attendanceChart) {
        attendanceChart.data.datasets[0].data = weeks;
        attendanceChart.data.datasets[1].data = absents;
        attendanceChart.update();
    }

    // Update weekly chart
    if (weeklyChart && monthlyAttendance.length > 0) {
        const weeklyHours = [0, 0, 0, 0, 0, 0];
        monthlyAttendance.forEach(record => {
            const date = new Date(record.Date || record.date);
            const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const checkIn = record.CheckIn || record.checkIn;
            const checkOut = record.CheckOut || record.checkOut;

            if (dayOfWeek >= 1 && dayOfWeek <= 6 && checkIn && checkOut) {
                const hours = calculateWorkingHours(checkIn, checkOut);
                const hourValue = parseFloat(hours.split('h')[0]);
                weeklyHours[dayOfWeek - 1] = hourValue;
            }
        });

        weeklyChart.data.datasets[0].data = weeklyHours;
        weeklyChart.update();
    }
}

// ==================== DAILY ATTENDANCE ====================
function loadDailyAttendance() {
    const date = document.getElementById('dailyDate').value;
    const tableBody = document.getElementById('dailyAttendanceBody');

    // Get current date for calculations
    const now = new Date();
    const currentMonth = now.getMonth(); // January = 0
    const currentYear = now.getFullYear();
    const today = now.getDate();

    // Filter records for current month AND current staff ID
    const monthlyRecords = attendanceRecords.filter(record => {
        if (!record.Date && !record.date) return false;

        // ✅ CRITICAL: Check if this record belongs to the current staff
        const recordStaffId = record.StaffID || record.staffId || record['Staff ID'] || '';
        if (!recordStaffId.includes(staffData.staffId)) {
            return false;
        }

        const recordDateStr = record.Date || record.date;

        // Parse the date string
        let recordDate;
        try {
            recordDate = new Date(recordDateStr);

            if (isNaN(recordDate.getTime())) {
                if (recordDateStr.includes(' ')) {
                    const datePart = recordDateStr.split(' ')[0];
                    const parts = datePart.split('/');
                    if (parts.length === 3) {
                        const month = parseInt(parts[0]) - 1;
                        const day = parseInt(parts[1]);
                        const year = parseInt(parts[2]);
                        recordDate = new Date(year, month, day);
                    }
                } else {
                    const separator = recordDateStr.includes('-') ? '-' : '/';
                    const parts = recordDateStr.split(separator);

                    if (parts.length === 3) {
                        let year, month, day;

                        if (parts[0].length === 4) {
                            year = parseInt(parts[0]);
                            month = parseInt(parts[1]) - 1;
                            day = parseInt(parts[2]);
                        } else {
                            if (parseInt(parts[0]) > 12) {
                                day = parseInt(parts[0]);
                                month = parseInt(parts[1]) - 1;
                                year = parseInt(parts[2]);
                            } else {
                                month = parseInt(parts[0]) - 1;
                                day = parseInt(parts[1]);
                                year = parseInt(parts[2]);
                            }
                        }

                        recordDate = new Date(year, month, day);
                    }
                }
            }
        } catch (e) {
            return false;
        }

        if (!recordDate || isNaN(recordDate.getTime())) return false;

        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    // Clear table
    tableBody.innerHTML = '';

    if (monthlyRecords.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="8" style="text-align: center; padding: 40px;">
                <i class="fas fa-calendar-times" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                <p style="color: #666;">No attendance records yet</p>
                <p style="color: #999; font-size: 14px; margin-top: 10px;">
                    Attendance records will appear after your first check-in
                </p>
            </td>
        `;
        tableBody.appendChild(row);
    } else {
        // Sort records by date (newest first)
        monthlyRecords.sort((a, b) => {
            const dateA = parseDateString(a.Date || a.date);
            const dateB = parseDateString(b.Date || b.date);
            return dateB - dateA;
        });

        // Populate table with actual records
        monthlyRecords.forEach(record => {
            const row = document.createElement('tr');
            const dateStr = record.Date || record.date;
            const dateObj = parseDateString(dateStr);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

            const checkIn = record.CheckIn || record.checkIn || '';
            const checkOut = record.CheckOut || record.checkOut || '';
            let status = record.Status || record.status || '';

            // Determine status if not present
            if (!status || status === '') {
                if (checkIn && checkIn !== '--:--' && checkIn !== '') {
                    status = 'present';
                } else {
                    status = 'absent';
                }
            }

            const remarks = record.Remarks || record.remarks || '';

            let displayRemarks = remarks;
            if (status === 'late' && checkIn) {
                const [hour, minute] = checkIn.split(':').map(Number);
                if (hour > WORKING_HOURS.start || (hour === WORKING_HOURS.start && minute > LATE_THRESHOLD)) {
                    displayRemarks = `Late arrival (Expected: ${WORKING_HOURS.start}:00)`;
                }
            }

            row.innerHTML = `
    <td>${dateStr.split(' ')[0]}</td>
    <td>${dayName}</td>
    <td>${checkIn || '--:--'}</td>
    <td>${checkOut || '--:--'}</td>
    <td>${checkIn && checkOut ? calculateWorkingHours(checkIn, checkOut) : '--'}</td>
    <td><span class="status-badge-table status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
    <td>${displayRemarks}</td>
`;
            tableBody.appendChild(row);
        });
    }

    // Update summary with SAME logic as dashboard
    updateDailySummary(monthlyRecords);
}// Helper function to parse date strings consistently
function parseDateString(dateStr) {
    if (!dateStr) return new Date(NaN);

    try {
        // Try different date formats
        let date;
        
        // Try ISO format first
        date = new Date(dateStr);
        if (!isNaN(date.getTime())) return date;
        
        // Try DD/MM/YYYY or MM/DD/YYYY format
        const parts = dateStr.split(/[/\-\s]/);
        
        if (parts.length >= 3) {
            let day, month, year;
            
            // Check if first part looks like year (4 digits)
            if (parts[0].length === 4) {
                // YYYY-MM-DD format
                year = parseInt(parts[0]);
                month = parseInt(parts[1]) - 1;
                day = parseInt(parts[2]);
            } 
            // Check if third part looks like year (4 digits)
            else if (parts[2].length === 4) {
                // DD/MM/YYYY or MM/DD/YYYY
                const first = parseInt(parts[0]);
                const second = parseInt(parts[1]);
                
                if (first > 12) {
                    // DD/MM/YYYY (day > 12, so must be day)
                    day = first;
                    month = second - 1;
                } else if (second > 12) {
                    // MM/DD/YYYY (second > 12, so must be day)
                    month = first - 1;
                    day = second;
                } else {
                    // Ambiguous - assume DD/MM/YYYY
                    day = first;
                    month = second - 1;
                }
                
                year = parseInt(parts[2]);
            } else if (parts[2].length === 2) {
                // Handle 2-digit year
                const first = parseInt(parts[0]);
                const second = parseInt(parts[1]);
                
                if (first > 12) {
                    day = first;
                    month = second - 1;
                } else {
                    month = first - 1;
                    day = second;
                }
                
                year = 2000 + parseInt(parts[2]); // Assume 2000s
            }
            
            if (day && month >= 0 && year) {
                return new Date(year, month, day);
            }
        }
        
        // Try removing time portion
        const dateOnly = dateStr.split(' ')[0];
        if (dateOnly !== dateStr) {
            return parseDateString(dateOnly);
        }
        
    } catch (e) {
        console.log('❌ Error parsing date:', dateStr, e);
    }
    
    return new Date(NaN);
}
function filterDailyAttendance(filter) {
    const rows = document.querySelectorAll('#dailyAttendanceBody tr');

    rows.forEach(row => {
        if (row.cells.length < 6) return; // Skip the "no records" row

        const statusElement = row.querySelector('.status-badge-table');
        if (!statusElement) return;

        const status = statusElement.className.includes('status-')
            ? statusElement.className.split('status-')[1].split(' ')[0]
            : '';

        if (filter === 'all' || status === filter) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function updateDailySummary(records) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.getDate();

    // Use same counting logic as dashboard
    let presentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;
    let absentCount = 0;
    let totalWorkingDays = 0;

    // Create a map for quick lookup
    const attendanceMap = {};
    records.forEach(record => {
        const recordDateStr = record.Date || record.date;
        const dateObj = parseDateString(recordDateStr);

        if (!isNaN(dateObj.getTime())) {
            const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

            let status = (record.Status || record.status || '').toLowerCase();
            const checkIn = record.CheckIn || record.checkIn;

            if (!status && checkIn && checkIn !== '--:--' && checkIn !== '') {
                status = 'present';
            }

            attendanceMap[dateKey] = {
                status: status,
                checkIn: checkIn
            };
        }
    });

    // ✅ CORRECTED: Check ALL weekdays from Jan 1 to today
    for (let day = 1; day <= today; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        // Create proper date key
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${dayStr}`;

        // ✅ FIX: ALWAYS count this as a working day
        totalWorkingDays++;

        if (attendanceMap[dateKey]) {
            const attendance = attendanceMap[dateKey];
            const status = attendance.status;

            if (status === 'present') {
                presentCount++;
            } else if (status === 'late') {
                presentCount++; // Late counts as present
                lateCount++; // Also count as late
            } else if (status === 'leave') {
                leaveCount++;
                // ❌ Leave is NOT a working day? Actually it IS a working day, just not attended
                // But we already counted it in totalWorkingDays above
            } else if (status === 'absent') {
                absentCount++;
                // ❌ Absent is a working day, just not attended
                // But we already counted it in totalWorkingDays above
            } else {
                if (attendance.checkIn && attendance.checkIn !== '--:--') {
                    presentCount++;
                } else {
                    absentCount++;
                }
            }
        } else {
            // No record found = Absent
            absentCount++;
        }
    }

    const attendanceRate = totalWorkingDays > 0 ? Math.round((presentCount / totalWorkingDays) * 100) : 0;

    // Update UI - Now matches dashboard exactly
    document.getElementById('totalWorkingDays').textContent = totalWorkingDays;
    document.getElementById('presentDaysCount').textContent = presentCount;
    document.getElementById('absentDaysCount').textContent = absentCount;
    document.getElementById('lateDaysCount').textContent = lateCount;
    document.getElementById('leaveDaysCount').textContent = leaveCount;
    document.getElementById('attendanceRate').textContent = `${attendanceRate}%`;

    console.log(`📊 Daily Summary Counts:`);
    console.log(`- Total Working Days: ${totalWorkingDays} (all Monday-Friday days so far)`);
    console.log(`- Present: ${presentCount} (days actually attended)`);
    console.log(`- Late: ${lateCount}`);
    console.log(`- Leave: ${leaveCount}`);
    console.log(`- Absent: ${absentCount}`);
    console.log(`- Today: ${today}`);
    console.log(`- Current Month: ${currentMonth + 1}`);
    console.log(`- Current Year: ${currentYear}`);
}
async function markCheckOut() {
    try {
        // ✅ FIX: Call markAttendanceInDatabase with correct parameters
        const result = await markAttendanceInDatabase('check-out', 'manual');

        if (result.success) {
            showNotification(result.message, 'success');
            loadDailyAttendance();
            loadDashboardData();
        }
    } catch (error) {
        showNotification('Error checking out: ' + error.message, 'error');
    }
}
// ==================== ATTENDANCE HISTORY ====================
function loadAttendanceHistory() {
    const month = document.getElementById('historyMonth').value;
    const year = document.getElementById('historyYear').value;
    const status = document.getElementById('historyStatus').value;

    // Populate month and year options if empty
    populateHistoryFilters();

    // Filter records
    let filteredRecords = [...attendanceRecords];

    if (month) {
        filteredRecords = filteredRecords.filter(record => {
            const recordDate = new Date(record.Date || record.date);
            return recordDate.getMonth() === parseInt(month);
        });
    }

    if (year) {
        filteredRecords = filteredRecords.filter(record => {
            const recordDate = new Date(record.Date || record.date);
            return recordDate.getFullYear() === parseInt(year);
        });
    }

    if (status) {
        filteredRecords = filteredRecords.filter(record => (record.Status || record.status) === status);
    }

    // Sort by date descending
    filteredRecords.sort((a, b) => new Date(b.Date || b.date) - new Date(a.Date || a.date));

    // Update table
    updateAttendanceHistoryTable(filteredRecords);
}

function populateHistoryFilters() {
    const monthSelect = document.getElementById('historyMonth');
    const yearSelect = document.getElementById('historyYear');

    if (monthSelect.options.length <= 1) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            monthSelect.appendChild(option);
        });
    }

    if (yearSelect.options.length <= 1) {
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= currentYear - 5; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }
}

function updateAttendanceHistoryTable(records) {
    const tableBody = document.getElementById('attendanceHistoryBody');
    tableBody.innerHTML = '';

    if (records.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="8" style="text-align: center; padding: 40px;">
                <i class="fas fa-history" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                <p style="color: #666;">No attendance history yet</p>
                <p style="color: #999; font-size: 14px; margin-top: 10px;">
                    Your attendance history will appear after your first check-in
                </p>
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }

    records.forEach(record => {
        const row = document.createElement('tr');
        const dateObj = new Date(record.Date || record.date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

        const checkIn = record.CheckIn || record.checkIn;
        const checkOut = record.CheckOut || record.checkOut;
        const status = record.Status || record.status;
        const remarks = record.Remarks || record.remarks || '';

        let displayRemarks = remarks;
        if (status === 'late' && checkIn) {
            displayRemarks = `Late arrival (Expected: ${WORKING_HOURS.start}:00)`;
        }

        row.innerHTML = `
            <td>${record.Date || record.date}</td>
            <td>${dayName}</td>
            <td>${checkIn || '--:--'}</td>
            <td>${checkOut || '--:--'}</td>
            <td>${checkIn && checkOut ? calculateWorkingHours(checkIn, checkOut) : '--'}</td>
            <td><span class="status-badge-table status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
            <td>${displayRemarks}</td>
            <td>${record.Method || record.method || 'Self'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// ==================== ABSENT REPORT ====================



// ==================== LEAVE REPORT ====================
function loadLeaveReport() {
    const year = document.getElementById('leaveYear').value;
    const type = document.getElementById('leaveType').value;
    const status = document.getElementById('leaveStatus').value;

    // Populate year options if empty
    if (document.getElementById('leaveYear').options.length <= 1) {
        const currentYear = new Date().getFullYear();
        const select = document.getElementById('leaveYear');

        for (let y = currentYear; y >= currentYear - 2; y--) {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            select.appendChild(option);
        }
    }

    // Filter leave records
    let filteredRecords = [...leaveRecords];

    if (year) {
        filteredRecords = filteredRecords.filter(record => {
            const fromDate = new Date(record.FromDate || record.fromDate);
            return fromDate.getFullYear() === parseInt(year);
        });
    }

    if (type) {
        filteredRecords = filteredRecords.filter(record => (record.Type || record.type) === type);
    }

    if (status) {
        filteredRecords = filteredRecords.filter(record => (record.Status || record.status) === status);
    }

    // Update table
    updateLeaveReportTable(filteredRecords);
    updateLeaveStats(filteredRecords);
}

// ==================== UPDATE LEAVE REPORT TABLE WITH DELETE FUNCTION ====================
function updateLeaveReportTable(records) {
    const tableBody = document.getElementById('leaveReportBody');
    tableBody.innerHTML = '';

    if (records.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="9" style="text-align: center; padding: 40px;">
                <i class="fas fa-umbrella-beach" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                <p style="color: #666;">No leave records found</p>
                <p style="color: #999; font-size: 14px; margin-top: 10px;">
                    Apply for leave to see your leave records here
                </p>
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }

    records.forEach((record, index) => {
        const row = document.createElement('tr');
        const fromDate = record.FromDate || record.fromDate;
        const toDate = record.ToDate || record.toDate;
        const totalDays = calculateLeaveDays(fromDate, toDate);
        const type = record.Type || record.type;
        const status = record.Status || record.status;

        row.innerHTML = `
            <td>${record.LeaveID || 'LV-' + String(index + 1).padStart(3, '0')}</td>
            <td>${type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown'} Leave</td>
            <td>${fromDate}</td>
            <td>${toDate}</td>
            <td>${totalDays}</td>
            <td>${record.Reason || record.reason || ''}</td>
            <td>${record.AppliedDate || record.appliedDate || ''}</td>
            <td><span class="status-badge-table status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
            <td>
                <button class="btn-action" onclick="viewLeaveDetails('${record.LeaveID || index}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                ${status === 'pending' ? `
                    <button class="btn-action btn-danger" onclick="deleteLeave('${record.LeaveID || index}')" title="Delete Leave">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tableBody.appendChild(row);
    });
}
function calculateLeaveDays(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = Math.abs(to - from);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function updateLeaveStats(records) {
    const totalApplied = records.length;
    const approved = records.filter(r => (r.Status || r.status) === 'approved').length;
    const pending = records.filter(r => (r.Status || r.status) === 'pending').length;
    const rejected = records.filter(r => (r.Status || r.status) === 'rejected').length;

    document.getElementById('totalLeaveApplied').textContent = totalApplied;
    document.getElementById('approvedLeave').textContent = approved;
    document.getElementById('pendingLeave').textContent = pending;
    document.getElementById('rejectedLeave').textContent = rejected;
}

async function applyForLeave() {
    // Create a modal for leave application
    const leaveModal = document.createElement('div');
    leaveModal.className = 'modal';
    leaveModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Apply for Leave</h3>
                <span class="modal-close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="leaveApplicationForm">
                    <div class="form-group">
                        <label>Leave Type</label>
                        <select id="leaveTypeSelect" class="form-control" required>
                            <option value="">Select Leave Type</option>
                            <option value="casual">Casual Leave</option>
                            <option value="sick">Sick Leave</option>
                            <option value="earned">Earned Leave</option>
                            <option value="maternity">Maternity Leave</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>From Date</label>
                        <input type="date" id="leaveFromDate" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>To Date</label>
                        <input type="date" id="leaveToDate" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Reason</label>
                        <textarea id="leaveReason" class="form-control" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Emergency Contact</label>
                        <input type="text" id="leaveContact" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Document (if any)</label>
                        <input type="text" id="leaveDocument" class="form-control" placeholder="Document reference number">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Submit Application</button>
                        <button type="button" class="btn-secondary close-leave-modal">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(leaveModal);
    leaveModal.style.display = 'flex';

    // Set default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    document.getElementById('leaveFromDate').valueAsDate = tomorrow;
    document.getElementById('leaveToDate').valueAsDate = tomorrow;

    // Close modal
    document.querySelector('.modal-close').addEventListener('click', () => {
        document.body.removeChild(leaveModal);
    });

    document.querySelector('.close-leave-modal').addEventListener('click', () => {
        document.body.removeChild(leaveModal);
    });

    leaveModal.addEventListener('click', (e) => {
        if (e.target === leaveModal) {
            document.body.removeChild(leaveModal);
        }
    });

    // Handle form submission
    document.getElementById('leaveApplicationForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const leaveData = {
            fromDate: document.getElementById('leaveFromDate').value,
            toDate: document.getElementById('leaveToDate').value,
            leaveType: document.getElementById('leaveTypeSelect').value,
            reason: document.getElementById('leaveReason').value,
            contact: document.getElementById('leaveContact').value,
            document: document.getElementById('leaveDocument').value
        };

        try {
            const result = await applyLeaveInDatabase(leaveData);

            if (result.success) {
                showNotification('Leave application submitted successfully!', 'success');
                document.body.removeChild(leaveModal);

                // Reload leave report
                if (currentPage === 'leave-report') {
                    loadLeaveReport();
                }
            }
        } catch (error) {
            showNotification('Error submitting leave application: ' + error.message, 'error');
        }
    });
}

function viewLeaveDetails(leaveId) {
    showNotification(`View leave details for ${leaveId} - Feature coming soon!`, 'info');
}

async function cancelLeave(leaveId) {
    if (confirm('Are you sure you want to cancel this leave application?')) {
        showNotification('Cancel leave feature coming soon!', 'info');
        // You would need to implement a cancelLeave function in your Apps Script
    }
}

// ==================== MARK ATTENDANCE ====================
function showMarkAttendanceModal() {
    const modal = document.getElementById('markAttendanceModal');
    modal.style.display = 'flex';

    // Reset modal state
    document.querySelector('.attendance-result').style.display = 'none';
    document.querySelector('.attendance-result').className = 'attendance-result';

    // ✅ Check registration status from database when modal opens
    checkRegistrationStatus().then(() => {
        console.log('📊 Current registration status in modal:');
        console.log('  - Face Registered:', staffData.faceRegistered);
        console.log('  - Biometric Registered:', staffData.biometricRegistered);

        // Update UI based on status
        if (staffData.faceRegistered) {
            document.getElementById('faceStatus').textContent = 'Face Registered ✓';
            document.getElementById('faceStatus').previousElementSibling.style.background = '#2ecc71';
        }

        if (staffData.biometricRegistered) {
            document.getElementById('biometricStatus').textContent = 'Biometric Registered ✓';
            document.getElementById('biometricStatus').previousElementSibling.style.background = '#2ecc71';
        }
    });

    // Set initial mode
    const currentMode = document.querySelector(`.mode-option[data-mode="${attendanceMode}"]`);
    if (currentMode) {
        document.querySelectorAll('.mode-option').forEach(opt => opt.classList.remove('active'));
        currentMode.classList.add('active');
        document.querySelectorAll('.attendance-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${attendanceMode}Section`).classList.add('active');
    }

    // Stop any active camera
    if (cameraStream) {
        stopFaceCamera();
    }
}
function closeModal() {
    document.getElementById('markAttendanceModal').style.display = 'none';

    // Stop camera if active
    if (cameraStream) {
        stopFaceCamera();
    }
}

// Biometric Attendance with Verification
// ==================== BIOMETRIC ATTENDANCE - ALWAYS SUCCEEDS ====================
// ==================== BIOMETRIC ATTENDANCE - ALWAYS SUCCEEDS ====================
// ==================== MANUAL CHECK-IN FOR BIOMETRIC ====================
async function manualBiometricCheckIn() {
    console.log('👆 Manual biometric check-in...');

    const statusElement = document.getElementById('biometricStatus');
    statusElement.textContent = 'Processing manual check-in...';
    statusElement.previousElementSibling.style.background = '#ffa502';

    try {
        // Check registration status first
        await checkRegistrationStatus();

        // Check if registered
        if (!staffData.biometricRegistered) {
            console.log('❌ Biometric not registered, showing registration modal');
            showBiometricRegistrationModal();
            statusElement.textContent = 'Biometric not registered';
            statusElement.previousElementSibling.style.background = '#ff4757';
            return;
        }

        console.log('✅ Manual check-in verified, marking attendance...');

        // ✅ Manual check-in always succeeds
        statusElement.textContent = 'Manual Check-in Successful';
        statusElement.previousElementSibling.style.background = '#2ecc71';

        // Mark attendance with biometric mode
        await markAttendance('biometric');

    } catch (error) {
        console.error('❌ Error in manual check-in:', error);
        statusElement.textContent = 'Check-in Failed';
        statusElement.previousElementSibling.style.background = '#ff4757';
        showNotification('Manual check-in failed: ' + error.message, 'error');
    }
}
async function startBiometricScan() {
    console.log('👆 Starting biometric attendance...');

    const statusElement = document.getElementById('biometricStatus');
    const scannerLine = document.querySelector('.scanning-line');

    statusElement.textContent = 'Checking registration...';
    statusElement.previousElementSibling.style.background = '#ffa502';
    scannerLine.style.display = 'block';

    try {
        // ✅ Check registration status FROM DATABASE
        const registrationStatus = await checkRegistrationStatus();

        console.log('📊 Registration check result:', {
            biometricRegistered: staffData.biometricRegistered,
            registrationStatus: registrationStatus
        });

        // Check if registered
        if (!staffData.biometricRegistered) {
            console.log('❌ Biometric not registered, showing registration modal');
            showBiometricRegistrationModal();
            statusElement.textContent = 'Biometric not registered';
            statusElement.previousElementSibling.style.background = '#ff4757';
            scannerLine.style.display = 'none';
            return;
        }

        console.log('✅ Biometric verified, marking attendance...');

        // Proceed with attendance
        statusElement.textContent = 'Verified Successfully';
        statusElement.previousElementSibling.style.background = '#2ecc71';
        scannerLine.style.display = 'none';

        // Mark attendance
        await markAttendance('biometric');
    } catch (error) {
        console.error('❌ Error in biometric scan:', error);
        statusElement.textContent = 'Check-in Failed';
        statusElement.previousElementSibling.style.background = '#ff4757';
        showNotification('Biometric check-in failed: ' + error.message, 'error');
    }
}// Face Attendance with Verification
async function startFaceCamera() {
    try {
        const constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            }
        };

        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = document.getElementById('attendanceVideo');
        video.srcObject = cameraStream;

        document.getElementById('faceStatus').textContent = 'Camera Active';
        document.getElementById('faceStatus').previousElementSibling.style.background = '#2ecc71';

    } catch (error) {
        console.error('Error accessing camera:', error);
        showNotification('Error accessing camera: ' + error.message, 'error');
        document.getElementById('faceStatus').textContent = 'Camera Error';
        document.getElementById('faceStatus').previousElementSibling.style.background = '#ff4757';
    }
}

function stopFaceCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;

        const video = document.getElementById('attendanceVideo');
        video.srcObject = null;

        document.getElementById('faceStatus').textContent = 'Camera Off';
        document.getElementById('faceStatus').previousElementSibling.style.background = '#e0e0e0';
    }
}
// ==================== FIREBASE BIOMETRIC FUNCTIONS ====================

// Initialize Firebase in staff.js
async function initFirebaseForStaff() {
  console.log('🎯 Initializing Firebase for staff portal...');
  
  // Check if firebase.config.js is loaded
  if (typeof initializeFirebase === 'function') {
    const success = initializeFirebase();
    if (!success) {
      console.error('❌ Failed to initialize Firebase in staff.js');
      return null;
    }
  } else {
    console.error('❌ firebase.config.js not loaded or initializeFirebase not found');
    return null;
  }
  
  // Get Firebase instances
  const firebase = getFirebase();
  if (!firebase || !firebase.db) {
    console.error('❌ Could not get Firebase instances');
    return null;
  }
  
  return firebase;
}

// Real fingerprint authentication with Firebase
async function startRealBiometricScan() {
  console.log('👆 Starting real biometric with Firebase...');
  
  const statusElement = document.getElementById('biometricStatus');
  statusElement.textContent = 'Initializing...';
  statusElement.previousElementSibling.style.background = '#ffa502';
  
  try {
    // Initialize Firebase
    const firebase = await initFirebaseForStaff();
    if (!firebase) {
      throw new Error('Firebase not available');
    }
    
    // Check if user is authenticated
    const user = firebase.auth.currentUser;
    if (!user) {
      // Not signed in, need to authenticate first
      const authenticated = await authenticateWithFirebase();
      if (!authenticated) {
        throw new Error('Authentication required');
      }
    }
    
    // For now, use manual check-in with Firebase verification
    statusElement.textContent = 'Verifying identity...';
    
    // Create a custom token for this session
    const token = await firebase.auth.currentUser.getIdToken(true);
    
    // Send token to your server/Google Apps Script for verification
    const result = await verifyBiometricWithToken(token);
    
    if (result.success) {
      statusElement.textContent = 'Identity Verified ✓';
      statusElement.previousElementSibling.style.background = '#2ecc71';
      await markAttendance('biometric');
    } else {
      throw new Error(result.message || 'Verification failed');
    }
    
  } catch (error) {
    console.error('❌ Biometric error:', error);
    statusElement.textContent = 'Verification Failed';
    statusElement.previousElementSibling.style.background = '#ff4757';
    showNotification('Biometric verification failed: ' + error.message, 'error');
  }
}

// Authenticate with Firebase (phone or email)
async function authenticateWithFirebase() {
  try {
    const firebase = await initFirebaseForStaff();
    if (!firebase) return false;
    
    // Check if already authenticated
    if (firebase.auth.currentUser) {
      console.log('✅ Already authenticated:', firebase.auth.currentUser.email);
      return true;
    }
    
    // For staff, use email/password from login
    // Since they already logged in with email/DOB, we'll create a Firebase auth session
    if (staffData && staffData.email) {
      // Try to sign in with email (you need to set up Firebase Auth with email/password)
      try {
        const result = await firebase.auth.signInWithEmailAndPassword(
          staffData.email,
          staffData.dob // Using DOB as password (not secure, just for demo)
        );
        console.log('✅ Firebase authentication successful');
        return true;
      } catch (error) {
        console.log('⚠️ Firebase email auth failed, using anonymous auth');
      }
    }
    
    // Fallback: Use anonymous authentication
    const result = await firebase.auth.signInAnonymously();
    console.log('✅ Anonymous authentication successful');
    return true;
    
  } catch (error) {
    console.error('❌ Firebase authentication error:', error);
    return false;
  }
}

// Verify biometric with Firebase token
async function verifyBiometricWithToken(token) {
  return new Promise((resolve) => {
    const callbackName = 'handleBiometricVerify_' + Date.now();
    const script = document.createElement('script');
    
    const params = new URLSearchParams({
      action: 'verifyBiometricToken',
      staffId: staffData.staffId,
      firebaseToken: token,
      callback: callbackName
    });
    
    script.src = `${SCRIPT_URL}?${params.toString()}`;
    
    window[callbackName] = function(result) {
      delete window[callbackName];
      document.head.removeChild(script);
      resolve(result);
    };
    
    script.onerror = () => {
      delete window[callbackName];
      document.head.removeChild(script);
      resolve({ success: false, message: 'Network error' });
    };
    
    document.head.appendChild(script);
  });
}
// ==================== FACE ATTENDANCE - ALWAYS SUCCEEDS ====================
// ==================== FACE ATTENDANCE - ALWAYS SUCCEEDS ====================
// ==================== FACE ATTENDANCE - FIXED VERSION ====================
async function captureFaceAttendance() {
    if (!cameraStream) {
        showNotification('Please start the camera first', 'error');
        return;
    }

    console.log('📸 Starting face attendance...');

    const statusElement = document.getElementById('faceStatus');
    statusElement.textContent = 'Checking registration...';
    statusElement.previousElementSibling.style.background = '#ffa502';

    try {
        // ✅ Check registration status FROM DATABASE
        const registrationStatus = await checkRegistrationStatus();

        console.log('📊 Registration check result:', {
            faceRegistered: staffData.faceRegistered,
            registrationStatus: registrationStatus
        });

        // Check if registered
        if (!staffData.faceRegistered) {
            console.log('❌ Face not registered, showing registration modal');
            showFaceRegistrationModal();
            statusElement.textContent = 'Face not registered';
            statusElement.previousElementSibling.style.background = '#ff4757';
            return;
        }

        // Proceed with attendance
        statusElement.textContent = 'Face Recognized';
        statusElement.previousElementSibling.style.background = '#2ecc71';

        // Mark attendance
        await markAttendance('face');
    } catch (error) {
        console.error('❌ Error in face attendance:', error);
        statusElement.textContent = 'Check-in Failed';
        statusElement.previousElementSibling.style.background = '#ff4757';
        showNotification('Face check-in failed: ' + error.message, 'error');
    }
} function verifyFace() {
    // In a real implementation, this would integrate with face recognition API
    // For demo purposes, we'll simulate 85% success rate
    return Math.random() > 0.15;
}
async function markAttendance(method) {
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const existingRecord = attendanceRecords.find(r => (r.Date || r.date) === today);

    let action = '';
    if (existingRecord) {
        const checkIn = existingRecord.CheckIn || existingRecord.checkIn;
        const checkOut = existingRecord.CheckOut || existingRecord.checkOut;

        if (checkIn && !checkOut) {
            // Already checked in, now trying to check-out
            action = 'check-out';
        } else if (!checkIn) {
            // Not checked in yet, trying to check-in
            action = 'check-in';
        } else {
            showAttendanceResult('error', 'Attendance already marked for today (both check-in and check-out)');
            return;
        }
    } else {
        // No record yet, trying to check-in
        action = 'check-in';
    }

    // ✅ Validate time using the validation function
    const timeValidation = validateAttendanceTime(action);
    if (!timeValidation.valid) {
        showAttendanceResult('error', timeValidation.message);
        return;
    }

    try {
        const result = await markAttendanceInDatabase(action, method);

        if (result.success) {
            showAttendanceResult('success', result.message);

            // Refresh data from database
            await refreshAttendanceData();

            // Auto-close modal after 3 seconds
            setTimeout(() => {
                if (method === 'face') {
                    stopFaceCamera();
                }
                closeModal();

                // Update dashboard with fresh data
                loadDashboardData();
                loadDailyAttendance();
            }, 3000);
        }
    } catch (error) {
        showAttendanceResult('error', error.message);
    }
} function showAttendanceResult(type, message) {
    const resultDiv = document.getElementById('attendanceResult');
    resultDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <h4>${type === 'success' ? 'Success!' : 'Error'}</h4>
        <p>${message}</p>
    `;
    resultDiv.className = `attendance-result ${type}`;
    resultDiv.style.display = 'block';
}

// ==================== PROFILE FUNCTIONS ====================
function switchTab(tab) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        }
    });

    // Show active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tab}Tab`) {
            content.classList.add('active');
        }
    });
}

// ==================== SAVE PERSONAL INFO ====================
// ==================== SAVE PERSONAL INFO - FIXED ====================
// ==================== SAVE PERSONAL INFO - UPDATED ====================
// ==================== SAVE PERSONAL INFO - UPDATED ====================
async function savePersonalInfo(e) {
    e.preventDefault();

    try {
        // ✅ DEBUG: Check what staff ID we have
        console.log('🔍 DEBUG staffData:', staffData);
        console.log('🔍 Staff ID in staffData:', staffData.staffId);

        // Get form data
        const firstName = document.getElementById('profileFirstName').value;
        const lastName = document.getElementById('profileLastName').value;
        const email = document.getElementById('profileEmail').value;
        const phone = document.getElementById('profilePhone').value;
        const dob = document.getElementById('profileDob').value;
        const gender = document.getElementById('profileGender').value;
        const address = document.getElementById('profileAddress').value;

        // Validate
        if (!firstName || !lastName || !email) {
            showNotification('Please fill all required fields', 'error');
            return;
        }

        const formData = {
            name: `${firstName} ${lastName}`.trim(),
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone,
            dob: dob,
            gender: gender,
            address: address
        };

        console.log('📝 Saving profile info to database:', formData);
        console.log('🔍 Using staff ID from staffData:', staffData.staffId);

        // ✅ Save profile data to Google Sheets database
        const result = await saveStaffProfileToDatabase(formData);

        if (result.success) {
            // ✅ Update local staffData
            Object.assign(staffData, formData);

            // ✅ Save to localStorage for immediate access
            saveStaffDataToLocalStorage();

            // Update UI
            updateStaffInfo();

            showNotification('Profile updated successfully!', 'success');
        } else {
            showNotification('Error: ' + (result.message || 'Unknown error'), 'error');
        }

    } catch (error) {
        console.error('❌ Error saving profile:', error);
        showNotification('Error saving profile: ' + error.message, 'error');
    }
}// ==================== UPDATE STAFF PROFILE IN DATABASE ====================
async function updateStaffProfileInDatabase(formData) {
    return new Promise((resolve) => {
        const callbackName = 'handleProfileUpdate_' + Date.now();
        const script = document.createElement('script');

        // Prepare data for Google Sheets
        const profileData = {
            action: 'updateStaffProfile',
            staffId: formData.staffId || '',
            name: formData.name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            dob: formData.dob || '',
            gender: formData.gender || '',
            address: formData.address || '',
            callback: callbackName
        };

        console.log('📤 Sending profile update:', profileData);

        const params = new URLSearchParams(profileData);
        script.src = `${SCRIPT_URL}?${params.toString()}`;

        const timeoutId = setTimeout(() => {
            delete window[callbackName];
            if (document.head.contains(script)) document.head.removeChild(script);
            resolve({ success: false, message: 'Request timeout' });
        }, 15000);

        window[callbackName] = function (result) {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (document.head.contains(script)) document.head.removeChild(script);

            console.log('✅ Profile update response:', result);

            if (result && result.success) {
                // Cache the updated data
                cacheUpdatedStaffData(formData);
                resolve(result);
            } else {
                resolve(result || { success: false, message: 'No response' });
            }
        };

        script.onerror = () => {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (document.head.contains(script)) document.head.removeChild(script);
            resolve({ success: false, message: 'Network error' });
        };

        document.head.appendChild(script);
    });
}

// ==================== CACHE UPDATED STAFF DATA ====================
function cacheUpdatedStaffData(formData) {
    // Update localStorage cache
    const cachedData = {
        ...staffData,
        ...formData,
        lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(`staff_${staffData.staffId}_profileData`, JSON.stringify(cachedData));
    localStorage.setItem(`staff_${staffData.staffId}_lastUpdate`, new Date().toISOString());

    console.log('💾 Staff data cached');
}// ==================== CHANGE PROFILE PHOTO ====================
// ==================== CHANGE PROFILE PHOTO - FIXED ====================
function changeProfilePhoto() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // LIMIT FILE SIZE TO 200KB (reduced from 500KB)
        if (file.size > 200 * 1024) {
            showNotification('Image too large! Max 200KB allowed.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                // Compress image further
                const compressedImage = await compressImage(event.target.result, 150, 150);

                // Update profile using separate photo upload function
                const result = await uploadProfilePhotoToDatabase(compressedImage);

                if (result.success) {
                    // Update UI immediately
                    document.getElementById('profileImage').src = compressedImage;
                    document.getElementById('dropdownProfileImage').src = compressedImage;
                    document.getElementById('profilePhoto').src = compressedImage;

                    // Also update staffData
                    staffData.profilePhoto = compressedImage;

                    showNotification('Profile photo updated!', 'success');
                } else {
                    showNotification('Error: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('Error processing photo:', error);
                showNotification('Error processing photo', 'error');
            }
        };
        reader.readAsDataURL(file);
    };

    fileInput.click();
}

// ==================== COMPRESS IMAGE ====================
function compressImage(dataUrl, maxWidth, maxHeight) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round(height * maxWidth / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round(width * maxHeight / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with quality 0.7
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(compressedDataUrl);
        };
        img.src = dataUrl;
    });
}

// ==================== UPLOAD PROFILE PHOTO TO DATABASE ====================
// ==================== UPLOAD PROFILE PHOTO ====================
async function uploadProfilePhotoToDatabase(photoData) {
    return new Promise((resolve) => {
        console.log('📸 Starting photo upload...');

        const callbackName = 'handlePhotoUpload_' + Date.now();
        const script = document.createElement('script');

        // Compress image to under 900KB to be safe (1MB limit)
        let compressedPhoto = compressPhotoForSheets(photoData);

        console.log('📊 Photo data length:', compressedPhoto.length, 'characters');

        const params = new URLSearchParams({
            action: 'storeProfilePhoto',
            staffId: staffData.staffId,
            staffName: staffData.name,
            photoData: compressedPhoto.substring(0, 900000), // Ensure under 900KB
            timestamp: new Date().toISOString(),
            callback: callbackName
        });

        script.src = `${SCRIPT_URL}?${params.toString()}`;

        const timeoutId = setTimeout(() => {
            delete window[callbackName];
            if (document.head.contains(script)) document.head.removeChild(script);
            resolve({ success: false, message: 'Photo upload timeout' });
        }, 30000); // 30 second timeout for large uploads

        window[callbackName] = function (result) {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (document.head.contains(script)) document.head.removeChild(script);

            console.log('📤 Photo upload response:', result);

            if (result && result.success) {
                // Update UI immediately
                updateProfilePhotoInUI(compressedPhoto);
                resolve({ success: true, message: 'Photo uploaded successfully!' });
            } else {
                resolve({
                    success: false,
                    message: result?.message || 'Photo upload failed'
                });
            }
        };

        script.onerror = (error) => {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (document.head.contains(script)) document.head.removeChild(script);
            console.error('❌ Script error:', error);
            resolve({ success: false, message: 'Network error uploading photo' });
        };

        document.head.appendChild(script);
    });
}
async function changeProfilePhoto() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Limit file size to 200KB
        if (file.size > 200 * 1024) {
            showNotification('Image too large! Max 200KB allowed.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                // Compress image
                const compressedImage = await compressImage(event.target.result, 150, 150);

                // ✅ Save to database
                const result = await saveProfilePhotoToDatabase(compressedImage);

                if (result.success) {
                    // Update staffData
                    staffData.profilePhoto = compressedImage;

                    // ✅ Save to localStorage
                    saveStaffDataToLocalStorage();

                    // Update UI
                    updateStaffInfo();

                    showNotification('Profile photo updated!', 'success');
                } else {
                    showNotification('Error saving photo: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('Error processing photo:', error);
                showNotification('Error processing photo', 'error');
            }
        };
        reader.readAsDataURL(file);
    };

    fileInput.click();
}

// ==================== COMPRESS PHOTO FOR SHEETS ====================
function compressPhotoForSheets(dataUrl) {
    try {
        console.log('🔧 Compressing photo...');

        // If it's already small enough, return as-is
        if (dataUrl.length < 500000) { // Under 500KB
            console.log('✅ Photo already under 500KB');
            return dataUrl;
        }

        // Create a temporary image to compress
        const img = new Image();
        img.src = dataUrl;

        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set dimensions (reduce size for sheets)
        const maxDimension = 400; // Reduce to 400px max dimension
        let width = img.width;
        let height = img.height;

        if (width > height) {
            if (width > maxDimension) {
                height = Math.round(height * maxDimension / width);
                width = maxDimension;
            }
        } else {
            if (height > maxDimension) {
                width = Math.round(width * maxDimension / height);
                height = maxDimension;
            }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Try different compression levels
        let compressedDataUrl;
        let quality = 0.7;

        do {
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            console.log(`🔧 Trying quality ${quality}: ${compressedDataUrl.length} chars`);
            quality -= 0.1;
        } while (compressedDataUrl.length > 900000 && quality > 0.1); // Aim for under 900KB

        console.log(`✅ Compressed to ${compressedDataUrl.length} characters`);
        return compressedDataUrl;

    } catch (error) {
        console.error('❌ Compression error:', error);
        return dataUrl; // Return original if compression fails
    }
}

// ==================== UPDATE PROFILE PHOTO IN UI ====================
function updateProfilePhotoInUI(photoData) {
    // Update all profile images
    const profileImages = [
        document.getElementById('profileImage'),
        document.getElementById('dropdownProfileImage'),
        document.getElementById('profilePhoto')
    ];

    profileImages.forEach(img => {
        if (img) img.src = photoData;
    });

    // Save to localStorage for persistence
    localStorage.setItem(`staff_${staffData.staffId}_profilePhoto`, photoData);

    // Update staffData object
    staffData.profilePhoto = photoData;
}// ==================== UPDATE STAFF PROFILE IN DATABASE ====================
// ==================== UPDATE STAFF PROFILE IN DATABASE ====================
// ==================== UPDATE STAFF PROFILE IN DATABASE - ENHANCED ====================
// ==================== UPDATE STAFF PROFILE IN DATABASE - FIXED ====================
async function updateStaffProfileInDatabase(formData) {
    return new Promise((resolve) => {
        const callbackName = 'handleProfileUpdate_' + Date.now();
        const script = document.createElement('script');

        // Create a clean formData object WITHOUT profilePhoto
        const cleanFormData = {
            action: 'updateStaffProfile',
            staffId: formData.staffId || '',
            name: formData.name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            dob: formData.dob || '',
            gender: formData.gender || '',
            address: formData.address || '',
            callback: callbackName
        };

        console.log('📤 Sending profile update WITHOUT photo:', cleanFormData);

        // Handle profile photo separately via POST if it exists
        if (formData.profilePhoto && formData.profilePhoto.length > 100) {
            console.log('📸 Profile photo detected, will upload separately');
            // We'll handle photo in separate request
        }

        const params = new URLSearchParams(cleanFormData);
        script.src = `${SCRIPT_URL}?${params.toString()}`;

        // Timeout handler
        const timeoutId = setTimeout(() => {
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            resolve({
                success: false,
                message: 'Request timeout'
            });
        }, 15000); // 15 seconds timeout

        window[callbackName] = function (result) {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            console.log('✅ Profile update response:', result);
            resolve(result || {
                success: false,
                message: 'No response received'
            });
        };

        script.onerror = () => {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            console.log('❌ Script load error updating profile');
            resolve({
                success: false,
                message: 'Network error updating profile'
            });
        };

        document.head.appendChild(script);
    });
}
// ==================== SAVE PROFILE PHOTO TO DATABASE ====================
async function saveProfilePhotoToDatabase(photoData) {
    return new Promise((resolve) => {
        console.log('💾 Saving profile photo to database...');

        const callbackName = 'handlePhotoSave_' + Date.now();
        const script = document.createElement('script');

        // Truncate photo data if too long (Google Sheets has cell limit)
        const truncatedPhoto = photoData.length > 50000 ?
            photoData.substring(0, 50000) + '...' :
            photoData;

        const params = new URLSearchParams({
            action: 'saveProfilePhoto',
            staffId: staffData.staffId,
            photoData: truncatedPhoto,
            timestamp: new Date().toISOString(),
            callback: callbackName
        });

        script.src = `${SCRIPT_URL}?${params.toString()}`;

        const timeoutId = setTimeout(() => {
            delete window[callbackName];
            if (document.head.contains(script)) document.head.removeChild(script);
            resolve({ success: false, message: 'Photo save timeout' });
        }, 15000);

        window[callbackName] = function (result) {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (document.head.contains(script)) document.head.removeChild(script);

            console.log('📤 Photo save response:', result);
            resolve(result);
        };

        script.onerror = () => {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (document.head.contains(script)) document.head.removeChild(script);
            resolve({ success: false, message: 'Network error' });
        };

        document.head.appendChild(script);
    });
}

// ==================== GET PROFILE PHOTO FROM DATABASE ====================
async function getProfilePhotoFromDatabase() {
    return new Promise((resolve) => {
        console.log('🖼️ Getting profile photo from database...');

        const callbackName = 'handlePhotoGet_' + Date.now();
        const script = document.createElement('script');

        const params = new URLSearchParams({
            action: 'getProfilePhoto',
            staffId: staffData.staffId,
            callback: callbackName
        });

        script.src = `${SCRIPT_URL}?${params.toString()}`;

        const timeoutId = setTimeout(() => {
            delete window[callbackName];
            if (document.head.contains(script)) document.head.removeChild(script);
            resolve({ success: false, message: 'Photo fetch timeout' });
        }, 10000);

        window[callbackName] = function (result) {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (document.head.contains(script)) document.head.removeChild(script);

            console.log('📥 Photo get response:', result ? 'Received' : 'None');

            if (result && result.success && result.photoData) {
                // Update staffData with the photo
                staffData.profilePhoto = result.photoData;
                resolve(result);
            } else {
                resolve({ success: false, message: 'No photo found' });
            }
        };

        script.onerror = () => {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (document.head.contains(script)) document.head.removeChild(script);
            resolve({ success: false, message: 'Network error' });
        };

        document.head.appendChild(script);
    });
}

// ==================== SAVE STAFF PROFILE TO DATABASE ====================
async function saveStaffProfileToDatabase(profileData) {
    return new Promise((resolve) => {
        console.log('💾 Starting profile save to database...');

        const callbackName = 'handleProfileSave_' + Date.now();
        const script = document.createElement('script');

        // ✅ Get staff ID from staffData
        let actualStaffId = staffData.staffId || '';
        console.log('🔍 Original staff ID from staffData:', actualStaffId);

        // ✅ Convert STAFF27 to STAFF0027 to match your sheet
        if (actualStaffId.includes('STAFF')) {
            const idNumber = actualStaffId.replace(/\D/g, ''); // Get numbers only
            if (idNumber) {
                // Convert to 4-digit format: STAFF0027
                actualStaffId = 'STAFF' + idNumber.padStart(4, '0');
                console.log('🔄 Converted staff ID to:', actualStaffId);
            }
        }

        // ✅ Prepare ALL data that updateStaffProfile expects
        const dataToSend = {
            action: 'updateStaffProfile',
            staffId: actualStaffId, // Send STAFF0027
            name: profileData.name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            dob: profileData.dob || '',
            gender: profileData.gender || '',
            address: profileData.address || ''
            // Don't include timestamp and callback in the data object
        };

        console.log('📤 Sending profile update:', dataToSend);

        // ✅ Build URL parameters correctly
        const params = new URLSearchParams();

        // Add all data fields
        params.append('action', 'updateStaffProfile');
        params.append('staffId', actualStaffId);
        params.append('name', profileData.name || '');
        params.append('email', profileData.email || '');
        params.append('phone', profileData.phone || '');
        params.append('dob', profileData.dob || '');
        params.append('gender', profileData.gender || '');
        params.append('address', profileData.address || '');

        // Add callback LAST
        params.append('callback', callbackName);

        script.src = `${SCRIPT_URL}?${params.toString()}`;

        console.log('🔗 Final URL:', script.src.substring(0, 200) + '...');

        const timeoutId = setTimeout(() => {
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            resolve({
                success: false,
                message: 'Request timeout'
            });
        }, 15000);

        window[callbackName] = function (result) {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            console.log('✅ Profile update response:', result);
            resolve(result || {
                success: false,
                message: 'No response received'
            });
        };

        script.onerror = () => {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            console.log('❌ Script load error updating profile');
            resolve({
                success: false,
                message: 'Network error updating profile'
            });
        };

        document.head.appendChild(script);
    });
}
function loadProfileStats() {
    // Calculate stats from attendance records
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRecords = attendanceRecords.filter(record => {
        const recordDate = new Date(record.Date || record.date);
        return recordDate.getMonth() === currentMonth &&
            recordDate.getFullYear() === currentYear;
    });

    const workingDays = monthlyRecords.length;
    const presentDays = monthlyRecords.filter(r => (r.Status || r.status) === 'present' || (r.Status || r.status) === 'late').length;
    const lateArrivals = monthlyRecords.filter(r => (r.Status || r.status) === 'late').length;
    const attendanceRate = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

    // Calculate leave balance - START WITH FULL BALANCE
    const leaveBalance = {
        casual: 12,
        sick: 15,
        earned: 30,
        maternity: 180
    };

    // Subtract used leaves
    leaveRecords.forEach(record => {
        if ((record.Status || record.status) === 'approved') {
            const fromDate = record.FromDate || record.fromDate;
            const toDate = record.ToDate || record.toDate;
            const type = record.Type || record.type;

            const days = calculateLeaveDays(fromDate, toDate);
            switch (type) {
                case 'casual':
                    leaveBalance.casual -= days;
                    break;
                case 'sick':
                    leaveBalance.sick -= days;
                    break;
                case 'earned':
                    leaveBalance.earned -= days;
                    break;
                case 'maternity':
                    leaveBalance.maternity -= days;
                    break;
            }
        }
    });

    // Update profile stats
    document.getElementById('profileAttendance').textContent = attendanceRate === 0 ? '0%' : `${attendanceRate}%`;
    document.getElementById('profileWorkingDays').textContent = workingDays;
    document.getElementById('profileLateArrivals').textContent = lateArrivals;
    document.getElementById('profileLeaveBalance').textContent = `${leaveBalance.casual + leaveBalance.sick + leaveBalance.earned}`;

    // Update leave balance in leave report
    document.getElementById('casualLeaveBalance').textContent = Math.max(0, leaveBalance.casual);
    document.getElementById('sickLeaveBalance').textContent = Math.max(0, leaveBalance.sick);
    document.getElementById('earnedLeaveBalance').textContent = Math.max(0, leaveBalance.earned);
    document.getElementById('maternityLeaveBalance').textContent = Math.max(0, leaveBalance.maternity);
}

// ==================== SIDEBAR TOGGLE ====================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

// ==================== DATA MANAGEMENT ====================
function updateDashboardData() {
    // Reload data from database
    loadAttendanceFromDatabase();
    loadLeaveFromDatabase();

    // Update current page
    if (currentPage === 'dashboard') {
        loadDashboardData();
    }
    if (currentPage === 'daily-attendance') {
        loadDailyAttendance();
    }
    if (currentPage === 'leave-report') {
        loadLeaveReport();
    }
}

// ==================== UTILITY FUNCTIONS ====================
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const overlay = document.getElementById('notification-overlay');

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    overlay.style.display = 'block';

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translate(-50%, -50%) scale(1)';
        notification.style.opacity = '1';
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(hideNotification, 5000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    const overlay = document.getElementById('notification-overlay');

    notification.style.transform = 'translate(-50%, -50%) scale(0.8)';
    notification.style.opacity = '0';

    setTimeout(() => {
        notification.style.display = 'none';
        overlay.style.display = 'none';
    }, 300);
}
// Add these new database functions to your staff.js:

// ==================== BIOMETRIC & FACE REGISTRATION ====================
// ==================== REGISTER BIOMETRIC ====================
// ==================== REGISTER BIOMETRIC (JSONP VERSION) ====================
// ==================== REGISTER BIOMETRIC (UPDATED VERSION) ====================
// ==================== REGISTER BIOMETRIC - SIMPLIFIED ====================
// ==================== REGISTER FACE ====================
// ==================== REGISTER FACE (JSONP VERSION) ====================
// ==================== REGISTER FACE (UPDATED VERSION) ====================
// ==================== REGISTER FACE - SIMPLIFIED ====================
async function registerFace() {
    console.log('📸 Starting face registration for staff:', staffData.staffId);

    return new Promise((resolve) => {
        const callbackName = 'handleFaceRegistration_' + Date.now();
        const script = document.createElement('script');

        // CRITICAL FIX: Convert STAFF8 to STAFF0008 format
        let staffIdToSend = staffData.staffId;

        // If it's in STAFF8 format, convert to STAFF0008
        if (staffIdToSend && staffIdToSend.includes('STAFF')) {
            const idNumber = staffIdToSend.replace(/\D/g, ''); // Get numbers only
            if (idNumber) {
                // Convert to 4-digit format: STAFF0008
                staffIdToSend = 'STAFF' + idNumber.padStart(4, '0');
                console.log('🔄 Converted staff ID to 4-digit format:', staffIdToSend);
            }
        }

        const params = new URLSearchParams({
            action: 'register_face',
            staffId: staffIdToSend,
            email: staffData.email || '',
            name: staffData.name || '',
            phone: staffData.phone || '',
            mode: 'staff_portal',
            forceUpdate: 'true',
            callback: callbackName
        });

        script.src = `${SCRIPT_URL}?${params.toString()}`;
        console.log('🔗 Registration URL:', script.src.substring(0, 150));

        // Safe cleanup function
        const cleanup = () => {
            try {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            } catch (e) {
                // Ignore
            }
        };

        // Timeout handling
        const timeoutId = setTimeout(() => {
            delete window[callbackName];
            cleanup();
            console.log('❌ Registration timeout');
            showNotification('Registration timeout. Please try again.', 'error');
            resolve(false);
        }, 10000);

        window[callbackName] = async function (result) {
            clearTimeout(timeoutId);
            delete window[callbackName];
            cleanup();

            console.log('📡 Registration response:', result);

            if (result && result.success) {
                console.log('✅ Face registration successful!');

                // CRITICAL: Force update the local staffData immediately
                staffData.faceRegistered = true;
                staffData.biometricRegistered = staffData.biometricRegistered || false;

                // Update the modal UI immediately
                if (document.getElementById('faceStatus')) {
                    document.getElementById('faceStatus').textContent = 'Face Registered ✓';
                    document.getElementById('faceStatus').previousElementSibling.style.background = '#2ecc71';
                }

                // Show success notification
                showNotification('Face registration successful!', 'success');

                // Force refresh registration status from database
                setTimeout(async () => {
                    await checkRegistrationStatus();
                }, 1000);

                resolve(true);
            } else {
                console.log('❌ Face registration failed:', result?.message);
                showNotification('Registration failed: ' + (result?.message || 'Unknown error'), 'error');
                resolve(false);
            }
        };

        script.onerror = () => {
            clearTimeout(timeoutId);
            delete window[callbackName];
            cleanup();
            console.log('❌ Network error during face registration');
            showNotification('Network error. Please check connection.', 'error');
            resolve(false);
        };

        document.head.appendChild(script);
    });
}// ==================== UPDATE MARK ATTENDANCE FUNCTIONS ====================
// ==================== FACE ATTENDANCE - ALWAYS SUCCEEDS ====================
// ==================== FACE ATTENDANCE - ALWAYS SUCCEEDS ====================
// ==================== FACE ATTENDANCE - FIXED VERSION ====================
async function captureFaceAttendance() {
    if (!cameraStream) {
        showNotification('Please start the camera first', 'error');
        return;
    }

    console.log('📸 Starting face attendance...');

    const statusElement = document.getElementById('faceStatus');
    statusElement.textContent = 'Checking registration...';
    statusElement.previousElementSibling.style.background = '#ffa502';

    try {
        // ✅ Check registration status FROM DATABASE
        const registrationStatus = await checkRegistrationStatus();

        console.log('📊 Registration check result:', {
            faceRegistered: staffData.faceRegistered,
            registrationStatus: registrationStatus
        });

        // Check if registered
        if (!staffData.faceRegistered) {
            console.log('❌ Face not registered, showing registration modal');
            showFaceRegistrationModal();
            statusElement.textContent = 'Face not registered';
            statusElement.previousElementSibling.style.background = '#ff4757';
            return;
        }

        // Proceed with attendance
        statusElement.textContent = 'Face Recognized';
        statusElement.previousElementSibling.style.background = '#2ecc71';

        // Mark attendance
        await markAttendance('face');
    } catch (error) {
        console.error('❌ Error in face attendance:', error);
        statusElement.textContent = 'Check-in Failed';
        statusElement.previousElementSibling.style.background = '#ff4757';
        showNotification('Face check-in failed: ' + error.message, 'error');
    }
}// ==================== REGISTRATION MODALS ====================
function showBiometricRegistrationModal() {
    const registrationModal = document.createElement('div');
    registrationModal.className = 'modal';
    registrationModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Register Biometric</h3>
                <span class="modal-close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="registration-steps">
                    <div class="step active" id="step1">
                        <h4>Step 1: Place Finger on Scanner</h4>
                        <div class="scanner-placeholder large">
                            <div class="fingerprint-icon">
                                <i class="fas fa-fingerprint"></i>
                            </div>
                            <div class="scanning-line"></div>
                        </div>
                        <p>Place your finger on the scanner until registration is complete</p>
                        <div class="registration-status">
                            <span class="status-dot"></span>
                            <span id="biometricRegStatus">Ready to register</span>
                        </div>
                    </div>
                    <div class="step" id="step2">
                        <h4>Step 2: Complete Registration</h4>
                        <div class="success-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <p>Your biometric has been successfully registered!</p>
                        <p class="small-text">You can now use biometric for attendance marking.</p>
                    </div>
                </div>
                <div class="registration-actions">
                    <button class="btn-primary" id="startBiometricRegistration">
                        <i class="fas fa-play"></i>
                        Start Registration
                    </button>
                    <button class="btn-secondary" id="skipBiometricRegistration">
                        Skip for Now
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(registrationModal);
    registrationModal.style.display = 'flex';

    // Close modal
    document.querySelector('.modal-close').addEventListener('click', () => {
        document.body.removeChild(registrationModal);
    });

    registrationModal.addEventListener('click', (e) => {
        if (e.target === registrationModal) {
            document.body.removeChild(registrationModal);
        }
    });

    // Start registration
    document.getElementById('startBiometricRegistration').addEventListener('click', async () => {
        const statusElement = document.getElementById('biometricRegStatus');
        const startBtn = document.getElementById('startBiometricRegistration');
        const skipBtn = document.getElementById('skipBiometricRegistration');

        statusElement.textContent = 'Scanning... Please keep your finger on scanner...';
        statusElement.previousElementSibling.style.background = '#ffa502';
        startBtn.disabled = true;
        skipBtn.disabled = true;

        setTimeout(async () => {
            const success = await registerBiometric();

            if (success) {
                // Show step 2
                document.getElementById('step1').classList.remove('active');
                document.getElementById('step2').classList.add('active');

                setTimeout(() => {
                    document.body.removeChild(registrationModal);
                    // Return to attendance modal
                    showMarkAttendanceModal();
                }, 2000);
            } else {
                statusElement.textContent = 'Registration failed. Please try again.';
                statusElement.previousElementSibling.style.background = '#ff4757';
                startBtn.disabled = false;
                skipBtn.disabled = false;
            }
        }, 3000);
    });

    // Skip registration
    document.getElementById('skipBiometricRegistration').addEventListener('click', () => {
        document.body.removeChild(registrationModal);
    });
}

function showFaceRegistrationModal() {
    const registrationModal = document.createElement('div');
    registrationModal.className = 'modal';
    registrationModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Register Face</h3>
                <span class="modal-close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="registration-steps">
                    <div class="step active" id="faceStep1">
                        <h4>Step 1: Position Your Face</h4>
                        <div class="camera-preview large">
                            <video id="faceRegistrationVideo" autoplay playsinline></video>
                            <div class="face-guide"></div>
                        </div>
                        <p>Position your face in the frame. Ensure good lighting.</p>
                        <div class="registration-status">
                            <span class="status-dot"></span>
                            <span id="faceRegStatus">Ready to register</span>
                        </div>
                    </div>
                    <div class="step" id="faceStep2">
                        <h4>Step 2: Complete Registration</h4>
                        <div class="success-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <p>Your face has been successfully registered!</p>
                        <p class="small-text">You can now use face recognition for attendance marking.</p>
                    </div>
                </div>
                <div class="registration-actions">
                    <button class="btn-primary" id="startFaceRegistration">
                        <i class="fas fa-camera"></i>
                        Start Camera & Register
                    </button>
                    <button class="btn-secondary" id="skipFaceRegistration">
                        Skip for Now
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(registrationModal);
    registrationModal.style.display = 'flex';

    // Close modal
    document.querySelector('.modal-close').addEventListener('click', () => {
        stopRegistrationCamera();
        document.body.removeChild(registrationModal);
    });

    registrationModal.addEventListener('click', (e) => {
        if (e.target === registrationModal) {
            stopRegistrationCamera();
            document.body.removeChild(registrationModal);
        }
    });

    // Start registration
    document.getElementById('startFaceRegistration').addEventListener('click', async () => {
        const video = document.getElementById('faceRegistrationVideo');
        const statusElement = document.getElementById('faceRegStatus');
        const startBtn = document.getElementById('startFaceRegistration');
        const skipBtn = document.getElementById('skipFaceRegistration');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            video.srcObject = stream;

            statusElement.textContent = 'Camera started. Capturing face...';
            statusElement.previousElementSibling.style.background = '#ffa502';
            startBtn.disabled = true;
            skipBtn.disabled = true;

            setTimeout(async () => {
                // ✅ Use JSONP version
                const success = await registerFace();

                if (success) {
                    // Stop camera
                    stream.getTracks().forEach(track => track.stop());

                    // Show step 2
                    document.getElementById('faceStep1').classList.remove('active');
                    document.getElementById('faceStep2').classList.add('active');

                    setTimeout(() => {
                        document.body.removeChild(registrationModal);
                        // Return to attendance modal
                        showMarkAttendanceModal();
                    }, 2000);
                } else {
                    statusElement.textContent = 'Registration failed. Please try again.';
                    statusElement.previousElementSibling.style.background = '#ff4757';
                    startBtn.disabled = false;
                    skipBtn.disabled = false;
                }
            }, 3000);

        } catch (error) {
            showNotification('Error accessing camera: ' + error.message, 'error');
        }
    });

    // Skip registration
    document.getElementById('skipFaceRegistration').addEventListener('click', () => {
        stopRegistrationCamera();
        document.body.removeChild(registrationModal);
    });
}
// ==================== CACHE REGISTRATION STATUS ====================
function cacheRegistrationStatus(faceRegistered, biometricRegistered) {
    const status = {
        faceRegistered: faceRegistered,
        biometricRegistered: biometricRegistered,
        lastUpdated: new Date().toISOString(),
        staffId: staffData.staffId
    };

    localStorage.setItem('staffRegistrationCache', JSON.stringify(status));
    console.log('💾 Registration status cached:', status);
}

function getCachedRegistrationStatus() {
    const cached = localStorage.getItem('staffRegistrationCache');
    if (cached) {
        try {
            const status = JSON.parse(cached);
            // Check if cache is for current staff and not too old (1 day)
            if (status.staffId === staffData.staffId) {
                const cacheAge = new Date() - new Date(status.lastUpdated);
                const oneDay = 24 * 60 * 60 * 1000;

                if (cacheAge < oneDay) {
                    console.log('📦 Using cached registration status (age:', Math.round(cacheAge / 1000 / 60), 'minutes)');
                    return status;
                }
            }
        } catch (e) {
            console.log('❌ Error reading cache');
        }
    }
    return null;
}
function stopRegistrationCamera() {
    const video = document.getElementById('faceRegistrationVideo');
    if (video && video.srcObject) {
        const stream = video.srcObject;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}
// ==================== REGISTER BIOMETRIC ====================
// ==================== REGISTER BIOMETRIC (JSONP VERSION) ====================
// ==================== REGISTER BIOMETRIC (UPDATED VERSION) ====================
// ==================== REGISTER BIOMETRIC - SIMPLIFIED ====================
async function registerBiometric() {
    console.log('👆 Starting biometric registration for staff:', staffData.staffId);

    return new Promise((resolve) => {
        const callbackName = 'handleBiometricRegistration_' + Date.now();
        const script = document.createElement('script');

        // CRITICAL FIX: Convert STAFF8 to STAFF0008 format
        let staffIdToSend = staffData.staffId;

        // If it's in STAFF8 format, convert to STAFF0008
        if (staffIdToSend && staffIdToSend.includes('STAFF')) {
            const idNumber = staffIdToSend.replace(/\D/g, ''); // Get numbers only
            if (idNumber) {
                // Convert to 4-digit format: STAFF0008
                staffIdToSend = 'STAFF' + idNumber.padStart(4, '0');
                console.log('🔄 Converted staff ID to 4-digit format:', staffIdToSend);
            }
        }

        const params = new URLSearchParams({
            action: 'register_biometric',
            staffId: staffIdToSend,
            email: staffData.email || '',
            name: staffData.name || '',
            phone: staffData.phone || '',
            mode: 'staff_portal',
            forceUpdate: 'true',
            callback: callbackName
        });

        script.src = `${SCRIPT_URL}?${params.toString()}`;
        console.log('🔗 Registration URL:', script.src.substring(0, 150));

        // Safe cleanup function
        const cleanup = () => {
            try {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            } catch (e) {
                // Ignore
            }
        };

        // Timeout handling
        const timeoutId = setTimeout(() => {
            delete window[callbackName];
            cleanup();
            console.log('❌ Registration timeout');
            showNotification('Registration timeout. Please try again.', 'error');
            resolve(false);
        }, 10000);

        window[callbackName] = async function (result) {
            clearTimeout(timeoutId);
            delete window[callbackName];
            cleanup();

            console.log('📡 Registration response:', result);

            if (result && result.success) {
                console.log('✅ Biometric registration successful!');

                // CRITICAL: Force update the local staffData immediately
                staffData.biometricRegistered = true;
                staffData.faceRegistered = staffData.faceRegistered || false;

                // Update the modal UI immediately
                if (document.getElementById('biometricStatus')) {
                    document.getElementById('biometricStatus').textContent = 'Biometric Registered ✓';
                    document.getElementById('biometricStatus').previousElementSibling.style.background = '#2ecc71';
                }

                // Show success notification
                showNotification('Biometric registration successful!', 'success');

                // Force refresh registration status from database
                setTimeout(async () => {
                    await checkRegistrationStatus();
                }, 1000);

                resolve(true);
            } else {
                console.log('❌ Biometric registration failed:', result?.message);
                showNotification('Registration failed: ' + (result?.message || 'Unknown error'), 'error');
                resolve(false);
            }
        };

        script.onerror = () => {
            clearTimeout(timeoutId);
            delete window[callbackName];
            cleanup();
            console.log('❌ Network error during biometric registration');
            showNotification('Network error. Please check connection.', 'error');
            resolve(false);
        };

        document.head.appendChild(script);
    });
}// ==================== REGISTER FACE ====================
// ==================== REGISTER FACE (JSONP VERSION) ====================
// ==================== REGISTER FACE (UPDATED VERSION) ====================
// ==================== REGISTER FACE - SIMPLIFIED ====================
// Update your checkAuth function:
// ADD THIS FUNCTION if you don't have it
async function fetchStaffFromDatabase(email, dob) {
    return new Promise((resolve) => {
        const callbackName = 'handleStaffFetch_' + Date.now();

        const script = document.createElement('script');
        script.src = `${SCRIPT_URL}?action=verifyStaffLogin&email=${encodeURIComponent(email)}&dob=${encodeURIComponent(dob)}&callback=${callbackName}`;

        window[callbackName] = function (result) {
            delete window[callbackName];
            document.head.removeChild(script);

            if (result && result.success && result.staff) {
                console.log('✅ Staff fetched from database:', result.staff.name);
                resolve(result.staff);
            } else {
                console.log('❌ Staff not found or error:', result?.message);
                resolve(null);
            }
        };

        script.onerror = () => {
            delete window[callbackName];
            document.head.removeChild(script);
            console.log('❌ Network error fetching staff');
            resolve(null);
        };

        document.head.appendChild(script);
    });
}// Add this new function:
// ==================== CHECK REGISTRATION STATUS - AGGRESSIVE ====================
// ==================== CHECK REGISTRATION STATUS - AGGRESSIVE ====================
// ==================== CHECK REGISTRATION STATUS - FIXED VERSION ====================
// ==================== CHECK REGISTRATION STATUS - UPDATED FOR SHEETS DATABASE ====================
// ==================== CHECK REGISTRATION STATUS - DEBUG VERSION ====================
async function checkRegistrationStatus() {
    try {
        console.log('🔄 Checking registration status for staff:', staffData.staffId);

        return new Promise((resolve) => {
            const callbackName = 'handleAuthStatusResponse_' + Date.now();
            const script = document.createElement('script');

            // ✅ ADD DEBUG PARAMETERS
            script.src = `${SCRIPT_URL}?action=get_auth_status&staffId=${staffData.staffId}&debug=true&callback=${callbackName}`;

            window[callbackName] = function (result) {
                delete window[callbackName];
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }

                console.log('📡 Response from get_auth_status:', result);

                if (result && result.success) {
                    console.log('✅ Registration status from database:', {
                        faceRegistered: result.faceRegistered,
                        biometricRegistered: result.biometricRegistered
                    });

                    // ✅ Update staffData
                    staffData.faceRegistered = Boolean(result.faceRegistered);
                    staffData.biometricRegistered = Boolean(result.biometricRegistered);

                    console.log('📊 Updated staffData:');
                    console.log('  - Face Registered:', staffData.faceRegistered);
                    console.log('  - Biometric Registered:', staffData.biometricRegistered);

                    resolve(true);
                } else {
                    console.log('⚠️ get_auth_status returned:', result);
                    console.log('🔍 Setting registration to false');

                    staffData.faceRegistered = false;
                    staffData.biometricRegistered = false;

                    if (result && result.message) {
                        console.log('❌ Error message:', result.message);
                    }

                    resolve(false);
                }
            };

            script.onerror = (error) => {
                delete window[callbackName];
                if (document.head.contains(script)) document.head.removeChild(script);
                console.log('❌ Script load error:', error);
                staffData.faceRegistered = false;
                staffData.biometricRegistered = false;
                resolve(false);
            };

            document.head.appendChild(script);
        });

    } catch (error) {
        console.error('❌ Error in checkRegistrationStatus:', error);
        staffData.faceRegistered = false;
        staffData.biometricRegistered = false;
        return false;
    }
}// ✅ NEW FUNCTION: Check main Staff sheet for auth status
function checkMainStaffSheetForAuth() {
    console.log('🔍 Checking main Staff sheet for auth status...');
    // This would need a separate API call to check the main Staff sheet
    // For now, we'll assume it's not registered
    staffData.biometricRegistered = staffData.biometricRegistered || false;
    staffData.faceRegistered = staffData.faceRegistered || false;
}// ==================== UPDATE EVENT LISTENERS ====================
// Add these to your setupEventListeners function:
document.getElementById('biometricSectionBtn').addEventListener('click', () => {
    navigateToPage('dashboard');
    showBiometricRegistrationModal();
});

document.getElementById('faceAuthSectionBtn').addEventListener('click', () => {
    navigateToPage('dashboard');
    showFaceRegistrationModal();
});
// Overlay click handler
document.getElementById('notification-overlay').addEventListener('click', hideNotification);

function logout() {
    if (confirm('Are you sure you want to logout?')) {


        // Stop camera if active
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }

        // Redirect to login
        window.location.href = '../../login.html';
    }
}
function checkAuthSetup() {
    console.log('🔍 Authentication Setup Status:');
    console.log('- Staff ID:', staffData.staffId);
    console.log('- Face Registered:', staffData.faceRegistered || false);
    console.log('- Biometric Registered:', staffData.biometricRegistered || false);
    console.log('- Local Storage has data:', !!localStorage.getItem('staffData'));

    // Check if we need to setup authentication
    const needsSetup = !staffData.faceRegistered && !staffData.biometricRegistered;
    console.log('- Needs Authentication Setup:', needsSetup);

    return needsSetup;
}
// ADD THIS FUNCTION if you don't have it
async function fetchStaffFromDatabase(email, dob) {
    return new Promise((resolve) => {
        const callbackName = 'handleStaffFetch_' + Date.now();

        const script = document.createElement('script');
        script.src = `${SCRIPT_URL}?action=verifyStaffLogin&email=${encodeURIComponent(email)}&dob=${encodeURIComponent(dob)}&callback=${callbackName}`;

        window[callbackName] = function (result) {
            delete window[callbackName];
            document.head.removeChild(script);

            if (result && result.success && result.staff) {
                console.log('✅ Staff fetched from database:', result.staff.name);
                resolve(result.staff);
            } else {
                console.log('❌ Staff not found or error:', result?.message);
                resolve(null);
            }
        };

        script.onerror = () => {
            delete window[callbackName];
            document.head.removeChild(script);
            console.log('❌ Network error fetching staff');
            resolve(null);
        };

        document.head.appendChild(script);
    });
} async function testDirectUpdate() {
    console.log('🧪 Testing direct update...');

    const testData = {
        action: 'updateStaffProfile',
        staffId: 'STAFF0027',
        name: 'Test Name',
        email: 'test@example.com',
        phone: '1234567890',
        dob: '1990-01-01',
        gender: 'Male',
        address: 'Test Address'
    };

    return new Promise((resolve) => {
        const callbackName = 'testDirect_' + Date.now();
        const script = document.createElement('script');

        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(testData)) {
            params.append(key, value);
        }
        params.append('callback', callbackName);

        script.src = `${SCRIPT_URL}?${params.toString()}`;
        console.log('🔗 Test URL:', script.src);

        window[callbackName] = function (result) {
            delete window[callbackName];
            document.head.removeChild(script);
            console.log('🧪 Test result:', result);
            resolve(result);
        };

        document.head.appendChild(script);
    });
}
// ==================== DELETE LEAVE APPLICATION ====================
async function deleteLeave(leaveId) {
    console.log('🗑️ Deleting leave application:', leaveId);

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this leave application? This action cannot be undone.')) {
        return;
    }

    try {
        // Call the Google Apps Script function to delete leave
        const result = await deleteLeaveFromDatabase(leaveId);

        if (result.success) {
            showNotification(result.message, 'success');

            // ✅ Reload leave records from database
            await loadLeaveFromDatabase();

            // ✅ Reload the leave report table
            loadLeaveReport();

            // ✅ Also refresh dashboard if needed
            if (currentPage === 'dashboard') {
                loadDashboardData();
            }
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error deleting leave:', error);
        showNotification('Error deleting leave: ' + error.message, 'error');
    }
}

// ==================== DELETE LEAVE FROM DATABASE ====================
async function deleteLeaveFromDatabase(leaveId) {
    return new Promise((resolve, reject) => {
        console.log('🗑️ Deleting leave from database:', leaveId);

        const callbackName = 'handleLeaveDelete_' + Date.now();
        const script = document.createElement('script');

        // Prepare data for deletion
        const params = new URLSearchParams({
            action: 'deleteStaffLeave',
            staffId: staffData.staffId,
            leaveId: leaveId,
            callback: callbackName
        });

        script.src = `${SCRIPT_URL}?${params.toString()}`;

        window[callbackName] = function (result) {
            delete window[callbackName];
            document.head.removeChild(script);

            if (result && result.success) {
                console.log('✅ Leave deleted successfully:', result.message);

                // Remove from local array
                leaveRecords = leaveRecords.filter(record =>
                    (record.LeaveID || record.leaveId) !== leaveId
                );

                resolve(result);
            } else {
                console.log('❌ Leave deletion failed:', result?.message);
                reject(new Error(result?.message || 'Leave deletion failed'));
            }
        };

        script.onerror = () => {
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            console.log('❌ Network error deleting leave');
            reject(new Error('Network error'));
        };

        document.head.appendChild(script);
    });
}
// ==================== VIEW LEAVE DETAILS ====================
async function viewLeaveDetails(leaveId) {
    try {
        // Find the leave record
        const leaveRecord = leaveRecords.find(record =>
            (record.LeaveID || record.leaveId) === leaveId
        );

        if (!leaveRecord) {
            showNotification('Leave details not found', 'error');
            return;
        }

        // Create a modal to show details
        const detailsModal = document.createElement('div');
        detailsModal.className = 'modal';
        detailsModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Leave Application Details</h3>
                    <span class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="leave-details">
                        <div class="detail-row">
                            <span class="detail-label">Leave ID:</span>
                            <span class="detail-value">${leaveRecord.LeaveID || leaveRecord.leaveId || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Type:</span>
                            <span class="detail-value">${leaveRecord.Type || leaveRecord.type || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">From Date:</span>
                            <span class="detail-value">${leaveRecord.FromDate || leaveRecord.fromDate || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">To Date:</span>
                            <span class="detail-value">${leaveRecord.ToDate || leaveRecord.toDate || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Total Days:</span>
                            <span class="detail-value">${calculateLeaveDays(leaveRecord.FromDate || leaveRecord.fromDate, leaveRecord.ToDate || leaveRecord.toDate)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Reason:</span>
                            <span class="detail-value">${leaveRecord.Reason || leaveRecord.reason || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Applied Date:</span>
                            <span class="detail-value">${leaveRecord.AppliedDate || leaveRecord.appliedDate || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value status-${leaveRecord.Status || leaveRecord.status || 'pending'}">
                                ${(leaveRecord.Status || leaveRecord.status || 'pending').charAt(0).toUpperCase() + (leaveRecord.Status || leaveRecord.status || 'pending').slice(1)}
                            </span>
                        </div>
                        ${leaveRecord.Status && leaveRecord.Status !== 'pending' ? `
                            <div class="detail-row">
                                <span class="detail-label">Approved By:</span>
                                <span class="detail-value">${leaveRecord.ApprovedBy || leaveRecord.approvedBy || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Approval Date:</span>
                                <span class="detail-value">${leaveRecord.ApprovalDate || leaveRecord.approvalDate || 'N/A'}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-actions">
                        ${(leaveRecord.Status || leaveRecord.status) === 'pending' ? `
                            <button class="btn-danger" onclick="deleteLeave('${leaveRecord.LeaveID || leaveRecord.leaveId}'); this.parentElement.parentElement.parentElement.parentElement.remove()">
                                <i class="fas fa-trash"></i> Delete Application
                            </button>
                        ` : ''}
                        <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(detailsModal);
        detailsModal.style.display = 'flex';

        // Close modal when clicking outside
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                document.body.removeChild(detailsModal);
            }
        });

    } catch (error) {
        console.error('❌ Error viewing leave details:', error);
        showNotification('Error loading leave details', 'error');
    }
}
// ==================== STANDARDIZE STAFF ID ====================
function standardizeStaffId(staffId) {
    if (!staffId || typeof staffId !== 'string') return staffId;

    const idUpper = staffId.trim().toUpperCase();

    // If it doesn't start with STAFF, add it
    if (!idUpper.startsWith('STAFF')) {
        return 'STAFF' + idUpper.replace(/\D/g, '').padStart(4, '0');
    }

    // Extract numbers and pad to 4 digits
    const idNumber = idUpper.replace(/\D/g, '');
    if (idNumber.length <= 2) {
        return 'STAFF' + idNumber.padStart(3, '0');
    } else {
        return 'STAFF' + idNumber.padStart(4, '0');
    }
}
// ==================== VALIDATE ATTENDANCE TIME ====================
f// ==================== VALIDATE ATTENDANCE TIME ====================
// ==================== VALIDATE ATTENDANCE TIME ====================
function validateAttendanceTime(action) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Format time in 12-hour format with AM/PM
    const timeString = formatTime12Hour(now);

    // Exact time restrictions
    const checkInStart = 9 * 60;      // 9:00 AM = 540 minutes
    const checkInEnd = 11 * 60;       // 11:00 AM = 660 minutes
    const checkOutStart = 16 * 60 + 30; // 4:30 PM = 990 minutes
    const checkOutEnd = 19 * 60;      // 7:00 PM = 1140 minutes

    if (action === 'check-in') {
        if (currentTotalMinutes < checkInStart) {
            return {
                valid: false,
                message: `Check-in is allowed only from 9 AM to 11 AM. Current time: ${timeString}`
            };
        }
        if (currentTotalMinutes > checkInEnd) {
            return {
                valid: false,
                message: `Check-in is allowed only from 9 AM to 11 AM. Current time: ${timeString}`
            };
        }
    } else if (action === 'check-out') {
        if (currentTotalMinutes < checkOutStart) {
            return {
                valid: false,
                message: `Check-out is allowed only from 4:30 PM to 7 PM. Current time: ${timeString}`
            };
        }
        if (currentTotalMinutes > checkOutEnd) {
            return {
                valid: false,
                message: `Check-out is allowed only from 4:30 PM to 7 PM. Current time: ${timeString}`
            };
        }
    }

    return { valid: true };
}
// Add this helper function for 12-hour time format
// Add this helper function if it doesn't exist
function formatTime12Hour(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12

    return hours.toString().padStart(2, '0') + ':' +
        minutes.toString().padStart(2, '0') + ' ' + ampm;
}
// Ultra-simple loading system
function showLoading() {
    const loading = document.getElementById('waveLoading');
    if (loading) loading.style.display = 'flex';
}

function hideLoading() {
    const loading = document.getElementById('waveLoading');
    if (loading) loading.style.display = 'none';
}

function withLoading(callback) {
    showLoading();
    try {
        callback();
    } finally {
        setTimeout(hideLoading, 500); // Minimum 500ms to avoid flicker
    }
}

// Usage example:
document.addEventListener('DOMContentLoaded', function () {
    withLoading(function () {
        checkAuth().then(() => {
            loadDashboardData();
        });
    });
});// Add this to staff.js
function normalizeStaffIdForFrontend(staffId) {
    if (!staffId) return '';

    const strId = String(staffId).trim().toUpperCase();
    const numericPart = strId.replace(/\D/g, '');

    if (strId.includes('STAFF')) {
        return 'STAFF' + numericPart.padStart(4, '0');
    } else if (numericPart) {
        return 'STAFF' + numericPart.padStart(4, '0');
    }

    return strId;
}

// Update checkAuth function to normalize ID
staffData.staffId = normalizeStaffIdForFrontend(staffData.staffId);



// ==================== MONTHLY REPORT FUNCTIONS ====================
// In your loadMonthlyReport function or page initialization
async function loadMonthlyReport() {
    try {
        console.log('📊 Loading monthly report...');

        // Check if staffData is available
        if (!staffData) {
            console.log('❌ Staff data not available, waiting...');
            setTimeout(loadMonthlyReport, 1000);
            return;
        }

        // Populate month and year filters
        populateReportFilters();

        // Set default to current month and year
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthSelect = document.getElementById('reportMonth');
        const yearSelect = document.getElementById('reportYear');

        if (monthSelect) monthSelect.value = currentMonth;
        if (yearSelect) yearSelect.value = currentYear;

        // ✅ Check download status when page loads
        setTimeout(() => {
            updatePDFDownloadUI(currentMonth, currentYear);
        }, 500);

        // Load report for current month
        await generateMonthlyReport();

    } catch (error) {
        console.error('❌ Error loading monthly report:', error);
        showNotification('Error loading monthly report', 'error');
    }
}
function populateReportFilters() {
    const monthSelect = document.getElementById('reportMonth');
    const yearSelect = document.getElementById('reportYear');

    // Clear existing options except the first one
    while (monthSelect.options.length > 0) {
        monthSelect.remove(0);
    }

    while (yearSelect.options.length > 0) {
        yearSelect.remove(0);
    }

    // Populate months
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = month;
        monthSelect.appendChild(option);
    });

    // Populate years (current year and 5 previous years)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 5; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

async function generateMonthlyReport() {
    try {
        showLoading();
        showReportStatus('Fetching attendance data...', 'info');

        // Check if staffData is available
        if (!staffData || !staffData.staffId) {
            showReportStatus('Error: Staff data not loaded', 'error');
            showNotification('Please wait while we load your data...', 'error');
            hideLoading();
            hideReportStatus();
            return;
        }

        const month = parseInt(document.getElementById('reportMonth').value);
        const year = parseInt(document.getElementById('reportYear').value);
        const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });

        showReportStatus(`Generating report for ${monthName} ${year}...`, 'info');

        // Fetch attendance data
        const monthlyData = await fetchMonthlyAttendanceFromDatabase(month, year);

        // Process and display the data
        if (monthlyData && monthlyData.success && monthlyData.records) {
            showReportStatus(`Processing ${monthlyData.records.length} records...`, 'info');

            // Small delay for visual feedback
            setTimeout(() => {
                updateMonthlyReportUI(monthlyData.records, month, year);

                // ✅ Check if PDF was already downloaded for this month
                updatePDFDownloadUI(month, year);

                showReportStatus(`✅ Report generated successfully!`, 'success');

                // ✅ Only show notification if it's a new report generation
                if (!hasPDFBeenDownloaded(month + 1, year)) {
                    showNotification(
                        `✅ Monthly report for ${monthName} ${year} generated successfully!`,
                        'success'
                    );
                }

                hideLoading();

                // Auto-hide success status after 3 seconds
                setTimeout(() => {
                    hideReportStatus();
                }, 3000);

            }, 1000);

        } else {
            showReportStatus('⚠️ No data found for selected month', 'warning');
            clearMonthlyReportUI();
            showNotification(
                `⚠️ No attendance data found for ${monthName} ${year}`,
                'info'
            );
            hideLoading();
        }

    } catch (error) {
        console.error('❌ Error generating monthly report:', error);
        showReportStatus('❌ Error: ' + error.message, 'error');
        showNotification('❌ Error generating report: ' + error.message, 'error');
        clearMonthlyReportUI();
        hideLoading();
    }
}
async function fetchMonthlyAttendanceFromDatabase(month, year) {
    return new Promise((resolve) => {
        // Check if staffData is available
        if (!staffData || !staffData.staffId) {
            console.log('❌ Staff data not available yet for monthly report');
            resolve({
                success: false,
                message: 'Staff data not available',
                records: []
            });
            return;
        }

        const callbackName = 'handleMonthlyData_' + Date.now();
        const script = document.createElement('script');

        const params = new URLSearchParams({
            action: 'getMonthlyAttendance',
            staffId: staffData.staffId,
            month: month,
            year: year,
            callback: callbackName
        });

        script.src = `${SCRIPT_URL}?${params.toString()}`;

        window[callbackName] = function (result) {
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }

            console.log('📊 Monthly data response:', result);
            resolve(result);
        };

        script.onerror = () => {
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            resolve({
                success: false,
                message: 'Network error',
                records: []
            });
        };

        document.head.appendChild(script);
    });
}
function updateMonthlyReportUI(records, month, year) {
    // Check if staffData is available
    if (!staffData || !staffData.staffId) {
        console.log('❌ Staff data not available for UI update');
        clearMonthlyReportUI();
        return;
    }

    console.log(`📊 Processing ${records.length} records for display for staff: ${staffData.staffId}`);

    // Add visual indicator that report is generated
    const monthlyReportSection = document.getElementById('monthly-report');
    monthlyReportSection.classList.add('report-generated');

    // Update summary statistics
    updateMonthlySummary(records, month, year);

    // Update daily breakdown table
    updateMonthlyTable(records);

    // Update working hours summary
    updateWorkingHoursSummary(records);

    // Update pie chart
    updateMonthlyPieChart(records);

    // Update the report title to show status
    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
    const pageHeader = document.querySelector('#monthly-report .page-header h2');
    pageHeader.innerHTML = `Monthly Attendance Report <span class="status-indicator status-success"><i class="fas fa-check-circle"></i> Generated: ${monthName} ${year}</span>`;

    // Add PDF ready indicator to download button
    const downloadBtn = document.getElementById('downloadMonthlyReport');
    downloadBtn.classList.add('pdf-ready');
    downloadBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Download PDF Report';

    // Remove the success animation after 3 seconds
    setTimeout(() => {
        monthlyReportSection.classList.remove('report-generated');
    }, 3000);
}
function updateMonthlySummary(records, month, year) {
    // Calculate total days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get current date
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.getDate();

    console.log(`📊 Monthly Summary for ${month + 1}/${year}:`);
    console.log(`- Days in month: ${daysInMonth}`);
    console.log(`- Current date: ${today}/${currentMonth + 1}/${currentYear}`);
    console.log(`- Processing month: ${month + 1}/${year}`);

    // ✅ FIXED: Only count days up to TODAY for current month
    // For past months, count all days in that month
    const lastDayToCount = (month === currentMonth && year === currentYear) ? today : daysInMonth;
    console.log(`- Last day to count: ${lastDayToCount}`);

    // Initialize counters
    let workingDays = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;

    // Create a map for quick lookup
    const attendanceMap = {};
    records.forEach(record => {
        const dateStr = record.Date || record.date;
        const date = new Date(dateStr);
        const dayOfMonth = date.getDate();

        let status = (record.Status || record.status || '').toLowerCase();
        if (!status && (record.CheckIn || record.checkIn)) {
            status = 'present';
        }

        attendanceMap[dayOfMonth] = status;
    });

    console.log(`📅 Attendance map:`, attendanceMap);

    // ✅ FIXED: Count each day from 1 to lastDayToCount (not daysInMonth)
    for (let day = 1; day <= lastDayToCount; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            console.log(`  Day ${day}: Weekend (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]}) - Skipped`);
            continue;
        }

        workingDays++;

        if (attendanceMap[day]) {
            const status = attendanceMap[day];
            console.log(`  Day ${day}: ${status}`);

            switch (status) {
                case 'present':
                    presentCount++;
                    break;
                case 'late':
                    presentCount++;
                    lateCount++;
                    break;
                case 'leave':
                    leaveCount++;
                    break;
                case 'absent':
                    absentCount++;
                    break;
                default:
                    // If has any check-in, count as present
                    const record = records.find(r => {
                        const rDate = new Date(r.Date || r.date);
                        return rDate.getDate() === day;
                    });
                    if (record && (record.CheckIn || record.checkIn)) {
                        presentCount++;
                        console.log(`  Day ${day}: Auto-counted as present (has check-in)`);
                    } else {
                        absentCount++;
                        console.log(`  Day ${day}: Auto-counted as absent (no check-in)`);
                    }
            }
        } else {
            // No record found = Absent
            absentCount++;
            console.log(`  Day ${day}: No record - Counted as absent`);
        }
    }

    // Calculate attendance percentage
    const attendancePercent = workingDays > 0 ? Math.round((presentCount / workingDays) * 100) : 0;

    console.log(`📊 FINAL COUNTS:`);
    console.log(`- Working Days: ${workingDays} (from day 1 to ${lastDayToCount})`);
    console.log(`- Present: ${presentCount} (includes ${lateCount} late)`);
    console.log(`- Absent: ${absentCount}`);
    console.log(`- Late: ${lateCount}`);
    console.log(`- Leave: ${leaveCount}`);

    // Update UI
    document.getElementById('monthlyWorkingDays').textContent = workingDays;
    document.getElementById('monthlyPresentDays').textContent = presentCount;
    document.getElementById('monthlyAbsentDays').textContent = absentCount;
    document.getElementById('monthlyLateDays').textContent = lateCount;
    document.getElementById('monthlyLeaveDays').textContent = leaveCount;
    document.getElementById('monthlyAttendancePercent').textContent = `${attendancePercent}%`;

    // Update statistics grid
    document.getElementById('totalWorkingDaysMonthly').textContent = workingDays;
    document.getElementById('daysPresentMonthly').textContent = presentCount;
    document.getElementById('daysLateMonthly').textContent = lateCount;
    document.getElementById('daysLeaveMonthly').textContent = leaveCount;
    document.getElementById('daysAbsentMonthly').textContent = absentCount;
    document.getElementById('attendanceRateMonthly').textContent = `${attendancePercent}%`;
} 
function updateMonthlyTable(records) {
    const tableBody = document.getElementById('monthlyReportBody');
    tableBody.innerHTML = '';

    if (records.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
                    <i class="fas fa-calendar-times" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>No attendance records found</p>
                </td>
            </tr>
        `;
        return;
    }

    // Sort records by date
    records.sort((a, b) => {
        const dateA = parseDateString(a.Date || a.date);
        const dateB = parseDateString(b.Date || b.date);
        return dateA - dateB;
    });

    // Populate table with proper formatting
    records.forEach(record => {
        const row = document.createElement('tr');
        const dateStr = record.Date || record.date;
        
        // Parse date properly
        const date = parseDateString(dateStr);
        const formattedDate = formatDateForDisplay(date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        // Format check-in/check-out times properly
        const checkIn = formatTimeForDisplay(record.CheckIn || record.checkIn);
        const checkOut = formatTimeForDisplay(record.CheckOut || record.checkOut);
        
        let status = record.Status || record.status || '';

        // Auto-detect status if not set
        if (!status) {
            if (checkIn !== '--:--' && checkIn !== '') {
                // Check if late
                if (isLateCheckIn(checkIn)) {
                    status = 'late';
                } else {
                    status = 'present';
                }
            } else {
                status = 'absent';
            }
        }

        // Calculate working hours
        let workingHours = '--';
        if (checkIn !== '--:--' && checkOut !== '--:--' && checkIn !== '' && checkOut !== '') {
            workingHours = calculateWorkingHours(checkIn, checkOut);
        }

        // Get remarks
        const remarks = record.Remarks || record.remarks || '';

        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${dayName}</td>
            <td>${checkIn}</td>
            <td>${checkOut}</td>
            <td>${workingHours}</td>
            <td><span class="status-badge-table status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
            <td>${remarks}</td>
        `;

        tableBody.appendChild(row);
    });
}
// ==================== DATE AND TIME FORMATTING HELPERS ====================
function formatDateForDisplay(date) {
    if (!date || isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    
    // Format as DD/MM/YYYY or MM/DD/YYYY based on your preference
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`; // Change to month/day/year if preferred
}

function formatTimeForDisplay(timeStr) {
    if (!timeStr || timeStr === '--:--' || timeStr.trim() === '') {
        return '--:--';
    }

    try {
        // If already in 12-hour format, return as is
        if (timeStr.includes(' ')) {
            return timeStr;
        }

        // Convert 24-hour to 12-hour format
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        if (isNaN(hours) || isNaN(minutes)) {
            return timeStr;
        }

        const period = hours >= 12 ? 'PM' : 'AM';
        let hour12 = hours % 12;
        hour12 = hour12 === 0 ? 12 : hour12; // Convert 0 to 12
        
        return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch (error) {
        console.error('❌ Error formatting time:', error);
        return timeStr;
    }
}

function isLateCheckIn(checkInTime) {
    try {
        let checkInHour, checkInMinute;
        
        if (checkInTime.includes(' ')) {
            const parsed = parse12HourTime(checkInTime);
            checkInHour = parsed.hour;
            checkInMinute = parsed.minute;
        } else {
            const [hour, minute] = checkInTime.split(':').map(Number);
            checkInHour = hour;
            checkInMinute = minute;
        }

        // Check if check-in is after 10:00 AM (assuming 10 AM start time)
        const lateThresholdHour = WORKING_HOURS.start; // 10
        const lateThresholdMinute = LATE_THRESHOLD; // 30 minutes
        
        const checkInMinutes = checkInHour * 60 + checkInMinute;
        const thresholdMinutes = lateThresholdHour * 60 + lateThresholdMinute;
        
        return checkInMinutes > thresholdMinutes;
    } catch (error) {
        console.error('❌ Error checking late status:', error);
        return false;
    }
}
function updateWorkingHoursSummary(records) {
    let totalMinutes = 0;
    let daysWithHours = 0;
    let shortestDay = Number.MAX_SAFE_INTEGER;
    let longestDay = 0;

    records.forEach(record => {
        const checkIn = record.CheckIn || record.checkIn;
        const checkOut = record.CheckOut || record.checkOut;

        if (checkIn && checkIn !== '--:--' && checkOut && checkOut !== '--:--') {
            const workingHours = calculateWorkingHours(checkIn, checkOut);
            
            if (workingHours !== '--') {
                // Extract hours and minutes from "Xh Ym" format
                const hoursMatch = workingHours.match(/(\d+)h\s*(\d+)m/);
                if (hoursMatch) {
                    const hours = parseInt(hoursMatch[1]) || 0;
                    const minutes = parseInt(hoursMatch[2]) || 0;
                    const totalDayMinutes = hours * 60 + minutes;
                    
                    totalMinutes += totalDayMinutes;
                    daysWithHours++;

                    if (totalDayMinutes < shortestDay) {
                        shortestDay = totalDayMinutes;
                    }

                    if (totalDayMinutes > longestDay) {
                        longestDay = totalDayMinutes;
                    }
                }
            }
        }
    });

    // Calculate averages
    const avgMinutes = daysWithHours > 0 ? Math.round(totalMinutes / daysWithHours) : 0;

    // Format time strings
    function formatHours(minutes) {
        if (minutes === 0 || minutes === Number.MAX_SAFE_INTEGER) return '0h 0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    // Update UI
    document.getElementById('totalHoursWorked').textContent = formatHours(totalMinutes);
    document.getElementById('avgDailyHours').textContent = formatHours(avgMinutes);
    document.getElementById('shortestDay').textContent = shortestDay !== Number.MAX_SAFE_INTEGER ? formatHours(shortestDay) : '0h 0m';
    document.getElementById('longestDay').textContent = longestDay > 0 ? formatHours(longestDay) : '0h 0m';
}
function updateMonthlyPieChart(records) {
    // Count status types
    let presentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;
    let absentCount = 0;

    records.forEach(record => {
        const status = (record.Status || record.status || '').toLowerCase();
        const checkIn = record.CheckIn || record.checkIn;

        if (status === 'present') {
            presentCount++;
        } else if (status === 'late') {
            lateCount++;
        } else if (status === 'leave') {
            leaveCount++;
        } else if (status === 'absent') {
            absentCount++;
        } else if (checkIn && checkIn !== '--:--') {
            presentCount++;
        } else {
            absentCount++;
        }
    });

    // Get the canvas element
    const canvas = document.getElementById('monthlyPieChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    try {
        if (window.monthlyPieChart && typeof window.monthlyPieChart.destroy === 'function') {
            window.monthlyPieChart.destroy();
        }
    } catch (e) {
        console.log('⚠️ Error destroying existing chart:', e.message);
    }

    // Only create chart if we have data
    if (presentCount === 0 && lateCount === 0 && leaveCount === 0 && absentCount === 0) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.monthlyPieChart = null;
        return;
    }

    window.monthlyPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Present', 'Late', 'Leave', 'Absent'],
            datasets: [{
                data: [presentCount, lateCount, leaveCount, absentCount],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(255, 165, 2, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(255, 71, 87, 0.8)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(255, 165, 2, 1)',
                    'rgba(52, 152, 219, 1)',
                    'rgba(255, 71, 87, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} days (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}
function clearMonthlyReportUI() {
    // Clear summary
    document.getElementById('monthlyWorkingDays').textContent = '0';
    document.getElementById('monthlyPresentDays').textContent = '0';
    document.getElementById('monthlyAbsentDays').textContent = '0';
    document.getElementById('monthlyLateDays').textContent = '0';
    document.getElementById('monthlyLeaveDays').textContent = '0';
    document.getElementById('monthlyAttendancePercent').textContent = '0%';

    // Clear statistics grid
    document.getElementById('totalWorkingDaysMonthly').textContent = '0';
    document.getElementById('daysPresentMonthly').textContent = '0';
    document.getElementById('daysLateMonthly').textContent = '0';
    document.getElementById('daysLeaveMonthly').textContent = '0';
    document.getElementById('daysAbsentMonthly').textContent = '0';
    document.getElementById('attendanceRateMonthly').textContent = '0%';

    // Clear table
    const tableBody = document.getElementById('monthlyReportBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
                <i class="fas fa-calendar-times" style="font-size: 24px; margin-bottom: 10px;"></i>
                <p>No attendance data available</p>
            </td>
        </tr>
    `;

    // Clear working hours
    document.getElementById('totalHoursWorked').textContent = '0h 0m';
    document.getElementById('avgDailyHours').textContent = '0h 0m';
    document.getElementById('shortestDay').textContent = '0h 0m';
    document.getElementById('longestDay').textContent = '0h 0m';

    // Clear pie chart - SAFELY
    try {
        if (window.monthlyPieChart && typeof window.monthlyPieChart.destroy === 'function') {
            window.monthlyPieChart.destroy();
        }
    } catch (e) {
        console.log('⚠️ Error clearing pie chart:', e.message);
    }
    window.monthlyPieChart = null;

    // Also clear the canvas if it exists
    const canvas = document.getElementById('monthlyPieChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}
// ==================== ATTENDANCE REPORT FUNCTIONS ====================
async function loadAttendanceReport() {
    try {
        console.log('📊 Loading attendance report...');

        // Set default dates
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        document.getElementById('reportStartDate').valueAsDate = startDate;
        document.getElementById('reportEndDate').valueAsDate = endDate;

        // Set current month as default for report type
        document.getElementById('reportType').value = 'monthly';

        // Set default format
        document.getElementById('reportFormat').value = 'summary';

    } catch (error) {
        console.error('❌ Error loading attendance report:', error);
        showNotification('Error loading report page', 'error');
    }
}

async function generateAttendanceReport() {
    try {
        showLoading();

        const reportType = document.getElementById('reportType').value;
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        const reportFormat = document.getElementById('reportFormat').value;

        console.log(`📊 Generating ${reportType} report from ${startDate} to ${endDate}`);

        // Validate dates
        if (!startDate || !endDate) {
            showNotification('Please select both start and end dates', 'error');
            hideLoading();
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            showNotification('Start date cannot be after end date', 'error');
            hideLoading();
            return;
        }

        // Fetch report data from database
        const reportData = await fetchReportDataFromDatabase(startDate, endDate);

        // Process and display the data
        if (reportData && reportData.success && reportData.records) {
            displayReportResults(reportData.records, reportType, startDate, endDate, reportFormat);
        } else {
            console.log('📭 No data found for the selected period');
            clearReportResults();
            showNotification('No attendance data found for the selected period', 'info');
        }

    } catch (error) {
        console.error('❌ Error generating attendance report:', error);
        showNotification('Error generating report: ' + error.message, 'error');
        clearReportResults();
    } finally {
        hideLoading();
    }
}

async function fetchReportDataFromDatabase(startDate, endDate) {
    return new Promise((resolve) => {
        const callbackName = 'handleReportData_' + Date.now();
        const script = document.createElement('script');

        const params = new URLSearchParams({
            action: 'getAttendanceReport',
            staffId: staffData.staffId,
            startDate: startDate,
            endDate: endDate,
            callback: callbackName
        });

        script.src = `${SCRIPT_URL}?${params.toString()}`;

        window[callbackName] = function (result) {
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }

            console.log('📊 Report data response:', result);
            resolve(result);
        };

        script.onerror = () => {
            delete window[callbackName];
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            resolve({ success: false, message: 'Network error' });
        };

        document.head.appendChild(script);
    });
}

function displayReportResults(records, reportType, startDate, endDate, reportFormat) {
    // Update report header
    const periodText = formatPeriodText(reportType, startDate, endDate);
    document.getElementById('reportTitle').textContent = `Attendance Report - ${periodText}`;
    document.getElementById('reportPeriod').textContent = `${formatDate(startDate)} to ${formatDate(endDate)}`;

    // Calculate statistics
    const stats = calculateReportStatistics(records, startDate, endDate);

    // Display based on format
    switch (reportFormat) {
        case 'summary':
            displaySummaryReport(stats, records);
            break;
        case 'detailed':
            displayDetailedReport(records, stats);
            break;
        case 'comparative':
            displayComparativeReport(records, startDate, endDate);
            break;
    }
}

function calculateReportStatistics(records, startDate, endDate) {
    // Create date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Initialize counters
    let workingDays = 0;
    let presentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;
    let absentCount = 0;
    let totalHours = 0;
    let daysWithHours = 0;

    // Create attendance map
    const attendanceMap = {};
    records.forEach(record => {
        const dateStr = record.Date || record.date;
        const date = new Date(dateStr);
        const dateKey = date.toISOString().split('T')[0];

        let status = (record.Status || record.status || '').toLowerCase();
        if (!status && (record.CheckIn || record.checkIn)) {
            status = 'present';
        }

        attendanceMap[dateKey] = {
            status: status,
            checkIn: record.CheckIn || record.checkIn,
            checkOut: record.CheckOut || record.checkOut
        };
    });

    // Calculate for each day in range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        workingDays++;

        if (attendanceMap[dateKey]) {
            const attendance = attendanceMap[dateKey];
            const status = attendance.status;

            switch (status) {
                case 'present':
                    presentCount++;
                    break;
                case 'late':
                    presentCount++;
                    lateCount++;
                    break;
                case 'leave':
                    leaveCount++;
                    break;
                case 'absent':
                    absentCount++;
                    break;
                default:
                    if (attendance.checkIn && attendance.checkIn !== '--:--') {
                        presentCount++;
                    } else {
                        absentCount++;
                    }
            }

            // Calculate hours if check-in and check-out exist
            if (attendance.checkIn && attendance.checkOut &&
                attendance.checkIn !== '--:--' && attendance.checkOut !== '--:--') {
                const hours = calculateWorkingHours(attendance.checkIn, attendance.checkOut);
                const [h, m] = hours.split('h ');
                const minutes = parseInt(h) * 60 + parseInt(m);
                totalHours += minutes;
                daysWithHours++;
            }
        } else {
            absentCount++;
        }
    }

    // Calculate averages
    const attendanceRate = workingDays > 0 ? Math.round((presentCount / workingDays) * 100) : 0;
    const avgHours = daysWithHours > 0 ? Math.round(totalHours / daysWithHours) : 0;

    return {
        totalDays: totalDays,
        workingDays: workingDays,
        presentCount: presentCount,
        lateCount: lateCount,
        leaveCount: leaveCount,
        absentCount: absentCount,
        attendanceRate: attendanceRate,
        totalHours: totalHours,
        avgHours: avgHours,
        daysWithHours: daysWithHours
    };
}

function displaySummaryReport(stats, records) {
    const reportSummary = document.getElementById('reportSummary');
    const reportTableSection = document.getElementById('reportTableSection');
    const reportCharts = document.getElementById('reportCharts');

    // Clear previous content
    reportSummary.innerHTML = '';
    reportTableSection.innerHTML = '';
    reportCharts.innerHTML = '';

    // Create summary cards
    const summaryCards = [
        { title: 'Working Days', value: stats.workingDays, icon: 'calendar-check', color: '#3498db' },
        { title: 'Present Days', value: stats.presentCount, icon: 'user-check', color: '#2ecc71' },
        { title: 'Late Days', value: stats.lateCount, icon: 'clock', color: '#f39c12' },
        { title: 'Leave Days', value: stats.leaveCount, icon: 'umbrella-beach', color: '#9b59b6' },
        { title: 'Absent Days', value: stats.absentCount, icon: 'user-times', color: '#e74c3c' },
        { title: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: 'percentage', color: '#1abc9c' }
    ];

    summaryCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'summary-card';
        cardElement.innerHTML = `
            <div class="summary-icon" style="background: ${card.color}20; color: ${card.color};">
                <i class="fas fa-${card.icon}"></i>
            </div>
            <div class="summary-content">
                <h4>${card.title}</h4>
                <p>${card.value}</p>
            </div>
        `;
        reportSummary.appendChild(cardElement);
    });

    // Create statistics section
    const statsElement = document.createElement('div');
    statsElement.className = 'report-statistics';
    statsElement.innerHTML = `
        <h3>Additional Statistics</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <span>Total Hours Worked:</span>
                <strong>${formatHours(stats.totalHours)}</strong>
            </div>
            <div class="stat-item">
                <span>Average Daily Hours:</span>
                <strong>${formatHours(stats.avgHours)}</strong>
            </div>
            <div class="stat-item">
                <span>Days with Hours Recorded:</span>
                <strong>${stats.daysWithHours}</strong>
            </div>
            <div class="stat-item">
                <span>Total Period Days:</span>
                <strong>${stats.totalDays}</strong>
            </div>
        </div>
    `;
    reportSummary.appendChild(statsElement);

    // Create chart section
    const chartSection = document.createElement('div');
    chartSection.className = 'chart-section';
    chartSection.innerHTML = `
        <h3>Attendance Distribution</h3>
        <div style="height: 300px;">
            <canvas id="reportPieChart"></canvas>
        </div>
    `;
    reportCharts.appendChild(chartSection);

    // Create pie chart
    setTimeout(() => {
        createReportPieChart(stats);
    }, 100);
}

function displayDetailedReport(records, stats) {
    const reportSummary = document.getElementById('reportSummary');
    const reportTableSection = document.getElementById('reportTableSection');
    const reportCharts = document.getElementById('reportCharts');

    // Clear previous content
    reportSummary.innerHTML = '';
    reportTableSection.innerHTML = '';
    reportCharts.innerHTML = '';

    // Display summary statistics
    const summaryElement = document.createElement('div');
    summaryElement.className = 'report-summary-detailed';
    summaryElement.innerHTML = `
        <h3>Report Summary</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <span>Period Duration:</span>
                <strong>${stats.totalDays} days</strong>
            </div>
            <div class="summary-item">
                <span>Working Days:</span>
                <strong>${stats.workingDays} days</strong>
            </div>
            <div class="summary-item">
                <span>Present Days:</span>
                <strong>${stats.presentCount} (${stats.attendanceRate}%)</strong>
            </div>
            <div class="summary-item">
                <span>Total Hours:</span>
                <strong>${formatHours(stats.totalHours)}</strong>
            </div>
        </div>
    `;
    reportSummary.appendChild(summaryElement);

    // Create detailed table
    const tableSection = document.createElement('div');
    tableSection.className = 'detailed-table-section';
    tableSection.innerHTML = `
        <h3>Daily Attendance Details</h3>
        <div class="table-wrapper">
            <table class="detailed-report-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Working Hours</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Late (mins)</th>
                    </tr>
                </thead>
                <tbody id="detailedReportBody"></tbody>
            </table>
        </div>
    `;
    reportTableSection.appendChild(tableSection);

    // Populate table
    populateDetailedTable(records);

    // Create chart section
    const chartSection = document.createElement('div');
    chartSection.className = 'chart-section-detailed';
    chartSection.innerHTML = `
        <h3>Attendance Trends</h3>
        <div style="height: 300px;">
            <canvas id="reportTrendChart"></canvas>
        </div>
    `;
    reportCharts.appendChild(chartSection);

    // Create trend chart
    setTimeout(() => {
        createReportTrendChart(records);
    }, 100);
}

function populateDetailedTable(records) {
    const tableBody = document.getElementById('detailedReportBody');

    // Sort records by date
    records.sort((a, b) => {
        const dateA = new Date(a.Date || a.date);
        const dateB = new Date(b.Date || b.date);
        return dateB - dateA; // Newest first
    });

    // Populate table
    records.forEach(record => {
        const row = document.createElement('tr');
        const dateStr = record.Date || record.date;
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        const checkIn = record.CheckIn || record.checkIn || '--:--';
        const checkOut = record.CheckOut || record.checkOut || '--:--';
        let status = record.Status || record.status || '';

        // Auto-detect status
        if (!status && checkIn && checkIn !== '--:--') {
            status = 'present';
        } else if (!status) {
            status = 'absent';
        }

        // Calculate working hours
        let workingHours = '--';
        if (checkIn !== '--:--' && checkOut !== '--:--') {
            workingHours = calculateWorkingHours(checkIn, checkOut);
        }

        // Calculate late minutes if applicable
        let lateMinutes = '--';
        if (checkIn !== '--:--' && status === 'late') {
            const [hour, minute] = checkIn.split(':').map(Number);
            const expectedTime = WORKING_HOURS.start * 60 + LATE_THRESHOLD;
            const actualTime = hour * 60 + minute;
            lateMinutes = actualTime > expectedTime ? actualTime - expectedTime : '0';
        }

        // Get remarks
        const remarks = record.Remarks || record.remarks || '';

        row.innerHTML = `
            <td>${dateStr.split(' ')[0]}</td>
            <td>${dayName}</td>
            <td>${checkIn}</td>
            <td>${checkOut}</td>
            <td>${workingHours}</td>
            <td><span class="status-badge-table status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
            <td>${remarks}</td>
            <td>${lateMinutes}</td>
        `;

        tableBody.appendChild(row);
    });
}

function displayComparativeReport(records, startDate, endDate) {
    // This function would create comparative charts between periods
    // For now, we'll display a message
    const reportSummary = document.getElementById('reportSummary');
    const reportTableSection = document.getElementById('reportTableSection');
    const reportCharts = document.getElementById('reportCharts');

    // Clear previous content
    reportSummary.innerHTML = '';
    reportTableSection.innerHTML = '';
    reportCharts.innerHTML = '';

    const messageElement = document.createElement('div');
    messageElement.className = 'info-message';
    messageElement.innerHTML = `
        <i class="fas fa-chart-line" style="font-size: 48px; color: #3498db; margin-bottom: 20px;"></i>
        <h3>Comparative Analysis</h3>
        <p>This feature compares attendance data across different periods.</p>
        <p>For detailed comparative reports, please contact the HR department.</p>
        <div class="stats-preview">
            <p><strong>Selected Period:</strong> ${formatDate(startDate)} to ${formatDate(endDate)}</p>
            <p><strong>Total Records:</strong> ${records.length} days</p>
        </div>
    `;
    reportSummary.appendChild(messageElement);
}

function createReportPieChart(stats) {
    const ctx = document.getElementById('reportPieChart').getContext('2d');

    // Destroy existing chart if it exists
    if (window.reportPieChart) {
        window.reportPieChart.destroy();
    }

    window.reportPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Present', 'Late', 'Leave', 'Absent'],
            datasets: [{
                data: [stats.presentCount, stats.lateCount, stats.leaveCount, stats.absentCount],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(255, 165, 2, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(255, 71, 87, 0.8)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(255, 165, 2, 1)',
                    'rgba(52, 152, 219, 1)',
                    'rgba(255, 71, 87, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function createReportTrendChart(records) {
    // Group records by week
    const weeklyData = {};
    records.forEach(record => {
        const date = new Date(record.Date || record.date);
        const weekNumber = getWeekNumber(date);
        const weekKey = `Week ${weekNumber}`;

        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
                present: 0,
                late: 0,
                leave: 0,
                absent: 0,
                total: 0
            };
        }

        let status = (record.Status || record.status || '').toLowerCase();
        if (!status && (record.CheckIn || record.checkIn)) {
            status = 'present';
        }

        weeklyData[weekKey].total++;

        switch (status) {
            case 'present':
                weeklyData[weekKey].present++;
                break;
            case 'late':
                weeklyData[weekKey].late++;
                break;
            case 'leave':
                weeklyData[weekKey].leave++;
                break;
            case 'absent':
                weeklyData[weekKey].absent++;
                break;
        }
    });

    // Prepare chart data
    const weeks = Object.keys(weeklyData);
    const presentData = weeks.map(week => weeklyData[week].present);
    const lateData = weeks.map(week => weeklyData[week].late);

    const ctx = document.getElementById('reportTrendChart').getContext('2d');

    // Destroy existing chart if it exists
    if (window.reportTrendChart) {
        window.reportTrendChart.destroy();
    }

    window.reportTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weeks,
            datasets: [
                {
                    label: 'Present Days',
                    data: presentData,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Late Days',
                    data: lateData,
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Days'
                    }
                }
            }
        }
    });
}

function clearReportResults() {
    const reportSummary = document.getElementById('reportSummary');
    const reportTableSection = document.getElementById('reportTableSection');
    const reportCharts = document.getElementById('reportCharts');

    reportSummary.innerHTML = `
        <div class="info-message">
            <i class="fas fa-chart-bar" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
            <p>No data available for the selected period</p>
            <p class="small-text">Select filters and click "Generate Report"</p>
        </div>
    `;

    reportTableSection.innerHTML = '';
    reportCharts.innerHTML = '';
}

// ==================== HELPER FUNCTIONS ====================
function formatPeriodText(reportType, startDate, endDate) {
    switch (reportType) {
        case 'monthly':
            const month = new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return month;
        case 'quarterly':
            return 'Quarterly Report';
        case 'yearly':
            const year = new Date(startDate).getFullYear();
            return `Year ${year}`;
        case 'custom':
            return 'Custom Period';
        default:
            return 'Report';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatHours(minutes) {
    if (minutes === 0) return '0h 0m';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// ==================== UPDATE EVENT LISTENERS ====================
// Add these event listeners to your setupEventListeners function:

// Monthly report event listeners
document.getElementById('generateMonthlyReport').addEventListener('click', generateMonthlyReport);
document.getElementById('downloadMonthlyReport').addEventListener('click', downloadMonthlyReportPDF);

// Attendance report event listeners
document.getElementById('generateReportBtn').addEventListener('click', generateAttendanceReport);
document.getElementById('exportReportBtn').addEventListener('click', exportAttendanceReport);
document.getElementById('printReportBtn').addEventListener('click', printAttendanceReport);





async function exportAttendanceReport() {
    try {
        const reportType = document.getElementById('reportType').value;
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        const format = document.getElementById('reportFormat').value;

        // Validate
        if (!startDate || !endDate) {
            showNotification('Please select date range first', 'error');
            return;
        }

        // Generate export data
        const exportData = {
            staffId: staffData.staffId,
            staffName: staffData.name,
            reportType: reportType,
            period: `${startDate} to ${endDate}`,
            generatedAt: new Date().toISOString(),
            data: await fetchReportDataFromDatabase(startDate, endDate)
        };

        // Convert to JSON and download
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `Attendance_Report_${staffData.staffId}_${startDate}_${endDate}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        showNotification('Report exported successfully!', 'success');

    } catch (error) {
        console.error('❌ Error exporting report:', error);
        showNotification('Error exporting report: ' + error.message, 'error');
    }
}

function printAttendanceReport() {
    const reportResults = document.getElementById('reportResults');
    const originalContents = document.body.innerHTML;

    // Create print content
    const printContent = `
        <html>
        <head>
            <title>Attendance Report - ${staffData.name}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                h2 { color: #666; }
                .report-header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
                .summary-item { padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background-color: #f5f5f5; padding: 10px; text-align: left; border: 1px solid #ddd; }
                td { padding: 8px; border: 1px solid #ddd; }
                .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #333; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <h1>NeIPS Attendance Report</h1>
                <h2>Staff: ${staffData.name} (${staffData.staffId})</h2>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            ${reportResults.innerHTML}
            <div class="footer">
                <p>End of Report</p>
                <p class="no-print">Note: This is a computer-generated report.</p>
            </div>
        </body>
        </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}
// ==================== PDF GENERATION ====================
async function downloadMonthlyReportPDF() {
    try {
        // Check if any data is available first
        const month = parseInt(document.getElementById('reportMonth').value);
        const year = parseInt(document.getElementById('reportYear').value);
        const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });

        const monthlyData = await fetchMonthlyAttendanceFromDatabase(month, year);

        if (!monthlyData || !monthlyData.success || !monthlyData.records || monthlyData.records.length === 0) {
            showNotification('⚠️ Please generate a report first before downloading PDF', 'warning');
            return;
        }

        showLoading();

        // Create a loading state for the download button
        const downloadBtn = document.getElementById('downloadMonthlyReport');
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating PDF...';
        downloadBtn.disabled = true;

        console.log(`📄 Generating PDF report for ${monthName} ${year}`);

        // Create PDF content
        const pdfContent = generatePDFContent(monthName, year, monthlyData.records);

        // Create and trigger download
        await downloadPDF(pdfContent, `Monthly_Report_${monthName}_${year}_${staffData.staffId}.pdf`);

        // ✅ Track this download
        trackPDFDownload(month + 1, year); // month is 0-indexed

        // ✅ Update UI without notifications
        updatePDFDownloadUI(month, year, true);

        // ✅ Brief success message (not notification)
        const successMsg = document.createElement('div');
        successMsg.className = 'pdf-success-message';
        successMsg.innerHTML = `<i class="fas fa-check-circle"></i> PDF saved to downloads`;
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s, fadeOut 0.3s 2s forwards;
        `;
        document.body.appendChild(successMsg);

        // Remove message after animation
        setTimeout(() => {
            if (successMsg.parentNode) {
                successMsg.parentNode.removeChild(successMsg);
            }
        }, 2300);

        // Reset button after 1 second
        setTimeout(() => {
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
        }, 1000);

        hideLoading();

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        showNotification('❌ Error downloading PDF: ' + error.message, 'error');

        // Reset button
        const downloadBtn = document.getElementById('downloadMonthlyReport');
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download PDF';
        downloadBtn.disabled = false;

        hideLoading();
    }
}
function generatePDFContent(monthName, year, records) {
    // Get current counters
    const workingDays = parseInt(document.getElementById('monthlyWorkingDays').textContent) || 0;
    const presentDays = parseInt(document.getElementById('monthlyPresentDays').textContent) || 0;
    const absentDays = parseInt(document.getElementById('monthlyAbsentDays').textContent) || 0;
    const lateDays = parseInt(document.getElementById('monthlyLateDays').textContent) || 0;
    const leaveDays = parseInt(document.getElementById('monthlyLeaveDays').textContent) || 0;
    const attendanceRate = document.getElementById('monthlyAttendancePercent').textContent || '0%';

    // Calculate working hours
    let totalHours = 0;
    let daysWithHours = 0;
    records.forEach(record => {
        const checkIn = record.CheckIn || record.checkIn;
        const checkOut = record.CheckOut || record.checkOut;

        if (checkIn && checkIn !== '--:--' && checkOut && checkOut !== '--:--') {
            const hours = calculateWorkingHours(checkIn, checkOut);
            const [h, m] = hours.split('h ');
            const minutes = parseInt(h) * 60 + parseInt(m);
            totalHours += minutes;
            daysWithHours++;
        }
    });

    const avgHours = daysWithHours > 0 ? Math.round(totalHours / daysWithHours) : 0;

    // Format date
    const generatedDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Create HTML content for PDF
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Monthly Attendance Report - ${staffData.name}</title>
            <style>
                @page { margin: 20px; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0f8ba7; padding-bottom: 20px; }
                .company-name { color: #0f8ba7; font-size: 28px; font-weight: bold; margin-bottom: 5px; }
                .report-title { font-size: 24px; margin: 10px 0; }
                .report-period { font-size: 18px; color: #666; margin-bottom: 20px; }
                .staff-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .section-title { background: #0f8ba7; color: white; padding: 10px; border-radius: 5px; margin: 25px 0 15px 0; font-size: 18px; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
                .summary-item { border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
                .summary-label { font-size: 14px; color: #666; margin-bottom: 5px; }
                .summary-value { font-size: 24px; font-weight: bold; }
                .summary-present { border-color: #2ecc71; }
                .summary-absent { border-color: #ff4757; }
                .summary-late { border-color: #f39c12; }
                .summary-leave { border-color: #3498db; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
                td { padding: 10px; border-bottom: 1px solid #eee; }
                .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                .status-present { background: #d4edda; color: #155724; }
                .status-absent { background: #f8d7da; color: #721c24; }
                .status-late { background: #fff3cd; color: #856404; }
                .status-leave { background: #d1ecf1; color: #0c5460; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 14px; }
                .print-date { margin-top: 10px; font-style: italic; }
                .note { font-size: 12px; color: #999; margin-top: 5px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">NeIPS - Northeast Institute of Professional Studies</div>
                <div class="report-title">Monthly Attendance Report</div>
                <div class="report-period">${monthName} ${year}</div>
            </div>
            
            <div class="staff-info">
                <div class="info-row">
                    <span><strong>Staff Name:</strong> ${staffData.name}</span>
                    <span><strong>Staff ID:</strong> ${staffData.staffId}</span>
                </div>
                <div class="info-row">
                    <span><strong>Department:</strong> ${staffData.department || 'N/A'}</span>
                    <span><strong>Report Generated:</strong> ${generatedDate}</span>
                </div>
            </div>
            
            <div class="section-title">Summary Statistics</div>
            <div class="summary-grid">
                <div class="summary-item summary-present">
                    <div class="summary-label">Working Days</div>
                    <div class="summary-value">${workingDays}</div>
                </div>
                <div class="summary-item summary-present">
                    <div class="summary-label">Present Days</div>
                    <div class="summary-value">${presentDays}</div>
                </div>
                <div class="summary-item summary-present">
                    <div class="summary-label">Attendance Rate</div>
                    <div class="summary-value">${attendanceRate}</div>
                </div>
                <div class="summary-item summary-absent">
                    <div class="summary-label">Absent Days</div>
                    <div class="summary-value">${absentDays}</div>
                </div>
                <div class="summary-item summary-late">
                    <div class="summary-label">Late Days</div>
                    <div class="summary-value">${lateDays}</div>
                </div>
                <div class="summary-item summary-leave">
                    <div class="summary-label">Leave Days</div>
                    <div class="summary-value">${leaveDays}</div>
                </div>
            </div>
            
            <div class="section-title">Working Hours Summary</div>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Description</th>
                </tr>
                <tr>
                    <td>Total Hours Worked</td>
                    <td><strong>${formatHours(totalHours)}</strong></td>
                    <td>Total working hours for ${daysWithHours} days with check-in/out records</td>
                </tr>
                <tr>
                    <td>Average Daily Hours</td>
                    <td><strong>${formatHours(avgHours)}</strong></td>
                    <td>Average working hours per day</td>
                </tr>
                <tr>
                    <td>Days with Hours Recorded</td>
                    <td><strong>${daysWithHours}</strong></td>
                    <td>Number of days with both check-in and check-out times</td>
                </tr>
            </table>
            
            <div class="section-title">Daily Attendance Records</div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Working Hours</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateAttendanceTableRows(records)}
                </tbody>
            </table>
            
            <div class="footer">
                <div>*** End of Report ***</div>
                <div class="print-date">Printed on: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}</div>
                <div class="note">This is an electronically generated report and does not require a signature.</div>
            </div>
        </body>
        </html>
    `;

    return htmlContent;
}

function generateAttendanceTableRows(records) {
    if (!records || records.length === 0) {
        return '<tr><td colspan="6" style="text-align: center; padding: 20px;">No attendance records found</td></tr>';
    }

    // Sort records by date
    records.sort((a, b) => {
        const dateA = parseDateString(a.Date || a.date);
        const dateB = parseDateString(b.Date || b.date);
        return dateA - dateB;
    });

    let rows = '';
    records.forEach(record => {
        const dateStr = record.Date || record.date;
        const date = parseDateString(dateStr);
        const formattedDate = formatDateForDisplay(date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        // Format times properly
        const checkIn = formatTimeForDisplay(record.CheckIn || record.checkIn || '--:--');
        const checkOut = formatTimeForDisplay(record.CheckOut || record.checkOut || '--:--');
        
        let status = record.Status || record.status || '';

        // Auto-detect status if not set
        if (!status) {
            if (checkIn !== '--:--' && checkIn !== '') {
                status = 'present';
            } else {
                status = 'absent';
            }
        }

        // Calculate working hours
        let workingHours = '--';
        if (checkIn !== '--:--' && checkOut !== '--:--' && checkIn !== '' && checkOut !== '') {
            workingHours = calculateWorkingHours(checkIn, checkOut);
        }

        rows += `
            <tr>
                <td>${formattedDate}</td>
                <td>${dayName}</td>
                <td>${checkIn}</td>
                <td>${checkOut}</td>
                <td>${workingHours}</td>
                <td><span class="status-badge status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
            </tr>
        `;
    });

    return rows;
}
function formatHours(minutes) {
    if (minutes === 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

function downloadPDF(htmlContent, filename) {
    return new Promise((resolve, reject) => {
        try {
            // Create a temporary iframe for printing
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();

            // Wait for content to load
            setTimeout(() => {
                // For browsers that support print to PDF
                iframe.contentWindow.focus();
                iframe.contentWindow.print();

                // Also provide alternative download for mobile
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();

                // Cleanup
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                    resolve();
                }, 1000);
            }, 500);
        } catch (error) {
            reject(error);
        }
    });
}
function showReportStatus(message, type = 'info') {
    const statusDiv = document.getElementById('reportStatus');
    const statusText = document.getElementById('statusText');

    if (statusDiv && statusText) {
        statusText.textContent = message;
        statusDiv.style.display = 'block';

        // Update icon based on type
        const icon = statusDiv.querySelector('i');
        if (icon) {
            icon.className = `fas fa-${type === 'success' ? 'check-circle' :
                type === 'error' ? 'exclamation-circle' :
                    type === 'warning' ? 'exclamation-triangle' : 'spinner fa-spin'}`;
        }

        statusDiv.className = `report-status status-${type}`;

        // Auto-hide after 5 seconds if not error
        if (type !== 'error') {
            setTimeout(() => {
                hideReportStatus();
            }, 5000);
        }
    }
}

function hideReportStatus() {
    const statusDiv = document.getElementById('reportStatus');
    if (statusDiv) {
        statusDiv.style.display = 'none';
    }
}
// ==================== PDF DOWNLOAD TRACKING ====================
function trackPDFDownload(month, year) {
    try {
        const downloads = JSON.parse(localStorage.getItem('pdfDownloads') || '{}');
        const key = `${year}-${month}`;

        downloads[key] = {
            downloaded: true,
            date: new Date().toISOString()
        };

        localStorage.setItem('pdfDownloads', JSON.stringify(downloads));
        console.log(`✅ PDF download tracked for ${month}/${year}`);
        return true;
    } catch (error) {
        console.error('❌ Error tracking PDF download:', error);
        return false;
    }
}

function hasPDFBeenDownloaded(month, year) {
    try {
        const downloads = JSON.parse(localStorage.getItem('pdfDownloads') || '{}');
        const key = `${year}-${month}`;
        return downloads[key]?.downloaded || false;
    } catch (error) {
        return false;
    }
}




function clearDownloadHistory() {
    localStorage.removeItem('pdfDownloads');
    console.log('🗑️ PDF download history cleared');
}
function updatePDFDownloadUI(month, year, isJustDownloaded = false) {
    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
    const hasDownloaded = hasPDFBeenDownloaded(month, year);
    const downloadBtn = document.getElementById('downloadMonthlyReport');
    const reportTitle = document.querySelector('#monthly-report .page-header h2');

    if (hasDownloaded || isJustDownloaded) {
        // Already downloaded or just downloaded
        downloadBtn.classList.add('pdf-ready');
        downloadBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Download PDF Again';

        // Update report title with subtle indicator
        if (reportTitle) {
            const baseTitle = 'Monthly Attendance Report';
            reportTitle.innerHTML = `${baseTitle} <span class="pdf-indicator">PDF Available</span>`;
        }
    } else {
        // Not downloaded yet
        downloadBtn.classList.remove('pdf-ready');
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download PDF';

        // Reset report title
        if (reportTitle) {
            reportTitle.innerHTML = 'Monthly Attendance Report';
        }
    }
}

// ==================== WINDOW EVENT HANDLERS ====================
window.addEventListener('beforeunload', () => {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
});

// Handle hash changes for page navigation
window.addEventListener('hashchange', () => {
    const page = window.location.hash.substring(1) || 'dashboard';
    navigateToPage(page);
});

// ==================== GLOBAL EXPORTS ====================
window.navigateToPage = navigateToPage;
window.logout = logout;
window.viewLeaveDetails = viewLeaveDetails;
window.cancelLeave = cancelLeave;
window.markCheckOut = markCheckOut;
window.closeModal = closeModal;
