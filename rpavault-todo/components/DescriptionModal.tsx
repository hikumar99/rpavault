"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare2,
  Code,
  Quote,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
  Eye,
  Edit3,
} from "lucide-react";
import { apiPath } from "@/lib/config";

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  description: string;
  onChange: (desc: string) => void;
  taskTitle: string;
}

export function DescriptionModal({
  isOpen,
  onClose,
  description,
  onChange,
  taskTitle,
}: DescriptionModalProps) {
  const [content, setContent] = useState(description);
  const [viewMode, setViewMode] = useState<"write" | "preview">("write");
  const [uploadingImage, setUploadingImage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(description);
  }, [description]);

  if (!isOpen) return null;

  function insertFormatting(prefix: string, suffix: string = "", placeholder: string = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selected = currentText.substring(start, end) || placeholder;

    const before = currentText.substring(0, start);
    const after = currentText.substring(end);

    const newText = `${before}${prefix}${selected}${suffix}${after}`;
    setContent(newText);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selected.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  }

  function insertBlock(prefix: string, defaultText: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;

    const before = currentText.substring(0, start);
    const after = currentText.substring(start);

    // Ensure it starts on a new line
    const newline = before.length === 0 || before.endsWith("\n") ? "" : "\n";
    const newText = `${before}${newline}${prefix} ${defaultText}\n${after}`;
    setContent(newText);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + newline.length + prefix.length + 1 + defaultText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(apiPath("/api/upload"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        const imageUrl = data.url;
        const markdownImg = `\n![${data.name || "image"}](${imageUrl})\n`;
        const updated = (content || "") + markdownImg;
        setContent(updated);
        onChange(updated);
      }
    } catch {
      console.error("Image upload failed");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function renderPreview(text: string) {
    if (!text.trim()) {
      return (
        <div className="text-slate-400 text-xs italic py-10 text-center">
          No description added yet.
        </div>
      );
    }

    const lines = text.split("\n");
    return (
      <div className="space-y-2 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
        {lines.map((line, idx) => {
          const imgMatch = line.match(/^!\[(.*?)\]\((.+)\)$/);
          if (imgMatch) {
            return (
              <div key={idx} className="my-3 max-w-md rounded-xl overflow-hidden border border-slate-200 dark:border-[#343a49] bg-black/5 dark:bg-white/5">
                <img src={imgMatch[2]} alt={imgMatch[1] || "Image"} className="w-full max-h-72 object-contain bg-slate-900/50" />
                <div className="p-1.5 text-[10px] text-slate-500 text-center truncate">{imgMatch[1]}</div>
              </div>
            );
          }

          if (line.startsWith("# ")) {
            return <h1 key={idx} className="text-lg font-bold text-slate-900 dark:text-white mt-3 mb-1">{line.slice(2)}</h1>;
          }
          if (line.startsWith("## ")) {
            return <h2 key={idx} className="text-base font-bold text-slate-900 dark:text-white mt-2.5 mb-1">{line.slice(3)}</h2>;
          }
          if (line.startsWith("### ")) {
            return <h3 key={idx} className="text-sm font-semibold text-slate-900 dark:text-white mt-2 mb-0.5">{line.slice(4)}</h3>;
          }
          if (line.startsWith("- [ ] ") || line.startsWith("[ ] ")) {
            return (
              <div key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <input type="checkbox" disabled className="rounded border-slate-400" />
                <span>{line.replace(/^-\s*\[\s*\]\s*|^\[\s*\]\s*/, "")}</span>
              </div>
            );
          }
          if (line.startsWith("- [x] ") || line.startsWith("[x] ")) {
            return (
              <div key={idx} className="flex items-center gap-2 text-slate-400 line-through">
                <input type="checkbox" checked disabled className="rounded text-[#4772fa]" />
                <span>{line.replace(/^-\s*\[x\]\s*|^\[x\]\s*/i, "")}</span>
              </div>
            );
          }
          if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
            return (
              <li key={idx} className="ml-4 list-disc text-slate-700 dark:text-slate-300">
                {line.replace(/^([•\-*]\s*)/, "")}
              </li>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            return (
              <li key={idx} className="ml-4 list-decimal text-slate-700 dark:text-slate-300">
                {line.replace(/^\d+\.\s*/, "")}
              </li>
            );
          }
          if (line.startsWith("> ")) {
            return (
              <blockquote key={idx} className="border-l-2 border-[#4772fa] pl-3 py-1 text-slate-500 italic">
                {line.slice(2)}
              </blockquote>
            );
          }
          if (line.startsWith("```")) {
            return <div key={idx} className="font-mono bg-slate-100 dark:bg-[#13151a] p-2 rounded text-[11px] text-blue-400">{line}</div>;
          }
          if (line.trim() === "") {
            return <div key={idx} className="h-1" />;
          }

          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1a1e27] border border-slate-200 dark:border-[#2e3442] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-[#282d39] flex items-center justify-between bg-slate-50 dark:bg-[#16181f]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4772fa]">Notes & Description</span>
            <span className="text-xs text-slate-400 truncate max-w-[280px]">/ {taskTitle}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Mode Switcher */}
            <div className="flex bg-slate-200 dark:bg-[#232731] p-0.5 rounded-lg text-xs mr-2">
              <button
                type="button"
                onClick={() => setViewMode("write")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  viewMode === "write"
                    ? "bg-white dark:bg-[#1a1e27] text-[#4772fa] shadow-sm"
                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Write</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  viewMode === "preview"
                    ? "bg-white dark:bg-[#1a1e27] text-[#4772fa] shadow-sm"
                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#232731] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Formatting Toolbar */}
        {viewMode === "write" && (
          <div className="px-3 py-2 border-b border-slate-200 dark:border-[#282d39] bg-slate-50/50 dark:bg-[#181b22] flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => insertFormatting("**", "**", "bold text")}
              className="p-1.5 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282e3c] rounded-lg transition"
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("*", "*", "italic text")}
              className="p-1.5 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282e3c] rounded-lg transition"
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-[#2f3544] mx-1" />
            <button
              type="button"
              onClick={() => insertBlock("#", "Heading 1")}
              className="p-1.5 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282e3c] rounded-lg transition"
              title="Heading 1"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertBlock("##", "Heading 2")}
              className="p-1.5 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282e3c] rounded-lg transition"
              title="Heading 2"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertBlock("###", "Heading 3")}
              className="p-1.5 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282e3c] rounded-lg transition"
              title="Heading 3"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-[#2f3544] mx-1" />
            <button
              type="button"
              onClick={() => insertBlock("•", "List item")}
              className="p-1.5 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282e3c] rounded-lg transition"
              title="Bulleted List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertBlock("1.", "Numbered item")}
              className="p-1.5 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282e3c] rounded-lg transition"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertBlock("[ ]", "To-do item")}
              className="p-1.5 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282e3c] rounded-lg transition"
              title="Interactive Checkbox"
            >
              <CheckSquare2 className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-[#2f3544] mx-1" />
            <button
              type="button"
              onClick={() => insertBlock(">", "Quote or callout")}
              className="p-1.5 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282e3c] rounded-lg transition"
              title="Quote / Callout"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("`", "`", "code")}
              className="p-1.5 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282e3c] rounded-lg transition"
              title="Inline Code"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-[#2f3544] mx-1" />
            {/* Image Upload in Modal */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#4772fa] bg-[#4772fa]/10 hover:bg-[#4772fa]/20 border border-[#4772fa]/30 transition disabled:opacity-50"
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Insert Image</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 p-4 overflow-y-auto min-h-[300px]">
          {viewMode === "write" ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                onChange(e.target.value);
              }}
              placeholder="Write detailed notes, bullet points, checklists, or insert images. Notion syntax supported..."
              className="w-full h-full min-h-[320px] bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none resize-none leading-relaxed font-mono"
            />
          ) : (
            renderPreview(content)
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-[#282d39] bg-slate-50 dark:bg-[#16181f] flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-400">
          <span>Markdown and Notion blocks supported • Auto-saves to page</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#4772fa] hover:bg-[#3861ea] text-white rounded-xl text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
