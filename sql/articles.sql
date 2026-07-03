-- كود إنشاء جدول المقالات في Supabase SQL Editor
-- قم بنسخ هذا الكود وتشغيله في الـ SQL Editor الخاص بـ Supabase

create table if not exists articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  image_base64 text,
  category text default 'commercial',
  status text default 'published',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تفعيل الحماية RLS (Row Level Security) لضمان أمان البيانات
alter table articles enable row level security;

-- السماح للجميع بقراءة المقالات (الزوار والعملاء)
drop policy if exists "Allow public read access" on articles;
create policy "Allow public read access" on articles
  for select using (true);

-- السماح فقط للمستخدم المصرح له (المدير) بعمل كل العمليات (إضافة، تعديل، حذف)
drop policy if exists "Allow all access to authenticated users" on articles;
create policy "Allow all access to authenticated users" on articles
  for all using (auth.role() = 'authenticated');
