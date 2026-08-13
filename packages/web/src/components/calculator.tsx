'use client';

// Калькулятор матрицы: личная + совместимость.
// Расчёт мгновенный, в браузере, без сети — @matrix/engine чистый TS.
// Тексты разборов подгружаются с сервера по мере необходимости (/api/arcana/:n),
// потому что контент лежит на диске, а расчёт идёт на клиенте.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  computePersonalMatrix,
  computeCompatibility,
  PersonalMatrix,
} from '@matrix/engine';
import MatrixChart from './matrix-chart';
import ArcanaSections from './arcana-sections';
import { arcanaName } from '@/lib/arcana-names';
import { reachGoal } from './metrika';

type Tab = 'personal' | 'compatibility';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ArcanaTeaser {
  arcana: number;
  name: string;
  portraitShort: string;
}

const KEY_POSITIONS: Array<{
  key: keyof PersonalMatrix['positions'];
  label: string;
  hint: string;
}> = [
  { key: 'center', label: 'Центр', hint: 'аркан характера, ваша зона комфорта' },
  { key: 'heart', label: 'Под сердцем', hint: 'линия отношений: какой партнёр вам подходит' },
  { key: 'money', label: 'Под долларом', hint: 'финансовая линия: как приходят деньги' },
];

export default function Calculator({ initialTab = 'personal' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [birthA, setBirthA] = useState('');
  const [nameA, setNameA] = useState('');
  const [birthB, setBirthB] = useState('');
  const [nameB, setNameB] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadMode, setLeadMode] = useState<{ missingArcana: number[] } | null>(null);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSent, setLeadSent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [email, setEmail] = useState('');

  const personal = useMemo(() => tryMatrix(birthA), [birthA]);
  const partner = useMemo(() => tryMatrix(birthB), [birthB]);
  const compat = useMemo(() => {
    if (tab !== 'compatibility' || !personal || !partner) return null;
    return computeCompatibility(birthA, birthB);
  }, [tab, personal, partner, birthA, birthB]);

  // Затравка: короткий разбор ключевого аркана — центрального у человека
  // или аркана темы союза у пары.
  // На личной вкладке глубину показывает аккордеон; затравка нужна только паре.
  const teaserArcana = tab === 'compatibility' ? compat?.joint.coupleCharacter : undefined;
  const teaser = useArcanaTeaser(teaserArcana);

  async function buy() {
    reachGoal('checkout_start', { product: tab });
    setBusy(true);
    setError(null);
    setLeadMode(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: true,
          email,
          productType: tab,
          birthDateA: birthA,
          nameA,
          ...(tab === 'compatibility' ? { birthDateB: birthB, nameB } : {}),
        }),
      });
      const data = await res.json();
      if (res.status === 409 && data.error === 'content_not_ready') {
        setLeadMode({ missingArcana: data.missingArcana ?? [] });
        return;
      }
      if (!res.ok) {
        setError(data.error ?? 'Заказ не создался. Попробуйте ещё раз.');
        return;
      }
      reachGoal('payment_redirect', { product: tab });
      window.location.href = data.confirmationUrl;
    } catch {
      setError('Сеть недоступна. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  async function sendLead() {
    setBusy(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: true,
          email: leadEmail,
          productType: tab,
          birthDateA: birthA,
          nameA,
          ...(tab === 'compatibility' ? { birthDateB: birthB, nameB } : {}),
          missingArcana: leadMode?.missingArcana ?? [],
        }),
      });
      if (res.ok) {
        reachGoal('lead_submitted');
        setLeadSent(true);
      }
    } finally {
      setBusy(false);
    }
  }

  const ready =
    tab === 'personal'
      ? Boolean(personal && nameA.trim())
      : Boolean(personal && partner && nameA.trim() && nameB.trim());

  return (
    <div className="stack">
      <div role="tablist" style={{ display: 'flex', gap: 8 }}>
        <TabButton active={tab === 'personal'} onClick={() => setTab('personal')}>
          Моя матрица
        </TabButton>
        <TabButton active={tab === 'compatibility'} onClick={() => setTab('compatibility')}>
          Совместимость
        </TabButton>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: tab === 'compatibility' ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
        }}
      >
        <PersonInputs
          title={tab === 'compatibility' ? 'Первый партнёр' : 'Ваши данные'}
          name={nameA}
          birth={birthA}
          onName={setNameA}
          onBirth={setBirthA}
        />
        {tab === 'compatibility' && (
          <PersonInputs
            title="Второй партнёр"
            name={nameB}
            birth={birthB}
            onName={setNameB}
            onBirth={setBirthB}
          />
        )}
      </div>

      {tab === 'personal' && personal && (
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'start',
          }}
        >
          <div className="card">
            <MatrixChart matrix={personal} title={nameA || undefined} />
          </div>
          <KeyArcana matrix={personal} />
        </div>
      )}

      {tab === 'personal' && personal && <ArcanaSections matrix={personal} />}

      {tab === 'compatibility' && personal && partner && compat && (
        <>
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            <div className="card">
              <h3>{nameA || 'Первый партнёр'}</h3>
              <MatrixChart matrix={personal} title={nameA || undefined} />
            </div>
            <div className="card">
              <h3>{nameB || 'Второй партнёр'}</h3>
              <MatrixChart matrix={partner} title={nameB || undefined} />
            </div>
          </div>
          <div className="card">
            <h3>Арканы вашей пары</h3>
            <JointRow label="Тема союза" value={compat.joint.coupleCharacter} />
            <JointRow label="Что держит вас вместе" value={compat.joint.coupleHeart} />
            <JointRow label="Финансы пары" value={compat.joint.coupleMoney} />
          </div>
        </>
      )}

      {teaser && (
        <div className="card">
          <h3>
            Аркан {teaser.arcana} — {teaser.name}
          </h3>
          <p>{firstParagraph(teaser.portraitShort)}</p>
          <p>
            <Link href={`/arkan/${teaser.arcana}`}>Читать полный разбор аркана</Link>
          </p>
        </div>
      )}

      {!leadMode && ready && (
        <div className="stack" style={{ gap: 12 }}>
          <label>
            <span className="label-text">Почта для получения PDF</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <span className="muted" style={{ display: 'block', marginTop: 4 }}>
              Пришлём документ и чек. Рассылок не будет.
            </span>
          </label>
          <ConsentCheckbox checked={consent} onChange={setConsent} />
          <button disabled={busy || !consent || !EMAIL_RE.test(email)} onClick={buy}>
            {busy
              ? 'Готовим оплату…'
              : tab === 'compatibility'
                ? 'Полный разбор совместимости — 390 ₽'
                : 'Полный разбор моей матрицы — 290 ₽'}
          </button>
          <p className="muted" style={{ marginTop: 8 }}>
            {tab === 'compatibility'
              ? 'PDF: обе матрицы, аркан союза, динамика пары и что с ней делать. Придёт на почту сразу после оплаты.'
              : 'PDF: характер, отношения и деньги — полные разборы по трём ключевым арканам. Придёт на почту сразу после оплаты.'}
          </p>
        </div>
      )}

      {error && <p style={{ color: 'var(--stamp)' }}>{error}</p>}

      {leadMode && !leadSent && (
        <div className="card stack">
          <p>
            Разбор для вашего сочетания арканов ещё пишется. Оставьте почту — пришлём письмо,
            как только он будет готов.
          </p>
          <input
            type="email"
            placeholder="you@example.com"
            value={leadEmail}
            onChange={(e) => setLeadEmail(e.target.value)}
          />
          <ConsentCheckbox checked={consent} onChange={setConsent} />
          <button disabled={busy || !leadEmail || !consent} onClick={sendLead}>
            Сообщить о готовности
          </button>
        </div>
      )}
      {leadSent && <p>Записали. Напишем, как только разбор будет готов.</p>}
    </div>
  );
}

