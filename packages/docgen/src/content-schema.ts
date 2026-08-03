import { Arcana } from '@matrix/engine';

/** Стадия 1: структурированная карточка. Редактируется ДО генерации прозы. */
export interface ArcanaCard {
  arcana: number; // в JSON лежит number; toArcana применяется в загрузчике
  name: string;
  keywords: string[];
  strengths: string[];
  shadows: string[];
  inRelationship: {
    asPartner: string[];
    needsFromPartner: string[];
    conflictPattern: string;
  };
  /** Уникальная бытовая сценка — инструмент анти-дедупликации. Домен фиксируется в vignettes.md */
  vignette: string;
  positionNotes: {
    center: string;
    heart: string;
    money: string;
  };
}

/** Стадия 2: проза из утверждённой карточки. Ключи блоков = места в PDF и на страницах. */
export interface ArcanaProse {
  arcana: number;
  blocks: {
    portraitShort: string; // 100–150 слов, бесплатная выдача
    portraitFull: string; // 400–600 слов, PDF + программная страница
    asPartner: string;
    needsFromPartner: string;
    conflictPattern: string;
    /** Позиционные блоки (вторая волна программных страниц). Опциональны при запуске. */
    inCenter?: string;
    inHeart?: string;
    inMoney?: string;
  };
}

export interface ArcanaContent {
  card: ArcanaCard;
  prose: ArcanaProse;
}

export type ArcanaContentMap = Map<Arcana, ArcanaContent>;
