// Student Attendance Portal
document.addEventListener('DOMContentLoaded', function () {
    console.log('🎓 Student attendance portal loaded');

    // Get student from URL parameters or localStorage
    loadStudentData();
    initializeEventListeners();
    updateDateTime();

    // Check today's attendance status
    checkTodayAttendance();

    // Load attendance history
    loadAttendanceHistory();
});

// Global variables
let currentStudent = null;
let webcamStream = null;

// Load student data
// Load student data
// Load student data
// Load student data - UPDATED VERSION
async function loadStudentData() {
    console.log('📋 Loading student data...');

    // Try to get from URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const studentEmail = urlParams.get('email');
    const dob = urlParams.get('dob');

    console.log('🔍 URL Parameters:', { studentEmail, dob });

    if (studentEmail && dob) {
        try {
            // Fetch student data from server using login credentials
            console.log('🔑 Attempting student login...');
            const loginResponse = await handleStudentLoginRequest(studentEmail, dob);
            console.log('🔑 Login response:', loginResponse);

            if (loginResponse.success && loginResponse.student) {
                // Store the student object with sheet name
                currentStudent = {
                    student: loginResponse.student,
                    sheetName: loginResponse.sheetName, // ✅ ADD THIS
                    id: loginResponse.student.id || loginResponse.student['Unique ID'] || loginResponse.student['Student ID'],
                    name: loginResponse.student.name || loginResponse.student.Name,
                    email: loginResponse.student.email || loginResponse.student.Email,
                    district: loginResponse.student.address || loginResponse.student.district || loginResponse.student.District || loginResponse.student.Center || loginResponse.sheetName,
                    trade: loginResponse.student.trade || loginResponse.student.Trade || loginResponse.student.Course,
                    tradeCode: loginResponse.student.tradeCode || loginResponse.student['Trade Code'] || loginResponse.student.trade
                };

                console.log('✅ Student data loaded:', currentStudent);
                updateStudentUI(currentStudent);

                // Store in localStorage
                localStorage.setItem('neipsCurrentStudent', JSON.stringify(currentStudent));

                // Check attendance immediately after successful login
                checkTodayAttendance();
                loadAttendanceHistory();

                // Load district and trade info
                updateDistrictAndTradeInfo(currentStudent);
            } else {
                throw new Error(loginResponse.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            showNotification('Login failed: ' + error.message, 'error');

            // Redirect to login page after 3 seconds
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 3000);
        }
    } else {
        // No parameters, check localStorage
        const savedStudent = localStorage.getItem('neipsCurrentStudent');
        if (savedStudent) {
            try {
                currentStudent = JSON.parse(savedStudent);
                console.log('✅ Student loaded from localStorage:', currentStudent);

                // Validate that we have proper student data
                if (currentStudent && currentStudent.student) {
                    updateStudentUI(currentStudent);
                    console.log('✅ Student UI updated from localStorage');

                    // Check attendance
                    checkTodayAttendance();
                    loadAttendanceHistory();
                } else {
                    throw new Error('Invalid student data in localStorage');
                }
            } catch (e) {
                console.error('Error parsing saved student:', e);
                localStorage.removeItem('neipsCurrentStudent');
                redirectToLogin();
            }
        } else {
            // No student data, redirect to login
            redirectToLogin();
        }
    }
}// Add this function to update district and trade info
// Update the updateDistrictAndTradeInfo function in student.js
// Update district and trade info - FIXED VERSION
function updateDistrictAndTradeInfo(student) {
    if (!student) return;

    const studentObj = student.student || student;

    console.log('🔍 Student object for district extraction:', studentObj);
    
    // Debug: Log all keys to see what's available
    console.log('📋 Available keys in student object:', Object.keys(studentObj));
    
    // Check where district might be stored
    const possibleDistrictKeys = [
        'Address',
        'District',
        'Center',
        'Training Center',
        'Center Name',
        'address',
        'district',
        'center'
    ];
    
    let district = 'NEIPS Center';
    for (const key of possibleDistrictKeys) {
        if (studentObj[key]) {
            district = studentObj[key];
            console.log(`✅ Found district in key "${key}": ${district}`);
            break;
        }
    }
    
    // If no district found, check the sheet name from login response
    if (district === 'NEIPS Center' && student.sheetName) {
        district = student.sheetName;
        console.log(`✅ Using sheet name as district: ${district}`);
    }

    // Extract trade info
    const trade = studentObj.Trade || studentObj.trade || studentObj.Course || studentObj.tradeCode || 'Not Assigned';

    // Update the UI elements
    const districtElement = document.getElementById('districtInfo');
    const tradeElement = document.getElementById('tradeInfo');
    
    if (districtElement) {
        districtElement.textContent = district;
    }
    
    if (tradeElement) {
        tradeElement.textContent = trade;
    }

    console.log('📍 District/Trade updated:', { district, trade });

    // Also calculate weekly attendance
    if (studentObj.id || studentObj['Unique ID']) {
        calculateWeeklyAttendance(studentObj.id || studentObj['Unique ID']);
    }
}// Add this function to calculate weekly attendance
// ==================== CALCULATE WEEKLY ATTENDANCE - FIXED ====================
async function calculateWeeklyAttendance(studentId) {
    if (!studentId) return;

    try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start of week

        let presentCount = 0;
        let totalDays = 0;

        // Check last 7 days (including today)
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);

            // Skip future dates
            if (date > today) continue;

            const dateString = date.toISOString().split('T')[0];
            
            // First check localStorage
            const attendanceKey = `attendance_${studentId}_${dateString}`;
            const savedAttendance = localStorage.getItem(attendanceKey);

            if (savedAttendance) {
                const attendance = JSON.parse(savedAttendance);
                if (attendance.status === 'Present' || attendance.status === 'Checked In') {
                    presentCount++;
                }
                totalDays++;
                continue;
            }

            // If not in localStorage, check server
            try {
                const attendanceData = await getAttendanceFromServer(studentId, dateString);
                if (attendanceData && (attendanceData.status === 'Present' || attendanceData.status === 'Checked In')) {
                    presentCount++;
                    // Save to localStorage for future
                    localStorage.setItem(attendanceKey, JSON.stringify(attendanceData));
                }
                totalDays++;
            } catch (error) {
                console.log(`No attendance found for ${dateString}`);
                totalDays++;
            }
        }

        // Update the weekly attendance display
        const weeklyElement = document.getElementById('weeklyAttendance');
        if (weeklyElement) {
            weeklyElement.textContent = `${presentCount}/${totalDays} days`;
            
            // Add color coding based on attendance
            const percentage = (presentCount / totalDays) * 100;
            if (percentage >= 80) {
                weeklyElement.style.color = '#22c55e';
                weeklyElement.style.fontWeight = 'bold';
            } else if (percentage >= 60) {
                weeklyElement.style.color = '#f59e0b';
            } else {
                weeklyElement.style.color = '#ef4444';
            }
        }

        console.log(`📅 Weekly attendance: ${presentCount}/${totalDays} days (${Math.round((presentCount/totalDays)*100)}%)`);

    } catch (error) {
        console.error('Error calculating weekly attendance:', error);
        const weeklyElement = document.getElementById('weeklyAttendance');
        if (weeklyElement) {
            weeklyElement.textContent = 'Loading...';
        }
    }
}

