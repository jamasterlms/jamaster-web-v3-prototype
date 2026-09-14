import { Card } from '@/components/ui/card';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUpRight, CirclePlay, Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeading } from '@/components/shared/primitives';
import {
  helpRole,
  roleLabels,
  tutorialFor,
  tutorialsFor,
  tutorialAsset,
  type Tutorial,
} from './help-model';
import { TutorialDialog } from './tutorial-dialog';
import { SupportRequest } from './support-request';
export function HelpCenterContent() {
  const location = useLocation(),
    params = new URLSearchParams(location.search);
  const role = helpRole(location.pathname, params.get('role'));
  const context = location.pathname === '/help' ? params.get('from') || '/' : location.pathname;
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState('Tümü'),
    [selected, setSelected] = useState<Tutorial | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null),
    search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setCategory('Tümü');
    setSelected(null);
    setQuery('');
  }, [role]);
  const play = (tutorial: Tutorial, element: HTMLButtonElement) => {
    opener.current = element;
    setSelected(tutorial);
  };
  const list = tutorialsFor(role),
    featured = tutorialFor(context, role);
  const filtered = list.filter(
    (t) =>
      (category === 'Tümü' || category === t.category) &&
      `${t.title} ${t.steps.map((s) => s.text).join(' ')}`
        .toLocaleLowerCase('tr')
        .includes(query.trim().toLocaleLowerCase('tr')),
  );
  return (
    <div className="help-center">
      <Card className="help-featured">
        <div className="help-featured-art">
          <img src={tutorialAsset(featured.id, 'webp')} alt="" />
          <span>
            <CirclePlay size={36} strokeWidth={1.4} />
          </span>
        </div>
        <div>
          <small>
            <BookOpen size={15} />
            {roleLabels[role]} rehberi · 3 adım
          </small>
          <h2>{featured.title}</h2>
          <p>Bulunduğunuz bölüm için kısa anlatım ve uygulama adımları.</p>
        </div>
        <Button onClick={(event) => play(featured, event.currentTarget)}>
          <CirclePlay size={18} />
          Rehberi izle
        </Button>
      </Card>
      <div className="section-caption">
        <h2>Kullanım rehberleri</h2>
        <span>{list.length} kısa anlatım</span>
      </div>
      <div className="help-search">
        <Search size={18} />
        <Input
          ref={search}
          aria-label="Kullanım rehberlerinde ara"
          placeholder="Ne yapmak istiyorsunuz?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="help-categories" aria-label="Rehber kategorileri">
        {['Tümü', ...new Set(list.map((t) => t.category))].map((item) => (
          <Button
            key={item}
            variant={item === category ? 'secondary' : 'ghost'}
            aria-pressed={item === category}
            onClick={() => setCategory(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      <div className="tutorial-grid">
        {filtered.map((t) => (
          <Card className="tutorial-card" key={t.id}>
            <Button type="button" variant="ghost" onClick={(event) => play(t, event.currentTarget)}>
              <span className="tutorial-card-visual">
                <img src={tutorialAsset(t.id, 'webp')} alt="" loading="lazy" />
                <span className="tutorial-play">
                  <CirclePlay size={30} strokeWidth={1.5} />
                </span>
                <small>00:24</small>
              </span>
              <span className="tutorial-card-info">
                <small>{t.category}</small>
                <strong>{t.title}</strong>
                <span>
                  3 adımda öğrenin
                  <ArrowUpRight size={16} />
                </span>
              </span>
            </Button>
          </Card>
        ))}
      </div>
      {!filtered.length && (
        <div className="help-empty">
          <p role="status">Bu aramayla eşleşen rehber yok.</p>
          <Button
            variant="ghost"
            onClick={() => {
              setQuery('');
              setCategory('Tümü');
              search.current?.focus();
            }}
          >
            Filtreleri temizle
          </Button>
        </div>
      )}
      <SupportRequest role={role} path={context} />
      {selected && selected.roles.includes(role) && (
        <TutorialDialog
          restoreFocusTo={opener}
          tutorial={selected}
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      )}
    </div>
  );
}
export function HelpPage() {
  return (
    <>
      <PageHeading
        title="Yardım merkezi"
        description="Rolünüze uygun kullanım videoları ve adım adım rehberler."
      />
      <HelpCenterContent />
    </>
  );
}
