import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Cafe 4147</p>
        <h1>Order Intake</h1>
        <p className="subtext">
          This project is set up to collect cafe orders and write them to Airtable.
        </p>
        <Link className="home-link" href="/order">
          Open Order Form
        </Link>
      </section>
    </main>
  );
}
