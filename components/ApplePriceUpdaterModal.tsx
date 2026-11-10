'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  RotateCcw,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  X,
} from 'lucide-react';
import { Product } from '../types/store';
import {
  matchAppleItems,
  parseAppleWhatsAppList,
  ParsedAppleItem,
  createAppleProductFromItem,
} from '../lib/apple-price-parser';
import { formatBRL, formatInstallment } from '../data/defaults';
import { btnGhost, btnPrimary, inputCls } from './ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  publish: (next: Product[], okMsg?: string) => Promise<boolean>;
}

export const INITIAL_APPLE_LIST_SAMPLE = `*🩵*Numero RR-MOBILE: RR MOBILE: Provérbios 3:5-6: "Confia no Senhor de todo o teu coração, e não te animes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele te endireitará.*
Terca-Feira  Chama Minha Joia 💍 10/11/26*📢

Verifique até o final

📱 iPhone 18  Duo 256gb (americano 🇺🇸)💯 prazo, no pix sem fiado 

🤍Silver: 14.500
🖤Preto: 14.500

📱 iPhone 18  Duo 512gb (americano 🇺🇸)💯 prazo, no pix sem fiado 

🤍Silver: 15.500


📱 iPhone 17  pro max 512 (americano 🇺🇸)💯 prazo, no pix sem fiado 

🤍Silver: 8.750

📱 iPhone 18 pro 256gb (americano 🇺🇸)💯 prazo, no pix sem fiado 

🩷 Bordo: 7.750


📱 iPhone 18  pro max 256gb (americano 🇺🇸)💯 prazo, no pix sem fiado 

💜 Bordô: 9.000
💙 Azul: 9.000
🖤 Preto:8.899
🤍 Silver:8.700

📱 iPhone 18 pro 512gb (americano 🇺🇸)💯 prazo, no pix sem fiado 

🩷 Bordo: 9.600

📱 iPhone 18  pro  Max 512gb (americano 🇺🇸)💯 prazo, no pix sem fiado 

🩷 Bordo: 10.850

⌚️Apple watch S11 42 mm

🩷Rose Gold: 2.300


⌚️Apple watch S12 42 mm

🖤 Preto: 2.950
🩶 Gray: 2.950
🩷RoseGold: 2.950

⌚️Apple watch S12 46 mm

🖤  Preto: 3.150
🧡 Gold: 3150

⌚️Apple watch SE 3 40mm

🖤Preto: 1.650
💛Starlight:1.850

⌚️Apple watch SE 3 44mm

🖤Midnight: 1.999

⌚️Apple watch SE 2 44mm

🖤Midnight: 1.550

⌚️Apple watch Ultra 3 49mm Black

🖤pulseira tecido: 4.650

—————————————
—————————————

💍JOIAS APLLE

💎 MacBook Neo 8gb  256gb T13


💙Azul: 5.199

💎 MacBook Neo 8gb  512gb T13

🤍Silver: 5.850
🩷Rosa:5.900

💎 MacBook Air M5 16gb  512gb T13

🖤 Midinight: 8.150
💙Sky Blue: 8.150
🤍Silver: 8.150

——————————————

——————————————————————————

💍JOIAS APLLE

💎 Magic Keyboard 11” Ipad pro M5

🖤 Space gray: 2650

💎 Magic Keyboard 13” Ipad pro M5
        zerou no estoque 

💎 Magic Keyboard 11" Ipad Air M3/M4 

🖤 Preta: 2.650

💎 iPad Pro M5 T13  256gb WIFI

🖤Preto: 8.850
🤍Branco: 8.850

💎 iPad Pro M5 T11  256gb 

⚫ space black: 7.850

💎 iPad Pro M5 T11  512gb 

⚫ space black: 8.750

💎 iPad Air M4 T11 128gb

💙Azul: 4.850

💎 iPad Air M4 T13 128gb

🩶 Space Gray: 6.099

💎 iPad Air M4 T13 256gb

🩶 Space Gray: 6.950

💎 iPad 11 128gb sem menos 

💙Azul: 2.850
🤍Silver: 2.900
🩷Rosa: 2.900

💎 iPad 11 256gb sem menos 

🤍Silver: zerou no estoque

💎 iPad mini 7 (A17PRO) 256gb

🩶SpaceGray: 4.499

💎 iPad mini 7 (A17PRO) 128gb WIFI+CELULAR

🩶SpaceGray: 4.950

——————————————————————————

💍 JOIAS APLLE  ACESSORIOS

🖱️ Magic Mouse 3 USB-C

🤍 Branco: 700
🖤Preto: 780

🖋️ Apple Pencil 1 USB-C

🤍 650

🖋️ Apple Pencil pro

▫️799

🖱️ Teclado Numérico with Touch ID

🤍Branco: 1.650
🖤 Preto: 1750


🖱️ Teclado with Touch ID

🤍zerou

🖱️ Magic Trackpad 

🤍 Branco : 999

🎧 AirPods Max 2 (CHIP H2)

💜Roxo: 3.499

🎧 AirPods 4 C/ cancelamento

▫️1.280

🎧 AirPods 4 Regular

▫️830

🎧 AirPods 5 C/ cancelamento

▫️1.450

🎧 AirPods 5 Regular

▫️1.280

🎧 AirPods pro 3

▫️1.450

🎧 AirTag Pack 4 modelo 1

▫️630

🎧 AirTag Pack 4 modelo 2

▫️780

🎧AirTag 2 unidade

▫️250 

💎 Fonte p/ Macbook USB-C 97W ( 1 ano de garantia)

■ 199

💎 Fonte Original USB-C 35w

■ 150

💎 Fonte Original USB-C 20w

▫️75.00 

💎 Cabo Original Lighting 1m

▫️zerou no estoque

💎 Cabo Original USB-C 1m

Zerou

💎 Cabo Original Lighting 2m

▫️100.00

💎 Cabo Original USB-C 240W 2m

▫️130

💎 Cabo USB-C Original Retirado

▫️100

💎 Magsafe Charger USB-C Original4 (carregador indução)

■150

💎 Cabo watch Original 

■185`;

