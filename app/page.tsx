'use client';

import { useState } from 'react';

type Sfx = { title: string; query: string; category: string };

export default function Home() {
  const [mode, setMode] = useState<'scene' | 'search'>('scene');
  const [text, setText] = useState('');
  const [detail, setDetail] = useState('medium');
  const [results, setResults] = useState<Sfx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode, detail }),
      });

      const raw = await res.text();
      let data: any = null;

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`سرور پاسخ قابل خواندن نداد (${res.status}): ${raw.slice(0, 300)}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || `خطای سرور (${res.status})`);
      }

      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطای ناشناخته');
    } finally {
      setLoading(false);
    }
  }

  return <main className="app">
    <header className="top"><div className="brand">SFXR</div><div className="tagline">SOUND EFFECTS FOR PEOPLE WHO MAKE THINGS.</div></header>
    <section className="hero"><h1>صحنه رو بگو.<br/>صداهاشو پیدا کن.</h1><p>توضیح فارسی صحنه‌ات رو به عناصر صوتی قابل جست‌وجو تبدیل کن.</p>
      <div className="switch"><button className={mode==='scene'?'active':''} onClick={()=>setMode('scene')}>SCENE</button><button className={mode==='search'?'active':''} onClick={()=>setMode('search')}>SEARCH</button></div>
    </section>
    <section className="card">
      <textarea dir="rtl" value={text} onChange={e=>setText(e.target.value)} placeholder={mode==='scene'?'صحنه یا داستانت رو تعریف کن... مثلاً: یک مرد در یک خانه قدیمی نشسته، بیرون باران شدیدی می‌بارد، ناگهان صدای در می‌آید و چند نفر با عجله از راه‌پله بالا می‌روند.':'چه صدایی می‌خوای؟ مثلاً: صدای کشیده شدن صندلی روی زمین'} />
      <div className="controls">
        {mode==='scene' && <div className="details"><button className={detail==='low'?'active':''} onClick={()=>setDetail('low')}>کم</button><button className={detail==='medium'?'active':''} onClick={()=>setDetail('medium')}>متوسط</button><button className={detail==='high'?'active':''} onClick={()=>setDetail('high')}>زیاد</button><button className={detail==='insane'?'active':''} onClick={()=>setDetail('insane')}>خیلی زیاد</button></div>}
        <button className="primary" onClick={analyze} disabled={loading || !text.trim()}>{loading?'در حال تحلیل...':mode==='scene'?'پیدا کردن صداها':'تبدیل به سرچ انگلیسی'}</button>
      </div>
      {error && <div className="error">{error}</div>}
    </section>
    <section className="results"><div className="results-head"><h2>{mode==='scene'?'صداهای پیشنهادی صحنه':'عبارت جست‌وجوی پیشنهادی'}</h2>{results.length>0&&<span className="count">{results.length} RESULTS</span>}</div>
      {results.length===0 ? <div className="empty">هنوز چیزی پیدا نشده.</div> : results.map((r,i)=><div className="result" key={`${r.query}-${i}`}><span className="num">{String(i+1).padStart(2,'0')}</span><div><div className="rtitle">{r.title}</div><div className="query">{r.query}</div></div><span className="badge">{r.category}</span></div>)}
    </section>
    <footer className="footer">SFXR / v0.1 — built for filmmakers, editors & sound designers.</footer>
  </main>;
}
