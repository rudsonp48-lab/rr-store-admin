import { Product } from '../types/store';

export interface ParsedAppleItem {
  rawLine: string;
  header: string;
  color: string;
  price: number;
  isZerou: boolean;
  matchedProductId?: string;
  matchedProductName?: string;
  currentPrice?: number;
  newPrice?: number;
  priceDiff?: number;
  selected?: boolean;
  isNewProduct?: boolean;
}

export function cleanPriceNumber(raw: string): number | null {
  if (!raw) return null;
  const clean = raw.trim().replace(/R\$|USD|US|\$/gi, '').trim();
  // 1) Cents with dot or comma: "75.00", "100.00", "75,00"
  if (/^\d+[.,]\d{2}$/.test(clean)) {
    return parseFloat(clean.replace(',', '.'));
  }
  // 2) Thousands with dot: "8.750", "9.000", "10.900", "14.500", "15.500", "2.300", "1.650", "1.999"
  if (/^\d{1,3}\.\d{3}$/.test(clean)) {
    return parseInt(clean.replace('.', ''), 10);
  }
  // 3) Thousands with space: "1 750", "2 650", "14 500"
  if (/^\d{1,3}\s\d{3}$/.test(clean)) {
    return parseInt(clean.replace(/\s+/g, ''), 10);
  }
  // 4) Plain integer: "14500", "2650", "799", "199", "150", "130", "100", "75"
  if (/^\d+$/.test(clean)) {
    return parseInt(clean, 10);
  }
  // 5) Fallback
  const sanitized = clean.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? null : parsed;
}

export function normalizeStr(s = ''): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Lê o texto copiado do WhatsApp e retorna os itens estruturados.
 */
export function parseAppleWhatsAppList(text: string): ParsedAppleItem[] {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split('\n').map((l) => l.trim());
  const items: ParsedAppleItem[] = [];
  let currentHeader = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;

    // Ignora mensagens de saudação, versículos e rodapés institucionais
    if (
      rawLine.includes('Provérbios') ||
      rawLine.includes('Chama Minha Joia') ||
      rawLine.includes('Verifique até') ||
      rawLine.includes('Não devolvemos') ||
      rawLine.includes('SEM HISTÓRIAS') ||
      rawLine.includes('Pagamentos:') ||
      rawLine.includes('Não aceitamos') ||
      rawLine.includes('Alguns produtos') ||
      rawLine.includes('RR-MOBILE') ||
      rawLine.startsWith('---') ||
      rawLine.startsWith('___') ||
      rawLine.startsWith('===') ||
      rawLine.includes('JOIAS APLLE')
    ) {
      continue;
    }

    // Identifica cabeçalhos de produto Apple (iPhones, Watches, MacBooks, iPads, AirPods, Acessórios)
    const isEmojiHeader = /^(📱|⌚️|💎|🖱️|🖋️|🎧|📦|💍)/.test(rawLine);
    const isKeywordHeader =
      /^(iPhone|Apple watch|MacBook|Mac Mini|iPad|Magic Keyboard|AirPods|AirTag|Fonte|Cabo|Magsafe|Teclado)/i.test(
        rawLine
      );

    if (isEmojiHeader || (isKeywordHeader && !rawLine.includes(':') && !/\b\d{2,}\b/.test(rawLine))) {
      currentHeader = rawLine
        .replace(/^(📱|⌚️|💎|🖱️|🖋️|🎧|📦|💍)\s*/, '')
        .replace(/\(americano\s*🇺🇸\)/gi, '')
        .replace(/💯\s*prazo.*/gi, '')
        .replace(/sem fiado.*/gi, '')
        .replace(/no pix.*/gi, '')
        .replace(/sem menos.*/gi, '')
        .replace(/\*/g, '')
        .trim();
      continue;
    }

    const lower = rawLine.toLowerCase();
    const isZerou =
      lower.includes('zerou') ||
      lower.includes('esgotado') ||
      lower.includes('sem estoque') ||
      lower.includes('acabou');

    if (isZerou) {
      let colorStr = 'Padrão';
      if (rawLine.includes(':')) {
        colorStr = rawLine
          .split(':')[0]
          .replace(/[^a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ ]/g, '')
          .trim();
      }
      items.push({
        rawLine,
        header: currentHeader || 'Produto Apple',
        color: colorStr || 'Padrão',
        price: 0,
        isZerou: true,
        selected: true,
      });
      continue;
    }

    if (rawLine.includes(':') || /[\d]{2,}/.test(rawLine)) {
      let color = 'Padrão';
      let priceStr = '';
      if (rawLine.includes(':')) {
        const parts = rawLine.split(':');
        color = parts[0]
          .replace(/[^a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ ]/g, '')
          .trim();
        priceStr = parts.slice(1).join(':').replace(/🇺🇸|🇧🇷|💯/g, '').trim();
      } else {
        priceStr = rawLine
          .replace(/^[▪■▫•\-\*\:]+/g, '')
          .replace(/🇺🇸|🇧🇷|💯/g, '')
          .trim();
      }
      const price = cleanPriceNumber(priceStr);
      if (price !== null && price > 0) {
        items.push({
          rawLine,
          header: currentHeader || 'Produto Apple',
          color: color || 'Padrão',
          price,
          isZerou: false,
          selected: true,
        });
      }
    }
  }

  return items;
}

