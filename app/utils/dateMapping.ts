// Fixed mapping for 2024 dates to file numbers
export const dateMapping2024: { [key: string]: string } = {
  '01': '19.03.2024',
  '02': '26.03.2024',
  '03': '02.04.2024',
  '04': '09.04.2024',
  '05': '16.04.2024',
  '07': '30.04.2024',
  '08': '07.05.2024',
  '09': '14.05.2024',
  '10': '21.05.2024',
  '11': '28.05.2024',
  '12': '04.06.2024',
  '14': '18.06.2024',
  '15': '25.06.2024',
  '16': '02.07.2024',
  '17': '09.07.2024',
  '18': '16.07.2024',
  '19': '23.07.2024',
  '20': '30.07.2024',
  '22': '13.08.2024',
  '23': '20.08.2024',
  '24': '27.08.2024',
  '25': '03.09.2024',
  '26': '10.09.2024',
  '28': '24.09.2024',
  '29': '01.10.2024'
};

// Reverse mapping for looking up file numbers by date
export const reverseDateMapping2024: { [key: string]: string } = 
  Object.entries(dateMapping2024).reduce((acc, [num, date]) => {
    acc[date] = num;
    return acc;
  }, {} as { [key: string]: string });

// Helper function to get file number for 2024 date
export function getFileNumberFor2024Date(date: string): string | null {
  return reverseDateMapping2024[date] || null;
}

// Helper function to get date for 2024 file number
export function getDateFor2024FileNumber(fileNumber: string): string | null {
  return dateMapping2024[fileNumber] || null;
}