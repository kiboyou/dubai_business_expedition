
import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Crown,
  Quote,
  Handshake,
  TrendingUp,
  Shield,
  ShieldCheck,
  Users,
  FileSignature,
  MessageSquare,
  Calendar,
  Phone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Zap,
  Menu,
  X,
  MapPin,
  Clock,
  Check,
  Plane,
  Building,
  Mail,
  ArrowUp,
  Lock,
  LayoutDashboard,
  Search,
  Download,
  Trash2,
  Database,
  Loader2,
  AlertTriangle,
  Save
} from 'lucide-react';
import { Pack, Testimonial, RegistrationFormData, PageView, AgendaDay, Registration } from './types';

// --- SQLite Database Implementation ---

// Type definition for window.initSqlJs loaded via CDN
declare global {
  interface Window {
    initSqlJs: (config: any) => Promise<any>;
  }
}

class SqliteManager {
  private db: any = null;
  private dbKey = 'dubai_expedition_sqlite_bin';
  private dbPath = '/database.sqlite'; // Le fichier physique dans le dossier public

  async init() {
    if (this.db) return;

    try {
      // Check if sql.js is loaded
      if (typeof window.initSqlJs !== 'function') {
        console.warn("sql.js not loaded yet");
        return;
      }

      const SQL = await window.initSqlJs({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
      });

      // 1. Priorité : Vérifier le LocalStorage (modifications récentes de l'utilisateur)
      const localData = localStorage.getItem(this.dbKey);
      
      if (localData) {
        console.log("Chargement depuis LocalStorage...");
        const binaryString = atob(localData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        this.db = new SQL.Database(bytes);
      } else {
        // 2. Secondaire : Essayer de charger le fichier physique dans /public/database.sqlite
        try {
          console.log("Tentative de chargement du fichier projet...");
          const response = await fetch(this.dbPath);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const u8 = new Uint8Array(buffer);
            this.db = new SQL.Database(u8);
            console.log("Base de données chargée depuis le fichier projet.");
            // On sauvegarde tout de suite en local pour la suite
            this.save();
          } else {
            throw new Error("Fichier non trouvé");
          }
        } catch (err) {
          console.log("Aucun fichier DB trouvé, création d'une nouvelle base.");
          // 3. Fallback : Créer une nouvelle DB vide
          this.db = new SQL.Database();
          this.initTables();
          this.save();
        }
      }
    } catch (e) {
      console.error("Failed to init SQLite", e);
    }
  }

  private initTables() {
    this.run(`
      CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        firstName TEXT,
        lastName TEXT,
        email TEXT,
        phone TEXT,
        company TEXT,
        role TEXT,
        selectedPack TEXT,
        needsVisa INTEGER,
        message TEXT,
        date TEXT,
        status TEXT
      );
    `);
  }

  private run(sql: string, params: any[] = []) {
    return this.db.run(sql, params);
  }

  private exec(sql: string) {
    return this.db.exec(sql);
  }

