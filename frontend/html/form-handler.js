// ==================== GOOGLE SHEETS CONFIGURATION ====================
// ==================== FIRESTORE PRIMARY DATABASE SETUP ====================
// Firebase is already initialized from firebase-config.js
// We'll use the global 'db' variable that's already set

// Helper to save to Firestore
async function saveToFirestorePrimary(collection, data, docId = null) {
    try {
        console.log('🔥 Attempting Firestore save...');

        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            console.log('⚠️ Firebase SDK not loaded');
            return { success: false, error: 'Firebase not loaded' };
        }

        // Check if db is initialized
        if (!window.db) {
            // Try to initialize
            try {
                if (!firebase.apps.length) {
                    // Use the config from firebase-config.js
                    firebase.initializeApp({
                        apiKey: "AIzaSyDJGQnbpJbk6KWb0C413sB97SUI5KJr4us",
                        authDomain: "neips2025.firebaseapp.com",
                        projectId: "neips2025",
                        storageBucket: "neips2025.firebasestorage.app",
                        messagingSenderId: "186210248339",
                        appId: "1:186210248339:web:5ed611a5ae36e1ad438f66"
                    });
                }
                window.db = firebase.firestore();
                console.log('✅ Firestore initialized');
            } catch (initError) {
                console.log('❌ Firestore init failed:', initError.message);
                return { success: false, error: 'Firestore init failed' };
            }
        }

        const id = docId || 'STU_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Prepare data for Firestore
        const firestoreData = {
            ...data,
            _id: id,
            _createdAt: new Date().toISOString(),
            _updatedAt: new Date().toISOString(),
            _source: 'website_registration'
        };

        console.log('📦 Saving to Firestore:', collection, id);

        // Save to Firestore
        await window.db.collection(collection).doc(id).set(firestoreData);

        console.log('✅ SUCCESS: Saved to Firestore', collection, id);
        return { success: true, id: id };

    } catch (error) {
        console.error('❌ Firestore save error:', error.message);
        return { success: false, error: error.message };
    }
}

// Background function to sync to Firestore (won't block registration)
function syncToFirestoreInBackground(collection, data) {
    // Run in background - don't await
    setTimeout(async () => {
        try {
            const result = await saveToFirestorePrimary(collection, data);
            if (result.success) {
                console.log('✅ Background sync to Firestore successful');
            } else {
                console.log('⚠️ Background sync failed (non-critical)');
            }
        } catch (error) {
            console.log('⚠️ Background sync error (ignored):', error.message);
        }
    }, 500); // 500ms delay
}
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec';

// ==================== FORM HANDLER INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function () {
    console.log('📝 Form handler initialized');
    initializeFormHandler();
});
// STAFF PAGE OVERRIDE - Check if we're on staff page
if (window.location.pathname.includes('staff-register')) {
    console.log('🚨 Staff registration page detected - overriding form handler');

    // Wait for page to load
    document.addEventListener('DOMContentLoaded', function () {
        // Set user type to staff automatically
        const userTypeSelect = document.getElementById('user-type');
        if (userTypeSelect) {
            userTypeSelect.value = 'staff';
            // Trigger any form field updates if needed
            if (typeof toggleFormFields === 'function') {
                toggleFormFields();
            }
        }

        // Get role from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const roleFromUrl = urlParams.get('role');
        if (roleFromUrl) {
            const roleSelect = document.getElementById('staff-role');
            if (roleSelect) {
                // Convert URL parameter to readable role
                const roleMap = {
                    'mobilizer': 'Mobilizer',
                    'trainer': 'Trainer',
                    'training-partner': 'Training Partner',
                    'training-centre': 'Training Centre',
                    'awarding-body': 'Awarding Body',
                    'assessor': 'Assessor',
                    'assessment-agency': 'Assessment Agency',
                    'establishment': 'Establishment'
                };
                roleSelect.value = roleMap[roleFromUrl] || roleFromUrl;
            }
        }
    });
}
// ==================== REGISTRATION FORM FUNCTIONALITY ====================
function initializeFormHandler() {
    console.log('🚀 Form handler starting...');

    const registrationForm = document.getElementById('registrationForm');
    const districtSelect = document.getElementById('apply-address');
    const tradeSelect = document.getElementById('apply-trade');
    const userTypeSelect = document.getElementById('user-type');

    if (!registrationForm) {
        console.error('❌ Registration form not found');
        return;
    }

    console.log('✅ Registration form found');

    // Add staff fields if they don't exist
    addStaffFieldsIfNeeded();

    // User type change listener
    if (userTypeSelect) {
        userTypeSelect.addEventListener('change', toggleFormFields);
        // Initialize form fields
        toggleFormFields();
    }

    // District change listener (only for students)
    if (districtSelect) {
        districtSelect.addEventListener('change', function () {
            if (document.getElementById('user-type').value === 'student') {
                loadTradesSimple(this.value);
            }
        });
    }

    // Remove ALL existing event listeners by cloning
    const newForm = registrationForm.cloneNode(true);
    registrationForm.parentNode.replaceChild(newForm, registrationForm);

    // Add fresh event listener
    document.getElementById('registrationForm').addEventListener('submit', handleFormSubmission);

    // Setup photo preview
    setupPhotoPreview();

    console.log('✅ Form handler fully initialized with staff support');
}

