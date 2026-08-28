import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCurrentMarket } from '@/lib/market/request';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Protection, Privacy & Consent | Jobmatchly',
  description:
    'Jobmatchly Data Protection, Privacy and Candidate Consent Agreement — your rights, how we use your data, and how we share it with recruiters.',
};

/* ─── Market-specific content maps ─── */
const CONTENT = {
  ZA: {
    marketLabel: 'South Africa',
    marketBadge: 'ZA · South Africa',
    websiteUrl: 'https://jobmatchly.co.za',
    websiteLabel: 'jobmatchly.co.za',
    supportEmail: 'support@jobmatchly.co.za',
    lawRef:
      "South Africa's Protection of Personal Information Act (POPIA), and where applicable, the European Union General Data Protection Regulation (GDPR) and other applicable employment and data protection regulations.",
    lawDetail:
      'As a company registered in South Africa, Jobmatchly is committed to full compliance with POPIA. Your personal information is processed lawfully, fairly, and in a transparent manner. You have the right to lodge a complaint with the Information Regulator of South Africa.',
    companyNote:
      'Jobmatchly is a product of Point Pro POS Solutions, a company registered in South Africa.',
    consentVersion: 'ZA-2026-v2',
  },
  ZW: {
    marketLabel: 'Zimbabwe',
    marketBadge: 'ZW · Zimbabwe',
    websiteUrl: 'https://jobmatchly.site',
    websiteLabel: 'jobmatchly.site',
    supportEmail: 'support@jobmatchly.site',
    lawRef:
      "Zimbabwe's Data Protection Act, South Africa's Protection of Personal Information Act (POPIA) (as the platform is operated by a South African registered entity), and where applicable the European Union General Data Protection Regulation (GDPR) and other applicable employment and data protection regulations.",
    lawDetail:
      'Jobmatchly operates under South African company law and is committed to responsible data handling in all markets. Zimbabwean users may also exercise rights under Zimbabwe data protection legislation where applicable.',
    companyNote:
      'Jobmatchly is a product of Point Pro POS Solutions, a company registered in South Africa, operating across African markets including Zimbabwe.',
    consentVersion: 'ZW-2026-v2',
  },
} as const;

