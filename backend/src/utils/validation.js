function validateFormData(formData) {
    const errors = [];

    if (!formData.name || formData.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        errors.push('Please enter a valid email address');
    }

    const phoneClean = formData.phone.replace(/\D/g, '');
    if (phoneClean.length < 10) {
        errors.push('Please enter a valid 10-digit phone number');
    }

    if (!formData.course) {
        errors.push('Please select a course');
    }

    return errors;
}

module.exports = {
    validateFormData
};