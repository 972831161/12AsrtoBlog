---
name: fix-mcp-path
description: 修复 MCP 运行时 "executable file not found in $PATH" (如找不到 docker) 的问题，提供通过环境变量修复该配置的方法。
---

# Fix MCP PATH Issue (修复环境变量指南)

本 Skill 用于处理大模型客户端连接 MCP (Model Context Protocol) Server 时，经常出现的命令丢失报错：`Error: exec: "docker": executable file not found in $PATH`。

## 核心原因

客户端 (如 AI 编辑器) 在启动内部 MCP 进程时，默认的环境变量 `$PATH` 中通常只包含系统级基础路径（如 `/usr/bin:/bin:/usr/sbin:/sbin`），而遗漏了第三方程序（Homebrew 或 Docker Desktop）常用的安装路径（如 `/usr/local/bin`、`/opt/homebrew/bin`）。这会导致 MCP 在尝试调用 `docker`、`node` 等外部命令时失败。

如果仅仅是尝试把 `command` 修改为绝对绝对路径（如 `/usr/local/bin/docker`），不仅某些脚本依赖内联命令仍然可能会报错，而且经常会被一些 AI 客户端的 UI 面板（如在设置里点了保存）自动覆盖还原成普通的 `"docker"`。

## 最佳修复方案

最稳定且一劳永逸解决该方式的方法：在特定 MCP Server 的配置内，显式提供完整的 `"PATH"` 环境变量。

### 操作步骤

1. 找到大模型的级联/MCP配置文件（例如：`~/.gemini/antigravity/mcp_config.json` 或其他编辑器特定的 JSON）。
2. 定位到受影响的 MCP 服务器节点（例如 `"github-mcp-server"`）。
3. 检查是否有 `"env"` 属性；如果没有，创建它。
4. 在 `"env"` 下新增 `"PATH"` 项，加入常用的本地命令搜索路径即可。

### 配置参考示例

```json
{
  "mcpServers": {
    "github-mcp-server": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here",
        "PATH": "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Applications/Docker.app/Contents/Resources/bin"
      }
    }
  }
}
```

### 验证生效

修改完毕后，**请务必重启你当前的 AI 客户端程序或强制重启 MCP 进程**，以便它能应用最新的注入变量读取 `command`。
