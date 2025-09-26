# QuizLab

QuizLab là nền tảng thi trực tuyến cho phép giáo viên tạo lớp học, giao bài thi trắc nghiệm & tự luận và theo dõi bài nộp của học sinh. Điểm nhấn của ứng dụng là phòng chờ với đồng hồ đếm ngược tự động chuyển hướng sang trang làm bài khi đến giờ.

## Kiến trúc dự án

```
src/
 ├─ app/            # Router, layout và shell của ứng dụng
 ├─ features/       # Các nhóm chức năng (auth, student, teacher, tests)
 ├─ hooks/          # Hooks dùng chung (ví dụ: useCountdown)
 ├─ lib/            # Kết nối Supabase và helper chia sẻ
 ├─ services/       # Lớp gọi API Supabase theo domain
 ├─ styles/         # TailwindCSS entry point
 └─ types/          # Định nghĩa kiểu dữ liệu chia sẻ
```

Ứng dụng sử dụng React + TypeScript, Vite cho bundler, TailwindCSS cho giao diện và Supabase để xác thực & lưu trữ dữ liệu thời gian thực.

## Thiết lập môi trường

1. Cài đặt dependencies

   ```bash
   npm install
   ```

2. Tạo file `.env.local` với các biến Supabase

   ```bash
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   # Tuỳ chọn: ghi đè URL chuyển hướng xác nhận email nếu khác với SITE_URL đã cấu hình trong Supabase
    VITE_SUPABASE_AUTH_REDIRECT_URL=https://your-app-domain.com/login
   ```

3. Chạy ứng dụng ở môi trường phát triển

   ```bash
   npm run dev
   ```

4. Build bản sản xuất

   ```bash
   npm run build
   ```

> ⚠️ Lưu ý: Build yêu cầu đã cài đặt `tailwindcss`, `postcss` và `autoprefixer` (được khai báo trong `package.json`). Hãy chắc chắn đã chạy `npm install` trước khi build.

## Khắc phục sự cố Supabase

- **Không nhận được email xác nhận**: đảm bảo domain trong `VITE_SUPABASE_AUTH_REDIRECT_URL` (hoặc `SITE_URL` của dự án Supabase) nằm trong danh sách _Additional Redirect URLs_ của Supabase Authentication. Nếu để trống biến môi trường, ứng dụng sẽ dùng `window.location.origin/login` làm URL mặc định.
- **Không tạo được bản ghi `profiles` sau khi đăng ký**: bộ policy mẫu trong README của Supabase cần cho phép `service_role` ghi dữ liệu để trigger `handle_new_user` hoạt động. Bạn có thể thêm policy như sau:

  ```sql
  create policy "Service role can manage profiles." on public.profiles
    for all using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
  ```

  Sau khi thêm policy, thử đăng ký lại để Supabase tạo profile tự động.

## Các route chính

| Đường dẫn             | Mô tả                                                     |
|-----------------------|-----------------------------------------------------------|
| `/`                   | Landing page (khách) hoặc dashboard của học sinh          |
| `/login`              | Trang đăng nhập/đăng ký                                   |
| `/teacher`            | Bảng điều khiển giáo viên (route được bảo vệ)            |
| `/student`            | Dashboard học sinh (route được bảo vệ)                   |
| `/test/:testId`       | Phòng chờ với đồng hồ đếm ngược                           |
| `/test/:testId/take`  | Trang làm bài thi với đồng hồ thời gian làm bài          |

## Scripts

- `npm run dev` – chạy Vite dev server
- `npm run build` – build sản phẩm
- `npm run preview` – chạy thử bản build

## Giấy phép

Dự án được phát hành theo giấy phép MIT.
