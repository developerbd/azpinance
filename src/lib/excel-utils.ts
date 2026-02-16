/**
 * Sanitizes a string to prevent Formula Injection (CSV Injection) in Excel/CSV exports.
 * If a string starts with =, +, -, or @, it prepends a single quote to force it to be treated as text.
 */
export function sanitizeForExcel(value: unknown): unknown {
    if (typeof value === 'string') {
        // Check for potential formula injection characters
        if (/^[=+\-@]/.test(value)) {
            return `'${value}`;
        }
    }
    return value;
}

/**
 * Sanitizes an array of objects for Excel export.
 */
export function sanitizeDataForExcel(data: Record<string, unknown>[]): Record<string, unknown>[] {
    return data.map(row => {
        const newRow: Record<string, unknown> = {};
        for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
                newRow[key] = sanitizeForExcel(row[key]);
            }
        }
        return newRow;
    });
}