type FilterTab = 'todos' | 'alterados' | 'zerados' | 'sem_match';

export default function ApplePriceUpdaterModal({
  isOpen,
  onClose,
  products,
  publish,
}: Props) {
  const [listText, setListText] = useState(INITIAL_APPLE_LIST_SAMPLE);
  const [analyzed, setAnalyzed] = useState(false);
  const [items, setItems] = useState<ParsedAppleItem[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('todos');
  const [search, setSearch] = useState('');
  const [zeroOutStock, setZeroOutStock] = useState(true);
  const [autoCreateNew, setAutoCreateNew] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const productMap = useMemo(() => {
    return new Map<string, Product>(products.map((p) => [p.id, p]));
  }, [products]);

  const handleAnalyze = () => {
    if (!listText.trim()) return;
    const parsed = parseAppleWhatsAppList(listText);
    const matched = matchAppleItems(parsed, products);
    setItems(matched);
    setAnalyzed(true);
  };

  const handleToggleSelect = (index: number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, selected: !it.selected } : it))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setItems((prev) => prev.map((it) => ({ ...it, selected: select })));
  };

  const stats = useMemo(() => {
    const total = items.length;
    const matched = items.filter((i) => !!i.matchedProductId).length;
    const zerados = items.filter((i) => i.isZerou).length;
    const changed = items.filter(
      (i) => !!i.matchedProductId && !i.isZerou && (i.priceDiff ?? 0) !== 0
    ).length;
    const noMatch = total - matched;
    const selectedMatchedCount = items.filter((i) => i.selected && !!i.matchedProductId).length;
    const selectedNewCount = items.filter((i) => i.selected && !i.matchedProductId).length;
    const totalSelected = selectedMatchedCount + (autoCreateNew ? selectedNewCount : 0);
    return {
      total,
      matched,
      zerados,
      changed,
      noMatch,
      selectedMatchedCount,
      selectedNewCount,
      totalSelected,
    };
  }, [items, autoCreateNew]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .map((it, originalIdx) => ({ it, originalIdx }))
      .filter(({ it }) => {
        if (filterTab === 'alterados' && ((it.priceDiff ?? 0) === 0 || it.isZerou || !it.matchedProductId)) {
          return false;
        }
        if (filterTab === 'zerados' && !it.isZerou) return false;
        if (filterTab === 'sem_match' && it.matchedProductId) return false;

        if (q) {
          const matchName = it.matchedProductName?.toLowerCase() || '';
          const headerName = it.header.toLowerCase();
          const colorName = it.color.toLowerCase();
          return matchName.includes(q) || headerName.includes(q) || colorName.includes(q);
        }
        return true;
      });
  }, [items, filterTab, search]);

  const handleApplyUpdates = async () => {
    const selectedMatched = items.filter((i) => i.selected && i.matchedProductId);
    const selectedNew = autoCreateNew
      ? items.filter((i) => i.selected && !i.matchedProductId)
      : [];

    if (selectedMatched.length === 0 && selectedNew.length === 0) {
      alert('Nenhum item selecionado para atualizar ou cadastrar.');
      return;
    }

    setIsPublishing(true);
    try {
      // 1. Atualiza produtos existentes no catálogo
      const updatedCatalog = products.map((prod) => {
        const itemUpdate = selectedMatched.find((it) => it.matchedProductId === prod.id);
        if (!itemUpdate) return prod;

        if (itemUpdate.isZerou && zeroOutStock) {
          return {
            ...prod,
            estoque: 0,
            descricao: prod.descricao.includes('(Zerou no Estoque)')
              ? prod.descricao
              : `${prod.descricao} (Aguardando reposição de lote)`,
          };
        }

        if (!itemUpdate.isZerou && itemUpdate.price > 0) {
          const precoIntegral = itemUpdate.price;
          const parcelas = precoIntegral >= 200 ? 12 : precoIntegral >= 80 ? 6 : 3;
          return {
            ...prod,
            precoCusto: precoIntegral,
            precoDe: Math.round(precoIntegral * 1.15),
            precoPor: precoIntegral,
            precoPix: precoIntegral, // Regra integral de atacado sem desconto no PIX
            maxParcelasSemJuros: parcelas,
            parcelamento: formatInstallment(precoIntegral, parcelas),
            estoque: prod.estoque === 0 ? 5 : prod.estoque,
          };
        }

        return prod;
      });

      // 2. Cria novos produtos detectados que ainda não existiam
      const newProductsCreated: Product[] = [];
      for (const newItem of selectedNew) {
        const newProd = createAppleProductFromItem(newItem);
        if (
          !updatedCatalog.some((p) => p.id === newProd.id) &&
          !newProductsCreated.some((p) => p.id === newProd.id)
        ) {
          newProductsCreated.push(newProd);
        }
      }

      const finalCatalog = [...newProductsCreated, ...updatedCatalog];

      const msgParts = [];
      if (selectedMatched.length > 0) {
        msgParts.push(`${selectedMatched.length} produtos atualizados`);
      }
      if (newProductsCreated.length > 0) {
        msgParts.push(`${newProductsCreated.length} novos produtos cadastrados com foto real`);
      }

      const ok = await publish(
        finalCatalog,
        `Sucesso! ${msgParts.join(' e ')} na loja RR Mobile.`
      );

      if (ok) {
        onClose();
      }
    } catch (err) {
      alert('Erro ao atualizar preços Apple: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Sparkles size={20} className="text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                Atualizar Preços Apple (Lista WhatsApp)
              </h2>
              <p className="text-[11px] sm:text-xs text-neutral-400 truncate">
                Preços de atacado integrais da RR Mobile aplicados diretamente na vitrine.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4">
          {!analyzed ? (
            <div className="space-y-3.5">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 sm:p-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
                <FileText size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Cole abaixo a lista completa recebida no WhatsApp da <strong>RR Mobile</strong>. O
                  sistema reconhece automaticamente iPhones (incluindo iPhone 18 Duo, Pro e Pro Max),
                  Apple Watches, MacBooks, iPads, AirPods, AirTags e Acessórios, atualiza os preços,
                  marca os itens zerados e <strong>cadastra automaticamente novos produtos</strong> com
                  foto real oficial e descrições perfeitas.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Mensagem copiada do WhatsApp:
                  </label>
                  <button
                    onClick={() => setListText(INITIAL_APPLE_LIST_SAMPLE)}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Carregar Lista Atualizada (10/11/26)
                  </button>
                </div>

                <textarea
                  value={listText}
                  onChange={(e) => setListText(e.target.value)}
                  placeholder="Cole aqui a mensagem de texto com os preços..."
                  rows={12}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 font-mono text-xs text-neutral-200 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={onClose} className={`${btnGhost} text-xs`}>
                  Cancelar
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!listText.trim()}
                  className={`${btnPrimary} text-xs sm:text-sm`}
                >
                  <Sparkles size={16} /> Analisar Lista com Inteligência RR
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Itens Lidos</span>
                  <p className="text-lg sm:text-xl font-bold text-white mt-0.5">{stats.total}</p>
                  <p className="text-[10px] text-emerald-400">{stats.matched} encontrados na loja</p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Com Mudança</span>
                  <p className="text-lg sm:text-xl font-bold text-blue-400 mt-0.5">{stats.changed}</p>
                  <p className="text-[10px] text-neutral-500">Novo valor detectado</p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Zerados no Estoque</span>
                  <p className="text-lg sm:text-xl font-bold text-red-400 mt-0.5">{stats.zerados}</p>
                  <p className="text-[10px] text-neutral-500">Estoque será zerado</p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Novos Produtos</span>
                  <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5">{stats.noMatch}</p>
                  <p className="text-[10px] text-emerald-300">Prontos para cadastrar com foto</p>
                </div>
              </div>

              {/* Filters & Options */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterTab('todos')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      filterTab === 'todos'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-neutral-400 hover:text-white bg-neutral-900'
                    }`}
                  >
                    Todos ({items.length})
                  </button>
                  <button
                    onClick={() => setFilterTab('alterados')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      filterTab === 'alterados'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'text-neutral-400 hover:text-white bg-neutral-900'
                    }`}
                  >
                    Com alteração ({stats.changed})
                  </button>
                  <button
                    onClick={() => setFilterTab('zerados')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      filterTab === 'zerados'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'text-neutral-400 hover:text-white bg-neutral-900'
                    }`}
                  >
                    Zerados ({stats.zerados})
                  </button>
                  <button
                    onClick={() => setFilterTab('sem_match')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      filterTab === 'sem_match'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-neutral-400 hover:text-white bg-neutral-900'
                    }`}
                  >
                    Novos Produtos ({stats.noMatch})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-48">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filtrar..."
                      className={`${inputCls} !py-1.5 !pl-8 text-xs`}
                    />
                  </div>
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="text-[11px] text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-900"
                  >
                    Marcar todos
                  </button>
                </div>
              </div>

              {/* Toggles Options */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-2.5 rounded-xl bg-neutral-900/40 border border-neutral-800/80">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={zeroOutStock}
                    onChange={(e) => setZeroOutStock(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-0"
                  />
                  <span>Zerar estoque dos produtos marcados como <strong>zerou no estoque</strong></span>
                </label>

                <label className="flex items-center gap-2 text-xs text-emerald-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoCreateNew}
                    onChange={(e) => setAutoCreateNew(e.target.checked)}
                    className="rounded border-emerald-600 bg-neutral-900 text-emerald-500 focus:ring-0"
                  />
                  <span>
                    Cadastrar novos produtos automaticamente (com <strong>foto real e descrições</strong>)
                  </span>
                </label>
              </div>

              {/* Items List */}
              <div className="border border-neutral-800 rounded-xl divide-y divide-neutral-800/60 max-h-[46vh] overflow-y-auto bg-neutral-900/30">
                {filteredItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    Nenhum item corresponde ao filtro atual.
                  </div>
                ) : (
                  filteredItems.map(({ it, originalIdx }) => {
                    const matchedProd = it.matchedProductId ? productMap.get(it.matchedProductId) : null;
                    const previewProd = !it.matchedProductId ? createAppleProductFromItem(it) : null;
                    const diff = it.priceDiff ?? 0;

                    return (
                      <div
                        key={originalIdx}
                        className={`p-2.5 sm:p-3 flex items-center justify-between gap-3 text-xs transition ${
                          it.selected ? 'bg-neutral-900/50' : 'opacity-60 bg-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={it.selected}
                            onChange={() => handleToggleSelect(originalIdx)}
                            className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0 shrink-0"
                          />

                          {/* Foto real do produto */}
                          {(matchedProd?.imagem || previewProd?.imagem) && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={matchedProd?.imagem || previewProd?.imagem}
                              alt=""
                              className="w-9 h-9 rounded-lg object-contain bg-neutral-950 border border-neutral-800 shrink-0 p-0.5"
                            />
                          )}

                          <div className="min-w-0 flex-1">
                            {it.matchedProductId ? (
                              <p className="font-semibold text-white truncate">
                                {matchedProd?.nome || it.matchedProductName}
                              </p>
                            ) : (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                                  Novo
                                </span>
                                <p className="font-semibold text-emerald-300 truncate">
                                  {previewProd?.nome}
                                </p>
                              </div>
                            )}
                            <p className="text-[11px] text-neutral-400 truncate">
                              Linha lida: <span className="font-mono text-neutral-300">{it.rawLine}</span>
                            </p>
                          </div>
                        </div>

                        {/* Price / Stock Column */}
                        <div className="text-right shrink-0">
                          {it.isZerou ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 border border-red-800 text-red-300">
                              ZEROU ESTOQUE
                            </span>
                          ) : it.matchedProductId ? (
                            <div>
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="text-[11px] text-neutral-500 line-through">
                                  {formatBRL(it.currentPrice ?? 0)}
                                </span>
                                <ArrowRight size={11} className="text-neutral-500" />
                                <span className="font-bold text-emerald-400 text-xs sm:text-sm">
                                  {formatBRL(it.price)}
                                </span>
                              </div>
                              {diff !== 0 && (
                                <span
                                  className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${
                                    diff < 0 ? 'text-emerald-400' : 'text-blue-400'
                                  }`}
                                >
                                  {diff < 0 ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                                  {diff < 0 ? '' : '+'}
                                  {formatBRL(diff)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold text-emerald-400 text-xs sm:text-sm">
                                {formatBRL(it.price)}
                              </span>
                              <span className="block text-[10px] text-emerald-300/80">Novo Cadastro</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-neutral-800">
                <button
                  onClick={() => setAnalyzed(false)}
                  className={`${btnGhost} w-full sm:w-auto text-xs`}
                >
                  <RotateCcw size={14} /> Editar texto da lista
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button onClick={onClose} className={`${btnGhost} text-xs`}>
                    Cancelar
                  </button>
                  <button
                    onClick={handleApplyUpdates}
                    disabled={isPublishing || stats.totalSelected === 0}
                    className={`${btnPrimary} text-xs sm:text-sm`}
                  >
                    <Check size={16} />
                    {isPublishing
                      ? 'Publicando na Loja…'
                      : stats.selectedNewCount > 0 && stats.selectedMatchedCount > 0
                      ? `Publicar ${stats.selectedMatchedCount} Preços & Cadastrar ${stats.selectedNewCount} Novos Produtos`
                      : stats.selectedNewCount > 0
                      ? `Cadastrar ${stats.selectedNewCount} Novos Produtos na Loja`
                      : `Publicar ${stats.selectedMatchedCount} Preços Apple Agora`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
