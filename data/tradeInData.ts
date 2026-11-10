import { formatBRL, WHATSAPP_NUMBER } from './defaults';
import { Product } from '../types/store';

export type TradeInBrand = 'Apple' | 'Samsung' | 'Xiaomi';

export type DeviceCondition = 'excelente' | 'bom' | 'marcas';

export interface TradeInModel {
  id: string;
  brand: TradeInBrand;
  name: string;
  category: string;
  storageOptions: {
    storage: string;
    baseValue: number; // Valor de avaliação base de recompra comercial (condição excelente)
  }[];
}

/**
 * Tabela Comercial de Recompra / Trade-In RR Store Brasília 2026
 * Calibrada para margem segura de atacado/lojista (compra para revenda/troca com volta):
 * - iPhone 12: R$ 850 a R$ 900 (máx 950 em 256GB)
 * - iPhone 13: R$ 1.000 a R$ 1.100 (128GB a R$ 1.050)
 * - iPhone 14: R$ 1.200 a R$ 1.350
 * - Proporcionalidade mantida para linhas 11, Pro, Pro Max, 15, Samsung e Xiaomi.
 */
export const TRADE_IN_MODELS: TradeInModel[] = [
  // ==================== APPLE IPHONES ====================
  {
    id: 'apple-ip11',
    brand: 'Apple',
    name: 'iPhone 11',
    category: 'iPhone',
    storageOptions: [
      { storage: '64GB', baseValue: 600 },
      { storage: '128GB', baseValue: 700 },
    ],
  },
  {
    id: 'apple-ip11pro',
    brand: 'Apple',
    name: 'iPhone 11 Pro / Pro Max',
    category: 'iPhone',
    storageOptions: [
      { storage: '64GB', baseValue: 750 },
      { storage: '256GB', baseValue: 850 },
      { storage: '512GB', baseValue: 950 },
    ],
  },
  {
    id: 'apple-ip12',
    brand: 'Apple',
    name: 'iPhone 12',
    category: 'iPhone',
    storageOptions: [
      { storage: '64GB', baseValue: 850 },
      { storage: '128GB', baseValue: 900 },
      { storage: '256GB', baseValue: 950 },
    ],
  },
  {
    id: 'apple-ip12pro',
    brand: 'Apple',
    name: 'iPhone 12 Pro / Pro Max',
    category: 'iPhone',
    storageOptions: [
      { storage: '128GB', baseValue: 1050 },
      { storage: '256GB', baseValue: 1150 },
      { storage: '512GB', baseValue: 1250 },
    ],
  },
  {
    id: 'apple-ip13',
    brand: 'Apple',
    name: 'iPhone 13',
    category: 'iPhone',
    storageOptions: [
      { storage: '128GB', baseValue: 1050 },
      { storage: '256GB', baseValue: 1150 },
      { storage: '512GB', baseValue: 1250 },
    ],
  },
  {
    id: 'apple-ip13pro',
    brand: 'Apple',
    name: 'iPhone 13 Pro',
    category: 'iPhone',
    storageOptions: [
      { storage: '128GB', baseValue: 1300 },
      { storage: '256GB', baseValue: 1450 },
      { storage: '512GB', baseValue: 1600 },
    ],
  },
  {
    id: 'apple-ip13promax',
    brand: 'Apple',
    name: 'iPhone 13 Pro Max',
    category: 'iPhone',
    storageOptions: [
      { storage: '128GB', baseValue: 1500 },
      { storage: '256GB', baseValue: 1650 },
      { storage: '512GB', baseValue: 1800 },
      { storage: '1TB', baseValue: 1950 },
    ],
  },
  {
    id: 'apple-ip14',
    brand: 'Apple',
    name: 'iPhone 14 / 14 Plus',
    category: 'iPhone',
    storageOptions: [
      { storage: '128GB', baseValue: 1200 },
      { storage: '256GB', baseValue: 1350 },
      { storage: '512GB', baseValue: 1500 },
    ],
  },
  {
    id: 'apple-ip14pro',
    brand: 'Apple',
    name: 'iPhone 14 Pro',
    category: 'iPhone',
    storageOptions: [
      { storage: '128GB', baseValue: 1700 },
      { storage: '256GB', baseValue: 1850 },
      { storage: '512GB', baseValue: 2050 },
    ],
  },
  {
    id: 'apple-ip14promax',
    brand: 'Apple',
    name: 'iPhone 14 Pro Max',
    category: 'iPhone',
    storageOptions: [
      { storage: '128GB', baseValue: 1950 },
      { storage: '256GB', baseValue: 2150 },
      { storage: '512GB', baseValue: 2350 },
      { storage: '1TB', baseValue: 2500 },
    ],
  },
  {
    id: 'apple-ip15',
    brand: 'Apple',
    name: 'iPhone 15 / 15 Plus',
    category: 'iPhone',
    storageOptions: [
      { storage: '128GB', baseValue: 1800 },
      { storage: '256GB', baseValue: 2000 },
      { storage: '512GB', baseValue: 2200 },
    ],
  },
  {
    id: 'apple-ip15pro',
    brand: 'Apple',
    name: 'iPhone 15 Pro',
    category: 'iPhone',
    storageOptions: [
      { storage: '128GB', baseValue: 2400 },
      { storage: '256GB', baseValue: 2650 },
      { storage: '512GB', baseValue: 2900 },
      { storage: '1TB', baseValue: 3100 },
    ],
  },
  {
    id: 'apple-ip15promax',
    brand: 'Apple',
    name: 'iPhone 15 Pro Max',
    category: 'iPhone',
    storageOptions: [
      { storage: '256GB', baseValue: 2900 },
      { storage: '512GB', baseValue: 3200 },
      { storage: '1TB', baseValue: 3500 },
    ],
  },

  // ==================== SAMSUNG GALAXY ====================
  {
    id: 'sam-s22',
    brand: 'Samsung',
    name: 'Galaxy S22 / S22+',
    category: 'Samsung',
    storageOptions: [
      { storage: '128GB', baseValue: 650 },
      { storage: '256GB', baseValue: 750 },
    ],
  },
  {
    id: 'sam-s22ultra',
    brand: 'Samsung',
    name: 'Galaxy S22 Ultra',
    category: 'Samsung',
    storageOptions: [
      { storage: '256GB', baseValue: 950 },
      { storage: '512GB', baseValue: 1100 },
    ],
  },
  {
    id: 'sam-s23',
    brand: 'Samsung',
    name: 'Galaxy S23 / S23+',
    category: 'Samsung',
    storageOptions: [
      { storage: '128GB', baseValue: 1000 },
      { storage: '256GB', baseValue: 1150 },
      { storage: '512GB', baseValue: 1300 },
    ],
  },
  {
    id: 'sam-s23ultra',
    brand: 'Samsung',
    name: 'Galaxy S23 Ultra',
    category: 'Samsung',
    storageOptions: [
      { storage: '256GB', baseValue: 1500 },
      { storage: '512GB', baseValue: 1700 },
      { storage: '1TB', baseValue: 1900 },
    ],
  },
  {
    id: 'sam-s24ultra',
    brand: 'Samsung',
    name: 'Galaxy S24 Ultra',
    category: 'Samsung',
    storageOptions: [
      { storage: '256GB', baseValue: 2200 },
      { storage: '512GB', baseValue: 2450 },
    ],
  },
  {
    id: 'sam-zflip',
    brand: 'Samsung',
    name: 'Galaxy Z Flip 4 / 5',
    category: 'Samsung',
    storageOptions: [
      { storage: '256GB', baseValue: 900 },
      { storage: '512GB', baseValue: 1050 },
    ],
  },

  // ==================== XIAOMI ====================
  {
    id: 'xiaomi-note13pro',
    brand: 'Xiaomi',
    name: 'Redmi Note 13 Pro / Pro+ 5G',
    category: 'Xiaomi',
    storageOptions: [
      { storage: '256GB', baseValue: 450 },
      { storage: '512GB', baseValue: 550 },
    ],
  },
  {
    id: 'xiaomi-pocox6',
    brand: 'Xiaomi',
    name: 'Poco X6 / X6 Pro 5G',
    category: 'Xiaomi',
    storageOptions: [
      { storage: '256GB', baseValue: 450 },
      { storage: '512GB', baseValue: 550 },
    ],
  },
  {
    id: 'xiaomi-pocof6',
    brand: 'Xiaomi',
    name: 'Poco F5 / F6 Pro',
    category: 'Xiaomi',
    storageOptions: [
      { storage: '256GB', baseValue: 700 },
      { storage: '512GB', baseValue: 850 },
    ],
  },
];

