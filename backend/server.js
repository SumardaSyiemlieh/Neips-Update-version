require('dotenv').config();
console.log('✅ Environment loaded:', process.env.NODE_ENV);

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Your Google Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxvvHuy1hG2DC0RGktX6tSC8Wb4CWk__W3iCel1s4T7a6TsQdwtt0MOlj4tzJqNKEET/exec';

// INCREASE PAYLOAD SIZE LIMIT
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// FIX THE PATH - Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// CORS configuration
app.use(cors({
    origin: "*",
    credentials: true
}));

// ✅ SUBMIT ROUTE - SIMPLIFIED AND WORKING
app.post('/api/submit', async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            trade,    // Use trade from your HTML form
            dob,
            address,
            photo
        } = req.body;

        console.log('📨 Received form data:', { name, email, phone, trade, dob, address });
        console.log('📸 Photo data:', photo ? 'Yes (' + (photo.length || 0) + ' chars)' : 'No');

        // Validate required fields - SIMPLIFIED
        if (!name || !email || !phone || !trade || !dob) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: name, email, phone, trade, dob"
            });
        }

        console.log('🔄 Sending to Google Apps Script...');

        // Send to Google Apps Script - USE TRADE FIELD
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                trade: trade,  // Send as trade
                dob,
                address: address || 'NEIPS SHILLONG',
                photo: photo || ''
            })
        });

        const result = await response.json();
        console.log('✅ Google Apps Script response:', result);

        if (result.success) {
            res.json({
                success: true,
                message: result.message || 'Registration successful!',
                studentId: result.studentId,
                timestamp: result.timestamp
            });
        } else {
            throw new Error(result.message || 'Registration failed');
        }

    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({
            success: false,
            message: "Registration failed: " + error.message
        });
    }
});

// ✅ STUDENT STATUS CHECK
// ✅ STUDENT STATUS CHECK - FIXED VERSION
app.get('/api/students/email/:email', async (req, res) => {
    try {
        const { email } = req.params;
        console.log('🔍 Checking status for email:', email);

        const response = await fetch(`${APPS_SCRIPT_URL}?action=getStudentByEmail&email=${encodeURIComponent(email)}`);

        // First get the response as text to check if it's HTML
        const responseText = await response.text();

        // Check if it's HTML (error page)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            console.error('❌ Google Apps Script returned HTML error page');
            console.log('HTML response:', responseText.substring(0, 500));

            return res.status(500).json({
                success: false,
                message: "Student status service is temporarily unavailable. Please try again later."
            });
        }

        // Try to parse as JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Failed to parse JSON response:', parseError);
            console.log('Raw response:', responseText.substring(0, 500));

            return res.status(500).json({
                success: false,
                message: "Invalid response from server. Please try again."
            });
        }

        res.json(result);

    } catch (error) {
        console.error('Error checking student status:', error);
        res.status(500).json({
            success: false,
            message: "Failed to check status: " + error.message
        });
    }
});

// ✅ GET ALL STUDENTS (for admin)
app.get('/api/students', async (req, res) => {
    try {
        console.log('📋 Fetching all students...');
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getStudents`);
        const result = await response.json();
        res.json(result);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch students: " + error.message
        });
    }
});

// ✅ UPDATE STUDENT STATUS (for admin)
app.post('/api/students/update', async (req, res) => {
    try {
        console.log('🔄 Updating student status:', req.body);

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        const result = await response.json();
        res.json(result);

    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update student: " + error.message
        });
    }
});

// ✅ UPDATE STUDENT PROJECT (for admin)
app.post('/api/students/update-project', async (req, res) => {
    try {
        console.log('🔄 Updating student project:', req.body);

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        const result = await response.json();
        res.json(result);

    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update project: " + error.message
        });
    }
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        message: 'NEIPS Backend is running!',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

// FIX THE PATHS FOR SERVING HTML FILES
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'admin.html'));
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`🌐 Frontend served at: http://localhost:${PORT}`);
    console.log(`📨 Connected to Google Apps Script`);
    console.log(`🔗 Apps Script URL: ${APPS_SCRIPT_URL}`);
    console.log('📍 Other devices: http://192.168.29.53:' + PORT);
});
