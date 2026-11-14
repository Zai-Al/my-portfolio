// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useId, useRef, useState } from "react";
import { IMAGE_TYPES, uploadMedia } from "@/lib/storage";

const inputClass =
  "w-full rounded border border-border bg-void px-2 py-1.5 font-mono text-sm text-white outline-none focus:border-accent";
const smallButton =
  "rounded border border-border px-2 py-1 font-mono text-xs text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30";

const isPdf = (url: string) => /\.pdf($|\?)/i.test(url);

/** Small preview: the image itself, or a PDF badge. */
function Preview({ url, size = "h-16 w-16" }: { url: string; size?: string }) {
  const [broken, setBroken] = useState<string | null>(null);
  const box = `flex ${size} shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-void font-mono text-[10px] text-gray-500`;
  if (!url) return <span className={box}>none</span>;
  if (isPdf(url))
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={`${box} text-accent hover:bg-white/5`}
      >
        PDF ↗
      </a>
    );
  if (broken === url) return <span className={`${box} text-amber-400`}>can&apos;t load</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={box} title="Open full size">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" onError={() => setBroken(url)} />
    </a>
  );
}

/** Hidden file input + button; uploads each chosen file and reports the URLs. */
function UploadButton({
  folder,
  accept,
  multiple = false,
  label,
  onUploaded,
}: {
  folder: string;
  accept: string;
  multiple?: boolean;
  label: string;
  /** All URLs uploaded this time (also after a failure part-way, so none are lost). */
  onUploaded: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const list = Array.from(files);
    const urls: string[] = [];
    try {
      for (const [i, file] of list.entries()) {
        setStatus(list.length > 1 ? `uploading ${i + 1}/${list.length}…` : "uploading…");
        urls.push(await uploadMedia(file, folder));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      if (urls.length) onUploaded(urls);
      setStatus("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <span className="flex flex-col items-start gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => handle(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={!!status}
        className="shrink-0 rounded border border-accent/60 px-3 py-1.5 font-mono text-xs text-accent hover:bg-accent/10 disabled:opacity-50"
      >
        {status || label}
      </button>
      {error && (
        <span role="alert" className="font-mono text-xs text-red-400">
          {error}
        </span>
      )}
    </span>
  );
}

/** One file URL (CV, profile photo, certificate image): preview, upload, or paste a link. */
export function MediaFieldInput({
  label,
  value,
  folder,
  accept = IMAGE_TYPES,
  onChange,
}: {
  label: string;
  value: string;
  folder: string;
  accept?: string;
  onChange: (url: string) => void;
}) {
  const id = useId();
  return (
    <div className="sm:col-span-2">
      <label htmlFor={id} className="font-mono text-xs text-gray-400">
        {label}
      </label>
      <div className="mt-1 flex items-start gap-3">
        <Preview url={value.trim()} />
        <div className="min-w-0 flex-1 space-y-2">
          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="upload a file, or paste a link"
            className={inputClass}
          />
          <div className="flex flex-wrap items-start gap-2">
            <UploadButton
              folder={folder}
              accept={accept}
              label={value ? "replace file" : "upload file"}
              onUploaded={(urls) => onChange(urls[0])}
            />
            {value && (
              <button type="button" onClick={() => onChange("")} className={smallButton}>
                remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A list of image URLs (screenshots): thumbnails in display order, upload several at once. */
export function MediaListInput({
  label,
  value,
  folder,
  accept = IMAGE_TYPES,
  onChange,
}: {
  label: string;
  value: string[];
  folder: string;
  accept?: string;
  onChange: (urls: string[]) => void;
}) {
  const [link, setLink] = useState("");
  const update = onChange;
  const addLink = () => {
    if (!link.trim()) return;
    update([...value, link.trim()]);
    setLink("");
  };
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    update(next);
  };

  return (
    <div className="sm:col-span-2">
      <p className="font-mono text-xs text-gray-400">
        {label} <span className="text-gray-600">({value.length}, shown in this order)</span>
      </p>
      {value.length > 0 && (
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {value.map((url, i) => (
            <li key={`${url}-${i}`} className="rounded border border-border bg-void/60 p-2">
              <Preview url={url} size="h-24 w-full" />
              <div className="mt-2 flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] text-gray-500">#{i + 1}</span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move screenshot ${i + 1} earlier`}
                    className={smallButton}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    aria-label={`Move screenshot ${i + 1} later`}
                    className={smallButton}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => update(value.filter((_, j) => j !== i))}
                    aria-label={`Remove screenshot ${i + 1}`}
                    className="rounded border border-red-500/40 px-2 py-1 font-mono text-xs text-red-400 hover:bg-red-500/10"
                  >
                    ✕
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex flex-wrap items-start gap-2">
        <UploadButton
          folder={folder}
          accept={accept}
          multiple
          label="+ upload images"
          onUploaded={(urls) => update([...value, ...urls])}
        />
        <div className="flex min-w-0 flex-1 gap-2">
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder="or paste an image link"
            aria-label="Image link to add"
            className={inputClass}
          />
          <button type="button" onClick={addLink} className={smallButton}>
            add
          </button>
        </div>
      </div>
    </div>
  );
}
