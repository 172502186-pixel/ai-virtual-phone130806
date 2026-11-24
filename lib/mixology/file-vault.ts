// lib/mixology/file-vault.ts
// 独家特调：从文件库导入长材料的领域转换层。
//
// 知识点梳理：
// 1. 配方 (MixRecipe) 只有槽位指向，不存正文；正文存在材料 (MixMaterial) 里。
// 2. 角色卡材料对应 profileText / worldText，且 profileMode 必须设为 "freeform"，否则会被清空。
// 3. 文本类材料（酒基/配料/杯饰等）正文放进 content。
// 4. 代码类 (ticket / garnish / encore / filter / mechanism) 不开放长文档导入。

import { FileVaultEntry } from "../chat-document-import";

export const MIX_FILE_VAULT_KINDS = [
  { kind: "base", label: "基酒 / 核心文本", targetSlot: "base" },
  { kind: "modifier", label: "调和 / 补充设定", targetSlot: "modifier" },
  { kind: "bitters", label: "苦精 / 禁忌约束", targetSlot: "bitters" },
  { kind: "persona", label: "面具 / 人物设定", targetSlot: "persona" },
  { kind: "character", label: "角色卡 / 完整人设", targetSlot: "character" },
] as const;

export type MixFileVaultTargetKind = (typeof MIX_FILE_VAULT_KINDS)[number]["kind"];

export function convertVaultEntryToMaterial(
  entry: FileVaultEntry,
  targetKind: MixFileVaultTargetKind
): any {
  const now = Date.now();
  const id = `mat_fv_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const title = entry.title || "未命名文件库材料";

  if (targetKind === "character") {
    return {
      id,
      kind: "character",
      name: title,
      summary: entry.note || entry.category || "从文件库导入的角色材料",
      profileMode: "freeform", // 关键防坑点：freeform 保证 profileText 不被覆盖
      profileText: entry.text,
      worldText: entry.note ? `【备注】${entry.note}` : "",
      tags: entry.tags || [],
      createdAt: now,
      updatedAt: now,
    };
  }

  if (targetKind === "persona") {
    return {
      id,
      kind: "persona",
      name: title,
      summary: entry.note || entry.category || "从文件库导入的人格面具",
      content: entry.text,
      tags: entry.tags || [],
      createdAt: now,
      updatedAt: now,
    };
  }

  return {
    id,
    kind: targetKind,
    name: title,
    summary: entry.note || entry.category || `从文件库导入的${targetKind}材料`,
    content: entry.text,
    tags: entry.tags || [],
    createdAt: now,
    updatedAt: now,
  };
}
