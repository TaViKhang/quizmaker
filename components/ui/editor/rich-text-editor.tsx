"use client";

import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Link from '@tiptap/extension-link';
import { cn } from "@/lib/utils";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight
} from "lucide-react";
import { Toggle } from "../toggle";
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "../toggle-group";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  rawOutput?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Enter content...",
  className,
  minHeight = "200px",
  rawOutput = false
}: RichTextEditorProps) {
  
  const sanitizeContent = (html: string): string => {
    if (!rawOutput) {
      const isSimpleText = html.startsWith('<p>') && html.endsWith('</p>') &&
        !html.includes('<p>', 1) && !html.slice(0, html.length - 4).includes('</p>') &&
        !/<[a-z][^>]*>/i.test(html.substring(3, html.length - 4));
        
      if (isSimpleText) {
        return html.substring(3, html.length - 4);
      }
    }
    
    return html;
  };
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Heading.configure({
        levels: [1, 2],
      }),
      BulletList,
      OrderedList,
      ListItem,
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }: { editor: TiptapEditor }) => {
      const html = editor.getHTML();
      onChange(sanitizeContent(html));
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base prose-stone focus:outline-none max-w-none h-full',
      },
    },
  });

  const setLink = () => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap bg-muted/50 rounded-md border p-1 gap-1">
        <ToggleGroup type="multiple">
          <ToggleGroupItem 
            value="bold" 
            aria-label="Bold" 
            size="sm"
            data-state={editor.isActive('bold') ? "on" : "off"}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="italic" 
            aria-label="Italic" 
            size="sm"
            data-state={editor.isActive('italic') ? "on" : "off"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="w-px h-6 bg-border mx-1" />

        <ToggleGroup type="single" value={editor.isActive('heading', { level: 1 }) ? 'h1' : editor.isActive('heading', { level: 2 }) ? 'h2' : 'p'}>
          <ToggleGroupItem 
            value="h1" 
            aria-label="Heading 1" 
            size="sm"
            data-state={editor.isActive('heading', { level: 1 }) ? "on" : "off"}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="h2" 
            aria-label="Heading 2" 
            size="sm"
            data-state={editor.isActive('heading', { level: 2 }) ? "on" : "off"}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="w-px h-6 bg-border mx-1" />

        <ToggleGroup type="multiple">
          <ToggleGroupItem 
            value="bulletList" 
            aria-label="Bullet List" 
            size="sm"
            data-state={editor.isActive('bulletList') ? "on" : "off"}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="orderedList" 
            aria-label="Ordered List" 
            size="sm"
            data-state={editor.isActive('orderedList') ? "on" : "off"}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Toggle
          size="sm"
          pressed={editor.isActive('link')}
          onClick={setLink}
          aria-label="Link"
        >
          <Link2 className="h-4 w-4" />
        </Toggle>
      </div>
      <div 
        className={cn(
          "border rounded-md p-3 overflow-y-auto",
          minHeight ? `min-h-[${minHeight}]` : undefined
        )}
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
} 