// Get attendance from server
async function getAttendanceFromServer(studentId, date) {
    return new Promise((resolve, reject) => {
        const callbackName = 'getAttendanceCallback_' + Date.now();
        
        window[callbackName] = function(response) {
            delete window[callbackName];
            if (response.success) {
                resolve(response.attendance);
            } else {
                reject(new Error('Attendance not found'));
            }
        };

        const params = new URLSearchParams({
            action: 'getStudentAttendanceByDate',
            studentId: studentId,
            date: date,
            callback: callbackName
        });

        const script = document.createElement('script');
        script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?${params.toString()}`;
        script.onerror = () => reject(new Error('Network error'));
        document.head.appendChild(script);
    });
}
// Helper function to redirect to login
function redirectToLogin() {
    showNotification('Please login first', 'error');
    setTimeout(() => {
        window.location.href = '../login.html';
    }, 2000);
}
// Handle student login request
// Handle student login request
async function handleStudentLoginRequest(email, dob) {
    return new Promise((resolve, reject) => {
        const callbackName = 'studentLoginCallback_' + Date.now();

        window[callbackName] = function (response) {
            delete window[callbackName];
            console.log('🔑 Login callback response:', response);

            if (response.success && response.student) {
                resolve(response);
            } else {
                reject(new Error(response.message || 'Login failed'));
            }
        };

        const params = new URLSearchParams({
            action: 'studentLogin',
            email: email,
            dob: dob,
            callback: callbackName
        });

        const script = document.createElement('script');
        script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?${params.toString()}`;
        script.onerror = () => reject(new Error('Network error'));
        document.head.appendChild(script);
    });
}// Fetch student data from server
async function fetchStudentData(identifier) {
    return new Promise((resolve, reject) => {
        const callbackName = 'fetchStudentCallback_' + Date.now();

        window[callbackName] = function (response) {
            delete window[callbackName];

            if (response.success && response.student) {
                resolve(response.student);
            } else {
                reject(new Error(response.message || 'Student not found'));
            }
        };

        const params = new URLSearchParams({
            action: 'getStudentById',
            id: identifier,
            callback: callbackName
        });

        const script = document.createElement('script');
        script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?${params.toString()}`;
        script.onerror = () => reject(new Error('Network error'));
        document.head.appendChild(script);
    });
}

// Update student UI
// Update student UI
// Update student UI
// Update student UI function to call district/trade update
function updateStudentUI(student) {
    if (!student) {
        console.error('❌ No student data to update UI');
        return;
    }

    // Get student name from the nested structure
    const studentObj = student.student || student;
    const studentName = studentObj.name || studentObj.Name || studentObj['Student Name'] || 'Student';

    document.getElementById('studentName').textContent = `Welcome, ${studentName}`;
    document.getElementById('displayName').textContent = studentName;

    console.log('✅ Student UI updated:', studentName);

    // Also update district and trade info
    updateDistrictAndTradeInfo(student);
}
// Update date and time
function updateDateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = `Time: ${now.toLocaleTimeString('en-IN')}`;
    document.getElementById('currentDate').textContent = `Date: ${now.toLocaleDateString('en-IN')}`;

    // Update every minute
    setTimeout(updateDateTime, 60000);
}

// Check today's attendance
// Check today's attendance
// Check today's attendance

// Update checkTodayAttendance function
async function checkTodayAttendance() {
    if (!currentStudent) {
        console.log('⚠️ No current student to check attendance');
        return;
    }

    // Get student ID from currentStudent
    const studentObj = currentStudent.student || currentStudent;
    const studentId = studentObj.id || studentObj['Unique ID'];

    if (!studentId) {
        console.error('❌ Cannot find student ID');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    try {
        // Check localStorage for today's attendance
        const attendanceKey = `attendance_${studentId}_${today}`;
        const savedAttendance = localStorage.getItem(attendanceKey);

        if (savedAttendance) {
            const attendance = JSON.parse(savedAttendance);
            updateAttendanceStatus(attendance.status);
        } else {
            updateAttendanceStatus('Not Marked');
        }
    } catch (error) {
        console.error('Error checking attendance:', error);
        updateAttendanceStatus('Not Marked');
    }
}// Fetch attendance record
async function fetchAttendanceRecord(studentId, date) {
    return new Promise((resolve) => {
        // For now, use localStorage data
        // In real implementation, this would fetch from server
        setTimeout(() => {
            const mockData = {
                success: true,
                attendance: null
            };

            // Check if attendance exists in localStorage (for demo)
            const attendanceKey = `attendance_${studentId}_${date}`;
            const savedAttendance = localStorage.getItem(attendanceKey);

            if (savedAttendance) {
                mockData.attendance = JSON.parse(savedAttendance);
            }

            resolve(mockData);
        }, 500);
    });
}

// Update attendance status display
// Update updateAttendanceStatus to handle new statuses
function updateAttendanceStatus(status) {
    const statusCircle = document.getElementById('statusCircle');
    const statusText = document.getElementById('statusText');

    statusText.textContent = `Today's status: ${status}`;

    switch (status.toLowerCase()) {
        case 'present':
            statusCircle.className = 'status-circle status-present';
            statusCircle.style.background = '#22c55e';
            statusCircle.style.animation = 'none';
            break;
        case 'checked in':
            statusCircle.className = 'status-circle status-checked-in';
            statusCircle.style.background = '#3b82f6';
            statusCircle.style.animation = 'pulse 2s infinite';
            break;
        case 'absent':
            statusCircle.className = 'status-circle status-absent';
            statusCircle.style.background = '#ef4444';
            statusCircle.style.animation = 'none';
            break;
        case 'not marked':
            statusCircle.className = 'status-circle';
            statusCircle.style.background = '#ffc107';
            statusCircle.style.animation = 'pulse 2s infinite';
            break;
        default:
            statusCircle.className = 'status-circle';
            statusCircle.style.background = '#ffc107';
            statusCircle.style.animation = 'pulse 2s infinite';
    }
}
// Load attendance history
// Load attendance history
// Update the loadAttendanceHistory function to show check-in/check-out
// Load attendance history - FIXED VERSION
// ==================== LOAD ATTENDANCE HISTORY - FIXED ====================
// ==================== LOAD ATTENDANCE HISTORY - REAL DATA FROM DATABASE ====================
async function loadAttendanceHistory() {
    if (!currentStudent) {
        console.log('⚠️ No current student data');
        return;
    }

    const tbody = document.getElementById('attendanceBody');
    const attendanceHistorySection = document.getElementById('attendanceHistorySection');
    
    if (!tbody) {
        console.log('❌ Attendance table body not found');
        return;
    }

    // Show loading state
    tbody.innerHTML = '<tr><td colspan="5" class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading attendance records...</td></tr>';

    try {
        // Get student ID from current student
        const studentObj = currentStudent.student || currentStudent;
        const studentId = studentObj.id || studentObj['Unique ID'] || studentObj['Student ID'];
        const studentEmail = studentObj.email || studentObj.Email;
        
        if (!studentId && !studentEmail) {
            console.log('❌ No student identifier found');
            tbody.innerHTML = '<tr><td colspan="5" class="loading-text"><i class="fas fa-exclamation-circle"></i> Cannot load attendance - student not identified</td></tr>';
            return;
        }

        console.log('🔍 Loading REAL attendance for student:', studentId || studentEmail);

        // Fetch REAL attendance from Google Sheets
        const attendanceRecords = await fetchRealAttendanceHistory(studentId, studentEmail);

        if (attendanceRecords.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-text">
                        <i class="fas fa-clipboard-list"></i> No attendance records found
                        <p class="small-text">Complete your first check-in to see records here</p>
                    </td>
                </tr>
            `;
            
            // Still show the history section but with empty message
            if (attendanceHistorySection) {
                attendanceHistorySection.style.display = 'block';
            }
            return;
        }

        // Show the history section
        if (attendanceHistorySection) {
            attendanceHistorySection.style.display = 'block';
        }

        // Clear and populate table with REAL data
        tbody.innerHTML = '';
        
        // Sort records by date (newest first)
        attendanceRecords.sort((a, b) => {
            // Handle different date formats
            const dateA = new Date(a.Date || a.date || a.Timestamp);
            const dateB = new Date(b.Date || b.date || b.Timestamp);
            return dateB - dateA;
        });
        
        // Show all records (or last 20 if many)
        const displayRecords = attendanceRecords.slice(0, 20);
        
        displayRecords.forEach(record => {
            const row = document.createElement('tr');
            
            // Extract data from record (handle different column names)
            const date = new Date(record.Date || record.date || record.Timestamp || record['Check-in Date'] || '');
            const formattedDate = date && !isNaN(date) ? 
                date.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }) : '--/--/----';
            
            // Extract check-in time
            let checkInTime = '--:--';
            if (record['Check-in Time'] || record.checkIn || record.Time || record.time) {
                const timeStr = record['Check-in Time'] || record.checkIn || record.Time || record.time;
                checkInTime = formatTimeForDisplay(timeStr)[0] + ' ' + formatTimeForDisplay(timeStr)[1];
            }
            
            // Extract check-out time
            let checkOutTime = '--:--';
            if (record['Check-out Time'] || record.checkOut) {
                const timeStr = record['Check-out Time'] || record.checkOut;
                checkOutTime = formatTimeForDisplay(timeStr)[0] + ' ' + formatTimeForDisplay(timeStr)[1];
            }
            
            // Determine method
            let method = record.Method || record.method || 'Manual';
            if (method === 'face') method = 'Face';
            if (method === 'fingerprint') method = 'Fingerprint';
            if (method === 'biometric') method = 'Biometric';
            
            // Determine status
            let status = record.Status || record.status || 'Present';
            if (status === 'Checked In' && checkOutTime !== '--:--') {
                status = 'Present';
            }
            let statusClass = status.toLowerCase().replace(' ', '-');
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${checkInTime}</td>
                <td>${checkOutTime}</td>
                <td>${method}</td>
                <td class="status-cell ${statusClass}">
                    <span class="status-indicator"></span>
                    ${status}
                </td>
            `;

            tbody.appendChild(row);
        });

        console.log(`✅ Loaded ${displayRecords.length} attendance records`);

        // Calculate weekly attendance with REAL data
        calculateWeeklyAttendanceReal(studentId, attendanceRecords);

    } catch (error) {
        console.error('❌ Error loading attendance:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-text">
                    <i class="fas fa-exclamation-triangle"></i> Error loading attendance
                    <p class="small-text">Please try again or contact support</p>
                </td>
            </tr>
        `;
    }
}
// ==================== FETCH REAL ATTENDANCE HISTORY ====================
async function fetchRealAttendanceHistory(studentId, studentEmail) {
    return new Promise((resolve, reject) => {
        const callbackName = 'realAttendanceCallback_' + Date.now();
        
        window[callbackName] = function(response) {
            delete window[callbackName];
            
            if (response.success && response.attendance) {
                console.log('✅ Received REAL attendance:', response.attendance.length, 'records');
                resolve(response.attendance);
            } else {
                console.log('⚠️ No REAL attendance found:', response.message);
                resolve([]); // Return empty array instead of rejecting
            }
        };

        // Call Google Apps Script to get REAL attendance
        const params = new URLSearchParams({
            action: 'getStudentAttendance',
            studentId: studentId || '',
            studentEmail: studentEmail || '',
            callback: callbackName
        });

        const script = document.createElement('script');
        script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?${params.toString()}`;
        script.onerror = () => {
            console.log('⚠️ Could not fetch attendance - using localStorage data');
            // Fallback to localStorage data
            resolve(getAttendanceFromLocalStorage(studentId));
        };
        document.head.appendChild(script);
    });
}

// ==================== CALCULATE WEEKLY ATTENDANCE FROM REAL DATA ====================
function calculateWeeklyAttendanceReal(studentId, attendanceRecords) {
    try {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);

        let presentCount = 0;
        let workingDays = 0;

        // Count working days in the past week (Monday to Friday)
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            // Skip weekends (0 = Sunday, 6 = Saturday)
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            
            workingDays++;
            
            const dateString = date.toISOString().split('T')[0];
            
            // Check if student has attendance for this day
            const hasAttendance = attendanceRecords.some(record => {
                const recordDate = new Date(record.Date || record.date || record.Timestamp);
                const recordDateString = recordDate.toISOString().split('T')[0];
                return recordDateString === dateString && 
                      (record.Status === 'Present' || record.status === 'Present' || 
                       record.Status === 'Checked In' || record.status === 'Checked In');
            });
            
            if (hasAttendance) {
                presentCount++;
            }
        }

        // Update the weekly attendance display
        const weeklyElement = document.getElementById('weeklyAttendance');
        if (weeklyElement) {
            weeklyElement.textContent = `${presentCount}/${workingDays} days`;
            
            // Add color coding
            if (workingDays > 0) {
                const percentage = (presentCount / workingDays) * 100;
                if (percentage >= 80) {
                    weeklyElement.style.color = '#22c55e';
                } else if (percentage >= 60) {
                    weeklyElement.style.color = '#f59e0b';
                } else {
                    weeklyElement.style.color = '#ef4444';
                }
            }
        }

        console.log(`📅 REAL Weekly attendance: ${presentCount}/${workingDays} days`);

    } catch (error) {
        console.error('Error calculating weekly attendance:', error);
    }
}