/**
 * Associa cada item lido no WhatsApp com o produto Apple correspondente no catálogo.
 * Regras Estritas:
 * - iPhone Duo: JAMAIS pode dar match com iPhone Pro ou Pro Max ou normal.
 * - iPhone Pro vs Pro Max: Estritamente separados.
 * - Geração (iPhone 18 vs 17): Nunca mistura gerações diferentes.
 * - Capacidade (256gb vs 512gb): Exigência estrita.
 * - Cor: Se a cor não bater ou se o produto não existir, cai em "Sem Correspondência" (Novo Produto).
 */
export function matchAppleItems(
  items: ParsedAppleItem[],
  catalog: Product[]
): ParsedAppleItem[] {
  const appleCatalog = catalog.filter((p) => p.id.startsWith('rr-apple-'));

  return items.map((item) => {
    const normHeader = normalizeStr(item.header);
    const normColor = normalizeStr(item.color);

    // Identifica capacidade no header (ex: 128gb, 256gb, 512gb, 1tb)
    const capMatch = item.header.match(/(\d+\s*(?:gb|tb))/i);
    const itemCap = capMatch ? normalizeStr(capMatch[1]) : '';

    let best: Product | null = null;
    let bestScore = -999;

    for (const prod of appleCatalog) {
      const prodNorm = normalizeStr(prod.nome);
      let score = 0;

      // 1. Restrição estrita de família de produto
      const isIphone = /iphone/i.test(item.header);
      const isWatch = /watch/i.test(item.header);
      const isMacbook = /macbook/i.test(item.header);
      const isIpad = /ipad/i.test(item.header);
      const isAirpods = /airpods/i.test(item.header);
      const isAirtag = /airtag/i.test(item.header);
      const isCabo = /cabo/i.test(item.header);
      const isFonte = /fonte/i.test(item.header);
      const isKeyboard = /keyboard|teclado/i.test(item.header);
      const isPencil = /pencil/i.test(item.header);
      const isMouse = /mouse/i.test(item.header);
      const isTrackpad = /trackpad/i.test(item.header);
      const isMagsafe = /magsafe/i.test(item.header);

      if (isIphone && !/iphone/i.test(prod.nome)) continue;
      if (isWatch && !/watch/i.test(prod.nome)) continue;
      if (isMacbook && !/macbook/i.test(prod.nome)) continue;
      if (isIpad && !/ipad/i.test(prod.nome)) continue;
      if (isAirpods && !/airpods/i.test(prod.nome)) continue;
      if (isAirtag && !/airtag/i.test(prod.nome)) continue;
      if (isCabo && !/cabo/i.test(prod.nome)) continue;
      if (isFonte && !/fonte/i.test(prod.nome)) continue;
      if (isKeyboard && !/keyboard|teclado/i.test(prod.nome)) continue;
      if (isPencil && !/pencil/i.test(prod.nome)) continue;
      if (isMouse && !/mouse/i.test(prod.nome)) continue;
      if (isTrackpad && !/trackpad/i.test(prod.nome)) continue;
      if (isMagsafe && !/magsafe/i.test(prod.nome)) continue;

      // 2. REGRAS ESTRITAS PARA IPHONE
      if (isIphone) {
        // A) Modelo DUO (Dobrável / Dual Screen)
        const isHeaderDuo = /\bduo\b/i.test(item.header);
        const isProdDuo = /\bduo\b/i.test(prod.nome) || prod.id.includes('duo');
        if (isHeaderDuo !== isProdDuo) continue; // iPhone Duo JAMAIS dá match com Pro, Pro Max ou normal!

        // B) Geração do iPhone (18 vs 17 vs 16 vs 15 vs 14 vs 13 vs 12 vs 11)
        const headerGen = item.header.match(/iphone\s*(\d{2})/i);
        const prodGen = prod.nome.match(/iphone\s*(\d{2})/i);
        if (headerGen && prodGen && headerGen[1] !== prodGen[1]) {
          continue; // iPhone 18 NUNCA dá match com iPhone 17!
        }

        // C) Pro Max vs Pro (quando não for Duo)
        if (!isHeaderDuo) {
          const isHeaderMax = /\bmax\b/i.test(item.header);
          const isProdMax = /\bmax\b/i.test(prod.nome);
          if (isHeaderMax !== isProdMax) continue;

          const isHeaderPro = /\bpro\b/i.test(item.header);
          const isProdPro = /\bpro\b/i.test(prod.nome);
          if (isHeaderPro !== isProdPro) continue;
        }
      }

      // 3. REGRAS ESTRITAS PARA APPLE WATCH
      if (isWatch) {
        if (/s11\b/i.test(item.header) && !/s11|series 11/i.test(prod.nome)) continue;
        if (/s12\b/i.test(item.header) && !/s12|series 12/i.test(prod.nome)) continue;
        if (/se\s*3/i.test(item.header) && !/se 3/i.test(prod.nome)) continue;
        if (/se\s*2/i.test(item.header) && !/se 2/i.test(prod.nome)) continue;
        if (/ultra\s*3/i.test(item.header) && !/ultra 3/i.test(prod.nome)) continue;

        const sizeMatch = item.header.match(/(\d{2})\s*mm/i);
        if (sizeMatch && !prod.nome.includes(`${sizeMatch[1]}mm`)) continue;
      }

      // 4. REGRAS ESTRITAS PARA MACBOOK
      if (isMacbook) {
        if (/neo/i.test(item.header) && !/neo/i.test(prod.nome)) continue;
        if (/air\s*m5/i.test(item.header) && !/air m5/i.test(prod.nome)) continue;
      }

      // 5. REGRAS ESTRITAS PARA IPAD
      if (isIpad) {
        if (/mini\s*7/i.test(item.header) && !/mini 7/i.test(prod.nome)) continue;
        if (/ipad\s*11\b/i.test(item.header) && !/11ª/i.test(prod.nome)) continue;
        if (/air\s*m4/i.test(item.header) && !/air m4/i.test(prod.nome)) continue;
        if (/pro\s*m5/i.test(item.header) && !/pro m5/i.test(prod.nome)) continue;

        // Celular vs Wi-Fi
        const isHeaderCell = /celular|cellular|\+cel/i.test(item.header);
        const isProdCell = /celular|cellular|\+cel/i.test(prod.nome);
        if (isHeaderCell !== isProdCell) continue;

        // Tamanho de tela do iPad (11", 13", T11, T13)
        if (/t11|11”|11"/i.test(item.header) && !/11"/i.test(prod.nome)) continue;
        if (/t13|13”|13"/i.test(item.header) && !/13"/i.test(prod.nome)) continue;
      }

      // 6. REGRAS ESTRITAS PARA AIRPODS
      if (isAirpods) {
        if (/max\s*2/i.test(item.header) && !/max 2/i.test(prod.nome)) continue;
        if (/pro\s*3/i.test(item.header) && !/pro 3/i.test(prod.nome)) continue;
        if (/airpods\s*4/i.test(item.header) && !/airpods 4/i.test(prod.nome)) continue;
        if (/airpods\s*5/i.test(item.header) && !/airpods 5/i.test(prod.nome)) continue;

        const isHeaderAnc = /cancelamento|anc/i.test(item.header);
        const isProdAnc = /cancelamento|anc/i.test(prod.nome);
        if (isHeaderAnc !== isProdAnc) continue;

        score += 35; // Bateu modelo de AirPods e tipo de cancelamento
      }

      // 7. REGRAS PARA AIRTAG
      if (isAirtag) {
        const is2pack = /2\s*unidade|2\s*pack|2\s*un/i.test(item.header);
        const prod2pack = /2\s*unidade|2\s*pack|2\s*un/i.test(prod.nome);
        if (is2pack !== prod2pack) continue;

        if (is2pack) {
          score += 50;
        } else {
          // Diferenciação Pack 4 modelo 1 vs modelo 2
          const isMod1 = /modelo\s*1|gen\s*1|1ª/i.test(item.header);
          const prodMod1 = /modelo\s*1|gen\s*1|1ª/i.test(prod.nome);
          const isMod2 = /modelo\s*2|gen\s*2|2ª/i.test(item.header);
          const prodMod2 = /modelo\s*2|gen\s*2|2ª/i.test(prod.nome);

          if (isMod1 && !prodMod1) continue;
          if (isMod2 && !prodMod2) continue;
          score += 45;
        }
      }

      // 8. Capacidade Estrita
      if (itemCap) {
        const prodCapMatch = prod.nome.match(/(\d+\s*(?:gb|tb))/i);
        if (prodCapMatch) {
          const prodCap = normalizeStr(prodCapMatch[1]);
          if (prodCap !== itemCap) continue; // Capacidades diferentes NUNCA dão match!
        }
      }

      // Pontuação por tokens
      const tokens = item.header
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1);

      for (const tok of tokens) {
        if (prod.nome.toLowerCase().includes(tok)) score += 10;
      }

      // Correspondência de cor
      if (normColor && normColor !== 'padrao') {
        if (prodNorm.includes(normColor)) {
          score += 60;
        } else if ((normColor === 'midnight' || normColor === 'midinight') && (prodNorm.includes('midnight') || prodNorm.includes('preto'))) {
          score += 60;
        } else if (normColor === 'silver' && (prodNorm.includes('prata') || prodNorm.includes('silver'))) {
          score += 55;
        } else if (normColor === 'preto' && (prodNorm.includes('spaceblack') || prodNorm.includes('midnight') || prodNorm.includes('preto'))) {
          score += 55;
        } else if (normColor === 'bordo' && prodNorm.includes('bordo')) {
          score += 60;
        } else if (normColor === 'laranja' && prodNorm.includes('laranja')) {
          score += 60;
        } else if (normColor === 'citrus' && prodNorm.includes('citrus')) {
          score += 60;
        } else if (normColor === 'gray' && (prodNorm.includes('gray') || prodNorm.includes('cinza'))) {
          score += 55;
        } else if (normColor === 'gold' && (prodNorm.includes('gold') || prodNorm.includes('dourado'))) {
          score += 55;
        } else if (normColor === 'rosa' && prodNorm.includes('rosa')) {
          score += 60;
        } else if (normColor === 'rosegold' && (prodNorm.includes('rosegold') || prodNorm.includes('rose gold'))) {
          score += 60;
        } else if (normColor === 'spacegray' && prodNorm.includes('spacegray')) {
          score += 60;
        } else if (normColor === 'skyblue' && prodNorm.includes('skyblue')) {
          score += 60;
        } else {
          score -= 30; // Penaliza forte cor incompatível
        }
      }

      if (score > bestScore) {
        bestScore = score;
        best = prod;
      }
    }

    // Se achou um produto compatível com score consistente
    if (best && bestScore >= 25) {
      const currentPrice = best.precoPor;
      const newPrice = item.isZerou ? currentPrice : item.price;
      const priceDiff = item.isZerou ? 0 : Number((newPrice - currentPrice).toFixed(2));

      return {
        ...item,
        matchedProductId: best.id,
        matchedProductName: best.nome,
        currentPrice,
        newPrice,
        priceDiff,
        isNewProduct: false,
      };
    }

    // Caso contrário: PRODUTO NOVO NÃO CADASTRADO NO SISTEMA!
    return {
      ...item,
      isNewProduct: true,
      selected: true,
    };
  });
}

