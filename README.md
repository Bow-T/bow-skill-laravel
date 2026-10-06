# bow-skill-laravel

Bộ skill cho công nghệ **Laravel / PHP**, dùng với [bow-gid](https://github.com/Bow-T/bow-gid).
Theo hướng **mỗi công nghệ một repo**: bộ này chỉ lo Laravel; dự án tick nó CÙNG với bộ cơ sở dữ liệu
(`mysql`…), bộ thanh toán (`stripe`) và các bộ dùng chung (`commit`, `process`) ở ô **Công nghệ**.

## Cấu trúc

```
bow-skill-laravel/
├── bow-skill.json        # manifest: id "laravel" + quy tắc tự nhận diện repo
├── THIRD_PARTY.md        # chép từ đâu, commit nào, đã sửa gì, đã xem gì mà KHÔNG lấy
├── LICENSES/             # văn bản giấy phép của nguồn
├── tools/build.mjs       # dựng lại skills/ từ bản clone laravel/boost (không được trải vào dự án)
└── skills/
    ├── laravel-best-practices/          # 19 file rule: Eloquent, truy vấn, validation, bảo mật, queue…
    ├── laravel-testing-best-practices/  # 9 file rule: test gì, đặt tên, assertion, cô lập, bảo mật…
    └── laravel-infer-conventions/       # dò quy ước THẬT của codebase (49 chiều) → khối quy ước
```

| Skill | Dùng khi | Nguồn |
| --- | --- | --- |
| `laravel-best-practices` | viết / sửa / review code Laravel: controller, model, migration, truy vấn, validation, job, lịch, cache | Laravel (MIT) |
| `laravel-testing-best-practices` | viết hoặc soát test: chọn thứ cần test, đặt tên, assertion, dữ liệu, fake, test bảo mật | Laravel (MIT) |
| `laravel-infer-conventions` | người dùng bảo "dò / ghi lại quy ước của dự án" — chỉ chạy khi được yêu cầu rõ | Laravel (MIT) |

Cả ba là skill **chính thức của Laravel**, lấy từ `laravel/boost` (xem [`THIRD_PARTY.md`](THIRD_PARTY.md)).
Đã chọn ít mà chắc: 10 repo khác đã xem và không lấy, lý do từng nguồn ghi trong file đó.

## Ba điều nên biết

**1. Quy ước của codebase thắng skill.** Hai skill chính đều mở đầu bằng "Consistency First": xem file
bên cạnh làm thế nào rồi làm theo; rule chỉ là mặc định cho chỗ chưa có nếp. Hợp với codebase lâu năm —
agent không tự đi "hiện đại hoá" thứ đang chạy.

**2. Dùng được cho Laravel 10.** Rule viết theo cú pháp Laravel mới nhất. `laravel-best-practices` có thêm
bảng những API không tồn tại ở Laravel 10 và dạng tương ứng (đã đối chiếu với mã nguồn `v10.48.22`), kèm
chỉ dẫn đọc phiên bản đang cài trong `composer.lock` trước khi áp rule.

**3. Test không được xoá database.** Rule gốc khuyên `LazilyRefreshDatabase`; trait đó chạy
`migrate:fresh` — xoá mọi bảng. Bản ở đây bắt agent tìm hiểu test đang chạy trên database nào trước khi
chọn trait, và theo trait các test sẵn có khi schema không dựng lại được từ migration.

Bản test là nhánh **PHPUnit**. Dự án dùng Pest vẫn dùng được phần thiết kế test; cú pháp thì theo test Pest
sẵn có của dự án.

## Tự nhận diện

bow-gid tự tick bộ này cho dự án chưa khai công nghệ khi repo khớp quy tắc ở `targets.detect`:

| Quy tắc | Nghĩa |
| --- | --- |
| `composer.json` chứa `"laravel/framework"` | ứng dụng Laravel (tìm cả trong thư mục con, tới 3 cấp) |

Chỉ soi file git đã track. Repo PHP không dùng Laravel (Symfony, WordPress…) sẽ KHÔNG khớp.

## Đăng ký vào bow-gid

Thêm vào `stacks` của `~/.bow-gid/registry.json` (bow chỉ tải repo có trong danh sách này, đúng tag đã ghim):

```json
{ "id": "laravel", "label": "Laravel (PHP)", "repo": "github.com/Bow-T/bow-skill-laravel", "ref": "v1.0.0" }
```

Thử local trước khi đẩy GitHub: `"repo": "file:///đường/dẫn/tới/bow-skill-laravel"`.

Mẹo: `laravel-infer-conventions` hiếm khi dùng — khai tên nó vào `.claude/skills/.bow-name-only` của repo
dự án thì mỗi lượt chỉ nạp TÊN thay vì cả đoạn mô tả.

## Phát hành phiên bản mới

Sửa qua PR → tăng `version` trong `bow-skill.json` → gắn tag (`git tag v1.0.1 && git push --tags`) → cập
nhật `ref` trong registry. bow tải theo tag và cache theo `<id>@<ref>`, nên sửa nội dung mà giữ nguyên tag sẽ
KHÔNG được tải lại.

**Đừng sửa tay file trong `skills/`** — sửa `tools/build.mjs` (thêm một `patch()` có nhãn) rồi chạy lại,
không thì lần cập nhật từ nguồn kế tiếp sẽ ghi đè mất. Cách cập nhật: cuối `THIRD_PARTY.md`.
