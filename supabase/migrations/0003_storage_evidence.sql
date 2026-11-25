-- Milestone M5: Tạo bucket lưu ảnh bằng chứng tỉ số (tối đa 5MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
