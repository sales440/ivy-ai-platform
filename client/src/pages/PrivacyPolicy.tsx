/**
 * Privacy Policy Page
 * Required for LinkedIn App creation and GDPR compliance
 */
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-foreground/90 leading-relaxed">
              Ivy.AI Platform ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our intelligent agent orchestration system. By using Ivy.AI Platform, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">2.1 Personal Information</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We collect personal information that you voluntarily provide when using our platform, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Name and email address (for account creation and authentication)</li>
              <li>Company information (name, industry, size)</li>
              <li>Professional details (job title, role)</li>
              <li>Contact information (phone number, business address)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">2.2 Usage Data</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We automatically collect certain information when you access our platform:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage patterns (pages visited, features used, time spent)</li>
              <li>Performance metrics (response times, error rates)</li>
              <li>AI agent interactions and workflow executions</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">2.3 Third-Party Integration Data</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              When you connect third-party services (LinkedIn, CRM systems, email providers), we may collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>LinkedIn profile information (name, headline, connections)</li>
              <li>LinkedIn content (posts, articles, engagement metrics)</li>
              <li>CRM data (leads, contacts, opportunities)</li>
              <li>Email campaign data (recipients, open rates, click rates)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We use collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li><strong>Service Delivery:</strong> To provide, maintain, and improve our AI agent platform</li>
              <li><strong>Personalization:</strong> To customize your experience and deliver relevant content</li>
              <li><strong>Communication:</strong> To send you updates, notifications, and support messages</li>
              <li><strong>Analytics:</strong> To analyze usage patterns and optimize platform performance</li>
              <li><strong>Marketing Automation:</strong> To execute AI-driven marketing campaigns on your behalf</li>
              <li><strong>LinkedIn Integration:</strong> To publish content, manage connections, and track engagement on LinkedIn</li>
              <li><strong>Security:</strong> To detect, prevent, and address technical issues and fraudulent activity</li>
              <li><strong>Compliance:</strong> To comply with legal obligations and enforce our terms of service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. LinkedIn Integration</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Our platform integrates with LinkedIn to provide automated content publishing and engagement features. When you authorize our LinkedIn integration:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>We access your LinkedIn profile information to personalize content</li>
              <li>We publish posts, articles, and updates on your behalf using AI-generated content</li>
              <li>We retrieve engagement metrics (likes, comments, shares) to measure performance</li>
              <li>We store LinkedIn access tokens securely and use them only for authorized actions</li>
              <li>You can revoke LinkedIn access at any time through your LinkedIn account settings</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mt-4">
              We comply with LinkedIn's API Terms of Use and do not share your LinkedIn data with unauthorized third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li><strong>Service Providers:</strong> With trusted third-party vendors who assist in platform operations (hosting, analytics, email delivery)</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share specific information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-foreground/90 leading-relaxed">
              We implement industry-standard security measures to protect your information, including encryption in transit and at rest, secure authentication protocols, regular security audits, and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-foreground/90 leading-relaxed">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and associated data at any time by contacting us at <a href="mailto:sales@rpcommercegroupllc.com" className="text-primary hover:underline">sales@rpcommercegroupllc.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Your Rights (GDPR Compliance)</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              If you are located in the European Economic Area (EEA), you have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Restriction:</strong> Limit how we process your data</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw Consent:</strong> Revoke consent for data processing at any time</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mt-4">
              To exercise these rights, contact us at <a href="mailto:sales@rpcommercegroupllc.com" className="text-primary hover:underline">sales@rpcommercegroupllc.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Cookies and Tracking Technologies</h2>
            <p className="text-foreground/90 leading-relaxed">
              We use cookies and similar tracking technologies to enhance user experience, analyze platform usage, and deliver personalized content. You can control cookie preferences through your browser settings. Disabling cookies may limit certain platform features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p className="text-foreground/90 leading-relaxed">
              Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
            <p className="text-foreground/90 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-foreground/90 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of the platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-muted p-6 rounded-lg">
              <p className="font-semibold mb-2">Ivy.AI Platform</p>
              <p className="text-foreground/90">Email: <a href="mailto:sales@rpcommercegroupllc.com" className="text-primary hover:underline">sales@rpcommercegroupllc.com</a></p>
              <p className="text-foreground/90 mt-2">We will respond to your inquiry within 30 days.</p>
            </div>
          </section>

          <section className="border-t pt-8 mt-12">
            <p className="text-sm text-muted-foreground">
              This Privacy Policy is effective as of the date stated above and applies to all users of Ivy.AI Platform. By using our services, you acknowledge that you have read and understood this policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
