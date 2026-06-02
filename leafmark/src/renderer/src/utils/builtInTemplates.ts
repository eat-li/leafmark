/**
 * 内置模板定义
 *
 * 首次运行时自动写入 .leafmark/templates/ 目录。
 * 用户可自由修改或删除——这些仅作为初始预设。
 */

export interface BuiltInTemplate {
  name: string
  content: string
}

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  {
    name: '日记',
    content: `# {{date}} {{weekday}}

## 今日记录


## 感悟


## 明日计划

`
  },
  {
    name: '会议记录',
    content: `# {{title}}

> **日期**：{{date}} {{time}}
> **参会人**：

## 议题


## 讨论要点


## 结论与待办

- [ ]

## 下次会议

`
  },
  {
    name: '读书笔记',
    content: `# {{title}}

> **书名**：
> **作者**：
> **阅读日期**：{{date}}

## 核心观点


## 精彩摘录

>

## 个人思考


## 行动清单

- [ ]

`
  }
]