/* ------------------------------- части UI ------------------------------- */

function KeyArcana({ matrix }: { matrix: PersonalMatrix }) {
  return (
    <div className="card">
      <h3>Ключевые арканы</h3>
      {KEY_POSITIONS.map(({ key, label, hint }) => {
        const value = matrix.positions[key];
        return (
          <div
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 16,
              padding: '10px 0',
              borderBottom: '1px solid var(--rule)',
            }}
          >
            <span>
              <strong>{label}</strong>
              <span className="muted"> — {hint}</span>
            </span>
            <span className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {value} · {arcanaName(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function JointRow({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 16,
        padding: '10px 0',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <span>{label}</span>
      <span className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 700, whiteSpace: 'nowrap' }}>
        {value} · {arcanaName(value)}
      </span>
    </div>
  );
}

/**
 * Согласие на обработку ПДн. Галочка снята по умолчанию и обязательна:
 * предзаполненное согласие юридически не работает.
 */
function ConsentCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        fontSize: 13,
        color: 'var(--ink-soft)',
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 3, width: 16, height: 16, flex: '0 0 auto' }}
      />
      <span>
        Я согласен на обработку персональных данных (имя и дата рождения) и принимаю{' '}
        <Link href="/legal/offer" target="_blank">
          условия оферты
        </Link>{' '}
        и{' '}
        <Link href="/legal/privacy" target="_blank">
          политику конфиденциальности
        </Link>
        .
      </span>
    </label>
  );
}

