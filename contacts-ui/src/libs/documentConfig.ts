export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-outlook': '.msg',
  'message/rfc822': '.eml',
};

export const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.msg', '.eml',
];

// Accept string for the file input element
export const FILE_INPUT_ACCEPT = ALLOWED_EXTENSIONS.join(',');

export function isAllowedMimeType(mimeType: string): boolean {
  return mimeType in ALLOWED_MIME_TYPES;
}

export function isAllowedExtension(filename: string): boolean {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileIcon(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  switch (ext) {
    case '.pdf':  return '📄';
    case '.doc':
    case '.docx': return '📝';
    case '.xls':
    case '.xlsx': return '📊';
    case '.msg':
    case '.eml':  return '📧';
    default:      return '📎';
  }
}
