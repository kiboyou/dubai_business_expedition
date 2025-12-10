import { LucideIcon } from 'lucide-react';

export type PageView = 'home' | 'agenda' | 'faq' | 'register' | 'admin' | 'legal' | 'privacy' | 'terms';

export interface Pack {
  variant: 'essentiel' | 'premium' | 'elite';
  title: string;
  price: string;
  priceValue: number;
  description: string;
  features: string[];
}

export interface FeatureItem {
  icon: string; 
  title: string;
  desc: string;
}

export interface WhyChooseUsItem {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  delay: string;
}

export interface Testimonial {
  name: string;
  role: string;
  image: string;
  quote: string;
  stats: {
    partnerships: number;
    roi: string;
    savedMonths: number;
  };
}

export interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  selectedPack: 'essentiel' | 'premium' | 'elite' | null;
  needsVisa: boolean;
  message: string;
}

export interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  selectedPack: 'essentiel' | 'premium' | 'elite' | null;
  needsVisa: boolean;
  message: string;
  date: string;
  status: string;
}

export interface AgendaDay {
  day: string;
  title: string;
  description: string;
  time: string;
  icon: LucideIcon;
  image?: string;
}