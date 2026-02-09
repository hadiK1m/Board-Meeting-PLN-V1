// src/components/ui/rich-text-editor.tsx
"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useEffect, useCallback } from "react";
import type ReactQuillNS from "react-quill-new";
import type Quill from "quill";
// Flag to track if custom blot has been registered
let blotRegistered = false;

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import("react-quill-new");
        const QuillModule = await import("quill");
        const Quill = QuillModule.default;

        // Register custom SoftBreak blot for Shift+Enter (only once)
        if (!blotRegistered) {
            const Embed = Quill.import("blots/embed") as typeof import("parchment").EmbedBlot;

            // Custom SoftBreak blot that renders as <br>
            class SoftBreak extends Embed {
                static blotName = "softbreak";
                static tagName = "BR";
                static className = "soft-break";

                static create(): HTMLElement {
                    const node = super.create() as HTMLElement;
                    return node;
                }

                length(): number {
                    return 1;
                }

                // Important: This ensures the blot is recognized when parsing HTML
                static formats(): boolean {
                    return true;
                }
            }

            // Override the default clipboard matchers to handle <br> tags
            const Clipboard = Quill.import("modules/clipboard") as {
                DEFAULTS: {
                    matchers: Array<[string, (node: Node, delta: unknown) => unknown]>;
                };
            };

            // Add a matcher for BR elements to convert them to softbreak
            const originalMatchers = Clipboard.DEFAULTS.matchers || [];
            Clipboard.DEFAULTS.matchers = [
                ...originalMatchers,
                ["BR", (node: Node) => {
                    // Import Delta dynamically
                    const Delta = Quill.import("delta") as new (ops?: unknown[]) => {
                        insert: (embed: Record<string, unknown>) => unknown;
                    };
                    const delta = new Delta();
                    // Check if it's inside a list item - if so, treat as softbreak
                    const parent = node.parentElement;
                    if (parent) {
                        const listItem = parent.closest("li");
                        if (listItem) {
                            delta.insert({ softbreak: true });
                            return delta;
                        }
                    }
                    // Regular BR - also treat as softbreak for consistency
                    delta.insert({ softbreak: true });
                    return delta;
                }],
            ];

            Quill.register(SoftBreak, true);
            blotRegistered = true;
        }

        // Create a wrapper component that forwards ref
        const QuillWrapper = (props: ReactQuillNS.ReactQuillProps & { quillRef?: React.MutableRefObject<ReactQuillNS | null> }) => {
            const { quillRef, ...rest } = props;
            return <RQ ref={(el: ReactQuillNS | null) => { if (quillRef) quillRef.current = el; }} {...rest} />;
        };
        return QuillWrapper;
    },
    {
        ssr: false,
        loading: () => (
            <div className="h-80 w-full animate-pulse bg-slate-100 rounded-md border" />
        ),
    }
);

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

// Quill formats configuration - include softbreak for our custom blot
const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "indent",
    "align",
    "softbreak",
];

