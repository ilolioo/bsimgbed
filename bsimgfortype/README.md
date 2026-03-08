# BSImg 图床 for Typecho

将 Typecho 后台上传的图片接管到 [BSImg 图床（bsimgbed）](https://github.com/ilolioo/bsimgbed)，减轻站点存储压力并统一图片管理。

## 功能

- **自动接管上传**：在 Typecho 后台撰写文章时上传的图片会同步到 bsimgbed，前台显示的图片地址为图床 URL。
- **公共 / 私有上传**：支持图床公共上传（需在 bsimgbed 后台开启）或使用 API Key 私有上传。
- **修改附件**：替换已有附件时，新文件也会上传到图床并更新为图床链接。

## 安装

1. 将本目录 `bsimgfortype` 整体放到 Typecho 的 `usr/plugins/` 下。
2. 在 Typecho 后台 → **控制台** → **插件** 中启用 **Bsimgfortype**。
3. 点击 **设置**，填写图床地址与（可选）API Key，保存。

## 配置说明

| 配置项     | 说明 |
|------------|------|
| **图床地址** | 您的 bsimgbed 站点根地址，如 `https://img.example.com`。 |
| **上传方式** | **公共上传**：使用图床 `/api/upload/public`，需在 bsimgbed 后台开启“公共上传”。**私有上传**：使用 `/api/upload/private`，需填写 API Key。 |
| **API Key**  | 选择“私有上传”时必填。在 bsimgbed 后台「我的」→ API 管理中创建。 |
| **储存桶 ID** | 可选。图床多储存桶时填写。 |
| **请求超时** | 上传请求超时时间（秒），默认 30。 |
| **SSL 验证** | 是否验证图床 HTTPS 证书，建议开启。 |

## 使用说明

- 启用并配置后，**新上传**的图片会自动传到图床，文章中使用的即为图床链接。
- **已有附件**不会自动迁移；若希望迁到图床，可删除后重新上传，或使用其他迁移方式。
- 图床需允许跨域访问，以便部分主题或编辑器中的图片正常显示。

## API 与图床说明

- 公共上传：`POST {图床地址}/api/upload/public`，表单字段 `file`。
- 私有上传：`POST {图床地址}/api/upload/private`，请求头 `X-API-Key: 您的Key`，表单字段 `file`。

更多接口说明请在图床后台 **系统设置 → API 文档** 中查看。

## 兼容性

- Typecho 1.2+
- PHP 7.4+（需开启 allow_url_fopen 或 curl 用于请求图床）

## 许可

Apache-2.0，与 [bsimgbed](https://github.com/ilolioo/bsimgbed) 一致。