// Helper function to format time
function formatTimeForDisplay(timeStr) {
    if (!timeStr) return ['--:--', ''];
    
    // Check if time is already in 12-hour format
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const [time, period] = timeStr.split(' ');
        return [time, period];
    }
    
    // Convert 24-hour to 12-hour format
    const [hours, minutes] = timeStr.split(':').map(Number);
    let period = 'AM';
    let displayHours = hours;
    
    if (hours >= 12) {
        period = 'PM';
        if (hours > 12) displayHours = hours - 12;
    }
    if (hours === 0) displayHours = 12;
    
    return [`${displayHours}:${minutes.toString().padStart(2, '0')}`, period];
}
// Fetch attendance history from server
// Update fetchAttendanceHistory to handle check-in/check-out
// Fetch attendance history from server - REAL DATA ONLY
async function fetchAttendanceHistory(studentId) {
    return new Promise((resolve, reject) => {
        if (!studentId) {
            console.log('❌ No student ID provided');
            resolve([]);
            return;
        }

        console.log('📊 Fetching REAL attendance history for:', studentId);

        const callbackName = 'attendanceHistoryCallback_' + Date.now();
        
        window[callbackName] = function(response) {
            delete window[callbackName];
            
            if (response.success && response.attendance) {
                console.log('✅ Received attendance history:', response.attendance.length, 'records');
                resolve(response.attendance);
            } else {
                console.log('❌ No attendance history found');
                resolve([]);
            }
        };

        const params = new URLSearchParams({
            action: 'getStudentAttendanceHistory',
            studentId: studentId,
            limit: 30, // Get last 30 days of attendance
            callback: callbackName
        });

        const script = document.createElement('script');
        script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?${params.toString()}`;
        script.onerror = () => {
            console.log('⚠️ Could not fetch attendance history from server');
            // If server fails, return empty array
            resolve([]);
        };
        document.head.appendChild(script);
    });
}
// Update initializeEventListeners to handle separate check-in/check-out
// Update initializeEventListeners for separate check-in/check-out buttons
// Update the initializeEventListeners function
function initializeEventListeners() {
    // Logout button with confirmation
    // Logout button with SweetAlert confirmation
    document.getElementById('logoutBtn').addEventListener('click', function (e) {
        e.preventDefault();

        Swal.fire({
            title: 'Logout Confirmation',
            text: 'Are you sure you want to logout? You will need to login again.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Logout',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            backdrop: true,
            allowOutsideClick: false,
            allowEscapeKey: true
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('neipsCurrentStudent');

                Swal.fire({
                    title: 'Logged Out!',
                    text: 'You have been successfully logged out.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '../login.html';
                });
            }
        });
    });

    // Face Check In
    document.getElementById('faceCheckInBtn').addEventListener('click', function () {
        startFaceAuthentication('check-in');
    });

    // Face Check Out
    document.getElementById('faceCheckOutBtn').addEventListener('click', function () {
        startFaceAuthentication('check-out');
    });

    // Biometric Check In
    document.getElementById('biometricCheckInBtn').addEventListener('click', function () {
        startBiometricAuthentication('check-in');
    });

    // Biometric Check Out
    document.getElementById('biometricCheckOutBtn').addEventListener('click', function () {
        startBiometricAuthentication('check-out');
    });

    // Close buttons
    document.getElementById('closeWebcam').addEventListener('click', stopFaceAuthentication);
    document.getElementById('closeBiometric').addEventListener('click', hideBiometricModal);
    document.getElementById('cancelScan').addEventListener('click', stopFaceAuthentication);

    // Capture button
    document.getElementById('captureBtn').addEventListener('click', captureAndVerifyFace);

    // Biometric modal buttons
    document.getElementById('startBiometric').addEventListener('click', simulateBiometricScan);
    document.getElementById('cancelBiometric').addEventListener('click', hideBiometricModal);

  
   
}

// Add logout confirmation function
function showLogoutConfirmation() {
    // Create confirmation modal
    const confirmModal = document.createElement('div');
    confirmModal.className = 'logout-confirmation-modal';
    confirmModal.innerHTML = `
        <div class="logout-confirmation-content">
            <div class="logout-confirmation-header">
                <h3><i class="fas fa-sign-out-alt"></i> Confirm Logout</h3>
                <button class="btn-close" id="closeLogoutModal">&times;</button>
            </div>
            <div class="logout-confirmation-body">
                <div class="logout-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <p>Are you sure you want to logout?</p>
                <p class="logout-warning">You will need to login again to access your attendance.</p>
            </div>
            <div class="logout-confirmation-footer">
                <button class="btn-secondary" id="cancelLogout">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="btn-logout-confirm" id="confirmLogout">
                    <i class="fas fa-sign-out-alt"></i> Yes, Logout
                </button>
            </div>
        </div>
    `;

    // Add CSS for the modal
    const style = document.createElement('style');
    style.textContent = `
        .logout-confirmation-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
            animation: fadeIn 0.3s ease;
        }
        
        .logout-confirmation-content {
            background: var(--card-bg);
            border-radius: 12px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
            animation: slideUp 0.3s ease;
        }
        
        .logout-confirmation-header {
            padding: 20px;
            background: var(--primary);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logout-confirmation-header h3 {
            margin: 0;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .logout-confirmation-body {
            padding: 30px 20px;
            text-align: center;
        }
        
        .logout-icon {
            font-size: 48px;
            color: var(--primary);
            margin-bottom: 15px;
        }
        
        .logout-confirmation-body p {
            margin-bottom: 10px;
            font-size: 16px;
            color: var(--text-main);
        }
        
        .logout-warning {
            font-size: 14px;
            color: var(--text-muted);
        }
        
        .logout-confirmation-footer {
            padding: 20px;
            display: flex;
            gap: 12px;
            border-top: 1px solid var(--border-light);
        }
        
        .logout-confirmation-footer button {
            flex: 1;
            padding: 12px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        
        .btn-logout-confirm {
            background: #ef4444;
            color: white;
        }
        
        .btn-logout-confirm:hover {
            background: #dc2626;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .logout-confirmation-content {
                background: var(--card-bg);
            }
            
            .logout-confirmation-footer {
                border-top-color: var(--border-light);
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(confirmModal);

    // Add event listeners for the modal buttons
    document.getElementById('closeLogoutModal').addEventListener('click', function () {
        document.body.removeChild(confirmModal);
        document.head.removeChild(style);
    });

    document.getElementById('cancelLogout').addEventListener('click', function () {
        document.body.removeChild(confirmModal);
        document.head.removeChild(style);
    });

    document.getElementById('confirmLogout').addEventListener('click', function () {
        performLogout();
    });

    // Close modal when clicking outside
    confirmModal.addEventListener('click', function (e) {
        if (e.target === confirmModal) {
            document.body.removeChild(confirmModal);
            document.head.removeChild(style);
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', function handleEscape(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(confirmModal);
            document.head.removeChild(style);
            document.removeEventListener('keydown', handleEscape);
        }
    });
}

// Perform logout function
function performLogout() {
    // Clear localStorage
    localStorage.removeItem('neipsCurrentStudent');

    // Show logout notification
    showNotification('Logged out successfully', 'success');

    // Redirect to login page after a short delay
    setTimeout(() => {
        window.location.href = '../login.html';
    }, 1000);
}

// Also update the existing showNotification function to ensure it works with the modal
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.student-notification');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `student-notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: ${type === 'error' ? '#dc3545' :
            type === 'success' ? '#28a745' :
                type === 'warning' ? '#ffc107' : '#17a2b8'};
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}
// ==================== FACE AUTHENTICATION ====================

// Update startFaceAuthentication function
function startFaceAuthentication(action) {
    if (!currentStudent) {
        showNotification('Please login first', 'error');
        return;
    }

    const studentObj = currentStudent.student || currentStudent;
    const studentId = studentObj.id || studentObj['Unique ID'];
    const studentName = studentObj.name || studentObj.Name;

    console.log(`📸 Starting face authentication for ${action}`);

    // Show webcam container
    const webcamContainer = document.getElementById('webcamContainer');
    webcamContainer.style.display = 'block';

    // Clear previous result
    document.getElementById('scanResult').innerHTML = '';

    // Initialize webcam
    initializeWebcam();

    // Update button text based on action
    const captureBtn = document.getElementById('captureBtn');
    captureBtn.innerHTML = `<i class="fas fa-camera"></i> Capture & ${action === 'check-in' ? 'Check In' : 'Check Out'}`;

    // Store the action in a data attribute
    captureBtn.dataset.action = action;

    showNotification(`Position your face clearly for ${action}`, 'info');
}

// Initialize webcam
async function initializeWebcam() {
    try {
        const video = document.getElementById('webcamVideo');

        // Stop any existing stream
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
        }

        // Get webcam access
        webcamStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        });

        video.srcObject = webcamStream;
        video.play();

        console.log('✅ Webcam initialized');

    } catch (error) {
        console.error('❌ Error accessing webcam:', error);
        showNotification('Camera access denied. Please allow camera access.', 'error');
        stopFaceAuthentication();
    }
}

