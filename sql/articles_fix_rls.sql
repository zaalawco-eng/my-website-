-- إصلاح سياسات الأمان لجدول المقالات
-- يتيح للجميع القراءة، وللمدير (anon) القيام بعمليات الكتابة

-- حذف السياسات القديمة
drop policy if exists "Allow public read access" on articles;
drop policy if exists "Allow all access to authenticated users" on articles;
drop policy if exists "Allow anon insert" on articles;
drop policy if exists "Allow anon update" on articles;
drop policy if exists "Allow anon delete" on articles;

-- السماح للجميع بقراءة المقالات
create policy "Allow public read access" on articles
  for select using (true);

-- السماح للجميع بإدراج مقالات (يستخدمه المدير عبر anon key)
create policy "Allow anon insert" on articles
  for insert with check (true);

-- السماح للجميع بتعديل المقالات
create policy "Allow anon update" on articles
  for update using (true);

-- السماح للجميع بحذف المقالات
create policy "Allow anon delete" on articles
  for delete using (true);