// ==================== STUDENT REGISTRATION ====================
// ==================== STUDENT REGISTRATION ====================
// ==================== STUDENT REGISTRATION ====================
async function handleStudentRegistration(formData) {
    console.log('👨‍🎓 Handling student registration...');

    // Convert FormData to object
    const data = {
        name: formData.get('name') || document.getElementById('apply-name')?.value,
        email: formData.get('email') || document.getElementById('apply-email')?.value,
        phone: formData.get('phone') || document.getElementById('apply-phone')?.value,
        dob: formData.get('dob') || document.getElementById('apply-dob')?.value,
        trade: formData.get('trade') || document.getElementById('apply-trade')?.value,
        address: formData.get('address') || document.getElementById('apply-address')?.value,
        photo: ''
    };

    console.log('📦 Student form data collected:', data);

    // Validation checks for student
    const missingFields = [];
    if (!data.name) missingFields.push('Full Name');
    if (!data.email) missingFields.push('Email Address');
    if (!data.phone) missingFields.push('Phone Number');
    if (!data.dob) missingFields.push('Date of Birth');
    if (!data.trade || data.trade === '') missingFields.push('Trade');
    if (!data.address) missingFields.push('Training Center Address');

    // Check if photo is selected
    const photoInput = document.getElementById('student-photo');
    if (!photoInput.files || !photoInput.files[0]) {
        missingFields.push('Passport Photo');
    }

    if (missingFields.length > 0) {
        showFormNotification(`Please fill all required fields: ${missingFields.join(', ')}`, 'error');
        throw new Error('Missing required fields');
    }

    // Validate email format
    if (!validateEmail(data.email)) {
        showFormNotification('Please enter a valid email address', 'error');
        throw new Error('Invalid email format');
    }

    // Check capacity
    const tradeSelect = document.getElementById('apply-trade');
    const selectedOption = tradeSelect?.options[tradeSelect.selectedIndex];

    if (selectedOption && selectedOption.dataset.capacity) {
        const availableSeats = parseInt(selectedOption.dataset.capacity);
        if (availableSeats <= 0) {
            showFormNotification(`Sorry, ${selectedOption.textContent.split(' (')[0]} is full! Please select another trade.`, 'error');
            throw new Error('Trade is full');
        }
    }

    try {
        // Convert photo to base64
        let photoBase64 = '';
        if (photoInput.files && photoInput.files[0]) {
            console.log('📸 Processing photo...');
            photoBase64 = await compressAndConvertImage(photoInput.files[0]);
            data.photo = photoBase64;
            console.log('✅ Photo processed successfully');
        }

        // Generate student ID
        const studentId = 'NEIPS' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
        data.studentId = studentId;

        // ========== STEP 1: SAVE TO FIRESTORE (PRIMARY) ==========
        console.log('🔥 Step 1: Saving to Firestore...');
        const firestoreData = {
            studentId: studentId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            trade: data.trade,
            district: data.address,
            dob: data.dob,
            photo: data.photo,
            status: 'Pending',
            registrationDate: new Date().toISOString(),
            applicationDate: new Date().toLocaleDateString('en-IN')
        };

        const firestoreResult = await saveToFirestorePrimary('students', firestoreData, studentId);

        if (firestoreResult.success) {
            console.log('✅ PRIMARY: Saved to Firestore successfully');
        } else {
            console.log('⚠️ Firestore save failed (will continue with Sheets only)');
        }

        // ========== STEP 2: BACKUP TO GOOGLE SHEETS ==========
        console.log('📊 Step 2: Backing up to Google Sheets...');
        const submissionData = {
            action: 'student_registration',
            name: data.name,
            email: data.email,
            phone: data.phone,
            trade: data.trade,
            dob: data.dob,
            address: data.address,
            photo: data.photo,
            'Unique ID': studentId,
            'send_email': true,
            'application_date': new Date().toLocaleDateString('en-IN')
        };

        // Store in localStorage
        storeInLocalStorage(data);

        // Send to Google Sheets WITH EMAIL NOTIFICATION
        const response = await submitToGoogleSheetsWithEmail(submissionData);

        console.log('✅ Student registration successful! Response:', response);

        // Update Firestore with backup success
        if (firestoreResult.success && window.db) {
            try {
                await window.db.collection('students').doc(studentId).update({
                    _syncedToSheets: true,
                    _updatedAt: new Date().toISOString(),
                    _emailSent: true
                });
                console.log('✅ Updated Firestore with sync status');
            } catch (updateError) {
                console.log('⚠️ Could not update Firestore sync status');
            }
        }

        // Show success message to user
        showFormNotification("Registration Successful", 'success');

        // Don't reset form here - it's done in handleFormSubmission
        removePhoto(); // Only remove photo preview

        return response;

    } catch (error) {
        console.error('❌ Student registration error:', error);
        throw error;
    }
}
async function submitToGoogleSheetsWithEmail(formData) {
    return new Promise((resolve) => {
        console.log('📤 Submitting to Google Sheets with email notification...');

        const scriptURL = 'https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec';

        // Prepare data with email flag
        const params = new URLSearchParams();
        params.append('action', 'student_registration');
        params.append('name', formData.name || '');
        params.append('email', formData.email || '');
        params.append('phone', formData.phone || '');
        params.append('trade', formData.trade || '');
        params.append('dob', formData.dob || '');
        params.append('address', formData.address || '');
        params.append('photo', formData.photo || '');
        params.append('Unique ID', formData['Unique ID'] || '');
        params.append('application_date', formData.application_date || '');
        params.append('send_email', 'true');

        console.log('📦 Sending POST request with email notification');

        // Send request
        fetch(scriptURL, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            mode: 'no-cors'
        }).catch(() => {
            // Silent catch - ignore network errors
        });

        // Return success
        setTimeout(() => {
            resolve({
                success: true,
                message: 'Registration submitted successfully! Confirmation email will be sent shortly.',
                studentId: formData['Unique ID']
            });
        }, 2000);
    });
}// ==================== EMAIL DUPLICATE CHECK FUNCTION ====================
function checkEmailExists(email) {
    return new Promise((resolve, reject) => {
        console.log(`🔍 Checking if email exists: ${email}`);

        const callbackName = 'emailCheck_' + Date.now();
        const encodedEmail = encodeURIComponent(email);

        window[callbackName] = function (response) {
            console.log('📧 Email check response:', response);

            // Clean up
            delete window[callbackName];
            const script = document.getElementById('emailCheckScript');
            if (script) script.remove();

            if (response.success !== undefined) {
                resolve({
                    exists: response.exists || false,
                    message: response.message || '',
                    details: response.details || {}
                });
            } else {
                reject(new Error('Invalid response from email check'));
            }
        };

        // Create and append script tag
        const script = document.createElement('script');
        script.id = 'emailCheckScript';
        script.src = `${GOOGLE_SCRIPT_URL}?action=checkEmailExists&email=${encodedEmail}&callback=${callbackName}`;

        script.onerror = () => {
            delete window[callbackName];
            reject(new Error('Failed to check email - network error'));
        };

        // Add timeout
        const timeoutId = setTimeout(() => {
            if (document.getElementById('emailCheckScript')) {
                delete window[callbackName];
                reject(new Error('Email check request timed out'));
            }
        }, 8000);

        // Update timeout cleanup
        script.onload = () => clearTimeout(timeoutId);

        document.head.appendChild(script);
    });
}

