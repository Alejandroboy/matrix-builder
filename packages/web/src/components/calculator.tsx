'use client';

// Калькулятор матрицы: личная + совместимость.
// Расчёт мгновенный, в браузере, без сети — @matrix/engine чистый TS
// (тот же паттерн, что в калькуляторе неустойки).
import { useMemo, useState } from 'react';
import {
  computePersonalMatrix,
  computeCompatibility,
  PersonalMatrix,
} from '@matrix/engine';

type Tab = 'personal' | 'compatibility';

const POSITION_LABELS: Array<{ key: keyof PersonalMatrix['positions']; label: string }> = [
  { key: 'center', label: 'Центр (аркан характера)' },
  { key: 'heart', label: 'Под сердцем (линия отношений)' },
  { key: 'money', label: 'Под долларом (финансы)' },
  { key: 'personality', label: 'День рождения' },
  { key: 'spirituality', label: 'Месяц' },
  { key: 'destiny', label: 'Год' },
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

  const personal = useMemo(() => tryMatrix(birthA), [birthA]);
  const partner = useMemo(() => tryMatrix(birthB), [birthB]);
  const compat = useMemo(() => {
    if (tab !== 'compatibility' || !personal || !partner) return null;
    return computeCompatibility(birthA, birthB);
  }, [tab, personal, partner, birthA, birthB]);

  async function buy() {
    setBusy(true);
    setError(null);
    setLeadMode(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        setError(data.error ?? 'Не получилось создать заказ');
        return;
      }
      window.location.href = data.confirmationUrl;
    } catch {
      setError('Сеть недоступна, попробуйте ещё раз');
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
          email: leadEmail,
          productType: tab,
          birthDateA: birthA,
          nameA,
          ...(tab === 'compatibility' ? { birthDateB: birthB, nameB } : {}),
          missingArcana: leadMode?.missingArcana ?? [],
        }),
      });
      if (res.ok) setLeadSent(true);
    } finally {
      setBusy(false);
    }
  }

  const ready =
    tab === 'personal'
      ? Boolean(personal && nameA.trim())
      : Boolean(personal && partner && nameA.trim() && nameB.trim());

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div role="tablist" style={{ display: 'flex', gap: 8 }}>
        <TabButton active={tab === 'personal'} onClick={() => setTab('personal')}>
          Моя матрица
        </TabButton>
        <TabButton active={tab === 'compatibility'} onClick={() => setTab('compatibility')}>
          Совместимость
        </TabButton>
      </div>

      <PersonInputs
        title={tab === 'compatibility' ? 'Первый партнёр' : 'Ваши данные'}
        name={nameA} birth={birthA} onName={setNameA} onBirth={setBirthA}
      />
      {tab === 'compatibility' && (
        <PersonInputs
          title="Второй партнёр"
          name={nameB} birth={birthB} onName={setNameB} onBirth={setBirthB}
        />
      )}

      {personal && (
        <MatrixTable
          title={tab === 'compatibility' ? nameA || 'Партнёр 1' : 'Ваши арканы'}
          m={personal}
        />
      )}
      {tab === 'compatibility' && partner && (
        <MatrixTable title={nameB || 'Партнёр 2'} m={partner} />
      )}
      {compat && (
        <div className="card">
          <h3>Арканы пары</h3>
          <p>
            Тема союза: <b>аркан {compat.joint.coupleCharacter}</b> · Что держит вместе:{' '}
            <b>аркан {compat.joint.coupleHeart}</b> · Финансы пары:{' '}
            <b>аркан {compat.joint.coupleMoney}</b>
          </p>
        </div>
      )}

      {!leadMode && (
        <button disabled={!ready || busy || tab === 'personal'} onClick={buy}>
          {tab === 'compatibility'
            ? 'Полный PDF-разбор совместимости — 390 ₽'
            : 'Полный личный PDF-разбор — скоро'}
        </button>
      )}
      {error && <p style={{ color: '#b00020' }}>{error}</p>}

      {leadMode && !leadSent && (
        <div className="card stack">
          <p>
            Разбор для вашей комбинации арканов появится в ближайшие дни — мы дописываем
            расшифровки. Оставьте почту, пришлём письмо, как только он будет готов.
          </p>
          <input
            type="email" placeholder="you@example.com" value={leadEmail}
            onChange={(e) => setLeadEmail(e.target.value)}
          />
          <button disabled={busy || !leadEmail} onClick={sendLead}>
            Сообщить о готовности
          </button>
        </div>
      )}
      {leadSent && <p>Спасибо! Напишем, как только разбор будет готов.</p>}
    </div>
  );
}

function tryMatrix(birth: string): PersonalMatrix | null {
  try {
    return computePersonalMatrix(birth);
  } catch {
    return null;
  }
}

function TabButton(props: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      role="tab" aria-selected={props.active} onClick={props.onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 8,
        border: props.active ? '2px solid #6b5b8a' : '1px solid #ccc',
        background: props.active ? '#f3effa' : '#fff',
        fontWeight: props.active ? 600 : 400,
      }}
    >
      {props.children}
    </button>
  );
}

function PersonInputs(props: {
  title: string; name: string; birth: string;
  onName: (v: string) => void; onBirth: (v: string) => void;
}) {
  return (
    <fieldset className="card stack" style={{ gap: 8 }}>
      <legend>{props.title}</legend>
      <label>
        Имя{' '}
        <input value={props.name} maxLength={60} onChange={(e) => props.onName(e.target.value)} />
      </label>
      <label>
        Дата рождения{' '}
        <input type="date" value={props.birth} onChange={(e) => props.onBirth(e.target.value)} />
      </label>
    </fieldset>
  );
}

function MatrixTable({ title, m }: { title: string; m: PersonalMatrix }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <table>
        <tbody>
          {POSITION_LABELS.map(({ key, label }) => (
            <tr key={key}>
              <td>{label}</td>
              <td style={{ fontWeight: 600 }}>аркан {m.positions[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
