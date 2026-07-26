import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export default function ChatInput({
  onSubmit,
  isLoading,
}: ChatInputProps) {

  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    if (!input.trim() || isLoading) return;

    onSubmit(input);

    setInput('');
  };

  return (

    <form
      onSubmit={handleSubmit}
      className="
        w-full
      "
    >

      <div
        className="
          flex
          items-center
          gap-3
          rounded-2xl
          border
          border-zinc-200
          dark:border-zinc-800
          bg-white
          dark:bg-zinc-950
          px-4
          py-3
          shadow-sm
          transition-all
          duration-200
          focus-within:border-zinc-400
          dark:focus-within:border-zinc-600
          focus-within:shadow-md
        "
      >

        {/* Input */}
        <div className="flex-1 min-w-0">

          <input
            type="text"

            value={input}

            onChange={(e) =>
              setInput(e.target.value)
            }

            placeholder="
              Ask AI to generate dashboards,
              charts, metrics, or insights...
            "

            disabled={isLoading}

            className="
              w-full
              bg-transparent
              border-none
              outline-none
              text-sm
              md:text-[15px]
              text-zinc-800
              dark:text-zinc-100
              placeholder:text-zinc-400
              dark:placeholder:text-zinc-500
            "
          />
        </div>

        {/* Button */}
        <button
          type="submit"

          disabled={
            isLoading ||
            !input.trim()
          }

          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-zinc-900
            dark:bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-white
            dark:text-zinc-900
            transition-all
            duration-200
            hover:opacity-90
            disabled:opacity-50
            disabled:cursor-not-allowed
            shrink-0
          "
        >

          {isLoading ? (

            <div
              className="
                h-4
                w-4
                rounded-full
                border-2
                border-white
                dark:border-zinc-900
                border-t-transparent
                animate-spin
              "
            />

          ) : (

            <>
              <Sparkles className="h-4 w-4" />

              <span className="hidden sm:block">
                Generate
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}