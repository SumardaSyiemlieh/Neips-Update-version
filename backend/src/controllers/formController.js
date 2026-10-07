    const googleSheetsService = require('../services/googleSheetsService');
    const { validateFormData } = require('../utils/validation');

    class FormController {
        async submitForm(req, res) {
            try {
                const { name, email, phone, course } = req.body;

                console.log('📨 Received form data:', { name, email, phone, course });

                // Validate form data
                const validationErrors = validateFormData(req.body);
                if (validationErrors.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: validationErrors.join(', ')
                    });
                }

                // Submit to Google Sheets
                const result = await googleSheetsService.submitForm({
                    name,
                    email,
                    phone,
                    course,
                    timestamp: new Date().toISOString()
                });

                res.json(result);

            } catch (error) {
                console.error('Error in form submission:', error);
                res.status(500).json({
                    success: false,
                    message: "Registration failed: " + error.message
                });
            }
        }

        async checkStudentStatus(req, res) {
            try {
                const { email } = req.query;

                if (!email) {
                    return res.status(400).json({
                        success: false,
                        message: "Email is required"
                    });
                }

                const result = await googleSheetsService.getStudentByEmail(email);
                res.json(result);

            } catch (error) {
                console.error('Error checking student status:', error);
                res.status(500).json({
                    success: false,
                    message: "Failed to check status: " + error.message
                });
            }
        }
    }

    module.exports = new FormController();
    const submitForm = async (req, res) => {
        try {
            const { name, email, phone, course, photo } = req.body;

            // Validate required fields
            if (!name || !email || !phone || !course) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
            }

            // Prepare student data with photo
            const studentData = {
                name,
                email,
                phone,
                course,
                photo: photo || '', // Store photo data
                timestamp: new Date().toISOString(),
                status: 'Pending'
            };

            // Save to Google Sheets
            const result = await googleSheetsService.addStudent(studentData);

            res.json({
                success: true,
                message: 'Registration successful!',
                studentId: result.studentId
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Registration failed: ' + error.message
            });
        }
    };