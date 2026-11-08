<p align="center"><img src="brand/skein-logo.svg" alt="Skein UI" width="72" height="72" /></p>

# Skein Mail

[English](README.md) | **简体中文**

[Skein UI](https://github.com/skeinui/skein) 的邮件客户端界面示例，数据用 mock，不需要后端。

**在线体验：<https://skein-mail.skeinui.com>**（用 `admin` / `admin123` 登录）

它是 `skein create` 的 `admin` 模板，加上一个邮箱界面：所有页面都由现有的 `@skeinui/ui` 组件搭成，所有请求由 [MSW](https://mswjs.io) 在浏览器里应答。

## 演示了什么

- **邮箱在菜单里**：收件箱、草稿箱、已发送、归档、垃圾邮件、已删除，各是一个页面和一个页签（搜索、筛选和打开的邮件按邮箱分别保留）。
- **列表和阅读区**：未读和星标的行、附件、搜索框、全部 / 未读 / 星标筛选、分页。打开邮件会标为已读；加星标、标为未读、归档、移回收件箱和删除立即生效。
- **写邮件抽屉**：收件人、抄送、主题、正文、附件；可以发送，也可以存为草稿。草稿用“编辑”再次打开，保存或发送后替换原来的草稿。回复会引用原文。
- **删除**：在任何邮箱里删除都是移到“已删除”；在“已删除”里删除会先确认，之后就彻底没了。
- **Skein UI 自带的能力**：四个主题（HeroUI、Ant Design、shadcn/ui、Skein），亮色和暗色，中文和英文，页签、页面缓存和偏好设置抽屉，都来自管理后台外壳。

## 运行

```bash
pnpm install
pnpm dev
```

用 `admin` / `admin123` 登录，应用打开后进入收件箱。

```bash
pnpm check   # skein check（类型、i18n、硬编码颜色、主题覆盖）和 vp check
pnpm build
pnpm clean   # 删除 dist 和 node_modules
```

## 部署

应用是静态文件，所以以纯静态资源的方式部署到 Cloudflare，没有 Worker 代码（`wrangler.jsonc`）：`skein-mail.skeinui.com` 是自定义域名，所有不是文件的路径都返回 `index.html`（`single-page-application`），所以在 `/sent` 上刷新也能正常打开。

```bash
npx wrangler login   # 只需一次
pnpm run deploy      # vp build，再 wrangler deploy
```

生产构建同样保持 mock 开启（`.env.production` 里 `VITE_ENABLE_MOCK=true`），因为这个演示没有后端：线上站点和 `pnpm dev` 一样，在浏览器里应答接口请求。要调用真实接口，把它改成 `false`，并在 `VITE_API_BASE_URL` 里填接口地址。

## 结构

```
src/pages/mail/            邮箱：一个页面，六条路由共用
  api/                     类型和请求（接口形状参考 JMAP）
  mocks/                   240 封固定种子的邮件和接口的 MSW 处理函数
  components/              列表、阅读区和写邮件抽屉
  locales/                 中英文文案
src/pages/<邮箱>/          inbox、drafts、sent、archive、junk、trash：各有一个 `_meta.ts`（菜单项）
src/routes/_auth/<邮箱>.tsx   各有一条路由，渲染 `<MailPage box="…" />`
src/lib/list-query/        列表的约定：页码、排序、关键词和由条件与条件组构成的筛选
```

- **菜单来自页面目录**：有 `_meta.ts`（图标、`{ zh, en }` 名称、顺序）的目录就是一个菜单项，所以六个邮箱不需要注册。
- **列表用 `ListQuery` 请求**：邮箱、未读、星标是同一个标准筛选里的条件，搜索框是它的关键词（`POST /api/mail/emails/search`）。mock 用 `applyListQuery` 在它的邮件上执行查询；换一个后端就通过 `QueryAdapter` 转换。
- **接口**，按 mock 的应答：

  | 请求                           | 作用                                    |
  | ------------------------------ | --------------------------------------- |
  | `GET /api/mail/mailboxes`      | 各邮箱，带总数和未读数                  |
  | `POST /api/mail/emails/search` | 按 `ListQuery` 返回一页邮件             |
  | `GET /api/mail/emails/:id`     | 一封邮件：人、正文、附件                |
  | `PATCH /api/mail/emails/:id`   | 已读状态、星标、移到别的邮箱            |
  | `DELETE /api/mail/emails/:id`  | 移到已删除；在已删除里则彻底删除        |
  | `POST /api/mail/emails`        | 发送，或存为草稿（`replaces` 一份草稿） |

## 没有的

这是界面的示例，不是邮件服务器：没有真正的收发，刷新后数据不保留，附件只有名称和大小，邮件正文是纯文本 / Markdown（真实的 HTML 邮件需要净化，组件库不做这件事）。

## 了解更多

- [Skein UI](https://github.com/skeinui/skein)：组件、主题和生成这个项目的 CLI。
- `AGENTS.md`：在这个项目里工作的规则（编程智能体也会读它）。

## 参与贡献

Skein UI 是开源项目，开发过程完全公开，欢迎任何形式的参与。

- **点一个 Star。** 如果 Skein UI 对你有帮助，在 [GitHub](https://github.com/skeinui/skein) 上点一个 ⭐ 是最简单的支持方式：它能让更多开发者发现这个项目，也是对我们方向的肯定。
- **反馈问题与建议**：在 [Issues](https://github.com/skeinui/skein/issues) 中提交 bug 或功能需求。附上最小复现，或 [skeinui.com](https://skeinui.com) 上对应页面的链接，能帮助我们更快处理。
- **提交 Pull Request**：修复、新组件、新主题风格、文档改进都欢迎。开发环境见[开发](https://github.com/skeinui/skein#development)，提交前请运行 `pnpm check`。
- **加入核心开发团队**：我们在寻找愿意长期参与组件 API、主题风格和 AI 编程工具链建设的伙伴。期待与你一起把 Skein UI 做好。

## 许可证

MIT