  private save() {
    if (!this.db) return;
    const data = this.db.export();
    // Convert Uint8Array to binary string to save in localStorage
    let binary = '';
    const len = data.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(data[i]);
    }
    localStorage.setItem(this.dbKey, btoa(binary));
  }

  // Permet à l'admin de télécharger le fichier .sqlite pour le mettre dans le projet
  downloadDbFile() {
    if (!this.db) return;
    const data = this.db.export();
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database.sqlite';
    a.click();
    URL.revokeObjectURL(url);
  }

  addRegistration(data: RegistrationFormData) {
    // S'assurer que la table existe (au cas où on charge un fichier vide)
    this.initTables();
    
    const id = crypto.randomUUID();
    const date = new Date().toISOString();
    const status = 'pending';
    
    this.run(`
      INSERT INTO registrations (id, firstName, lastName, email, phone, company, role, selectedPack, needsVisa, message, date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, data.firstName, data.lastName, data.email, data.phone, data.company, data.role, 
      data.selectedPack, data.needsVisa ? 1 : 0, data.message, date, status
    ]);
    
    this.save();
    return id;
  }

  getRegistrations(): Registration[] {
    if (!this.db) return [];
    try {
      // Vérification table existe
      try {
        this.exec("SELECT count(*) FROM registrations");
      } catch (e) {
        this.initTables();
      }

      const result = this.exec("SELECT * FROM registrations ORDER BY date DESC");
      
      if (result.length === 0) return [];
      
      const columns = result[0].columns;
      const values = result[0].values;
      
      return values.map((row: any[]) => {
        const obj: any = {};
        columns.forEach((col: string, i: number) => {
          obj[col] = row[i];
        });
        // Convert integer back to boolean for needsVisa
        obj.needsVisa = obj.needsVisa === 1;
        return obj as Registration;
      });
    } catch (e) {
      console.error("Error fetching registrations", e);
      return [];
    }
  }

  deleteRegistration(id: string) {
    this.run("DELETE FROM registrations WHERE id = ?", [id]);
    this.save();
  }

  updateStatus(id: string, status: string) {
    this.run("UPDATE registrations SET status = ? WHERE id = ?", [status, id]);
    this.save();
  }
  
  resetDatabase() {
     this.run("DELETE FROM registrations");
     this.save();
     window.location.reload();
  }
}

const dbManager = new SqliteManager();

// --- Translations & Data ---

type Language = 'fr' | 'en';

const content = {
  fr: {
    data: {
      packs: [
        {
          variant: 'essentiel',
          title: 'Découverte',
          price: '2 500€',
          priceValue: 2500,
          description: 'L’essentiel pour comprendre l’écosystème local.',
          features: [
            'Accès salon Gulfood',
            'Networking Event Standard',
            'Visite guidée Expo City',
            'Support logistique de base',
            'Hôtel 4* (4 nuits)'
          ]
        },
        {
          variant: 'premium',
          title: 'Business Class',
          price: '4 500€',
          priceValue: 4500,
          description: 'Pour les entrepreneurs prêts à signer des contrats.',
          features: [
            'Tout du pack Découverte',
            'Dîner de Gala Ambassade',
            '3 RDV B2B qualifiés',
            'Atelier "Doing Business in Dubai"',
            'Hôtel 5* (6 nuits)'
          ]
        },
        {
          variant: 'elite',
          title: 'Ambassadeur',
          price: '8 000€',
          priceValue: 8000,
          description: 'L’expérience diplomatique ultime pour dirigeants.',
          features: [
            'Tout du pack Premium',
            'Accès Lounge VIP',
            'Rencontre privée avec l’Ambassadeur',
            'Chauffeur privé 24/7',
            'Mise en relation Gouvernementale',
            'Suite Palace (7 nuits)'
          ]
        }
      ] as Pack[],
      testimonials: [
        {
          name: "Awa Koné",
          role: "CEO, Tech Africa",
          image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200",
          quote: "Cette expédition a complètement transformé ma vision du business à Dubai. L'accès aux réseaux institutionnels via l'Ambassade était inestimable. En 6 jours, j'ai signé plus de partenariats qu'en 6 mois.",
          stats: { partnerships: 7, roi: "400%", savedMonths: 18 }
        },
        {
          name: "Jean-Marc Diallo",
          role: "Directeur Export, AgriCorp",
          image: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=200",
          quote: "L'organisation était impeccable. Le badge 'Ambassade' ouvre des portes qui restent fermées aux touristes d'affaires classiques. Un investissement rentabilisé dès le 3ème jour.",
          stats: { partnerships: 4, roi: "250%", savedMonths: 12 }
        },
        {
          name: "Sophie Morel",
          role: "Fondatrice, Luxe & Mode",
          image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=200",
          quote: "Le niveau des interlocuteurs rencontrés lors du dîner de gala était exceptionnel. J'ai trouvé mon distributeur local grâce à cette mission diplomatique.",
          stats: { partnerships: 2, roi: "300%", savedMonths: 24 }
        }
      ] as Testimonial[],
      agenda: [
        { day: "Jour 1", title: "Arrivée & Installation", time: "Toute la journée", description: "Accueil VIP à l'aéroport, transfert en limousine vers l'hôtel. Cocktail de bienvenue sur le rooftop au coucher du soleil.", icon: Plane },
        { day: "Jour 2", title: "Immersion Écosystème", time: "09:00 - 18:00", description: "Visite du Dubai Multi Commodities Centre (DMCC) et présentation des opportunités fiscales. Déjeuner au Burj Khalifa.", icon: Building },
        { day: "Jour 3", title: "Business Matching", time: "10:00 - 16:00", description: "Session de rencontres B2B ciblées avec des investisseurs locaux et partenaires potentiels. Soirée libre.", icon: Handshake },
        { day: "Jour 4", title: "Forum Diplomatique", time: "19:00 - 23:00", description: "Grand Dîner de Gala à la résidence de l'Ambassadeur. Networking de haut niveau avec la diaspora influente.", icon: Crown },
        { day: "Jour 5", title: "Innovation Tour", time: "09:00 - 15:00", description: "Visite du Musée du Futur et des incubateurs technologiques. Atelier pratique sur l'implantation.", icon: Zap },
        { day: "Jour 6", title: "Clôture & Détente", time: "10:00 - 22:00", description: "Matinée libre pour shopping ou RDV privés. Safari désert VIP et dîner bédouin de clôture.", icon: Globe },
      ] as AgendaDay[],
      faqs: [
        { q: "Le billet d'avion est-il inclus ?", a: "Non, les vols ne sont pas inclus pour vous laisser le choix de la compagnie et des horaires. Cependant, nous avons des tarifs négociés avec Emirates." },
        { q: "Ai-je besoin d'un visa ?", a: "Oui, un visa est nécessaire. Notre équipe 'Conciergerie' s'occupe de toutes les démarches administratives pour vous dès votre inscription." },
        { q: "Puis-je venir avec un associé ?", a: "Absolument. Nous proposons un tarif 'Duo' préférentiel (-15% sur la 2ème personne) si vous partagez la même chambre." },
        { q: "Quels secteurs d'activité sont concernés ?", a: "L'expédition est multisectorielle, avec un focus particulier sur l'Agro-industrie, la Tech, l'Immobilier et le Luxe/Retail." },
      ]
    },
    nav: {
      home: "Accueil",
      agenda: "Programme",
      faq: "FAQ",
      register: "S'inscrire"
    },
    hero: {
      badge: "Programme Officiel Ambassade Côte d'Ivoire",
      title1: "BUSINESS",
      title2: "EXPEDITION",
      title3: "DUBAÏ 2024",
      subtitle: "Immersion exclusive sous patronage diplomatique pour l'élite entrepreneuriale.",
      cta1: "Réserver ma place",
      cta2: "Découvrir le programme",
      cardOverlay: "Rejoignez 50+ Entrepreneurs",
      certified: "Certifié",
      official: "100% Officiel"
    },
    partners: {
      badge: "Partenariat Institutionnel",
      title: "Soutien Officiel de l'",
      titleHighlight: "Ambassade",
      subtitle: "Ce programme bénéficie du soutien diplomatique officiel, garantissant un accès privilégié aux réseaux institutionnels.",
      embassyName: "Ambassade de Côte d'Ivoire",
      embassyLoc: "Émirats Arabes Unis",
      accreditation: "Accréditation Officielle",
      accreditationDesc: "Reconnaissance diplomatique pour vos affaires.",
      network: "Réseau Institutionnel",
      networkDesc: "Accès direct aux décideurs gouvernementaux.",
      statEntrepreneurs: "Entrepreneurs",
      statInvestors: "Investisseurs",
      statPartners: "Partenaires",
      statDays: "Jours"
    },
    packs: {
      badge: "Programmes Exclusifs",
      title: "Choisissez Votre",
      titleHighlight: "Expérience",
      subtitle: "Trois niveaux d'immersion conçus pour répondre à vos ambitions business à Dubai.",
      perPers: "/pers",
      select: "Sélectionner",
      bestSeller: "BEST SELLER"
    },
    testimonials: {
      badge: "Témoignages",
      title: "Ils ont transformé leur business",
      subtitle: "Découvrez les retours d'expérience de nos participants précédents.",
      roi: "ROI",
      partnerships: "Partenariats"
    },
    cta: {
      title: "Prêt à conquérir le marché de Dubaï ?",
      subtitle: "Les places sont strictement limitées à 30 participants pour garantir la qualité du networking.",
      btnRegister: "Réserver maintenant",
      btnFaq: "Questions fréquentes",
      spotsLabel: "Places Uniquement"
    },
    agenda: {
      badge: "Planning Détaillé",
      title: "Une Semaine d'Immersion",
      subtitle: "Chaque journée est optimisée pour maximiser vos opportunités d'affaires.",
      officialProgram: "Programme Officiel"
    },
    faq: {
      badge: "Support",
      title: "Questions Fréquentes",
      subtitle: "Tout ce que vous devez savoir avant de réserver votre place.",
      moreQuestions: "Vous avez d'autres questions ?",
      concierge: "Notre équipe de conciergerie est disponible 24/7 sur WhatsApp.",
      chatBtn: "Discuter avec un conseiller"
    },
    register: {
      badge: "Candidature",
      title: "Rejoignez l'Expédition",
      subtitle: "Complétez le formulaire ci-dessous. Les places sont validées après étude du dossier.",
      personalInfo: "Informations Personnelles",
      programChoice: "Choix du Programme",
      ready: "Dossier prêt à l'envoi",
      readyDesc: "En cliquant sur 'Finaliser', votre dossier sera transmis à notre comité de sélection. Vous recevrez une réponse sous 24h ouvrées.",
      labels: {
        firstName: "Prénom",
        lastName: "Nom",
        email: "Email Professionnel",
        phone: "Téléphone (WhatsApp)",
        company: "Entreprise",
        role: "Fonction",
        visa: "Je souhaite que l'équipe gère ma demande de visa (+150€)",
        message: "Message ou besoins spécifiques (Optionnel)",
        candidate: "Candidat",
        pack: "Pack choisi",
        back: "Retour",
        next: "Continuer",
        finish: "Finaliser l'inscription"
      },
      successModal: {
        title: "Candidature Envoyée !",
        message: "Félicitations, votre dossier a bien été enregistré. Notre comité de sélection reviendra vers vous sous 24h avec les instructions de paiement.",
        btnHome: "Retour à l'accueil"
      },
      error: "Erreur lors de la sauvegarde."
    },
    admin: {
      loading: "Chargement de la base de données...",
      login: {
        title: "Accès Administrateur",
        subtitle: "Veuillez vous identifier pour accéder au tableau de bord.",
        label: "Mot de passe",
        btn: "Connexion",
        error: "Mot de passe incorrect"
      },
      dashboard: {
        title: "Tableau de Bord",
        subtitle: "Gestion des inscriptions",
        registrations: "Inscriptions",
        revenue: "CA Potentiel",
        search: "Rechercher par nom, email, entreprise...",
        reset: "Réinitialiser",
        export: "Export CSV",
        downloadDb: "Télécharger DB",
        noData: "Aucune inscription trouvée."
      },
      table: {
        candidate: "Candidat",
        company: "Entreprise",
        pack: "Pack",
        date: "Date",
        visa: "Visa",
        status: "Status",
        actions: "Actions",
        statusPending: "En attente",
        statusApproved: "Validé",
        statusRejected: "Refusé",
        visaRequired: "Requis"
      },
      deleteModal: {
        title: "Confirmer la suppression",
        message: "Êtes-vous sûr de vouloir supprimer définitivement cette inscription ? Cette action est irréversible.",
        cancel: "Annuler",
        confirm: "Supprimer"
      },
      resetModal: {
         title: "Réinitialisation Complète",
         message: "Attention : Vous allez effacer TOUTES les données de la base. Voulez-vous continuer ?",
         confirm: "Tout effacer"
      }
    },
    footer: {
      desc: "Le programme d'immersion de référence pour les entrepreneurs francophones, soutenu par l'Ambassade de Côte d'Ivoire.",
      links: "Liens Rapides",
      contact: "Contact",
      rights: "Tous droits réservés.",
      legal: "Mentions Légales",
      privacy: "Confidentialité",
      terms: "CGV",
      admin: "Administration"
    },
    legal: {
      legalNotice: "Mentions Légales",
      privacyPolicy: "Politique de Confidentialité",
      termsConditions: "Conditions Générales de Vente",
      lastUpdated: "Dernière mise à jour : 01/01/2024"
    },
    legalContent: {
      legal: [
         { title: "Éditeur du Site", text: "Dubai Business Expedition, société immatriculée au registre du commerce de Dubai (DED) sous le numéro 123456. Siège social : Dubai Silicon Oasis, Dubai, UAE." },
         { title: "Directeur de la publication", text: "Jean Dupont, Directeur Général." },
         { title: "Hébergement", text: "Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133 Walnut, CA 91789, USA." },
         { title: "Propriété Intellectuelle", text: "L'ensemble de ce site relève de la législation internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés." }
      ],
      privacy: [
         { title: "Collecte des données", text: "Nous collectons les informations suivantes lors de l'inscription : nom, prénom, email, téléphone, entreprise, fonction. Ces données sont nécessaires au traitement de votre candidature." },
         { title: "Utilisation des données", text: "Vos données sont utilisées exclusivement pour l'organisation de l'expédition et la communication relative à l'événement. Elles ne sont jamais vendues à des tiers." },
         { title: "Vos droits", text: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Contactez-nous à privacy@dubai-expedition.com." }
      ],
      terms: [
         { title: "Objet", text: "Les présentes CGV régissent la vente des packs de participation à la Dubai Business Expedition." },
         { title: "Prix et Paiement", text: "Les prix sont indiqués en Euros. Le paiement intégral est exigible à la validation de la candidature." },
         { title: "Annulation", text: "Toute annulation effectuée moins de 30 jours avant l'événement ne donnera lieu à aucun remboursement, sauf cas de force majeure avéré." },
         { title: "Responsabilité", text: "L'organisateur ne saurait être tenu responsable des dommages indirects subis par le participant." }
      ]
    }
  },
  en: {
    data: {
      packs: [
        {
          variant: 'essentiel',
          title: 'Discovery',
          price: '2 500€',
          priceValue: 2500,
          description: 'Essentials to understand the local ecosystem.',
          features: [
            'Gulfood Exhibition Access',
            'Standard Networking Event',
            'Expo City Guided Tour',
            'Basic Logistics Support',
            '4* Hotel (4 nights)'
          ]
        },
        {
          variant: 'premium',
          title: 'Business Class',
          price: '4 500€',
          priceValue: 4500,
          description: 'For entrepreneurs ready to sign contracts.',
          features: [
            'All Discovery Pack features',
            'Embassy Gala Dinner',
            '3 Qualified B2B Meetings',
            '"Doing Business in Dubai" Workshop',
            '5* Hotel (6 nights)'
          ]
        },
        {
          variant: 'elite',
          title: 'Ambassador',
          price: '8 000€',
          priceValue: 8000,
          description: 'The ultimate diplomatic experience for executives.',
          features: [
            'All Premium Pack features',
            'VIP Lounge Access',
            'Private Meeting with the Ambassador',
            '24/7 Private Chauffeur',
            'Government Relations Intro',
            'Palace Suite (7 nights)'
          ]
        }
      ] as Pack[],
      testimonials: [
        {
          name: "Awa Koné",
          role: "CEO, Tech Africa",
          image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200",
          quote: "This expedition completely transformed my vision of business in Dubai. Access to institutional networks via the Embassy was invaluable. In 6 days, I signed more partnerships than in 6 months.",
          stats: { partnerships: 7, roi: "400%", savedMonths: 18 }
        },
        {
          name: "Jean-Marc Diallo",
          role: "Export Director, AgriCorp",
          image: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=200",
          quote: "The organization was impeccable. The 'Embassy' badge opens doors that remain closed to standard business tourists. An investment made profitable by the 3rd day.",
          stats: { partnerships: 4, roi: "250%", savedMonths: 12 }
        },
        {
          name: "Sophie Morel",
          role: "Founder, Luxe & Mode",
          image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=200",
          quote: "The level of interlocutors met during the gala dinner was exceptional. I found my local distributor thanks to this diplomatic mission.",
          stats: { partnerships: 2, roi: "300%", savedMonths: 24 }
        }
      ] as Testimonial[],
      agenda: [
        { day: "Day 1", title: "Arrival & Check-in", time: "All Day", description: "VIP Welcome at the airport, limousine transfer to the hotel. Welcome cocktail on the rooftop at sunset.", icon: Plane },
        { day: "Day 2", title: "Ecosystem Immersion", time: "09:00 - 18:00", description: "Visit to Dubai Multi Commodities Centre (DMCC) and presentation of tax opportunities. Lunch at Burj Khalifa.", icon: Building },
        { day: "Day 3", title: "Business Matching", time: "10:00 - 16:00", description: "Targeted B2B meeting session with local investors and potential partners. Free evening.", icon: Handshake },
        { day: "Day 4", title: "Diplomatic Forum", time: "19:00 - 23:00", description: "Grand Gala Dinner at the Ambassador's residence. High-level networking with the influential diaspora.", icon: Crown },
        { day: "Day 5", title: "Innovation Tour", time: "09:00 - 15:00", description: "Visit to the Museum of the Future and tech incubators. Practical workshop on business setup.", icon: Zap },
        { day: "Day 6", title: "Closing & Leisure", time: "10:00 - 22:00", description: "Free morning for shopping or private meetings. VIP Desert Safari and closing Bedouin dinner.", icon: Globe },
      ] as AgendaDay[],
      faqs: [
        { q: "Is the flight ticket included?", a: "No, flights are not included to let you choose your airline and schedule. However, we have negotiated rates with Emirates." },
        { q: "Do I need a visa?", a: "Yes, a visa is required. Our 'Concierge' team handles all administrative procedures for you upon registration." },
        { q: "Can I come with a partner?", a: "Absolutely. We offer a preferential 'Duo' rate (-15% on the 2nd person) if you share the same room." },
        { q: "Which business sectors are concerned?", a: "The expedition is multi-sectoral, with a special focus on Agro-industry, Tech, Real Estate, and Luxury/Retail." },
      ]
    },
    nav: {
      home: "Home",
      agenda: "Agenda",
      faq: "FAQ",
      register: "Register"
    },
    hero: {
      badge: "Official Program Ivory Coast Embassy",
      title1: "BUSINESS",
      title2: "EXPEDITION",
      title3: "DUBAI 2024",
      subtitle: "Exclusive immersion under diplomatic patronage for the entrepreneurial elite.",
      cta1: "Book my spot",
      cta2: "Discover the program",
      cardOverlay: "Join 50+ Entrepreneurs",
      certified: "Certified",
      official: "100% Official"
    },
    partners: {
      badge: "Institutional Partnership",
      title: "Official Support from the",
      titleHighlight: "Embassy",
      subtitle: "This program benefits from official diplomatic support, guaranteeing privileged access to institutional networks.",
      embassyName: "Embassy of Ivory Coast",
      embassyLoc: "United Arab Emirates",
      accreditation: "Official Accreditation",
      accreditationDesc: "Diplomatic recognition for your business.",
      network: "Institutional Network",
      networkDesc: "Direct access to government decision-makers.",
      statEntrepreneurs: "Entrepreneurs",
      statInvestors: "Investors",
      statPartners: "Partners",
      statDays: "Days"
    },
    packs: {
      badge: "Exclusive Programs",
      title: "Choose Your",
      titleHighlight: "Experience",
      subtitle: "Three levels of immersion designed to meet your business ambitions in Dubai.",
      perPers: "/pers",
      select: "Select",
      bestSeller: "BEST SELLER"
    },
    testimonials: {
      badge: "Testimonials",
      title: "They transformed their business",
      subtitle: "Discover feedback from our previous participants.",
      roi: "ROI",
      partnerships: "Partnerships"
    },
    cta: {
      title: "Ready to conquer the Dubai market?",
      subtitle: "Spots are strictly limited to 30 participants to ensure networking quality.",
      btnRegister: "Book now",
      btnFaq: "Frequent questions",
      spotsLabel: "Spots Only"
    },
    agenda: {
      badge: "Detailed Schedule",
      title: "A Week of Immersion",
      subtitle: "Each day is optimized to maximize your business opportunities.",
      officialProgram: "Official Program"
    },
    faq: {
      badge: "Support",
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know before booking your spot.",
      moreQuestions: "Have more questions?",
      concierge: "Our concierge team is available 24/7 on WhatsApp.",
      chatBtn: "Chat with an advisor"
    },
    register: {
      badge: "Application",
      title: "Join the Expedition",
      subtitle: "Complete the form below. Spots are validated after file review.",
      personalInfo: "Personal Information",
      programChoice: "Program Choice",
      ready: "File ready for submission",
      readyDesc: "By clicking 'Finalize', your file will be sent to our selection committee. You will receive a response within 24 business hours.",
      labels: {
        firstName: "First Name",
        lastName: "Last Name",
        email: "Professional Email",
        phone: "Phone (WhatsApp)",
        company: "Company",
        role: "Job Title",
        visa: "I want the team to handle my visa request (+150€)",
        message: "Message or specific needs (Optional)",
        candidate: "Candidate",
        pack: "Selected Pack",
        back: "Back",
        next: "Continue",
        finish: "Finalize Registration"
      },
      successModal: {
        title: "Application Sent!",
        message: "Congratulations, your file has been recorded. Our selection committee will get back to you within 24h with payment instructions.",
        btnHome: "Back to Home"
      },
      error: "Error saving data."
    },
    admin: {
      loading: "Loading database...",
      login: {
        title: "Administrator Access",
        subtitle: "Please log in to access the dashboard.",
        label: "Password",
        btn: "Login",
        error: "Incorrect password"
      },
      dashboard: {
        title: "Dashboard",
        subtitle: "Registration Management",
        registrations: "Registrations",
        revenue: "Potential Revenue",
        search: "Search by name, email, company...",
        reset: "Reset DB",
        export: "Export CSV",
        downloadDb: "Download DB File",
        noData: "No registrations found."
      },
      table: {
        candidate: "Candidate",
        company: "Company",
        pack: "Pack",
        date: "Date",
        visa: "Visa",
        status: "Status",
        actions: "Actions",
        statusPending: "Pending",
        statusApproved: "Approved",
        statusRejected: "Rejected",
        visaRequired: "Required"
      },
      deleteModal: {
        title: "Confirm Deletion",
        message: "Are you sure you want to permanently delete this registration? This action cannot be undone.",
        cancel: "Cancel",
        confirm: "Delete"
      },
      resetModal: {
         title: "Full Reset",
         message: "Warning: You are about to wipe ALL data from the database. Do you want to continue?",
         confirm: "Wipe Everything"
      }
    },
    footer: {
      desc: "The reference immersion program for francophone entrepreneurs, supported by the Ivory Coast Embassy.",
      links: "Quick Links",
      contact: "Contact",
      rights: "All rights reserved.",
      legal: "Legal Notice",
      privacy: "Privacy",
      terms: "Terms & Conditions",
      admin: "Administration"
    },
    legal: {
      legalNotice: "Legal Notice",
      privacyPolicy: "Privacy Policy",
      termsConditions: "Terms & Conditions",
      lastUpdated: "Last updated: 01/01/2024"
    },
    legalContent: {
      legal: [
         { title: "Site Publisher", text: "Dubai Business Expedition, registered with Dubai Economy (DED) under license 123456. HQ: Dubai Silicon Oasis, Dubai, UAE." },
         { title: "Publication Director", text: "Jean Dupont, CEO." },
         { title: "Hosting", text: "Site hosted by Vercel Inc., 340 S Lemon Ave #4133 Walnut, CA 91789, USA." },
         { title: "Intellectual Property", text: "This entire site is subject to international copyright and intellectual property legislation. All reproduction rights reserved." }
      ],
      privacy: [
         { title: "Data Collection", text: "We collect the following information during registration: name, email, phone, company, job title. This data is necessary to process your application." },
         { title: "Data Usage", text: "Your data is used exclusively for organizing the expedition and event-related communication. It is never sold to third parties." },
         { title: "Your Rights", text: "In accordance with GDPR, you have the right to access, rectify, and delete your data. Contact us at privacy@dubai-expedition.com." }
      ],
      terms: [
         { title: "Object", text: "These Terms govern the sale of participation packs for the Dubai Business Expedition." },
         { title: "Price and Payment", text: "Prices are in Euros. Full payment is due upon application validation." },
         { title: "Cancellation", text: "Any cancellation made less than 30 days before the event will not be refunded, except in cases of proven force majeure." },
         { title: "Liability", text: "The organizer cannot be held responsible for indirect damages suffered by the participant." }
      ]
    }
  }
};

// --- Shared UI Components ---

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' | 'gold' | 'white' | 'danger' | 'secondary' }> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  ...props 
}) => {
  const baseStyles = "relative overflow-hidden inline-flex items-center justify-center transition-all duration-200 active:scale-95 font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed rounded-full px-8 py-3";
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg hover:-translate-y-0.5",
    gold: "bg-gradient-to-r from-gold-dark to-gold-accent text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5",
    outline: "border-2 border-slate-200 hover:border-primary-600 text-slate-700 hover:text-primary-600 bg-transparent",
    ghost: "bg-transparent text-slate-600 hover:text-primary-600 hover:bg-primary-50",
    white: "bg-white text-primary-700 hover:bg-primary-50 shadow-md hover:shadow-xl hover:-translate-y-0.5 border border-transparent",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};

const SectionHeading: React.FC<{ 
  badge: string; 
  title: React.ReactNode; 
  subtitle?: string;
  align?: 'left' | 'center';
  light?: boolean; 
}> = ({ badge, title, subtitle, align = 'center' }) => (
  <div className={`mb-16 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border rounded-full bg-primary-50 border-primary-100 text-primary-700">
      <span className="text-xs font-bold tracking-widest uppercase">{badge}</span>
    </div>
    <h2 className="mb-6 text-4xl font-bold md:text-5xl text-slate-900">
      {title}
    </h2>
    {subtitle && (
      <p className="max-w-2xl mx-auto text-lg leading-relaxed text-slate-600">
        {subtitle}
      </p>
    )}
  </div>
);

const InputGroup: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  type?: 'success' | 'danger';
}> = ({ isOpen, onClose, title, message, confirmText, cancelText, onConfirm, type = 'success' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl animate-fade-in-up">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
          type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {type === 'success' ? <Check className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
        </div>
        
        <h3 className="mb-4 text-2xl font-bold text-center text-slate-900">{title}</h3>
        <p className="mb-8 leading-relaxed text-center text-slate-600">
          {message}
        </p>
        
        <div className="flex justify-center gap-4">
          {cancelText && (
            <Button variant="secondary" onClick={onClose} className="w-full">
              {cancelText}
            </Button>
          )}
          {confirmText && onConfirm && (
            <Button 
              variant={type === 'success' ? 'primary' : 'danger'} 
              onClick={onConfirm} 
              className="w-full"
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Page Components ---

const AdminView: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = content[lang];
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });
  const [resetModal, setResetModal] = useState(false);

  useEffect(() => {
    // Attempt to init DB if not ready
    dbManager.init().then(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  const refreshData = () => {
    setRegistrations(dbManager.getRegistrations());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert(t.admin.login.error);
    }
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      dbManager.deleteRegistration(deleteModal.id);
      refreshData();
      setDeleteModal({ isOpen: false, id: null });
    }
  };

  const confirmReset = () => {
    dbManager.resetDatabase();
    setResetModal(false);
  };

  const updateStatus = (id: string, status: string) => {
    dbManager.updateStatus(id, status);
    refreshData();
  };

  const downloadDatabase = () => {
    dbManager.downloadDbFile();
  };
  
  const filteredRegistrations = registrations.filter(r => 
    (r.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (r.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (r.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const totalRevenue = filteredRegistrations.reduce((acc, curr) => {
    const pack = t.data.packs.find(p => p.variant === curr.selectedPack);
    return acc + (pack ? pack.priceValue : 0);
  }, 0);

  if (loading) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
           <div className="text-center">
              <Loader2 className="w-10 h-10 mx-auto mb-4 text-primary-600 animate-spin" />
              <p className="text-slate-500">{t.admin.loading}</p>
           </div>
        </div>
     )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-slate-900">
        <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t.admin.login.title}</h2>
            <p className="text-slate-500">{t.admin.login.subtitle}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <InputGroup label={t.admin.login.label}>
              <input 
                type="password"
                className="w-full px-4 py-3 border rounded-lg border-slate-300 focus:ring-2 focus:ring-primary-600 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </InputGroup>
            <Button className="w-full" type="submit">{t.admin.login.btn}</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50">
      <div className="container px-4 mx-auto">
        {/* Modals */}
        <Modal 
          isOpen={deleteModal.isOpen} 
          onClose={() => setDeleteModal({ isOpen: false, id: null })}
          title={t.admin.deleteModal.title}
          message={t.admin.deleteModal.message}
          confirmText={t.admin.deleteModal.confirm}
          cancelText={t.admin.deleteModal.cancel}
          onConfirm={confirmDelete}
          type="danger"
        />

        <Modal 
          isOpen={resetModal} 
          onClose={() => setResetModal(false)}
          title={t.admin.resetModal.title}
          message={t.admin.resetModal.message}
          confirmText={t.admin.resetModal.confirm}
          cancelText={t.admin.deleteModal.cancel}
          onConfirm={confirmReset}
          type="danger"
        />

        <div className="flex flex-col items-start justify-between gap-4 mb-8 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900">
              <LayoutDashboard className="w-8 h-8 text-primary-600" />
              {t.admin.dashboard.title}
            </h1>
            <p className="flex items-center gap-2 text-slate-500">
               <Database className="w-3 h-3" />
               {t.admin.dashboard.subtitle}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="px-6 py-3 text-center bg-white border shadow-sm rounded-xl border-slate-200">
              <div className="text-xs tracking-wide uppercase text-slate-500">{t.admin.dashboard.registrations}</div>
              <div className="text-xl font-bold text-slate-900">{registrations.length}</div>
            </div>
            <div className="px-6 py-3 text-center bg-white border shadow-sm rounded-xl border-slate-200">
              <div className="text-xs tracking-wide uppercase text-slate-500">{t.admin.dashboard.revenue}</div>
              <div className="text-xl font-bold text-green-600">{totalRevenue.toLocaleString()} €</div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200">
          <div className="flex flex-col items-center justify-between gap-4 p-6 border-b border-slate-200 md:flex-row">
            <div className="relative w-full md:w-96">
              <Search className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder={t.admin.dashboard.search}
                className="w-full py-2 pl-10 pr-4 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
               <Button variant="outline" onClick={downloadDatabase} className="h-10 gap-2 px-4 py-2 text-sm text-primary-700 border-primary-200 bg-primary-50">
                  <Save className="w-4 h-4" />
                  {t.admin.dashboard.downloadDb}
               </Button>
               <Button variant="danger" onClick={() => setResetModal(true)} className="h-10 gap-2 px-4 py-2 text-sm">
                  <Trash2 className="w-4 h-4" />
                  {t.admin.dashboard.reset}
               </Button>
               <Button variant="outline" className="h-10 gap-2 px-4 py-2 text-sm">
                  <Download className="w-4 h-4" />
                  {t.admin.dashboard.export}
               </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left uppercase text-slate-500">{t.admin.table.candidate}</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left uppercase text-slate-500">{t.admin.table.company}</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left uppercase text-slate-500">{t.admin.table.pack}</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left uppercase text-slate-500">{t.admin.table.date}</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left uppercase text-slate-500">{t.admin.table.visa}</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left uppercase text-slate-500">{t.admin.table.status}</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right uppercase text-slate-500">{t.admin.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{reg.firstName} {reg.lastName}</div>
                      <div className="text-sm text-slate-500">{reg.email}</div>
                      <div className="text-xs text-slate-400">{reg.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{reg.company}</div>
                      <div className="text-xs text-slate-500">{reg.role}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${reg.selectedPack === 'elite' ? 'bg-purple-100 text-purple-800' : 
                          reg.selectedPack === 'premium' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                        {reg.selectedPack || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(reg.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {reg.needsVisa ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">{t.admin.table.visaRequired}</span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <select 
                        value={reg.status}
                        onChange={(e) => updateStatus(reg.id, e.target.value)}
                        className={`text-sm rounded border-0 py-1 pl-2 pr-8 font-medium ring-1 ring-inset focus:ring-2 focus:ring-primary-600 cursor-pointer
                          ${reg.status === 'approved' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                            reg.status === 'rejected' ? 'bg-red-50 text-red-700 ring-red-600/20' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'}`}
                       >
                         <option value="pending">{t.admin.table.statusPending}</option>
                         <option value="approved">{t.admin.table.statusApproved}</option>
                         <option value="rejected">{t.admin.table.statusRejected}</option>
                       </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setDeleteModal({ isOpen: true, id: reg.id })}
                        className="transition text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRegistrations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      {t.admin.dashboard.noData}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const LegalPage: React.FC<{ title: string, sections: { title: string, text: string }[], date: string }> = ({ title, sections, date }) => {
  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50">
      <div className="container max-w-4xl px-4 mx-auto">
        <SectionHeading 
          badge="Juridique"
          title={title}
          align="left"
        />
        
        <div className="p-8 bg-white border shadow-lg md:p-12 rounded-3xl border-slate-200">
           <p className="mb-8 text-sm text-slate-400">{date}</p>
           
           <div className="space-y-8">
              {sections.map((section, index) => (
                 <div key={index}>
                    <h3 className="mb-3 text-xl font-bold text-slate-900">{index + 1}. {section.title}</h3>
                    <p className="leading-relaxed text-justify text-slate-600">
                       {section.text}
                    </p>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

const HomeView: React.FC<{ onNavigate: (page: PageView) => void, lang: Language }> = ({ onNavigate, lang }) => {
  const t = content[lang];
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-white lg:pt-48 lg:pb-32">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center gap-16 lg:flex-row">
            
            {/* Left Content */}
            <div className="z-20 w-full lg:w-1/2">
              <div className="inline-flex items-center gap-3 px-4 py-2 mb-8 bg-white border rounded-full shadow-sm border-slate-200 animate-fade-in-up">
                <div className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-gradient-to-r from-primary-600 to-gold-accent">
                  <Crown className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800">{t.hero.badge}</span>
              </div>
              
              <h1 className="mb-6 text-5xl md:text-7xl font-bold leading-[1.1] text-slate-900 animate-fade-in-up delay-100">
                <span className="block">{t.hero.title1}</span>
                <span className="block text-primary-600">
                  {t.hero.title2}
                </span>
                <span className="block">{t.hero.title3}</span>
              </h1>
              
              <p className="max-w-xl mb-10 text-xl font-light leading-relaxed delay-200 text-slate-600 animate-fade-in-up">
                {t.hero.subtitle}
              </p>
              
              <div className="flex flex-col gap-4 delay-300 sm:flex-row animate-fade-in-up">
                <Button onClick={() => onNavigate('register')} variant="gold" className="px-10 py-4 text-lg">
                  {t.hero.cta1}
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button onClick={() => onNavigate('agenda')} variant="outline" className="px-10 py-4 text-lg">
                  {t.hero.cta2}
                </Button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative z-10 w-full lg:w-1/2 animate-float">
               {/* Decorative blobs */}
               <div className="absolute w-64 h-64 rounded-full -top-10 -right-10 bg-primary-100 blur-3xl opacity-60"></div>
               <div className="absolute w-64 h-64 rounded-full -bottom-10 -left-10 bg-gold-light/30 blur-3xl opacity-60"></div>
               
               <div className="relative overflow-hidden transition duration-700 transform border-4 border-white shadow-2xl rounded-2xl rotate-2 hover:rotate-0">
                  <img 
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
                    alt="Dubai Business District" 
                    className="object-cover w-full h-auto"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/70 to-transparent">
                     <p className="font-medium text-white">{t.hero.cardOverlay}</p>
                  </div>
               </div>
               
               {/* Floating Card */}
               <div className="absolute items-center hidden gap-4 p-4 bg-white border shadow-xl -bottom-8 -left-8 rounded-xl border-slate-100 md:flex animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">{t.hero.certified}</div>
                    <div className="font-bold text-slate-900">{t.hero.official}</div>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* Partenariat Section */}
      <section className="relative py-24 overflow-hidden bg-slate-50">
        <div className="container relative z-10 px-4 mx-auto">
          <SectionHeading 
            badge={t.partners.badge}
            title={<span>{t.partners.title} <span className="text-primary-600">{t.partners.titleHighlight}</span></span>}
            subtitle={t.partners.subtitle}
          />
          
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative">
              <div className="relative p-8 bg-white border shadow-xl border-slate-200 rounded-3xl">
                <div className="flex items-center gap-6 mb-8">
                  <div className="flex items-center justify-center w-20 h-20 text-white shadow-lg bg-gradient-to-br from-primary-600 to-gold-accent rounded-2xl">
                    <Shield className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{t.partners.embassyName}</h3>
                    <p className="font-medium text-gold-dark">{t.partners.embassyLoc}</p>
                  </div>
                </div>
                <div className="space-y-4">
                   <div className="flex items-start gap-4 p-4 border rounded-xl bg-slate-50 border-slate-100">
                      <ShieldCheck className="flex-shrink-0 w-6 h-6 text-primary-600" />
                      <div>
                        <h4 className="mb-1 font-bold text-slate-900">{t.partners.accreditation}</h4>
                        <p className="text-sm text-slate-600">{t.partners.accreditationDesc}</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-4 p-4 border rounded-xl bg-slate-50 border-slate-100">
                      <Users className="flex-shrink-0 w-6 h-6 text-primary-600" />
                      <div>
                        <h4 className="mb-1 font-bold text-slate-900">{t.partners.network}</h4>
                        <p className="text-sm text-slate-600">{t.partners.networkDesc}</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: t.partners.statEntrepreneurs, value: "50+", icon: Users },
                { label: t.partners.statInvestors, value: "20+", icon: TrendingUp },
                { label: t.partners.statPartners, value: "15+", icon: Handshake },
                { label: t.partners.statDays, value: "7", icon: Calendar },
              ].map((stat, i) => (
                <div key={i} className="p-6 text-center transition duration-300 bg-white border border-slate-100 rounded-2xl group hover:shadow-lg">
                  <stat.icon className="w-8 h-8 mx-auto mb-4 transition duration-300 text-primary-600 group-hover:scale-110" />
                  <div className="mb-1 text-3xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Packs Section */}
      <section id="packs" className="relative py-32 overflow-hidden bg-white">
        <div className="container relative px-4 mx-auto">
          <SectionHeading 
            badge={t.packs.badge}
            title={<span>{t.packs.title} <span className="text-primary-600">{t.packs.titleHighlight}</span></span>}
            subtitle={t.packs.subtitle}
          />
          
          <div className="grid gap-8 mx-auto lg:grid-cols-3 max-w-7xl">
            {t.data.packs.map((pack, index) => (
              <div key={index} className="relative group perspective-1000">
                <div className={`relative h-full flex flex-col rounded-2xl border p-8 transition-transform duration-300 group-hover:-translate-y-2 ${
                  pack.variant === 'elite' 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xl' 
                    : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-xl'
                }`}>
                  {pack.variant === 'elite' && (
                    <div className="absolute flex items-center gap-2 px-4 py-1 text-sm font-bold text-white -translate-x-1/2 rounded-full shadow-lg -top-4 left-1/2 bg-gradient-to-r from-gold-dark to-gold-light">
                      <Crown className="w-4 h-4" />
                      {t.packs.bestSeller}
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className={`text-2xl font-bold mb-2 ${pack.variant === 'elite' ? 'text-gold-accent' : 'text-slate-900'}`}>{pack.title}</h3>
                    <p className={`text-sm h-10 ${pack.variant === 'elite' ? 'text-slate-300' : 'text-slate-500'}`}>{pack.description}</p>
                  </div>
                  
                  <div className={`mb-8 pb-8 border-b ${pack.variant === 'elite' ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${pack.variant === 'elite' ? 'text-white' : 'text-slate-900'}`}>{pack.price}</span>
                      <span className={`${pack.variant === 'elite' ? 'text-slate-400' : 'text-slate-500'}`}>{t.packs.perPers}</span>
                    </div>
                  </div>
                  
                  <ul className="flex-grow mb-8 space-y-4">
                    {pack.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${pack.variant === 'elite' ? 'text-gold-accent' : 'text-primary-600'}`} />
                        <span className={`text-sm ${pack.variant === 'elite' ? 'text-slate-300' : 'text-slate-600'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => onNavigate('register')} 
                    variant={pack.variant === 'elite' ? 'gold' : 'primary'} 
                    className="w-full"
                  >
                    {t.packs.select}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 bg-slate-50">
        <div className="container px-4 mx-auto">
          <SectionHeading 
            badge={t.testimonials.badge}
            title={t.testimonials.title}
            subtitle={t.testimonials.subtitle}
          />
          
          <div className="grid gap-8 md:grid-cols-3">
            {t.data.testimonials.map((test, i) => (
              <div key={i} className="relative p-8 transition duration-300 bg-white border border-slate-100 rounded-2xl group hover:shadow-xl">
                <Quote className="absolute w-12 h-12 transition top-8 right-8 text-slate-100 group-hover:text-primary-100" />
                <div className="flex items-center gap-4 mb-6">
                  <img src={test.image} alt={test.name} className="object-cover border-2 rounded-full w-14 h-14 border-primary-600" />
                  <div>
                    <h4 className="font-bold text-slate-900">{test.name}</h4>
                    <p className="text-sm text-primary-600">{test.role}</p>
                  </div>
                </div>
                <p className="mb-6 italic text-slate-600">"{test.quote}"</p>
                <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                  <div className="text-center">
                    <div className="font-bold text-gold-dark">{test.stats.roi}</div>
                    <div className="text-xs text-slate-400">{t.testimonials.roi}</div>
                  </div>
                  <div className="w-px h-8 bg-slate-100" />
                  <div className="text-center">
                    <div className="font-bold text-slate-900">{test.stats.partnerships}</div>
                    <div className="text-xs text-slate-400">{t.testimonials.partnerships}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Final - REDESIGNED */}
      <section className="relative overflow-hidden py-28 bg-slate-900">
        {/* Luxury Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1512453979798-5ea904ac22ac?q=80&w=2070&auto=format&fit=crop"
            alt="Dubai Luxury Night" 
            className="object-cover w-full h-full opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/60" />
        </div>

        <div className="container relative z-10 flex flex-col items-center justify-between gap-16 px-4 mx-auto lg:flex-row">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 border rounded-full border-gold-dark/30 bg-gold-dark/10 text-gold-accent backdrop-blur-sm">
               <Crown className="w-4 h-4" />
               <span className="text-sm font-bold tracking-widest uppercase">Opportunité Exclusive</span>
            </div>
            
            <h2 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl">
              {t.cta.title}
            </h2>
            <p className="max-w-2xl pl-6 mb-10 text-xl font-light leading-relaxed border-l-4 text-slate-300 border-gold-dark">
              {t.cta.subtitle}
            </p>
            <div className="flex flex-col gap-5 sm:flex-row">
              <Button onClick={() => onNavigate('register')} variant="gold" className="px-12 py-5 text-lg shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                {t.cta.btnRegister}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button onClick={() => onNavigate('faq')} className="px-10 py-5 text-lg text-white border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-white backdrop-blur-sm">
                {t.cta.btnFaq}
              </Button>
            </div>
          </div>
          
          <div className="relative group">
             {/* Ticket / Pass Visual */}
             <div className="relative p-1 transition duration-500 ease-out transform border shadow-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 rounded-3xl rotate-6 hover:rotate-3">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 rounded-3xl" />
                <div className="relative border border-gold-dark/50 rounded-[20px] p-8 text-center bg-slate-900/50 backdrop-blur-md">
                   <div className="w-20 h-1 mx-auto mb-6 rounded-full bg-gold-dark" />
                   <div className="text-gold-light uppercase tracking-[0.2em] text-sm font-bold mb-2">Places Limitées</div>
                   <div className="text-7xl font-bold text-white mb-2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">30</div>
                   <div className="text-sm font-medium text-slate-400">{t.cta.spotsLabel}</div>
                   <div className="flex justify-center gap-1 mt-6">
                      {[...Array(5)].map((_,i) => <div key={i} className="w-1 h-1 rounded-full bg-gold-dark" />)}
                   </div>
                </div>
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-gold-dark to-transparent opacity-20 blur-xl rounded-3xl -z-10" />
             </div>
          </div>
        </div>
      </section>
    </>
  );
};

const AgendaView: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = content[lang];
  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50">
      <div className="container px-4 mx-auto">
        <SectionHeading 
          badge={t.agenda.badge}
          title={t.agenda.title}
          subtitle={t.agenda.subtitle}
        />
        
        <div className="relative max-w-4xl mx-auto">
          {/* Ligne verticale */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200" />
          
          {t.data.agenda.map((item, index) => (
            <div key={index} className={`relative flex flex-col md:flex-row items-center gap-8 mb-16 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
              {/* Contenu */}
              <div className="w-full pl-12 md:w-1/2 md:pl-0">
                <div className={`relative bg-white border border-slate-200 p-6 rounded-2xl hover:shadow-lg transition duration-300 group ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                  {/* Arrow for tooltip feel */}
                  <div className={`absolute top-6 ${index % 2 === 0 ? 'md:-left-2 -left-2' : 'md:-right-2 -left-2'} w-4 h-4 bg-white border-l border-b border-slate-200 rotate-45 z-0 ${index % 2 !== 0 ? 'border-r border-t border-l-0 border-b-0' : ''}`} />
                  
                  <div className="relative z-10">
                    <div className={`inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-semibold`}>
                      <Clock className="w-4 h-4" />
                      {item.time}
                    </div>
                    <h3 className="mb-2 text-2xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mb-4 text-slate-600">{item.description}</p>
                    <div className={`flex items-center gap-2 text-primary-600 ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}>
                       <item.icon className="w-5 h-5" />
                       <span className="text-sm font-medium tracking-wide uppercase">{t.agenda.officialProgram}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Point central */}
              <div className="absolute z-10 flex items-center justify-center w-8 h-8 -translate-x-1/2 bg-white border-4 rounded-full shadow-sm left-4 md:left-1/2 border-primary-600">
              </div>
              
              {/* Label Jour */}
              <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                <span className="text-5xl font-bold text-slate-200">{item.day}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FAQView: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = content[lang];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50">
      <div className="container max-w-3xl px-4 mx-auto">
        <SectionHeading 
          badge={t.faq.badge}
          title={t.faq.title}
          subtitle={t.faq.subtitle}
        />
        
        <div className="space-y-4">
          {t.data.faqs.map((faq, index) => (
            <div 
              key={index}
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                openIndex === index 
                  ? 'bg-white border-primary-600 shadow-md' 
                  : 'bg-white border-slate-200 hover:border-primary-300'
              }`}
            >
              <button
                className="flex items-center justify-between w-full p-6 text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className={`font-semibold text-lg ${openIndex === index ? 'text-primary-700' : 'text-slate-800'}`}>
                  {faq.q}
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-primary-600' : 'text-slate-400'}`} />
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-6 pt-0 leading-relaxed border-t text-slate-600 border-slate-100">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 mt-12 text-center bg-white border shadow-sm border-slate-200 rounded-2xl">
          <h3 className="mb-2 text-xl font-bold text-slate-900">{t.faq.moreQuestions}</h3>
          <p className="mb-6 text-slate-600">{t.faq.concierge}</p>
          <Button variant="outline" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            {t.faq.chatBtn}
          </Button>
        </div>
      </div>
    </div>
  );
};

const RegisterView: React.FC<{ initialPack?: string | null, lang: Language, onHome: () => void }> = ({ initialPack, lang, onHome }) => {
  const t = content[lang];
  const [step, setStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '', lastName: '', email: '', phone: '', company: '', role: '',
    selectedPack: (initialPack as any) || null, needsVisa: true, message: ''
  });

  useEffect(() => {
     // Init DB on load to ensure it's ready when submitting
     dbManager.init();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save data to SQLite DB
      try {
        dbManager.addRegistration(formData);
        setShowSuccessModal(true);
      } catch (e) {
        alert(t.register.error);
        console.error(e);
      }
    }
  };

  const updateField = (field: keyof RegistrationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50">
      <Modal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={t.register.successModal.title}
        message={t.register.successModal.message}
        confirmText={t.register.successModal.btnHome}
        onConfirm={onHome}
        type="success"
      />

      <div className="container max-w-4xl px-4 mx-auto">
        <SectionHeading 
          badge={t.register.badge}
          title={t.register.title}
          subtitle={t.register.subtitle}
        />

        <div className="relative p-8 overflow-hidden bg-white border shadow-xl border-slate-200 rounded-3xl md:p-12">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
            <div 
              className="h-full transition-all duration-500 bg-primary-600"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {/* Steps Indicator */}
          <div className="flex justify-center mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                  step >= s 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 mx-2 ${step > s ? 'bg-primary-600' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="mb-6 text-2xl font-bold text-slate-900">{t.register.personalInfo}</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <InputGroup label={t.register.labels.firstName}>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3 transition border rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                    />
                  </InputGroup>
                  <InputGroup label={t.register.labels.lastName}>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3 transition border rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:border-primary-600 focus:outline-none"
                      value={formData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                    />
                  </InputGroup>
                  <InputGroup label={t.register.labels.email}>
                    <input 
                      required
                      type="email" 
                      className="w-full px-4 py-3 transition border rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:border-primary-600 focus:outline-none"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </InputGroup>
                  <InputGroup label={t.register.labels.phone}>
                    <input 
                      required
                      type="tel" 
                      className="w-full px-4 py-3 transition border rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:border-primary-600 focus:outline-none"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </InputGroup>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                   <InputGroup label={t.register.labels.company}>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3 transition border rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:border-primary-600 focus:outline-none"
                      value={formData.company}
                      onChange={(e) => updateField('company', e.target.value)}
                    />
                  </InputGroup>
                   <InputGroup label={t.register.labels.role}>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3 transition border rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:border-primary-600 focus:outline-none"
                      value={formData.role}
                      onChange={(e) => updateField('role', e.target.value)}
                    />
                  </InputGroup>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="mb-6 text-2xl font-bold text-slate-900">{t.register.programChoice}</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {t.data.packs.map((pack) => (
                    <div 
                      key={pack.variant}
                      onClick={() => updateField('selectedPack', pack.variant)}
                      className={`cursor-pointer rounded-xl p-6 border-2 transition-all ${
                        formData.selectedPack === pack.variant
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-bold text-slate-900">{pack.title}</span>
                        {formData.selectedPack === pack.variant && <CheckCircle className="w-5 h-5 text-primary-600" />}
                      </div>
                      <div className="mb-2 text-xl font-bold text-primary-600">{pack.price}</div>
                      <p className="text-xs text-slate-500">{pack.description}</p>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 mt-6 border bg-slate-50 rounded-xl border-slate-200">
                   <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.needsVisa}
                        onChange={(e) => updateField('needsVisa', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
                      />
                      <span className="text-slate-700">{t.register.labels.visa}</span>
                   </label>
                </div>

                <InputGroup label={t.register.labels.message}>
                    <textarea 
                      className="w-full h-32 px-4 py-3 transition border rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:border-primary-600 focus:outline-none"
                      value={formData.message}
                      onChange={(e) => updateField('message', e.target.value)}
                    />
                </InputGroup>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 text-center">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-green-50">
                  <FileSignature className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{t.register.ready}</h3>
                <p className="max-w-lg mx-auto text-slate-600">
                  {t.register.readyDesc}
                </p>
                
                <div className="max-w-md p-6 mx-auto space-y-3 text-left border bg-slate-50 border-slate-200 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t.register.labels.candidate}:</span>
                    <span className="font-medium text-slate-900">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t.register.labels.pack}:</span>
                    <span className="font-medium capitalize text-slate-900">{formData.selectedPack || 'Non sélectionné'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-medium text-slate-900">{formData.email}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-8 border-t border-slate-200">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-2" /> {t.register.labels.back}
                </Button>
              ) : (
                <div />
              )}
              <Button type="submit" variant="gold" className="px-8">
                {step === 3 ? t.register.labels.finish : t.register.labels.next} 
                {step < 3 && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Main Layout & App Component ---

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary-600 text-white shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl ${
        isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      }`}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-6 h-6" />
    </button>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<Language>('fr');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateTo = (page: PageView) => {
    setCurrentView(page);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const t = content[lang];

  return (
    <div className="min-h-screen font-sans bg-white text-slate-900 selection:bg-primary-100 selection:text-primary-900">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 py-3 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="container flex items-center justify-between px-4 mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
            <div className="flex items-center justify-center w-10 h-10 text-white rounded-lg bg-gradient-to-br from-primary-600 to-gold-accent">
              <span className="text-xl font-bold">D</span>
            </div>
            <div className="hidden leading-tight sm:block">
              <div className={`font-bold tracking-wide ${isScrolled || currentView !== 'home' ? 'text-slate-900' : 'text-slate-900'}`}>DUBAI BUSINESS</div>
              <div className="text-xs tracking-widest uppercase text-gold-dark">Expedition</div>
            </div>
          </div>

          <div className="items-center hidden gap-8 md:flex">
            <button onClick={() => navigateTo('home')} className={`text-sm font-medium hover:text-primary-600 transition ${currentView === 'home' ? 'text-primary-600' : 'text-slate-600'}`}>{t.nav.home}</button>
            <button onClick={() => navigateTo('agenda')} className={`text-sm font-medium hover:text-primary-600 transition ${currentView === 'agenda' ? 'text-primary-600' : 'text-slate-600'}`}>{t.nav.agenda}</button>
            <button onClick={() => navigateTo('faq')} className={`text-sm font-medium hover:text-primary-600 transition ${currentView === 'faq' ? 'text-primary-600' : 'text-slate-600'}`}>{t.nav.faq}</button>
            
            <div className="w-px h-6 mx-2 bg-slate-200"></div>
            
            <button 
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="text-sm font-bold uppercase transition text-slate-500 hover:text-primary-600"
            >
              {lang}
            </button>

            <Button onClick={() => navigateTo('register')} variant="gold" className="px-6 py-2 text-sm">
              {t.nav.register}
            </Button>
          </div>

          <div className="flex items-center gap-4 md:hidden">
             <button 
                onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                className="text-sm font-bold uppercase text-slate-900"
              >
                {lang}
              </button>
            <button className="text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center space-y-8 bg-white animate-fade-in">
          <button onClick={() => navigateTo('home')} className="text-2xl font-bold text-slate-900">{t.nav.home}</button>
          <button onClick={() => navigateTo('agenda')} className="text-2xl font-bold text-slate-900">{t.nav.agenda}</button>
          <button onClick={() => navigateTo('faq')} className="text-2xl font-bold text-slate-900">{t.nav.faq}</button>
          <Button onClick={() => navigateTo('register')} variant="gold" className="px-8 py-3 text-lg">
            {t.nav.register}
          </Button>
        </div>
      )}

      {/* Content */}
      <main>
        {currentView === 'home' && <HomeView onNavigate={navigateTo} lang={lang} />}
        {currentView === 'agenda' && <AgendaView lang={lang} />}
        {currentView === 'faq' && <FAQView lang={lang} />}
        {currentView === 'register' && <RegisterView lang={lang} onHome={() => navigateTo('home')} />}
        {currentView === 'admin' && <AdminView lang={lang} />}
        {currentView === 'legal' && <LegalPage title={t.legal.legalNotice} sections={t.legalContent.legal} date={t.legal.lastUpdated} />}
        {currentView === 'privacy' && <LegalPage title={t.legal.privacyPolicy} sections={t.legalContent.privacy} date={t.legal.lastUpdated} />}
        {currentView === 'terms' && <LegalPage title={t.legal.termsConditions} sections={t.legalContent.terms} date={t.legal.lastUpdated} />}
      </main>

      {/* Scroll To Top Button */}
      <ScrollToTop />

      {/* Footer */}
      <footer className="pt-20 pb-10 mt-0 text-white bg-slate-900">
        <div className="container px-4 mx-auto">
          <div className="grid gap-12 mb-16 md:grid-cols-4">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center justify-center w-8 h-8 text-white rounded-lg bg-gradient-to-br from-primary-600 to-gold-accent">
                  <span className="font-bold">D</span>
                </div>
                <span className="text-xl font-bold">DUBAI BUSINESS EXPEDITION</span>
              </div>
              <p className="max-w-sm mb-6 text-slate-400">
                {t.footer.desc}
              </p>
              <div className="flex gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-center w-10 h-10 transition rounded-full cursor-pointer bg-slate-800 hover:bg-primary-600 hover:text-white text-slate-400">
                    <Globe className="w-5 h-5" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="mb-6 font-bold text-white">{t.footer.links}</h4>
              <ul className="space-y-4">
                <li><button onClick={() => navigateTo('home')} className="transition text-slate-400 hover:text-white">{t.nav.home}</button></li>
                <li><button onClick={() => navigateTo('agenda')} className="transition text-slate-400 hover:text-white">{t.nav.agenda}</button></li>
                <li><button onClick={() => navigateTo('register')} className="transition text-slate-400 hover:text-white">{t.nav.register}</button></li>
                <li><button onClick={() => navigateTo('faq')} className="transition text-slate-400 hover:text-white">{t.nav.faq}</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-6 font-bold text-white">{t.footer.contact}</h4>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-center gap-3"><MapPin className="w-5 h-5 text-primary-600" /> Dubai, UAE</li>
                <li className="flex items-center gap-3"><Phone className="w-5 h-5 text-primary-600" /> +971 50 123 4567</li>
                <li className="flex items-center gap-3"><Mail className="w-5 h-5 text-primary-600" /> contact@dubai-expedition.com</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-between gap-4 pt-8 text-sm border-t border-slate-800 md:flex-row text-slate-500">
            <div>© 2024 Dubai Business Expedition. {t.footer.rights}</div>
            <div className="flex gap-6">
              <button onClick={() => navigateTo('legal')} className="hover:text-white">{t.footer.legal}</button>
              <button onClick={() => navigateTo('privacy')} className="hover:text-white">{t.footer.privacy}</button>
              <button onClick={() => navigateTo('terms')} className="hover:text-white">{t.footer.terms}</button>
            </div>
          </div>
           <button onClick={() => navigateTo('admin')} className="block w-full mt-8 text-xs text-center text-slate-700 hover:text-slate-500">
              {t.footer.admin}
           </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
