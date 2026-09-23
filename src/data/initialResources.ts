import { Resource } from '../types';
import coverPostutme from '../assets/images/cover_postutme_unilag_1790125905105.jpg';
import coverJambEnglish from '../assets/images/cover_jamb_english_1790125914520.jpg';
import coverJambSciences from '../assets/images/cover_jamb_sciences_1790125924446.jpg';

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'res-unilag-postutme',
    slug: 'unilag-post-utme-past-questions',
    title: 'UNILAG Post-UTME Comprehensive Past Questions & Solutions',
    category: 'post_utme',
    institution: 'University of Lagos (UNILAG)',
    subject: 'General Paper (English, Maths & General Knowledge)',
    yearRange: '2010 - 2025 Solved',
    price: 2500,
    isFree: false,
    coverUrl: coverPostutme,
    fileSize: '8.4 MB',
    pageCount: 164,
    format: 'High-Res PDF (Printable & Mobile Friendly)',
    description: 'The definitive UNILAG Post-UTME preparation manual. Contains past examination questions from 2010 to 2025 with step-by-step analytical solutions, recurring UNILAG question types, time management techniques, and cut-off mark projections for all faculties.',
    features: [
      'Comprehensive 15-year UNILAG CBT past papers',
      'Step-by-step working for all Mathematics and Quantitative logic questions',
      'UNILAG Current Affairs & General Knowledge breakdown',
      'Faculty aggregate calculation guide (O-Level + UTME + Post-UTME)',
      'Verified by UNILAG graduate scholars'
    ],
    downloadsCount: 4820,
    rating: 4.9,
    reviewCount: 312,
    isFeatured: true,
    sampleQuestions: [
      {
        question: 'In a class of 45 students, 28 study Mathematics, 20 study Physics, and 12 study both. How many students study neither?',
        options: ['7 students', '9 students', '11 students', '5 students'],
        answer: '9 students',
        explanation: 'Using set notation: Total = n(M) + n(P) - n(M ∩ P) + n(Neither). 45 = 28 + 20 - 12 + x => 45 = 36 + x => x = 9.'
      },
      {
        question: 'Identify the word with the stress pattern on the second syllable: PHOTOGRAPH, PHOTOGRAPHY, PHOTOGRAPHIC, TELEGRAPH',
        options: ['Photograph', 'Photography', 'Photographic', 'Telegraph'],
        answer: 'Photography',
        explanation: 'Photography is pronounced pho-TOG-ra-phy (stress on second syllable "tog"). Photograph has stress on first syllable: PHO-to-graph.'
      }
    ],
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'res-jamb-english-mastery',
    slug: 'jamb-use-of-english-past-questions',
    title: 'JAMB Use of English & Comprehension Complete Solved Questions',
    category: 'jamb_utme',
    institution: 'JAMB General',
    subject: 'Use of English',
    yearRange: '2012 - 2025 Full Solutions',
    price: 0,
    isFree: true,
    coverUrl: coverJambEnglish,
    fileSize: '5.2 MB',
    pageCount: 142,
    format: 'PDF (Free Student Edition)',
    description: 'Official free edition of JAMB Use of English past questions. Covers comprehension passages, lexical structure, registers, antonyms & synonyms, vowel/consonant sounds, and idiomatic expressions with in-depth reasoning.',
    features: [
      'Over 600 verified JAMB Use of English exam questions',
      'Pronunciation, stress patterns, and vowel sound keys',
      'Registers of medicine, law, commerce, and technology',
      'Tips to avoid common English traps in JAMB CBT'
    ],
    downloadsCount: 14250,
    rating: 4.8,
    reviewCount: 890,
    isFeatured: true,
    sampleQuestions: [
      {
        question: 'Choose the word opposite in meaning to the italicized word: The manager made an INADVERTENT error in the report.',
        options: ['Accidental', 'Deliberate', 'Dangerous', 'Unforgivable'],
        answer: 'Deliberate',
        explanation: '"Inadvertent" means unintentional or accidental. The exact antonym is "deliberate" (intentional).'
      },
      {
        question: 'From the words lettered A to D, choose the word that contains the vowel sound /i:/:',
        options: ['Live', 'Leave', 'Sit', 'Hit'],
        answer: 'Leave',
        explanation: '"Leave" contains the long vowel sound /i:/, whereas live, sit, and hit contain the short vowel /ɪ/.'
      }
    ],
    createdAt: '2026-02-01T12:00:00Z'
  },
  {
    id: 'res-jamb-sciences-pack',
    slug: 'jamb-sciences-maths-physics-chemistry',
    title: 'JAMB Sciences Formula Master & Past Solved Papers (Maths, Physics, Chemistry)',
    category: 'formula_sheet',
    institution: 'JAMB General',
    subject: 'Mathematics, Physics & Chemistry',
    yearRange: '2015 - 2025 Past Series',
    price: 2000,
    isFree: false,
    coverUrl: coverJambSciences,
    fileSize: '11.5 MB',
    pageCount: 210,
    format: 'PDF Study Pack + Printable Formula Tables',
    description: 'The ultimate reference handbook for engineering, medicine, and pure sciences aspirants. Contains condensed key formulas, periodic table cheat sheets, mechanics shortcuts, and 10 years of solved past questions with step-by-step working.',
    features: [
      '250+ essential formulas across Mechanics, Waves, Electricity & Organic Chem',
      'Speed math shortcuts for JAMB calculator-limited CBT interface',
      'Color-coded concept maps and dimensional analysis tricks',
      'Printable pocket formula quick-card'
    ],
    downloadsCount: 7890,
    rating: 4.9,
    reviewCount: 420,
    isFeatured: true,
    sampleQuestions: [
      {
        question: 'An object of mass 2 kg moves with a velocity of 10 m/s. If a resisting force of 4 N acts on it, how long will it take to come to rest?',
        options: ['2.5 s', '5.0 s', '10.0 s', '20.0 s'],
        answer: '5.0 s',
        explanation: 'Deceleration a = F/m = 4/2 = 2 m/s². From v = u - at, 0 = 10 - 2t => 2t = 10 => t = 5 seconds.'
      },
      {
        question: 'What is the oxidation number of Chromium in K2Cr2O7?',
        options: ['+3', '+4', '+6', '+7'],
        answer: '+6',
        explanation: '2(+1) + 2(Cr) + 7(-2) = 0 => 2 + 2Cr - 14 = 0 => 2Cr = 12 => Cr = +6.'
      }
    ],
    createdAt: '2026-02-10T14:30:00Z'
  },
  {
    id: 'res-ui-postutme',
    slug: 'ui-post-utme-past-questions',
    title: 'University of Ibadan (UI) Post-UTME Past Questions & Model Answers',
    category: 'post_utme',
    institution: 'University of Ibadan (UI)',
    subject: 'General Paper & Subject Combinations',
    yearRange: '2012 - 2025 Solved',
    price: 2500,
    isFree: false,
    coverUrl: coverPostutme,
    fileSize: '7.8 MB',
    pageCount: 156,
    format: 'Printable PDF',
    description: 'Official format past questions for the prestigious Premier University. Covers UI Post-UTME examination structures, department scoring rubrics, and detailed step-by-step explanations for speed and accuracy.',
    features: [
      'UI specific CBT exam simulation pattern',
      'Subject breakdowns for Science, Arts, and Social Sciences',
      'Detailed rationale behind tricky questions',
      'UI departmental aggregate cut-off guide'
    ],
    downloadsCount: 3620,
    rating: 4.8,
    reviewCount: 215,
    isFeatured: true,
    sampleQuestions: [
      {
        question: 'Solve for x in the equation: log₁₀(x + 3) + log₁₀(x - 3) = 1',
        options: ['x = √19', 'x = 19', 'x = √10', 'x = 4'],
        answer: 'x = √19',
        explanation: 'log₁₀((x + 3)(x - 3)) = 1 => log₁₀(x² - 9) = 1 => x² - 9 = 10¹ => x² = 19 => x = √19 (since x > 3).'
      }
    ],
    createdAt: '2026-02-14T09:15:00Z'
  },
  {
    id: 'res-oau-postutme',
    slug: 'oau-post-utme-past-questions',
    title: 'OAU Ile-Ife Post-UTME Past Questions & Detailed Explanations',
    category: 'post_utme',
    institution: 'Obafemi Awolowo University (OAU)',
    subject: 'Aptitude Test & Faculty Combinations',
    yearRange: '2011 - 2025 Solved',
    price: 2500,
    isFree: false,
    coverUrl: coverPostutme,
    fileSize: '8.1 MB',
    pageCount: 160,
    format: 'Printable PDF',
    description: 'Master the rigorous OAU Ile-Ife Post-UTME exam with this complete collection of past questions, logical reasoning patterns, and verified solutions.',
    features: [
      'Great Ife Post-UTME past CBT questions',
      'Deep analytical explanations for difficult concepts',
      'OAU speed and time allocation strategy',
      'Faculty cut-off trends over the past 5 years'
    ],
    downloadsCount: 3180,
    rating: 4.9,
    reviewCount: 198,
    isFeatured: false,
    createdAt: '2026-02-18T11:00:00Z'
  },
  {
    id: 'res-unn-postutme',
    slug: 'unn-post-utme-past-questions',
    title: 'University of Nigeria Nsukka (UNN) Post-UTME Past Questions & Answers',
    category: 'post_utme',
    institution: 'University of Nigeria Nsukka (UNN)',
    subject: 'General Paper (Faculty of Choice)',
    yearRange: '2013 - 2025 Solved',
    price: 2500,
    isFree: false,
    coverUrl: coverPostutme,
    fileSize: '7.4 MB',
    pageCount: 148,
    format: 'Printable PDF',
    description: 'Complete UNN Post-UTME screening questions for all faculties: Medical Sciences, Law, Engineering, Arts, and Management. Fully solved by top UNN scholars.',
    features: [
      'Official UNN past screening test format',
      'Step-by-step solutions for Math & Sciences',
      'Aggregate calculation formula for UNN admission'
    ],
    downloadsCount: 2940,
    rating: 4.7,
    reviewCount: 182,
    isFeatured: false,
    createdAt: '2026-02-20T16:00:00Z'
  },
  {
    id: 'res-jamb-novel-summary',
    slug: 'jamb-compulsory-novel-summary-questions',
    title: 'JAMB Compulsory Novel Master Guide: Chapter Breakdown & 300+ Practice MCQs',
    category: 'syllabus_novel',
    institution: 'JAMB General',
    subject: 'Literature & General English',
    yearRange: '2025 - 2026 Approved Edition',
    price: 0,
    isFree: true,
    coverUrl: coverJambEnglish,
    fileSize: '4.1 MB',
    pageCount: 88,
    format: 'PDF eBook',
    description: 'Free comprehensive study companion for the current JAMB prescribed reading novel. Includes character sketches, chapter-by-chapter summaries, underlying themes, figurative language analysis, and 300+ likely CBT test questions.',
    features: [
      'Exhaustive chapter-by-chapter analysis',
      'All major and minor character profiles',
      'Literary devices and figurative devices explained',
      '300+ predicted JAMB multiple choice questions'
    ],
    downloadsCount: 18500,
    rating: 4.9,
    reviewCount: 1140,
    isFeatured: true,
    createdAt: '2026-02-22T08:00:00Z'
  },
  {
    id: 'res-medical-combo-bundle',
    slug: 'jamb-medicine-health-sciences-bundle',
    title: 'JAMB Medicine & Surgery 4-in-1 Master Bundle (Eng, Bio, Chem, Phys)',
    category: 'bundle',
    institution: 'JAMB General',
    subject: 'Biology, Chemistry, Physics & Use of English',
    yearRange: '2010 - 2025 Complete Bundle',
    price: 4500,
    isFree: false,
    coverUrl: coverJambSciences,
    fileSize: '24.2 MB',
    pageCount: 520,
    format: 'All-In-One PDF Bundle + CBT Mock Software Access',
    description: 'Designed exclusively for medical aspirants targeting 300+ in JAMB. Includes complete 15-year past questions with detailed scientific diagrams, physiological concepts, organic synthesis reactions, and physics numerical shortcuts.',
    features: [
      'All 4 compulsory Medicine subjects in one consolidated pack',
      'High-yield biology diagrams and taxonomy summaries',
      'Chemistry IUPAC naming and stoichiometry problem bank',
      'Includes free UNILAG/UI/OAU Post-UTME Medical screening addon'
    ],
    downloadsCount: 5410,
    rating: 5.0,
    reviewCount: 384,
    isFeatured: true,
    createdAt: '2026-02-24T15:20:00Z'
  }
];

