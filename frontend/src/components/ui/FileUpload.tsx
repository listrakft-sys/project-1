'use client';

import React, { useState, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import api from '@/lib/api/client';
import { Upload, File as FileIcon, Download, Trash2, X } from 'lucide-react';

interface AttachedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

interface FileUploadProps {
  entityType: string;
  entityId: string;
  onUploaded?: (file: AttachedFile) => void;
  existingFiles?: AttachedFile[];
  canDelete?: boolean;
}

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'application/zip',
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({ entityType, entityId, onUploaded, existingFiles = [], canDelete = true }: FileUploadProps) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<AttachedFile[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError(t('files.unsupportedFormat'));
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError(t('files.maxSize'));
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selected);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newFile = res.data.data as AttachedFile;
      setFiles(prev => [...prev, newFile]);
      onUploaded?.(newFile);
    } catch (err) {
      console.error('Upload error', err);
      setError(t('files.uploadError'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await api.delete(`/files/${fileId}`);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
          id={`file-upload-${entityType}-${entityId}`}
        />
        <label
          htmlFor={`file-upload-${entityType}-${entityId}`}
          className={`inline-flex items-center gap-2 cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 transition-colors ${
            uploading ? 'opacity-50 cursor-wait' : ''
          }`}
        >
          <Upload className="h-4 w-4" />
          {uploading ? '...' : t('files.uploadFile')}
        </label>
        {error && (
          <div className="flex items-center gap-1 text-sm text-red-500">
            <X className="h-3 w-3" />
            {error}
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileIcon className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="text-sm font-medium truncate">{file.originalName}</span>
                <span className="text-xs text-slate-400 shrink-0">{formatSize(file.size)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={file.url}
                  download
                  className="text-slate-400 hover:text-blue-500 transition-colors"
                  title={t('files.download')}
                >
                  <Download className="h-4 w-4" />
                </a>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title={t('files.deleteFile')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
