// ==================== GOOGLE SHEETS CONFIGURATION ====================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec';

// ==================== ADMIN CREDENTIALS ====================
const ADMIN_CREDENTIALS = {
    email: 'admin@neips.com',
    dob: '2000-01-01' // Default admin DOB
};


// ==================== LOGIN PAGE FUNCTIONALITY ====================
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔐 Login page loaded');

    // PREVENT ANY AUTOMATIC BEHAVIOR
    preventAutomaticRedirects();

    initializeLoginForm();
    initializeNavigation();
    loadRememberedAdmin(); // Load remembered admin credentials
});
// LOAD REMEMBERED ADMIN CREDENTIALS
function loadRememberedAdmin() {
    console.log('📝 Loading remembered admin from Google Sheets...');

    // Only load from Google Sheets
    loadAdminFromGoogleSheets();
}

// LOAD ADMIN FROM GOOGLE SHEETS - JSONP VERSION
function loadAdminFromGoogleSheets() {
    return new Promise((resolve, reject) => {
        try {
            console.log('🔍 Loading admin from Google Sheets...');

            const callbackName = 'adminCallback_' + Date.now();
            const url = `${GOOGLE_SCRIPT_URL}?action=getAdminCredentials&callback=${callbackName}`;

            console.log('🔗 Admin URL:', url);

            // Remove any existing script
            const oldScript = document.getElementById('adminLoadScript');
            if (oldScript) oldScript.remove();

            // Remove any existing callback
            if (window[callbackName]) delete window[callbackName];

            // Create global callback function
            window[callbackName] = function (response) {
                console.log('📊 Admin credentials response:', response);

                // Clean up
                const script = document.getElementById('adminLoadScript');
                if (script) script.remove();
                delete window[callbackName];
                clearTimeout(timeoutId);



                // Also try to auto-fill staff credentials from localStorage
                autoFillStaffFromLocalStorage();

                resolve(response);
            };

            // Create and append script tag
            const script = document.createElement('script');
            script.id = 'adminLoadScript';
            script.src = url;
            script.onerror = () => {
                reject(new Error('Failed to load admin credentials'));
            };

            document.head.appendChild(script);

            // Add timeout
            const timeoutId = setTimeout(() => {
                if (document.getElementById('adminLoadScript')) {
                    reject(new Error('Admin credentials load timeout'));
                }
            }, 5000);

        } catch (error) {
            console.error('Error loading admin from Google Sheets:', error);
            reject(error);
        }
    });
}