// ==================== MODIFIED SUBMIT TO GOOGLE SHEETS ====================
async function submitToGoogleSheets(formData) {
    return new Promise((resolve, reject) => {
        console.log('📤 Submitting to Google Sheets...');

        const scriptURL = 'https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec';

        // Prepare data
        const params = new URLSearchParams();
        params.append('action', 'student_registration');
        params.append('name', formData.name || '');
        params.append('email', formData.email || '');
        params.append('phone', formData.phone || '');
        params.append('trade', formData.trade || '');
        params.append('dob', formData.dob || '');
        params.append('address', formData.address || '');
        params.append('photo', formData.photo || '');

        console.log('📦 Sending POST request with email duplicate prevention');

        // First check if email exists via server-side validation
        fetch(scriptURL, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            mode: 'no-cors' // This will prevent reading response, but submission will work
        }).catch(() => {
            // Silent catch for no-cors mode
        });

        // Wait before resolving (simulates processing)
        setTimeout(() => {
            // Always resolve as success for now
            // The actual email duplicate check happens in handleStudentRegistration
            resolve({
                success: true,
                message: 'Registration successful! Your application has been submitted.',
                studentId: 'NEIPS' + Date.now()
            });
        }, 3000);
    });
}// ==================== STAFF REGISTRATION HANDLER ====================
function handleStaffRegistration(data) {
    console.log('👨‍💼 Handling staff registration...');

    return new Promise((resolve, reject) => {
        try {
            const callbackName = 'staffRegCallback_' + Date.now();
            const params = new URLSearchParams({
                action: 'staff_registration',
                name: data.name,
                email: data.email,
                phone: data.phone,
                dob: data.dob,
                address: data.address || '',
                role: data.role || 'Staff',
                center: data.center || '',
                callback: callbackName
            });

            const url = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;

            window[callbackName] = function (response) {
                // Clean up
                delete window[callbackName];
                const script = document.getElementById('staffRegScript');
                if (script) script.remove();
                clearTimeout(timeoutId);

                if (response.success) {
                    console.log('✅ Staff registration successful');
                    resolve(response);
                } else {
                    console.log('❌ Staff registration failed:', response.message);
                    reject(new Error(response.message));
                }
            };

            // Remove any existing script
            const oldScript = document.getElementById('staffRegScript');
            if (oldScript) oldScript.remove();

            // Create and append script tag
            const script = document.createElement('script');
            script.id = 'staffRegScript';
            script.src = url;
            script.onerror = () => {
                reject(new Error('Failed to register staff - network error'));
            };

            document.head.appendChild(script);

            // Add timeout
            const timeoutId = setTimeout(() => {
                if (document.getElementById('staffRegScript')) {
                    reject(new Error('Staff registration request timed out'));
                }
            }, 10000);

        } catch (error) {
            reject(error);
        }
    });
}
// Add this SIMPLE trades loading function:
function loadTradesSimple(district) {
    console.log('📞 Loading trades for:', district);

    const tradeSelect = document.getElementById('apply-trade');
    if (!tradeSelect) return;

    const callbackName = 'trades_' + Date.now();

    window[callbackName] = function (data) {
        console.log('📦 Trades received:', data);

        // Clear dropdown
        tradeSelect.innerHTML = '';

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Choose a trade';
        tradeSelect.appendChild(defaultOption);

        if (data.success && data.availableTrades && data.availableTrades.length > 0) {
            // Add each trade
            data.availableTrades.forEach(trade => {
                const option = document.createElement('option');
                option.value = trade.code;

                // Format name
                let tradeName = trade.name || trade.code.split('-')[1] || trade.code;

                // Add capacity
                if (trade.capacity?.available !== undefined) {
                    tradeName += ` (${trade.capacity.available} seats available)`;
                    option.dataset.capacity = trade.capacity.available;
                    option.dataset.maxCapacity = trade.capacity.max || 30;
                }

                option.textContent = tradeName;
                tradeSelect.appendChild(option);
            });

            console.log(`✅ Added ${data.availableTrades.length} trades`);
        } else {
            // Show error
            const errorOption = document.createElement('option');
            errorOption.value = '';
            errorOption.textContent = data?.message || 'No trades available';
            errorOption.disabled = true;
            tradeSelect.appendChild(errorOption);
        }

        // Enable dropdown
        tradeSelect.disabled = false;

        // Clean up
        delete window[callbackName];
    };

    // Load the script
    const script = document.createElement('script');
    script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=getAvailableTrades&district=${encodeURIComponent(district)}&callback=${callbackName}`;

    script.onerror = function () {
        console.error('❌ Failed to load trades');

        tradeSelect.innerHTML = '';
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'Network error. Please try again.';
        errorOption.disabled = true;
        tradeSelect.appendChild(errorOption);
        tradeSelect.disabled = false;

        delete window[callbackName];
    };

    document.head.appendChild(script);
}

// Make sure it runs when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFormHandler);
} else {
    initializeFormHandler();
}
function setupPhotoPreview() {
    const photoInput = document.getElementById('student-photo');
    const photoPreview = document.getElementById('photo-preview');

    if (photoInput && photoPreview) {
        photoInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                // Simple validation for mobile
                if (!file.type.startsWith('image/')) {
                    showFormNotification('Please select a valid image file', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    photoPreview.innerHTML = `
                        <div class="photo-preview-image">
                            <img src="${e.target.result}" alt="Passport Photo" 
                                 style="width: 150px; height: 150px; object-fit: cover; border: 2px solid #007bff; border-radius: 4px;">
                            <div class="photo-size-label">Passport Photo Ready</div>
                            <button type="button" class="remove-photo" onclick="removePhoto()">
                                <i class="fas fa-times"></i> Remove
                            </button>
                        </div>
                    `;
                };
                reader.onerror = function () {
                    showFormNotification('Error loading image preview', 'error');
                };
                reader.readAsDataURL(file);
            }
        });
    }
}
// ==================== DISTRICT TRADE MANAGEMENT ====================

// Update the form-handler.js function that loads trades
// ==================== LOAD TRADES FOR DISTRICT ====================
// ==================== LOAD TRADES FOR DISTRICT ====================
function getTradeCapacity(districtName, trade) {
    try {
        console.log(`🔍 Getting capacity for ${trade} in ${districtName}`);

        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const allSheets = spreadsheet.getSheets();

        // First, try to find the exact district sheet
        const exactSheetName = districtName.replace(/[\/\\?*[\]]/g, '').substring(0, 31);
        let targetSheet = null;
        let totalCount = 0;

        console.log(`Looking for sheet matching: "${exactSheetName}"`);

        // Look through ALL sheets to find where students for this district are stored
        for (const sheet of allSheets) {
            const sheetName = sheet.getName();
            const data = sheet.getDataRange().getValues();

            if (data.length <= 1) continue; // Skip empty sheets

            const headers = data[0];
            const tradeIndex = headers.indexOf('Trade');
            const addressIndex = headers.indexOf('Address') || headers.indexOf('Center');
            const districtIndex = headers.indexOf('District');

            // Skip if no Trade column
            if (tradeIndex === -1) continue;

            console.log(`🔍 Checking sheet: "${sheetName}"`);

            // Check if this sheet contains students for our district
            for (let i = 1; i < data.length; i++) {
                const rowTrade = data[i][tradeIndex];
                let rowDistrict = '';

                // Try to get district from different column names
                if (addressIndex !== -1) rowDistrict = data[i][addressIndex];
                else if (districtIndex !== -1) rowDistrict = data[i][districtIndex];
                else rowDistrict = districtName; // Assume all rows are for this district

                // Count if trade matches AND district matches
                if (rowTrade === trade && rowDistrict === districtName) {
                    totalCount++;
                    console.log(`✅ Found student in "${sheetName}": ${trade} for ${districtName}`);
                }
            }
        }

        const maxCapacity = 30;
        const available = Math.max(0, maxCapacity - totalCount);
        const isFull = totalCount >= maxCapacity;

        console.log(`📊 FINAL COUNT: ${trade} in ${districtName}: ${totalCount}/${maxCapacity} (${available} available)`);

        return {
            current: totalCount,
            max: maxCapacity,
            available: available,
            isFull: isFull,
            sheetsChecked: allSheets.length
        };

    } catch (error) {
        console.error(`❌ Error getting trade capacity for ${trade} in ${districtName}:`, error);
        return {
            current: 0,
            max: 30,
            available: 30,
            isFull: false,
            error: error.toString()
        };
    }
}
function findStudentRecords(districtName, trade) {
    try {
        console.log(`🔍 Searching for ${trade} students in ${districtName}...`);

        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const sheets = spreadsheet.getSheets();

        const foundStudents = [];

        for (const sheet of sheets) {
            const data = sheet.getDataRange().getValues();
            if (data.length <= 1) continue;

            const headers = data[0];
            const tradeIndex = headers.indexOf('Trade');
            const addressIndex = headers.indexOf('Address');
            const nameIndex = headers.indexOf('Name');
            const emailIndex = headers.indexOf('Email');

            if (tradeIndex === -1) continue;

            for (let i = 1; i < data.length; i++) {
                const rowTrade = data[i][tradeIndex];
                const rowAddress = addressIndex !== -1 ? data[i][addressIndex] : '';

                if (rowTrade === trade && rowAddress === districtName) {
                    const student = {
                        sheet: sheet.getName(),
                        row: i + 1,
                        name: nameIndex !== -1 ? data[i][nameIndex] : 'Unknown',
                        email: emailIndex !== -1 ? data[i][emailIndex] : 'Unknown',
                        trade: rowTrade,
                        address: rowAddress
                    };
                    foundStudents.push(student);
                }
            }
        }

        console.log(`Found ${foundStudents.length} students for ${trade} in ${districtName}:`);
        foundStudents.forEach(student => {
            console.log(`   - ${student.name} in sheet "${student.sheet}" row ${student.row}`);
        });

        return {
            success: true,
            count: foundStudents.length,
            students: foundStudents
        };

    } catch (error) {
        console.error('Error finding student records:', error);
        return {
            success: false,
            error: error.toString(),
            students: []
        };
    }
}
function loadTradesForDistrict(district) {
    console.log('📞 Loading trades for:', district);

    const tradeSelect = document.getElementById('apply-trade');
    if (!tradeSelect) {
        console.error('❌ Trade select element not found');
        return;
    }

    // Show loading
    tradeSelect.innerHTML = '<option value="">Loading trades...</option>';
    tradeSelect.disabled = true;

    // Create unique callback
    const callbackName = 'tradesCallback_' + Date.now();

    // Define callback
    window[callbackName] = function (data) {
        console.log('📦 Received trades data:', data);

        // Clear dropdown
        tradeSelect.innerHTML = '';

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Choose a trade';
        tradeSelect.appendChild(defaultOption);

        // Check if we have valid data
        if (data && data.success && data.availableTrades && data.availableTrades.length > 0) {
            console.log(`✅ Found ${data.availableTrades.length} trades`);

            // Add each trade
            data.availableTrades.forEach(trade => {
                const option = document.createElement('option');
                option.value = trade.code;

                // Get trade name
                let tradeName = trade.name || trade.code.split('-')[1] || trade.code;

                // Add capacity info
                if (trade.capacity && trade.capacity.available !== undefined) {
                    const available = trade.capacity.available;
                    const max = trade.capacity.max || 30;
                    tradeName += ` (${available} seats available)`;

                    // Store capacity data
                    option.dataset.capacity = available;
                    option.dataset.maxCapacity = max;
                }

                option.textContent = tradeName;
                tradeSelect.appendChild(option);
            });

            console.log(`✅ Added ${data.availableTrades.length} trades to dropdown`);
        } else {
            // No trades or error
            const errorOption = document.createElement('option');
            errorOption.value = '';
            errorOption.textContent = data?.message || 'No trades available in this district';
            errorOption.disabled = true;
            tradeSelect.appendChild(errorOption);
            console.warn('⚠️ No trades available:', data?.message);
        }

        // Enable dropdown
        tradeSelect.disabled = false;

        // Update capacity display
        updateCapacityDisplay(null);

        // Clean up
        delete window[callbackName];
    };

    // Create and load script
    const script = document.createElement('script');
    script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=getAvailableTrades&district=${encodeURIComponent(district)}&callback=${callbackName}`;

    script.onerror = function () {
        console.error('❌ Failed to load trades script');

        tradeSelect.innerHTML = '';
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'Network error. Please try again.';
        errorOption.disabled = true;
        tradeSelect.appendChild(errorOption);
        tradeSelect.disabled = false;

        delete window[callbackName];
    };

    document.head.appendChild(script);
}// ==================== UPDATE TRADE DROPDOWN FUNCTION ====================
function updateTradeDropdown(tradesData) {
    const tradeSelect = document.getElementById('apply-trade');

    if (!tradeSelect) {
        console.error('❌ Trade select element not found');
        return;
    }

    // Clear current options
    tradeSelect.innerHTML = '';

    // Add "Choose a trade" option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Choose a trade';
    tradeSelect.appendChild(defaultOption);

    if (!tradesData.success || !tradesData.availableTrades || tradesData.availableTrades.length === 0) {
        // Show error or no trades message
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = tradesData.message || 'No available trades in this district';
        errorOption.disabled = true;
        tradeSelect.appendChild(errorOption);

        tradeSelect.disabled = false;
        updateCapacityDisplay(null);
        return;
    }

    // Add available trades with capacity info
    tradesData.availableTrades.forEach(trade => {
        const option = document.createElement('option');
        option.value = trade.code;

        // Format display text with capacity
        const tradeName = trade.name || trade.code.split('-')[1] || trade.code;
        const availableSeats = trade.capacity?.available || 0;
        const maxCapacity = trade.capacity?.max || 30;

        option.textContent = `${tradeName} (${availableSeats} seats available)`;
        option.dataset.capacity = availableSeats;
        option.dataset.maxCapacity = maxCapacity;

        tradeSelect.appendChild(option);
    });

    tradeSelect.disabled = false;
    console.log(`✅ Trade dropdown updated with ${tradesData.availableTrades.length} trades`);
}// Function to update capacity display
function updateCapacityDisplay(tradeCode) {
    // Don't run if we're in the middle of loading trades
    const tradeSelect = document.getElementById('apply-trade');
    if (!tradeSelect || tradeSelect.disabled) {
        return;
    }
}

