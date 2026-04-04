import { useRef, useEffect } from "react";
import { CopyIcon, BoldIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function AdminRichTextEditor({ value, onChange, placeholder, minHeight = "60px" }: AdminRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize value only once to prevent cursor jumping
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Small check to avoid overwriting user focus if identical semantic content
      if (editorRef.current.innerHTML.replace(/\s+/g, '') === value.replace(/\s+/g, '')) return;
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  };

  const handleBoldClick = () => {
    document.execCommand("bold", false, undefined);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput(); // ensure we capture the changes
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      handleBoldClick();
    }
  };

  return (
    <div className="flex flex-col border rounded-md shadow-sm overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-400">
      {/* Mini toolbar */}
      <div className="flex items-center px-2 py-1 bg-gray-50 border-b border-gray-200">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBoldClick}
          className="h-6 px-2 text-xs text-gray-600 hover:text-black"
          title="Bold (Ctrl+B)"
        >
          <BoldIcon className="w-3.5 h-3.5 mr-1" />
          Bold
        </Button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleInput}
        style={{ minHeight }}
        className="p-3 text-sm focus:outline-none"
        data-placeholder={placeholder}
      />
    </div>
  );
}