/**
 * Tabela Oficial de Fotos Reais de Estúdio Apple da RR Mobile
 */
const APPLE_STUDIO_IMAGES: Record<string, string> = {
  // iPhone 18 Duo
  'iphone-18-duo-silver':
    'https://fastshopbr.vtexassets.com/arquivos/ids/2154628/17577087322411.jpg?v=638933067932830000',
  'iphone-18-duo-preto':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5412162/0_0a9da38f-0aa1-41ee-a06f-456d7174a604.jpeg.jpg?v=639219831755470000',

  // iPhone 18 Pro / Pro Max
  'iphone-18-pro-bordo':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5582893/17892151691071.jpg?v=639248129969870000',
  'iphone-18-promax-bordo':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5582713/17892122194563.jpg?v=639271508292970000',
  'iphone-18-promax-azul':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5582728/17892125584464.jpg?v=639263676632800000',
  'iphone-18-promax-preto':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5412162/0_0a9da38f-0aa1-41ee-a06f-456d7174a604.jpeg.jpg?v=639219831755470000',
  'iphone-18-promax-silver':
    'https://fastshopbr.vtexassets.com/arquivos/ids/2154628/17577087322411.jpg?v=638933067932830000',

  // iPhone 17 Pro / Pro Max
  'iphone-17-promax-silver':
    'https://fastshopbr.vtexassets.com/arquivos/ids/2154628/17577087322411.jpg?v=638933067932830000',
  'iphone-17-promax-laranja':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5411081/0_e19cb787-382b-4264-8312-8703be564521.jpeg.jpg?v=639219807883800000',

  // Apple Watch
  'watch-s12-gold':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5474279/17839785509654.jpg?v=639228574635070000',
  'watch-s12-preto':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5550916/17743809740462.jpg?v=639241302492270000',
  'watch-s12-gray':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5550916/17743809740462.jpg?v=639241302492270000',
  'watch-s12-rosegold':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5474279/17839785509654.jpg?v=639228574635070000',
  'watch-s11-rosegold':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5474279/17839785509654.jpg?v=639228574635070000',
  'watch-se3-preto':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5550916/17743809740462.jpg?v=639241302492270000',
  'watch-se3-starlight':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5474279/17839785509654.jpg?v=639228574635070000',
  'watch-ultra3-black':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5550916/17743809740462.jpg?v=639241302492270000',

  // MacBooks
  'macbook-neo-rosa':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5605988/17883601858533.jpg?v=639253424969630000',
  'macbook-neo-silver':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4969195/17799190188431.jpg',
  'macbook-neo-azul':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4969294/17799182703691.jpg',
  'macbook-air-m5-skyblue':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4969294/17799182703691.jpg',
  'macbook-air-m5-midnight':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5572889/17889778059557.jpg',
  'macbook-air-m5-silver':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4969195/17799190188431.jpg',

  // iPads
  'ipad-pro-m5-preto':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4050204/17710764682956.jpg?v=639066732922500000',
  'ipad-pro-m5-branco':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4990654/17805672821381.jpg?v=639162743288700000',
  'ipad-air-m4-azul':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4987278/17795274877446.jpg?v=639162654160370000',
  'ipad-air-m4-spacegray':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4050204/17710764682956.jpg?v=639066732922500000',
  'ipad-11-azul':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4987278/17795274877446.jpg?v=639162654160370000',
  'ipad-11-silver':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4990654/17805672821381.jpg?v=639162743288700000',
  'ipad-11-rosa':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5605988/17883601858533.jpg?v=639253424969630000',
  'ipad-mini-7-spacegray':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4050204/17710764682956.jpg?v=639066732922500000',

  // Acessórios
  'airtag-2':
    'https://fastshopbr.vtexassets.com/arquivos/ids/3743413/17665070237205.jpg',
  'airtag-pack-4':
    'https://fastshopbr.vtexassets.com/arquivos/ids/3743413/17665070237205.jpg',
  'magic-mouse-branco':
    'https://fastshopbr.vtexassets.com/arquivos/ids/2406064/17602436161207.jpg?v=638961367607130000',
  'magic-mouse-preto':
    'https://fastshopbr.vtexassets.com/arquivos/ids/2430543/17602613662374.jpg?v=638961564753900000',
  'apple-pencil-usbc':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5131293/0_0_675b43e3447c42f8bd0a04ac.jpg?v=639180751853670000',
  'apple-pencil-pro':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5131293/0_0_675b43e3447c42f8bd0a04ac.jpg?v=639180751853670000',
  'airpods-max-2-roxo':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5551098/17764168654806.jpg?v=639241302615530000',
  'airpods-4':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5052603/1_1_67eaea19094d93282e2919f0.jpg',
  'airpods-5':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5052603/1_1_67eaea19094d93282e2919f0.jpg',
  'airpods-pro-3':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5052603/1_1_67eaea19094d93282e2919f0.jpg',
  'fonte-apple':
    'https://fastshopbr.vtexassets.com/arquivos/ids/3986365/17707179676194.jpg',
  'cabo-apple':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4685243/17773862671424.jpg',
  'magsafe-charger':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5572889/17889778059557.jpg',
};

