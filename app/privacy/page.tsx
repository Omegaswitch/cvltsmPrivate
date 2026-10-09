import type { Metadata } from 'next';
import { BRAND } from '@/data/brand';

export const metadata: Metadata = { title: `Privacy policy · ${BRAND.name}` };

/** What this site does with a visitor's data: very little, said plainly. */
export default function Privacy() {
  return (
    <main className="policy">
      <a className="policy__back daub" href="/" data-label="Return"><span>Return</span></a>
      <h1 className="title">Privacy policy</h1>
      <div className="policy__body">
        <p>Last updated 9 October 2026.</p>
        <p>
          This site presents the {BRAND.name} keycap set. It sells nothing, has no accounts, no forms
          and no newsletter, and it does not set cookies or use analytics or advertising trackers.
        </p>

        <h2>What is collected</h2>
        <p>
          The site does not ask for or store personal data. Like any website, the servers that deliver
          it receive the technical details of each request (your IP address, browser, the page asked
          for and the time) because they are needed to send the page back.
        </p>

        <h2>Who handles it</h2>
        <ul>
          <li>
            <strong>Hosting:</strong> the site is hosted by Vercel, which keeps short-lived request logs
            for security and operation. See the <a href="https://vercel.com/legal/privacy-policy">Vercel privacy policy</a>.
          </li>
          <li>
            <strong>Fonts:</strong> some typefaces are loaded from Google Fonts, so your browser
            contacts Google&rsquo;s servers, which see your IP address. See the{' '}
            <a href="https://policies.google.com/privacy">Google privacy policy</a>.
          </li>
          <li>
            <strong>Vendors:</strong> links to vendors take you to their own sites, which have their
            own policies.
          </li>
        </ul>

        <h2>Your rights</h2>
        <p>
          Where data protection law such as the GDPR applies, you may ask what data about you is held,
          and ask for it to be corrected or deleted. As the site itself stores nothing about you, such
          requests usually concern the services above.
        </p>

        <h2>Contact</h2>
        <p>
          For questions about this policy, contact {BRAND.contact}.
        </p>
      </div>
      <div className="grain" aria-hidden="true" />
    </main>
  );
}
