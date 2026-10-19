/** Format a pg DATE (a Date at local midnight) as 'YYYY-MM-DD' without UTC conversion. */ 
export function toDateOnly(value: Date | string): string { 
  if (typeof value === 'string') return value.slice(0, 10); 
  const pad = (n: number) => String(n).padStart(2, '0'); 
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`; 
} 
 