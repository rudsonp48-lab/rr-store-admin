'use client';

import React, { useMemo, useState } from 'react';
import { Pencil, Plus, RefreshCw, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { Product } from '../types/store';
import { CATEGORIES, PRODUCTS, calculatePixPrice, formatBRL, formatInstallment } from '../data/defaults';
import ImageField from './ImageField';
import { btnDanger, btnGhost, btnPrimary, Field, inputCls } from './ui';

const TAGS: Product['tag'][] = [
  'Mais Vendido',
  'Entrega Hoje DF',
  'Novidade',
  'Oferta Flash',
  'Favorito no DF',
  'Estoque Limitado',
];

const CATS = CATEGORIES.filter((c) => c.id !== 'Todos').map((c) => c.id) as Product['categoria'][];

interface Props {
  products: Product[];
  isPublished: boolean;
  publish: (next: Product[], okMsg?: string) => Promise<boolean>;
}

function emptyProduct(): Product {
  return {
    id: `p-${Date.now().toString(36)}`,
    nome: '',
    categoria: CATS[0],
    precoDe: 0,
    precoPor: 0,
    precoPix: 0,
    parcelamento: '',
    maxParcelasSemJuros: 10,
    avaliacao: 5,
    avaliacoesCount: 0,
    tag: 'Novidade',
    imagem: '',
    descricao: '',
    estoque: 10,
  };
}

export default function ProductsPanel({ products, isPublished, publish }: Props) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Todos');
  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncingSupplier, setSyncingSupplier] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) => (cat === 'Todos' || p.categoria === cat) && (!q || p.nome.toLowerCase().includes(q))
    );
  }, [products, search, cat]);

  const openNew = () => {
    setEditing(emptyProduct());
    setIsNew(true);
  };
  const openEdit = (p: Product) => {
    setEditing({ ...p });
    setIsNew(false);
  };

  const syncSupplierNow = async () => {
    setSyncingSupplier(true);
    try {
      const res = await fetch('/api/supplier-sync');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.products)) {
        throw new Error(data.error || 'Falha ao sincronizar fornecedor');
      }
      const supplierMap = new Map<string, Product>(
        data.products.map((p: Product) => [p.id, p])
      );
      const updated = products.map((p) => {
        const live = supplierMap.get(p.id);
        if (!live) return p;
        supplierMap.delete(p.id);
        return {
          ...p,
          nome: live.nome,
          precoDe: live.precoDe,
          precoPor: live.precoPor,
          precoPix: live.precoPix,
          parcelamento: live.parcelamento,
          imagem: live.imagem || p.imagem,
          estoque: live.estoque,
        };
      });
      const newItems = Array.from(supplierMap.values());
      const merged = [...newItems, ...updated];
      await publish(
        merged,
        `Sincronizado com GSM Digital (${data.products.length} produtos verificados, ${newItems.length} novos).`
      );
    } catch (e) {
      alert(`Erro ao sincronizar com GSM Digital: ${(e as Error).message}`);
    } finally {
      setSyncingSupplier(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const precoPor = Number(editing.precoPor);
    const parcelas = Number(editing.maxParcelasSemJuros) || 1;
    const final: Product = {
      ...editing,
      nome: editing.nome.trim(),
      descricao: editing.descricao.trim(),
      precoDe: Number(editing.precoDe) || precoPor,
      precoPor,
      precoPix: calculatePixPrice(precoPor),
      maxParcelasSemJuros: parcelas,
      parcelamento: formatInstallment(precoPor, parcelas),
      estoque: Math.max(0, Math.floor(Number(editing.estoque) || 0)),
    };
    setSaving(true);
    const next = isNew
      ? [final, ...products]
      : products.map((p) => (p.id === final.id ? final : p));
    const ok = await publish(next, isNew ? 'Produto criado e publicado.' : 'Produto atualizado.');
    setSaving(false);
    if (ok) setEditing(null);
  };

  const remove = async (p: Product) => {
    if (!window.confirm(`Excluir "${p.nome}"? Essa ação publica a remoção na loja.`)) return;
    await publish(
      products.filter((x) => x.id !== p.id),
      'Produto excluído.'
    );
  };

  const restoreDefaults = async () => {
    if (!window.confirm('Substituir o catálogo atual pelo catálogo padrão? Alterações serão perdidas.'))
      return;
    await publish(PRODUCTS, 'Catálogo padrão publicado.');
  };

  const set = <K extends keyof Product>(k: K, v: Product[K]) =>
    setEditing((cur) => (cur ? { ...cur, [k]: v } : cur));

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Produtos ({products.length})</h2>
          <p className="text-xs text-neutral-500">
            {isPublished
              ? 'Catálogo publicado — sincronizado com fornecedor GSM Digital Acessórios.'
              : 'Sincronização automática ativa com GSM Digital Acessórios.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={syncSupplierNow}
            disabled={syncingSupplier}
            className={btnGhost}
            title="Buscar novos produtos, preços e estoque direto de gsmdigitalacessorios.com.br"
          >
            <RefreshCw size={16} className={syncingSupplier ? 'animate-spin text-emerald-400' : 'text-emerald-400'} />
            {syncingSupplier ? 'Sincronizando GSM…' : 'Sincronizar GSM Digital'}
          </button>
          <button onClick={restoreDefaults} className={btnGhost}>
            <RotateCcw size={16} /> {isPublished ? 'Restaurar padrão' : 'Publicar padrão'}
          </button>
          <button onClick={openNew} className={btnPrimary}>
            <Plus size={16} /> Novo produto
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto…"
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} sm:w-72`}>
          <option value="Todos">Todas as categorias</option>
          {CATS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <li
            key={p.id}
            className="flex gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-2.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.imagem}
              alt={p.nome}
              loading="lazy"
              className="w-16 h-16 rounded-lg object-cover bg-neutral-900 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug line-clamp-2">{p.nome}</p>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5">{formatBRL(p.precoPor)}</p>
              <p className="text-[11px] text-neutral-500">
                Estoque: {p.estoque} · {p.tag}
              </p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => openEdit(p)} className={btnGhost} aria-label="Editar">
                <Pencil size={14} />
              </button>
              <button onClick={() => remove(p)} className={btnDanger} aria-label="Excluir">
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="text-sm text-neutral-500 col-span-full py-8 text-center">
            Nenhum produto encontrado.
          </li>
        )}
      </ul>

      {editing && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-end sm:items-center justify-center">
          <form
            onSubmit={save}
            className="w-full sm:max-w-2xl max-h-[94dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-neutral-950 border border-neutral-800 p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{isNew ? 'Novo produto' : 'Editar produto'}</h3>
              <button type="button" onClick={() => setEditing(null)} className={btnGhost} aria-label="Fechar">
                <X size={16} />
              </button>
            </div>

            <Field label="Nome">
              <input
                required
                value={editing.nome}
                onChange={(e) => set('nome', e.target.value)}
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Categoria">
                <select
                  value={editing.categoria}
                  onChange={(e) => set('categoria', e.target.value as Product['categoria'])}
                  className={inputCls}
                >
                  {CATS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Selo">
                <select
                  value={editing.tag}
                  onChange={(e) => set('tag', e.target.value as Product['tag'])}
                  className={inputCls}
                >
                  {TAGS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Preço de (R$)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={editing.precoDe}
                  onChange={(e) => set('precoDe', e.target.value as unknown as number)}
                  className={inputCls}
                />
              </Field>
              <Field label="Preço por (R$)" hint="O preço no Pix (5% off) e o parcelamento são calculados sozinhos.">
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  inputMode="decimal"
                  value={editing.precoPor}
                  onChange={(e) => set('precoPor', e.target.value as unknown as number)}
                  className={inputCls}
                />
              </Field>
              <Field label="Parcelas sem juros">
                <input
                  type="number"
                  min="1"
                  max="12"
                  inputMode="numeric"
                  value={editing.maxParcelasSemJuros}
                  onChange={(e) => set('maxParcelasSemJuros', e.target.value as unknown as number)}
                  className={inputCls}
                />
              </Field>
              <Field label="Estoque">
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={editing.estoque}
                  onChange={(e) => set('estoque', e.target.value as unknown as number)}
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Foto do produto">
              <ImageField value={editing.imagem} onChange={(u) => set('imagem', u)} folder="produtos" />
            </Field>

            <Field label="Descrição">
              <textarea
                rows={3}
                value={editing.descricao}
                onChange={(e) => set('descricao', e.target.value)}
                className={inputCls}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditing(null)} className={btnGhost}>
                Cancelar
              </button>
              <button type="submit" disabled={saving || !editing.imagem} className={btnPrimary}>
                {saving ? 'Publicando…' : 'Salvar e publicar'}
              </button>
            </div>
            {!editing.imagem && (
              <p className="text-[11px] text-neutral-500 text-right">Adicione uma foto para salvar.</p>
            )}
          </form>
        </div>
      )}
    </section>
  );
}
