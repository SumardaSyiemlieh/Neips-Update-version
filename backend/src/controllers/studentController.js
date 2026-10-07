const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Initialize Google Sheets
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// SPREADSHEET CONFIG - USING YOUR ACTUAL SPREADSHEET ID
const SPREADSHEET_ID = '1LKjbveX_K_jJFwFdUcy4_MWmF01Vae4OtVV2Z3JoDqk';
const SHEET_NAME = 'Form Responses 1';

// Submit registration with photo
const submitRegistration = async (req, res) => {
    try {
        // Extract data from request body - MATCHING YOUR HTML FORM FIELDS
        const { 
            name, 
            email, 
            phone, 
            trade, // Using 'trade' from your HTML form
            dob, 
            address 
        } = req.body;

        // Get photo from the correct field name
        const photo = req.body.photo;

        console.log('📨 Received registration:', { name, email, trade, dob, address });
        console.log('📸 Photo data:', photo ? `YES (${photo.length} chars)` : 'NO');

        // Validate required fields based on your HTML form
        if (!name || !email || !phone || !trade || !dob) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Generate student ID and ID Card Number
        const studentId = 'NEIPS' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const idCardNumber = 'ID' + Date.now().toString().substr(-6);

        // Handle photo upload
        let photoStatus = 'No Photo';
        let photoFilename = '';

        if (photo && photo.startsWith('data:image/')) {
            try {
                photoFilename = await savePhoto(photo, studentId);
                photoStatus = photoFilename ? 'Uploaded' : 'Upload Failed';
                console.log('✅ Photo status:', photoStatus);
            } catch (photoError) {
                console.error('❌ Photo save error:', photoError);
                photoStatus = 'Upload Failed';
            }
        }

        // Prepare data for Google Sheets - MATCHING YOUR COLUMNS
        const timestamp = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata'
        });

        const rowData = [
            [
                timestamp,          // A - Timestamp
                name,               // B - Name
                email,              // C - Email
                phone,              // D - Phone
                trade,              // E - Trade (from your HTML form)
                'Pending',          // F - Status (default: Pending)
                '',                 // G - Project (empty initially)
                '',                 // H - Rejection Reason (empty initially)
                idCardNumber,       // I - ID Card Number
                '',                 // J - Approval Date (empty initially)
                studentId,          // K - Unique ID
                photoStatus,        // L - Photo status
                dob,                // M - Date of Birth (new column)
                address || 'NEIPS SHILLONG' // N - Address (new column)
            ]
        ];

        console.log('📊 Saving to Google Sheets:', rowData[0]);

        // Save to Google Sheets - Updated to N column
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:N`, // Updated to N column for new fields
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: rowData
            }
        });

        console.log('✅ Registration saved to Google Sheets');

        res.json({
            success: true,
            studentId,
            idCardNumber,
            message: 'Registration successful!',
            photoStatus: photoStatus
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed: ' + error.message
        });
    }
};

// Function to save photo
const savePhoto = async (base64Data, studentId) => {
    try {
        // Extract image type and data
        const matches = base64Data.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 image data');
        }

        const imageType = matches[1];
        const imageData = matches[2];
        const buffer = Buffer.from(imageData, 'base64');

        // Create filename
        const filename = `${studentId}.${imageType === 'jpeg' ? 'jpg' : imageType}`;
        const uploadsDir = path.join(__dirname, '../uploads/photos');
        const filePath = path.join(uploadsDir, filename);

        // Ensure uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Save file
        fs.writeFileSync(filePath, buffer);
        console.log('✅ Photo saved to:', filePath);

        return filename;

    } catch (error) {
        console.error('❌ Photo save error:', error);
        return null;
    }
};

// Get all students - Updated to include new columns
const getAllStudents = async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:N`, // Updated to N column
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.json([]);
        }

        // Convert to array of objects
        const students = rows.slice(1).map(row => ({
            timestamp: row[0],
            name: row[1],
            email: row[2],
            phone: row[3],
            course: row[4], // This is actually 'trade' from form
            status: row[5],
            project: row[6],
            rejectionReason: row[7],
            idCardNumber: row[8],
            approvalDate: row[9],
            uniqueId: row[10],
            photo: row[11],
            dob: row[12], // New field
            address: row[13] // New field
        }));

        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
};

// Get student by ID - Updated to include new columns
const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:N`, // Updated to N column
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Find student by Unique ID (column K)
        const studentRow = rows.find(row => row[10] === id);
        if (!studentRow) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const student = {
            timestamp: studentRow[0],
            name: studentRow[1],
            email: studentRow[2],
            phone: studentRow[3],
            course: studentRow[4],
            status: studentRow[5],
            project: studentRow[6],
            rejectionReason: studentRow[7],
            idCardNumber: studentRow[8],
            approvalDate: studentRow[9],
            uniqueId: studentRow[10],
            photo: studentRow[11],
            dob: studentRow[12], // New field
            address: studentRow[13] // New field
        };

        res.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
};

// Get student by email - Updated to include new columns
const getStudentByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:N`, // Updated to N column
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Find student by email (column C)
        const studentRow = rows.find(row => row[2] === email);
        if (!studentRow) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const student = {
            timestamp: studentRow[0],
            name: studentRow[1],
            email: studentRow[2],
            phone: studentRow[3],
            course: studentRow[4],
            status: studentRow[5],
            project: studentRow[6],
            rejectionReason: studentRow[7],
            idCardNumber: studentRow[8],
            approvalDate: studentRow[9],
            uniqueId: studentRow[10],
            photo: studentRow[11],
            dob: studentRow[12], // New field
            address: studentRow[13] // New field
        };

        res.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
};

// Update student status (for admin approvals)
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, project, rejectionReason } = req.body;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:N`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Find student row index
        const rowIndex = rows.findIndex(row => row[10] === id);
        if (rowIndex === -1) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Update specific cells
        const updates = [];
        
        if (status) {
            updates.push({
                range: `${SHEET_NAME}!F${rowIndex + 1}`,
                values: [[status]]
            });
        }

        if (project) {
            updates.push({
                range: `${SHEET_NAME}!G${rowIndex + 1}`,
                values: [[project]]
            });
        }

        if (rejectionReason) {
            updates.push({
                range: `${SHEET_NAME}!H${rowIndex + 1}`,
                values: [[rejectionReason]]
            });
        }

        if (status === 'Approved') {
            const approvalDate = new Date().toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata'
            });
            updates.push({
                range: `${SHEET_NAME}!J${rowIndex + 1}`,
                values: [[approvalDate]]
            });
        }

        if (updates.length > 0) {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                resource: {
                    data: updates,
                    valueInputOption: 'RAW'
                }
            });
        }

        res.json({
            success: true,
            message: 'Student updated successfully'
        });

    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Failed to update student' });
    }
};

module.exports = {
    submitRegistration,
    getAllStudents,
    getStudentById,
    updateStudent,
    getStudentByEmail
};