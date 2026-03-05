import { ComponentType } from 'react';
import { AutoRiskForm } from './auto-risk-form';
import { HealthRiskForm } from './health-risk-form';
import { LifeRiskForm } from './life-risk-form';
import { PropertyRiskForm } from './property-risk-form';
import { BusinessRiskForm } from './business-risk-form';
import { DentalRiskForm } from './dental-risk-form';
import { TravelRiskForm } from './travel-risk-form';

export {
  AutoRiskForm,
  HealthRiskForm,
  LifeRiskForm,
  PropertyRiskForm,
  BusinessRiskForm,
  DentalRiskForm,
  TravelRiskForm,
};

interface RiskFormProps {
  defaultValues?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const formMap: Record<string, ComponentType<RiskFormProps>> = {
  auto: AutoRiskForm,
  health: HealthRiskForm,
  life: LifeRiskForm,
  property: PropertyRiskForm,
  business: BusinessRiskForm,
  dental: DentalRiskForm,
  travel: TravelRiskForm,
};

/**
 * Retorna o componente de formulario de risco correspondente a categoria.
 * Retorna undefined se a categoria nao for encontrada.
 */
export function getRiskFormByCategory(
  category: string
): ComponentType<RiskFormProps> | undefined {
  return formMap[category];
}
