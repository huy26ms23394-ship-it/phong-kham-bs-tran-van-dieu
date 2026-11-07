/**
 * Clinical Drug Interaction & Safety Rules Engine (Local Zero-Latency 0ms)
 * Được đồng bộ hóa và nâng cấp toàn diện từ src/services/offlineClinicalEngine.ts
 */

export * from '../services/offlineClinicalEngine';
import {
  evaluateFiveTierSafety,
  runComprehensiveLocalSafetyCheck,
  FiveTierAlert,
  FiveTierSafetyReport,
  ClinicalTier,
} from '../services/offlineClinicalEngine';

export interface ClinicalRuleAlert {
  id: string;
  severity: 'contraindicated' | 'major' | 'moderate' | 'info';
  type: 'drug-drug' | 'drug-disease' | 'drug-vitals' | 'dosage' | 'drug-allergy';
  title: string;
  description: string;
  recommendation: string;
  involvedItems: string[];
  tier?: ClinicalTier;
  tierName?: string;
}

export { evaluateFiveTierSafety, runComprehensiveLocalSafetyCheck };
export type { FiveTierAlert, FiveTierSafetyReport, ClinicalTier };
