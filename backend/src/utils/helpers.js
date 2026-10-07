function formatStudentData(student) {
    return {
        id: student.UniqueID || student.rowNumber,
        name: student.Name,
        email: student.Email,
        phone: student.Phone,
        course: student.Course,
        project: student.Project || 'Not Assigned',
        status: student.Status || 'Pending',
        timestamp: student.Timestamp,
        rejectionReason: student['Rejection Reason'],
        idCardNumber: student['ID Card Number'],
        approvalDate: student['Approval Date']
    };
}

function generateUniqueID() {
    return 'NEIPS' + Date.now() + Math.random().toString(36).substr(2, 5);
}

module.exports = {
    formatStudentData,
    generateUniqueID
};