export function RichTextEditor({
    value,
    onChange,
    placeholder = "Tulis konten di sini...",
    className = "",
    minHeight = "320px",
}: RichTextEditorProps) {
    const quillRef = useRef<ReactQuillNS | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // Get the Quill editor instance
    const getEditor = useCallback((): Quill | null => {
        if (quillRef.current) {
            return quillRef.current.getEditor?.() ?? null;
        }
        return null;
    }, []);

    /**
     * Handle Shift+Enter: Insert soft break (<br>) within the same list item
     * Behavior: Creates a new line WITHIN the current list item (no new bullet/number)
     * This mimics Word's Shift+Enter behavior
     */
    const handleShiftEnter = useCallback(() => {
        const editor = getEditor();
        if (!editor) return false;

        const range = editor.getSelection();
        if (!range) return false;

        // Insert a soft break (BR element) - works both in list and paragraph
        editor.insertEmbed(range.index, "softbreak", true, "user");
        editor.setSelection(range.index + 1, 0);

        return true;
    }, [getEditor]);

    /**
     * Handle Enter key with Word-like behavior:
     * 1. In list with text: Create new list item (let Quill handle naturally)
     * 2. In empty list item: Exit list, create paragraph
     * 3. In paragraph: Create new paragraph (let Quill handle naturally)
     */
    const handleEnter = useCallback(() => {
        const editor = getEditor();
        if (!editor) return false;

        const range = editor.getSelection();
        if (!range) return false;

        const format = editor.getFormat(range.index);

        // Only handle special case: empty list item
        if (format.list) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [line] = editor.getLine(range.index) as [any, number];
            if (line) {
                // Get the text content of current line (excluding the line itself structure)
                const lineLength = line.length();

                // In Quill, an empty line has length 1 (just the newline character)
                // So if length <= 1, the list item is empty
                if (lineLength <= 1) {
                    // Empty list item - exit list and create paragraph
                    const lineIndex = editor.getIndex(line);

                    // Remove the list format from current line
                    editor.formatLine(lineIndex, 1, "list", false, "user");
                    editor.formatLine(lineIndex, 1, "indent", false, "user");

                    return true; // Prevent default behavior
                }
            }
        }

        // For non-empty list items or paragraphs, let Quill handle Enter naturally
        // This ensures proper list continuation with correct numbering
        return false;
    }, [getEditor]);

    /**
     * Handle Tab for indenting/outdenting in lists and text
     */
    const handleTab = useCallback((shiftKey: boolean) => {
        const editor = getEditor();
        if (!editor) return false;

        const range = editor.getSelection();
        if (!range) return false;

        const format = editor.getFormat(range.index);

        // If in a list, handle indent/outdent
        if (format.list) {
            const currentIndent = (format.indent as number) || 0;

            if (shiftKey) {
                // Outdent - decrease indent level
                if (currentIndent > 0) {
                    editor.formatLine(range.index, range.length || 1, "indent", currentIndent - 1, "user");
                }
            } else {
                // Indent - increase indent level (max 8 levels)
                if (currentIndent < 8) {
                    editor.formatLine(range.index, range.length || 1, "indent", currentIndent + 1, "user");
                }
            }
            return true;
        }

        // For non-list text with selection, indent all lines
        if (range.length > 0) {
            const [startLine] = editor.getLine(range.index);
            const [endLine] = editor.getLine(range.index + range.length);

            if (startLine && endLine) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const startLineIndex = editor.getIndex(startLine as any);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const endLineIndex = editor.getIndex(endLine as any);
                const endLineLength = endLine.length();

                const totalLength = (endLineIndex + endLineLength) - startLineIndex;
                const text = editor.getText(startLineIndex, totalLength);
                const lines = text.split("\n");

                if (shiftKey) {
                    // Outdent
                    let offset = 0;
                    let currentIndex = startLineIndex;

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i] ?? "";
                        const leadingSpaces = line.match(/^(\t|    | {1,4})/);
                        if (leadingSpaces) {
                            const removeLength = leadingSpaces[0].length;
                            editor.deleteText(currentIndex - offset, removeLength, "user");
                            offset += removeLength;
                        }
                        currentIndex += line.length + 1;
                    }
                } else {
                    // Indent
                    const indentStr = "    ";
                    let offset = 0;
                    let currentIndex = startLineIndex;

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i] ?? "";
                        if (line.length > 0 || i < lines.length - 1) {
                            editor.insertText(currentIndex + offset, indentStr, "user");
                            offset += indentStr.length;
                        }
                        currentIndex += line.length + 1;
                    }
                }
                return true;
            }
        } else {
            // No selection - just insert tab at cursor
            if (!shiftKey) {
                editor.insertText(range.index, "    ", "user");
                editor.setSelection(range.index + 4, 0);
                return true;
            }
        }

        return false;
    }, [getEditor]);

    // Set up keyboard event listener on the editor element
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Shift+Enter: Insert soft break (line break within same list item/paragraph)
            if (e.shiftKey && e.key === "Enter" && !e.ctrlKey && !e.altKey) {
                if (handleShiftEnter()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
            // Enter: Handle empty list item exit, otherwise let Quill handle
            else if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                if (handleEnter()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                // If handleEnter returns false, Quill handles Enter naturally
                // which correctly continues list numbering
            }
            // Tab: Indent/outdent
            else if (e.key === "Tab") {
                if (handleTab(e.shiftKey)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        };

        // Capture container ref at effect start
        const container = editorContainerRef.current;
        if (!container) return;

        // Wait for editor to mount and attach listener
        const attachListener = () => {
            const editorElement = container.querySelector(".ql-editor");
            if (editorElement) {
                editorElement.addEventListener("keydown", handleKeyDown as EventListener, true);
                return true;
            }
            return false;
        };

        // Try immediately
        const attached = attachListener();

        // If not found, retry after a short delay
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        if (!attached) {
            timeoutId = setTimeout(() => {
                attachListener();
            }, 500);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            const editorElement = container.querySelector(".ql-editor");
            if (editorElement) {
                editorElement.removeEventListener("keydown", handleKeyDown as EventListener, true);
            }
        };
    }, [handleShiftEnter, handleEnter, handleTab]);

    // Quill modules configuration
    const quillModules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ align: [] }],
            ["clean"],
        ],
        clipboard: {
            matchVisual: false,
        },
    }), []);

    return (
        <div ref={editorContainerRef} className={`rich-text-editor ${className}`}>
            <style jsx global>{`
                .rich-text-editor .ql-container {
                    min-height: ${minHeight};
                    font-size: 14px;
                    font-family: inherit;
                }
                .rich-text-editor .ql-editor {
                    min-height: ${minHeight};
                }
                .rich-text-editor .ql-toolbar {
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    background: #f8fafc;
                    border-color: #e2e8f0;
                }
                .rich-text-editor .ql-container {
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    border-color: #e2e8f0;
                }
                .rich-text-editor .ql-editor.ql-blank::before {
                    color: #94a3b8;
                    font-style: normal;
                }
                .rich-text-editor .ql-snow .ql-stroke {
                    stroke: #64748b;
                }
                .rich-text-editor .ql-snow .ql-fill {
                    fill: #64748b;
                }
                .rich-text-editor .ql-snow .ql-picker {
                    color: #64748b;
                }
                .rich-text-editor .ql-snow.ql-toolbar button:hover,
                .rich-text-editor .ql-snow .ql-toolbar button:hover,
                .rich-text-editor .ql-snow.ql-toolbar button.ql-active,
                .rich-text-editor .ql-snow .ql-toolbar button.ql-active {
                    color: #006070;
                }
                .rich-text-editor .ql-snow.ql-toolbar button:hover .ql-stroke,
                .rich-text-editor .ql-snow .ql-toolbar button:hover .ql-stroke,
                .rich-text-editor .ql-snow.ql-toolbar button.ql-active .ql-stroke,
                .rich-text-editor .ql-snow .ql-toolbar button.ql-active .ql-stroke {
                    stroke: #006070;
                }
                .rich-text-editor .ql-snow.ql-toolbar button:hover .ql-fill,
                .rich-text-editor .ql-snow .ql-toolbar button:hover .ql-fill,
                .rich-text-editor .ql-snow.ql-toolbar button.ql-active .ql-fill,
                .rich-text-editor .ql-snow .ql-toolbar button.ql-active .ql-fill {
                    fill: #006070;
                }
            `}</style>
            <ReactQuill
                quillRef={quillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                modules={quillModules}
                formats={formats}
                placeholder={placeholder}
            />
        </div>
    );
}