// Capture and verify face
async function captureAndVerifyFace() {
    const captureBtn = document.getElementById('captureBtn');
    const action = captureBtn.dataset.action;

    if (!currentStudent || !action) {
        showNotification('Student data not loaded', 'error');
        return;
    }

    const studentObj = currentStudent.student || currentStudent;
    const studentId = studentObj.id || studentObj['Unique ID'];
    const studentName = studentObj.name || studentObj.Name;

    const video = document.getElementById('webcamVideo');
    const canvas = document.getElementById('webcamCanvas');
    const resultDiv = document.getElementById('scanResult');

    try {
        // Capture image from webcam
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        // Show processing message
        resultDiv.innerHTML = '<div class="processing"><i class="fas fa-spinner fa-spin"></i> Verifying face...</div>';

        // Prepare attendance data
        const attendanceData = {
            studentId: studentId,
            studentName: studentName,
            action: action === 'check-in' ? 'check-in' : 'check-out',
            method: 'face',
            district: studentObj.address || studentObj.district || studentObj.Center || 'NEIPS Center',
            trade: studentObj.trade || studentObj.Trade || studentObj.Course,
            tradeCode: studentObj.tradeCode || studentObj['Trade Code'],
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-IN'),
            photo: imageData.split(',')[1] // Remove data URL prefix
        };

        console.log('📸 Sending face verification request...');

        // Send to Google Apps Script
        const response = await sendAttendanceToServer(attendanceData);

        if (response.success) {
            resultDiv.innerHTML = `<div class="success"><i class="fas fa-check-circle"></i> ${response.message}</div>`;

            // Update local storage
            saveAttendanceLocally(studentId, attendanceData);

            // Update UI
            updateAttendanceStatus(response.status || (action === 'check-in' ? 'Checked In' : 'Present'));

            // Update history
            loadAttendanceHistory();

            // Close webcam after success
            setTimeout(() => {
                stopFaceAuthentication();
                showNotification(`Successfully ${action === 'check-in' ? 'checked in' : 'checked out'}!`, 'success');
            }, 2000);
        } else {
            resultDiv.innerHTML = `<div class="error"><i class="fas fa-times-circle"></i> ${response.message}</div>`;
            showNotification('Face verification failed', 'error');
        }

    } catch (error) {
        console.error('❌ Error in face verification:', error);
        resultDiv.innerHTML = '<div class="error"><i class="fas fa-times-circle"></i> Error capturing image</div>';
        showNotification('Error processing face image', 'error');
    }
}

// ==================== BIOMETRIC AUTHENTICATION ====================

// Update startBiometricAuthentication function
function startBiometricAuthentication(action) {
    if (!currentStudent) {
        showNotification('Please login first', 'error');
        return;
    }

    const studentObj = currentStudent.student || currentStudent;
    const studentId = studentObj.id || studentObj['Unique ID'];
    const studentName = studentObj.name || studentObj.Name;

    console.log(`👆 Starting biometric authentication for ${action}`);

    // Show biometric modal
    const biometricModal = document.getElementById('biometricModal');
    biometricModal.style.display = 'block';

    // Clear previous result
    document.getElementById('biometricResult').innerHTML = '';

    // Update button text
    const startBtn = document.getElementById('startBiometric');
    startBtn.innerHTML = `<i class="fas fa-play"></i> Scan Fingerprint for ${action === 'check-in' ? 'Check In' : 'Check Out'}`;

    // Store action in data attribute
    startBtn.dataset.action = action;

    showNotification(`Ready for biometric ${action}`, 'info');
}

// Simulate biometric scan (in real implementation, use actual scanner)
async function simulateBiometricScan() {
    const startBtn = document.getElementById('startBiometric');
    const action = startBtn.dataset.action;
    const resultDiv = document.getElementById('biometricResult');

    if (!currentStudent || !action) {
        showNotification('Student data not loaded', 'error');
        return;
    }

    const studentObj = currentStudent.student || currentStudent;
    const studentId = studentObj.id || studentObj['Unique ID'];
    const studentName = studentObj.name || studentObj.Name;

    try {
        // Show scanning animation
        resultDiv.innerHTML = '<div class="processing"><i class="fas fa-fingerprint fa-spin"></i> Scanning fingerprint...</div>';

        // Simulate scan delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Prepare attendance data
        const attendanceData = {
            studentId: studentId,
            studentName: studentName,
            action: action === 'check-in' ? 'check-in' : 'check-out',
            method: 'biometric',
            district: studentObj.address || studentObj.district || studentObj.Center || 'NEIPS Center',
            trade: studentObj.trade || studentObj.Trade || studentObj.Course,
            tradeCode: studentObj.tradeCode || studentObj['Trade Code'],
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-IN'),
            biometricData: 'SIMULATED_FINGERPRINT_DATA_' + Date.now()
        };

        console.log('👆 Sending biometric attendance...');

        // Send to Google Apps Script
        const response = await sendAttendanceToServer(attendanceData);

        if (response.success) {
            resultDiv.innerHTML = `<div class="success"><i class="fas fa-check-circle"></i> ${response.message}</div>`;

            // Update local storage
            saveAttendanceLocally(studentId, attendanceData);

            // Update UI
            updateAttendanceStatus(response.status || (action === 'check-in' ? 'Checked In' : 'Present'));

            // Update history
            loadAttendanceHistory();

            // Close modal after success
            setTimeout(() => {
                hideBiometricModal();
                showNotification(`Successfully ${action === 'check-in' ? 'checked in' : 'checked out'}!`, 'success');
            }, 2000);
        } else {
            resultDiv.innerHTML = `<div class="error"><i class="fas fa-times-circle"></i> ${response.message}</div>`;
            showNotification('Biometric verification failed', 'error');
        }

    } catch (error) {
        console.error('❌ Error in biometric scan:', error);
        resultDiv.innerHTML = '<div class="error"><i class="fas fa-times-circle"></i> Scan failed</div>';
        showNotification('Error in biometric scan', 'error');
    }
}

// ==================== SERVER COMMUNICATION ====================

// Send attendance to server (Google Apps Script)
// ==================== SEND ATTENDANCE TO SERVER - FIXED ====================
async function sendAttendanceToServer(attendanceData) {
    return new Promise((resolve, reject) => {
        const callbackName = 'attendanceCallback_' + Date.now();

        window[callbackName] = function (response) {
            delete window[callbackName];
            console.log('📡 Server response:', response);

            if (response && response.success) {
                resolve(response);
            } else {
                reject(new Error(response ? response.message : 'Server did not respond'));
            }
        };

        // Prepare parameters - FIXED URL
        const params = new URLSearchParams({
            action: 'saveDistrictAttendance',
            studentId: attendanceData.studentId,
            studentName: encodeURIComponent(attendanceData.studentName || ''),
            actionType: attendanceData.action,
            method: attendanceData.method,
            district: encodeURIComponent(attendanceData.district || ''),
            trade: encodeURIComponent(attendanceData.trade || ''),
            tradeCode: encodeURIComponent(attendanceData.tradeCode || ''),
            date: attendanceData.date,
            time: attendanceData.time,
            studentNo: attendanceData.studentId,
            photo: attendanceData.photo || '',
            biometricData: attendanceData.biometricData || '',
            manualReason: encodeURIComponent(attendanceData.manualReason || ''),
            additionalInfo: encodeURIComponent(attendanceData.additionalInfo || ''),
            requiresApproval: attendanceData.requiresApproval || false,
            callback: callbackName
        });

        // FIXED: Use the CORRECT Google Apps Script URL
        const scriptUrl = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?${params.toString()}`;
        console.log('📤 Sending to:', scriptUrl);

        const script = document.createElement('script');
        script.src = scriptUrl;
        
        // Set timeout for the request
        const timeout = setTimeout(() => {
            reject(new Error('Request timeout - server took too long to respond'));
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }, 30000); // 30 seconds timeout
        
        script.onload = function() {
            clearTimeout(timeout);
            console.log('✅ Script loaded successfully');
        };
        
        script.onerror = function(error) {
            clearTimeout(timeout);
            console.error('❌ Script loading error:', error);
            reject(new Error('Network error - cannot reach server. Check your internet connection.'));
        };
        
        document.head.appendChild(script);
    });
}
// Save attendance locally
function saveAttendanceLocally(studentId, attendanceData) {
    const date = attendanceData.date || new Date().toISOString().split('T')[0];
    const attendanceKey = `attendance_${studentId}_${date}`;

    // Get existing attendance for today
    const existingAttendance = localStorage.getItem(attendanceKey);
    let attendance = existingAttendance ? JSON.parse(existingAttendance) : {
        date: date,
        status: 'Checked In'
    };

    // Update based on action
    if (attendanceData.action === 'check-in') {
        attendance.checkIn = attendanceData.time;
        attendance.method = attendanceData.method;
        attendance.status = 'Checked In';
    } else if (attendanceData.action === 'check-out') {
        attendance.checkOut = attendanceData.time;
        attendance.method = attendanceData.method;
        attendance.status = 'Present';
    }

    // Save to localStorage
    localStorage.setItem(attendanceKey, JSON.stringify(attendance));
    console.log('💾 Attendance saved locally:', attendance);
}

// ==================== HELPER FUNCTIONS ====================

// Stop face authentication
function stopFaceAuthentication() {
    // Stop webcam stream
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
    }

    // Hide webcam container
    document.getElementById('webcamContainer').style.display = 'none';
}

// Hide biometric modal
function hideBiometricModal() {
    document.getElementById('biometricModal').style.display = 'none';
}

// Test function for district attendance structure
async function sendAttendanceToDistrictSheet(testData) {
    return new Promise((resolve, reject) => {
        const callbackName = 'testCallback_' + Date.now();

        window[callbackName] = function (response) {
            delete window[callbackName];
            resolve(response);
        };

        const params = new URLSearchParams({
            action: 'saveDistrictAttendance',
            studentId: testData.studentId,
            studentName: testData.studentName,
            actionType: testData.action,
            method: testData.method,
            district: testData.district,
            trade: testData.trade,
            tradeCode: testData.tradeCode,
            date: testData.date,
            time: testData.checkIn,
            studentNo: testData.studentNo,
            deviceId: testData.deviceId,
            ipAddress: testData.ipAddress,
            callback: callbackName
        });

        const script = document.createElement('script');
        script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?${params.toString()}`;
        script.onerror = () => reject(new Error('Network error'));
        document.head.appendChild(script);
    });
}

