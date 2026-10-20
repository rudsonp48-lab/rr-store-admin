export type CategoryId =
  | 'Todos'
  | 'Eletrônicos & Smartphones'
  | 'Smart Home & Iluminação'
  | 'Moda Fitness & Athleisure'
  | 'Suplementos & Nutrição'
  | 'Skincare & Autocuidado'
  | 'Casa & Organização'
  | 'Pet Shop'
  | 'Moda Infantil & Enxoval'
  | 'Acessórios & Semijoias'
  | 'Papelaria Criativa & Concursos';

export interface CategoryInfo {
  id: CategoryId;
  nome: string;
  subtitulo: string;
  icone: string;
  destaqueCount?: number;
}

export interface Product {
  id: string;
  nome: string;
  categoria: Exclude<CategoryId, 'Todos'>;
  precoCusto?: number; // valor de atacado / custo no fornecedor (GSM Digital)
  precoDe: number;
  precoPor: number;
  precoPix: number; // 5% de desconto calculado automaticamente
  parcelamento: string;
  maxParcelasSemJuros: number;
  avaliacao: number; // 4.7 a 5.0
  avaliacoesCount: number;
  tag: 'Mais Vendido' | 'Entrega Hoje DF' | 'Novidade' | 'Oferta Flash' | 'Favorito no DF' | 'Estoque Limitado';
  imagem: string;
  descricao: string;
  estoque: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DFRegion {
  id: string;
  nome: string;
  taxaEntrega: number;
  tempoEstimado: string;
  freteGratisAcimaDe: number;
}

/**
 * Banner da vitrine principal, gerenciado pelo projeto separado `rr-store-admin`
 * e publicado em Firestore (rr_store_settings/banners).
 */
export interface HeroBanner {
  id: string;
  imagem: string;
  titulo?: string;
  produtoId?: string; // produto exibido/vendido neste banner (opcional)
  ativo: boolean;
}

export type PaymentMethod = 'pix' | 'credito' | 'debito';

export type CardPaymentMode = 'link_seguro' | 'maquininha_entrega' | 'checkout_transparente';

export interface CustomerCheckoutData {
  nomeCompleto: string;
  whatsapp: string;
  regiaoId: string;
  cep: string;
  enderecoCompleto: string;
  complemento: string;
  observacoes: string;
  metodoPagamento: PaymentMethod;
  parcelasCredito: number;
  modoCartao: CardPaymentMode;
  numeroCartaoSimulado?: string;
  nomeImpressoCartao?: string;
  validadeCartao?: string;
  cvvCartao?: string;
}

export interface Testimonial {
  id: string;
  nome: string;
  regiao: string;
  avatarIniciais: string;
  avaliacao: number;
  comentario: string;
  produtoComprado: string;
  tempoEntrega: string;
  data: string;
}
