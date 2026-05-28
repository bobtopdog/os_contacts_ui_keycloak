'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocuments, uploadDocument, getDownloadUrl, deleteDocument } from '@/libs/api';
import {
  MAX_FILE_SIZE_BYTES,
  FILE_INPUT_ACCEPT,
  ALLOWED_EXTENSIONS,
  isAllowedExtension,
  formatFileSize,
  fileIcon,
} from '@/libs/documentConfig';
import type { ContactDocument } from '@/types/contact';

interface Props { contactId: string; }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// DocumentRow — single file entry with download + delete
// ---------------------------------------------------------------------------
function DocumentRow({
  doc, currentUsername, onDelete,
}: {
  doc: ContactDocument;
  currentUsername: string;
  onDelete: (documentId: string) => Promise<void>;
}) {
  const isOwner = doc.username === currentUsername;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setIsDeleting(true);
    setError('');
    try {
      await onDelete(doc.documentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="card border-0 bg-light mb-2">
      <div className="card-body py-2 px-3">
        {!confirmDelete ? (
          <>
            <div className="d-flex align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2 overflow-hidden">
                <span style={{ fontSize: '1.3rem' }}>{fileIcon(doc.filename)}</span>
                <div className="overflow-hidden">
                  {/* Download link */}
                  <a
                    href={getDownloadUrl(doc.documentId)}
                    className="fw-medium text-primary text-decoration-none text-truncate d-block"
                    download={doc.filename}
                  >
                    {doc.filename}
                  </a>
                  <small className="text-muted">
                    {formatFileSize(doc.fileSize)} &middot; 👤 <strong>{doc.username}</strong>
                    {isOwner && <span className="badge bg-primary ms-1 rounded-pill">you</span>}
                    {' '}&middot;{' '}{formatDate(doc.createdAt)}
                  </small>
                </div>
              </div>

              <div className="d-flex gap-2 flex-shrink-0">
                {/* Download button */}
                <a
                  href={getDownloadUrl(doc.documentId)}
                  className="btn btn-outline-primary btn-sm py-0"
                  download={doc.filename}
                  title="Download"
                >
                  ⬇️
                </a>
                {/* Delete — owner only */}
                {isOwner && (
                  <button
                    className="btn btn-outline-danger btn-sm py-0"
                    onClick={() => setConfirmDelete(true)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
            {error && <div className="alert alert-danger py-1 small mt-1">{error}</div>}
          </>
        ) : (
          <>
            <p className="mb-2 text-danger fw-medium small">
              Delete <strong>{doc.filename}</strong>? This cannot be undone.
            </p>
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting
                  ? <><span className="spinner-border spinner-border-sm me-1" />Deleting…</>
                  : 'Yes, delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ContactDocuments component
// ---------------------------------------------------------------------------
export default function ContactDocuments({ contactId }: Props) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const username = session?.user?.username ?? '';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { data: documents, isLoading, isError } = useQuery<ContactDocument[]>({
    queryKey: ['documents', contactId],
    queryFn: () => getDocuments(contactId),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setUploadError('');
    setSelectedFile(null);

    if (!file) return;

    // Client-side validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File is too large (${formatFileSize(file.size)}). Maximum is 2MB.`);
      return;
    }
    if (!isAllowedExtension(file.name)) {
      setUploadError(`File type not allowed. Accepted types: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile || !username) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      await uploadDocument(contactId, username, selectedFile, setUploadProgress);
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['documents', contactId] });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(documentId: string) {
    await deleteDocument(documentId, username);
    queryClient.invalidateQueries({ queryKey: ['documents', contactId] });
  }

  return (
    <div className="mt-1">
      

      {/* Upload area — authenticated users only */}
      {status === 'authenticated' ? (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <p className="fw-medium mb-2">Upload a document</p>

            <div className="mb-2">
              <input
                ref={fileInputRef}
                type="file"
                className="form-control"
                accept={FILE_INPUT_ACCEPT}
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <small className="text-muted d-block mt-1">
                Accepted: PDF, Word, Excel, MSG, EML &middot; Max 2MB
              </small>
            </div>

            {/* Selected file preview */}
            {selectedFile && !uploadError && (
              <div className="alert alert-info py-2 small mb-2 d-flex align-items-center gap-2">
                <span>{fileIcon(selectedFile.name)}</span>
                <span><strong>{selectedFile.name}</strong> ({formatFileSize(selectedFile.size)})</span>
              </div>
            )}

            {/* Upload progress bar */}
            {isUploading && (
              <div className="mb-2">
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    style={{ width: `${uploadProgress}%` }}
                    role="progressbar"
                    aria-valuenow={uploadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <small className="text-muted">{uploadProgress}% uploaded</small>
              </div>
            )}

            {uploadError && (
              <div className="alert alert-danger py-2 small mb-2">{uploadError}</div>
            )}

            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">Uploading as <strong>{username}</strong></small>
              <button
                className="btn btn-primary btn-sm px-4"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || !!uploadError}
              >
                {isUploading
                  ? <><span className="spinner-border spinner-border-sm me-1" />Uploading…</>
                  : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info py-2 small mb-4">
          Please sign in to upload documents.
        </div>
      )}

      {/* Document list */}
      {isLoading && (
        <div className="text-center text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" />Loading documents…
        </div>
      )}

      {isError && (
        <div className="alert alert-warning py-2 small">
          Could not load documents. Please try refreshing.
        </div>
      )}

      {documents && documents.length === 0 && (
        <p className="text-muted small">No documents uploaded yet for this contact.</p>
      )}

      {documents && documents.length > 0 && (
        <div>
          <p className="text-muted small mb-2">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </p>
          {documents.map((doc) => (
            <DocumentRow
              key={doc.documentId}
              doc={doc}
              currentUsername={username}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
