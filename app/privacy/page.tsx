import type { Metadata } from 'next';
import { BRAND } from '@/data/brand';
import { BloodDefs, DaubLink } from '@/components/Daub';

const title = `Privacy policy · ${BRAND.name}`;
const description = `What the ${BRAND.name} site does with a visitor's data.`;
// the share images in app/ are not inherited once this page sets its own
// openGraph and twitter, so they are named again
const image = (url: string) => [{ url, width: 1200, height: 630, type: 'image/png' }];

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/privacy' },
  openGraph: { title, description, siteName: BRAND.name, type: 'website', url: '/privacy', images: image('/opengraph-image.png') },
  twitter: { card: 'summary_large_image', title, description, images: image('/twitter-image.png') },
};

/** What this site does with a visitor's data: very little, said plainly. */
export default function Privacy() {
  return (
    <main className="policy">
      <DaubLink className="policy__back" href="/" label="Return">Return</DaubLink>
      <h1 className="title">Privacy policy</h1>
      <div className="policy__body">
        <p>Last updated 24 October 2026.</p>
        <p>
          This site presents the {BRAND.name} keycap set. It sells nothing, has no forms and no
          newsletter, and it does not set cookies or use analytics or advertising trackers. On your
          own device (local storage) it remembers whether you turned the sound off and, if you enter
          the field station below, your sign-in to it. Nothing else is kept about you, except the
          field station register described below.
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

        <h2>The field station</h2>
        <p>
          The site has a hidden puzzle page. To enter it you choose a name; that name, how far you
          get and when, and any questions you put to its archive are stored in a database hosted by
          Neon (in Frankfurt) so the organisers can see who solved it. Use a nickname, not your
          real name. Questions to the archive are answered by Google&rsquo;s Gemini service, which
          receives the question text. See the <a href="https://neon.com/privacy-policy">Neon</a> and{' '}
          <a href="https://policies.google.com/privacy">Google</a> privacy policies. To have your
          entry removed, contact {BRAND.contact} with the name you used.
        </p>

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
        {/* the field station's access code, for whoever reads runes this far down: SKOGSRA */}
        <p className="policy__runes" aria-hidden="true">ᛊᚲᛟᚷᛊᚱᚨ</p>
      </div>
      <BloodDefs />
      <div className="grain" aria-hidden="true" />
    </main>
  );
}
