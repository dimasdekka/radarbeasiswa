"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Bold, Italic, Heading2, AlignLeft, List, ListOrdered, FileText } from "lucide-react";

export function TipTapEditor({
  content,
  onChange,
  placeholder = "Mulai mengetik esai Anda di sini...",
  className,
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || `<p></p>`,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[480px] px-6 py-6 text-foreground bg-card/10 dark:bg-card/5",
          "font-body prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tightish prose-headings:text-foreground",
          "prose-p:leading-relaxed prose-p:text-sm prose-p:text-foreground/90",
          className
        ),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (content && content !== editor.getHTML()) {
      editor.commands.setContent(content || `<p></p>`);
    }
  }, [content, editor]);

  if (!editor) {
    return <div className="min-h-[480px] animate-pulse border border-border/20 bg-muted/40 rounded-xl" />;
  }

  const charCount = editor.getText().replace(/\n/g, "").length;
  const wordCount = editor.getText().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col bg-card/25 backdrop-blur-sm rounded-xl overflow-hidden">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/20 bg-muted/20 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Teks Tebal (Ctrl+B)">
            <Bold className="h-3.5 w-3.5" />
          </ToolbarBtn>
          
          <ToolbarBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Teks Miring (Ctrl+I)">
            <Italic className="h-3.5 w-3.5" />
          </ToolbarBtn>
          
          <Sep />
          
          <ToolbarBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Sub-judul H2">
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarBtn>
          
          <ToolbarBtn active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()} title="Paragraf Biasa">
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolbarBtn>
          
          <Sep />
          
          <ToolbarBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
            <List className="h-3.5 w-3.5" />
          </ToolbarBtn>
          
          <ToolbarBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarBtn>
        </div>

        <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 border border-border/30 rounded px-2 py-0.5">
          <FileText className="h-3 w-3 text-primary" />
          <span>{wordCount} Kata · {charCount} Karakter</span>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative flex-1 min-h-[480px]">
        <EditorContent editor={editor} />
        {!editor.getText().trim() && (
          <p className="pointer-events-none absolute top-6 left-6 text-sm italic text-muted-foreground/50">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  );
}

function ToolbarBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
        active 
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10" 
          : "text-muted-foreground hover:bg-muted/65 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="mx-1.5 h-4 self-center border-l border-border/30" />;
}