// Student Attendance Portal - Enhanced with Real Biometric Authentication
document.addEventListener('DOMContentLoaded', function () {
    console.log('🎓 Student attendance portal loaded');

    // Get student from URL parameters or localStorage
    loadStudentData();
    initializeEventListeners();
    updateDateTime();

    // Check today's attendance status
    checkTodayAttendance();

    // Load attendance history
    loadAttendanceHistory();
});

// Global variables

let isFaceAuthenticationActive = false;

// ==================== AUTHENTICATION TYPE CONSTANTS ====================
const AUTH_TYPES = {
    FINGERPRINT: 'fingerprint',
    FACE: 'face',
    MANUAL: 'manual'
};

// ==================== MANUAL CHECK-IN REASONS ====================
const MANUAL_REASONS = [
    { id: 'sensor_broken', text: 'Fingerprint sensor broken', requiresApproval: true },
    { id: 'face_injury', text: 'Face injury/bandage', requiresApproval: true },
    { id: 'wet_hands', text: 'Wet/dirty hands', requiresApproval: false },
    { id: 'gloves', text: 'Wearing gloves', requiresApproval: false },
    { id: 'camera_broken', text: 'Camera not working', requiresApproval: true },
    { id: 'technical_issue', text: 'Technical issue with device', requiresApproval: true },
    { id: 'medical', text: 'Medical condition', requiresApproval: true },
    { id: 'other', text: 'Other valid reason', requiresApproval: true }
];

// ==================== LOAD STUDENT DATA ====================
async function loadStudentData() {
    console.log('📋 Loading student data...');

    // Try to get from URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const studentEmail = urlParams.get('email');
    const dob = urlParams.get('dob');

    console.log('🔍 URL Parameters:', { studentEmail, dob });

    if (studentEmail && dob) {
        try {
            console.log('🔑 Attempting student login...');
            const loginResponse = await handleStudentLoginRequest(studentEmail, dob);
            console.log('🔑 Login response:', loginResponse);

            if (loginResponse.success && loginResponse.student) {
                currentStudent = {
                    student: loginResponse.student,
                    sheetName: loginResponse.sheetName,
                    id: loginResponse.student.id || loginResponse.student['Unique ID'] || loginResponse.student['Student ID'],
                    name: loginResponse.student.name || loginResponse.student.Name,
                    email: loginResponse.student.email || loginResponse.student.Email,
                    district: loginResponse.student.address || loginResponse.student.district || loginResponse.student.District || loginResponse.student.Center || loginResponse.sheetName,
                    trade: loginResponse.student.trade || loginResponse.student.Trade || loginResponse.student.Course,
                    tradeCode: loginResponse.student.tradeCode || loginResponse.student['Trade Code'] || loginResponse.student.trade
                };

                console.log('✅ Student data loaded:', currentStudent);
                updateStudentUI(currentStudent);

                // Store in localStorage
                localStorage.setItem('neipsCurrentStudent', JSON.stringify(currentStudent));

                // Check attendance immediately after successful login
                checkTodayAttendance();
                loadAttendanceHistory();

                // Load district and trade info
                updateDistrictAndTradeInfo(currentStudent);
            } else {
                throw new Error(loginResponse.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            showNotification('Login failed: ' + error.message, 'error');
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 3000);
        }
    } else {
        const savedStudent = localStorage.getItem('neipsCurrentStudent');
        if (savedStudent) {
            try {
                currentStudent = JSON.parse(savedStudent);
                console.log('✅ Student loaded from localStorage:', currentStudent);

                if (currentStudent && currentStudent.student) {
                    updateStudentUI(currentStudent);
                    checkTodayAttendance();
                    loadAttendanceHistory();
                } else {
                    throw new Error('Invalid student data in localStorage');
                }
            } catch (e) {
                console.error('Error parsing saved student:', e);
                localStorage.removeItem('neipsCurrentStudent');
                redirectToLogin();
            }
        } else {
            redirectToLogin();
        }
    }
}
 

// ==================== REAL FINGERPRINT AUTHENTICATION ====================
async function startRealFingerprintAuthentication(action) {
    if (!currentStudent) {
        showNotification('Please login first', 'error');
        return;
    }

    const studentObj = currentStudent.student || currentStudent;
    const studentId = studentObj.id || studentObj['Unique ID'];
    const studentName = studentObj.name || studentObj.Name;

    console.log(`👆 Starting REAL fingerprint authentication for ${action}`);

    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
        console.warn('⚠️ WebAuthn not supported, falling back to simulation');
        return startBiometricAuthentication(action);
    }

    try {
        // Show biometric modal with special instructions for fingerprint
        const biometricModal = document.getElementById('biometricModal');
        biometricModal.style.display = 'block';
        
        const resultDiv = document.getElementById('biometricResult');
        const startBtn = document.getElementById('startBiometric');
        const cancelBtn = document.getElementById('cancelBiometric');
        
        // Update UI for fingerprint
        resultDiv.innerHTML = `
            <div class="fingerprint-instructions">
                <div class="fingerprint-icon">
                    <i class="fas fa-fingerprint"></i>
                </div>
                <h3>Fingerprint Authentication</h3>
                <p>Place your finger on the sensor</p>
                <p class="hint">Look for the fingerprint icon on your screen</p>
                <div class="fingerprint-animation">
                    <div class="scan-line"></div>
                </div>
            </div>
        `;
        
        startBtn.style.display = 'none';
        cancelBtn.textContent = 'Cancel Fingerprint';

        // Store action in data attribute
        biometricModal.dataset.action = action;

        // Add special styles for fingerprint
        const style = document.createElement('style');
        style.textContent = `
            .fingerprint-instructions {
                text-align: center;
                padding: 20px;
            }
            .fingerprint-icon {
                font-size: 64px;
                color: #3b82f6;
                margin-bottom: 15px;
                animation: pulse 2s infinite;
            }
            .fingerprint-instructions h3 {
                margin-bottom: 10px;
                color: #1e40af;
            }
            .fingerprint-instructions p {
                margin-bottom: 5px;
                color: #4b5563;
            }
            .fingerprint-instructions .hint {
                font-size: 12px;
                color: #6b7280;
                font-style: italic;
            }
            .fingerprint-animation {
                width: 200px;
                height: 200px;
                margin: 20px auto;
                background: #f3f4f6;
                border-radius: 50%;
                position: relative;
                overflow: hidden;
                border: 2px dashed #d1d5db;
            }
            .scan-line {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 4px;
                background: linear-gradient(to right, transparent, #3b82f6, transparent);
                animation: scan 2s linear infinite;
            }
            @keyframes scan {
                0% { top: 0; }
                100% { top: 100%; }
            }
        `;
        document.head.appendChild(style);
        biometricModal.dataset.styleElement = style;

        // Start WebAuthn authentication after 1 second
        setTimeout(() => {
            authenticateWithWebAuthn(action, studentId, studentName);
        }, 1000);

    } catch (error) {
        console.error('❌ Error starting fingerprint auth:', error);
        showNotification('Fingerprint authentication not available', 'error');
    }
}