function TabButton(props: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  // Стили — из дизайн-системы (globals.css): активная вкладка = обычная кнопка,
  // неактивная = .ghost. Никаких инлайн-перекрасок поверх глобального button.
  return (
    <button
      type="button"
      role="tab"
      aria-selected={props.active}
      onClick={props.onClick}
      className={props.active ? undefined : 'ghost'}
    >
      {props.children}
    </button>
  );
}

function PersonInputs(props: {
  title: string;
  name: string;
  birth: string;
  onName: (v: string) => void;
  onBirth: (v: string) => void;
}) {
  return (
    <fieldset className="card" style={{ margin: 0 }}>
      <legend style={{ padding: '0 8px', fontSize: 13, color: 'var(--ink-soft)' }}>
        {props.title}
      </legend>
      <label style={{ marginBottom: 16 }}>
        <span className="label-text">Имя</span>
        <input
          value={props.name}
          maxLength={60}
          placeholder="Как к вам обращаться"
          onChange={(e) => props.onName(e.target.value)}
        />
      </label>
      <DateFields value={props.birth} onChange={props.onBirth} />
    </fieldset>
  );
}

/**
 * Дата тремя селектами, а не <input type="date">: нативный пикер показывает
 * дату в локали браузера (у части пользователей — 05/25/2026), и это сбивает.
 * Здесь порядок всегда русский: день, месяц, год.
 */
const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function DateFields({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Локальное состояние обязательно: пока выбраны не все три поля, наружу
  // уходит пустая строка, и без своего состояния селекты сбрасывались бы
  // обратно на плейсхолдер после каждого выбора.
  const [d, setD] = useState(() => (value ? String(Number(value.split('-')[2])) : ''));
  const [m, setM] = useState(() => (value ? String(Number(value.split('-')[1])) : ''));
  const [y, setY] = useState(() => (value ? value.split('-')[0] : ''));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1929 }, (_, i) => currentYear - i);
  const daysInMonth = m && y ? new Date(Number(y), Number(m), 0).getDate() : 31;

  // 31 февраля не бывает: подрезаем день при смене месяца или года
  const safeDay = d && Number(d) > daysInMonth ? String(daysInMonth) : d;

  useEffect(() => {
    if (safeDay !== d) setD(safeDay);
    const iso =
      safeDay && m && y
        ? `${y}-${m.padStart(2, '0')}-${safeDay.padStart(2, '0')}`
        : '';
    if (iso !== value) onChange(iso);
    // onChange стабилен (setState родителя), value сравниваем явно выше
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeDay, m, y]);

  return (
    <label>
      <span className="label-text">Дата рождения</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          aria-label="День"
          value={safeDay}
          onChange={(e) => setD(e.target.value)}
          style={{ flex: '0 0 84px' }}
        >
          <option value="">День</option>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          aria-label="Месяц"
          value={m}
          onChange={(e) => setM(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="">Месяц</option>
          {MONTHS.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="Год"
          value={y}
          onChange={(e) => setY(e.target.value)}
          style={{ flex: '0 0 104px' }}
        >
          <option value="">Год</option>
          {years.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

/* -------------------------------- утилиты ------------------------------- */

function tryMatrix(birth: string): PersonalMatrix | null {
  try {
    return computePersonalMatrix(birth);
  } catch {
    return null;
  }
}

function firstParagraph(text: string): string {
  return text.split('\n\n')[0];
}

/** Подтягивает имя и затравку разбора; молча молчит, если разбор ещё не написан. */
function useArcanaTeaser(arcana: number | undefined): ArcanaTeaser | null {
  const [data, setData] = useState<ArcanaTeaser | null>(null);

  useEffect(() => {
    if (!arcana) {
      setData(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/arcana/${arcana}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [arcana]);

  return data;
}