// NEW FUNCTION: Auto-fill staff credentials from localStorage
function autoFillStaffFromLocalStorage() {
    try {
        console.log('🔍 Checking for saved staff credentials in localStorage...');

        // Check if there are saved staff credentials
        const savedStaffEmail = localStorage.getItem('staff_email');
        const savedStaffDOB = localStorage.getItem('staff_dob');

        if (savedStaffEmail && savedStaffDOB) {
            console.log('✅ Found saved staff credentials:', savedStaffEmail);

            // Check if email matches staff pattern or we can identify it's staff
            // First, check if it's not the admin email
            const adminCredentials = {
                email: 'admin@neips.com',
                dob: '2000-01-01'
            };

            if (savedStaffEmail !== adminCredentials.email && savedStaffDOB !== adminCredentials.dob) {
                // ✅ FORMAT DOB FOR DISPLAY (yyyy-mm-dd to dd-mm-yyyy)
                let displayDOB = savedStaffDOB;
                
                // Check if it's in yyyy-mm-dd format
                if (savedStaffDOB.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // Convert yyyy-mm-dd to dd-mm-yyyy
                    const parts = savedStaffDOB.split('-');
                    if (parts.length === 3) {
                        displayDOB = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }
                
                // Try to auto-fill as staff
                document.getElementById('login-email').value = savedStaffEmail;
                document.getElementById('login-dob').value = displayDOB; // Use formatted DOB
                document.getElementById('login-type').value = 'staff'; // Set to staff type

                // Check remember me
                document.querySelector('input[name="remember"]').checked = true;

                console.log('✅ Auto-filled staff credentials from localStorage');
                console.log('📅 DOB formatted for display:', displayDOB);
            }
        }

        // Also check for student credentials
        autoFillStudentFromLocalStorage();

    } catch (error) {
        console.error('Error auto-filling staff credentials:', error);
    }
}
// NEW FUNCTION: Auto-fill student credentials from localStorage
// NEW FUNCTION: Auto-fill student credentials from localStorage
function autoFillStudentFromLocalStorage() {
    try {
        console.log('🔍 Checking for saved student credentials...');

        // Check if there are saved student credentials
        const savedStudentEmail = localStorage.getItem('student_email');
        const savedStudentDOB = localStorage.getItem('student_dob');

        if (savedStudentEmail && savedStudentDOB) {
            console.log('✅ Found saved student credentials:', savedStudentEmail);

            // ✅ FORMAT DOB FOR DISPLAY (yyyy-mm-dd to dd-mm-yyyy)
            let displayDOB = savedStudentDOB;
            
            // Check if it's in yyyy-mm-dd format
            if (savedStudentDOB.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Convert yyyy-mm-dd to dd-mm-yyyy
                const parts = savedStudentDOB.split('-');
                if (parts.length === 3) {
                    displayDOB = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }
            
            // Auto-fill as student
            document.getElementById('login-email').value = savedStudentEmail;
            document.getElementById('login-dob').value = displayDOB; // Use formatted DOB
            document.getElementById('login-type').value = 'student'; // Set to student type

            // Check remember me
            document.querySelector('input[name="remember"]').checked = true;

            console.log('✅ Auto-filled student credentials from localStorage');
            console.log('📅 DOB formatted for display:', displayDOB);
        }
    } catch (error) {
        console.error('Error auto-filling student credentials:', error);
    }
}

// MODIFIED: Save credentials based on user type after successful login
async function saveCredentialsAfterLogin(email, dob, userType, rememberMe) {
    try {
        if (rememberMe) {
            if (userType === 'admin') {
                // Save admin credentials to Google Sheets
                await saveAdminLoginToGoogleSheets(email, dob, rememberMe);
            } else if (userType === 'staff') {
                // Save staff credentials to localStorage
                localStorage.setItem('staff_email', email);
                localStorage.setItem('staff_dob', dob);
                localStorage.setItem('staff_rememberMe', rememberMe);
                console.log('💾 Staff credentials saved to localStorage');
            } else if (userType === 'student') {
                // Save student credentials to localStorage
                localStorage.setItem('student_email', email);
                localStorage.setItem('student_dob', dob);
                localStorage.setItem('student_rememberMe', rememberMe);
                console.log('💾 Student credentials saved to localStorage');
            }
        } else {
            // If remember me is not checked, clear saved credentials
            if (userType === 'staff') {
                localStorage.removeItem('staff_email');
                localStorage.removeItem('staff_dob');
                localStorage.removeItem('staff_rememberMe');
            } else if (userType === 'student') {
                localStorage.removeItem('student_email');
                localStorage.removeItem('student_dob');
                localStorage.removeItem('student_rememberMe');
            }
        }
    } catch (error) {
        console.error('Error saving credentials:', error);
    }
}
// FUNCTION TO PREVENT AUTOMATIC REDIRECTS
function preventAutomaticRedirects() {
    console.log('🛡️ Preventing automatic redirects...');

    // Prevent any form auto-submission
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Form submission blocked by preventer');
            return false;
        });
    });

    // Prevent any input clicks from causing navigation
    document.querySelectorAll('input').forEach(input => {
        // Remove any existing event listeners
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);

        // Add new safe event listener
        newInput.addEventListener('click', function (e) {
            e.stopPropagation();
            console.log('Input click - safe');
        });

        newInput.addEventListener('focus', function (e) {
            e.stopPropagation();
            console.log('Input focus - safe');
        });
    });

    // Prevent any link clicks from causing issues
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    });
}

// ==================== CLICK PROTECTION ====================
function setupLoginButtonProtection() {
    const loginBtn = document.querySelector('.login-btn');
    let isProcessing = false;

    if (loginBtn) {
        // Remove any existing listeners
        const newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);

        // Add protected click handler
        newBtn.addEventListener('click', function (e) {
            if (isProcessing) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🛑 Login already in progress, please wait...');
                showNotification('Please wait... Login in progress', 'info');
                return false;
            }
        });

        // Also protect form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function (e) {
                if (isProcessing) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🛑 Login already in progress...');
                    return false;
                }
                isProcessing = true;

                // Reset processing flag after 3 seconds (safety net)
                setTimeout(() => {
                    isProcessing = false;
                }, 3000);
            });
        }
    }
}

