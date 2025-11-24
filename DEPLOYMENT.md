# 部署说明文档

## 问题诊断

错误信息：`Uncaught ReferenceError: Cannot access 'o0' before initialization`

这是部署到服务器后常见的问题，主要原因：

1. **静态资源路径配置错误** - 最常见原因
2. **服务器未配置 SPA 路由支持**
3. **循环依赖导致初始化问题**

---

## 解决方案

### 步骤 1: 重新构建项目

已经修改了 `vite.config.js`，添加了 `base: './'` 配置。

现在重新构建项目：

```powershell
# 清理旧的构建文件
Remove-Item -Path dist -Recurse -Force -ErrorAction SilentlyContinue

# 重新构建
npm run build
```

### 步骤 2: 服务器配置

由于使用了 Vue Router 的 `history` 模式，需要服务器支持：

#### Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache 配置示例：

在 `dist` 目录下创建 `.htaccess` 文件：

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### 步骤 3: 验证构建产物

构建完成后，检查 `dist/index.html` 中的资源引用：

- 应该看到类似 `./assets/js/...` 的相对路径
- 而不是 `/assets/js/...` 的绝对路径

---

## 部署检查清单

- [ ] 运行 `npm run build` 重新构建
- [ ] 检查 `dist/index.html` 中资源路径是否为相对路径
- [ ] 确认服务器配置了 SPA 路由回退
- [ ] 确认后端 API 地址正确（生产环境地址）
- [ ] 检查浏览器控制台是否还有其他错误
- [ ] 清除浏览器缓存后重新访问

---

## 如果问题仍然存在

### 方案 A: 使用 Hash 模式路由（最简单）

修改 `src/router/index.js`，将 `createWebHistory` 改为 `createWebHashHistory`：

```javascript
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(), // 使用 Hash 模式
  routes
})
```

优点：不需要服务器配置
缺点：URL 会有 `#` 符号

### 方案 B: 检查循环依赖

如果问题仍存在，可能是代码中的循环依赖导致。检查：

1. 组件之间是否相互导入
2. 路由配置是否有循环引用
3. API 文件之间是否有交叉引用

---

## 生产环境 API 配置

别忘了检查 `src/utils/request.js` 中的 API 地址：

```javascript
// 开发环境使用代理
const baseURL = import.meta.env.MODE === 'production' 
  ? 'http://183.230.195.24:7925'  // 生产环境真实地址
  : '/api'  // 开发环境使用代理
```

---

## 快速测试

构建后本地测试：

```powershell
npm run build
npm run preview
```

然后访问 http://localhost:4173 查看是否正常。
