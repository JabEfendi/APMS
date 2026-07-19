import * as XLSX from 'xlsx';

/**
 * Export data to Excel format (.xlsx)
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file without extension
 * @param {string} sheetName - Name of the Excel sheet
 */
export const exportToExcel = (data, fileName = 'export', sheetName = 'Sheet1') => {
  if (!data || data.length === 0) return;
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Export to file
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file without extension
 */
export const exportToCSV = (data, fileName = 'export') => {
  if (!data || data.length === 0) return;
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Convert to CSV
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
