export interface StorySlide {
  id: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  headline: string;
  caption: string;
  tag: string;
  ctaText?: string;
  ctaAction?: 'tradein' | 'catalog' | 'whatsapp' | 'map';
}

export interface StoryGroup {
  id: string;
  title: string;
  subtitle: string;
  coverImage: string;
  isLive?: boolean;
  hasUnseen?: boolean;
  slides: StorySlide[];
}

export const STORE_STORIES: StoryGroup[] = [
  {
    id: 'loja-d439',
    title: 'Loja Física',
    subtitle: 'SIA Loja D439',
    coverImage: '/apple-cutouts/ip17pm-silver.png',
    isLive: true,
    slides: [
      {
        id: 'loja-1',
        mediaType: 'image',
        mediaUrl:
          'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=900&auto=format&fit=crop&q=80',
        headline: 'Bem-vindo à Loja D439!',
        caption:
          'Localizada no coração da Feira dos Importados do SIA (Trecho 7, Loja D439). Venha tomar um café conosco, testar os aparelhos e retirar na hora com segurança total.',
        tag: 'Feira dos Importados • Loja D439',
        ctaText: 'Ver Como Chegar (Google Maps)',
        ctaAction: 'map',
      },
      {
        id: 'loja-2',
        mediaType: 'image',
        mediaUrl:
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&auto=format&fit=crop&q=80',
        headline: 'Bancada de Testes & Configuração',
        caption:
          'Transferimos todos os seus dados do aparelho antigo para o novo gratuitamente na nossa bancada de atendimento.',
        tag: 'Atendimento VIP',
        ctaText: 'Falar com Atendimento',
        ctaAction: 'whatsapp',
      },
    ],
  },
  {
    id: 'entregas-df',
    title: 'Entregas Hoje',
    subtitle: 'Motoboy DF',
    coverImage: '/apple-cutouts/watch-ultra3-black.png',
    slides: [
      {
        id: 'entregas-1',
        mediaType: 'image',
        mediaUrl:
          'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=900&auto=format&fit=crop&q=80',
        headline: 'Receba em até 90 min no DF',
        caption:
          'Nossa frota de motoboys próprios atende Plano Piloto, Águas Claras, Sudoeste, Noroeste, Taguatinga, Guará e todas as RAs.',
        tag: 'Despacho Expresso',
        ctaText: 'Explorar Catálogo',
        ctaAction: 'catalog',
      },
      {
        id: 'entregas-2',
        mediaType: 'image',
        mediaUrl:
          'https://images.unsplash.com/photo-1556742049-0a67e557224e?w=900&auto=format&fit=crop&q=80',
        headline: 'Pague na Entrega do Motoboy',
        caption:
          'Passe seu cartão de crédito em até 12x na maquininha do motoboy ou faça o PIX conferindo seu aparelho em mãos.',
        tag: 'Risco Zero',
        ctaText: 'Pedir Agora via WhatsApp',
        ctaAction: 'whatsapp',
      },
    ],
  },
  {
    id: 'troca-facil',
    title: 'Troca Fácil',
    subtitle: 'Seu Usado Vale $',
    coverImage: '/apple-cutouts/ip18pm-bordo.png',
    slides: [
      {
        id: 'troca-1',
        mediaType: 'image',
        mediaUrl:
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=900&auto=format&fit=crop&q=80',
        headline: 'Pegamos seu usado como entrada!',
        caption:
          'Avaliamos seu iPhone, Samsung ou Xiaomi usado pelo melhor preço do mercado de Brasília. Pague apenas a volta no PIX ou parcelado.',
        tag: 'Trade-In RR Store',
        ctaText: 'Simular Meu Usado Agora',
        ctaAction: 'tradein',
      },
    ],
  },
  {
    id: 'lacrados-apple',
    title: 'Lacrados',
    subtitle: '100% Originais',
    coverImage: '/apple-cutouts/airpods-max2-azul.png',
    slides: [
      {
        id: 'lacrados-1',
        mediaType: 'image',
        mediaUrl:
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=900&auto=format&fit=crop&q=80',
        headline: 'Aparelhos 100% Lacrados',
        caption:
          'Selo oficial Anatel, garantia mundial de 1 ano da Apple. Você mesmo desfruta de romper os lacres na entrega.',
        tag: 'Garantia Mundial Apple 1 Ano',
        ctaText: 'Ver Modelos Disponíveis',
        ctaAction: 'catalog',
      },
    ],
  },
  {
    id: 'clientes-vip',
    title: 'Clientes VIP',
    subtitle: '+20k Clientes',
    coverImage: '/apple-cutouts/macbook-air-m5-midnight.png',
    slides: [
      {
        id: 'clientes-1',
        mediaType: 'image',
        mediaUrl:
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&auto=format&fit=crop&q=80',
        headline: 'Mais de 20 mil clientes no DF',
        caption:
          'Agradecemos a cada cliente de Brasília que confia na RR Store há anos. Sua satisfação é nosso maior patrimônio!',
        tag: 'Avaliação 5 Estrelas Google',
        ctaText: 'Chamar no WhatsApp',
        ctaAction: 'whatsapp',
      },
    ],
  },
];