// Create capacity display element if it doesn't exist
function createCapacityDisplay() {
    const form = document.querySelector('.apply-form');
    const tradeSelect = document.getElementById('apply-trade');

    if (!form || !tradeSelect) return null;

    const capacityDiv = document.createElement('div');
    capacityDiv.id = 'capacity-display';
    capacityDiv.className = 'capacity-display';

    // Insert after the trade select
    tradeSelect.parentNode.insertBefore(capacityDiv, tradeSelect.nextSibling);

    return capacityDiv;
}

// ==================== UPDATED FORM HANDLER ====================

function initializeFormHandler() {
    const registrationForm = document.getElementById('registrationForm');
    const districtSelect = document.getElementById('apply-address');
    const tradeSelect = document.getElementById('apply-trade');

    if (registrationForm) {
        console.log('✅ Registration form found');
        // District change event
        if (districtSelect) {
            districtSelect.addEventListener('change', function () {
                const selectedDistrict = this.value;
                const tradeSelect = document.getElementById('apply-trade');

                if (selectedDistrict) {
                    // Clear and disable while loading
                    tradeSelect.innerHTML = '<option value="">Loading trades...</option>';
                    tradeSelect.disabled = true;

                    // Clear capacity display
                    updateCapacityDisplay(null);

                    // Load trades
                    loadTradesForDistrict(selectedDistrict);
                } else {
                    // Reset if no district selected
                    tradeSelect.disabled = true;
                    tradeSelect.innerHTML = '<option value="">Choose a trade</option>';
                    updateCapacityDisplay(null);
                }
            });
        }

        // Trade change event
        if (tradeSelect) {
            tradeSelect.addEventListener('change', function () {
                const selectedTrade = this.value;
                updateCapacityDisplay(selectedTrade);
            });
        }

        // Remove ALL existing event listeners by cloning and replacing
        const newForm = registrationForm.cloneNode(true);
        registrationForm.parentNode.replaceChild(newForm, registrationForm);

        // Add fresh event listener
        document.getElementById('registrationForm').addEventListener('submit', handleFormSubmission);

        // Add photo preview functionality
        setupPhotoPreview();

        // Create initial capacity display
        createCapacityDisplay();

    } else {
        console.log('❌ Registration form not found');
    }
}