async function authenticateWithWebAuthn(action, studentId, studentName) {
    const resultDiv = document.getElementById('biometricResult');
    
    try {
        // Check if we can use WebAuthn
        const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        
        if (!isAvailable) {
            throw new Error('Platform authenticator not available');
        }

        // For demo purposes, we'll simulate registration and authentication
        // In production, you would:
        // 1. Register the device on first use
        // 2. Authenticate on subsequent uses
        
        resultDiv.innerHTML = `
            <div class="processing">
                <i class="fas fa-fingerprint fa-spin"></i>
                <p>Waiting for fingerprint...</p>
                <p class="hint">Tap the fingerprint sensor on your device</p>
            </div>
        `;

        // Simulate actual fingerprint scan (in real implementation, this would be WebAuthn)
        // Check if on mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // On mobile, try to use actual biometrics
            resultDiv.innerHTML = `
                <div class="processing">
                    <i class="fas fa-mobile-alt"></i>
                    <p>Use your device's biometric sensor</p>
                    <p class="hint">This will use your phone's fingerprint or face ID</p>
                </div>
            `;
            
            // For iOS/Android, we need specific implementation
            if (navigator.credentials) {
                try {
                    // Try to create a credential request
                    const publicKeyCredentialRequestOptions = {
                        challenge: new Uint8Array(32).buffer,
                        allowCredentials: [{
                            type: 'public-key',
                            id: new Uint8Array(32).buffer,
                            transports: ['internal', 'hybrid']
                        }],
                        userVerification: 'required',
                        timeout: 60000
                    };

                    const assertion = await navigator.credentials.get({
                        publicKey: publicKeyCredentialRequestOptions
                    });

                    if (assertion) {
                        // Authentication successful
                        await processSuccessfulBiometricAuth(action, studentId, studentName, 'fingerprint', assertion);
                        return;
                    }
                } catch (webAuthnError) {
                    console.warn('WebAuthn failed:', webAuthnError);
                }
            }
        }

        // Fallback to simulated authentication
        await simulateMobileFingerprintScan(action, studentId, studentName);

    } catch (error) {
        console.error('❌ WebAuthn authentication failed:', error);
        resultDiv.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Fingerprint authentication failed</p>
                <p class="hint">Please try manual check-in or use face authentication</p>
                <button class="btn-secondary" onclick="showManualCheckInModal('${action}')">
                    <i class="fas fa-hand-paper"></i> Manual Check-in
                </button>
            </div>
        `;
    }
}

async function simulateMobileFingerprintScan(action, studentId, studentName) {
    const resultDiv = document.getElementById('biometricResult');
    
    return new Promise((resolve) => {
        // Show countdown animation
        let countdown = 3;
        const countdownInterval = setInterval(() => {
            resultDiv.innerHTML = `
                <div class="processing">
                    <div class="countdown-circle">
                        ${countdown}
                    </div>
                    <p>Scanning fingerprint...</p>
                    <p class="hint">Keep your finger on the sensor</p>
                </div>
            `;
            
            // Add styles for countdown
            const style = document.createElement('style');
            style.textContent = `
                .countdown-circle {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: #3b82f6;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: bold;
                    margin: 0 auto 15px;
                    animation: pulse 1s infinite;
                }
            `;
            if (!document.querySelector('#countdown-style')) {
                style.id = 'countdown-style';
                document.head.appendChild(style);
            }
            
            countdown--;
            
            if (countdown < 0) {
                clearInterval(countdownInterval);
                
                // Simulate successful scan
                setTimeout(async () => {
                    await processSuccessfulBiometricAuth(action, studentId, studentName, 'fingerprint');
                    resolve();
                }, 1000);
            }
        }, 1000);
    });
}

// ==================== REAL FACE AUTHENTICATION ====================
function startRealFaceAuthentication(action) {
    if (!currentStudent) {
        showNotification('Please login first', 'error');
        return;
    }

    const studentObj = currentStudent.student || currentStudent;
    const studentId = studentObj.id || studentObj['Unique ID'];
    const studentName = studentObj.name || studentObj.Name;

    console.log(`📸 Starting REAL face authentication for ${action}`);

    // Show enhanced webcam container
    const webcamContainer = document.getElementById('webcamContainer');
    webcamContainer.style.display = 'block';
    
    // Clear previous result
    document.getElementById('scanResult').innerHTML = '';
    
    // Update button text
    const captureBtn = document.getElementById('captureBtn');
    captureBtn.innerHTML = `<i class="fas fa-camera"></i> Capture & ${action === 'check-in' ? 'Check In' : 'Check Out'}`;
    captureBtn.dataset.action = action;
    
    // Store action in webcam container
    webcamContainer.dataset.action = action;

    // Add face detection guide
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
        videoContainer.innerHTML += `
            <div class="face-guide-overlay">
                <div class="face-guide-circle">
                    <div class="face-guide-inner"></div>
                </div>
                <div class="face-guide-instructions">
                    <p><i class="fas fa-lightbulb"></i> Position your face inside the circle</p>
                    <p><i class="fas fa-sun"></i> Ensure good lighting</p>
                    <p><i class="fas fa-user"></i> Remove glasses if possible</p>
                    <p><i class="fas fa-smile"></i> Look directly at the camera</p>
                </div>
            </div>
        `;
    }

    // Add CSS for face guide
    const style = document.createElement('style');
    style.textContent = `
        .face-guide-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .face-guide-circle {
            width: 250px;
            height: 250px;
            border-radius: 50%;
            border: 3px solid rgba(59, 130, 246, 0.5);
            position: relative;
            animation: pulse-border 2s infinite;
        }
        .face-guide-inner {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            border-radius: 50%;
            border: 2px dashed rgba(59, 130, 246, 0.3);
        }
        .face-guide-instructions {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 15px;
            border-radius: 10px;
            max-width: 300px;
            font-size: 12px;
        }
        .face-guide-instructions p {
            margin: 5px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .face-guide-instructions i {
            color: #60a5fa;
            width: 16px;
        }
        @keyframes pulse-border {
            0%, 100% { border-color: rgba(59, 130, 246, 0.5); }
            50% { border-color: rgba(59, 130, 246, 0.8); }
        }
    `;
    document.head.appendChild(style);
    webcamContainer.dataset.styleElement = style;

    // Initialize webcam with better settings for face recognition
    initializeWebcamForFace();
}

async function initializeWebcamForFace() {
    try {
        const video = document.getElementById('webcamVideo');

        // Stop any existing stream
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
        }

        // Get webcam access with better settings for face detection
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user',
                frameRate: { ideal: 30 }
            },
            audio: false
        };

        webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = webcamStream;
        video.play();

        console.log('✅ Webcam initialized for face authentication');

        // Start face detection monitoring
        startFaceDetectionMonitoring(video);

    } catch (error) {
        console.error('❌ Error accessing webcam:', error);
        showNotification('Camera access denied. Please allow camera access for face authentication.', 'error');
        stopFaceAuthentication();
    }
}

function startFaceDetectionMonitoring(video) {
    // This function would integrate with a face detection library
    // For now, we'll just show a message when face is detected
    
    video.addEventListener('loadeddata', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Simple brightness detection to give feedback
        const checkFacePresence = () => {
            if (video.readyState >= 2) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Get image data for analysis
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const brightness = calculateAverageBrightness(imageData.data);
                
                // Update instructions based on brightness
                const instructions = document.querySelector('.face-guide-instructions p:first-child');
                if (instructions) {
                    if (brightness < 100) {
                        instructions.innerHTML = '<i class="fas fa-lightbulb"></i> Face detected - lighting is poor';
                        instructions.style.color = '#fbbf24';
                    } else if (brightness > 200) {
                        instructions.innerHTML = '<i class="fas fa-sun"></i> Face detected - too bright';
                        instructions.style.color = '#fbbf24';
                    } else {
                        instructions.innerHTML = '<i class="fas fa-check-circle"></i> Face detected - ready to capture';
                        instructions.style.color = '#10b981';
                    }
                }
            }
            
            if (isFaceAuthenticationActive) {
                requestAnimationFrame(checkFacePresence);
            }
        };
        
        isFaceAuthenticationActive = true;
        checkFacePresence();
    });
}

function calculateAverageBrightness(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
        sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    return sum / (data.length / 4);
}

async function captureAndVerifyFaceReal() {
    const captureBtn = document.getElementById('captureBtn');
    const action = captureBtn.dataset.action || document.getElementById('webcamContainer').dataset.action;

    if (!currentStudent || !action) {
        showNotification('Student data not loaded', 'error');
        return;
    }

    const studentObj = currentStudent.student || currentStudent;
    const studentId = studentObj.id || studentObj['Unique ID'];
    const studentName = studentObj.name || studentObj.Name;

    const video = document.getElementById('webcamVideo');
    const canvas = document.getElementById('webcamCanvas');
    const resultDiv = document.getElementById('scanResult');

    try {
        // Capture image from webcam
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Show processing animation
        resultDiv.innerHTML = `
            <div class="face-processing">
                <div class="face-processing-icon">
                    <i class="fas fa-user-check"></i>
                </div>
                <p>Verifying your identity...</p>
                <div class="processing-steps">
                    <div class="step active">Face detected</div>
                    <div class="step active">Analyzing features</div>
                    <div class="step">Comparing with database</div>
                    <div class="step">Verifying identity</div>
                </div>
            </div>
        `;

        // Add processing styles
        const style = document.createElement('style');
        style.textContent = `
            .face-processing {
                text-align: center;
                padding: 20px;
            }
            .face-processing-icon {
                font-size: 48px;
                color: #3b82f6;
                margin-bottom: 15px;
                animation: bounce 1s infinite;
            }
            .processing-steps {
                margin-top: 20px;
                display: flex;
                justify-content: space-between;
                max-width: 400px;
                margin-left: auto;
                margin-right: auto;
            }
            .processing-steps .step {
                font-size: 10px;
                color: #9ca3af;
                text-align: center;
                flex: 1;
                padding: 5px;
                position: relative;
            }
            .processing-steps .step.active {
                color: #3b82f6;
                font-weight: bold;
            }
            .processing-steps .step:not(:last-child):after {
                content: '';
                position: absolute;
                right: -10px;
                top: 10px;
                width: 20px;
                height: 2px;
                background: #d1d5db;
            }
            .processing-steps .step.active:after {
                background: #3b82f6;
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
        setTimeout(() => style.remove(), 5000);

        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.9);

        // Simulate face verification steps
        await simulateFaceVerificationSteps();

        // Prepare attendance data
        const attendanceData = {
            studentId: studentId,
            studentName: studentName,
            action: action === 'check-in' ? 'check-in' : 'check-out',
            method: 'face',
            district: studentObj.address || studentObj.district || studentObj.Center || 'NEIPS Center',
            trade: studentObj.trade || studentObj.Trade || studentObj.Course,
            tradeCode: studentObj.tradeCode || studentObj['Trade Code'],
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-IN'),
            photo: imageData.split(',')[1]
        };

        // Send to server
        const response = await sendAttendanceToServer(attendanceData);

        if (response.success) {
            resultDiv.innerHTML = `
                <div class="success">
                    <i class="fas fa-check-circle"></i>
                    <h3>Face Verified Successfully!</h3>
                    <p>${response.message}</p>
                    <div class="verification-details">
                        <div class="detail">
                            <i class="fas fa-user"></i>
                            <span>Identity confirmed</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-clock"></i>
                            <span>${attendanceData.time}</span>
                        </div>
                    </div>
                </div>
            `;

            // Update local storage and UI
            saveAttendanceLocally(studentId, attendanceData);
            updateAttendanceStatus(response.status || (action === 'check-in' ? 'Checked In' : 'Present'));
            loadAttendanceHistory();

            // Close webcam after success
            setTimeout(() => {
                stopFaceAuthentication();
                showNotification(`Face ${action} successful!`, 'success');
            }, 2000);
        } else {
            resultDiv.innerHTML = `
                <div class="error">
                    <i class="fas fa-times-circle"></i>
                    <h3>Verification Failed</h3>
                    <p>${response.message}</p>
                    <p class="hint">Please ensure:</p>
                    <ul>
                        <li>Your face is clearly visible</li>
                        <li>Good lighting conditions</li>
                        <li>No obstructions (glasses, masks)</li>
                    </ul>
                    <button class="btn-secondary" onclick="showManualCheckInModal('${action}')">
                        <i class="fas fa-hand-paper"></i> Try Manual Check-in
                    </button>
                </div>
            `;
        }

    } catch (error) {
        console.error('❌ Error in face verification:', error);
        resultDiv.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error capturing image</p>
                <button class="btn-secondary" onclick="showManualCheckInModal('${action}')">
                    <i class="fas fa-hand-paper"></i> Manual Check-in
                </button>
            </div>
        `;
    }
}

async function simulateFaceVerificationSteps() {
    // Simulate the verification process with steps
    const steps = document.querySelectorAll('.processing-steps .step');
    
    for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        steps[i].classList.add('active');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
}

// ==================== MANUAL CHECK-IN SYSTEM ====================
function showManualCheckInModal(action) {
    if (!currentStudent) {
        showNotification('Please login first', 'error');
        return;
    }

    // Close any open modals first
    stopFaceAuthentication();
    hideBiometricModal();

    // Create manual check-in modal
    const modal = document.createElement('div');
    modal.className = 'manual-checkin-modal';
    modal.innerHTML = `
        <div class="manual-checkin-content">
            <div class="manual-checkin-header">
                <h3><i class="fas fa-hand-paper"></i> Manual Check-in</h3>
                <button class="btn-close" id="closeManualModal">&times;</button>
            </div>
            <div class="manual-checkin-body">
                <div class="warning-note">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p><strong>Important:</strong> Manual check-in is only for genuine cases when biometric/facial authentication is not possible.</p>
                    <p>Misuse may lead to disciplinary action.</p>
                </div>
                
                <div class="form-group">
                    <label for="manualReason">
                        <i class="fas fa-clipboard-check"></i> Select Reason
                    </label>
                    <select id="manualReason" class="form-control">
                        <option value="">-- Select a valid reason --</option>
                        ${MANUAL_REASONS.map(reason => 
                            `<option value="${reason.id}" data-requires-approval="${reason.requiresApproval}">
                                ${reason.text} ${reason.requiresApproval ? '(Requires Approval)' : ''}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group" id="additionalInfoGroup" style="display: none;">
                    <label for="additionalInfo">
                        <i class="fas fa-comment-alt"></i> Additional Information
                    </label>
                    <textarea id="additionalInfo" class="form-control" 
                        placeholder="Please provide details about your situation..."></textarea>
                    <small class="form-text">This information will be reviewed by your supervisor.</small>
                </div>
                
                <div class="form-group" id="approvalNote" style="display: none;">
                    <div class="alert alert-warning">
                        <i class="fas fa-user-shield"></i>
                        <p><strong>Supervisor Approval Required:</strong> This reason requires approval from your supervisor. Your attendance will be marked as "Pending Approval".</p>
                    </div>
                </div>
                
                <div class="captcha-section">
                    <div class="captcha-box">
                        <span id="captchaText">${generateCaptcha()}</span>
                    </div>
                    <div class="form-group">
                        <label for="captchaInput">Enter the code above to confirm</label>
                        <input type="text" id="captchaInput" class="form-control" 
                            placeholder="Type the code here" maxlength="6">
                    </div>
                </div>
                
                <div class="declaration">
                    <label class="checkbox-label">
                        <input type="checkbox" id="manualDeclaration">
                        <span>I declare that I am unable to use biometric/facial authentication for the selected reason and this is a genuine case.</span>
                    </label>
                </div>
            </div>
            <div class="manual-checkin-footer">
                <button class="btn-secondary" id="cancelManual">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="btn-primary" id="submitManual" disabled>
                    <i class="fas fa-check-circle"></i> Submit ${action === 'check-in' ? 'Check-in' : 'Check-out'}
                </button>
            </div>
        </div>
    `;

    // Add CSS for manual check-in
    const style = document.createElement('style');
    style.textContent = `
        .manual-checkin-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1003;
            animation: fadeIn 0.3s ease;
        }
        .manual-checkin-content {
            background: var(--card-bg);
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            animation: slideUp 0.3s ease;
        }
        .manual-checkin-header {
            padding: 20px;
            background: var(--primary);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 12px 12px 0 0;
        }
        .manual-checkin-header h3 {
            margin: 0;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .manual-checkin-body {
            padding: 20px;
        }
        .warning-note {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        .warning-note i {
            color: #f59e0b;
            font-size: 20px;
            margin-top: 2px;
        }
        .warning-note p {
            margin: 5px 0;
            font-size: 14px;
            color: #92400e;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--text-main);
        }
        .form-control {
            width: 100%;
            padding: 12px;
            border: 2px solid var(--border-light);
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s ease;
            background: var(--input-bg);
            color: var(--text-main);
        }
        .form-control:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        textarea.form-control {
            min-height: 100px;
            resize: vertical;
        }
        .form-text {
            display: block;
            margin-top: 5px;
            font-size: 12px;
            color: var(--text-muted);
        }
        .alert-warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 12px;
            border-radius: 6px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        .alert-warning i {
            color: #f59e0b;
        }
        .captcha-section {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid var(--border-light);
        }
        .captcha-box {
            background: white;
            padding: 15px;
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 5px;
            color: #1f2937;
            border: 2px solid var(--border-light);
            border-radius: 6px;
            margin-bottom: 15px;
            user-select: none;
            background: linear-gradient(45deg, #f3f4f6 25%, transparent 25%, 
                transparent 50%, #f3f4f6 50%, #f3f4f6 75%, transparent 75%, transparent);
            background-size: 20px 20px;
        }
        .declaration {
            margin: 20px 0;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid var(--border-light);
        }
        .checkbox-label {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            cursor: pointer;
            font-size: 14px;
        }
        .checkbox-label input[type="checkbox"] {
            margin-top: 3px;
            accent-color: var(--primary);
        }
        .manual-checkin-footer {
            padding: 20px;
            display: flex;
            gap: 12px;
            border-top: 1px solid var(--border-light);
        }
        .manual-checkin-footer button {
            flex: 1;
            padding: 12px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        .manual-checkin-footer button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    // Store references
    modal.dataset.action = action;
    modal.dataset.styleElement = style;

    // Add event listeners
    document.getElementById('closeManualModal').addEventListener('click', () => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
    });

    document.getElementById('cancelManual').addEventListener('click', () => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
    });

    const reasonSelect = document.getElementById('manualReason');
    const additionalInfoGroup = document.getElementById('additionalInfoGroup');
    const approvalNote = document.getElementById('approvalNote');
    const declarationCheckbox = document.getElementById('manualDeclaration');
    const captchaInput = document.getElementById('captchaInput');
    const submitBtn = document.getElementById('submitManual');
    const captchaText = document.getElementById('captchaText');

    // Update UI based on selected reason
    reasonSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const requiresApproval = selectedOption.dataset.requiresApproval === 'true';
        
        additionalInfoGroup.style.display = 'block';
        approvalNote.style.display = requiresApproval ? 'block' : 'none';
        
        updateSubmitButtonState();
    });

    // Update button state based on form completion
    [reasonSelect, declarationCheckbox, captchaInput].forEach(element => {
        element.addEventListener('input', updateSubmitButtonState);
    });

    declarationCheckbox.addEventListener('change', updateSubmitButtonState);

    function updateSubmitButtonState() {
        const isReasonSelected = reasonSelect.value !== '';
        const isDeclarationChecked = declarationCheckbox.checked;
        const isCaptchaCorrect = captchaInput.value.toUpperCase() === captchaText.textContent;
        
        submitBtn.disabled = !(isReasonSelected && isDeclarationChecked && isCaptchaCorrect);
    }

    // Submit manual check-in
    submitBtn.addEventListener('click', async function() {
        await processManualCheckIn(action, reasonSelect.value, document.getElementById('additionalInfo').value);
        document.body.removeChild(modal);
        document.head.removeChild(style);
    });

    // Close modal when clicking outside
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', function handleEscape(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.head.removeChild(style);
            document.removeEventListener('keydown', handleEscape);
        }
    });
}

function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
}

async function processManualCheckIn(action, reason, additionalInfo) {
    if (!currentStudent) return;

    const studentObj = currentStudent.student || currentStudent;
    const studentId = studentObj.id || studentObj['Unique ID'];
    const studentName = studentObj.name || studentObj.Name;

    try {
        // Find the reason text
        const reasonObj = MANUAL_REASONS.find(r => r.id === reason);
        const reasonText = reasonObj ? reasonObj.text : reason;

        // Prepare attendance data for manual check-in
        const attendanceData = {
            studentId: studentId,
            studentName: studentName,
            action: action === 'check-in' ? 'check-in' : 'check-out',
            method: 'manual',
            district: studentObj.address || studentObj.district || studentObj.Center || 'NEIPS Center',
            trade: studentObj.trade || studentObj.Trade || studentObj.Course,
            tradeCode: studentObj.tradeCode || studentObj['Trade Code'],
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-IN'),
            manualReason: reasonText,
            additionalInfo: additionalInfo,
            requiresApproval: reasonObj ? reasonObj.requiresApproval : false
        };

        // Show processing notification
        showNotification('Processing manual check-in...', 'info');

        // Send to server
        const response = await sendAttendanceToServer(attendanceData);

        if (response.success) {
            // Update local storage
            saveAttendanceLocally(studentId, attendanceData);
            
            // Update UI
            const status = reasonObj && reasonObj.requiresApproval ? 'Pending Approval' : 'Present';
            updateAttendanceStatus(status);
            loadAttendanceHistory();
            
            // Show success message
            if (reasonObj && reasonObj.requiresApproval) {
                showNotification('Manual check-in submitted. Pending supervisor approval.', 'warning');
            } else {
                showNotification('Manual check-in successful!', 'success');
            }
        } else {
            showNotification('Manual check-in failed: ' + response.message, 'error');
        }

    } catch (error) {
        console.error('❌ Error in manual check-in:', error);
        showNotification('Error processing manual check-in', 'error');
    }
}

// ==================== UPDATED EVENT LISTENERS ====================

// ==================== HELPER FUNCTIONS ====================
async function processSuccessfulBiometricAuth(action, studentId, studentName, method, credential = null) {
    const biometricModal = document.getElementById('biometricModal');
    const resultDiv = document.getElementById('biometricResult');

    // Show success animation
    resultDiv.innerHTML = `
        <div class="success-animation">
            <div class="checkmark-circle">
                <div class="checkmark"></div>
            </div>
            <h3>Authentication Successful!</h3>
            <p>${method === 'fingerprint' ? 'Fingerprint verified' : 'Identity confirmed'}</p>
            <div class="success-details">
                <div class="detail">
                    <i class="fas fa-user-check"></i>
                    <span>${studentName}</span>
                </div>
                <div class="detail">
                    <i class="fas fa-${method === 'fingerprint' ? 'fingerprint' : 'id-card'}"></i>
                    <span>${method === 'fingerprint' ? 'Biometric' : 'Face'} Verified</span>
                </div>
            </div>
        </div>
    `;

    // Prepare attendance data
    const attendanceData = {
        studentId: studentId,
        studentName: studentName,
        action: action === 'check-in' ? 'check-in' : 'check-out',
        method: method,
        district: currentStudent.district,
        trade: currentStudent.trade,
        tradeCode: currentStudent.tradeCode,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-IN'),
        biometricData: credential ? 'WEBAUTHN_' + Date.now() : 'MOBILE_BIOMETRIC_' + Date.now()
    };

    try {
        // Send to server
        const response = await sendAttendanceToServer(attendanceData);

        if (response.success) {
            // Update local storage
            saveAttendanceLocally(studentId, attendanceData);
            
            // Update UI
            updateAttendanceStatus(response.status || (action === 'check-in' ? 'Checked In' : 'Present'));
            loadAttendanceHistory();

            // Close modal after success
            setTimeout(() => {
                hideBiometricModal();
                showNotification(`${method === 'fingerprint' ? 'Fingerprint' : 'Face'} ${action} successful!`, 'success');
            }, 2000);
        } else {
            resultDiv.innerHTML = `
                <div class="error">
                    <i class="fas fa-times-circle"></i>
                    <p>${response.message}</p>
                    <button class="btn-secondary" onclick="showManualCheckInModal('${action}')">
                        <i class="fas fa-hand-paper"></i> Try Manual Check-in
                    </button>
                </div>
            `;
        }

    } catch (error) {
        console.error('❌ Error processing biometric auth:', error);
        resultDiv.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error saving attendance</p>
                <button class="btn-secondary" onclick="showManualCheckInModal('${action}')">
                    <i class="fas fa-hand-paper"></i> Try Manual Check-in
                </button>
            </div>
        `;
    }
}

// ==================== STOP/CLEANUP FUNCTIONS ====================
function stopFaceAuthentication() {
    // Stop webcam stream
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
    }

    // Stop face detection monitoring
    isFaceAuthenticationActive = false;

    // Hide webcam container
    const webcamContainer = document.getElementById('webcamContainer');
    webcamContainer.style.display = 'none';
    
    // Remove any added styles
    const styleElement = webcamContainer.dataset.styleElement;
    if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
    }
    delete webcamContainer.dataset.styleElement;
}