function initializeLoginForm() {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        console.log('✅ Login form found, attaching event listener');

        // Remove any existing event listeners first
        const newForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newForm, loginForm);

        // Setup button protection
        setupLoginButtonProtection();

        // Add new event listener
        newForm.addEventListener('submit', function (e) {
            console.log('🔄 Form submission started');
            e.preventDefault();
            e.stopPropagation();
            handleLogin();
        });
    } else {
        console.log('❌ Login form not found');
    }
}
// Add this function to your login.js
async function checkStudentLoginFirebase(email, dob) {
    try {
        if (!isFirebaseAvailable()) {
            // Fallback to Sheets if Firebase not available
            return await checkUserCredentialsJSONP(email, dob);
        }

        const db = initializeFirebase();
        const snapshot = await db.collection('students')
            .where('email', '==', email.toLowerCase().trim())
            .where('dob', '==', dob)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const studentData = snapshot.docs[0].data();
            return {
                success: true,
                student: studentData
            };
        }

        return { success: false, message: 'Invalid credentials' };
    } catch (error) {
        console.error('❌ Firebase login error:', error);
        // Fallback to Sheets
        return await checkUserCredentialsJSONP(email, dob);
    }
}
// ==================== CENTER MANAGER LOGIN - JSONP VERSION ====================
function verifyCenterManagerJSONP(email, dob) {
    return new Promise((resolve, reject) => {
        try {
            console.log('🔍 Checking center manager credentials for:', email);

            const callbackName = 'centerManagerCallback_' + Date.now();
            const params = new URLSearchParams({
                action: 'verifyCenterManager',
                email: email,
                dob: dob,
                callback: callbackName
            });

            const url = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;
            console.log('🔗 Center manager login URL:', url);

            // Remove any existing script
            const oldScript = document.getElementById('centerManagerLoginScript');
            if (oldScript) oldScript.remove();

            // Remove any existing callback
            if (window[callbackName]) delete window[callbackName];

            // Create global callback function
            window[callbackName] = function (response) {
                console.log('📊 Center manager login response:', response);

                // Clean up
                const script = document.getElementById('centerManagerLoginScript');
                if (script) script.remove();
                delete window[callbackName];
                clearTimeout(timeoutId);

                if (response.success && response.manager) {
                    console.log('✅ Center manager login successful! Manager data:', response.manager);
                    resolve(response.manager);
                } else {
                    console.log('❌ Center manager login failed:', response.message);
                    resolve(null);
                }
            };

            // Create and append script tag
            const script = document.createElement('script');
            script.id = 'centerManagerLoginScript';
            script.src = url;
            script.onerror = () => {
                reject(new Error('Failed to verify center manager credentials'));
            };

            document.head.appendChild(script);

            // Add timeout
            const timeoutId = setTimeout(() => {
                if (document.getElementById('centerManagerLoginScript')) {
                    reject(new Error('Center manager login request timed out'));
                }
            }, 5000);

        } catch (error) {
            reject(error);
        }
    });
}
// ==================== SAVE ADMIN LOGIN TO GOOGLE SHEETS - JSONP VERSION ====================
async function saveAdminLoginToGoogleSheets(email, dob, rememberMe) {
    return new Promise((resolve, reject) => {
        try {
            console.log('💾 Saving admin login to Google Sheets...');

            const callbackName = 'saveAdminCallback_' + Date.now();
            const params = new URLSearchParams({
                action: 'saveAdminLogin',
                email: email,
                dob: dob,
                rememberMe: rememberMe,
                loginTime: new Date().toISOString(),
                userAgent: navigator.userAgent,
                callback: callbackName
            });

            const url = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;
            console.log('🔗 Save admin URL:', url);

            // Remove any existing script
            const oldScript = document.getElementById('saveAdminScript');
            if (oldScript) oldScript.remove();

            // Remove any existing callback
            if (window[callbackName]) delete window[callbackName];

            // Create global callback function
            window[callbackName] = function (response) {
                console.log('📊 Admin login saved:', response);

                // Clean up
                const script = document.getElementById('saveAdminScript');
                if (script) script.remove();
                delete window[callbackName];
                clearTimeout(timeoutId);

                if (response.success) {
                    console.log('✅ Admin login saved to Google Sheets');
                } else {
                    console.log('⚠️ Could not save admin login to Google Sheets:', response.message);
                }
                resolve(response);
            };

            // Create and append script tag
            const script = document.createElement('script');
            script.id = 'saveAdminScript';
            script.src = url;
            script.onerror = () => {
                reject(new Error('Failed to save admin login'));
            };

            document.head.appendChild(script);

            // Add timeout
            const timeoutId = setTimeout(() => {
                if (document.getElementById('saveAdminScript')) {
                    reject(new Error('Save admin login timeout'));
                }
            }, 5000);

        } catch (error) {
            console.error('Error saving admin login:', error);
            reject(error);
        }
    });
}