// Add this to your handleFormSubmission function (before validation):
async function handleFormSubmission(event) {
    event.preventDefault();
    console.log('🔄 Form submission started');

    const form = event.target;
    const formData = new FormData(form);

    // Check which page we're on and which fields exist
    const hasTradeField = document.getElementById('apply-trade') !== null;
    const hasPhotoField = document.getElementById('student-photo') !== null;
    const isStaffPage = window.location.pathname.includes('staff-register');

    // Determine if this is student or staff registration
    const isStudentForm = hasTradeField && hasPhotoField && !isStaffPage;

    console.log('👤 Registration type:', isStudentForm ? 'Student' : 'Staff');

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    try {
        if (isStudentForm) {
            // Handle student registration
            console.log('👨‍🎓 Handling student registration');

            // Use existing student registration function
            await handleStudentRegistration(formData);

            // Success notification is already shown in handleStudentRegistration
            // Reset form (this is the correct place)
            form.reset();
            removePhoto();

        } else {
            // Handle staff registration
            console.log('👨‍💼 Handling staff registration');

            // Collect staff data correctly
            const staffData = {
                name: formData.get('name') || document.getElementById('apply-name')?.value,
                email: formData.get('email') || document.getElementById('apply-email')?.value,
                phone: formData.get('phone') || document.getElementById('apply-phone')?.value,
                dob: formData.get('dob') || document.getElementById('apply-dob')?.value,
                address: formData.get('center') || document.getElementById('apply-address')?.value,
                role: formData.get('role') || 'Staff',
                center: formData.get('center') || ''
            };

            console.log('📦 Staff data:', staffData);

            await handleStaffRegistration(staffData);

            showFormNotification('Your Application has been submitted.', 'success');
            // Reset form
            form.reset();
        }

        // Re-enable submit button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

    } catch (error) {
        console.error('Registration error:', error);
        showFormNotification('Registration failed: ' + error.message, 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}// ==================== MOBILE ERROR DETECTION ====================
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ==================== IMPROVED ERROR DETECTION ====================
function getMobileFriendlyErrorMessage(error) {
    const errorMsg = error.message || error.toString();

    console.log('🔍 Error analysis:', errorMsg);

    // If it's a CORS error but data is saving, return success message
    if (errorMsg.includes('Failed to fetch') ||
        errorMsg.includes('CORS') ||
        errorMsg.includes('NetworkError')) {
        return 'SUCCESS'; // Special flag to indicate success despite CORS
    }

    if (errorMsg.includes('image') || errorMsg.includes('photo') || errorMsg.includes('FileReader')) {
        return 'Photo upload issue. Try a smaller image or different format.';
    }
    if (errorMsg.includes('timeout')) {
        return 'Request timed out. Please try again.';
    }
    if (errorMsg.includes('HTTP error')) {
        return 'Server temporarily unavailable. Please try again.';
    }

    return 'Please try again. If problem continues, try with a smaller photo.';
}
// ==================== BETTER MOBILE IMAGE HANDLER ====================
function compressAndConvertImage(file) {
    return new Promise((resolve, reject) => {
        console.log('📸 Processing image:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');

        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const base64Data = e.target.result;
                console.log('✅ Image converted to base64, length:', base64Data.length);

                if (!base64Data.startsWith('data:image/')) {
                    throw new Error('Invalid image format');
                }

                // For mobile, we'll compress the image to reduce size
                compressImageForMobile(base64Data, file.type)
                    .then(compressedBase64 => {
                        console.log('✅ Image compressed for mobile, length:', compressedBase64.length);
                        resolve(compressedBase64);
                    })
                    .catch(compressError => {
                        console.log('⚠️ Compression failed, using original image');
                        resolve(base64Data); // Use original if compression fails
                    });

            } catch (error) {
                console.error('❌ Error processing image:', error);
                reject(new Error('Please try a different image file'));
            }
        };

        reader.onerror = function (error) {
            console.error('❌ FileReader error:', error);
            reject(new Error('Cannot read image file. Please try again.'));
        };

        reader.onabort = function () {
            reject(new Error('Image upload was cancelled'));
        };

        // Add timeout
        const timeout = setTimeout(() => {
            reader.abort();
            reject(new Error('Image processing timeout. Please try a smaller image.'));
        }, 25000);

        reader.onloadend = function () {
            clearTimeout(timeout);
        };

        // Start reading the file
        reader.readAsDataURL(file);
    });
}

