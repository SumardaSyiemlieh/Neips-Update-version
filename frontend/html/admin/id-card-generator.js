
// =============================================
// UPDATED ID CARD FUNCTIONS - WITH ALL FIXES
// =============================================

// View ID Card - FIXED PHOTO RETRIEVAL
function viewIDCard(studentId) {
    showLoading('Loading student data...');

    // Get student data and open ID card
    sheetsService.getAllStudents()
        .then(result => {
            if (result.success && result.students) {
                const student = result.students.find(s =>
                    s['Unique ID'] === studentId || s.id === studentId
                );

                if (student) {
                    console.log('📸 Student data for ID card:', {
                        name: student['Name'],
                        hasPhoto: !!(student['Photo'] || student.photo),
                        photoLength: (student['Photo'] || student.photo) ? (student['Photo'] || student.photo).length : 0
                    });

                    hideLoading();
                    openIDCardWindow(student);
                } else {
                    throw new Error('Student not found');
                }
            } else {
                throw new Error('Failed to load student data');
            }
        })
        .catch(error => {
            hideLoading();
            showError('Failed to load ID card: ' + error.message);
        });
}

// Generate Batch ID function - FIXED: Always generate valid batch ID
function generateBatchId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `NEIPS${year}${month}${random}`;
}
// Open ID Card in new window - FIXED DOB and Batch ID issues
function openIDCardWindow(studentData, idCardNumber = '') {
    // Use ID Card Number if available, otherwise use Unique ID as Batch ID
    const batchId = studentData['ID Card Number'] || studentData['Unique ID'] || generateBatchId();

    // Get DOB from correct column name - FIXED
    const dob = studentData['Date of Birth'] || studentData['DOB'] || studentData.dob || 'N/A';
    const formattedDOB = formatDateForIDCard(dob) || 'N/A';

    // Get photo data
    let photoData = studentData['Photo'] || studentData.photo || '';
    let hasPhoto = false;
    let cleanPhotoData = '';

    // Clean and validate photo data
    if (photoData && photoData.length > 1000) {
        if (photoData.startsWith('data:image/')) {
            cleanPhotoData = photoData;
            hasPhoto = true;
        } else if (photoData.includes('base64,')) {
            const base64Part = photoData.split('base64,')[1];
            if (base64Part) {
                cleanPhotoData = 'data:image/jpeg;base64,' + base64Part;
                hasPhoto = true;
            }
        } else {
            cleanPhotoData = 'data:image/jpeg;base64,' + photoData;
            hasPhoto = true;
        }
    }

    // Create ID card HTML with PROPER layout
    const idCardHTML = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>NEIPS ID Card - ${studentData['Name'] || studentData.name}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Arial', sans-serif;
                        background: #2B0071;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        padding: 10px;
                    }
                    
                    .id-card-container {
                        background: #4a4e69;
                        width: 5.4cm;
                        height: 8.5cm;
                        border: 1px solid #000;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .id-card-header {
                        background: #1e3c72;
                        color: white;
                        padding: 8px 5px;
                        text-align: center;
                        border-bottom: 2px solid #ffd700;
                        position: relative;
                    }
                    
                    .id-card-header h1 {
                        font-size: 9px;
                        font-weight: bold;
                        line-height: 1.2;
                        margin: 0;
                    }
                    
                    .id-card-header h2 {
                        font-size: 7px;
                        opacity: 0.9;
                        font-weight: normal;
                        margin: 2px 0 0 0;
                    }
                    
                    .id-card-body {
                        padding: 8px 5px;
                        background: #4a4e69;
                    }
                    
                    .photo-section {
                        text-align: center;
                        margin-bottom: 8px;
                        position: relative;
                    }
                    
                    .student-photo {
                        width: 1.8cm;
                        height: 2.2cm;
                        border: 1px solid #1e3c72;
                        background: #f8f9fa;
                        display: inline-block;
                        overflow: hidden;
                        position: relative;
                    }
                    
                    .batch-id-overlay {
                        position: absolute;
                        top: 2px;
                        left: 2px;
                        background: rgba(30, 60, 114, 0.9);
                        color: white;
                        padding: 1px 4px;
                        font-size: 6px;
                        font-weight: bold;
                        border-radius: 2px;
                        z-index: 2;
                    }
                    
                    .student-photo img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        display: block;
                    }
                    
                    .student-photo .photo-placeholder {
                        color: #666;
                        font-size: 8px;
                        text-align: center;
                        padding: 5px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        width: 100%;
                        flex-direction: column;
                    }
                    
                    .details-section {
                        font-size: 8px;
                        line-height: 1.3;
                        color: white;
                    }
                    
                    .detail-row {
                        display: flex;
                        margin-bottom: 3px;
                        border-bottom: 0.5px solid rgba(255,255,255,0.2);
                        padding-bottom: 2px;
                    }
                    
                    .detail-label {
                        font-weight: bold;
                        width: 1.8cm;
                        flex-shrink: 0;
                        color: #ffd700;
                    }
                    
                    .detail-value {
                        flex: 1;
                        color: white;
                    }
                    
                    .id-number-section {
                        background: #1e3c72;
                        color: white;
                        padding: 4px;
                        text-align: center;
                        margin-top: 5px;
                        border-radius: 2px;
                    }
                    
                    .id-number {
                        font-size: 9px;
                        font-weight: bold;
                    }
                    
                    .id-card-footer {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        background: #f8f9fa;
                        padding: 5px;
                        border-top: 1px solid #ddd;
                        font-size: 7px;
                    }
                    
                    .validity {
                        text-align: center;
                        margin-bottom: 3px;
                    }
                    
                    .signature-section {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 3px;
                    }
                    
                    .signature {
                        text-align: center;
                        font-size: 6px;
                    }
                    
                    .signature-line {
                        width: 1.5cm;
                        height: 0.5px;
                        background: #333;
                        margin: 1px auto;
                    }
                    
                    .print-btn {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #1e3c72;
                        color: white;
                        border: none;
                        padding: 8px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        z-index: 1000;
                    }
                    
                    @media print {
                        body {
                            background: white;
                            padding: 0;
                            margin: 0;
                        }
                        
                        .id-card-container {
                            border: 1px solid #000;
                            margin: 0;
                            box-shadow: none;
                        }
                        
                        .print-btn {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <button class="print-btn" onclick="window.print()">🖨️ Print ID Card</button>
                
                <div class="id-card-container">
                    <div class="id-card-header">
                        <h1>NORTH EASTERN INSTITUTE OF PROFESSIONAL STUDIES</h1>
                        <h2>Empowering Today's Youth for Tomorrow's World</h2>
                    </div>
                    
                    <div class="id-card-body">
                        <div class="photo-section">
                            <div class="student-photo" id="studentPhotoContainer">
                                <div class="batch-id-overlay">${batchId}</div>
                                ${hasPhoto ?
            `<img src="${cleanPhotoData}" alt="Student Photo" id="studentPhoto" 
                                            onload="handlePhotoLoad(true)" 
                                            onerror="handlePhotoLoad(false)" />` :
            ''
        }
                                <div class="photo-placeholder" id="photoPlaceholder" ${hasPhoto ? 'style="display:none;"' : ''}>
                                    <div style="font-size: 16px; margin-bottom: 5px;">📷</div>
                                    <span>No Photo Available</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <div class="detail-row">
                                <div class="detail-label">Name:</div>
                                <div class="detail-value">${studentData['Name'] || studentData.name || 'N/A'}</div>
                            </div>
                            
                            <div class="detail-row">
                                <div class="detail-label">Trade:</div>
                                <div class="detail-value">${studentData['Trade'] || studentData.trade || 'N/A'}</div>
                            </div>
                            
                            <div class="detail-row">
                                <div class="detail-label">DOB:</div>
                                <div class="detail-value">${formattedDOB}</div>
                            </div>
                            
                            <div class="detail-row">
                                <div class="detail-label">Phone No:</div>
                                <div class="detail-value">${studentData['Phone'] || studentData.phone || 'N/A'}</div>
                            </div>
                            
                            <div class="detail-row">
                                <div class="detail-label">Center:</div>
                                <div class="detail-value">${studentData['Address'] || studentData.address || 'NEIPS Shillong'}</div>
                            </div>
                            
                            <div class="detail-row">
                                <div class="detail-label">Duration:</div>
                                <div class="detail-value">6 Months</div>
                            </div>
                            
                            <div class="id-number-section">
                                <div class="id-number">${batchId}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="id-card-footer">
                        <div class="validity">
                            Valid until: ${new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toLocaleDateString()}
                        </div>
                        
                        <div class="signature-section">
                            <div class="signature">
                                Student Signature<br>
                                <div class="signature-line"></div>
                            </div>
                            
                            <div class="signature">
                                For, NEIPS<br>
                                <div class="signature-line"></div>
                                Signature
                            </div>
                        </div>
                    </div>
                </div>
                
                <script>
                    function handlePhotoLoad(success) {
                        const photoImg = document.getElementById('studentPhoto');
                        const placeholder = document.getElementById('photoPlaceholder');
                        
                        if (success) {
                            if (placeholder) placeholder.style.display = 'none';
                            if (photoImg) photoImg.style.display = 'block';
                        } else {
                            if (placeholder) placeholder.style.display = 'flex';
                            if (photoImg) photoImg.style.display = 'none';
                        }
                    }
                    
                    // Auto-print option
                    const urlParams = new URLSearchParams(window.location.search);
                    if (urlParams.get('print') === 'true') {
                        setTimeout(() => {
                            window.print();
                        }, 1000);
                    }
                    
                    // Close window after print
                    window.onafterprint = function() {
                        setTimeout(() => {
                            if (!urlParams.get('keepOpen')) {
                                window.close();
                            }
                        }, 1000);
                    };
                </script>
            </body>
            </html>
            `;

    // Open in new window
    const newWindow = window.open('', '_blank', 'width=600,height=900,scrollbars=yes');
    newWindow.document.write(idCardHTML);
    newWindow.document.close();
}
// NEW FUNCTION: Better date formatting for ID Card
function formatDateForIDCard(dateString) {
    if (!dateString || dateString === 'N/A') return 'N/A';

    try {
        let date;

        // Handle different date formats
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                // DD/MM/YYYY
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        } else if (dateString.includes('-')) {
            // YYYY-MM-DD
            date = new Date(dateString);
        } else {
            // Try direct parsing
            date = new Date(dateString);
        }

        if (isNaN(date.getTime())) {
            return dateString; // Return original if can't parse
        }

        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return dateString; // Return original if error
    }
}