// Helper to convert number to letter (1->a, 2->b, etc.)
function numberToLetter(num: number): string {
    return String.fromCharCode(96 + num); // 97 is 'a'
}

// Helper to convert number to roman numeral
function numberToRoman(num: number): string {
    const romanNumerals = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
    return romanNumerals[num - 1] || num.toString();
}

// Utility function to convert Quill HTML to plain text with proper multi-level list formatting
export function htmlToPlainText(html: string): string {
    if (!html) return "";

    if (typeof window !== "undefined") {
        const temp = document.createElement("div");
        temp.innerHTML = html;

        const lines: string[] = [];

        // Track counters for each indent level in ordered lists
        const olCounters: Record<number, number> = {};
        const ulCounters: Record<number, number> = {};

        // Get direct text content of an element (excluding nested lists)
        // Handles <br> as line break within the same list item
        const getDirectTextContent = (element: Element): string => {
            let text = "";
            Array.from(element.childNodes).forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    text += child.textContent || "";
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const el = child as Element;
                    const tag = el.tagName.toLowerCase();
                    // Handle <br> as soft line break
                    if (tag === "br") {
                        text += "\n";
                    }
                    // Skip nested lists - we'll process them separately
                    else if (tag !== "ol" && tag !== "ul") {
                        // Include inline elements like <em>, <strong>, etc.
                        // But recursively handle their children to catch nested <br>
                        const processInline = (inlineEl: Element): string => {
                            let inlineText = "";
                            Array.from(inlineEl.childNodes).forEach(inlineChild => {
                                if (inlineChild.nodeType === Node.TEXT_NODE) {
                                    inlineText += inlineChild.textContent || "";
                                } else if (inlineChild.nodeType === Node.ELEMENT_NODE) {
                                    const innerEl = inlineChild as Element;
                                    const innerTag = innerEl.tagName.toLowerCase();
                                    if (innerTag === "br") {
                                        inlineText += "\n";
                                    } else if (innerTag !== "ol" && innerTag !== "ul") {
                                        inlineText += processInline(innerEl);
                                    }
                                }
                            });
                            return inlineText;
                        };
                        text += processInline(el);
                    }
                }
            });
            return text.trim();
        };

        // Check if element has nested list
        const getNestedList = (element: Element): Element | null => {
            for (const child of Array.from(element.children)) {
                const tag = child.tagName.toLowerCase();
                if (tag === "ol" || tag === "ul") {
                    return child;
                }
            }
            return null;
        };

        const processNode = (node: Node, listType: "ol" | "ul" | null = null, baseIndent: number = 0): void => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent?.trim();
                if (text && !listType) {
                    lines.push(text);
                }
                return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            const element = node as Element;
            const tagName = element.tagName.toLowerCase();

            switch (tagName) {
                case "br":
                    lines.push("");
                    break;
                case "p":
                case "div":
                    const pContent = element.textContent?.trim();
                    if (pContent) {
                        lines.push(pContent);
                    }
                    break;
                case "h1":
                case "h2":
                case "h3":
                case "h4":
                case "h5":
                case "h6":
                    const hContent = element.textContent?.trim();
                    if (hContent) {
                        lines.push(hContent);
                    }
                    break;
                case "ul":
                    // Reset counters for new list at this level
                    Object.keys(ulCounters).forEach(k => {
                        if (Number(k) >= baseIndent) {
                            delete ulCounters[Number(k)];
                        }
                    });
                    Array.from(element.children).forEach(child => processNode(child, "ul", baseIndent));
                    break;
                case "ol":
                    // Reset counters for new list at this level
                    Object.keys(olCounters).forEach(k => {
                        if (Number(k) >= baseIndent) {
                            delete olCounters[Number(k)];
                        }
                    });
                    Array.from(element.children).forEach(child => processNode(child, "ol", baseIndent));
                    break;
                case "li":
                    // Get indent level from Quill's class (ql-indent-1, ql-indent-2, etc.)
                    let indentLevel = baseIndent;
                    const classList = element.className || "";
                    const indentMatch = classList.match(/ql-indent-(\d+)/);
                    if (indentMatch && indentMatch[1]) {
                        indentLevel = baseIndent + parseInt(indentMatch[1], 10);
                    }

                    // Reset counters for deeper levels when we go back to a shallower level
                    if (listType === "ol") {
                        Object.keys(olCounters).forEach(k => {
                            if (Number(k) > indentLevel) {
                                delete olCounters[Number(k)];
                            }
                        });
                    } else {
                        Object.keys(ulCounters).forEach(k => {
                            if (Number(k) > indentLevel) {
                                delete ulCounters[Number(k)];
                            }
                        });
                    }

                    // Increment counter for current level
                    if (listType === "ol") {
                        olCounters[indentLevel] = (olCounters[indentLevel] || 0) + 1;
                    } else {
                        ulCounters[indentLevel] = (ulCounters[indentLevel] || 0) + 1;
                    }

                    // Get only direct text content (not nested list text)
                    const liContent = getDirectTextContent(element);
                    const indent = "   ".repeat(indentLevel); // 3 spaces per indent level

                    let marker: string;
                    if (listType === "ol") {
                        const counter = olCounters[indentLevel] || 1;
                        // Level 0: 1. 2. 3.
                        // Level 1: a. b. c.
                        // Level 2: i. ii. iii.
                        // Level 3+: repeat pattern
                        const levelType = indentLevel % 3;
                        if (levelType === 0) {
                            marker = `${counter}.`;
                        } else if (levelType === 1) {
                            marker = `${numberToLetter(counter)}.`;
                        } else {
                            marker = `${numberToRoman(counter)}.`;
                        }
                    } else {
                        // Unordered list markers by level
                        // Level 0: •
                        // Level 1: ◦ (or -)
                        // Level 2: ▪ (or *)
                        const levelType = indentLevel % 3;
                        if (levelType === 0) {
                            marker = "•";
                        } else if (levelType === 1) {
                            marker = "-";
                        } else {
                            marker = "*";
                        }
                    }

                    if (liContent) {
                        // Handle soft breaks (newlines) within the list item
                        // Each line after the first should be indented to align with the text
                        const contentLines = liContent.split("\n");
                        const markerPadding = " ".repeat(marker.length + 1); // +1 for the space after marker

                        contentLines.forEach((contentLine, lineIdx) => {
                            if (lineIdx === 0) {
                                // First line gets the marker
                                lines.push(`${indent}${marker} ${contentLine}`);
                            } else {
                                // Subsequent lines (soft breaks) get aligned under the text
                                lines.push(`${indent}${markerPadding}${contentLine}`);
                            }
                        });
                    }

                    // Process nested list if exists
                    const nestedList = getNestedList(element);
                    if (nestedList) {
                        const nestedType = nestedList.tagName.toLowerCase() === "ol" ? "ol" : "ul";
                        processNode(nestedList, nestedType, indentLevel + 1);
                    }
                    break;
                default:
                    Array.from(element.childNodes).forEach(child => processNode(child, listType, baseIndent));
            }
        };

        Array.from(temp.childNodes).forEach(child => processNode(child, null, 0));

        // Clean up and join
        return lines
            .join("\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    // Fallback for SSR - basic HTML tag removal with list handling
    return html
        // Convert list items to bullets/numbers
        .replace(/<li>/gi, "• ")
        .replace(/<\/li>/gi, "\n")
        // Convert block elements to newlines
        .replace(/<\/(p|div|h[1-6])>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        // Remove remaining tags
        .replace(/<[^>]*>/g, "")
        // Decode entities
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        // Clean up
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

// Utility function to convert Quill Delta/HTML to a format compatible with docx
export function htmlToDocxContent(html: string): {
    type: "paragraph" | "heading" | "list";
    content: string;
    level?: number;
    listType?: "ordered" | "bullet";
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
}[] {
    if (!html || typeof window === "undefined") return [];

    const temp = document.createElement("div");
    temp.innerHTML = html;

    const result: {
        type: "paragraph" | "heading" | "list";
        content: string;
        level?: number;
        listType?: "ordered" | "bullet";
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
    }[] = [];

    const processNode = (node: Element) => {
        const tagName = node.tagName.toLowerCase();
        const text = node.textContent?.trim() || "";

        if (!text) return;

        switch (tagName) {
            case "h1":
                result.push({ type: "heading", content: text, level: 1 });
                break;
            case "h2":
                result.push({ type: "heading", content: text, level: 2 });
                break;
            case "h3":
                result.push({ type: "heading", content: text, level: 3 });
                break;
            case "ol":
            case "ul":
                const listType = tagName === "ol" ? "ordered" : "bullet";
                node.querySelectorAll("li").forEach((li) => {
                    result.push({
                        type: "list",
                        content: li.textContent?.trim() || "",
                        listType,
                    });
                });
                break;
            case "p":
            default:
                result.push({ type: "paragraph", content: text });
                break;
        }
    };

    temp.childNodes.forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
            processNode(child as Element);
        }
    });

    return result;
}