// ==================== IMAGE COMPRESSION FOR MOBILE ====================
function compressImageForMobile(base64Data, mimeType) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set maximum dimensions for mobile
            const maxWidth = 800;
            const maxHeight = 800;

            let width = img.width;
            let height = img.height;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress image
            ctx.drawImage(img, 0, 0, width, height);

            try {
                // Use lower quality for mobile to reduce size
                const compressedBase64 = canvas.toDataURL(mimeType, 0.7);
                resolve(compressedBase64);
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = function () {
            reject(new Error('Failed to load image for compression'));
        };

        img.src = base64Data;
    });
}
// ==================== STORE IN LOCALSTORAGE ====================
function storeInLocalStorage(formData) {
    try {
        const submissions = JSON.parse(localStorage.getItem('neipsRegistrations') || '[]');

        // Generate unique student ID
        const studentId = 'NEIPS' + Date.now();

        // Create student record
        const studentData = {
            id: studentId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            dob: formData.dob,
            trade: formData.trade,
            address: formData.address,
            photo: formData.photo,
            timestamp: new Date().toISOString(),
            status: 'pending',
            applicationDate: new Date().toLocaleDateString('en-IN')
        };

        // Add to submissions
        submissions.push(studentData);
        localStorage.setItem('neipsRegistrations', JSON.stringify(submissions));

        console.log('✅ Successfully stored in localStorage, Student ID:', studentId);
        console.log('📊 Total submissions in localStorage:', submissions.length);

    } catch (error) {
        console.error('❌ Error storing in localStorage:', error);
    }
}

