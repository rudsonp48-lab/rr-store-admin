'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowLeftRight,
  ExternalLink,
  Image as ImageIcon,
  LogOut,
  Package,
  Receipt,
  RefreshCw,
  Sparkles,
  Truck,
} from 'lucide-react';
import { DFRegion, HeroBanner, Product } from '../types/store';
import { DF_REGIONS, formatInstallment, PRODUCTS } from '../data/defaults';
import { SITE_URL } from '../lib/firebase';
import {
  CURRENT_PRICE_CATALOG_VERSION,
  friendlyError,
  loadSettings,
  saveBanners,
  saveCatalog,
  saveShipping,
} from '../lib/data';
import { resolveAppleImage } from '../lib/apple-price-parser';
import ProductsPanel from './ProductsPanel';
import BannersPanel from './BannersPanel';
import ShippingPanel from './ShippingPanel';
import OrdersPanel from './OrdersPanel';
import TradeInAdminPanel from './TradeInAdminPanel';
import { btnGhost } from './ui';

type Tab = 'produtos' | 'banners' | 'troca' | 'fretes' | 'pedidos';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'produtos', label: 'Produtos', icon: <Package size={16} /> },
  { id: 'banners', label: 'Banners', icon: <ImageIcon size={16} /> },
  { id: 'troca', label: 'Troca Fácil', icon: <ArrowLeftRight size={16} /> },
  { id: 'fretes', label: 'Fretes', icon: <Truck size={16} /> },
  { id: 'pedidos', label: 'Pedidos', icon: <Receipt size={16} /> },
];

