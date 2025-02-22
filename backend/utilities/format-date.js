export function formatDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Extracts YYYY-MM-DD
}

export function convertFromInputDateTimeToMySQLTimestamp(inputDateTime) {
    const date = new Date(inputDateTime);
    
    // Convert to YYYY-MM-DD HH:MM:SS format
    const formattedDate = date.toISOString().slice(0, 19).replace("T", " ");

    return formattedDate;
}
