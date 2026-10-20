'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ExternalLink,
  Image as ImageIcon,
  LogOut,
  Package,
  Receipt,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { DFRegion, HeroBanner, Product } from '../types/store';
import { DF_REGIONS, PRODUCTS } from '../data/defaults';
import { SITE_URL } from '../lib/firebase';
import { friendlyError, loadSettings, saveBanners, saveCatalog, saveShipping } from '../lib/data';
import ProductsPanel from './ProductsPanel';
import BannersPanel from './BannersPanel';
import ShippingPanel from './ShippingPanel';
import OrdersPanel from './OrdersPanel';
import { btnGhost } from './ui';

type Tab = 'produtos' | 'banners' | 'fretes' | 'pedidos';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'produtos', label: 'Produtos', icon: <Package size={16} /> },
  { id: 'banners', label: 'Banners', icon: <ImageIcon size={16} /> },
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
        const cloudIds = new Set(s.products.map((p) => p.id));
        setProducts([...s.products, ...PRODUCTS.filter((p) => !cloudIds.has(p.id))]);
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
      <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">RR Store — Painel</p>
            <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className={btnGhost} aria-label="Recarregar" title="Recarregar">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <a href={SITE_URL} target="_blank" rel="noreferrer" className={btnGhost}>
              <ExternalLink size={16} /> <span className="hidden sm:inline">Ver loja</span>
            </a>
            <button onClick={onLogout} className={btnGhost} aria-label="Sair" title="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-3 sm:px-6 flex gap-1 overflow-x-auto pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                tab === t.id
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-neutral-400 border border-transparent hover:text-white'
              }`}
            >
              {t.icon} {t.label}
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
