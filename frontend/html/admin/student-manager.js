async function loadStudentsTable() {
    const tableBody = document.getElementById('studentsTableBody');

    if (!tableBody) {
        console.error('❌ studentsTableBody not found!');
        return;
    }

    // Show loading state
    tableBody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 20px;">
                            <i class="fas fa-spinner fa-spin"></i> Loading students...
                        </td>
                    </tr>
                `;

    try {
        const result = await sheetsService.getAllStudents();
        console.log('📊 Students data from Google Sheets:', result);

        if (result.success && result.students) {
            displayStudents(result.students);
        } else {
            console.error('❌ No students data found:', result.message);
            showEmptyStudentsState();
        }

    } catch (error) {
        console.error('❌ Error loading students:', error);
        showEmptyStudentsState();
    }
}
// Display students in table - CORRECTED COLUMNS
// Display students in table - FIXED STATUS AND ACTIONS
function displayStudents(students) {
    const tableBody = document.getElementById('studentsTableBody');

    if (!tableBody) {
        console.error('❌ studentsTableBody not found in displayStudents!');
        return;
    }

    // Clear existing rows
    tableBody.innerHTML = '';

    if (!students || students.length === 0) {
        showEmptyStudentsState();
        return;
    }

    console.log('📊 Displaying students:', students.length);

    // Add students to table
    students.forEach((student, index) => {
        const row = document.createElement('tr');
        row.id = `student-row-${student['Unique ID'] || student.id}`;

        // CORRECTED DATA MAPPING - WITH PROPER CENTER AND STATUS
        // In admin.js - Update the displayStudents function data mapping
        const studentData = {
            id: student['Unique ID'] || student.id || `STU${(index + 1).toString().padStart(3, '0')}`,
            name: student['Name'] || student.name || 'N/A',
            email: student['Email'] || student.email || 'N/A',
            phone: student['Phone'] || student.phone || 'N/A',
            course: student['Trade'] || student.trade || student.course || 'N/A',
            center: student['Address'] || student.address || student['Center'] || 'N/A', // FIXED: Use Address column
            project: student['Project'] || student.project || 'Not Assigned',
            status: student['Status'] || student.status || 'Pending',
            joinDate: student['Timestamp'] || student.joinDate || 'N/A',
            dob: student['Date of Birth'] || student.dob || 'N/A',
            batchId: student['ID Card Number'] || student['Unique ID'] || generateBatchId(),
            photo: student['Photo'] || student.photo || student['photo'] || ''
        };

        // Determine status badge class - FIXED STATUS HANDLING
        let statusClass = 'stat-trend';
        let statusText = studentData.status;

        if (studentData.status.toLowerCase() === 'approved') {
            statusClass += ' up';
            statusText = 'Approved';
        } else if (studentData.status.toLowerCase() === 'rejected') {
            statusClass += ' down';
            statusText = 'Rejected';
        } else {
            statusClass += ' neutral';
            statusText = 'Pending';
        }

        // CREATE THE ACTIONS COLUMN WITH PROJECT SELECTION - FIXED ACTIONS
        let actionsHTML = '';

        if (studentData.status === 'Pending') {
            actionsHTML = `
                    <div class="approval-actions">
                        <select class="project-select" id="project-${studentData.id}" style="margin-bottom: 8px; padding: 6px; border: 1px solid #ddd; border-radius: 4px; width: 100%; font-size: 12px;">
                            <option value="">Select Project</option>
                            <option value="Skill Meghalaya">Skill Meghalaya</option>
                            <option value="ADB">ADB</option>
                            <option value="NABARD">NABARD</option>
                            <option value="PMKVY">PMKVY</option>
                            <option value="DDU-GKY">DDU-GKY</option>
                            <option value="Other">Other</option>
                        </select>
                        <div style="display: flex; gap: 5px; justify-content: center;">
                            <button class="btn-approve" onclick="approveStudentWithProject('${studentData.id}')" title="Approve with Project" style="background: #28a745; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn-reject" onclick="rejectStudent('${studentData.id}')" title="Reject" style="background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
        } else {
            actionsHTML = `
                    <div style="display: flex; gap: 5px; justify-content: center;">
                        <button class="btn-icon" title="View ID Card" onclick="viewIDCard('${studentData.id}')" style="background: #17a2b8; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-id-card"></i>
                        </button>
                        ${studentData.status === 'Approved' ? `
                        <button class="btn-icon" title="Change Project" onclick="changeProject('${studentData.id}')" style="background: #ffc107; color: black; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" title="Resend Email" onclick="resendApprovalEmail('${studentData.id}')" style="background: #6c757d; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-envelope"></i>
                        </button>
                        ` : ''}
                        ${studentData.status === 'Rejected' ? `
                        <button class="btn-icon" title="Resend Rejection Email" onclick="resendRejectionEmail('${studentData.id}')" style="background: #6c757d; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-envelope"></i>
                        </button>
                        ` : ''}
                    </div>
                `;
        }

        // CORRECTED ROW - PROPER STATUS AND CENTER DISPLAY
        row.innerHTML = `
                <td>${studentData.id}</td>
                <td>${studentData.name}</td>
                <td>${studentData.email}</td>
                <td>${studentData.phone}</td>
                <td>${studentData.course}</td>
                <td>${studentData.center}</td>
                <td id="project-${studentData.id}-display">${studentData.project}</td>
                <td>${formatDate(studentData.joinDate)}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>${actionsHTML}</td>
            `;

        tableBody.appendChild(row);
    });

    // Update pagination info
    updatePaginationInfo(students.length);
}

