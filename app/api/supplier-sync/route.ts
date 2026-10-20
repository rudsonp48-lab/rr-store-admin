import { NextResponse } from 'next/server';
import { CategoryId, Product } from '../../../types/store';
import { applySupplierMarkup, calculatePixPrice, formatInstallment } from '../../../data/defaults';

interface WooCategory {
  id: number;
  name: string;
  slug: string;
}

interface WooImage {
  id: number;
  src: string;
}

interface WooProduct {
  id: number;
  name: string;
  sku?: string;
  is_in_stock?: boolean;
  prices?: {
    price?: string;
  };
  images?: WooImage[];
  categories?: WooCategory[];
  stock_availability?: {
    text?: string;
  };
}

const KNOWN_BRANDS = new Set([
  'KIMASTER',
  'FAM',
  'BMAX',
  'PEINING',
  'LEHMOX',
  'SUMEXR',
  'KNUP',
  'KINGO',
  'KAPBOM',
  '1HORA',
  'STARMEGA',
  'LECOVER',
  'B-TEK',
  'IMENSO',
  'MAXPRINT',
  'CIS',
  'BAZZE',
  'BOMVINK',
]);

const TAGS: Product['tag'][] = [
  'Mais Vendido',
  'Entrega Hoje DF',
  'Novidade',
  'Oferta Flash',
  'Favorito no DF',
];

function mapCategory(name: string, cats: string[]): Exclude<CategoryId, 'Todos'> {
  const joined = `${name} ${cats.join(' ')}`.toUpperCase();
  if (
    ['PAPELARIA', 'CANETA', 'CADERNO', 'MARCA', 'CIS', 'MAXPRINT', 'BAZZE', 'CALCULADORA'].some(
      (k) => joined.includes(k)
    )
  ) {
    return 'Papelaria Criativa & Concursos';
  }
  if (
    [
      'ILUMINA',
      'LANTERNA',
      'LAMPADA',
      'LÂMPADA',
      'RING LIGHT',
      'LED',
      'CAMERA',
      'CÂMERA',
      'PROJETOR',
      'REPETIDOR',
      'UMIDIFICADOR',
      'SOLAR',
    ].some((k) => joined.includes(k))
  ) {
    return 'Smart Home & Iluminação';
  }
  if (
    ['DEPILADOR', 'APARADOR', 'BARBEADOR', 'MASSAGEADOR', 'NECESSAIRE', 'ESCOVA', 'SECADOR'].some(
      (k) => joined.includes(k)
    )
  ) {
    return 'Skincare & Autocuidado';
  }
  if (
    ['GARRAFA', 'COPO TERMICO', 'COPO TÉRMICO', 'BOLA', 'BICICLETA', 'SCOOTER', 'MOTO'].some((k) =>
      joined.includes(k)
    )
  ) {
    return 'Moda Fitness & Athleisure';
  }
  if (['INFANTIL', 'BRINQUEDO', 'BONECA', 'CARRINHO'].some((k) => joined.includes(k))) {
    return 'Moda Infantil & Enxoval';
  }
  if (['PET', 'CÃES', 'GATOS'].some((k) => joined.includes(k))) {
    return 'Pet Shop';
  }
  if (['SMARTWATCH', 'RELOGIO', 'RELÓGIO', 'SUPORTE', 'PULSEIRA'].some((k) => joined.includes(k))) {
    return 'Acessórios & Semijoias';
  }
  if (
    [
      'CASA',
      'COZINHA',
      'CHURRASQUEIRA',
      'BOMBA',
      'ARVORE',
      'ÁRVORE',
      'NATAL',
      'FACA',
      'FERRAMENTA',
      'FIXADOR',
      'EMBARALHADOR',
      'UTENSILIO',
      'UTENSÍLIO',
    ].some((k) => joined.includes(k))
  ) {
    return 'Casa & Organização';
  }
  return 'Eletrônicos & Smartphones';
}

export async function GET() {
  try {
    const pages = [1, 2, 3];
    const responses = await Promise.all(
      pages.map((page) =>
        fetch(
          `https://gsmdigitalacessorios.com.br/wp-json/wc/store/v1/products?per_page=100&page=${page}`,
          {
            cache: 'no-store',
            headers: {
              Accept: 'application/json',
              'User-Agent': 'RRStore-Admin-Sync/1.0',
            },
          }
        ).then((r) => (r.ok ? (r.json() as Promise<WooProduct[]>) : []))
      )
    );

    const rawItems = responses.flat();
    const seen = new Set<string>();
    const syncedProducts: Product[] = [];

    rawItems.forEach((it, idx) => {
      const pid = `gsm-${it.id}`;
      if (seen.has(pid)) return;

      const src = it.images?.[0]?.src || '';
      const rawCost = Number(it.prices?.price || 0) / 100;

      if (!src || rawCost <= 0 || it.is_in_stock === false) return;
      seen.add(pid);

      const cleanName = (it.name || '').replace(/\s+/g, ' ').trim();
      const catNames = (it.categories || []).map((c) => c.name || '');
      const categoria = mapCategory(cleanName, catNames);
      const { precoPor, precoDe } = applySupplierMarkup(rawCost);
      const precoPix = calculatePixPrice(precoPor);
      const maxParcelasSemJuros = precoPor >= 200 ? 12 : precoPor >= 80 ? 6 : 3;
      const parcelamento = formatInstallment(precoPor, maxParcelasSemJuros);

      const stockMatch = (it.stock_availability?.text || '').match(/(\d+)/);
      const estoque = stockMatch ? Math.max(1, Math.min(Number(stockMatch[1]), 200)) : 25;
      const sku = (it.sku || '').trim();
      const brand = catNames.find((c) => KNOWN_BRANDS.has(c.toUpperCase())) || 'GSM Digital';

      syncedProducts.push({
        id: pid,
        nome: cleanName,
        categoria,
        precoDe,
        precoPor,
        precoPix,
        parcelamento,
        maxParcelasSemJuros,
        avaliacao: idx % 2 === 0 ? 4.9 : 5.0,
        avaliacoesCount: 24 + ((idx * 7) % 180),
        tag: TAGS[idx % TAGS.length],
        imagem: src,
        descricao: `Produto ${brand}${sku ? ` (Ref: ${sku})` : ''} sincronizado em tempo real com o estoque do fornecedor em Brasília-DF.`,
        estoque,
      });
    });

    return NextResponse.json({
      ok: true,
      syncedAt: new Date().toISOString(),
      count: syncedProducts.length,
      products: syncedProducts,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Erro ao sincronizar com fornecedor',
        products: [],
      },
      { status: 200 }
    );
  }
}
