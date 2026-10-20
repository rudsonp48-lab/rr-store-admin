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
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';
import { DFRegion, HeroBanner, Product } from '../types/store';
import { OrderRecord } from '../types/admin';

export interface Settings {
  products: Product[] | null;
  regions: DFRegion[] | null;
  banners: HeroBanner[] | null;
}

/** Lê catálogo, fretes e banners publicados (null = ainda não publicado). */
export async function loadSettings(): Promise<Settings> {
  const result: Settings = { products: null, regions: null, banners: null };
  const snap = await getDocs(collection(db, 'rr_store_settings'));
  snap.forEach((d) => {
    const data = d.data();
    if (d.id === 'catalog' && Array.isArray(data.products)) result.products = data.products;
    if (d.id === 'shipping' && Array.isArray(data.regions)) result.regions = data.regions;
    if (d.id === 'banners' && Array.isArray(data.banners)) result.banners = data.banners;
  });
  return result;
}

export async function saveCatalog(products: Product[]): Promise<void> {
  await setDoc(doc(db, 'rr_store_settings', 'catalog'), {
    products,
    totalCount: products.length,
    updatedAtIso: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}

export async function saveShipping(regions: DFRegion[]): Promise<void> {
  await setDoc(doc(db, 'rr_store_settings', 'shipping'), {
    regions,
    updatedAtIso: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}

export async function saveBanners(banners: HeroBanner[]): Promise<void> {
  await setDoc(doc(db, 'rr_store_settings', 'banners'), {
    banners,
    updatedAtIso: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
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
    return 'Sem permissão. Confirme que você está logado com o e-mail autorizado e que as regras (firestore.rules / storage.rules) foram publicadas no Firebase.';
  }
  if (code === 'unavailable' || code === 'storage/retry-limit-exceeded') {
    return 'Sem conexão com o Firebase. Verifique sua internet e tente novamente.';
  }
  if (code === 'storage/unknown' || code === 'storage/bucket-not-found') {
    return 'O Firebase Storage não está ativado neste projeto. Ative-o no console ou cole a URL da imagem manualmente.';
  }
  return message;
}