function hideBiometricModal() {
    const biometricModal = document.getElementById('biometricModal');
    biometricModal.style.display = 'none';
    
    // Remove any added styles
    const styleElement = biometricModal.dataset.styleElement;
    if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
    }
    delete biometricModal.dataset.styleElement;
}

// ==================== MOBILE DETECTION ====================
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroid() {
    return /Android/i.test(navigator.userAgent);
}

// ==================== DEVICE CAPABILITY CHECK ====================
async function checkDeviceCapabilities() {
    const capabilities = {
        fingerprint: false,
        face: false,
        camera: false
    };

    try {
        // Check for WebAuthn (fingerprint/face ID)
        if (window.PublicKeyCredential) {
            capabilities.fingerprint = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        }

        // Check for camera
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        capabilities.camera = hasCamera;

        // Check for face recognition capability (simplified)
        capabilities.face = hasCamera && 'FaceDetector' in window;

    } catch (error) {
        console.warn('Device capability check failed:', error);
    }

    return capabilities;
}

// ==================== INITIALIZE WITH DEVICE CHECK ====================
document.addEventListener('DOMContentLoaded', async function() {
    // Check device capabilities
    const capabilities = await checkDeviceCapabilities();
    
    // Update UI based on capabilities
    updateAuthButtonsBasedOnCapabilities(capabilities);
    
    // Store capabilities for later use
    window.deviceCapabilities = capabilities;
});

