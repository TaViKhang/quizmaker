declare module '@tiptap/react' {
  import { ReactNode } from 'react';

  export interface Editor {
    isActive: (name: string, attributes?: Record<string, any>) => boolean;
    getHTML: () => string;
    getAttributes: (name: string) => Record<string, any>;
    chain: () => {
      focus: () => {
        toggleBold: () => { run: () => boolean };
        toggleItalic: () => { run: () => boolean };
        toggleHeading: (options: { level: number }) => { run: () => boolean };
        toggleBulletList: () => { run: () => boolean };
        toggleOrderedList: () => { run: () => boolean };
        extendMarkRange: (type: string) => {
          setLink: (attributes: { href: string }) => { run: () => boolean };
          unsetLink: () => { run: () => boolean };
        };
      };
    };
  }

  export const EditorContent: React.FC<{
    editor: Editor | null;
    [key: string]: any;
  }>;

  export function useEditor(options: {
    extensions: any[];
    content?: string;
    onUpdate?: (props: { editor: Editor }) => void;
    editorProps?: Record<string, any>;
    [key: string]: any;
  }): Editor | null;
}

declare module '@tiptap/starter-kit' {
  const StarterKit: any;
  export default StarterKit;
}

declare module '@tiptap/extension-placeholder' {
  const Placeholder: {
    configure: (options: { placeholder: string }) => any;
  };
  export default Placeholder;
}

declare module '@tiptap/extension-heading' {
  const Heading: {
    configure: (options: { levels: number[] }) => any;
  };
  export default Heading;
}

declare module '@tiptap/extension-bullet-list' {
  const BulletList: any;
  export default BulletList;
}

declare module '@tiptap/extension-ordered-list' {
  const OrderedList: any;
  export default OrderedList;
}

declare module '@tiptap/extension-list-item' {
  const ListItem: any;
  export default ListItem;
}

declare module '@tiptap/extension-link' {
  const Link: {
    configure: (options: { openOnClick: boolean, [key: string]: any }) => any;
  };
  export default Link;
} 