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

export function convertMySQLTimestampToHTMLDatetime(mysqlTimestamp) {
    if (!mysqlTimestamp) return ''; // Handle null or undefined input

    // Convert MySQL TIMESTAMP (e.g., "2025-02-23 13:45:30") to Date object
    const date = new Date(mysqlTimestamp);

    // Ensure values are formatted correctly (YYYY-MM-DDTHH:MM)
    const formattedDate = date.toISOString().slice(0, 16);

    return formattedDate; // Returns "YYYY-MM-DDTHH:MM"
}
