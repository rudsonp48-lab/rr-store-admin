'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { friendlyError, uploadImage } from '../lib/data';
import { btnGhost, inputCls } from './ui';

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder: 'banners' | 'produtos';
  aspect?: string; // classe tailwind, ex.: 'aspect-[16/11]'
}

export default function ImageField({ value, onChange, folder, aspect = 'aspect-square' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full ${aspect} rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Pré-visualização" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-neutral-500">Sem imagem</span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="animate-spin text-emerald-400" size={28} />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          inputMode="url"
          placeholder="Cole a URL da imagem…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={`${btnGhost} shrink-0`}
        >
          <ImagePlus size={16} /> <span className="hidden sm:inline">Enviar foto</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
