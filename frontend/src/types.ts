export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
}

export interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'caution' | 'danger';
}

export interface HealthReport {
  id: string;
  date: string;
  score: number;
  summary: string;
  metrics: HealthMetric[];
  lang?: 'ko' | 'en';
  actionPlan: {
    diet: string[];
    exercise: string[];
    lifestyle: string[];
    medicalAdvice?: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
