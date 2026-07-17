import { Clock3, WalletCards, X } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { ReserveInvestmentEntry, ReserveInvestmentType } from '../../types/finance';
import type { InvestmentOverview, ReserveInvestmentTypeSummary } from '../../types/reserveInvestment';
import { formatCurrency } from '../../utils/formatters';
import { ActionMenu } from '../ui/ActionMenu';
import { Chip } from '../ui/Chip';
import { TableSection } from './TableSection';

interface ReserveInvestmentTableProps {
  entries: ReserveInvestmentEntry[];
  availableTypes: ReserveInvestmentType[];
  summaries: ReserveInvestmentTypeSummary[];
  investmentOverview: InvestmentOverview;
  loading?: boolean;
  actionDisabled?: boolean;
  onAdd?: () => void;
  onEdit?: (entry: ReserveInvestmentEntry) => void;
  onDelete?: (entry: ReserveInvestmentEntry) => void;
}

export function ReserveInvestmentTable({
  entries,
  availableTypes,
  summaries,
  investmentOverview,
  loading = false,
  actionDisabled = false,
  onAdd,
  onEdit,
  onDelete,
}: ReserveInvestmentTableProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <TableSection
      title="Reservas & Inv."
      actionLabel="Adicionar movimentacao"
      onAction={onAdd}
      actionDisabled={actionDisabled || loading}
    >
      <div className="investment-overview" aria-label="Resumo mensal de investimentos">
        <div
          className="investment-total-card"
          title="Total investido somente na competência selecionada."
          aria-label={`Investido no mês. Total investido somente na competência selecionada. ${formatCurrency(investmentOverview.monthlyInvestedTotal)}`}
        >
          <span>Investido no mês</span>
          <strong>{formatCurrency(investmentOverview.monthlyInvestedTotal)}</strong>
        </div>
        <div
          className="investment-total-card"
          title="Total dos aportes realizados até este mês, sem considerar rendimentos ou variações de mercado."
          aria-label={`Total investido acumulado. Total dos aportes realizados até este mês, sem considerar rendimentos ou variações de mercado. ${formatCurrency(investmentOverview.cumulativeInvestedTotal)}`}
        >
          <span>Total investido acumulado</span>
          <strong>{formatCurrency(investmentOverview.cumulativeInvestedTotal)}</strong>
        </div>
        <button
          className="history-action"
          type="button"
          onClick={() => setHistoryOpen(true)}
          title="Ver histórico de investimentos"
          aria-label="Ver histórico de investimentos"
        >
          <Clock3 size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="reserve-summary-strip" aria-label="Investimentos por tipo no mes">
        {investmentOverview.monthlyInvestmentsByType.length > 0 ? (
          investmentOverview.monthlyInvestmentsByType.map((summary) => (
            <span key={summary.type} title={summary.description}>
              <Chip tone={summary.tone}>{summary.label}</Chip>
              <strong>{formatCurrency(summary.amount)}</strong>
            </span>
          ))
        ) : (
          <p>Nenhum investimento neste mes.</p>
        )}
      </div>

      <table className="reserve-table">
        <colgroup>
          <col className="col-type" />
          <col className="col-money" />
          <col className="col-date" />
          <col className="col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Data</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="table-empty-cell" colSpan={4}>
                Carregando aportes...
              </td>
            </tr>
          ) : null}
          {!loading && entries.length === 0 ? (
            <tr>
              <td className="table-empty-cell" colSpan={4}>
                <div className="empty-investments table-empty-investments">
                  <WalletCards size={28} aria-hidden="true" />
                  <p>Nenhum aporte nesta competencia.</p>
                  <div className="chip-cloud" aria-label="Tipos disponiveis">
                    {availableTypes.map((type) => (
                      <Chip key={type.name} tone={type.tone}>
                        {type.name}
                      </Chip>
                    ))}
                  </div>
                </div>
              </td>
            </tr>
          ) : null}
          {!loading &&
            entries.map((entry) => (
              <tr key={entry.id}>
                <td title={entry.name}>
                  <div className="reserve-type-cell">
                    <Chip tone={entry.typeValue ? summaries.find((summary) => summary.type === entry.typeValue)?.tone ?? 'goal' : 'goal'}>
                      {entry.type}
                    </Chip>
                    {entry.name ? <small className="row-note compact-note">{entry.name}</small> : null}
                  </div>
                </td>
                <td className="numeric-cell reserve-value-cell">{formatCurrency(entry.amount)}</td>
                <td className="date-cell">{entry.date}</td>
                <td>
                  <div className="reserve-row-actions">
                    <ActionMenu
                      label={`Abrir menu de acoes de ${entry.type}`}
                      title={`Acoes de ${entry.type}`}
                      disabled={actionDisabled}
                      closeKey={entry.id}
                      options={[
                        { label: 'Editar movimentacao', onSelect: () => onEdit?.(entry) },
                        { label: 'Excluir movimentacao', onSelect: () => onDelete?.(entry), danger: true },
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {historyOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Historico de investimentos">
          <div className="entry-modal investment-history-modal">
            <div className="entry-modal-header">
              <div>
                <span>Investimentos</span>
                <h2>Historico mensal</h2>
              </div>
              <button type="button" aria-label="Fechar historico" onClick={() => setHistoryOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="investment-history-note">
              Considera somente Renda fixa, Renda variavel, Investimento fisico, Criptomoedas e Fundo cambial.
            </p>
            <div className="investment-history-list">
              {[...investmentOverview.investmentHistory].reverse().map((item, index, items) => {
                const year = item.key.slice(0, 4);
                const previousYear = items[index - 1]?.key.slice(0, 4);
                return (
                  <Fragment key={item.key}>
                    {year !== previousYear ? <h3 className="investment-history-year">{year}</h3> : null}
                    <article className="investment-history-item">
                      <strong>{item.label}</strong>
                      <span>Investido no mes: {formatCurrency(item.monthlyAmount)}</span>
                      <span>Acumulado ate este mes: {formatCurrency(item.cumulativeAmount)}</span>
                    </article>
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </TableSection>
  );
}
