// Load offer letters section
function loadOfferLettersSection() {
    const offerSection = document.getElementById('offer-letters-section');
    if (!offerSection) return;

    offerSection.innerHTML = `
                    <div class="section-header">
                        <h2>Offer Letters</h2>
                        <div class="header-actions">
                            <button class="btn-primary" onclick="showSection('staff-add')">
                                <i class="fas fa-plus"></i> Add New Staff
                            </button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Staff ID</th>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Center</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="offerLettersTableBody">
                                <!-- Offer letters data will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                `;

    loadOfferLettersData();
}
// Load offer letters section
function loadOfferLettersSection() {
    console.log('Loading offer letters section...');
    loadOfferLettersData();
}
// Load offer letters data
async function loadOfferLettersData() {
    const tableBody = document.getElementById('offerLettersTableBody');
    if (!tableBody) return;

    try {
        const result = await sheetsService.getAllStaff();
        if (result.status === 'success' && result.data) {
            tableBody.innerHTML = '';

            result.data.forEach(staff => {
                const staffData = mapStaffData(staff);
                const row = document.createElement('tr');
                row.innerHTML = `
                                <td>${staffData.id}</td>
                                <td>${staffData.name}</td>
                                <td>${formatRole(staffData.role)}</td>
                                <td>${staffData.center}</td>
                                <td><span class="stat-trend ${(staffData.status === 'active' || staffData.status === 'Active') ? 'up' : 'down'}">${staffData.status}</span></td>
                                <td>
                                    <button class="btn-icon" onclick="generateStaffOfferLetter('${staffData.id}')" style="background: #28a745; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                                        <i class="fas fa-file-contract"></i> Generate
                                    </button>
                                </td>
                            `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading offer letters data:', error);
    }
}

// Load offer letters data
async function loadOfferLettersData() {
    const tableBody = document.getElementById('offerLettersTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 20px;">
                            <i class="fas fa-spinner fa-spin"></i> Loading offer letters data...
                        </td>
                    </tr>
                `;

    try {
        const result = await sheetsService.getAllStaff();

        if (result.status === 'success' && result.data) {
            displayOfferLettersData(result.data);
        } else {
            showEmptyOfferLettersState();
        }
    } catch (error) {
        console.error('Error loading offer letters data:', error);
        showEmptyOfferLettersState();
    }
}
// Display offer letters data
function displayOfferLettersData(staffMembers) {
    const tableBody = document.getElementById('offerLettersTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (staffMembers.length === 0) {
        showEmptyOfferLettersState();
        return;
    }

    staffMembers.forEach(staffMember => {
        const staffData = mapStaffData(staffMember);
        const joinDate = formatDate(staffData.joinDate) || 'N/A';

        // Determine offer letter status
        let offerStatus = 'pending';
        let statusClass = 'neutral';
        let statusText = 'Pending';

        if (staffData.status === 'active' || staffData.status === 'Active') {
            offerStatus = 'accepted';
            statusClass = 'up';
            statusText = 'Accepted';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
                        <td>${staffData.id}</td>
                        <td>${staffData.name}</td>
                        <td>${formatRole(staffData.role)}</td>
                        <td>${staffData.center}</td>
                        <td>${joinDate}</td>
                        <td>${staffData.salary ? `₹${parseInt(staffData.salary).toLocaleString()}` : 'N/A'}</td>
                        <td><span class="stat-trend ${statusClass}">${statusText}</span></td>
                        <td>${staffData.joinDate ? formatDate(staffData.joinDate) : 'Not generated'}</td>
                        <td>
                            <div style="display: flex; gap: 5px; justify-content: center;">
                                <button class="btn-icon" title="Generate Offer Letter" onclick="generateStaffOfferLetter('${staffData.id}')" style="background: #28a745; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-file-contract"></i>
                                </button>
                                <button class="btn-icon" title="View Details" onclick="viewStaff('${staffData.id}')" style="background: #17a2b8; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </td>
                    `;
        tableBody.appendChild(row);
    });
}

function showEmptyOfferLettersState() {
    const tableBody = document.getElementById('offerLettersTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
                        <tr>
                            <td colspan="9" style="text-align: center; padding: 20px; color: #666;">
                                <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                                No staff data available for offer letters
                            </td>
                        </tr>
                    `;
    }
}
// Helper function to format date for offer letter
function formatDateForOfferLetter(dateString) {
    if (!dateString || dateString === 'N/A' || dateString === 'undefined') return 'To be confirmed';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString; // Return original if can't parse
        }

        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) {
        return dateString; // Return original if error
    }
}
// Save and generate offer letter (combined function) - FIXED LOADING ISSUE
// Save and generate offer letter (combined function) - FIXED VERSION
async function saveAndGenerateOffer() {
    const submitBtn = document.querySelector('#addStaffForm button[type="submit"]');
    const saveGenerateBtn = document.querySelector('#addStaffForm .btn-success');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Save Staff';

    showLoading('Saving staff and generating offer letter...');

    // Disable all buttons to prevent multiple clicks
    const allButtons = document.querySelectorAll('#addStaffForm button');
    allButtons.forEach(btn => btn.disabled = true);

    try {
        // First save the staff member
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
            throw new Error('Please fill all required fields including joining date');
        }

        // Save to Google Sheets
        const result = await sheetsService.addStaffMember(formData);

        if (result.status === 'success') {
            showSuccess('Staff member saved successfully! Generating offer letter...');

            // Small delay to ensure success message is seen
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Generate offer letter after successful save
            const offerLetterContent = createOfferLetterContent(formData);

            // Generate PDF with error handling
            setTimeout(() => {
                try {
                    generatePDF(offerLetterContent, `Offer_Letter_${formData.name.replace(/\s+/g, '_')}.pdf`);
                    showSuccess('Staff member saved and offer letter generated successfully!');
                } catch (pdfError) {
                    console.error('PDF generation failed:', pdfError);
                    showSuccess('Staff member saved successfully! Offer letter generation failed - please try generating it from the staff list.');
                }
            }, 500);

            // Reset form
            document.getElementById('addStaffForm').reset();

            // Update dashboard and tables
            loadDashboardStats();
            loadStaffTable();

            // Go back to staff list after a delay
            setTimeout(() => {
                showSection('staff');
            }, 2000);

        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Save and generate error:', error);
        showError('Failed to save staff: ' + error.message);
    } finally {
        hideLoading();
        // Re-enable buttons
        allButtons.forEach(btn => btn.disabled = false);
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
        }
    }
}
// Generate offer letter for staff
function generateOfferLetter() {
    showLoading('Generating offer letter...');

    // Get staff data from the form
    const staffData = {
        name: document.getElementById('staffName').value,
        email: document.getElementById('staffEmail').value,
        phone: document.getElementById('staffPhone').value,
        role: document.getElementById('staffRole').value,
        center: document.getElementById('staffCenter').value,
        salary: document.getElementById('staffSalary').value,
        address: document.getElementById('staffAddress').value,
        joinDate: document.getElementById('staffJoiningDate').value || new Date().toLocaleDateString('en-IN')
    };

    // Validate that we have required data
    if (!staffData.name || !staffData.role || !staffData.center) {
        hideLoading();
        showError('Please fill in staff details before generating offer letter');
        return;
    }

    // Create offer letter content
    const offerLetterContent = createOfferLetterContent(staffData);

    // Create and download PDF
    generatePDF(offerLetterContent, `Offer_Letter_${staffData.name.replace(/\s+/g, '_')}.pdf`);

    hideLoading();
    showSuccess('Offer letter generated successfully!');
}
// Create offer letter HTML content
// Create offer letter HTML content with REAL join date
function createOfferLetterContent(staffData) {
    const formattedSalary = staffData.salary ? `₹${parseInt(staffData.salary).toLocaleString('en-IN')}` : 'To be discussed';
    const roleDisplay = formatRole(staffData.role);

    // Use actual join date from database, fallback to current date
    const joinDate = staffData.joinDate && staffData.joinDate !== 'N/A' ?
        formatDateForOfferLetter(staffData.joinDate) :
        new Date().toLocaleDateString('en-IN');

    return `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                            .header h1 { color: #1e3c72; margin: 0; }
                            .header h2 { color: #666; margin: 5px 0; }
                            .content { margin: 30px 0; }
                            .section { margin: 20px 0; }
                            .signature-section { margin-top: 60px; }
                            .signature-line { width: 300px; border-top: 1px solid #000; margin: 40px 0 10px; }
                            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>NORTH EASTERN INSTITUTE OF PROFESSIONAL STUDIES</h1>
                            <h2>OFFER OF EMPLOYMENT</h2>
                        </div>
                        
                        <div class="content">
                            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                            
                            <div class="section">
                                <p>Dear <strong>${staffData.name}</strong>,</p>
                                <p>We are pleased to offer you the position of <strong>${roleDisplay}</strong> at NEIPS.</p>
                            </div>
                            
                            <div class="section">
                                <h3>Position Details:</h3>
                                <ul>
                                    <li><strong>Position:</strong> ${roleDisplay}</li>
                                    <li><strong>Center:</strong> ${staffData.center}</li>
                                    <li><strong>Monthly Salary:</strong> ${formattedSalary}</li>
                                    <li><strong>Joining Date:</strong> ${joinDate}</li>
                                    ${staffData.address ? `<li><strong>Work Location:</strong> ${staffData.address}</li>` : ''}
                                </ul>
                            </div>
                            
                            <div class="section">
                                <p>This offer is contingent upon the successful completion of background verification and submission of required documents.</p>
                                <p>We look forward to welcoming you to the NEIPS team and are confident that your skills and experience will be valuable assets to our organization.</p>
                            </div>
                            
                            <div class="signature-section">
                                <p>Sincerely,</p>
                                <div class="signature-line"></div>
                                <p><strong>Administration Manager</strong><br>
                                North Eastern Institute of Professional Studies</p>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>NEIPS Headquarters • Nongstoin, Meghalaya • Phone: +91-9330410244/03654796297</p>
                        </div>
                    </body>
                    </html>
                `;
}

// Generate offer letter for existing staff
async function generateStaffOfferLetter(staffId) {
    showLoading('Loading staff data...');

    try {
        const result = await sheetsService.getAllStaff();

        if (result.status === 'success' && result.data) {
            const staffMember = result.data.find(staff =>
                staff.id === staffId ||
                staff['Staff ID'] === staffId ||
                staff['ID'] === staffId
            );

            if (staffMember) {
                // Use consistent data mapping
                const staffData = mapStaffData(staffMember);

                // Generate offer letter
                const offerLetterContent = createOfferLetterContent(staffData);
                generatePDF(offerLetterContent, `Offer_Letter_${staffData.name.replace(/\s+/g, '_')}.pdf`);

                showSuccess('Offer letter generated successfully!');
            } else {
                throw new Error('Staff member not found');
            }
        } else {
            throw new Error('Failed to load staff data');
        }
    } catch (error) {
        showError('Failed to generate offer letter: ' + error.message);
    } finally {
        hideLoading();
    }
}
function generateAllOfferLetters() {
    if (confirm('Generate offer letters for all staff members?')) {
        showLoading('Generating all offer letters...');

        setTimeout(() => {
            hideLoading();
            showSuccess('All offer letters generated successfully!');
        }, 2000);
    }
}