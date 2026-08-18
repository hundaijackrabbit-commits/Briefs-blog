import Link from "next/link";

export default function Home(){
  return <main className="home-minimal">
    <section className="home-prompt" aria-labelledby="home-title">
      <h1 id="home-title" className="sr-only">Briefs</h1>
      <form action="/brief-me" className="home-query" role="search">
        <label htmlFor="brief-home-q" className="home-query-prefix">Brief me on</label>
        <span className="home-query-field">
          <input id="brief-home-q" name="q" autoFocus autoComplete="off" spellCheck={false} aria-label="What should Briefs brief you on?" />
        </span>
        <button type="submit" className="home-query-submit" aria-label="Create brief">→</button>
      </form>
      <p className="home-hint">Ask about a company, person, technology, market, idea, or change.</p>
      <p className="home-hint"><Link href="/articles">Read Briefings →</Link></p>
    </section>
  </main>;
}
