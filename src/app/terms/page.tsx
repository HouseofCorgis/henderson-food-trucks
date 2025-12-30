export const dynamic = 'force-dynamic';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-display font-bold text-ridge-700 mb-2">Terms of Service</h1>
        <p className="text-stone-500 mb-8">Last updated: January 2025</p>

        <div className="prose prose-stone max-w-none">
          <p>
            Welcome to What's Rollin' Local! By using our website at whatsrollinlocal.com, you agree to these Terms of Service.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">What We Do</h2>
          <p>
            What's Rollin' Local is an informational website that helps people find food trucks, breweries, and events in Western North Carolina. We aggregate schedule information to make it easier to discover local food options.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Schedule Accuracy Disclaimer</h2>
          <p>
            <strong>Important:</strong> Schedule information on our site is provided for convenience only and may not be accurate. Food trucks may change locations, cancel appearances, or adjust hours without notice.
          </p>
          <p><strong>We are not responsible if:</strong></p>
          <ul className="list-disc pl-6 mb-4">
            <li>A food truck doesn't show up as scheduled</li>
            <li>Hours or locations have changed</li>
            <li>Events are canceled or modified</li>
            <li>Any other schedule inaccuracies occur</li>
          </ul>
          <p>
            <strong>Always confirm directly with the food truck or venue before making plans.</strong>
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">User Accounts (Food Truck & Venue Owners)</h2>
          <p>If you create an account to manage your food truck or venue listing:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>You are responsible for keeping your login credentials secure</li>
            <li>You agree to provide accurate information about your business</li>
            <li>You may update your schedule and business information at any time</li>
            <li>We reserve the right to remove or modify listings at our discretion</li>
          </ul>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Scrape, copy, or republish our content without permission</li>
            <li>Use automated tools to access our site excessively</li>
            <li>Submit false or misleading information</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Use our site for any illegal purpose</li>
            <li>Harass or harm other users</li>
          </ul>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Intellectual Property</h2>
          <p>
            All content on What's Rollin' Local, including text, graphics, logos, and design, is owned by us or our licensors and is protected by copyright law.
          </p>
          <p>
            Food truck and venue owners retain rights to their own business names, logos, and descriptions they provide.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Limitation of Liability</h2>
          <p>To the fullest extent permitted by law:</p>
          <p>
            <strong>What's Rollin' Local is provided "as is" without warranties of any kind.</strong> We do not guarantee that our site will be error-free, secure, or continuously available.
          </p>
          <p><strong>We are not liable for:</strong></p>
          <ul className="list-disc pl-6 mb-4">
            <li>Indirect, incidental, or consequential damages</li>
            <li>Loss of profits or data</li>
            <li>Damages resulting from schedule inaccuracies</li>
            <li>Any actions you take based on information on our site</li>
            <li>Issues with third-party food trucks, venues, or services</li>
          </ul>
          <p>
            Our total liability for any claim is limited to the amount you paid us (if any) in the 12 months before the claim.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless What's Rollin' Local and its owners from any claims, damages, or expenses arising from your use of our site or violation of these terms.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Business Listings</h2>
          <p>
            What's Rollin' Local lists publicly available information about food trucks, venues, and events in our area. We gather this information from public sources such as social media, websites, and community calendars.
          </p>
          <p>
            If you are a food truck or venue owner and would like your listing updated or removed, contact us at <a href="mailto:hello@whatsrollinlocal.com" className="text-ridge-600 hover:text-ridge-700 underline">hello@whatsrollinlocal.com</a> and we will respond within 48 hours.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Third-Party Links</h2>
          <p>
            Our site may contain links to third-party websites (food truck social media, venue websites, etc.). We are not responsible for the content or practices of these external sites.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Changes to These Terms</h2>
          <p>
            We may update these Terms of Service at any time. Continued use of our site after changes constitutes acceptance of the new terms.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Termination</h2>
          <p>
            We reserve the right to suspend or terminate access to our site for any user who violates these terms or for any other reason at our discretion.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Governing Law</h2>
          <p>
            These terms are governed by the laws of the State of North Carolina, without regard to conflict of law principles.
          </p>

          <h2 className="text-xl font-display font-bold text-ridge-600 mt-8 mb-4">Contact Us</h2>
          <p>
            If you have questions about these Terms of Service, contact us at:<br />
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
