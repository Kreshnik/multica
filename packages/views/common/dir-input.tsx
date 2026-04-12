import { useRef } from "react";
import { FolderOpen } from "lucide-react";
import { Input } from "@multica/ui/components/ui/input";

interface DirInputProps {
  value: string | null;
  inputKey?: string | number;
  className?: string;
  onCommit: (dir: string | null) => void;
}

/**
 * A text input for filesystem paths with a browse button.
 * In Electron, uses dialog.showOpenDialog via IPC — returns the full absolute path.
 * In a browser, falls back to showDirectoryPicker() which only provides the folder name.
 */
export function DirInput({ value, inputKey, className, onCommit }: DirInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBrowse = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const electron = (window as any).electron;
      let dir: string | null = null;

      if (electron?.ipcRenderer) {
        // Electron: use native dialog — returns full absolute path.
        dir = await electron.ipcRenderer.invoke("pick-directory");
      } else {
        // Web: showDirectoryPicker only provides the folder name, not the full path.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const picker = (window as any).showDirectoryPicker;
        if (!picker) return;
        const handle = await picker({ mode: "read" });
        dir = handle.name ?? null;
      }

      if (!dir) return;
      if (inputRef.current) inputRef.current.value = dir;
      onCommit(dir);
    } catch {
      // User cancelled the picker — do nothing.
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <div className="relative flex-1 min-w-0">
        <FolderOpen className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          key={inputKey}
          className="h-6 text-xs font-mono pl-5 pr-1.5 w-full"
          defaultValue={value ?? ""}
          placeholder="/path/to/project"
          onBlur={(e) => {
            const val = e.target.value.trim() || null;
            if (val !== (value ?? null)) onCommit(val);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              e.currentTarget.value = value ?? "";
              e.currentTarget.blur();
            }
          }}
        />
      </div>
      <button
        type="button"
        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        title="Browse directory"
        onClick={handleBrowse}
      >
        <FolderOpen className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