// ==================== STUDENT LOGIN - JSONP VERSION ====================
function checkUserCredentialsJSONP(email, dob) {
    return new Promise((resolve, reject) => {
        try {
            console.log('🔍 Checking credentials for:', email);

            const callbackName = 'studentLoginCallback_' + Date.now();
            const params = new URLSearchParams({
                action: 'studentLogin',
                email: email,
                dob: dob,
                callback: callbackName
            });

            const url = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;
            console.log('🔗 Student login URL:', url);

            // Remove any existing script
            const oldScript = document.getElementById('studentLoginScript');
            if (oldScript) oldScript.remove();

            // Remove any existing callback
            if (window[callbackName]) delete window[callbackName];

            // Create global callback function
            window[callbackName] = function (response) {
                console.log('📊 DEBUG - Login response:', response);

                // Clean up
                delete window[callbackName];

                if (response.success && response.student) {
                    console.log('✅ Login successful! District:', response.student.Address || response.student.District);

                    // ✅ Check status in callback too (double-check)
                    if (response.student.Status && response.student.Status.toLowerCase() === 'approved') {
                        // Store student data in sessionStorage for dashboard
                        sessionStorage.setItem('studentData', JSON.stringify(response.student));
                        resolve(response.student);
                    } else {
                        console.log('❌ Student not approved in callback');
                        resolve(null);
                    }
                } else {
                    console.log('❌ Login failed:', response.message);
                    resolve(null);
                }
            };

            // Create and append script tag
            const script = document.createElement('script');
            script.id = 'studentLoginScript';
            script.src = url;
            script.onerror = () => {
                reject(new Error('Failed to check credentials'));
            };

            document.head.appendChild(script);

            // Add timeout
            const timeoutId = setTimeout(() => {
                if (document.getElementById('studentLoginScript')) {
                    reject(new Error('Login request timed out'));
                }
            }, 5000);

        } catch (error) {
            reject(error);
        }
    });
}
// ==================== ADMIN LOGIN HANDLER ====================
function handleAdminLogin() {
    console.log('👑 Processing admin login...');




    // Redirect to admin dashboard immediately
    console.log('🔀 Redirecting to admin dashboard...');
    window.location.href = 'admin/admin.html';
}

function initializeNavigation() {
    // Back to home functionality
    const backToHome = document.querySelector('.back-to-home');
    if (backToHome) {
        backToHome.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('🏠 Going back to home...');
            window.location.href = 'index.html';
        });
    }
}