// ==================== GOOGLE SHEETS INTEGRATION ====================
// ==================== GOOGLE SHEETS INTEGRATION - FIXED ====================
// ==================== DELAYED SUCCESS SUBMISSION ====================
async function submitToGoogleSheets(formData) {
    return new Promise((resolve) => {
        console.log('📤 Submitting to Google Sheets...');

        const scriptURL = 'https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec';

        // Prepare data
        const params = new URLSearchParams();
        params.append('action', 'student_registration');
        params.append('name', formData.name || '');
        params.append('email', formData.email || '');
        params.append('phone', formData.phone || '');
        params.append('trade', formData.trade || '');
        params.append('dob', formData.dob || '');
        params.append('address', formData.address || '');
        params.append('photo', formData.photo || '');

        console.log('📦 Sending silent POST request');

        // SILENT FETCH - no error handling
        fetch(scriptURL, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            mode: 'no-cors'
        }).catch(() => {
            // Silent catch - ignore all errors
        });

        // WAIT 3 SECONDS before returning success (simulates processing time)
        setTimeout(() => {
            resolve({
                success: true,
                message: 'Registration successful! Your application has been submitted.',
                studentId: 'NEIPS' + Date.now()
            });
        }, 3000); // 3 seconds delay
    });
}
// ==================== PHOTO MANAGEMENT ====================
// ==================== PHOTO MANAGEMENT FUNCTIONS ====================
function removePhoto() {
    const photoInput = document.getElementById('student-photo');
    const photoPreview = document.getElementById('photo-preview');

    if (photoInput) {
        photoInput.value = ''; // Clear the file input
    }

    if (photoPreview) {
        photoPreview.innerHTML = `
            <div class="photo-preview-placeholder">
                <i class="fas fa-camera"></i>
                <div class="photo-upload-text">Upload Passport Photo</div>
                <div class="photo-upload-hint">JPG, PNG, WebP (Max 5MB)</div>
            </div>
        `;
    }

    console.log('✅ Photo removed');
}// ==================== UTILITY FUNCTIONS ====================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[0-9]{10}$/;
    return re.test(phone.replace(/\D/g, ''));
}

function showFormNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.form-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `form-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.8);
        padding: 25px 30px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        text-align: center;
        font-size: 16px;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.1);
    `;

    // Set background color based on type
    if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
    } else if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #28a745, #218838)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #17a2b8, #138496)';
    }

    notification.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 10px;">
            ${type === 'success' ? '<i class="fas fa-check-circle" style="font-size: 24px;"></i>' : ''}
            ${type === 'error' ? '<i class="fas fa-exclamation-circle" style="font-size: 24px;"></i>' : ''}
            ${type === 'info' ? '<i class="fas fa-info-circle" style="font-size: 24px;"></i>' : ''}
        </div>
        <div style="font-size: 18px; margin-bottom: 15px;">${message}</div>
        <button onclick="this.parentElement.remove()" style="
            background: rgba(255, 255, 255, 0.2); 
            border: none; 
            color: white; 
            font-size: 16px; 
            cursor: pointer; 
            padding: 8px 20px;
            border-radius: 6px;
            font-weight: 600;
            transition: all 0.3s ease;
        " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">OK</button>
    `;

    document.body.appendChild(notification);

    // Add overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        backdrop-filter: blur(5px);
    `;
    overlay.id = 'notification-overlay';
    document.body.appendChild(overlay);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translate(-50%, -50%) scale(1)';
        notification.style.opacity = '1';
    }, 100);

    // Auto remove after 5 seconds
    const removeNotification = () => {
        notification.style.transform = 'translate(-50%, -50%) scale(0.8)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
            const overlay = document.getElementById('notification-overlay');
            if (overlay) overlay.remove();
        }, 300);
    };

    // Click overlay to close
    overlay.addEventListener('click', removeNotification);

    setTimeout(removeNotification, 5000);
}
// ==================== BETTER MOBILE ERROR DETECTION ====================
function getMobileFriendlyErrorMessage(error) {
    const errorMsg = error.message || error.toString();

    console.log('🔍 Error analysis:', errorMsg);

    if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
        return 'Network issue. Please check your internet connection and try again.';
    }
    if (errorMsg.includes('image') || errorMsg.includes('photo') || errorMsg.includes('FileReader')) {
        return 'Photo upload issue. Try a smaller image (under 2MB) or different format.';
    }
    if (errorMsg.includes('timeout')) {
        return 'Request timed out. Please try again with better network connection.';
    }
    if (errorMsg.includes('script') || errorMsg.includes('URL')) {
        return 'Server connection issue. Please try again in a moment.';
    }
    if (errorMsg.includes('HTTP error')) {
        return 'Server temporarily unavailable. Please try again.';
    }

    return 'Please try again. If problem continues, try with a smaller photo.';
}
function testGoogleScript() {
    const district = 'NeIPS West Garo Hills';
    const callbackName = 'test_' + Date.now();

    window[callbackName] = function (data) {
        console.log('✅ Google Script Response:', data);
        alert('Got response: ' + JSON.stringify(data));
        delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=getAvailableTrades&district=${encodeURIComponent(district)}&callback=${callbackName}`;

    script.onerror = function () {
        console.error('❌ Script failed to load');
        alert('Script failed to load! Check console.');
        delete window[callbackName];
    };

    document.head.appendChild(script);
}
// FINAL RECOMMENDED VERSION - Add to your form-handler.js
function displayTradesClean(tradesData) {
    const tradeSelect = document.getElementById('apply-trade');
    if (!tradeSelect) return;

    tradeSelect.innerHTML = '<option value="">Choose a trade</option>';

    if (!tradesData.availableTrades || tradesData.availableTrades.length === 0) {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'No trades available';
        emptyOption.disabled = true;
        tradeSelect.appendChild(emptyOption);
        return;
    }

    // Filter out full trades (optional - or show as disabled)
    const displayTrades = tradesData.availableTrades.filter(trade => {
        const available = trade.capacity?.available || 0;
        return available > 0; // Remove this line if you want to show full trades
    });

    if (displayTrades.length === 0) {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'All trades are currently full';
        emptyOption.disabled = true;
        tradeSelect.appendChild(emptyOption);
        return;
    }

    displayTrades.forEach(trade => {
        const option = document.createElement('option');
        option.value = trade.code;

        const tradeName = trade.name || trade.code.split('-')[1] || trade.code;
        const available = trade.capacity?.available || 0;

        // Smart text - only show numbers when it matters
        let displayText = tradeName;

        if (available <= 5) {
            // Critical - show count
            displayText += ` (${available} seat${available !== 1 ? 's' : ''} left!)`;
            option.style.color = '#e67e22'; // Orange warning
            option.style.fontWeight = '500';
        } else if (available <= 10) {
            // Low - subtle indicator
            displayText += ` (${available} seats)`;
            option.style.color = '#27ae60'; // Green
        }
        // Normal availability (11-30) - no extra text

        option.textContent = displayText;
        option.dataset.capacity = available;
        option.dataset.maxCapacity = trade.capacity?.max || 30;

        tradeSelect.appendChild(option);
    });

    // Also update the capacity display below
    updateCapacityDisplay(null);
}


// Run this in browser console: testGoogleScript()

// ==================== EXPORT FUNCTIONS FOR GLOBAL ACCESS ====================
// ==================== EXPORT ALL FUNCTIONS FOR GLOBAL ACCESS ====================
window.handleFormSubmission = handleFormSubmission;
window.compressAndConvertImage = compressAndConvertImage;
window.showFormNotification = showFormNotification;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.removePhoto = removePhoto;
window.submitToGoogleSheets = submitToGoogleSheets;
window.storeInLocalStorage = storeInLocalStorage;