/*
# Storage policies for order-files bucket

1. Security
- Allow anon + authenticated to upload files to 'order-files' bucket (customers submit files with orders)
- Allow anon + authenticated to read files from 'order-files' bucket
- No public delete (only authenticated/admin can delete)
*/

DROP POLICY IF EXISTS "anon_upload_order_files" ON storage.objects;
CREATE POLICY "anon_upload_order_files"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'order-files');

DROP POLICY IF EXISTS "anon_read_order_files" ON storage.objects;
CREATE POLICY "anon_read_order_files"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'order-files');

DROP POLICY IF EXISTS "auth_delete_order_files" ON storage.objects;
CREATE POLICY "auth_delete_order_files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'order-files');
