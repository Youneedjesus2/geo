export type FieldStatus = 'MATCH' | 'MISMATCH' | 'MISSING';
export type PlanType = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanType;
  businessName?: string;
  role?: string;
}

export interface ComparisonField {
  status: FieldStatus;
  value: string; // The "Correct" or consolidated value
  geminiValue?: string;
  gptValue?: string;
  label: string;
}

export interface ComparisonData {
  address: ComparisonField;
  phone: ComparisonField;
  hours: ComparisonField;
  description: ComparisonField;
}

export interface AuditReport {
  id?: string;
  date?: string;
  businessName: string;
  city: string;
  score: number;
  summary: string;
  fields: ComparisonData;
  schemaJson: string;
  missingInfoSuggestions: string[];
}

export interface ScoreBreakdown {
  score: number;
  label: string;
  color: string; // Tailwind class
}

// Helper to calculate score based on the prompt's logic
export const calculateScore = (fields: ComparisonData): number => {
  // Safety check - return 0 if fields is undefined or incomplete
  if (!fields || !fields.address || !fields.phone || !fields.hours || !fields.description) {
    return 0;
  }

  let score = 50; // Base points

  const processField = (field: ComparisonField, matchBonus: number) => {
    if (field.status === 'MATCH') {
      score += matchBonus;
    } else if (field.status === 'MISMATCH') {
      score -= 15;
    } else if (field.status === 'MISSING') {
      score -= 10;
    }
  };

  processField(fields.address, 30);
  processField(fields.phone, 25);
  processField(fields.hours, 25);
  processField(fields.description, 20);

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
};

export const getScoreCategory = (score: number): ScoreBreakdown => {
  // Updated colors for dark mode (lighter shades)
  if (score >= 90) return { score, label: 'Excellent', color: 'text-emerald-400' };
  if (score >= 70) return { score, label: 'Good', color: 'text-yellow-400' };
  if (score >= 50) return { score, label: 'Fair', color: 'text-orange-400' };
  return { score, label: 'Poor', color: 'text-rose-400' };
};