function updateAuthButtonsBasedOnCapabilities(capabilities) {
    const faceBtn = document.getElementById('faceCheckInBtn');
    const biometricBtn = document.getElementById('biometricCheckInBtn');
    
    if (faceBtn && !capabilities.camera) {
        faceBtn.disabled = true;
        faceBtn.title = 'Camera not available on this device';
        faceBtn.innerHTML = '<i class="fas fa-camera-slash"></i> Face (Unavailable)';
    }
    
    if (biometricBtn && !capabilities.fingerprint) {
        biometricBtn.disabled = true;
        biometricBtn.title = 'Biometric sensor not available';
        biometricBtn.innerHTML = '<i class="fas fa-fingerprint-slash"></i> Fingerprint (Unavailable)';
    }
}

// ==================== TIME VALIDATION ====================
function validateAttendanceTime(action) {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // Time restrictions
    const checkInStart = 9 * 60;      // 9:00 AM
    const checkInEnd = 11 * 60;       // 11:00 AM
    const checkOutStart = 16 * 60 + 30; // 4:30 PM
    const checkOutEnd = 19 * 60;      // 7:00 PM

    if (action === 'check-in') {
        if (totalMinutes < checkInStart) {
            return {
                valid: false,
                message: 'Check-in is allowed only between 9 AM and 11 AM. It\'s too early.'
            };
        }
        if (totalMinutes > checkInEnd) {
            return {
                valid: false,
                message: 'Check-in is allowed only between 9 AM and 11 AM. It\'s too late for check-in.'
            };
        }
        return { valid: true };
        
    } else if (action === 'check-out') {
        if (totalMinutes < checkOutStart) {
            return {
                valid: false,
                message: 'Check-out is allowed only between 4:30 PM and 7 PM. It\'s too early.'
            };
        }
        if (totalMinutes > checkOutEnd) {
            return {
                valid: false,
                message: 'Check-out is allowed only between 4:30 PM and 7 PM. It\'s too late.'
            };
        }
        return { valid: true };
    }

    return { valid: true };
}

// ==================== ENHANCED NOTIFICATIONS ====================
function showEnhancedNotification(message, type = 'info', options = {}) {
    const notification = document.createElement('div');
    notification.className = `enhanced-notification ${type}`;
    
    const icon = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    }[type] || 'fa-info-circle';

    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${options.title || type.toUpperCase()}</div>
            <div class="notification-message">${message}</div>
            ${options.details ? `<div class="notification-details">${options.details}</div>` : ''}
        </div>
        <button class="notification-close">&times;</button>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .enhanced-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: flex-start;
            gap: 12px;
            max-width: 400px;
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            border-left: 4px solid;
        }
        .enhanced-notification.success {
            border-left-color: #10b981;
            background: #f0fdf4;
        }
        .enhanced-notification.error {
            border-left-color: #ef4444;
            background: #fef2f2;
        }
        .enhanced-notification.warning {
            border-left-color: #f59e0b;
            background: #fffbeb;
        }
        .enhanced-notification.info {
            border-left-color: #3b82f6;
            background: #eff6ff;
        }
        .notification-icon {
            font-size: 24px;
        }
        .notification-icon i {
            color: inherit;
        }
        .notification-content {
            flex: 1;
        }
        .notification-title {
            font-weight: bold;
            margin-bottom: 4px;
            font-size: 14px;
        }
        .notification-message {
            font-size: 14px;
            margin-bottom: 8px;
        }
        .notification-details {
            font-size: 12px;
            color: #6b7280;
            background: rgba(255,255,255,0.5);
            padding: 8px;
            border-radius: 4px;
            margin-top: 8px;
        }
        .notification-close {
            background: none;
            border: none;
            font-size: 20px;
            color: #9ca3af;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        @keyframes slideIn {
            from { transform: translateX(400px); }
            to { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
                style.remove();
            }
        }, 300);
    });

    // Auto remove after timeout
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        }
    }, options.duration || 5000);

    return notification;
}

// Update existing showNotification to use enhanced version
function showNotification(message, type = 'info', options = {}) {
    return showEnhancedNotification(message, type, options);
}

// ==================== EXISTING FUNCTIONS (keep these as they are) ====================
// [Keep all your existing functions like loadStudentData, updateStudentUI, 
//  checkTodayAttendance, loadAttendanceHistory, sendAttendanceToServer, 
//  saveAttendanceLocally, etc. as they are]

// Only modify the authentication-related functions as shown above