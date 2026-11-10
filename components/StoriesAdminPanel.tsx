'use client';

import React, { useState } from 'react';
import { Sparkles, Save, Eye, Film, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { STORE_STORIES, StoryGroup } from '../data/storiesData';
import { btnPrimary, btnGhost, Field, inputCls } from './ui';

interface Props {
  onNotify: (type: 'ok' | 'err', text: string) => void;
}

export default function StoriesAdminPanel({ onNotify }: Props) {
  const [stories, setStories] = useState<StoryGroup[]>(STORE_STORIES);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('rr_store_admin_stories', JSON.stringify(stories));
      setTimeout(() => {
        setIsSaving(false);
        onNotify('ok', 'Stories da loja física atualizados com sucesso.');
      }, 500);
    } catch {
      setIsSaving(false);
      onNotify('err', 'Erro ao salvar stories.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-950 border border-purple-800 px-2.5 py-0.5 rounded-full">
              Stories da Loja (Instagram Style)
            </span>
            <span className="text-xs text-neutral-400 font-bold">
              • Loja D439 & Clientes
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Gerenciador de Stories e Vídeos
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Estes stories aparecem no topo do site (abaixo do banner principal) para humanizar a loja, mostrar os motoboys e o tour pela Loja D439 na Feira dos Importados.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`${btnPrimary} shrink-0 text-xs sm:text-sm`}
        >
          <Save size={15} />
          {isSaving ? 'Salvando…' : 'Salvar Stories'}
        </button>
      </div>

      {/* Grid de Stories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stories.map((story, groupIdx) => (
          <div
            key={story.id}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#7C63E6] to-[#34D399] shrink-0">
                <img
                  src={story.coverImage}
                  alt={story.title}
                  className="w-full h-full rounded-full object-contain bg-black p-0.5"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-white truncate">{story.title}</p>
                <p className="text-[11px] text-neutral-400 truncate">{story.subtitle}</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                Ativo
              </span>
            </div>

            {/* Slides dentro do story */}
            <div className="space-y-2 pt-2 border-t border-neutral-800/80">
              {story.slides.map((slide, slideIdx) => (
                <div
                  key={slide.id}
                  className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/60 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-400 uppercase">
                      Slide {slideIdx + 1}: {slide.tag}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {slide.mediaType}
                    </span>
                  </div>
                  <p className="font-bold text-white text-xs">{slide.headline}</p>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                    {slide.caption}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