// Utility functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #28a745;' : ''}
        ${type === 'error' ? 'background: #dc3545;' : ''}
        ${type === 'info' ? 'background: #17a2b8;' : ''}
    `;

    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">&times;</button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS for notifications - ONLY ONCE
if (!document.querySelector('#notification-styles')) {
    const notificationStyles = document.createElement('style');
    notificationStyles.id = 'notification-styles';
    notificationStyles.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .notification {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
    `;
    document.head.appendChild(notificationStyles);
}
// ==================== STAFF LOGIN VERIFICATION ====================
// ==================== STAFF LOGIN VERIFICATION ====================
function verifyStaffLoginJSONP(email, dob) {
    return new Promise((resolve, reject) => {
        try {
            console.log('🔍 Checking staff credentials for:', email);

            const callbackName = 'staffLoginCallback_' + Date.now();
            const params = new URLSearchParams({
                action: 'verifyStaffLogin',
                email: email,
                dob: dob,
                callback: callbackName
            });

            const url = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;
            console.log('🔗 Staff login URL:', url);

            // Remove any existing script
            const oldScript = document.getElementById('staffLoginScript');
            if (oldScript) oldScript.remove();

            // Remove any existing callback
            if (window[callbackName]) delete window[callbackName];

            // Create global callback function
            window[callbackName] = function (response) {
                console.log('📊 Staff login response:', response);

                // Clean up
                const script = document.getElementById('staffLoginScript');
                if (script) script.remove();
                delete window[callbackName];
                clearTimeout(timeoutId);

                if (response.success && response.staff) {
                    console.log('✅ Staff login successful! Staff data:', response.staff);
                    resolve(response.staff);
                } else {
                    console.log('❌ Staff login failed:', response.message);
                    resolve(null);
                }
            };

            // Create and append script tag
            const script = document.createElement('script');
            script.id = 'staffLoginScript';
            script.src = url;
            script.onerror = () => {
                reject(new Error('Failed to verify staff credentials'));
            };

            document.head.appendChild(script);

            // Add timeout
            const timeoutId = setTimeout(() => {
                if (document.getElementById('staffLoginScript')) {
                    reject(new Error('Staff login request timed out'));
                }
            }, 5000);

        } catch (error) {
            reject(error);
        }
    });
}
// ==================== DATE FORMATTING & VALIDATION ====================

function formatDateForDisplay(dateStr) {
    // Convert from yyyy-mm-dd to dd-mm-yyyy for display
    if (!dateStr) return '';

    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

function formatDateForSubmission(dateStr) {
    // Convert from dd-mm-yyyy to yyyy-mm-dd for submission
    if (!dateStr) return '';

    // Remove any non-digit characters except hyphens
    const cleanDate = dateStr.replace(/[^\d-]/g, '');
    const parts = cleanDate.split('-');

    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];

        // Convert to yyyy-mm-dd
        return `${year}-${month}-${day}`;
    }
    return dateStr;
}

function validateDOBFormat(dateStr) {
    // Validate dd-mm-yyyy format
    if (!dateStr) return false;

    // Check format matches dd-mm-yyyy
    const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = dateStr.match(regex);

    if (!match) {
        console.log('❌ Date format invalid:', dateStr);
        return false;
    }

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Basic validation
    if (month < 1 || month > 12) {
        console.log('❌ Invalid month:', month);
        return false;
    }
    if (day < 1 || day > 31) {
        console.log('❌ Invalid day:', day);
        return false;
    }

    // Check valid days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
        console.log(`❌ Day ${day} exceeds ${daysInMonth} days in month ${month}`);
        return false;
    }

    // Check year is reasonable
    const currentYear = new Date().getFullYear();
    if (year > currentYear || year < 1900) {
        console.log('❌ Invalid year:', year);
        return false;
    }

    return true;
}

function autoFormatDate(input) {
    let value = input.value.replace(/[^\d]/g, '');
    
    // Don't allow more than 8 digits (ddmmyyyy)
    if (value.length > 8) {
        value = value.substring(0, 8);
    }
    
    let formatted = '';
    if (value.length > 0) {
        // First 2 digits = day
        let day = value.substring(0, 2);
        // Ensure day is valid (01-31)
        if (parseInt(day) > 31) {
            day = '31';
        }
        formatted = day;
        
        if (value.length > 2) {
            // Next 2 digits = month
            let month = value.substring(2, 4);
            // Ensure month is valid (01-12)
            if (parseInt(month) > 12) {
                month = '12';
            }
            formatted += '-' + month;
        }
        if (value.length > 4) {
            // Last 4 digits = year
            const year = value.substring(4, 8);
            formatted += '-' + year;
        }
    }
    
    input.value = formatted;
}function setupDateInput() {
    const dobInput = document.getElementById('login-dob');

    if (!dobInput) return;

    // Clear any existing value to prevent format confusion
    dobInput.value = '';

    // Auto-format as user types
    dobInput.addEventListener('input', function (e) {
        autoFormatDate(e.target);
    });

    // Validate on blur
    dobInput.addEventListener('blur', function (e) {
        const value = e.target.value.trim();

        if (value && !validateDOBFormat(value)) {
            showNotification('Please enter a valid date in dd-mm-yyyy format', 'error');
            e.target.focus();
        }
    });

    // Allow typing over existing text
    dobInput.addEventListener('click', function (e) {
        if (this.value) {
            this.setSelectionRange(0, this.value.length);
        }
    });

    // Add keyboard shortcuts
    dobInput.addEventListener('keydown', function (e) {
        // Clear input on Escape
        if (e.key === 'Escape') {
            this.value = '';
        }

        // Add today's date on Ctrl+D
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            this.value = `${day}-${month}-${year}`;
        }
    });

    // Set placeholder to show expected format
    dobInput.placeholder = 'dd-mm-yyyy';
}
// ==================== MODIFIED HANDLE LOGIN FUNCTION ====================

