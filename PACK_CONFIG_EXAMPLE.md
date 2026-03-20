# 微信小程序 packOptions 配置示例

## 正确的 packOptions.ignore 格式

packOptions.ignore 字段应该是对象数组，每个对象包含以下字段：

### 示例格式
```json
{
  "packOptions": {
    "ignore": [
      {
        "type": "file",
        "value": "README.md"
      },
      {
        "type": "file", 
        "value": "game.js"
      },
      {
        "type": "folder",
        "value": "docs/"
      }
    ],
    "include": []
  }
}
```

### type 字段的可选值
- `"file"`: 忽略单个文件
- `"folder"`: 忽虑整个文件夹
- `"ext"`: 忽略特定扩展名的文件

### value 字段
- 对于 `"file"`: 文件相对路径
- 对于 `"folder"`: 文件夹相对路径
- 对于 `"ext"`: 文件扩展名（如 ".md"）

## 当前项目的简化配置

为了避免配置错误，当前项目使用最简单的配置：
```json
{
  "packOptions": {
    "ignore": [],
    "include": []
  }
}
```