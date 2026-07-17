import type { ReserveInvestmentType } from '../types/reserveInvestment';

export interface ReserveInvestmentTypeConfig {
  value: ReserveInvestmentType;
  label: string;
  tone: string;
  description: string;
}

export const reserveInvestmentTypeOrder: ReserveInvestmentType[] = [
  'main_goal',
  'emergency_reserve',
  'fixed_income',
  'variable_income',
  'physical_investment',
  'crypto',
  'currency_fund',
];

export const investmentTypeOrder: ReserveInvestmentType[] = [
  'fixed_income',
  'variable_income',
  'physical_investment',
  'crypto',
  'currency_fund',
];

export const reserveInvestmentTypeConfig: Record<ReserveInvestmentType, ReserveInvestmentTypeConfig> = {
  main_goal: {
    value: 'main_goal',
    label: 'Meta principal',
    tone: 'goal',
    description: 'Dinheiro guardado para alcancar seu objetivo principal.',
  },
  emergency_reserve: {
    value: 'emergency_reserve',
    label: 'Reserva de emergencia',
    tone: 'reserve',
    description: 'Dinheiro separado para imprevistos e emergencias.',
  },
  fixed_income: {
    value: 'fixed_income',
    label: 'Renda fixa',
    tone: 'fixed',
    description: 'Exemplos: Tesouro Direto, CDB, LCI e LCA.',
  },
  variable_income: {
    value: 'variable_income',
    label: 'Renda variavel',
    tone: 'variable',
    description: 'Exemplos: acoes, ETFs e fundos imobiliarios. O valor pode subir ou cair.',
  },
  physical_investment: {
    value: 'physical_investment',
    label: 'Investimento fisico',
    tone: 'physical',
    description: 'Exemplos: ouro fisico, imoveis, equipamentos ou outros bens usados como investimento.',
  },
  crypto: {
    value: 'crypto',
    label: 'Criptomoedas',
    tone: 'crypto',
    description: 'Ativos digitais, como Bitcoin e outras criptomoedas.',
  },
  currency_fund: {
    value: 'currency_fund',
    label: 'Fundo cambial',
    tone: 'currency',
    description: 'Fundo ligado a variacao de moedas estrangeiras, como dolar ou euro.',
  },
};

export const reserveInvestmentTypeOptions = reserveInvestmentTypeOrder.map(
  (type) => reserveInvestmentTypeConfig[type],
);

export const investmentTypeOptions = investmentTypeOrder.map(
  (type) => reserveInvestmentTypeConfig[type],
);

export const reserveInvestmentTypeLabels = Object.fromEntries(
  reserveInvestmentTypeOptions.map((type) => [type.value, type.label]),
) as Record<ReserveInvestmentType, string>;

export const reserveInvestmentTypeTones = Object.fromEntries(
  reserveInvestmentTypeOptions.map((type) => [type.value, type.tone]),
) as Record<ReserveInvestmentType, string>;

export const isReserveInvestmentType = (value: string): value is ReserveInvestmentType =>
  reserveInvestmentTypeOrder.includes(value as ReserveInvestmentType);

export const isInvestmentType = (value: ReserveInvestmentType) =>
  investmentTypeOrder.includes(value);
