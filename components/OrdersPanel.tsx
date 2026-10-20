'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { OrderRecord, ORDER_STATUSES } from '../types/admin';
import { formatBRL } from '../data/defaults';
import { friendlyError, loadOrders, updateOrderStatus } from '../lib/data';
import { btnGhost, inputCls } from './ui';

export default function OrdersPanel({ notify }: { notify: (t: 'ok' | 'err', msg: string) => void }) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await loadOrders());
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (o: OrderRecord, status: string) => {
    try {
      await updateOrderStatus(o.id, status);
      setOrders((cur) => cur.map((x) => (x.id === o.id ? { ...x, status } : x)));
      notify('ok', 'Status atualizado.');
    } catch (e) {
      notify('err', friendlyError(e));
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Pedidos ({orders.length})</h2>
        <button onClick={load} className={btnGhost}>
          Atualizar
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-emerald-400" />
        </div>
      )}
      {error && (
        <p className="text-sm text-red-300 bg-red-950/40 border border-red-900/50 rounded-xl p-3">{error}</p>
      )}
      {!loading && !error && orders.length === 0 && (
        <p className="text-sm text-neutral-500 text-center py-10">Nenhum pedido recebido ainda.</p>
      )}

      <ul className="space-y-2">
        {orders.map((o) => {
          const expanded = open === o.id;
          return (
            <li key={o.id} className="rounded-xl border border-neutral-800 bg-neutral-950">
              <button
                onClick={() => setOpen(expanded ? null : o.id)}
                className="w-full flex items-center justify-between gap-3 p-3 text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {o.orderCode} · {o.customer?.nomeCompleto || 'Cliente'}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {o.createdAtIso ? new Date(o.createdAtIso).toLocaleString('pt-BR') : ''} ·{' '}
                    {ORDER_STATUSES.find((s) => s.id === o.status)?.label ?? o.status}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-emerald-400">{formatBRL(o.finalTotal)}</span>
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              {expanded && (
                <div className="border-t border-neutral-800 p-3 space-y-3 text-sm">
                  <div className="grid sm:grid-cols-2 gap-2 text-xs text-neutral-300">
                    <p>WhatsApp: {o.customer?.whatsapp}</p>
                    <p>Região: {o.region?.nome}</p>
                    <p className="sm:col-span-2">
                      Endereço: {o.customer?.enderecoCompleto}
                      {o.customer?.complemento ? `, ${o.customer.complemento}` : ''} — CEP {o.customer?.cep}
                    </p>
                    {o.customer?.observacoes && <p className="sm:col-span-2">Obs.: {o.customer.observacoes}</p>}
                    <p>
                      Pagamento: {o.customer?.metodoPagamento}
                      {o.customer?.metodoPagamento === 'credito' && o.customer?.parcelasCredito
                        ? ` (${o.customer.parcelasCredito}x)`
                        : ''}
                    </p>
                  </div>
                  <ul className="text-xs space-y-1">
                    {o.items?.map((it) => (
                      <li key={it.id} className="flex justify-between gap-2">
                        <span>
                          {it.quantity}× {it.nome}
                        </span>
                        <span>{formatBRL(it.precoUnitario * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-xs text-neutral-400 flex flex-wrap gap-x-4">
                    <span>Subtotal {formatBRL(o.subtotal)}</span>
                    {o.pixDiscount > 0 && <span>Desc. Pix −{formatBRL(o.pixDiscount)}</span>}
                    <span>Frete {formatBRL(o.shippingCost)}</span>
                  </div>
                  <select
                    value={o.status}
                    onChange={(e) => changeStatus(o, e.target.value)}
                    className={`${inputCls} sm:w-64`}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
