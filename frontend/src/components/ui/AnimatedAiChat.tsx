"use client";

import { useEffect, useRef, useCallback, useTransition, useState } from "react";
import { cn } from "../../lib/utils";
import {
    FileUp,
    PenTool,
    MonitorIcon,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
    SendIcon,
    XIcon,
    LoaderIcon,
    Sparkles,
    Command,
    Network,
    FileText,
    GitBranch,
    Link as LinkIcon,
    Trash2,
    Activity,
    ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import * as React from "react"

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    prefix: string;
}

interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    containerClassName?: string;
    showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, containerClassName, showRing = true, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);

        return (
            <div className={cn(
                "relative",
                containerClassName
            )}>
                <textarea
                    className={cn(
                        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                        "transition-all duration-200 ease-in-out",
                        "placeholder:text-muted-foreground",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
                        className
                    )}
                    ref={ref}
                    onFocus={(e) => {
                        setIsFocused(true);
                        if (props.onFocus) props.onFocus(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        if (props.onBlur) props.onBlur(e);
                    }}
                    {...props}
                />

                {showRing && isFocused && (
                    <motion.span
                        className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-offset-0 ring-[#F3F4F6]/20 transition-all"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                )}
            </div>
        )
    }
)
Textarea.displayName = "Textarea"

export function AnimatedAIChat() {
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [recentCommand, setRecentCommand] = useState<string | null>(null);
    const [answer, setAnswer] = useState("");
    const [sources, setSources] = useState<string[]>([]);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });
    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);

    const commandSuggestions: CommandSuggestion[] = [
        { icon: <Network className="w-4 h-4" />, label: "Analyze Architecture", prefix: "/architecture" },
        { icon: <FileText className="w-4 h-4" />, label: "Generate Documentation", prefix: "/docs" },
        { icon: <Sparkles className="w-4 h-4" />, label: "Explain Module", prefix: "/explain" },
        { icon: <GitBranch className="w-4 h-4" />, label: "Trace API Flow", prefix: "/trace" },
        { icon: <LinkIcon className="w-4 h-4" />, label: "Find Dependencies", prefix: "/dependencies" },
        { icon: <Trash2 className="w-4 h-4" />, label: "Find Dead Code", prefix: "/deadcode" },
        { icon: <Activity className="w-4 h-4" />, label: "Generate Sequence Diagram", prefix: "/sequence" },
        { icon: <ShieldAlert className="w-4 h-4" />, label: "Security Review", prefix: "/security" },
    ];

    const placeholders = [
        "Ask about your architecture...",
        "Explain the authentication flow...",
        "Where is JWT generated?...",
        "Trace the payment pipeline...",
        "Generate onboarding docs...",
        "Find circular dependencies..."
    ];
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (value.startsWith('/') && !value.includes(' ')) {
            setShowCommandPalette(true);

            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(value)
            );

            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');

            if (commandPaletteRef.current &&
                !commandPaletteRef.current.contains(target) &&
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev =>
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev =>
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    setValue(selectedCommand.prefix + ' ');
                    setShowCommandPalette(false);

                    setRecentCommand(selectedCommand.label);
                    setTimeout(() => setRecentCommand(null), 3500);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleSendMessage();
            }
        }
    };

    const handleSendMessage = async () => {
        if (!value.trim()) return;

        setIsTyping(true);
        try {
            const response = await fetch("http://127.0.0.1:8000/ask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question: value }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const data = await response.json();

            setAnswer(data.answer || "");
            setSources(data.sources || []);

            setValue("");
            adjustHeight(true);
        } catch (error) {
            console.error(error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleAttachFile = () => {
        const mockFileName = `file-${Math.floor(Math.random() * 1000)}.pdf`;
        setAttachments(prev => [...prev, mockFileName]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const selectCommandSuggestion = (index: number) => {
        const selectedCommand = commandSuggestions[index];
        setValue(selectedCommand.prefix + ' ');
        setShowCommandPalette(false);

        setRecentCommand(selectedCommand.label);
        setTimeout(() => setRecentCommand(null), 2000);
    };

    return (
        <div className="min-h-screen flex flex-col w-full items-center justify-center bg-[#080B10] text-[#F3F4F6] p-6 relative overflow-hidden">
            <div className="w-full max-w-3xl mx-auto relative">
                <motion.div
                    className="relative z-10 space-y-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="text-center space-y-3">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-block"
                        >
                            <h1 className="text-4xl font-heading font-light tracking-tight text-[#F3F4F6] pb-1">
                                Ask anything about your codebase.
                            </h1>
                        </motion.div>
                        <motion.p
                            className="text-[15px] font-medium text-[#8B939E] max-w-xl mx-auto"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            ContextForge answers using semantic search across your repository and cites the exact source files.
                        </motion.p>
                    </div>

                    <div className="w-full">
                        {/* Repository Card */}
                        <motion.div
                            className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 mb-6 rounded-xl border border-[#232A32] bg-[#11161C] shadow-sm hover:-translate-y-0.5 transition-transform duration-200"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#1A2129] flex items-center justify-center border border-[#232A32]">
                                    <GitBranch className="w-4 h-4 text-[#F3F4F6]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[#F3F4F6] text-sm">contextforge</span>
                                    <span className="text-xs text-[#8B939E] font-medium mt-0.5">18,421 Files • 3.2M Tokens • Last Indexed 2 minutes ago</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3 sm:mt-0 px-3 py-1.5 rounded-md bg-[#4ADE80]/10 border border-[#4ADE80]/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                                <span className="text-xs font-semibold text-[#4ADE80]">Healthy</span>
                            </div>
                        </motion.div>

                        <AnimatePresence>
                            {answer && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mb-6 rounded-2xl border border-[#232A32] bg-[#11161C] p-6"
                                >
                                    <h3 className="text-sm font-semibold text-white mb-4">
                                        ContextForge
                                    </h3>

                                    <p className="text-[#C8CDD4] leading-8 whitespace-pre-wrap">
                                        {answer}
                                    </p>

                                    {sources.length > 0 && (
                                        <div className="mt-6 border-t border-[#232A32] pt-4">
                                            <p className="text-xs uppercase tracking-wider text-[#8B939E] mb-3">
                                                Sources
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                {sources.map((source, index) => (
                                                    <span
                                                        key={index}
                                                        className="rounded-md border border-[#232A32] bg-[#1A2129] px-3 py-1 text-xs text-[#8B939E]"
                                                    >
                                                        {source}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div
                            className="relative bg-[#11161C] rounded-2xl border border-[#232A32] shadow-xl"
                            initial={{ scale: 0.98 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <AnimatePresence>
                                {showCommandPalette && (
                                    <motion.div
                                        ref={commandPaletteRef}
                                        className="absolute left-4 right-4 bottom-full mb-2 bg-[#1A2129] rounded-xl z-50 shadow-lg border border-[#232A32] overflow-hidden"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <div className="py-2">
                                            {commandSuggestions.map((suggestion, index) => (
                                                <motion.div
                                                    key={suggestion.prefix}
                                                    className={cn(
                                                        "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer",
                                                        activeSuggestion === index
                                                            ? "bg-[#232A32] text-[#F3F4F6]"
                                                            : "text-[#8B939E] hover:bg-[#232A32] hover:text-[#F3F4F6]"
                                                    )}
                                                    onClick={() => selectCommandSuggestion(index)}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: index * 0.02 }}
                                                >
                                                    <div className="w-5 h-5 flex items-center justify-center">
                                                        {suggestion.icon}
                                                    </div>
                                                    <div className="font-medium">{suggestion.label}</div>
                                                    <div className="text-[#8B939E] text-xs ml-auto font-mono">
                                                        {suggestion.prefix}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="p-2 relative">
                                <Textarea
                                    ref={textareaRef}
                                    value={value}
                                    onChange={(e) => {
                                        setValue(e.target.value);
                                        adjustHeight();
                                    }}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setInputFocused(true)}
                                    onBlur={() => setInputFocused(false)}
                                    containerClassName="w-full"
                                    className={cn(
                                        "w-full px-4 py-3",
                                        "resize-none",
                                        "bg-transparent",
                                        "border-none",
                                        "text-[#F3F4F6] text-[15px]",
                                        "focus:outline-none",
                                        "placeholder:text-transparent", // Hide default to use custom animated one
                                        "min-h-[60px]"
                                    )}
                                    style={{
                                        overflow: "hidden",
                                    }}
                                    showRing={true}
                                />

                                {/* Animated Placeholder */}
                                {!value && (
                                    <div className="absolute top-[22px] left-6 pointer-events-none overflow-hidden h-6 w-[80%]">
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={placeholderIndex}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.3 }}
                                                className="text-[#8B939E] text-[15px] absolute"
                                            >
                                                {placeholders[placeholderIndex]}
                                            </motion.span>
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            <AnimatePresence>
                                {attachments.length > 0 && (
                                    <motion.div
                                        className="px-4 pb-3 flex gap-2 flex-wrap"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        {attachments.map((file, index) => (
                                            <motion.div
                                                key={index}
                                                className="flex items-center gap-2 text-xs bg-[#1A2129] py-1.5 px-3 rounded-md text-[#8B939E] border border-[#232A32]"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                            >
                                                <span>{file}</span>
                                                <button
                                                    onClick={() => removeAttachment(index)}
                                                    className="hover:text-[#F3F4F6] transition-colors"
                                                >
                                                    <XIcon className="w-3 h-3" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="p-3 border-t border-[#232A32] flex items-center justify-between gap-4 bg-[#11161C] rounded-b-2xl">
                                <div className="flex items-center gap-2">
                                    <motion.button
                                        type="button"
                                        onClick={handleAttachFile}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="p-2 text-[#8B939E] hover:text-[#F3F4F6] hover:bg-[#1A2129] rounded-lg transition-colors"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        data-command-button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowCommandPalette(prev => !prev);
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={cn(
                                            "p-2 text-[#8B939E] hover:text-[#F3F4F6] hover:bg-[#1A2129] rounded-lg transition-colors",
                                            showCommandPalette && "bg-[#1A2129] text-[#F3F4F6]"
                                        )}
                                    >
                                        <Command className="w-5 h-5" />
                                    </motion.button>
                                </div>

                                <motion.button
                                    type="button"
                                    onClick={handleSendMessage}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={isTyping || !value.trim()}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        "flex items-center gap-2",
                                        value.trim()
                                            ? "bg-white text-[#080B10] shadow-sm"
                                            : "bg-[#1A2129] text-[#8B939E]"
                                    )}
                                >
                                    {isTyping ? (
                                        <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                                    ) : (
                                        <SendIcon className="w-4 h-4" />
                                    )}
                                    <span>Send</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {commandSuggestions.map((suggestion, index) => (
                            <motion.button
                                key={suggestion.prefix}
                                onClick={() => selectCommandSuggestion(index)}
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2.5 px-4 py-2.5 bg-[#11161C] border border-[#232A32] hover:border-[#8B939E]/50 rounded-xl text-sm font-medium text-[#8B939E] hover:text-[#F3F4F6] hover:bg-[#1A2129] transition-all shadow-sm"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <span className="text-[#8B939E] group-hover:text-inherit transition-colors">
                                    {suggestion.icon}
                                </span>
                                <span>{suggestion.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {isTyping && (
                    <motion.div
                        className="fixed bottom-8 mx-auto transform -translate-x-1/2 bg-[#11161C] rounded-full px-5 py-2.5 shadow-lg border border-[#232A32]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-md bg-[#1A2129] flex items-center justify-center border border-[#232A32]">
                                <Sparkles className="w-3.5 h-3.5 text-[#F3F4F6]" />
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium text-[#8B939E]">
                                <span>ContextForge is thinking</span>
                                <TypingDots />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center ml-1 gap-1">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-[#8B939E] rounded-full"
                    initial={{ opacity: 0.3 }}
                    animate={{
                        opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.2,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}