/**
 * Seleciona a melhor imagem real da Apple baseada no nome e na cor.
 */
function resolveAppleImage(header: string, color: string): string {
  const norm = normalizeStr(`${header} ${color}`);

  if (norm.includes('duo')) {
    if (norm.includes('preto') || norm.includes('black')) {
      return APPLE_STUDIO_IMAGES['iphone-18-duo-preto'];
    }
    return APPLE_STUDIO_IMAGES['iphone-18-duo-silver'];
  }
  if (norm.includes('18promax') || norm.includes('18pro') || norm.includes('18')) {
    if (norm.includes('bordo')) return APPLE_STUDIO_IMAGES['iphone-18-promax-bordo'];
    if (norm.includes('azul')) return APPLE_STUDIO_IMAGES['iphone-18-promax-azul'];
    if (norm.includes('preto')) return APPLE_STUDIO_IMAGES['iphone-18-promax-preto'];
    if (norm.includes('silver')) return APPLE_STUDIO_IMAGES['iphone-18-promax-silver'];
  }
  if (norm.includes('17promax') || norm.includes('17')) {
    if (norm.includes('laranja')) return APPLE_STUDIO_IMAGES['iphone-17-promax-laranja'];
    return APPLE_STUDIO_IMAGES['iphone-17-promax-silver'];
  }
  if (norm.includes('watch')) {
    if (norm.includes('ultra')) return APPLE_STUDIO_IMAGES['watch-ultra3-black'];
    if (norm.includes('gold') || norm.includes('rosegold')) return APPLE_STUDIO_IMAGES['watch-s12-gold'];
    return APPLE_STUDIO_IMAGES['watch-s12-preto'];
  }
  if (norm.includes('macbook')) {
    if (norm.includes('rosa')) return APPLE_STUDIO_IMAGES['macbook-neo-rosa'];
    if (norm.includes('azul') || norm.includes('skyblue')) return APPLE_STUDIO_IMAGES['macbook-air-m5-skyblue'];
    if (norm.includes('midnight')) return APPLE_STUDIO_IMAGES['macbook-air-m5-midnight'];
    return APPLE_STUDIO_IMAGES['macbook-neo-silver'];
  }
  if (norm.includes('ipad')) {
    if (norm.includes('rosa')) return APPLE_STUDIO_IMAGES['ipad-11-rosa'];
    if (norm.includes('azul')) return APPLE_STUDIO_IMAGES['ipad-air-m4-azul'];
    if (norm.includes('branco') || norm.includes('silver')) return APPLE_STUDIO_IMAGES['ipad-pro-m5-branco'];
    return APPLE_STUDIO_IMAGES['ipad-pro-m5-preto'];
  }
  if (norm.includes('airpods')) {
    if (norm.includes('max')) return APPLE_STUDIO_IMAGES['airpods-max-2-roxo'];
    return APPLE_STUDIO_IMAGES['airpods-4'];
  }
  if (norm.includes('airtag')) {
    return APPLE_STUDIO_IMAGES['airtag-2'];
  }
  if (norm.includes('mouse')) {
    if (norm.includes('preto')) return APPLE_STUDIO_IMAGES['magic-mouse-preto'];
    return APPLE_STUDIO_IMAGES['magic-mouse-branco'];
  }
  if (norm.includes('pencil')) {
    return APPLE_STUDIO_IMAGES['apple-pencil-pro'];
  }
  if (norm.includes('fonte')) {
    return APPLE_STUDIO_IMAGES['fonte-apple'];
  }
  if (norm.includes('cabo')) {
    return APPLE_STUDIO_IMAGES['cabo-apple'];
  }
  if (norm.includes('magsafe')) {
    return APPLE_STUDIO_IMAGES['magsafe-charger'];
  }

  return 'https://fastshopbr.vtexassets.com/arquivos/ids/2154628/17577087322411.jpg?v=638933067932830000';
}

