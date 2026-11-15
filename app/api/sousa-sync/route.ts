import { NextResponse } from 'next/server';
import { CategoryId, Product } from '../../../types/store';
import {
  applySupplierMarkup,
  calculatePixPrice,
  formatInstallment,
} from '../../../data/defaults';
import sousaLiveData from '../../../data/sousa-live.json';

export const maxDuration = 60;

interface SousaRawItem {
  id: string;
  nome: string;
  preco: number;
  imagem: string;
  esgotado?: boolean;
  categoriaSousa?: string;
}

const TAGS: Product['tag'][] = [
  'Mais Vendido',
  'Entrega Hoje DF',
  'Novidade',
  'Oferta Flash',
  'Favorito no DF',
];

function mapSousaCategory(name: string, catSlug: string): Exclude<CategoryId, 'Todos'> {
  const joined = `${name} ${catSlug}`.toUpperCase();
  if (
    ['SMARTWATCH', 'RELOGIO', 'RELÓGIO', 'WATCH', 'PULSEIRA'].some((k) =>
      joined.includes(k)
    )
  ) {
    return 'Acessórios & Semijoias';
  }
  if (
    ['CASA', 'COZINHA', 'CHURRASQUEIRA', 'BOMBA', 'FERRAMENTA', 'UTENSILIO'].some((k) =>
      joined.includes(k)
    )
  ) {
    return 'Casa & Organização';
  }
  return 'Eletrônicos & Smartphones';
}

function buildProductFromRaw(item: SousaRawItem, index: number): Product {
  const nome = (item.nome || '').replace(/\s+/g, ' ').trim();
  const cost = Number(item.preco) || 0;
  const { precoPor, precoDe } = applySupplierMarkup(cost);
  const parcelas = precoPor >= 200 ? 12 : precoPor >= 80 ? 6 : 3;

  return {
    id: item.id,
    nome,
    categoria: mapSousaCategory(nome, item.categoriaSousa || ''),
    precoCusto: Number(cost.toFixed(2)),
    precoDe,
    precoPor,
    precoPix: calculatePixPrice(precoPor),
    parcelamento: formatInstallment(precoPor, parcelas),
    maxParcelasSemJuros: parcelas,
    avaliacao: index % 2 === 0 ? 4.9 : 5.0,
    avaliacoesCount: 18 + ((index * 9) % 64),
    tag: TAGS[index % TAGS.length],
    imagem: item.imagem,
    descricao: `${nome} — produto Souza Eletrônicos / Sousa Games & Tecnologia disponível em Brasília-DF com entrega rápida via Motoboy Express.`,
    estoque: item.esgotado ? 0 : 10,
  };
}

function decodeHtml(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function parseKyteCards(html: string): SousaRawItem[] {
  const items: SousaRawItem[] = [];
  const parts = html.split(/(?=href="\/pt-BR\/p\/)/).slice(1);
  for (const part of parts) {
    const link = part.match(/^href="(\/pt-BR\/p\/[^"]+)"/);
    const name = part.match(/data-testid="name-product-home"[^>]*>([^<]*)</);
    const price = part.match(/data-testid="price-product-home"[^>]*>([^<]*)</);
    const img = part.match(/<img[^>]*alt="(?!blur-)[^"]*"[^>]*src="([^"]+)"/);
    if (!name || !price) continue;
    const rawPrice = decodeHtml(price[1]).replace(/[^\d,.]/g, '');
    const preco = rawPrice ? Number(rawPrice.replace(/\./g, '').replace(',', '.')) || 0 : 0;
    if (preco <= 0) continue;
    const idMatch = link?.[1]?.match(/\/([^/]+)$/);
    const key = idMatch ? idMatch[1] : decodeHtml(name[1]);
    items.push({
      id: `sousa-${key}`,
      nome: decodeHtml(name[1]).replace(/\s+/g, ' '),
      preco,
      imagem: img ? decodeHtml(img[1]).replace('thumb_280_', '') : '',
      esgotado: /esgotado|sem estoque/i.test(part.slice(0, 2500)),
      categoriaSousa: 'kyte-live',
    });
  }
  return items;
}

export async function GET() {
  try {
    // 1. Tenta leitura direta do site Kyte da Souza Eletrônicos / Sousa Games
    try {
      const res = await fetch('https://sousagamestecnologia.kyte.site/pt-BR', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(7000),
      });
      if (res.ok) {
        const html = await res.text();
        const parsed = parseKyteCards(html).filter((p) => !p.esgotado && p.imagem);
        if (parsed.length >= 10) {
          const products = parsed.map((item, idx) => buildProductFromRaw(item, idx));
          return NextResponse.json({
            ok: true,
            source: 'kyte-direct',
            syncedAt: new Date().toISOString(),
            count: products.length,
            products,
          });
        }
      }
    } catch {
      // Cloudflare ou timeout no Kyte — prossegue para o feed sincronizado da loja
    }

    // 2. Fallback para o feed sincronizado da RR Store (atualizado via Chrome/GitHub Actions)
    try {
      const feedRes = await fetch('https://rrmobilestore.com.br/api/supplier-sync', {
        signal: AbortSignal.timeout(6000),
      });
      if (feedRes.ok) {
        const feedData = (await feedRes.json()) as {
          ok?: boolean;
          products?: Product[];
          syncedAt?: string;
        };
        const sousaProducts = (feedData.products || []).filter((p) =>
          p.id.startsWith('sousa-')
        );
        if (sousaProducts.length >= 10) {
          return NextResponse.json({
            ok: true,
            source: 'rr-store-feed',
            syncedAt: feedData.syncedAt || new Date().toISOString(),
            count: sousaProducts.length,
            products: sousaProducts,
          });
        }
      }
    } catch {
      // Prossegue para o snapshot local
    }

    // 3. Fallback local com snapshot sousa-live.json
    const rawList = ((sousaLiveData as { products?: SousaRawItem[] }).products || []).filter(
      (p) => p.preco > 0 && !p.esgotado && p.imagem
    );
    const products = rawList.map((item, idx) => buildProductFromRaw(item, idx));

    return NextResponse.json({
      ok: true,
      source: 'local-snapshot',
      syncedAt:
        (sousaLiveData as { syncedAt?: string }).syncedAt || new Date().toISOString(),
      count: products.length,
      products,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : 'Erro ao sincronizar com Souza Eletrônicos',
        products: [],
      },
      { status: 200 }
    );
  }
}
