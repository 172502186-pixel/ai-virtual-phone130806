"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "../ui/modal";
import { FolderOpen, FileText, ChevronRight, Check, Loader2, Sparkles } from "lucide-react";
import {
  loadFileVaultLibrary,
  FileVaultEntry,
} from "../../lib/chat-document-import";
import {
  WorldBookGeneratedEntry,
  convertVaultEntryToWorldBookEntries,
} from "../../lib/worldbook-file-vault";

export type WorldBookFileVaultModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImportEntries: (entries: WorldBookGeneratedEntry[]) => void;
};

export function WorldBookFileVaultModal({
  isOpen,
  onClose,
  onImportEntries,
}: WorldBookFileVaultModalProps) {
  const [entries, setEntries] = useState<FileVaultEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FileVaultEntry | null>(null);
  const [generatedEntries, setGeneratedEntries] = useState<WorldBookGeneratedEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      loadFileVaultLibrary()
        .then(setEntries)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectEntry = (entry: FileVaultEntry) => {
    setSelectedEntry(entry);
    const result = convertVaultEntryToWorldBookEntries(entry);
    setGeneratedEntries(result);
  };

  const handleConfirm = () => {
    if (generatedEntries.length === 0) return;
    onImportEntries(generatedEntries);
    setSelectedEntry(null);
    setGeneratedEntries([]);
    onClose();
  };

  return (
    <BottomSheet
      title={selectedEntry ? `切分预览：${selectedEntry.title}` : "从文件库导入世界书条目"}
      onClose={() => {
        if (selectedEntry) {
          setSelectedEntry(null);
          setGeneratedEntries([]);
        } else {
          onClose();
        }
      }}
    >
      <div className="wb-file-vault-sheet">
        {!selectedEntry ? (
          <div className="wb-fv-list">
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
                  className="wb-fv-item"
                  onClick={() => handleSelectEntry(entry)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="wb-fv-item-title">{entry.title}</div>
                    <div className="wb-fv-item-meta">
                      <span>{entry.charCount} 字</span>
                      {entry.category && (
                        <span className="wb-fv-badge">{entry.category}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ opacity: 0.5 }} />
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="wb-fv-preview">
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              已自动切分为 <strong>{generatedEntries.length}</strong> 个条目，并匹配触发词：
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "320px", overflowY: "auto" }}>
              {generatedEntries.map((item, idx) => (
                <div key={idx} className="wb-fv-entry-card">
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</div>
                  <div className="wb-fv-entry-keys">
                    <span style={{ fontSize: 11, opacity: 0.6 }}>触发词:</span>
                    {item.keys.map((k, ki) => (
                      <span key={ki} className="wb-fv-key-tag">
                        {k}
                      </span>
                    ))}
                  </div>
                  <div className="wb-fv-entry-text-snippet">{item.content}</div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="wb-fv-import-btn"
              onClick={handleConfirm}
            >
              <Check size={16} />
              确认导入这 {generatedEntries.length} 个条目
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
