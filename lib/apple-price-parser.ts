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
  const clean = raw.trim().replace(/^[^\d]+|[^\d]+$/g, '').trim();
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
        .replace(/\biphone\s*18\s*duo\b/gi, 'iPhone Duo')
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

        if (/airpods\s*[45]/i.test(item.header)) {
          const isHeaderAnc = /cancelamento|anc/i.test(item.header);
          const isProdAnc = /cancelamento|anc/i.test(prod.nome);
          if (isHeaderAnc !== isProdAnc) continue;
        }

        score += 35; // Bateu modelo de AirPods e tipo de cancelamento
      }

      // 6.5 REGRAS ESTRITAS PARA TECLADOS / MAGIC KEYBOARD
      if (isKeyboard) {
        const isHeaderNum = /numerico|numérico/i.test(item.header);
        const isProdNum = /numerico|numérico/i.test(prod.nome);
        if (isHeaderNum !== isProdNum) continue;

        const isHeaderIpad = /ipad/i.test(item.header);
        const isProdIpad = /ipad/i.test(prod.nome);
        if (isHeaderIpad !== isProdIpad) continue;

        score += 20;
      }

      // 7. REGRAS PARA AIRTAG
      if (isAirtag) {
        const isPack4 = /pack\s*4/i.test(item.header);
        const prodPack4 = /pack.*4|4\s*unidades/i.test(prod.nome);
        if (isPack4 !== prodPack4) continue;

        if (!isPack4) {
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
  // iPhone Duo (Dobrável Oficial)
  'iphone-18-duo-silver':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5589484/0_3e3c8c63-c3d1-47a2-b37f-291ef6712cfe.jpeg.jpg?v=639250133058300000',
  'iphone-18-duo-preto':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5589492/0_ba5a095d-9bc3-413e-9cb8-0d4edd4a141d.jpeg.jpg?v=639250133367470000',

  // iPhone 18 Pro / Pro Max
  'iphone-18-pro-bordo':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5582858/17892139689370.jpg?v=639248115986770000',
  'iphone-18-promax-bordo':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5582713/17892122194563.jpg?v=639271508292970000',
  'iphone-18-promax-azul':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5582728/17892125584464.jpg?v=639263676632800000',
  'iphone-18-promax-preto':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5582771/17892121636785.jpg?v=639248108016600000',
  'iphone-18-promax-silver':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5582719/17892124914659.jpg?v=639248107993200000',

  // iPhone 17 Pro / Pro Max
  'iphone-17-promax-silver':
    'https://fastshopbr.vtexassets.com/arquivos/ids/2154628/17577087322411.jpg?v=638933067932830000',
  'iphone-17-promax-laranja':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5411081/0_e19cb787-382b-4264-8312-8703be564521.jpeg.jpg?v=639219807883800000',

  // Apple Watch
  'watch-s12-gold':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5647672/0_e30a7573-988e-47c8-a2c7-d1ef433b8a99.jpeg.jpg?v=639263858841600000',
  'watch-s12-preto':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5646899/0_e4fcd6ff-2904-4ccd-beee-d17f3b4d7939.jpeg.jpg?v=639263774609300000',
  'watch-s12-gray':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5647771/0_cdef7214-fb5c-4316-b658-3c3cdd53a2f3.jpeg.jpg?v=639263861467370000',
  'watch-s12-rosegold':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5121364/0_0_675b42c7447c42f8bd09ebcd.jpg?v=639180389957600000',
  'watch-s11-rosegold':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5121364/0_0_675b42c7447c42f8bd09ebcd.jpg?v=639180389957600000',
  'watch-se3-preto':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4612189/0_0_675b42cb447c42f8bd09ec20.jpg?v=639120576170330000',
  'watch-se3-starlight':
    'https://fastshopbr.vtexassets.com/arquivos/ids/4611564/0_0_675b42cb447c42f8bd09ec27.jpg?v=639120559162830000',
  'watch-ultra3-black':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5647289/0_c636e66c-b31e-49b1-9dde-7f36325fa745.jpeg.jpg?v=639263849923430000',

  // MacBooks
  'macbook-neo-rosa':
    'https://fastshopbr.vteximg.com.br/arquivos/ids/5396042/0_51354aa6-15e5-402f-b53b-811e2d346f34.jpeg.jpg?v=639217380412700000',
  'macbook-neo-silver':
    'https://fastshopbr.vteximg.com.br/arquivos/ids/5396122/0_db925313-5501-4b17-ac3a-df463898ac2d.jpeg.jpg?v=639217382602570000',
  'macbook-neo-azul':
    'https://fastshopbr.vteximg.com.br/arquivos/ids/5396072/0_e26c32f9-508e-4138-bc5f-c44329134ba4.jpeg.jpg?v=639217381202130000',
  'macbook-air-m5-skyblue':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5135264/0_917a7cd3-bc1e-45ba-a202-2c4fd8800c9b.jpeg.jpg?v=639180864217430000',
  'macbook-air-m5-midnight':
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-midnight-select-202402?wid=2000&hei=2000&fmt=png-alpha',
  'macbook-air-m5-silver':
    'https://fastshopbr.vteximg.com.br/arquivos/ids/5396015/0_8d70e056-1486-44db-a981-5f1ae30ba562.jpeg.jpg?v=639217379068070000',

  // iPads
  'ipad-pro-m5-preto':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5160866/0_0_675b42c4447c42f8bd09eb7d.jpg?v=639183784983530000',
  'ipad-pro-m5-branco':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5160798/0_0_675b42be447c42f8bd09eb01.jpg?v=639183781439670000',
  'ipad-air-m4-azul':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5396762/0_0_67dcb5c72954dd4c58245619.jpg?v=639217400428900000',
  'ipad-air-m4-spacegray':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5395689/0_0_67dcb5c52954dd4c582455fd.jpg?v=639217367461330000',
  'ipad-11-azul':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5170323/0_0_67dcb5c82954dd4c58245627.jpg?v=639184418695330000',
  'ipad-11-silver':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5168636/0_0_67dcb5c62954dd4c58245609.jpg?v=639184331469930000',
  'ipad-11-rosa':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5395619/0_0_67dcb5c52954dd4c58245605.jpg?v=639217365810770000',
  'ipad-mini-7-spacegray':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5395853/0_0_675b42cf447c42f8bd09ec97.jpg?v=639217374222870000',

  // Acessórios
  'airtag-2':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5638935/0_a93e07eb-6b06-4298-b47b-bdeeeed75a9d.jpeg.jpg?v=639262200686170000',
  'airtag-pack-4':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5638935/0_a93e07eb-6b06-4298-b47b-bdeeeed75a9d.jpeg.jpg?v=639262200686170000',
  'magic-mouse-branco':
    'https://images.kabum.com.br/produtos/fotos/sync_mirakl/948291/xlarge/Mouse-Magic-Apple-Multi-touch-Bluetooth-Branco_1784705928.jpg',
  'magic-mouse-preto':
    'https://images.kabum.com.br/produtos/fotos/463095/magic-mouse-black-multi-touch-surface-mmmq3be-a_1686757928_gg.jpg',
  'apple-pencil-usbc':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5034985/0_0_675b42c8447c42f8bd09ebe2.jpg?v=639168364515330000',
  'apple-pencil-pro':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5034985/0_0_675b42c8447c42f8bd09ebe2.jpg?v=639168364515330000',
  'airpods-max-2-roxo':
    'https://fastshopbr.vteximg.com.br/arquivos/ids/4790607/0_0_675b42c5447c42f8bd09eba6.jpg?v=639143010653530000',
  'airpods-4':
    'https://fastshopbr.vteximg.com.br/arquivos/ids/5381394/0_0_675b42cf447c42f8bd09ec9e.jpg?v=639215534942430000',
  'airpods-5':
    'https://fastshopbr.vteximg.com.br/arquivos/ids/5598185/0_42949687-8cb6-4da9-b944-11b5360b4b34.jpeg.jpg?v=639251760803770000',
  'airpods-pro-3':
    'https://fastshopbr.vteximg.com.br/arquivos/ids/5381364/0_50614ecd-053a-4162-84a1-6cf463138411.jpeg.jpg?v=639215534067600000',
  'teclado-touchid':
    'https://fastshopbr.vteximg.com.br/arquivos/ids/5115786/0_951e9d0f-363d-4261-97df-6b0dc1108ca5.jpeg.jpg?v=639180221821330000',
  'magic-trackpad':
    'https://fastshopbr.vteximg.com.br/arquivos/ids/5034363/0_0_675b429b447c42f8bd09e74d.jpg?v=639168302823630000',
  'fonte-apple':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5254328/0_0_675b42bb447c42f8bd09eab2.jpg?v=639196251301570000',
  'cabo-apple':
    'https://fastshopbr.vtexassets.com/arquivos/ids/5097618/0_049cfe04-ad21-47ef-a853-ee85aa76b3a0.jpeg.jpg?v=639178479011300000',
  'magsafe-charger':
    'https://fastshopbr.vteximg.com.br/arquivos/ids/5104389/0_0_675b428c447c42f8bd09e5a6.jpg?v=639179248977000000',
};

/**
 * Seleciona a melhor imagem real da Apple baseada no nome e na cor.
 */
export function resolveAppleImage(header: string, color: string): string {
  const norm = normalizeStr(`${header} ${color}`);

  // 1. Acessórios e Periféricos primeiro (evita colisão ex: "Magic Keyboard 11 iPad Pro")
  if (norm.includes('trackpad')) {
    return APPLE_STUDIO_IMAGES['magic-trackpad'];
  }
  if (norm.includes('teclado') || norm.includes('keyboard')) {
    return APPLE_STUDIO_IMAGES['teclado-touchid'];
  }
  if (norm.includes('mouse')) {
    if (norm.includes('preto')) return APPLE_STUDIO_IMAGES['magic-mouse-preto'];
    return APPLE_STUDIO_IMAGES['magic-mouse-branco'];
  }
  if (norm.includes('pencil')) {
    return APPLE_STUDIO_IMAGES['apple-pencil-pro'];
  }
  if (norm.includes('airtag')) {
    return APPLE_STUDIO_IMAGES['airtag-2'];
  }
  if (norm.includes('airpods')) {
    if (norm.includes('max')) return APPLE_STUDIO_IMAGES['airpods-max-2-roxo'];
    if (norm.includes('pro')) return APPLE_STUDIO_IMAGES['airpods-pro-3'];
    if (norm.includes('5')) return APPLE_STUDIO_IMAGES['airpods-5'];
    return APPLE_STUDIO_IMAGES['airpods-4'];
  }
  if (norm.includes('magsafe')) {
    return APPLE_STUDIO_IMAGES['magsafe-charger'];
  }
  if (norm.includes('fonte')) {
    return APPLE_STUDIO_IMAGES['fonte-apple'];
  }
  if (norm.includes('cabo')) {
    return APPLE_STUDIO_IMAGES['cabo-apple'];
  }

  // 2. Watch, MacBook e iPad antes de iPhone (evita colisão ex: "A17PRO" bater em "17")
  if (norm.includes('watch')) {
    if (norm.includes('ultra')) return APPLE_STUDIO_IMAGES['watch-ultra3-black'];
    if (norm.includes('rosegold')) return APPLE_STUDIO_IMAGES['watch-s12-rosegold'];
    if (norm.includes('gold')) return APPLE_STUDIO_IMAGES['watch-s12-gold'];
    if (norm.includes('starlight')) return APPLE_STUDIO_IMAGES['watch-se3-starlight'];
    if (norm.includes('gray')) return APPLE_STUDIO_IMAGES['watch-s12-gray'];
    return APPLE_STUDIO_IMAGES['watch-s12-preto'];
  }
  if (norm.includes('macbook')) {
    if (norm.includes('rosa')) return APPLE_STUDIO_IMAGES['macbook-neo-rosa'];
    if (norm.includes('skyblue')) return APPLE_STUDIO_IMAGES['macbook-air-m5-skyblue'];
    if (norm.includes('azul')) return APPLE_STUDIO_IMAGES['macbook-neo-azul'];
    if (norm.includes('midnight') || norm.includes('midinight')) return APPLE_STUDIO_IMAGES['macbook-air-m5-midnight'];
    return APPLE_STUDIO_IMAGES['macbook-neo-silver'];
  }
  if (norm.includes('ipad')) {
    if (norm.includes('mini')) return APPLE_STUDIO_IMAGES['ipad-mini-7-spacegray'];
    if (norm.includes('rosa')) return APPLE_STUDIO_IMAGES['ipad-11-rosa'];
    if (norm.includes('azul')) return APPLE_STUDIO_IMAGES['ipad-air-m4-azul'];
    if (norm.includes('spacegray')) return APPLE_STUDIO_IMAGES['ipad-air-m4-spacegray'];
    if (norm.includes('branco') || norm.includes('silver')) return APPLE_STUDIO_IMAGES['ipad-pro-m5-branco'];
    return APPLE_STUDIO_IMAGES['ipad-pro-m5-preto'];
  }

  // 3. iPhones (exige 'iphone' ou 'duo')
  if (norm.includes('duo')) {
    if (norm.includes('preto') || norm.includes('black')) {
      return APPLE_STUDIO_IMAGES['iphone-18-duo-preto'];
    }
    return APPLE_STUDIO_IMAGES['iphone-18-duo-silver'];
  }
  if (norm.includes('iphone') && (norm.includes('18promax') || norm.includes('18pro') || norm.includes('18'))) {
    if (norm.includes('bordo')) return APPLE_STUDIO_IMAGES['iphone-18-promax-bordo'];
    if (norm.includes('azul')) return APPLE_STUDIO_IMAGES['iphone-18-promax-azul'];
    if (norm.includes('preto')) return APPLE_STUDIO_IMAGES['iphone-18-promax-preto'];
    if (norm.includes('silver')) return APPLE_STUDIO_IMAGES['iphone-18-promax-silver'];
  }
  if (norm.includes('iphone') && (norm.includes('17promax') || norm.includes('17'))) {
    if (norm.includes('laranja')) return APPLE_STUDIO_IMAGES['iphone-17-promax-laranja'];
    return APPLE_STUDIO_IMAGES['iphone-17-promax-silver'];
  }

  return 'https://fastshopbr.vtexassets.com/arquivos/ids/5582702/17892121899730.jpg?v=639248107988200000';
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
    .replace(/\biphone\s*18\s*duo\b/gi, 'iPhone Duo')
    .replace(/\biphone\s*duo\b/gi, 'iPhone Duo')
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
