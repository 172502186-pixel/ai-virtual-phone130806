// lib/worldbook-file-vault.ts
// 世界书：从文件库导入长材料并自动分切为条目与生成触发关键词。

import { FileVaultEntry, buildImportedDocument, countDocChars } from "./chat-document-import";

export type WorldBookGeneratedEntry = {
  name: string;
  keys: string[];
  content: string;
  enabled: boolean;
};

// 提取候选触发词：从标题和首句中提取有意义的词汇，过滤无意义通用词
const STOP_WORDS = new Set([
  "第", "章", "节", "回", "篇", "部", "的", "了", "和", "是", "就", "都", "而", "及",
  "与", "着", "或", "一个", "没有", "我们", "你们", "他们", "这里", "那里", "这个", "那个",
  "开头", "全文", "片段", "未命名", "材料", "内容", "第一段", "第二段",
]);

function extractKeywordsFromText(title: string, content: string): string[] {
  const keys: string[] = [];

  // 1. 优先使用章节标题或材料标题作为核心关键词
  const cleanTitle = title.replace(/第[零一二三四五六七八九十百千万\d]+[章节回卷篇部]/g, "").trim();
  if (cleanTitle && !STOP_WORDS.has(cleanTitle) && cleanTitle.length >= 2) {
    keys.push(cleanTitle);
  }

  // 2. 从内容首句提取实体/关键词
  const firstSentence = content.split(/[。！？\n]/)[0] || "";
  const matches = firstSentence.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
  for (const m of matches) {
    if (!STOP_WORDS.has(m) && !keys.includes(m)) {
      keys.push(m);
      if (keys.length >= 3) break;
    }
  }

  // 3. 兜底保护：如果没有有效关键词，使用文档标题兜底，防止产生产生无法命中的空条目
  if (keys.length === 0) {
    keys.push(title || "默认触发词");
  }

  return keys;
}

export function convertVaultEntryToWorldBookEntries(
  entry: FileVaultEntry
): WorldBookGeneratedEntry[] {
  const doc = buildImportedDocument({
    title: entry.title,
    ext: entry.sourceType || "txt",
    text: entry.text,
    source: "library",
    category: entry.category,
    tags: entry.tags,
    note: entry.note,
  });

  return doc.chapters.map((ch, idx) => {
    const entryName = `${entry.title} - ${ch.title}`;
    const keys = extractKeywordsFromText(ch.title, ch.text);
    return {
      name: entryName,
      keys,
      content: ch.text,
      enabled: true,
    };
  });
}
