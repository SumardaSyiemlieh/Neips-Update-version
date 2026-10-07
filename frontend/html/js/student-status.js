// Student status check functionality
document.addEventListener('DOMContentLoaded', function () {
    const checkStatusBtn = document.getElementById('checkStatusBtn');
    if (checkStatusBtn) {
        checkStatusBtn.addEventListener('click', checkStudentStatus);
    }

    // Allow Enter key to trigger status check
    const studentEmailInput = document.getElementById('student-email');
    if (studentEmailInput) {
        studentEmailInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                checkStudentStatus();
            }
        });
    }
});
async function checkStudentStatus() {
    const email = document.getElementById('student-email').value.trim();
    const resultDiv = document.getElementById('student-status-result');

    if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
    }

    const checkBtn = document.getElementById('checkStatusBtn');
    const originalText = checkBtn.innerHTML;

    // Show loading state
    checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    checkBtn.disabled = true;

    try {
        const response = await fetch(`/api/students/email/${encodeURIComponent(email)}`);

        // Check if response is OK
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            displayStudentStatus(result.student);
        } else {
            resultDiv.innerHTML = `
                <div class="status-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Application Not Found</h3>
                    <p>No application found with email: ${email}</p>
                    <p>Please check your email or register first.</p>
                </div>
            `;
            resultDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('❌ Status check error:', error);
        resultDiv.innerHTML = `
            <div class="status-error">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Service Temporarily Unavailable</h3>
                <p>Unable to check status at the moment.</p>
                <p>Please try again later or contact administration.</p>
                <small>Error: ${error.message}</small>
            </div>
        `;
        resultDiv.style.display = 'block';
    } finally {
        // Reset button state
        checkBtn.innerHTML = originalText;
        checkBtn.disabled = false;
    }
}

function displayStudentStatus(student) {
    const resultDiv = document.getElementById('student-status-result');

    const statusHtml = `
        <div class="status-card status-${student.Status?.toLowerCase() || 'pending'}">
            <div class="status-header">
                <h3>Application Status: ${student.Status || 'Pending'}</h3>
                <span class="status-badge">${student.Status || 'Pending'}</span>
            </div>
            
            <div class="student-info-grid">
                <div class="info-item">
                    <label>Name:</label>
                    <span>${student.Name}</span>
                </div>
                <div class="info-item">
                    <label>Email:</label>
                    <span>${student.Email}</span>
                </div>
                <div class="info-item">
                    <label>Phone:</label>
                    <span>${student.Phone}</span>
                </div>
                <div class="info-item">
                    <label>Course:</label>
                    <span>${student.Course}</span>
                </div>
                <div class="info-item">
                    <label>Project:</label>
                    <span>${student.Project || 'Not Assigned'}</span>
                </div>
                ${student['ID Card Number'] ? `
                <div class="info-item">
                    <label>ID Card Number:</label>
                    <span>${student['ID Card Number']}</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <label>Registration Date:</label>
                    <span>${formatDate(student.Timestamp)}</span>
                </div>
            </div>
            
            ${student.Status === 'Approved' ? `
            <div class="status-actions">
                <button class="download-id-btn" onclick="generateStudentIDCard('${student.UniqueID}')">
                    <i class="fas fa-download"></i> Download ID Card
                </button>
            </div>
            ` : ''}
            
            ${student.Status === 'Rejected' && student['Rejection Reason'] ? `
            <div class="rejection-reason">
                <h4>Reason for Rejection:</h4>
                <p>${student['Rejection Reason']}</p>
            </div>
            ` : ''}
        </div>
    `;

    resultDiv.innerHTML = statusHtml;
    resultDiv.style.display = 'block';
}

function generateStudentIDCard(studentId) {
    // This will use the generateIDCard function from admin.js
    // For students, we need to fetch the student data first
    fetch(`YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL?action=getStudentById&id=${studentId}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Call the admin.js function to generate ID card
                if (typeof generateIDCard === 'function') {
                    generateIDCard(studentId, true);
                }
            } else {
                showNotification('Error generating ID card', 'error');
            }
        })
        .catch(error => {
            showNotification('Error: ' + error.message, 'error');
        });
}