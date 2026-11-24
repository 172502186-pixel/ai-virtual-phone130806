"use client";

import { useState, useEffect, useRef } from "react";
import { BottomSheet } from "../ui/modal";
import {
  FileText,
  Upload,
  FolderOpen,
  Check,
  Send,
  Scissors,
  FileCheck,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  ImportedDocument,
  FileVaultEntry,
  ChatDocAttachment,
  parseDocumentFile,
  buildImportedDocument,
  loadFileVaultLibrary,
  documentToAttachment,
  attachmentCardLabel,
  INSERT_TEXT_WARN_CHARS,
} from "../../lib/chat-document-import";

export type ChatDocImportProps = {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (attachment: ChatDocAttachment) => void;
  onInsertText?: (text: string) => void;
};

export function ChatDocImport({
  isOpen,
  onClose,
  onAttach,
  onInsertText,
}: ChatDocImportProps) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [libraryEntries, setLibraryEntries] = useState<FileVaultEntry[]>([]);
  const [loadingLib, setLoadingLib] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [activeDoc, setActiveDoc] = useState<ImportedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && tab === "library") {
      setLoadingLib(true);
      loadFileVaultLibrary()
        .then((entries) => {
          setLibraryEntries(entries);
        })
        .finally(() => setLoadingLib(false));
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const handleSelectVaultEntry = (entry: FileVaultEntry) => {
    const doc = buildImportedDocument({
      title: entry.title,
      ext: entry.sourceType || "txt",
      text: entry.text,
      source: "library",
      category: entry.category,
      tags: entry.tags,
      note: entry.note,
    });
    setActiveDoc(doc);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const doc = await parseDocumentFile(file);
      setActiveDoc(doc);
    } catch (err: any) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("global-notice", {
            detail: err?.message || "解析文档失败",
          }),
        );
      }
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmAttachment = (doc: ImportedDocument) => {
    const att = documentToAttachment(doc);
    onAttach(att);
    setActiveDoc(null);
    onClose();
  };

  const handleInsertFullText = (doc: ImportedDocument) => {
    if (!onInsertText) return;
    if (doc.charCount > INSERT_TEXT_WARN_CHARS) {
      if (
        !confirm(
          `该文档共 ${doc.charCount} 字，直接插入输入框可能造成界面卡顿，推荐以文件卡附件发送。是否依然插入？`,
        )
      ) {
        return;
      }
    }
    onInsertText(doc.text);
    setActiveDoc(null);
    onClose();
  };

  return (
    <BottomSheet
      title={activeDoc ? activeDoc.title : "导入文档 / 材料"}
      onClose={() => {
        if (activeDoc) {
          setActiveDoc(null);
        } else {
          onClose();
        }
      }}
    >
      <div className="chat-doc-import-sheet">
        {!activeDoc ? (
          <>
            <div className="chat-doc-source-tabs">
              <button
                type="button"
                className={`chat-doc-tab ${tab === "library" ? "active" : ""}`}
                onClick={() => setTab("library")}
              >
                <FolderOpen size={16} />
                从文件库选择
              </button>
              <button
                type="button"
                className={`chat-doc-tab ${tab === "upload" ? "active" : ""}`}
                onClick={() => setTab("upload")}
              >
                <Upload size={16} />
                本地文件导入
              </button>
            </div>

            {tab === "library" ? (
              <div className="chat-doc-list">
                {loadingLib ? (
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
                    正在读取文件库...
                  </div>
                ) : libraryEntries.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: "var(--color-text-muted)",
                      fontSize: 13,
                    }}
                  >
                    文件库为空或尚未存入材料。
                  </div>
                ) : (
                  libraryEntries.map((item) => (
                    <div
                      key={item.id}
                      className="chat-doc-item"
                      onClick={() => handleSelectVaultEntry(item)}
                    >
                      <div className="chat-doc-item-main">
                        <div className="chat-doc-item-title">{item.title}</div>
                        <div className="chat-doc-item-meta">
                          <span>{item.charCount} 字</span>
                          {item.category && (
                            <span className="chat-doc-badge">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        style={{ opacity: 0.5, flexShrink: 0 }}
                      />
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div
                className="chat-doc-upload-box"
                onClick={() => !parsing && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.doc,.txt,.md,.pdf,.rtf,.html,.htm"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <div className="chat-doc-upload-icon">
                  {parsing ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Upload size={20} />
                  )}
                </div>
                <div className="chat-doc-upload-text">
                  {parsing ? "正在解析文件..." : "点击选择本地文档"}
                </div>
                <div className="chat-doc-upload-tip">
                  支持 docx, doc, txt, md, pdf, rtf 等格式
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="chat-doc-preview-panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="chat-doc-card-badge">
                <FileText size={14} />
                {activeDoc.charCount} 字 · 约 {activeDoc.tokenEstimate} tokens
              </span>
              {activeDoc.sourceNote && (
                <span style={{ fontSize: 11, opacity: 0.6 }}>
                  {activeDoc.sourceNote}
                </span>
              )}
            </div>

            <div style={{ fontSize: 12, opacity: 0.75 }}>
              文档已自动切分为 {activeDoc.chapters.length} 个片段：
            </div>

            <div className="chat-doc-chapters-box">
              {activeDoc.chapters.map((ch, idx) => (
                <div key={idx} className="chat-doc-chapter-row">
                  <span>{ch.title}</span>
                  <span style={{ opacity: 0.6 }}>{ch.chars} 字</span>
                </div>
              ))}
            </div>

            <div className="chat-doc-actions">
              {onInsertText && (
                <button
                  type="button"
                  className="chat-doc-action-btn secondary"
                  onClick={() => handleInsertFullText(activeDoc)}
                >
                  <Scissors size={14} />
                  塞入输入框
                </button>
              )}
              <button
                type="button"
                className="chat-doc-action-btn primary"
                onClick={() => handleConfirmAttachment(activeDoc)}
              >
                <FileCheck size={14} />
                作为文件卡附件
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

/** 待发送附件条 */
export function ChatDocAttachmentPendingBar({
  attachment,
  onRemove,
}: {
  attachment: ChatDocAttachment;
  onRemove: () => void;
}) {
  return (
    <div className="chat-doc-pending-bar">
      <div className="chat-doc-pending-info">
        <FileText size={14} style={{ color: "var(--color-primary)" }} />
        <span className="chat-doc-pending-title">{attachmentCardLabel(attachment)}</span>
        <span className="chat-doc-pending-meta">
          ({attachment.charCount} 字 · 约 {attachment.tokenEstimate} tok)
        </span>
      </div>
      <button
        type="button"
        className="chat-doc-pending-del"
        onClick={onRemove}
        title="移除附件"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/** 聊天气泡内渲染的文件卡 */
export function ChatDocMessageCard({
  title,
  subText,
  onClick,
}: {
  title: string;
  subText?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="chat-bubble-file-card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="chat-bubble-file-icon">
        <FileText size={20} />
      </div>
      <div className="chat-bubble-file-details">
        <span className="chat-bubble-file-name">{title}</span>
        <span className="chat-bubble-file-sub">{subText || "文档卡片"}</span>
      </div>
    </div>
  );
}
