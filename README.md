# Auto Vocab Saver

**Tiếng Việt** · [English](README.en.md)

Tiện ích mở rộng cho Chrome tự động lưu từ vựng mỗi khi sao chép trên trang web, giúp người học ngoại ngữ thu thập từ mới trong lúc đọc mà không cần chuyển sang ứng dụng khác.

## Tính năng

- Tự động lưu cụm từ đang chọn (tối đa 4 từ) khi sao chép bằng Ctrl+C hoặc menu chuột phải, kể cả trong ô nhập liệu.
- Bỏ qua từ trùng lặp, không phân biệt chữ hoa và chữ thường.
- Bảng từ vựng nổi trên trang: kéo thả, thay đổi kích thước, thu nhỏ hoặc ẩn.
- Xuất danh sách ra file CSV (UTF-8) để dùng với Excel, Google Sheets, Anki…
- Bật / tắt tiện ích và hiện / ẩn bảng từ từ popup trên thanh công cụ.
- Dữ liệu chỉ lưu cục bộ bằng `chrome.storage.local`, không gửi đi đâu.

## Cài đặt

1. Tải mã nguồn về (Code → Download ZIP) và giải nén, hoặc `git clone` repo này.
2. Mở `chrome://extensions` và bật **Developer mode**.
3. Chọn **Load unpacked** và trỏ đến thư mục dự án.

Tiện ích hoạt động trên Chrome, Edge, Brave và các trình duyệt nhân Chromium hỗ trợ Manifest V3.

## Quyền

| Quyền | Mục đích |
|---|---|
| `storage` | Lưu danh sách từ vựng và trạng thái bật/tắt |
| Content script trên `<all_urls>` | Nhận sự kiện sao chép và hiển thị bảng từ trên mọi trang |

## Cấu trúc

```
manifest.json   Khai báo tiện ích (Manifest V3)
content.js      Bắt sự kiện sao chép, lưu từ, bảng từ nổi, xuất CSV
popup.html      Giao diện popup
popup.js        Bật/tắt tiện ích, hiện/ẩn bảng từ
icon.png        Biểu tượng
```

## Tác giả

Vũ Đình Đạt · [@Vudinhdat02](https://github.com/Vudinhdat02)
