// Dựng skills/ từ bản clone laravel/boost (dựng template Blade cho dự án PHPUnit, không Sail).
// Dùng (từ gốc repo): node tools/build.mjs <thư mục clone laravel/boost>
// Mọi chỗ sửa so với nguồn đều đi qua patch() — neo phải khớp ĐÚNG một lần, lệch là dừng,
// nên nguồn đổi câu chữ thì script báo ngay chỗ cần xem lại thay vì âm thầm bỏ sót.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const boostClone = process.argv[2];
if (!boostClone) throw new Error('thiếu đường dẫn bản clone nguồn');
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s.endsWith('\n') ? s : `${s}\n`);
};
function patch(text, find, replace, label) {
  const n = text.split(find).length - 1;
  if (n !== 1) throw new Error(`patch "${label}": neo khớp ${n} lần (cần 1)`);
  return text.replace(find, () => replace);
}

// ---------------------------------------------------------------------------------------------
// Dựng template Blade của Laravel Boost cho dự án KHÔNG có Pest / Dusk / Sail.
// Chỉ hiểu đúng các chỉ thị nguồn dùng; gặp thứ lạ là dừng (không đoán).
// ---------------------------------------------------------------------------------------------
const PHPUNIT_DOCS = 'the PHPUnit documentation at `https://phpunit.de/documentation.html`';
const COND = new Map([
  ['$pest', false],
  ['! $pest', true],
  ['$pest5', false],
  ['$browserPlugin || $dusk', false],
  ['$browserPlugin', false],
  ["$pest && $assist->hasPackage('pestphp/pest-plugin-browser')", false],
  ["$assist->hasPackage('laravel/dusk')", false],
]);
const ECHO = new Map([
  ["$pest ? 'Laravel and Pest API syntax' : 'Laravel API syntax'", 'Laravel API syntax'],
  ['$phpunitDocs', PHPUNIT_DOCS],
  ["$pest ? 'Pest' : 'PHPUnit'", 'PHPUnit'],
  ["$pest ? '`pestphp/pest-plugin-browser`' : '`laravel/dusk`'", '`laravel/dusk`'],
  [
    "$pest ? '`https://pestphp.com/docs/expectations.md` for the expectations of Pest' : $phpunitDocs.' for the assertions of PHPUnit'",
    `${PHPUNIT_DOCS} for the assertions of PHPUnit`,
  ],
]);
function cond(expr, where) {
  if (!COND.has(expr)) throw new Error(`${where}: điều kiện lạ: ${expr}`);
  return COND.get(expr);
}
function echo(expr, where) {
  let m;
  if ((m = expr.match(/^\$assist->artisanCommand\('([^']*)'\)$/))) return `php artisan ${m[1]}`;
  if ((m = expr.match(/^\$assist->composerCommand\('([^']*)'\)$/))) return `composer ${m[1]}`;
  if ((m = expr.match(/^\$assist->binCommand\('([^']*)'\)$/))) return `vendor/bin/${m[1]}`;
  if (ECHO.has(expr)) return ECHO.get(expr);
  throw new Error(`${where}: biểu thức lạ: ${expr}`);
}
function renderBlade(src, where) {
  const outLines = [];
  const stack = []; // { parent, taken, on }
  const active = () => stack.every((f) => f.on);
  let inPhp = false;
  for (const line of src.split('\n')) {
    const t = line.trim();
    if (inPhp) {
      if (t === '@endphp') inPhp = false;
      continue;
    }
    if (t === '@php') {
      inPhp = true;
      continue;
    }
    let m;
    if ((m = t.match(/^@if\((.*)\)$/))) {
      const parent = active();
      const on = parent && cond(m[1], where);
      stack.push({ parent, taken: on, on });
      continue;
    }
    if ((m = t.match(/^@elseif\((.*)\)$/))) {
      const f = stack.at(-1);
      if (!f) throw new Error(`${where}: @elseif lạc`);
      f.on = f.parent && !f.taken && cond(m[1], where);
      f.taken ||= f.on;
      continue;
    }
    if (t === '@else') {
      const f = stack.at(-1);
      if (!f) throw new Error(`${where}: @else lạc`);
      f.on = f.parent && !f.taken;
      f.taken = true;
      continue;
    }
    if (t === '@endif') {
      if (!stack.pop()) throw new Error(`${where}: @endif lạc`);
      continue;
    }
    if (!active()) continue;
    let s = line.replace(/@if\(((?:[^()]|\([^()]*\))*)\)(.*?)@endif/g, (_, c, body) => (cond(c, where) ? body : ''));
    s = s.replace(/(?<!@)\{\{\s*(.*?)\s*\}\}/g, (_, e) => echo(e, where));
    s = s.replaceAll('@{{', '{{').replaceAll('@{!!', '{!!').replaceAll('@@', '@');
    outLines.push(s);
  }
  if (stack.length || inPhp) throw new Error(`${where}: khối chưa đóng`);
  const text = outLines.join('\n').replace(/\n{3,}/g, '\n\n');
  for (const bad of ['$assist', '$pest', '$phpunit', '$dusk', '$browserPlugin', '@endif', '@if(', '@php', '___']) {
    if (text.includes(bad)) throw new Error(`${where}: còn sót "${bad}" sau khi dựng`);
  }
  return text;
}
// Frontmatter kết bằng `---` rồi tới thân: bảo đảm có một dòng trống ở giữa.
const spaceAfterFrontmatter = (s) => s.replace(/^(---\n[\s\S]*?\n---\n)(?!\n)/, '$1\n');

/** Chép một skill của Boost: file .md giữ nguyên, file .blade.php dựng thành .md. */
function copyBoostSkill(srcDir, dstDir, transforms = {}) {
  fs.rmSync(dstDir, { recursive: true, force: true });
  const walk = (rel) => {
    for (const ent of fs.readdirSync(path.join(srcDir, rel), { withFileTypes: true })) {
      const r = path.join(rel, ent.name);
      if (ent.isDirectory()) {
        walk(r);
        continue;
      }
      let text = read(path.join(srcDir, r));
      let outRel = r;
      if (r.endsWith('.blade.php')) {
        const pre = transforms[`pre:${r}`];
        if (pre) text = pre(text);
        text = spaceAfterFrontmatter(renderBlade(text, r));
        outRel = r.replace(/\.blade\.php$/, '.md');
      } else if (!r.endsWith('.md')) {
        throw new Error(`file không phải Markdown trong skill: ${r}`);
      }
      const post = transforms[outRel];
      if (post) text = post(text);
      write(path.join(dstDir, outRel), text);
    }
  };
  walk('');
}

// ---------------------------------------------------------------------------------------------
// Ba skill
// ---------------------------------------------------------------------------------------------
const boost = path.join(boostClone, '.ai');
const laravelSkills = path.join(repoRoot, 'skills');

const VERSION_NOTE = `## Installed Laravel Version

> Added by the bow copy of this skill. It is not part of the upstream text.

\`search-docs\` is a tool of the Laravel Boost MCP server, which needs Laravel 11.45 or later. When the session does not have it, read the documentation of the installed major version at \`https://laravel.com/framework/docs/<major>.x/<page>\` (for example \`10.x/eloquent\`), or read the framework source in \`vendor/laravel/framework\`.

Read the installed version from \`composer.lock\` (\`laravel/framework\`) before you apply a rule. The rule files use current Laravel syntax. These parts do not exist on Laravel 10 (checked against v10.48.22):

| In the rule files | On Laravel 10 |
| --- | --- |
| \`protected function casts(): array\` | the \`protected $casts\` property |
| \`#[Scope]\` on a protected method | a public \`scopeActive($query)\` method |
| \`#[CollectedBy(...)]\` | an override of \`newCollection()\` |
| \`Schedule::command()\` in \`routes/console.php\`, schedule \`group()\` | \`$schedule->command()\` in \`app/Console/Kernel.php\`, no groups |
| \`withExceptions()\` in \`bootstrap/app.php\`, \`shouldRenderJsonWhen()\`, \`ShouldntReport\` | \`register()\` and \`$dontReport\` in \`app/Exceptions/Handler.php\` |
| \`defer()\`, \`once()\`, \`Context\`, \`Concurrency::run()\`, \`Uri\` | not available |
| \`Cache::flexible()\`, \`Cache::memo()\`, the \`failover\` cache store | not available |
| \`Http::failedConnection()\` | a fake callback that throws \`Illuminate\\Http\\Client\\ConnectionException\` |
`;

copyBoostSkill(path.join(boost, 'laravel/skill/laravel-best-practices'), path.join(laravelSkills, 'laravel-best-practices'), {
  'SKILL.md': (s) => {
    s = patch(
      s,
      'For exact API syntax, verify with `search-docs`.\n\n## Consistency First',
      `For exact API syntax, verify with \`search-docs\`.\n\n${VERSION_NOTE}\n## Consistency First`,
      'best-practices: ghi chú phiên bản',
    );
    return patch(s, 'the `testing-best-practices` skill', 'the `laravel-testing-best-practices` skill', 'best-practices: tên skill test');
  },
});

const TESTING_NOTE = `## Notes for This Copy

> Added by the bow copy of this skill. It is not part of the upstream text.

- This copy holds the PHPUnit branch of the upstream template. When \`composer.json\` has \`pestphp/pest\`, the design rules still apply, and the syntax comes from the project's existing Pest tests.
- \`search-docs\` is a tool of the Laravel Boost MCP server, which needs Laravel 11.45 or later. When the session does not have it, read \`https://laravel.com/framework/docs/<major>.x/<page>\` for the installed major version, or the framework source in \`vendor/laravel/framework\`.
- Find the database that the tests use before you choose a database trait. Read \`phpunit.xml\`, \`.env.testing\`, and the traits and \`setUp()\` guards of the existing tests. \`RefreshDatabase\`, \`LazilyRefreshDatabase\`, and \`DatabaseMigrations\` run \`migrate:fresh\`, which drops every table in that database. If the migrations alone cannot rebuild the schema (for example, the schema starts from an SQL dump), or the connection is not a disposable test database, use the trait of the existing tests (commonly \`DatabaseTransactions\`) and do not add a refreshing trait.
- \`Exceptions::fake()\`, \`WithCachedConfig\`, and \`WithCachedRoutes\` do not exist on Laravel 10 (checked against v10.48.22). Skip the items that need them.
`;

copyBoostSkill(path.join(boost, 'laravel/skill/testing-best-practices'), path.join(laravelSkills, 'laravel-testing-best-practices'), {
  'SKILL.md': (s) => {
    s = patch(s, 'name: testing-best-practices\n', 'name: laravel-testing-best-practices\n', 'testing: tên');
    s = patch(
      s,
      'This project uses PHPUnit. Follow the corresponding guidance in each rule.\n',
      `This copy is written for PHPUnit. Follow the corresponding guidance in each rule.\n\n${TESTING_NOTE}`,
      'testing: ghi chú',
    );
    // Nhánh "không có Dusk" của template nói thay cho MỌI dự án dùng bản chép này → đổi thành điều kiện.
    return patch(
      s,
      'Real-browser tests require `laravel/dusk` and a browser download, neither of which this project installs. Mention the package only if the user asks for a real-browser test.',
      'Real-browser tests require `laravel/dusk` and a browser download. If `composer.json` does not have `laravel/dusk`, mention the package only if the user asks for a real-browser test.',
      'testing: câu về Dusk',
    );
  },
  'rules/isolation.md': (s) =>
    patch(
      s,
      '- Use `LazilyRefreshDatabase` instead of `RefreshDatabase`. A test that does not use the database then does not run the migrations.',
      '- Use `LazilyRefreshDatabase` instead of `RefreshDatabase`. A test that does not use the database then does not run the migrations. Read the database note in `SKILL.md` first: both traits drop every table.',
      'testing: cảnh báo trait làm mới DB',
    ),
});

const FRONTEND_IF =
  "@if($assist->hasPackage('livewire/livewire') || $assist->hasPackage('inertiajs/inertia-laravel') || $assist->hasPackage('livewire/flux') || $assist->hasPackage('livewire/flux-pro'))\n";
const INFER_NOTE = `## Without Laravel Boost

> Added by the bow copy of this skill. It is not part of the upstream text.

\`record-rule\`, \`.ai/rules\`, and \`search-docs\` belong to Laravel Boost, which needs Laravel 11.45 or later. In a session without them:

- Step 0: read the agent instruction files of the repository (\`CLAUDE.md\`, \`AGENTS.md\`, \`.claude/CLAUDE.md\`) in place of \`.ai/rules\`. A convention that is already written there is Already-recorded.
- Steps 1 to 3 only read the code. Run them as written.
- Step 4: do not call \`record-rule\`. Give the approved rules as one Markdown block, grouped by path glob. Write them into \`CLAUDE.md\` under a \`## Conventions\` heading only when the user asks for that.
- Step 5: remind the user to commit the file that received the rules.
`;

copyBoostSkill(path.join(boost, 'boost/skill/infer-conventions'), path.join(laravelSkills, 'laravel-infer-conventions'), {
  'pre:SKILL.blade.php': (s) =>
    patch(
      s,
      `${FRONTEND_IF}This app ships a frontend stack, so the frontend checklist group applies. Sweep it.\n@else\nThis app has no Livewire/Inertia/Flux packages installed. Treat the frontend group as likely API-only: confirm from \`resources/views\` before spending time there, and skip the Livewire/Inertia/Flux dimensions.\n@endif\n`,
      'If `composer.json` has `livewire/livewire`, `inertiajs/inertia-laravel`, `livewire/flux`, or `livewire/flux-pro`, this app ships a frontend stack, so the frontend checklist group applies. Sweep it. If it has none of them, treat the frontend group as likely API-only: confirm from `resources/views` before spending time there, and skip the Livewire/Inertia/Flux dimensions.\n',
      'infer: nhánh frontend (SKILL)',
    ),
  'SKILL.md': (s) => {
    s = patch(s, 'name: infer-conventions\n', 'name: laravel-infer-conventions\n', 'infer: tên');
    s = patch(s, 'disable-model-invocation: true\n', '', 'infer: bỏ cờ chỉ người dùng gọi');
    s = s.replace(
      /^description: .*$/m,
      () =>
        'description: "Use this skill to analyze how a Laravel application is actually written and record its conventions as shared rules. Trigger when the user wants to detect, infer, document, or standardize project conventions or coding style, resolve mixed or conflicting patterns (e.g. \\"are we using Form Requests or inline validation?\\"), or onboard agents and teammates to \\"how we do things here\\". Covers a systematic sweep of ~49 Laravel convention dimensions (validation, models, architecture, testing, frontend, database, console), open-ended house-pattern discovery, and conflict reporting. Only run this skill when the user explicitly asks for it; never start a sweep as part of another task. Do not use for one-off code review or enforcing formatting a linter already handles."',
    );
    return patch(
      s,
      'You are documenting reality, not improving it.\n\n## Ground Rules (read before you start)',
      `You are documenting reality, not improving it.\n\n${INFER_NOTE}\n## Ground Rules (read before you start)`,
      'infer: ghi chú không có Boost',
    );
  },
  'pre:references/checklist.blade.php': (s) => {
    s = patch(
      s,
      `${FRONTEND_IF}This app ships a frontend stack, so the items below apply.\n@else\nNo Livewire/Inertia/Flux package is installed. This app may be API-only. Confirm from \`resources/views\` before sweeping, and treat the Livewire/Flux dimensions as not applicable.\n@endif\n`,
      'If `composer.json` has a Livewire, Inertia, or Flux package, this app ships a frontend stack, so the items below apply. If it has none of them, this app may be API-only. Confirm from `resources/views` before sweeping, and treat the Livewire/Flux dimensions as not applicable.\n',
      'infer: nhánh frontend (checklist)',
    );
    s = patch(
      s,
      "@if($assist->hasPackage('livewire/livewire'))\n30. Livewire component format:",
      '30. (Only when `livewire/livewire` is installed.) Livewire component format:',
      'infer: mục 30',
    );
    s = patch(s, 'SFC, MFC, view-based, and class-based formats.\n@endif\n', 'SFC, MFC, view-based, and class-based formats.\n', 'infer: đóng mục 30');
    s = patch(
      s,
      "@if($assist->hasPackage('livewire/flux') || $assist->hasPackage('livewire/flux-pro'))\n31. UI kit (Flux):",
      '31. (Only when `livewire/flux` or `livewire/flux-pro` is installed.) UI kit (Flux):',
      'infer: mục 31',
    );
    return patch(s, '    - Hint: grep `<flux:` in `resources/views`.\n@endif\n', '    - Hint: grep `<flux:` in `resources/views`.\n', 'infer: đóng mục 31');
  },
});

console.log('đã dựng xong skills/');
