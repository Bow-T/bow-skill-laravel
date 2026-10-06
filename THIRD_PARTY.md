# Nguồn bên ngoài

Cả ba skill ở đây chép từ repo khác. File này ghi: lấy từ đâu, tại commit nào, giấy phép gì, đã sửa gì,
và đã xem những nguồn nào nhưng **không** lấy. Bản chép là **ảnh chụp tại một commit** — bow-gid không tự
kéo bản mới của nguồn. Muốn cập nhật thì làm theo mục cuối, đọc lại phần khác biệt, rồi mới gắn tag.

| Skill | Nguồn | Commit | Giấy phép |
| --- | --- | --- | --- |
| `laravel-best-practices` | [laravel/boost](https://github.com/laravel/boost) `.ai/laravel/skill/laravel-best-practices` (v2.10.2 + 1 commit) | `918abe9a5b5816f5331379281bd860d7fc2f0e10` (2026-10-05) | MIT |
| `laravel-testing-best-practices` | [laravel/boost](https://github.com/laravel/boost) `.ai/laravel/skill/testing-best-practices` | như trên | MIT |
| `laravel-infer-conventions` | [laravel/boost](https://github.com/laravel/boost) `.ai/boost/skill/infer-conventions` | như trên | MIT |

Văn bản giấy phép: [`LICENSES/laravel-boost-MIT.txt`](LICENSES/laravel-boost-MIT.txt).

## Đã sửa gì

Nguồn là **template Blade** (`*.blade.php`): Laravel Boost dựng ra Markdown lúc cài, tuỳ gói của từng dự án
(Pest hay PHPUnit, có Sail không…). bow-gid trải skill dạng file tĩnh nên phải dựng sẵn. Việc dựng + mọi chỗ
sửa nằm trong [`tools/build.mjs`](tools/build.mjs) — mỗi chỗ sửa là một lời gọi `patch()` có nhãn, đọc file
đó là thấy đủ.

**Dựng template (cả ba skill)**

- Lấy nhánh **PHPUnit, không Dusk, không Sail**: lệnh là `php artisan …`, `composer …`. Nhánh Pest bị bỏ.
- 13 file rule vốn là `.md` của `laravel-best-practices` được chép **nguyên văn** (kiểm bằng `cmp`).

**`laravel-best-practices`**

- Thêm mục "Installed Laravel Version": `search-docs` là tool của Laravel Boost (cần Laravel 11.45+) —
  không có thì đọc tài liệu đúng phiên bản; kèm bảng những API trong rule **không có ở Laravel 10**
  (`casts()`, `#[Scope]`, `defer()`, `Context`, `Cache::flexible()`, `bootstrap/app.php`…) và dạng tương
  ứng. Bảng đã đối chiếu với mã nguồn `laravel/framework` tag `v10.48.22`, không viết theo trí nhớ.
- Tên skill test trong bảng chỉ mục đổi theo tên mới.

**`laravel-testing-best-practices`** (nguồn tên `testing-best-practices` — thêm tiền tố để không trùng
skill test của bộ công nghệ khác khi một dự án tick nhiều bộ)

- Câu "This project uses PHPUnit" và câu "…neither of which this project installs" là kết quả dựng cho
  MỘT dự án; ở đây nhiều dự án dùng chung nên đổi thành câu có điều kiện.
- Thêm mục "Notes for This Copy". Quan trọng nhất: rule gốc bảo dùng `LazilyRefreshDatabase`, mà trait đó
  (cùng `RefreshDatabase`, `DatabaseMigrations`) chạy `migrate:fresh` = **xoá mọi bảng**. Dự án có schema
  dựng từ file SQL, hoặc test chạy trên database không phải loại bỏ đi được, thì phải theo trait các test
  sẵn có đang dùng. Rule `isolation.md` được nối thêm một câu trỏ về ghi chú này.
- Ghi rõ `Exceptions::fake()`, `WithCachedConfig`, `WithCachedRoutes` không có ở Laravel 10.

**`laravel-infer-conventions`** (nguồn tên `infer-conventions`)

- Nguồn ghi kết quả bằng tool `record-rule` vào `.ai/rules` của Laravel Boost. Thêm mục "Without Laravel
  Boost": đọc `CLAUDE.md` / `AGENTS.md` thay cho `.ai/rules`, và chỉ **đưa ra** khối quy ước — ghi vào
  `CLAUDE.md` khi người dùng bảo.
- Bỏ `disable-model-invocation: true`: người dùng bow gõ lời thường chứ không gõ `/tên-skill`, để cờ đó là
  skill không gọi được. Mô tả vẫn giữ câu "chỉ chạy khi người dùng yêu cầu rõ", và được rút gọn (bỏ phần
  nhắc `.ai/rules`, `record-rule`).
- Hai nhánh "có / không có Livewire, Inertia, Flux" của template đổi thành câu có điều kiện; mục 30, 31 của
  checklist ghi rõ "chỉ khi gói đó được cài".

## Đã soát gì trước khi chép (2026-10-06)

- Đọc hết nội dung cả ba skill (32 file sau khi dựng).
- Không có script / file thực thi nào được trải — chỉ Markdown. (`tools/build.mjs` nằm ngoài `skills/`,
  bow-gid không trải nó vào repo dự án.)
- Không có ký tự vô hình (tag Unicode, zero-width, bidi).
- Link thật chỉ có `laravel.com/framework/docs/…` và `phpunit.de/documentation.html` (đã mở thử, đều 200);
  còn lại là địa chỉ ví dụ (`api.example.com`…).
- Không có chỉ dẫn gửi dữ liệu ra ngoài hay tải skill từ mạng lúc chạy. Lệnh skill nhắc tới:
  `php artisan …`, `composer audit`.

## Đã xem nhưng KHÔNG lấy

| Nguồn (commit) | Vì sao không lấy |
| --- | --- |
| [laravel/agent-skills](https://github.com/laravel/agent-skills) (`808c170`) — repo skill chính thức | Không có file giấy phép. Ba skill của nó (nâng cấp starter kit — kèm 8 script shell, deploy Laravel Cloud, cấu hình Nightwatch) không ứng với dự án nào đang dùng bộ này |
| laravel/boost — các skill còn lại (Livewire, Inertia, Volt, Folio, Flux, Tailwind, Pennant, Wayfinder, MCP, deploy Cloud) | Dự án đích không dùng các gói đó. Cần thì thêm sau, khai `needs` nếu skill nằm giữa hai công nghệ |
| laravel/boost — guideline `core.blade.php` (laravel, php, phpunit, pint) | Là chỉ dẫn LUÔN BẬT (Boost nối vào `CLAUDE.md`), không phải skill — thuộc về `CLAUDE.md` của repo sản phẩm |
| [spatie/guidelines-skills](https://github.com/spatie/guidelines-skills) (`c310069`, MIT) | `spatie-laravel-php` là quy ước RIÊNG của Spatie và nói ngược bảng đặt tên của skill chính thức (controller số nhiều `PostsController`, tên route camelCase…); mô tả bắt "bật cho mọi việc PHP" nên lần nào cũng nạp cả hai. `spatie-security` là nội quy công ty (1Password, FileVault, Ansible), agent không làm được gì với nó |
| [spatie/boost-spatie-guidelines](https://github.com/spatie/boost-spatie-guidelines) (`1d15ddc`) | Bản cũ của repo trên |
| [JustSteveKing/api-skill](https://github.com/JustSteveKing/api-skill) (`c0fe57a`, MIT) | Đòi Laravel 13+ / PHP 8.5+, và áp một khuôn response mới (Problem+JSON) — với API đang có app di động gọi thì là phá hợp đồng |
| [AsyrafHussin/agent-skills](https://github.com/AsyrafHussin/agent-skills) (`1aa0ff7`, MIT) | Viết cho Laravel 13 / PHP 8.3+ / PHPUnit 12, mỗi skill 100–400 KB, trùng nội dung với bản chính thức |
| [netresearch/php-modernization-skill](https://github.com/netresearch/php-modernization-skill) (`cc996e2`), [netresearch/security-audit-skill](https://github.com/netresearch/security-audit-skill) (`b6dbe57`) | Nội dung theo CC-BY-SA-4.0 (bắt chia sẻ lại cùng giấy phép); kèm script shell / Python, cần `gh` + `jq`; thiên về TYPO3 |
| [jpcaparas/superpowers-laravel](https://github.com/jpcaparas/superpowers-laravel) (`c5198b1`, MIT) | 57 skill nhỏ (Pest, Horizon, Nova, nâng lên Laravel 13…) — 57 dòng mô tả nạp mỗi lượt, nội dung trùng bản chính thức |
| [iSerter/laravel-claude-agents](https://github.com/iSerter/laravel-claude-agents) (`8868214`, MIT) | Trùng nội dung bản chính thức, ngắn hơn |
| [LaravelDaily/AI-Workflows-For-Laravel](https://github.com/LaravelDaily/AI-Workflows-For-Laravel) (`4bff3b6`) | Không có giấy phép |

## Cập nhật từ nguồn

```bash
git clone --depth 1 https://github.com/laravel/boost /tmp/boost && git -C /tmp/boost rev-parse HEAD
node tools/build.mjs /tmp/boost     # nguồn đổi câu chữ ở chỗ đã vá → script dừng và nêu tên chỗ vá
git diff -- skills/                 # ĐỌC phần khác biệt: lệnh, link, mục mới, API theo phiên bản
```

Script chỉ biết các chỉ thị Blade nguồn đang dùng (`@if($pest)`, `{{ $assist->artisanCommand() }}`…); nguồn
thêm chỉ thị / biến mới thì nó dừng chứ không đoán. Sau khi đọc xong: sửa bảng ở đầu file (commit + ngày),
xem lại bảng "không có ở Laravel 10" nếu rule nhắc API mới, tăng `version` trong `bow-skill.json`, gắn tag.