export const INSTITUTIONS_LIST = [
  'All Institutions',
  'JAMB General',
  'University of Lagos (UNILAG)',
  'University of Ibadan (UI)',
  'Obafemi Awolowo University (OAU)',
  'University of Nigeria Nsukka (UNN)',
  'Ahmadu Bello University (ABU Zaria)',
  'University of Benin (UNIBEN)',
  'Lagos State University (LASU)',
  'University of Ilorin (UNILORIN)',
  'Federal University of Technology Owerri (FUTO)',
  'Federal University of Technology Akure (FUTA)',
  'Federal University of Technology Minna (FUTMINNA)',
  'University of Port Harcourt (UNIPORT)',
  'University of Calabar (UNICAL)',
  'University of Abuja (UNIABUJA)',
  'Nnamdi Azikiwe University (UNIZIK)',
  'Bayero University Kano (BUK)',
  'Delta State University (DELSU)',
  'Olabisi Onabanjo University (OOU)',
  'Ekiti State University (EKSU)',
  'Kwara State University (KWASU)',
  'Rivers State University (RSU)',
  'Abia State University (ABSU)',
  'Imo State University (IMSU)',
  'Adekunle Ajasin University (AAUA)',
  'Federal University Oye-Ekiti (FUOYE)',
  'Kaduna State University (KASU)',
  'Babcock University',
  'Covenant University',
  'Bowen University',
  'Afe Babalola University (ABUAD)',
  'Yaba College of Technology (YABATECH)',
  'Federal Polytechnic Ilaro',
  'Federal Polytechnic Nekede',
  'The Polytechnic, Ibadan',
  'Auchi Polytechnic',
  'Kaduna Polytechnic (KADPOLY)',
  'Lagos State University of Science and Technology (LASUSTECH)'
];

