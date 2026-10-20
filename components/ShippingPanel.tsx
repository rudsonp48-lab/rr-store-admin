'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { DFRegion } from '../types/store';
import { btnDanger, btnGhost, btnPrimary, inputCls } from './ui';

interface Props {
  regions: DFRegion[];
  isPublished: boolean;
  publish: (next: DFRegion[]) => Promise<boolean>;
}

export default function ShippingPanel({ regions, isPublished, publish }: Props) {
  const [list, setList] = useState<DFRegion[]>(regions);
  const [saving, setSaving] = useState(false);

  useEffect(() => setList(regions), [regions]);

  const dirty = JSON.stringify(list) !== JSON.stringify(regions) || !isPublished;

  const update = (id: string, patch: Partial<DFRegion>) =>
    setList((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const add = () =>
    setList((cur) => [
      ...cur,
      { id: `r-${Date.now().toString(36)}`, nome: 'Nova localidade', taxaEntrega: 10, tempoEstimado: '1 a 2h', freteGratisAcimaDe: 200 },
    ]);

  const save = async () => {
    setSaving(true);
    const clean = list.map((r) => ({
      ...r,
      nome: r.nome.trim(),
      taxaEntrega: Number(r.taxaEntrega) || 0,
      freteGratisAcimaDe: Number(r.freteGratisAcimaDe) || 0,
    }));
    await publish(clean);
    setSaving(false);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Fretes por localidade ({list.length})</h2>
          <p className="text-xs text-neutral-500">
            {isPublished ? 'Fretes publicados.' : 'Ainda não publicado: a loja usa as taxas padrão.'}{' '}
            Frete grátis = 0 desativa.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={add} className={btnGhost}>
            <Plus size={16} /> Localidade
          </button>
          <button onClick={save} disabled={!dirty || saving} className={btnPrimary}>
            <Save size={16} /> {saving ? 'Publicando…' : dirty ? 'Publicar alterações' : 'Publicado'}
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {list.map((r) => (
          <li
            key={r.id}
            className="grid grid-cols-2 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-2 items-end rounded-xl border border-neutral-800 bg-neutral-950 p-3"
          >
            <label className="col-span-2 sm:col-span-1">
              <span className="block text-[11px] text-neutral-500 mb-1">Localidade</span>
              <input value={r.nome} onChange={(e) => update(r.id, { nome: e.target.value })} className={inputCls} />
            </label>
            <label>
              <span className="block text-[11px] text-neutral-500 mb-1">Taxa (R$)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={r.taxaEntrega}
                onChange={(e) => update(r.id, { taxaEntrega: e.target.value as unknown as number })}
                className={inputCls}
              />
            </label>
            <label>
              <span className="block text-[11px] text-neutral-500 mb-1">Prazo</span>
              <input
                value={r.tempoEstimado}
                onChange={(e) => update(r.id, { tempoEstimado: e.target.value })}
                className={inputCls}
              />
            </label>
            <label>
              <span className="block text-[11px] text-neutral-500 mb-1">Grátis acima de (R$)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={r.freteGratisAcimaDe}
                onChange={(e) => update(r.id, { freteGratisAcimaDe: e.target.value as unknown as number })}
                className={inputCls}
              />
            </label>
            <button
              onClick={() => setList((cur) => cur.filter((x) => x.id !== r.id))}
              className={`${btnDanger} col-span-2 sm:col-span-1`}
              aria-label="Remover"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
