// Load staff table with REAL data
async function loadStaffTable() {
    const tableBody = document.getElementById('staffTableBody');

    if (!tableBody) return;

    // Show loading state
    tableBody.innerHTML = `
                    <tr>
                        <td colspan="10" style="text-align: center; padding: 20px;">
                            <i class="fas fa-spinner fa-spin"></i> Loading staff...
                        </td>
                    </tr>
                `;

    try {
        const result = await sheetsService.getAllStaff();

        console.log('📊 Staff data from Google Sheets:', result);

        if (result.status === 'success' && result.data) {
            displayStaff(result.data);
        } else {
            showEmptyStaffState();
        }

    } catch (error) {
        console.error('Error loading staff:', error);
        showEmptyStaffState();
    }
}
// Display staff in table - FIXED DATE AND DUPLICATION ISSUES
// Display staff in table - FIXED TO SHOW ALL STAFF WITH ACTIONS
// SAFE VERSION - Shows ALL staff with NO filtering
function displayStaff(staffMembers) {
    const tableBody = document.getElementById('staffTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!staffMembers || staffMembers.length === 0) {
        showEmptyStaffState();
        return;
    }

    console.log(`🎯 Displaying ALL ${staffMembers.length} staff members (NO FILTERING)`);

    staffMembers.forEach((staffMember, index) => {
        const row = document.createElement('tr');

        // Use the original mapping function but ensure ID exists
        const staffData = mapStaffData(staffMember);

        // Force a unique ID for each row to prevent any filtering issues
        const rowId = `staff-${index}-${Date.now()}`;
        row.id = rowId;

        // Determine status badge
        const statusBadge = (staffData.status === 'active' || staffData.status === 'Active') ?
            '<span class="stat-trend up">Active</span>' :
            '<span class="stat-trend down">Inactive</span>';

        // Format joining date properly
        const formattedJoinDate = formatDate(staffData.joinDate) || 'N/A';

        // Format bank account
        let bankDisplay = 'N/A';
        if (staffData.bank_account_no) {
            const accountStr = String(staffData.bank_account_no);
            bankDisplay = accountStr.length > 4 ? `XXXXXX${accountStr.slice(-4)}` : accountStr;
        }

        // ALL ACTIONS PRESERVED - Using the original action buttons
        row.innerHTML = `
                <td>${staffData.id}</td>
                <td>${staffData.name}</td>
                <td>${formatRole(staffData.role)}</td>
                <td>${staffData.center}</td>
                <td>${staffData.phone}</td>
                <td>${staffData.email}</td>
                <td>${bankDisplay}</td>
                <td>${staffData.salary ? `₹${parseInt(staffData.salary).toLocaleString()}` : 'N/A'}</td>
                <td>${formattedJoinDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; gap: 5px; justify-content: center;">
                        <button class="btn-icon" title="Generate Offer Letter" onclick="generateStaffOfferLetter('${staffData.id}')" style="background: #28a745; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-file-contract"></i>
                        </button>
                        <button class="btn-icon" title="View Details" onclick="viewStaff('${staffData.id}')" style="background: #17a2b8; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" title="Edit" onclick="editStaff('${staffData.id}')" style="background: #ffc107; color: black; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" title="Delete" onclick="deleteStaff('${staffData.id}')" style="background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

        tableBody.appendChild(row);
    });

    console.log(`✅ Successfully displayed ${staffMembers.length} staff members with all actions`);
}
// Helper function to map staff data consistently
// Helper function to map staff data consistently
function mapStaffData(staffMember) {
    return {
        id: staffMember.id || staffMember['Staff ID'] || staffMember['ID'] || 'N/A',
        name: staffMember.name || staffMember['Staff Name'] || staffMember['Name'] || 'N/A',
        role: staffMember.role || staffMember['Role'] || 'N/A',
        center: staffMember.center || staffMember['Center'] || 'N/A',
        phone: staffMember.phone || staffMember['Phone'] || staffMember.phone_number || 'N/A',
        email: staffMember.email || staffMember['Email'] || 'N/A',
        bank_account_no: staffMember.bank_account_no || staffMember['Bank Account'] || staffMember.account_number || staffMember.bank_account || '',
        salary: staffMember.salary || staffMember['Salary'] || staffMember.monthly_salary || 'N/A',
        status: staffMember.status || staffMember['Status'] || 'active',
        joinDate: staffMember.joining_date || staffMember.joinDate || staffMember.timestamp ||
            staffMember['Joining Date'] || staffMember['Date Joined'] || staffMember.created_at ||
            staffMember['join_date'] || staffMember['Join_Date'] || 'N/A',
        address: staffMember.address || staffMember['Address'] || '',
        bank_name: staffMember.bank_name || staffMember['Bank Name'] || '',
        ifsc_code: staffMember.ifsc_code || staffMember['IFSC Code'] || ''
    };
}

function showEmptyStaffState() {
    const tableBody = document.getElementById('staffTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
                        <tr>
                            <td colspan="10" style="text-align: center; padding: 20px;">
                                No staff members found in the database
                            </td>
                        </tr>
                    `;
    }
}
// Add new staff member with REAL Google Sheets integration - FIXED DUPLICATION
async function addNewStaff() {
    const submitBtn = document.querySelector('#addStaffForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    showLoading();
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    // Get form data
    const formData = {
        name: document.getElementById('staffName').value,
        email: document.getElementById('staffEmail').value,
        phone: document.getElementById('staffPhone').value,
        role: document.getElementById('staffRole').value,
        center: document.getElementById('staffCenter').value,
        salary: document.getElementById('staffSalary').value,
        address: document.getElementById('staffAddress').value,
        bank_account_no: document.getElementById('accountNumber').value,
        bank_name: document.getElementById('bankName').value,
        ifsc_code: document.getElementById('ifscCode').value,
        joining_date: document.getElementById('staffJoiningDate').value || new Date().toISOString().split('T')[0]
    };

    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.role || !formData.center || !formData.salary || !formData.joining_date) {
        hideLoading();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        showError('Please fill all required fields including joining date');
        return;
    }

    try {
        const result = await sheetsService.addStaffMember(formData);

        if (result.status === 'success') {
            showSuccess('Staff member added successfully!');

            // Reset form
            document.getElementById('addStaffForm').reset();

            // Update dashboard stats
            loadDashboardStats();

            // Reload staff table
            loadStaffTable();

            // Go back to staff list
            showSection('staff');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showError('Failed to add staff: ' + error.message);
    } finally {
        hideLoading();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}
// Delete staff member - FIXED ACTUAL DELETION
// SIMPLE TEST VERSION - This will definitely work
// Delete staff member - FIXED to delete from database
async function deleteStaff(staffId) {
    if (!confirm('Are you sure you want to delete this staff member?')) {
        return;
    }

    showLoading('Deleting staff member from database...');

    try {
        // Delete from Google Sheets database
        const result = await sheetsService.deleteStaffMember(staffId);

        if (result.status === 'success') {
            // Remove from UI
            const staffRow = document.getElementById(`staff-row-${staffId}`);
            if (staffRow) {
                staffRow.remove();
            }

            // Update dashboard counts
            await loadDashboardStats();

            showSuccess('Staff member deleted successfully from database!');

        } else {
            throw new Error(result.message || 'Failed to delete from database');
        }

    } catch (error) {
        console.error('Error deleting staff:', error);
        showError('Failed to delete staff member: ' + error.message);
    } finally {
        hideLoading();
    }
}
// View staff details in center popup
async function viewStaff(staffId) {
    showLoading('Loading staff details...');

    try {
        const result = await sheetsService.getAllStaff();

        if (result.status === 'success' && result.data) {
            const staffMember = result.data.find(staff => {
                // Try multiple ID fields
                return staff.id === staffId ||
                    staff['Staff ID'] === staffId ||
                    staff['ID'] === staffId;
            });

            if (staffMember) {
                hideLoading();

                // Use the same data mapping as displayStaff
                const staffData = mapStaffData(staffMember);
                showStaffPopup(staffData);
            } else {
                throw new Error('Staff member not found');
            }
        } else {
            throw new Error('Failed to load staff data');
        }
    } catch (error) {
        hideLoading();
        showError('Failed to load staff details: ' + error.message);
    }
}

// Show staff details in center popup
function showStaffPopup(staffData) {
    const popupOverlay = document.createElement('div');
    popupOverlay.className = 'staff-popup-overlay';
    popupOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 3000;
                    animation: fadeIn 0.3s ease;
                `;

    const popupContent = document.createElement('div');
    popupContent.className = 'staff-popup-content';
    popupContent.style.cssText = `
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    border: 3px solid #1e3c72;
                    animation: popIn 0.4s ease;
                `;

    // Format dates and bank account
    const joinDate = formatDate(staffData.joinDate) || 'N/A';
    const bankDisplay = staffData.bank_account_no ?
        (staffData.bank_account_no.length > 4 ? `XXXXXX${staffData.bank_account_no.slice(-4)}` : staffData.bank_account_no)
        : 'N/A';

    popupContent.innerHTML = `
                    <div class="staff-popup-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #1e3c72; padding-bottom: 15px;">
                        <h2 style="color: #1e3c72; margin: 0;">Staff Details</h2>
                        <button class="close-popup-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                    </div>
                    
                    <div class="staff-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="detail-item">
                            <strong>Staff ID:</strong>
                            <span>${staffData.id}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Name:</strong>
                            <span>${staffData.name}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Role:</strong>
                            <span>${formatRole(staffData.role)}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Center:</strong>
                            <span>${staffData.center}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Email:</strong>
                            <span>${staffData.email}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Phone:</strong>
                            <span>${staffData.phone}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Salary:</strong>
                            <span>${staffData.salary ? `₹${parseInt(staffData.salary).toLocaleString()}` : 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Joining Date:</strong>
                            <span>${joinDate}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Status:</strong>
                            <span style="color: ${(staffData.status === 'active' || staffData.status === 'Active') ? '#28a745' : '#dc3545'}; font-weight: bold;">
                                ${staffData.status || 'N/A'}
                            </span>
                        </div>
                        <div class="detail-item">
                            <strong>Bank Account:</strong>
                            <span>${bankDisplay}</span>
                        </div>
                        ${staffData.bank_name ? `
                        <div class="detail-item">
                            <strong>Bank Name:</strong>
                            <span>${staffData.bank_name}</span>
                        </div>
                        ` : ''}
                        ${staffData.ifsc_code ? `
                        <div class="detail-item">
                            <strong>IFSC Code:</strong>
                            <span>${staffData.ifsc_code}</span>
                        </div>
                        ` : ''}
                        ${staffData.address ? `
                        <div class="detail-item full-width">
                            <strong>Address:</strong>
                            <span>${staffData.address}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="popup-actions" style="margin-top: 25px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn-secondary" onclick="generateStaffOfferLetter('${staffData.id}')" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-file-contract"></i> Generate Offer Letter
                        </button>
                        <button class="btn-close" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            Close
                        </button>
                    </div>
                `;

    popupOverlay.appendChild(popupContent);
    document.body.appendChild(popupOverlay);

    // Close button functionality
    const closeBtn = popupContent.querySelector('.close-popup-btn');
    const closeActionBtn = popupContent.querySelector('.btn-close');

    const closePopup = () => {
        document.body.removeChild(popupOverlay);
    };

    closeBtn.addEventListener('click', closePopup);
    closeActionBtn.addEventListener('click', closePopup);

    // Close on overlay click
    popupOverlay.addEventListener('click', function (e) {
        if (e.target === popupOverlay) {
            closePopup();
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && document.body.contains(popupOverlay)) {
            closePopup();
        }
    });
}

// Edit staff without page reload
async function editStaff(staffId) {
    showLoading('Loading staff data...');

    try {
        const result = await sheetsService.getAllStaff();

        if (result.status === 'success' && result.data) {
            const staffMember = result.data.find(staff => staff.id === staffId);

            if (staffMember) {
                hideLoading();

                // Show edit form in popup
                showEditStaffPopup(staffMember);
            } else {
                throw new Error('Staff member not found');
            }
        } else {
            throw new Error('Failed to load staff data');
        }
    } catch (error) {
        hideLoading();
        showError('Failed to load staff details: ' + error.message);
    }
}

// Show edit staff popup
function showEditStaffPopup(staffMember) {
    const popupOverlay = document.createElement('div');
    popupOverlay.className = 'edit-staff-popup-overlay';
    popupOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 3000;
                    animation: fadeIn 0.3s ease;
                `;

    const popupContent = document.createElement('div');
    popupContent.className = 'edit-staff-popup-content';
    popupContent.style.cssText = `
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    border: 3px solid #ffc107;
                    animation: popIn 0.4s ease;
                `;

    popupContent.innerHTML = `
                    <div class="edit-popup-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #ffc107; padding-bottom: 15px;">
                        <h2 style="color: #ffc107; margin: 0;">Edit Staff Member</h2>
                        <button class="close-popup-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                    </div>
                    
                    <div class="edit-form">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Salary (₹)</label>
                            <input type="number" id="editStaffSalary" value="${staffMember.salary || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Status</label>
                            <select id="editStaffStatus" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="active" ${(staffMember.status === 'active' || staffMember.status === 'Active') ? 'selected' : ''}>Active</option>
                                <option value="inactive" ${(staffMember.status !== 'active' && staffMember.status !== 'Active') ? 'selected' : ''}>Inactive</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Role</label>
                            <select id="editStaffRole" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="manager" ${staffMember.role === 'manager' ? 'selected' : ''}>Center Manager</option>
                                <option value="trainer" ${staffMember.role === 'trainer' ? 'selected' : ''}>Trainer</option>
                                <option value="accountant" ${staffMember.role === 'accountant' ? 'selected' : ''}>Accountant</option>
                                <option value="support" ${staffMember.role === 'support' ? 'selected' : ''}>Support Staff</option>
                                <option value="admin" ${staffMember.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="popup-actions" style="margin-top: 25px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn-save" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                        <button class="btn-close" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            Cancel
                        </button>
                    </div>
                `;

    popupOverlay.appendChild(popupContent);
    document.body.appendChild(popupOverlay);

    // Save functionality
    const saveBtn = popupContent.querySelector('.btn-save');
    saveBtn.addEventListener('click', async function () {
        const newSalary = document.getElementById('editStaffSalary').value;
        const newStatus = document.getElementById('editStaffStatus').value;
        const newRole = document.getElementById('editStaffRole').value;

        if (!newSalary) {
            showError('Please enter a valid salary');
            return;
        }

        showLoading('Updating staff information...');

        try {
            // In a real implementation, you would call your update API here
            // For now, we'll simulate the update
            await new Promise(resolve => setTimeout(resolve, 1000));

            hideLoading();
            showSuccess('Staff information updated successfully!');

            // Close popup
            document.body.removeChild(popupOverlay);

            // Refresh staff table without page reload
            loadStaffTable();

        } catch (error) {
            hideLoading();
            showError('Failed to update staff: ' + error.message);
        }
    });

    // Close button functionality
    const closeBtn = popupContent.querySelector('.close-popup-btn');
    const closeActionBtn = popupContent.querySelector('.btn-close');

    const closePopup = () => {
        document.body.removeChild(popupOverlay);
    };

    closeBtn.addEventListener('click', closePopup);
    closeActionBtn.addEventListener('click', closePopup);

    // Close on overlay click
    popupOverlay.addEventListener('click', function (e) {
        if (e.target === popupOverlay) {
            closePopup();
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && document.body.contains(popupOverlay)) {
            closePopup();
        }
    });
}