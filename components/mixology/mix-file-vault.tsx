"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "../ui/modal";
import { FolderOpen, FileText, ChevronRight, Check, Loader2 } from "lucide-react";
import {
  loadFileVaultLibrary,
  FileVaultEntry,
} from "../../lib/chat-document-import";
import {
  MIX_FILE_VAULT_KINDS,
  MixFileVaultTargetKind,
  convertVaultEntryToMaterial,
} from "../../lib/mixology/file-vault";

export type MixFileVaultModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (material: any, targetSlot?: string) => void;
};

export function MixFileVaultModal({
  isOpen,
  onClose,
  onImport,
}: MixFileVaultModalProps) {
  const [entries, setEntries] = useState<FileVaultEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FileVaultEntry | null>(null);
  const [targetKind, setTargetKind] = useState<MixFileVaultTargetKind>("base");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      loadFileVaultLibrary()
        .then(setEntries)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedEntry) return;
    const material = convertVaultEntryToMaterial(selectedEntry, targetKind);
    const targetSlot = MIX_FILE_VAULT_KINDS.find(k => k.kind === targetKind)?.targetSlot;
    onImport(material, targetSlot);
    setSelectedEntry(null);
    onClose();
  };

  return (
    <BottomSheet
      title={selectedEntry ? `导入：${selectedEntry.title}` : "从文件库导入特调材料"}
      onClose={() => {
        if (selectedEntry) {
          setSelectedEntry(null);
        } else {
          onClose();
        }
      }}
    >
      <div className="mix-file-vault-sheet">
        {!selectedEntry ? (
          <div className="mix-fv-list">
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 24,
                  color: "var(--color-text-muted)",
                }}
              >
                <Loader2 size={16} className="animate-spin" />
                正在加载文件库材料...
              </div>
            ) : entries.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 24,
                  color: "var(--color-text-muted)",
                  fontSize: 13,
                }}
              >
                文件库中暂无可用的文档材料。
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="mix-fv-item"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mix-fv-item-title">{entry.title}</div>
                    <div className="mix-fv-item-meta">
                      <span>{entry.charCount} 字</span>
                      {entry.category && (
                        <span className="mix-fv-badge">{entry.category}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ opacity: 0.5 }} />
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mix-fv-detail">
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              将《{selectedEntry.title}》（{selectedEntry.charCount} 字）转换并导入为：
            </div>

            <div className="mix-fv-target-selector">
              <span className="mix-fv-target-label">选择材料类型与目标槽位：</span>
              <div className="mix-fv-target-grid">
                {MIX_FILE_VAULT_KINDS.map((k) => (
                  <button
                    key={k.kind}
                    type="button"
                    className={`mix-fv-target-btn ${targetKind === k.kind ? "active" : ""}`}
                    onClick={() => setTargetKind(k.kind)}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="mix-fv-confirm-btn"
              onClick={handleConfirm}
            >
              <Check size={16} />
              生成材料并自动放入槽位
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