export const SUBJECTS_LIST = [
  'All Subjects',
  'General Comprehensive',
  'Use of English',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Government',
  'Literature in English',
  'Commerce & Accounts',
  'CRK / IRS'
];

export const JAMB_COURSES_DATA = [
  {
    name: 'Medicine & Surgery (MBBS)',
    faculty: 'College of Medicine / Health Sciences',
    jambSubjects: ['English Language (Compulsory)', 'Biology', 'Chemistry', 'Physics'],
    oLevelReqs: '5 credits in English, Maths, Biology, Chemistry & Physics in one sitting',
    competitiveCutoff: '280 - 320+'
  },
  {
    name: 'Computer Science',
    faculty: 'Sciences / Computing',
    jambSubjects: ['English Language (Compulsory)', 'Mathematics', 'Physics', 'Chemistry or Biology'],
    oLevelReqs: '5 credits in English, Maths, Physics, Chemistry and one other Science subject',
    competitiveCutoff: '240 - 275+'
  },
  {
    name: 'Law (LL.B)',
    faculty: 'Law',
    jambSubjects: ['English Language (Compulsory)', 'Literature in English', 'Government / History', 'Any Social Science / Arts subject (e.g., Economics, CRS/IRS)'],
    oLevelReqs: '5 credits in English Language, Literature in English, Mathematics, and two other Arts/Social Science subjects',
    competitiveCutoff: '260 - 295+'
  },
  {
    name: 'Mechanical / Electrical Engineering',
    faculty: 'Engineering',
    jambSubjects: ['English Language (Compulsory)', 'Mathematics', 'Physics', 'Chemistry'],
    oLevelReqs: '5 credits in English, Maths, Physics, Chemistry, and Further Maths or Technical Drawing',
    competitiveCutoff: '250 - 285+'
  },
  {
    name: 'Accounting / Finance',
    faculty: 'Management Sciences',
    jambSubjects: ['English Language (Compulsory)', 'Mathematics', 'Economics', 'Any other Social Science subject (Government, Commerce, Financial Accounting)'],
    oLevelReqs: '5 credits in English Language, Mathematics, Economics, and two other subjects',
    competitiveCutoff: '230 - 265+'
  },
  {
    name: 'Pharmacy (Pharm.D)',
    faculty: 'Pharmaceutical Sciences',
    jambSubjects: ['English Language (Compulsory)', 'Biology', 'Chemistry', 'Physics'],
    oLevelReqs: '5 credits in English, Maths, Biology, Chemistry, and Physics in not more than two sittings',
    competitiveCutoff: '260 - 290+'
  },
  {
    name: 'Nursing Science',
    faculty: 'Health Sciences',
    jambSubjects: ['English Language (Compulsory)', 'Biology', 'Chemistry', 'Physics'],
    oLevelReqs: '5 credits in English, Maths, Biology, Chemistry, and Physics in one or two sittings',
    competitiveCutoff: '250 - 280+'
  }
];
