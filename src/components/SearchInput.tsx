"use client";

import { useState, useCallback } from "react";

export default function SearchInput({
  onSearch,
  placeholder = "Search topics, subjects, concepts...",
  className = "",
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValue(v);
      onSearch(v);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setValue("");
    onSearch("");
  }, [onSearch]);

  return (
    <div
      className={`relative flex items-center border transition-colors duration-200 ${
        focused
          ? "border-accent shadow-sm"
          : "border-border hover:border-muted-light"
      } ${className}`}
    >
      <svg
        className="absolute left-3.5 w-4 h-4 text-muted-light pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 bg-background text-foreground placeholder:text-muted-light text-base focus:outline-none"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 p-0.5 text-muted hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
