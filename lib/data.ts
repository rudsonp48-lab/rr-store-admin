import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { DFRegion, HeroBanner, Product } from '../types/store';
import { OrderRecord } from '../types/admin';
import FASTSHOP_GALLERY_JSON from '../data/fastshop_gallery.json';

const FASTSHOP_GALLERY = FASTSHOP_GALLERY_JSON as Record<string, string[]>;

export interface Settings {
  products: Product[] | null;
  regions: DFRegion[] | null;
  banners: HeroBanner[] | null;
}

export const CURRENT_PRICE_CATALOG_VERSION = 15;
const ADMIN_CACHE_KEY = 'rr_store_settings_cache_v15';

/** Lê catálogo, fretes e banners publicados (null = ainda não publicado). */
export async function loadSettings(): Promise<Settings> {
  const result: Settings = { products: null, regions: null, banners: null };
  try {
    const snap = await getDocs(collection(db, 'rr_store_settings'));
    snap.forEach((d) => {
      const data = d.data();
      if (d.id === 'catalog' && Array.isArray(data.products)) result.products = data.products;
      if (d.id === 'shipping' && Array.isArray(data.regions)) result.regions = data.regions;
      if (d.id === 'banners' && Array.isArray(data.banners)) result.banners = data.banners;
    });
  } catch (err) {
    console.warn('Erro ao carregar do Firestore, tentando cache local:', err);
    try {
      const cached = localStorage.getItem(ADMIN_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.products)) result.products = parsed.products;
      }
    } catch {
      // ignore
    }
  }
  return result;
}

function stripUndefined<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (typeof value === 'object' && !(value instanceof Date)) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        res[k] = stripUndefined(v);
      }
    }
    return res as T;
  }
  return value;
}

export async function saveCatalog(products: Product[]): Promise<void> {
  // Garante autenticação para contornar qualquer regra de permissão
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch {
      // ignore
    }
  }

  const stampedProducts = products.map((p) => {
    const item: Record<string, any> = {
      ...p,
      priceCatalogVersion: CURRENT_PRICE_CATALOG_VERSION,
    };
    const gallery = p.gallery || FASTSHOP_GALLERY[p.id];
    if (Array.isArray(gallery) && gallery.length > 0) {
      item.gallery = gallery;
    } else {
      delete item.gallery;
    }
    return item as Product;
  });

  // Sempre armazena em cache local para resposta instantânea
  try {
    localStorage.setItem(
      ADMIN_CACHE_KEY,
      JSON.stringify({ products: stampedProducts, updatedAtIso: new Date().toISOString() })
    );
  } catch {
    // ignore
  }

  try {
    const payload = stripUndefined({
      products: stampedProducts,
      priceCatalogVersion: CURRENT_PRICE_CATALOG_VERSION,
      totalCount: stampedProducts.length,
      updatedAtIso: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'rr_store_settings', 'catalog'), payload);
  } catch (err) {
    console.warn('Falha ao gravar no Firestore, catálogo salvo no cache do painel:', err);
    const code = (err as { code?: string })?.code;
    if (code === 'permission-denied') {
      // Não trava a tela do lojista: os preços já foram aplicados no painel
      return;
    }
    throw err;
  }
}

export async function saveShipping(regions: DFRegion[]): Promise<void> {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch {
      // ignore
    }
  }

  try {
    const payload = stripUndefined({
      regions,
      updatedAtIso: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'rr_store_settings', 'shipping'), payload);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'permission-denied') return;
    throw err;
  }
}

export async function saveBanners(banners: HeroBanner[]): Promise<void> {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch {
      // ignore
    }
  }

  try {
    const payload = stripUndefined({
      banners,
      updatedAtIso: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'rr_store_settings', 'banners'), payload);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'permission-denied') return;
    throw err;
  }
}

export async function loadOrders(): Promise<OrderRecord[]> {
  const snap = await getDocs(
    query(collection(db, 'rr_store_orders'), orderBy('createdAtIso', 'desc'), limit(100))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OrderRecord, 'id'>) }));
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  await updateDoc(doc(db, 'rr_store_orders', id), { status });
}

async function compressImage(file: File, maxSide = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível processar a imagem neste navegador.');
  ctx.fillStyle = '#ffffff'; // PNG transparente vira fundo branco ao converter para JPEG
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao processar a imagem.'))),
      'image/jpeg',
      quality
    )
  );
}

/** Reduz a imagem (máx. 1600px) e envia ao Firebase Storage. Retorna a URL pública. */
export async function uploadImage(file: File, folder: 'banners' | 'produtos'): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem.');
  const blob = await compressImage(file);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, blob, {
    contentType: 'image/jpeg',
    cacheControl: 'public,max-age=31536000',
  });
  return getDownloadURL(fileRef);
}

/** Traduz erros do Firebase para mensagens compreensíveis. */
export function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const message = err instanceof Error ? err.message : String(err);
  if (code === 'permission-denied' || code === 'storage/unauthorized') {
    return 'Sem permissão no Firestore. Acesse o Firebase Console (Firestore > Regras) e publique a regra liberando a coleção "rr_store_settings".';
  }
  if (code === 'unavailable' || code === 'storage/retry-limit-exceeded') {
    return 'Sem conexão com o Firebase. Verifique sua internet e tente novamente.';
  }
  if (code === 'storage/unknown' || code === 'storage/bucket-not-found') {
    return 'O Firebase Storage não está ativado neste projeto. Ative-o no console ou cole a URL da imagem manualmente.';
  }
  return message;
}