/* ─── Reusable section heading ─── */
function Section({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">
        {num}. {title}
      </h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function SubSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <p className="font-medium text-foreground/80 mb-2">{title}</p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default async function TermsPage() {
  const market = getCurrentMarket();
  const c = CONTENT[market] ?? CONTENT.ZW;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Page hero */}
      <div className="bg-muted/20 border-b border-border/50">
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-4">
            {c.marketBadge}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Data Protection, Privacy &amp; Candidate Consent Agreement
          </h1>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><span className="text-foreground/70 font-medium">Effective Date:</span> 10 May 2026</p>
            <p><span className="text-foreground/70 font-medium">Company:</span> Jobmatchly (Point Pro POS Solutions)</p>
            <p>
              <span className="text-foreground/70 font-medium">Website:</span>{' '}
              <a href={c.websiteUrl} className="text-primary hover:underline">{c.websiteLabel}</a>
            </p>
            <p>
              <span className="text-foreground/70 font-medium">Contact:</span>{' '}
              <a href={`mailto:${c.supportEmail}`} className="text-primary hover:underline">{c.supportEmail}</a>
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-12">

        {/* Intro callout */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 mb-10 text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground mb-2">Please read this agreement carefully.</p>
          <p>
            By creating an account, uploading your CV, applying for jobs, or using any Jobmatchly service,
            you agree to all terms outlined in this agreement. {c.companyNote}
          </p>
        </div>

        <Section num={1} title="Introduction">
          <p>
            Welcome to Jobmatchly — an AI-powered employment and talent platform designed to help job seekers
            connect with employers, recruiters, recruitment agencies, and talent partners locally and globally.
          </p>
          <p>As Jobmatchly evolves, the platform may provide:</p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>Job advertising services</li>
            <li>AI-powered job matching and candidate recommendations</li>
            <li>Recruitment and staffing support</li>
            <li>Talent discovery tools for employers</li>
            <li>Candidate profile sharing with verified recruiters and hiring organisations</li>
            <li>Remote work and international employment opportunities</li>
            <li>Employment analytics and workforce insights</li>
          </ul>
          <p>
            This Data Protection, Privacy &amp; Candidate Consent Agreement explains what information we collect,
            how we use and share it, your rights regarding your personal data, and your consent when using
            Jobmatchly.
          </p>
        </Section>

        <Section num={2} title="Information We Collect">
          <p>We may collect the following categories of information:</p>

          <SubSection
            title="2.1 Personal Information"
            items={[
              'Full name',
              'Email address',
              'Phone number',
              'Date of birth (where necessary)',
              'Location and country of residence',
              'Professional profile information',
              'LinkedIn or portfolio links',
              'Profile photo (optional)',
            ]}
          />

          <SubSection
            title="2.2 Employment & Career Information"
            items={[
              'CVs and resumes',
              'Employment history',
              'Skills and qualifications',
              'Certifications and licences',
              'Salary expectations',
              'Work eligibility and visa information',
              'Education records',
              'Interview feedback',
              'Career preferences, availability, and employment status',
              'Job application history',
            ]}
          />

          <SubSection
            title="2.3 Platform Usage Information"
            items={[
              'Device information and browser type',
              'IP address and login activity',
              'User interactions within the platform',
              'AI matching and recommendation activity',
            ]}
          />

          <SubSection
            title="2.4 Communications"
            items={[
              'Records of communications between users, employers, recruiters, and Jobmatchly support teams',
            ]}
          />
        </Section>

        <Section num={3} title="How We Use Your Information">
          <p>Jobmatchly may use your information to:</p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>Create and manage your profile</li>
            <li>Match you with job opportunities</li>
            <li>Recommend you to recruiters and employers</li>
            <li>Improve AI-driven candidate matching systems</li>
            <li>Contact you about job opportunities</li>
            <li>Verify candidate qualifications and employment readiness</li>
            <li>Provide analytics and platform improvements</li>
            <li>Prevent fraud, abuse, or unauthorised access</li>
            <li>Comply with legal and regulatory obligations</li>
            <li>Support international and remote job placement opportunities</li>
          </ul>
        </Section>

        <Section num={4} title="Sharing Your Profile With Recruiters">
          <p className="font-medium text-foreground">
            We do not share your profile with recruiters unless you switch this on yourself.
          </p>
          <p>
            Recruiter visibility is off by default. Creating an account, uploading a CV, or using any
            other part of Jobmatchly does not make you discoverable to recruiters. It becomes active
            only when you turn on <em>Let recruiters find you</em> in your profile settings, and it
            stops the moment you turn it off.
          </p>

          <p className="mt-3">While it is switched on, verified recruiters may see:</p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>Your name and professional headline</li>
            <li>Your city and country</li>
            <li>Your profession, experience level, and the skills listed on your profile</li>
          </ul>

          <p className="mt-3">They will not see:</p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>Your email address or phone number</li>
            <li>CV files you have uploaded, or documents you have tailored</li>
            <li>Any contact details, unless you accept a recruiter&apos;s approach first</li>
          </ul>

          <p className="mt-3">
            Where a recruiter wishes to contact you, we pass the request to you and you decide whether
            to respond. Your contact details are released only if you accept.
          </p>
          <p className="mt-3">
            You may withdraw at any time from your profile settings, without giving a reason and
            without affecting any other part of your account. Withdrawal removes you from recruiter
            searches immediately. We keep a dated record of when you granted and withdrew this
            permission, which exists so that both you and we can establish what was agreed and when.
          </p>
          <p className="mt-3">
            Where you have switched this on, opportunities may be shared with verified recruitment
            partners in {c.marketLabel}, other African markets, and with international or remote-first
            employers. Jobmatchly works only with recruitment partners who accept written obligations
            covering how they may use what they see.
          </p>
        </Section>

        <Section num={5} title="Future Talent Marketplace & Data Platform">
          <p>
            As Jobmatchly evolves into a broader employment and workforce intelligence platform, users
            acknowledge that Jobmatchly may:
          </p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>Build employer and recruiter access tools</li>
            <li>Enable recruiter subscriptions and talent sourcing tools</li>
            <li>Facilitate direct employer-to-candidate connections</li>
            <li>Develop workforce analytics and labour market insights</li>
            <li>Provide AI-driven talent discovery services</li>
            <li>Offer premium recruitment and staffing services</li>
          </ul>
          <p className="mt-3">
            These are directions of travel, not services we operate today. None of them changes the rule
            in section 4: your profile is shared with recruiters only while you have switched that on.
            Privacy controls are not conditional on what we build — you can update your visibility
            preferences, remove yourself from candidate discovery, and modify or delete your profile
            information at any time, from your profile settings.
          </p>
        </Section>

        <Section num={6} title="Data Protection & Security">
          <p>
            Jobmatchly takes reasonable technical and organisational measures to protect user data from
            unauthorised access, data loss, misuse, alteration, and disclosure. Security measures may include:
          </p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>Encrypted data transmission (HTTPS/TLS)</li>
            <li>Secure cloud storage with access controls</li>
            <li>Authentication systems and session management</li>
            <li>Internal data access limitations</li>
          </ul>
          <p className="mt-3">
            However, no online platform can guarantee absolute security. Users remain responsible for
            protecting their account credentials.
          </p>
        </Section>

        <Section num={7} title="Applicable Law & International Compliance">
          <p>
            Jobmatchly aims to operate in compliance with {c.lawRef}
          </p>
          <p className="mt-3">{c.lawDetail}</p>
          <p className="mt-3">
            Depending on platform growth and operations, user data may be processed or stored in multiple
            jurisdictions. Jobmatchly will use appropriate safeguards when transferring data internationally.
          </p>
        </Section>

        <Section num={8} title="Your Rights">
          <p>You may have the right to:</p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>Access your personal data held by Jobmatchly</li>
            <li>Correct inaccurate or outdated information</li>
            <li>Request deletion of your data (subject to legal and operational limitations)</li>
            <li>Withdraw certain forms of consent</li>
            <li>Request restrictions on how your data is processed</li>
            <li>Opt out of marketing communications at any time</li>
            <li>Request a copy of information stored about you</li>
          </ul>
          <p className="mt-3">
            Certain information may be retained where legally required or operationally necessary.
            To exercise your rights, contact:{' '}
            <a href={`mailto:${c.supportEmail}`} className="text-primary hover:underline">{c.supportEmail}</a>
          </p>
        </Section>

        <Section num={9} title="Data Retention">
          <p>Jobmatchly may retain candidate information for:</p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>Ongoing recruitment opportunities and talent matching purposes</li>
            <li>Legal and compliance obligations</li>
            <li>Platform analytics and service improvements</li>
          </ul>
          <p className="mt-3">
            Inactive accounts and outdated information may be archived or deleted periodically.
          </p>
          <p className="mt-3">
            <strong>Website usage measurement.</strong> To understand which parts of the platform are used,
            Jobmatchly records anonymous page-view records containing the page visited, the referring website,
            a general device type, and a country code. These records are stored under a random identifier held
            in a first-party cookie named <code>jm_vid</code>, which is used only to count unique visitors.
            <strong> We do not store your IP address</strong>, and these records are not linked to your account
            or to any information that identifies you. They are automatically deleted after approximately 90 days.
          </p>
        </Section>

        <Section num={10} title="Third-Party Services">
          <p>
            Jobmatchly may use third-party providers and integrations, including cloud hosting providers,
            analytics tools, communication services, recruitment integrations, payment processors, and AI
            and automation tools. These providers may process data on behalf of Jobmatchly under appropriate
            confidentiality and security obligations.
          </p>
        </Section>

        <Section num={11} title="Employer & Recruiter Responsibilities">
          <p>Employers, recruiters, and staffing partners using Jobmatchly agree to:</p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>Use candidate information only for lawful recruitment purposes</li>
            <li>Maintain confidentiality of candidate information</li>
            <li>Avoid discriminatory or unlawful hiring practices</li>
            <li>Comply with applicable employment and privacy laws</li>
          </ul>
          <p className="mt-3">
            Jobmatchly reserves the right to suspend or remove partners who misuse candidate data.
          </p>
        </Section>

        <Section num={12} title="Marketing & Communications">
          <p>Jobmatchly may send users job alerts, platform updates, career opportunities, recruitment
            campaigns, newsletters, and AI-generated recommendations.</p>
          <p className="mt-2">
            Users may unsubscribe from non-essential communications at any time via account settings or by
            contacting <a href={`mailto:${c.supportEmail}`} className="text-primary hover:underline">{c.supportEmail}</a>.
          </p>
        </Section>

        <Section num={13} title="Limitation of Liability">
          <p>Jobmatchly does not guarantee employment placement, recruiter responses, interview
            opportunities, job offers, or continuous platform availability.</p>
          <p className="mt-2">
            Users remain responsible for verifying employers, reviewing opportunities, and protecting
            sensitive information shared during recruitment processes.
          </p>
        </Section>

        <Section num={14} title="Changes to This Agreement">
          <p>
            Jobmatchly may update this agreement from time to time as the platform evolves. Users will be
            notified of material changes through the website, application, or email communications.
            Continued use of Jobmatchly after updates constitutes acceptance of the revised terms.
          </p>
        </Section>

        <Section num={15} title="Contact Information">
          <p>For questions regarding this agreement or data protection matters, contact:</p>
          <div className="mt-3 rounded-md border border-border/50 bg-muted/30 p-4 text-foreground/80">
            <p className="font-semibold">Jobmatchly</p>
            <p>Point Pro POS Solutions</p>
            <p>
              Email:{' '}
              <a href={`mailto:${c.supportEmail}`} className="text-primary hover:underline">{c.supportEmail}</a>
            </p>
            <p>
              Website:{' '}
              <a href={c.websiteUrl} className="text-primary hover:underline">{c.websiteLabel}</a>
            </p>
          </div>
        </Section>

        {/* Consent Acknowledgement highlight */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">16. Consent Acknowledgement</h2>
          <p className="text-sm text-muted-foreground mb-3">
            By creating an account or using Jobmatchly services, you acknowledge that:
          </p>
          <ul className="list-disc list-inside pl-2 space-y-2 text-sm text-muted-foreground">
            <li>You have read and understood this agreement</li>
            <li>You consent to the processing of your information as described above</li>
            <li>
              You authorise Jobmatchly to share relevant employment-related information with verified
              recruiters and employers for talent matching and recruitment purposes
            </li>
            <li>
              You understand that Jobmatchly may evolve into a broader employment and talent data platform
            </li>
            <li>
              You may withdraw certain permissions subject to legal and operational limitations by
              contacting us at{' '}
              <a href={`mailto:${c.supportEmail}`} className="text-primary hover:underline">{c.supportEmail}</a>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-primary/20">
            <p className="text-xs text-muted-foreground">
              Agreement version: <span className="font-mono">{c.consentVersion}</span> &nbsp;·&nbsp;
              Market: {c.marketLabel} &nbsp;·&nbsp; Effective: 10 May 2026
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row gap-3 items-center justify-between text-sm text-muted-foreground">
          <p>Ready to get started?</p>
          <div className="flex gap-3">
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Create account
            </Link>
            <span>·</span>
            <Link href="/auth/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
