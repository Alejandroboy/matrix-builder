'use client';

// «Расшифровка вашей матрицы» — аккордеон разделов.
// Показывает глубину продукта до покупки: что уже открыто бесплатно
// и что входит в платный разбор. Никаких замков на том, чего мы не продаём.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PersonalMatrix } from '@matrix/engine';

interface ArcanaData {
  arcana: number;
  name: string;
  portraitShort: string;
  // Может отсутствовать, если API ещё не обновлён — рендер обязан это пережить
  positionNotes?: { center: string; heart: string; money: string };
}

type NoteKey = 'center' | 'heart' | 'money';

const SECTIONS: Array<{
  position: keyof PersonalMatrix['positions'];
  note: NoteKey;
  title: string;
  subtitle: string;
}> = [
  {
    position: 'center',
    note: 'center',
    title: 'Характер и зона комфорта',
    subtitle: 'центральный аркан — то, из чего вы живёте',
  },
  {
    position: 'heart',
    note: 'heart',
    title: 'Отношения',
    subtitle: 'под сердцем — какой партнёр вам подходит',
  },
  {
    position: 'money',
    note: 'money',
    title: 'Деньги',
    subtitle: 'под долларом — через что приходит доход',
  },
];

export default function ArcanaSections({ matrix }: { matrix: PersonalMatrix }) {
  const data = useArcanaData([
    matrix.positions.center,
    matrix.positions.heart,
    matrix.positions.money,
  ]);

  return (
    <section className="stack" style={{ marginTop: 32 }}>
      <h2>Расшифровка вашей матрицы</h2>

      <div>
        {SECTIONS.map((s, i) => {
          const arcana = matrix.positions[s.position];
          const item = data.get(arcana);
          return (
            <details key={s.position} className="acc-card" open={i === 0}>
              <summary>
                <span>
                  <strong style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>{s.title}</strong>
                  <span className="muted" style={{ display: 'block' }}>{s.subtitle}</span>
                </span>
                <span
                  className="num"
                  style={{ fontFamily: 'var(--serif)', fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                  {arcana}
                  {item ? ` · ${item.name}` : ''}
                </span>
              </summary>
              <div>
                {item ? (
                  <>
                    {item.positionNotes?.[s.note] && <p>{item.positionNotes[s.note]}</p>}
                    <p>{firstParagraph(item.portraitShort)}</p>
                    <p style={{ marginBottom: 0 }}>
                      <Link href={`/arkan/${arcana}`}>
                        Полный разбор аркана {arcana} — {item.name} →
                      </Link>
                    </p>
                  </>
                ) : (
                  <p className="muted" style={{ marginBottom: 0 }}>
                    Разбор аркана {arcana} ещё пишется. Схема и расчёт уже верные.
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function firstParagraph(text: string): string {
  return text.split('\n\n')[0];
}

/** Тянет разборы сразу для нескольких арканов; отсутствующие просто не попадают в map. */
function useArcanaData(arcana: number[]): Map<number, ArcanaData> {
  const [map, setMap] = useState<Map<number, ArcanaData>>(new Map());
  const key = arcana.join(',');

  useEffect(() => {
    let cancelled = false;
    const unique = [...new Set(arcana)];
    Promise.all(
      unique.map((n) =>
        fetch(`/api/arcana/${n}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      const next = new Map<number, ArcanaData>();
      for (const r of results) if (r) next.set(r.arcana, r);
      setMap(next);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return map;
}