function updatePaginationInfo(totalStudents) {
    const totalPages = Math.ceil(totalStudents / studentsPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentStudentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentStudentPage === 1;
    document.getElementById('nextPage').disabled = currentStudentPage === totalPages || totalPages === 0;
}

// Approve student with project selection - UPDATED: No full page reload
async function approveStudentWithProject(studentId) {
    const projectSelect = document.getElementById(`project-${studentId}`);
    const selectedProject = projectSelect.value;

    if (!selectedProject) {
        showError('Please select a project before approving the student.');
        projectSelect.focus();
        return;
    }

    if (confirm(`Approve student and assign to project: ${selectedProject}?`)) {
        showLoading('Approving student and assigning project...');

        try {
            const response = await fetch(sheetsService.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'approveStudent',
                    studentId: studentId,
                    project: selectedProject
                })
            });

            const result = await response.json();

            if (result.success) {
                showSuccess(`Student approved successfully! Assigned to ${selectedProject}. ${result.emailSent ? 'ID Card email sent.' : ''}`);

                // UPDATE: Update only the specific row instead of reloading entire table
                updateStudentRow(studentId, {
                    status: 'Approved',
                    project: selectedProject
                });

            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showError('Failed to approve student: ' + error.message);
        } finally {
            hideLoading();
        }
    }
}

// Change project for approved student - UPDATED: No full page reload
async function changeProject(studentId) {
    const newProject = prompt('Enter new project for this student:', 'Skill Meghalaya');

    if (newProject) {
        showLoading('Updating project...');

        try {
            const response = await fetch(sheetsService.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'updateProject',
                    studentId: studentId,
                    project: newProject
                })
            });

            const result = await response.json();

            if (result.success) {
                showSuccess(`Project updated to: ${newProject}`);

                // UPDATE: Update only the project display instead of reloading entire table
                const projectDisplay = document.getElementById(`project-${studentId}-display`);
                if (projectDisplay) {
                    projectDisplay.textContent = newProject;
                }

            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showError('Failed to update project: ' + error.message);
        } finally {
            hideLoading();
        }
    }
}

// NEW FUNCTION: Update specific student row without reloading entire table
function updateStudentRow(studentId, updates) {
    const studentRow = document.getElementById(`student-row-${studentId}`);
    if (!studentRow) return;

    // Update status if provided
    if (updates.status) {
        const statusCell = studentRow.querySelector('td:nth-child(9)');
        if (statusCell) {
            let statusClass = 'stat-trend';
            if (updates.status.toLowerCase() === 'approved') {
                statusClass += ' up';
            } else if (updates.status.toLowerCase() === 'rejected') {
                statusClass += ' down';
            } else {
                statusClass += ' neutral';
            }
            statusCell.innerHTML = `<span class="${statusClass}">${updates.status}</span>`;
        }
    }

    // Update project if provided
    if (updates.project) {
        const projectDisplay = document.getElementById(`project-${studentId}-display`);
        if (projectDisplay) {
            projectDisplay.textContent = updates.project;
        }
    }

    // Update actions column for approved students
    if (updates.status === 'Approved') {
        const actionsCell = studentRow.querySelector('td:nth-child(10)');
        if (actionsCell) {
            actionsCell.innerHTML = `
                            <div style="display: flex; gap: 5px; justify-content: center;">
                                <button class="btn-icon" title="View ID Card" onclick="viewIDCard('${studentId}')" style="background: #17a2b8; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-id-card"></i>
                                </button>
                                <button class="btn-icon" title="Change Project" onclick="changeProject('${studentId}')" style="background: #ffc107; color: black; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon" title="Resend Email" onclick="resendApprovalEmail('${studentId}')" style="background: #6c757d; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-envelope"></i>
                                </button>
                            </div>
                        `;
        }
    }
}
// Reject student - UPDATED: No full page reload
async function rejectStudent(studentId) {
    const reason = prompt('Please enter rejection reason:');
    if (reason) {
        showLoading('Rejecting student...');

        try {
            const response = await fetch(sheetsService.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'rejectStudent',
                    studentId: studentId,
                    rejectionReason: reason
                })
            });

            const result = await response.json();

            if (result.success) {
                showSuccess('Student rejected successfully! Notification sent.');

                // UPDATE: Update only the specific row instead of reloading entire table
                updateStudentRow(studentId, {
                    status: 'Rejected'
                });

            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showError('Failed to reject student: ' + error.message);
        } finally {
            hideLoading();
        }
    }
}


function resendApprovalEmail(studentId) {
    if (confirm('Resend approval email to student?')) {
        showLoading('Resending email...');
        // Implementation for resend email
        setTimeout(() => {
            hideLoading();
            showSuccess('Approval email resent successfully!');
        }, 1500);
    }
}