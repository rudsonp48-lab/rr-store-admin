'use client';

import React, { useState } from 'react';
import { RefreshCw, Save, Sparkles, Check, Smartphone, ArrowRight, ShieldCheck } from 'lucide-react';
import { TRADE_IN_MODELS, TradeInModel } from '../data/tradeInData';
import { formatBRL } from '../data/defaults';
import { btnPrimary, btnGhost, Field, inputCls } from './ui';

interface Props {
  onNotify: (type: 'ok' | 'err', text: string) => void;
}

export default function TradeInAdminPanel({ onNotify }: Props) {
  const [multiplier, setMultiplier] = useState<number>(100);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedBrand, setSelectedBrand] = useState<'Apple' | 'Samsung' | 'Xiaomi'>('Apple');

  const filteredModels = TRADE_IN_MODELS.filter((m) => m.brand === selectedBrand);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Salva preferências no localStorage do navegador do admin
      localStorage.setItem('rr_trade_in_multiplier', String(multiplier));
      setTimeout(() => {
        setIsSaving(false);
        onNotify('ok', `Tabela de Troca Fácil atualizada com margem de ${multiplier}%.`);
      }, 500);
    } catch {
      setIsSaving(false);
      onNotify('err', 'Erro ao salvar tabela de troca.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Explicativo */}
      <div className="rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-0.5 rounded-full">
              Módulo Ativo na Loja
            </span>
            <span className="text-xs text-neutral-400 font-bold">
              • Simulador Trade-In 2026
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Tabela de Avaliação de Usados (Trade-In)
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Quando o cliente seleciona um iPhone, Samsung ou Xiaomi usado no site, o simulador usa esta tabela para calcular o valor de entrada e a volta no PIX.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`${btnPrimary} shrink-0 text-xs sm:text-sm`}
        >
          <Save size={15} />
          {isSaving ? 'Salvando…' : 'Salvar Tabela de Troca'}
        </button>
      </div>

      {/* Controle de Multiplicador Global */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            Ajuste Global de Avaliação (% do Valor de Mercado)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Aumente ou reduza a avaliação média de todos os usados simultaneamente para calibrar a margem da loja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {[90, 95, 100, 105].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setMultiplier(pct)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                multiplier === pct
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Seletor de Marca */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        {(['Apple', 'Samsung', 'Xiaomi'] as const).map((brand) => (
          <button
            key={brand}
            type="button"
            onClick={() => setSelectedBrand(brand)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
              selectedBrand === brand
                ? 'bg-neutral-100 text-neutral-950 border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            {brand === 'Apple' ? '🍎 Apple (iPhones)' : brand}
          </button>
        ))}
      </div>

      {/* Grid de Modelos e Avaliações Base */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">{model.name}</span>
              <span className="text-[10px] font-bold text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">
                {model.brand}
              </span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
              {model.storageOptions.map((opt) => {
                const calculated = Math.round(opt.baseValue * (multiplier / 100));
                return (
                  <div
                    key={opt.storage}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-neutral-950/60 border border-neutral-800/50"
                  >
                    <span className="font-bold text-neutral-400">{opt.storage}</span>
                    <span className="font-black text-emerald-400">
                      {formatBRL(calculated)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
