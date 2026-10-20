'use client';

import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react';
import { HeroBanner, Product } from '../types/store';
import ImageField from './ImageField';
import { btnDanger, btnGhost, btnPrimary, Field, inputCls } from './ui';

interface Props {
  banners: HeroBanner[];
  products: Product[];
  isPublished: boolean;
  publish: (next: HeroBanner[], okMsg?: string) => Promise<boolean>;
}

export default function BannersPanel({ banners, products, isPublished, publish }: Props) {
  const [editing, setEditing] = useState<HeroBanner | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing({ id: `b-${Date.now().toString(36)}`, imagem: '', titulo: '', produtoId: '', ativo: true });
    setIsNew(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const final: HeroBanner = {
      id: editing.id,
      imagem: editing.imagem,
      ativo: editing.ativo,
      ...(editing.titulo?.trim() ? { titulo: editing.titulo.trim() } : {}),
      ...(editing.produtoId ? { produtoId: editing.produtoId } : {}),
    };
    setSaving(true);
    const next = isNew ? [...banners, final] : banners.map((b) => (b.id === final.id ? final : b));
    const ok = await publish(next, 'Banner publicado.');
    setSaving(false);
    if (ok) setEditing(null);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= banners.length) return;
    const next = [...banners];
    [next[i], next[j]] = [next[j], next[i]];
    publish(next, 'Ordem atualizada.');
  };

  const toggle = (b: HeroBanner) =>
    publish(
      banners.map((x) => (x.id === b.id ? { ...x, ativo: !x.ativo } : x)),
      b.ativo ? 'Banner desativado.' : 'Banner ativado.'
    );

  const remove = (b: HeroBanner) => {
    if (!window.confirm('Excluir este banner?')) return;
    publish(
      banners.filter((x) => x.id !== b.id),
      'Banner excluído.'
    );
  };

  const productName = (id?: string) => products.find((p) => p.id === id)?.nome;

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Banners da vitrine ({banners.length})</h2>
          <p className="text-xs text-neutral-500">
            {banners.length === 0
              ? 'Nenhum banner publicado: a loja mostra automaticamente os primeiros produtos.'
              : isPublished
                ? 'Os banners ativos aparecem na vitrine na ordem abaixo.'
                : ''}{' '}
            Tamanho recomendado: 1600×1100 px.
          </p>
        </div>
        <button onClick={openNew} className={btnPrimary}>
          <Plus size={16} /> Novo banner
        </button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {banners.map((b, i) => (
          <li key={b.id} className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
            <div className="relative aspect-[16/9] bg-neutral-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.imagem}
                alt={b.titulo || 'Banner'}
                loading="lazy"
                className={`w-full h-full object-cover ${b.ativo ? '' : 'opacity-40 grayscale'}`}
              />
              <span className="absolute top-2 left-2 text-[11px] px-2 py-0.5 rounded-full bg-black/70 border border-neutral-700">
                #{i + 1} {b.ativo ? '· Ativo' : '· Inativo'}
              </span>
            </div>
            <div className="p-3 space-y-2">
              <div>
                <p className="text-sm font-medium truncate">{b.titulo || 'Sem título'}</p>
                <p className="text-[11px] text-neutral-500 truncate">
                  {b.produtoId ? `Produto: ${productName(b.produtoId) ?? 'não encontrado'}` : 'Sem produto vinculado (abre o catálogo)'}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className={btnGhost} aria-label="Subir">
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === banners.length - 1}
                  className={btnGhost}
                  aria-label="Descer"
                >
                  <ArrowDown size={14} />
                </button>
                <button onClick={() => toggle(b)} className={btnGhost} aria-label="Ativar/desativar">
                  {b.ativo ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => {
                    setEditing({ ...b });
                    setIsNew(false);
                  }}
                  className={btnGhost}
                  aria-label="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(b)} className={`${btnDanger} ml-auto`} aria-label="Excluir">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </li>
        ))}
        {banners.length === 0 && (
          <li className="col-span-full text-sm text-neutral-500 py-10 text-center border border-dashed border-neutral-800 rounded-xl">
            Nenhum banner ainda. Clique em “Novo banner” e envie a foto.
          </li>
        )}
      </ul>

      {editing && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-end sm:items-center justify-center">
          <form
            onSubmit={save}
            className="w-full sm:max-w-xl max-h-[94dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-neutral-950 border border-neutral-800 p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{isNew ? 'Novo banner' : 'Editar banner'}</h3>
              <button type="button" onClick={() => setEditing(null)} className={btnGhost} aria-label="Fechar">
                <X size={16} />
              </button>
            </div>

            <Field label="Foto do banner">
              <ImageField
                value={editing.imagem}
                onChange={(u) => setEditing({ ...editing, imagem: u })}
                folder="banners"
                aspect="aspect-[16/9]"
              />
            </Field>

            <Field label="Título (opcional)">
              <input
                value={editing.titulo ?? ''}
                onChange={(e) => setEditing({ ...editing, titulo: e.target.value })}
                className={inputCls}
              />
            </Field>

            <Field label="Produto vinculado (opcional)" hint="O botão do banner leva a este produto.">
              <select
                value={editing.produtoId ?? ''}
                onChange={(e) => setEditing({ ...editing, produtoId: e.target.value })}
                className={inputCls}
              >
                <option value="">— Nenhum (Ver Catálogo) —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </Field>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.ativo}
                onChange={(e) => setEditing({ ...editing, ativo: e.target.checked })}
                className="accent-emerald-500 w-4 h-4"
              />
              Banner ativo
            </label>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className={btnGhost}>
                Cancelar
              </button>
              <button type="submit" disabled={saving || !editing.imagem} className={btnPrimary}>
                {saving ? 'Publicando…' : 'Salvar e publicar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