/**
 * Cria automaticamente um novo produto Apple oficial com foto real e dados de atacado.
 */
export function createAppleProductFromItem(item: ParsedAppleItem): Product {
  const normH = normalizeStr(item.header);
  const normC = normalizeStr(item.color);

  // Gera slug único estável
  const rawId = `rr-apple-${normH}-${normC}`.slice(0, 48);
  const id = rawId.replace(/[^a-z0-9\-]/g, '-').replace(/\-+/g, '-');

  // Formata Nome elegante
  const isIphone = /iphone/i.test(item.header);
  const isAmericano = /americano|🇺🇸/i.test(item.header);

  let cleanHeader = item.header
    .replace(/\s*\(?\s*americano\s*🇺🇸?\s*\)?/gi, '')
    .replace(/\s*🇺🇸/gi, '')
    .replace(/💯.*/gi, '')
    .replace(/no pix.*/gi, '')
    .replace(/sem fiado.*/gi, '')
    .replace(/sem menos.*/gi, '')
    .replace(/[\*\_\#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Preserva maiúsculas comuns como iPhone, iPad, MacBook, GB, USB-C
  cleanHeader = cleanHeader
    .replace(/\biphone\b/gi, 'iPhone')
    .replace(/\bipad\b/gi, 'iPad')
    .replace(/\bmacbook\b/gi, 'MacBook')
    .replace(/\bairpods\b/gi, 'AirPods')
    .replace(/\bairtag\b/gi, 'AirTag')
    .replace(/(\d+)\s*gb\b/gi, '$1GB')
    .replace(/(\d+)\s*tb\b/gi, '$1TB')
    .replace(/\busb-c\b/gi, 'USB-C');

  const colorPart = item.color && item.color !== 'Padrão' ? ` - ${item.color}` : '';
  const versionPart = (isIphone && isAmericano) ? ' (Americano 🇺🇸)' : '';
  const nome = `${cleanHeader}${versionPart}${colorPart}`;

  // Categoria
  const categoria = /watch/i.test(item.header)
    ? 'Acessórios & Semijoias'
    : 'Eletrônicos & Smartphones';

  const preco = item.price > 0 ? item.price : 1000;
  const precoDe = Math.round(preco * 1.15);
  const maxParcelasSemJuros = preco >= 200 ? 12 : preco >= 80 ? 6 : 3;

  const imagem = resolveAppleImage(item.header, item.color);

  const descricao = isIphone
    ? `Lançamento Apple na RR-MOBILE: ${nome}. Equipado com tela OLED Super Retina XDR com ProMotion, conectividade 5G ultrarrápida, sistema de câmera Pro de 48MP com Apple Intelligence e acabamento premium de última geração. | Pagamento: 100% no PIX ou Dinheiro (sem fiado). Aviso Apple RR-MOBILE: Alguns produtos Apple podem constar com data de compra prévia no sistema, o que não significa que o aparelho foi ativado. Para atualizar a data de ativação no site oficial, basta apresentar a nota fiscal entrando em contato pelo 0800 761 0880 (Apple Suporte). Confira o aparelho no ato da retirada — não aceitamos devolução após retirada da loja.`
    : `Produto Apple original ${nome} disponível para pronta entrega em Brasília-DF na RR-MOBILE. Garantia Apple de 1 ano. Pagamento no PIX ou Cartão em até 12x.`;

  return {
    id,
    nome,
    categoria,
    precoCusto: preco,
    precoDe,
    precoPor: preco,
    precoPix: preco, // Regra da lista WhatsApp: valor à vista no PIX sem desconto adicional
    maxParcelasSemJuros,
    parcelamento: `em até ${maxParcelasSemJuros}x de R$ ${(preco / maxParcelasSemJuros).toFixed(2).replace('.', ',')}`,
    avaliacao: 5.0,
    avaliacoesCount: 45,
    tag: isIphone && /duo/i.test(item.header) ? 'Novidade' : 'Mais Vendido',
    imagem,
    descricao,
    estoque: item.isZerou ? 0 : 5,
  };
}