export const CONDITION_MULTIPLIERS: Record<
  DeviceCondition,
  { label: string; desc: string; factor: number; badgeColor: string }
> = {
  excelente: {
    label: 'Excelente (Como Novo)',
    desc: 'Bateria 85%+, tela original sem riscos, tudo funcionando perfeitamente.',
    factor: 1.0,
    badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
  },
  bom: {
    label: 'Bom (Uso Normal)',
    desc: 'Bateria entre 80% e 84%, pequenos sinais normais de capinha ou aro.',
    factor: 0.85,
    badgeColor: 'text-blue-400 border-blue-500/40 bg-blue-950/40',
  },
  marcas: {
    label: 'Com Marcas Visíveis',
    desc: 'Bateria <80% ou marcas de uso nítidas (sem trincos na tela ou traseira).',
    factor: 0.70,
    badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
  },
};

export function calculateTradeInValue(
  baseValue: number,
  condition: DeviceCondition,
  customMultiplier: number = 1.0
): number {
  const condFactor = CONDITION_MULTIPLIERS[condition]?.factor || 1.0;
  return Math.round(baseValue * condFactor * customMultiplier);
}

export function buildTradeInWhatsAppUrl(params: {
  usedModelName: string;
  usedStorage: string;
  condition: DeviceCondition;
  evaluatedValue: number;
  targetProduct: Product;
  differencePix: number;
  deliveryMethod?: 'loja' | 'motoboy';
  customerRegion?: string;
}): string {
  const condLabel = CONDITION_MULTIPLIERS[params.condition]?.label || 'Excelente';
  const methodText =
    params.deliveryMethod === 'motoboy'
      ? `🛵 Entrega via Motoboy no DF (${params.customerRegion || 'Brasília'})`
      : '🏢 Retirada e Avaliação Presencial na Loja D439 (SIA)';

  const lines = [
    '👋 *Olá equipe RR Store Brasília!*',
    'Acabei de fazer uma *Simulação de Troca (Trade-In)* pelo site oficial:',
    '',
    '📱 *Meu Aparelho Atual (Entrada):*',
    `• *Modelo:* ${params.usedModelName} (${params.usedStorage})`,
    `• *Condição:* ${condLabel}`,
    `• *Pré-Avaliação Estimada:* ~${formatBRL(params.evaluatedValue)}`,
    '',
    '🎯 *Aparelho Novo que Desejo Comprar:*',
    `• *Produto:* ${params.targetProduct.nome}`,
    `• *Valor de Vitrine:* ${formatBRL(params.targetProduct.precoPix)} no PIX`,
    '',
    '💰 *Volta Estimada a Pagar:*',
    `• *No PIX:* ~${formatBRL(params.differencePix)}`,
    `• *Ou Cartão:* em até 12x (conforme operadora)`,
    '',
    `📍 *Preferência:* ${methodText}`,
    '',
    '_*Nota:* Entendo que esta é uma pré-avaliação comercial e que o valor final é validado no teste de tela, carcaça e bateria na Loja D439 (SIA) ou com o motoboy express._',
    '',
    'Podem confirmar a disponibilidade do novo aparelho para eu levar o meu na Loja D439 ou receber o motoboy hoje? 🚀',
  ];

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}
