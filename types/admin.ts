export const ORDER_STATUSES = [
  { id: 'aguardando_confirmacao_whatsapp', label: 'Aguardando confirmação' },
  { id: 'confirmado', label: 'Confirmado' },
  { id: 'em_entrega', label: 'Em entrega' },
  { id: 'entregue', label: 'Entregue' },
  { id: 'cancelado', label: 'Cancelado' },
] as const;

export interface OrderRecord {
  id: string;
  orderCode: string;
  status: string;
  createdAtIso?: string;
  customer: {
    nomeCompleto?: string;
    whatsapp?: string;
    cep?: string;
    enderecoCompleto?: string;
    complemento?: string;
    observacoes?: string;
    metodoPagamento?: string;
    parcelasCredito?: number;
  };
  region?: { nome?: string };
  items: Array<{ id: string; nome: string; quantity: number; precoUnitario: number }>;
  subtotal: number;
  pixDiscount: number;
  shippingCost: number;
  finalTotal: number;
}