export default function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('produtos');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [regions, setRegions] = useState<DFRegion[]>(DF_REGIONS);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [published, setPublished] = useState({ products: false, regions: false, banners: false });
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const notify = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), type === 'ok' ? 3000 : 7000);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const s = await loadSettings();
      if (s.products) {
        const localMap = new Map(PRODUCTS.map((p) => [p.id, p]));
        const sousaImgs = new Set(PRODUCTS.filter((p) => p.id.startsWith('sousa-')).map((p) => p.imagem));
        const seen = new Set<string>();
        const uniqueCloud = s.products.filter((cp) => {
          if (!cp?.id || cp.id === 'rr-apple-airtag-2pack') return false;
          if (seen.has(cp.id)) return false;
          seen.add(cp.id);
          return true;
        });
        const sanitizedCloud = uniqueCloud.map((cp) => {
          const local = localMap.get(cp.id);
          const hasCurrentPriceVersion =
            (cp as Product & { priceCatalogVersion?: number }).priceCatalogVersion ===
            CURRENT_PRICE_CATALOG_VERSION;
          const isApple = cp.id.startsWith('rr-apple-');
          const useLocalOfficialPrice = isApple && !!local && !hasCurrentPriceVersion;

          const livePrice = useLocalOfficialPrice
            ? local!.precoPor
            : cp.precoPor > 0
            ? cp.precoPor
            : local?.precoPor || local?.precoPix || 0;
          const livePix = useLocalOfficialPrice
            ? local!.precoPix
            : cp.precoPix > 0
            ? cp.precoPix
            : livePrice;
          const liveDe = useLocalOfficialPrice
            ? local!.precoDe
            : cp.precoDe > livePrice
            ? cp.precoDe
            : Math.round(livePrice * 1.15);
          const parcelas = livePrice >= 200 ? 12 : livePrice >= 80 ? 6 : 3;

          if (local && (isApple || cp.id.startsWith('sousa-'))) {
            return {
              ...local,
              ...cp,
              nome: local.nome,
              imagem: local.imagem,
              descricao: local.descricao,
              precoDe: liveDe,
              precoPor: livePrice,
              precoPix: livePix,
              maxParcelasSemJuros: parcelas,
              parcelamento: formatInstallment(livePrice, parcelas),
              estoque: useLocalOfficialPrice
                ? local.estoque
                : typeof cp.estoque === 'number'
                ? cp.estoque
                : local.estoque,
            };
          }
          if (isApple && sousaImgs.has(cp.imagem)) {
            return {
              ...cp,
              imagem: resolveAppleImage(cp.nome, ''),
            };
          }
          return cp;
        });
        const cloudById = new Map<string, Product>(sanitizedCloud.map((p) => [p.id, p]));
        const localIds = new Set<string>(PRODUCTS.map((p) => p.id));
        const canonicalMerged = PRODUCTS.map((p) => cloudById.get(p.id) || p);
        const newCloudOnly = sanitizedCloud.filter((p) => !localIds.has(p.id));
        const merged = [...newCloudOnly, ...canonicalMerged];
        const apple = merged.filter((p) => p.id.startsWith('rr-apple-'));
        const others = merged.filter((p) => !p.id.startsWith('rr-apple-'));
        setProducts([...apple, ...others]);
      }
      if (s.regions) setRegions(s.regions);
      if (s.banners) setBanners(s.banners);
      setPublished({ products: !!s.products, regions: !!s.regions, banners: !!s.banners });
    } catch (e) {
      setLoadError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Grava primeiro; só atualiza a tela se o Firebase confirmar.
  const publishProducts = async (next: Product[], okMsg = 'Catálogo publicado na loja.') => {
    try {
      await saveCatalog(next);
      setProducts(next);
      setPublished((p) => ({ ...p, products: true }));
      notify('ok', okMsg);
      return true;
    } catch (e) {
      notify('err', friendlyError(e));
      return false;
    }
  };

  const publishBanners = async (next: HeroBanner[], okMsg = 'Banners publicados na loja.') => {
    try {
      await saveBanners(next);
      setBanners(next);
      setPublished((p) => ({ ...p, banners: true }));
      notify('ok', okMsg);
      return true;
    } catch (e) {
      notify('err', friendlyError(e));
      return false;
    }
  };

  const publishRegions = async (next: DFRegion[]) => {
    try {
      await saveShipping(next);
      setRegions(next);
      setPublished((p) => ({ ...p, regions: true }));
      notify('ok', 'Fretes publicados na loja.');
      return true;
    } catch (e) {
      notify('err', friendlyError(e));
      return false;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold leading-tight truncate">RR Store — Painel Admin</p>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button onClick={refresh} className={`${btnGhost} !px-2.5 !py-2`} aria-label="Recarregar" title="Recarregar">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <a href={SITE_URL} target="_blank" rel="noreferrer" className={`${btnGhost} !px-2.5 !py-2 text-xs sm:text-sm`}>
              <ExternalLink size={15} /> <span className="hidden xs:inline">Loja</span>
            </a>
            <button onClick={onLogout} className={`${btnGhost} !px-2.5 !py-2`} aria-label="Sair" title="Sair">
              <LogOut size={15} />
            </button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-3 sm:px-6 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1.5 pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap rounded-lg px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium transition shrink-0 ${
                tab === t.id
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-neutral-400 border border-transparent hover:text-white'
              }`}
            >
              {t.icon} <span className="truncate">{t.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {loadError && (
          <div className="mb-4 rounded-xl border border-red-900/50 bg-red-950/40 text-red-300 text-sm p-3">
            Não foi possível ler os dados publicados: {loadError} Exibindo os valores padrão.
          </div>
        )}
        {tab === 'produtos' && (
          <ProductsPanel
            products={products}
            isPublished={published.products}
            publish={publishProducts}
          />
        )}
        {tab === 'banners' && (
          <BannersPanel
            banners={banners}
            products={products}
            isPublished={published.banners}
            publish={publishBanners}
          />
        )}
        {tab === 'troca' && <TradeInAdminPanel onNotify={notify} />}
        {tab === 'fretes' && (
          <ShippingPanel regions={regions} isPublished={published.regions} publish={publishRegions} />
        )}
        {tab === 'pedidos' && <OrdersPanel notify={notify} />}
      </main>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] rounded-xl px-4 py-3 text-sm shadow-xl border ${
            toast.type === 'ok'
              ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
              : 'bg-red-950 border-red-800 text-red-200'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
