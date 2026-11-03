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
}

export function cleanPriceNumber(raw: string): number | null {
  if (!raw) return null;
  const clean = raw.trim().replace(/R\$|USD|US|\$/gi, '').trim();
  // 1) Cents with dot or comma: "75.00", "100.00", "75,00"
  if (/^\d+[.,]\d{2}$/.test(clean)) {
    return parseFloat(clean.replace(',', '.'));
  }
  // 2) Thousands with dot: "8.750", "9.000", "10.900", "2.300", "1.650", "1.999"
  if (/^\d{1,3}\.\d{3}$/.test(clean)) {
    return parseInt(clean.replace('.', ''), 10);
  }
  // 3) Thousands with space: "1 750", "2 650"
  if (/^\d{1,3}\s\d{3}$/.test(clean)) {
    return parseInt(clean.replace(/\s+/g, ''), 10);
  }
  // 4) Plain integer: "2650", "799", "199", "150", "130", "100", "75"
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

    // Ignora cabeçalhos institucionais / mensagens
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
 */
export function matchAppleItems(
  items: ParsedAppleItem[],
  catalog: Product[]
): ParsedAppleItem[] {
  const appleCatalog = catalog.filter((p) => p.id.startsWith('rr-apple-'));

  return items.map((item) => {
    const normHeader = normalizeStr(item.header);
    const normColor = normalizeStr(item.color);

    // Identifica capacidade (ex: 128gb, 256gb, 512gb)
    const capMatch = item.header.match(/(\d+\s*(?:gb|tb))/i);
    const itemCap = capMatch ? normalizeStr(capMatch[1]) : '';

    let best: Product | null = null;
    let bestScore = -999;

    for (const prod of appleCatalog) {
      const prodNorm = normalizeStr(prod.nome);
      let score = 0;

      // Restrição estrita de família de produto
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

      // Diferenciação iPhone Pro vs Pro Max
      if (isIphone) {
        const isHeaderMax = /max/i.test(item.header);
        const isProdMax = /max/i.test(prod.nome);
        if (isHeaderMax !== isProdMax) continue;
      }

      // Diferenciação Watch Series (s11, s12, se3, se2, ultra3)
      if (isWatch) {
        if (/s11/i.test(item.header) && !/s11|series 11/i.test(prod.nome)) continue;
        if (/s12/i.test(item.header) && !/s12|series 12/i.test(prod.nome)) continue;
        if (/se\s*3/i.test(item.header) && !/se 3/i.test(prod.nome)) continue;
        if (/se\s*2/i.test(item.header) && !/se 2/i.test(prod.nome)) continue;
        if (/ultra\s*3/i.test(item.header) && !/ultra 3/i.test(prod.nome)) continue;

        // Tamanho milímetros do relógio (40mm, 42mm, 44mm, 46mm, 49mm)
        const sizeMatch = item.header.match(/(\d{2})\s*mm/i);
        if (sizeMatch && !prod.nome.includes(`${sizeMatch[1]}mm`)) continue;
      }

      // Diferenciação MacBook (Neo vs Air M5 vs Pro)
      if (isMacbook) {
        if (/neo/i.test(item.header) && !/neo/i.test(prod.nome)) continue;
        if (/air\s*m5/i.test(item.header) && !/air m5/i.test(prod.nome)) continue;
      }

      // Diferenciação iPad (Pro M5, Air M4, 11ª, Mini 7)
      if (isIpad) {
        if (/mini\s*7/i.test(item.header) && !/mini 7/i.test(prod.nome)) continue;
        if (/ipad\s*11\b/i.test(item.header) && !/11ª/i.test(prod.nome)) continue;
        if (/air\s*m4/i.test(item.header) && !/air m4/i.test(prod.nome)) continue;
        if (/pro\s*m5/i.test(item.header) && !/pro m5/i.test(prod.nome)) continue;

        // Tamanho de tela do iPad (11", 13", T11, T13)
        if (/t11|11”|11"/i.test(item.header) && !/11"/i.test(prod.nome)) score -= 40;
        if (/t13|13”|13"/i.test(item.header) && !/13"/i.test(prod.nome)) score -= 40;
      }

      // Diferenciação AirPods (Max 2, 4 ANC, 4 Regular, 5 ANC, 5 Regular, Pro 3)
      if (isAirpods) {
        if (/max\s*2/i.test(item.header) && !/max 2/i.test(prod.nome)) continue;
        if (/pro\s*3/i.test(item.header) && !/pro 3/i.test(prod.nome)) continue;
        if (/airpods\s*4/i.test(item.header) && !/airpods 4/i.test(prod.nome)) continue;
        if (/airpods\s*5/i.test(item.header) && !/airpods 5/i.test(prod.nome)) continue;

        const isHeaderAnc = /cancelamento|anc/i.test(item.header);
        const isProdAnc = /cancelamento|anc/i.test(prod.nome);
        if (isHeaderAnc !== isProdAnc) continue;
      }

      // Tokens de nome
      const tokens = item.header
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1);

      for (const tok of tokens) {
        if (prod.nome.toLowerCase().includes(tok)) score += 10;
      }

      // Correspondência de capacidade
      if (itemCap) {
        if (prodNorm.includes(itemCap)) score += 40;
        else score -= 40;
      }

      // Correspondência de cor
      if (normColor && normColor !== 'padrao') {
        if (prodNorm.includes(normColor)) {
          score += 45;
        } else if (normColor === 'silver' && prodNorm.includes('prata')) {
          score += 40;
        } else if (normColor === 'preto' && (prodNorm.includes('spaceblack') || prodNorm.includes('midnight'))) {
          score += 35;
        } else if (normColor === 'bordo' && prodNorm.includes('bordo')) {
          score += 45;
        } else if (normColor === 'laranja' && prodNorm.includes('laranja')) {
          score += 45;
        } else if (normColor === 'citrus' && prodNorm.includes('citrus')) {
          score += 45;
        } else if (normColor === 'gray' && (prodNorm.includes('gray') || prodNorm.includes('cinza'))) {
          score += 40;
        } else if (normColor === 'natural' && prodNorm.includes('natural')) {
          score += 40;
        } else if (normColor === 'spacegray' && prodNorm.includes('spacegray')) {
          score += 45;
        } else {
          score -= 15;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        best = prod;
      }
    }

    if (best && bestScore >= 15) {
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
      };
    }

    return item;
  });
}
