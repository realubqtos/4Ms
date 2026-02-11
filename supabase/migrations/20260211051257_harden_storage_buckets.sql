/*
  # Harden storage bucket configuration

  1. Modified Buckets
    - `figures` - Set 50MB file size limit, restrict to image MIME types
    - `data-files` - Set 100MB file size limit, restrict to data file MIME types

  2. Security
    - Prevents upload of arbitrary file types
    - Enforces reasonable file size limits
*/

UPDATE storage.buckets
SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/png',
    'image/jpeg',
    'image/svg+xml',
    'image/webp',
    'application/pdf'
  ]
WHERE id = 'figures';

UPDATE storage.buckets
SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'text/csv',
    'application/json',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'text/tab-separated-values'
  ]
WHERE id = 'data-files';
