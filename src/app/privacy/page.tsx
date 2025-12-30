export const dynamic = 'force-dynamic';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-display font-bold text-ridge-700 mb-2">Privacy Policy</h1>
        <p className="text-stone-500 mb-8">Last updated: January 2025</p>

        <div className="prose prose-stone max-w-none">
          <p>
            What's Rollin' Local ("we," "us," or "our") operates whatsrollinlocal.com. This Privacy Policy explains how we collect, use, and protect your information when you use our website.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Information We Collect</h2>
          
          <p><strong>Information you provide:</strong></p>
          <ul className="list-disc pl-6 mb-4">
            <li>Email address (if you sign up for updates or create an account)</li>
            <li>Name and business information (if you register as a food truck or venue owner)</li>
            <li>Any other information you voluntarily submit through forms</li>
          </ul>

          <p><strong>Information collected automatically:</strong></p>
          <ul className="list-disc pl-6 mb-4">
            <li>Device information (browser type, operating system)</li>
            <li>Usage data (pages visited, time spent, clicks)</li>
            <li>IP address and approximate location</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide and improve our website and services</li>
            <li>Send you updates about food trucks and events (if you opt in)</li>
            <li>Communicate with food truck and venue owners about their listings</li>
            <li>Analyze website traffic and usage patterns</li>
            <li>Protect against fraud and abuse</li>
          </ul>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Analytics</h2>
          <p>
            We use analytics services (such as Google Analytics and/or Vercel Analytics) to understand how visitors use our site. These services may collect information about your visits, including pages viewed, time on site, and how you arrived at our site. This data is aggregated and anonymized.
          </p>
          <p>
            You can opt out of Google Analytics by installing the Google Analytics Opt-out Browser Add-on.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Cookies</h2>
          <p>We use cookies and similar technologies to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Remember your preferences</li>
            <li>Understand how you use our site</li>
            <li>Improve your experience</li>
          </ul>
          <p>
            You can control cookies through your browser settings, but disabling them may affect site functionality.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Sharing Your Information</h2>
          <p>We do not sell your personal information. We may share information with:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Service providers who help us operate our website (hosting, analytics, email)</li>
            <li>Law enforcement if required by law</li>
            <li>Other parties with your consent</li>
          </ul>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Data Security</h2>
          <p>
            We take reasonable measures to protect your information, but no internet transmission is 100% secure. We cannot guarantee absolute security.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Your Rights</h2>
          <p>You may:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Request access to your personal information</li>
            <li>Request correction or deletion of your data</li>
            <li>Opt out of marketing emails at any time</li>
            <li>Contact us with questions about your data</li>
          </ul>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Children's Privacy</h2>
          <p>
            Our website is not intended for children under 13. We do not knowingly collect information from children under 13.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated date.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at:<br />
            <a href="mailto:hello@whatsrollinlocal.com" className="text-ridge-600 hover:text-ridge-700 underline">hello@whatsrollinlocal.com</a>
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200">
          <a href="/" className="text-ridge-600 hover:text-ridge-700 font-semibold">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