// ==================== MODIFIED HANDLE LOGIN FUNCTION ====================

async function handleLogin() {
    console.log('🎯 handleLogin function called');

    const email = document.getElementById('login-email').value;
    const rawDob = document.getElementById('login-dob').value;
    const userType = document.getElementById('login-type').value;
    const rememberMe = document.querySelector('input[name="remember"]').checked;

    // Format DOB for submission
    const formattedDob = formatDateForSubmission(rawDob);

    console.log('🔍 Login attempt:', {
        userType,
        email,
        rawDob,
        formattedDob,
        rememberMe
    });

    // Validate inputs
    if (!email || !rawDob || !userType) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    if (!validateDOBFormat(rawDob)) {
        showNotification('Please enter a valid date of birth in dd-mm-yyyy format', 'error');
        return;
    }

    // Show loading state
    const loginBtn = document.querySelector('.login-btn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    loginBtn.disabled = true;

    await new Promise(resolve => setTimeout(resolve, 10));

    try {
        if (userType === 'admin') {
            // ADMIN LOGIN
            if (email === ADMIN_CREDENTIALS.email && formattedDob === ADMIN_CREDENTIALS.dob) {
                console.log('🔑 Admin login detected');
                // Save credentials if remember me is checked
                await saveCredentialsAfterLogin(email, formattedDob, 'admin', rememberMe);
                window.location.href = 'admin/admin.html';
                return;
            } else {
                showNotification('Invalid email or date of birth', 'error');
            }

        } else if (userType === 'staff') {
            // STAFF LOGIN
            console.log('🔐 Checking staff credentials...');
            const staff = await verifyStaffLoginJSONP(email, formattedDob);

            if (staff) {
                console.log('✅ Staff authentication successful');
                // Save credentials if remember me is checked
                await saveCredentialsAfterLogin(email, formattedDob, 'staff', rememberMe);
                window.location.href = `admin/staff/staff.html?email=${encodeURIComponent(email)}&dob=${encodeURIComponent(formattedDob)}`;
                return;
            } else {
                showNotification('Invalid email or date of birth', 'error');
            }

        } // In handleLogin function for student login
        if (userType === 'student') {
            // STUDENT LOGIN - WITH STATUS CHECK
            console.log('🔐 Starting student authentication...');
            const user = await checkUserCredentialsJSONP(email, formattedDob);

            if (user) {
                // ✅ CHECK STUDENT STATUS
                if (user.Status && user.Status.toLowerCase() === 'approved') {
                    console.log('✅ Student authentication successful - Status: Approved');

                    // ✅ CHECK IF STUDENT HAS DISTRICT/ADDRESS
                    if (!user.Address && !user.Center && !user.District) {
                        console.warn('⚠️ Student has no district/address assigned');
                        showNotification('Student account is not properly configured. Please contact admin.', 'error');
                    } else {
                        // Save credentials if remember me is checked
                        await saveCredentialsAfterLogin(email, formattedDob, 'student', rememberMe);
                        sessionStorage.setItem('studentData', JSON.stringify(user));

                        // ✅ IMPORTANT: Redirect with email and dob parameters
                        window.location.href = `students/students.html?email=${encodeURIComponent(email)}&dob=${encodeURIComponent(formattedDob)}`;
                        return;
                    }
                } else {
                    console.log('❌ Student status not approved:', user.Status);
                    showNotification('Your application is still pending approval. Please wait for admin approval.', 'warning');
                }
            } else {
                showNotification('Invalid email or date of birth', 'error');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please check your connection and try again.', 'error');
    } finally {
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}
function handleStudentLogin(data) {
    try {
        console.log('🔐 Handling student login:', data.email);

        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

        // Search through ALL district sheets
        const sheets = spreadsheet.getSheets();
        const normalizedEnteredDOB = normalizeDateForComparison(data.dob);

        console.log('📊 Total sheets to search:', sheets.length);
        console.log('📅 Normalized entered DOB:', normalizedEnteredDOB);

        for (const sheet of sheets) {
            const sheetName = sheet.getName();

            // Skip non-district sheets
            if (sheetName.includes('Admin') ||
                sheetName.includes('Staff') ||
                sheetName.includes('Task') ||
                sheetName.includes('Batch') ||
                sheetName.includes('Attendance') ||
                sheetName.includes('Leave') ||
                sheetName.includes('Auth')) {
                continue;
            }

            console.log(`🔍 Searching in sheet: ${sheetName}`);

            const allData = sheet.getDataRange().getValues();
            const headers = allData[0];

            // Find student by email and date of birth
            for (let i = 1; i < allData.length; i++) {
                const row = allData[i];
                const studentEmail = row[headers.indexOf('Email')] || row[headers.indexOf('email')];
                const studentDOB = row[headers.indexOf('Date of Birth')] || row[headers.indexOf('DOB')] || row[headers.indexOf('dob')];
                const studentStatus = row[headers.indexOf('Status')] || row[headers.indexOf('status')];
                const studentDistrict = row[headers.indexOf('Address')] || row[headers.indexOf('District')] || row[headers.indexOf('Center')] || sheetName;

                // Normalize stored DOB
                const normalizedStoredDOB = normalizeDateForComparison(studentDOB);

                if (studentEmail && studentEmail.toString().toLowerCase() === data.email.toLowerCase() &&
                    normalizedStoredDOB === normalizedEnteredDOB) {

                    console.log(`✅ Student found in ${sheetName}, Status: ${studentStatus}`);

                    // ✅ CHECK STATUS - ONLY ALLOW APPROVED STUDENTS
                    if (!studentStatus || studentStatus.toString().toLowerCase() !== 'approved') {
                        console.log('❌ Student status not approved:', studentStatus);
                        return {
                            success: false,
                            message: 'Your application is still pending approval. Please wait for admin approval.',
                            student: null
                        };
                    }

                    // ✅ CHECK DISTRICT - STUDENT MUST HAVE DISTRICT/ADDRESS
                    if (!studentDistrict) {
                        console.log('❌ Student has no district/address assigned');
                        return {
                            success: false,
                            message: 'Student account is not properly configured. Please contact admin.',
                            student: null
                        };
                    }

                    // Return student data
                    const studentData = {};
                    headers.forEach((header, index) => {
                        studentData[header] = row[index];
                    });

                    // Add sheet name as district if not present
                    if (!studentData.Address && !studentData.District && !studentData.Center) {
                        studentData.District = sheetName;
                    }

                    return {
                        success: true,
                        message: 'Login successful!',
                        student: studentData,
                        sheetName: sheetName
                    };
                }
            }
        }

        console.log('❌ Login failed for:', data.email);
        return {
            success: false,
            message: 'Invalid email or date of birth!'
        };

    } catch (error) {
        console.error('❌ Login error:', error);
        return {
            success: false,
            message: 'Login failed: ' + error.toString()
        };
    }
}
// ==================== MODIFIED INITIALIZATION ====================

function initializeLoginForm() {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        console.log('✅ Login form found, attaching event listener');

        const newForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newForm, loginForm);

        // Setup date input
        setupDateInput();

        // Setup button protection
        setupLoginButtonProtection();

        newForm.addEventListener('submit', function (e) {
            console.log('🔄 Form submission started');
            e.preventDefault();
            e.stopPropagation();
            handleLogin();
        });
    } else {
        console.log('❌ Login form not found');
    }
}

