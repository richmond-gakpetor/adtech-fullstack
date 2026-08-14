import type { Metadata } from "next"
import { Header } from "@/components/Header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Privacy Policy | Xposure GH",
  description: "How we collect, use, and protect your data on the Xposure GH platform",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Header showBrowse />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 text-lg">Last Updated: July 20, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 md:p-12">
          <div className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              At Xposure GH, we take your privacy seriously. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our platform.
            </p>
            <p className="text-gray-700 leading-relaxed">By using our services, you consent to the data practices described in this policy.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 leading-relaxed">We may collect the following types of personal information:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Contact information (name, email address, phone number, mailing address)</li>
              <li>Account credentials</li>
              <li>Payment information (processed securely through our payment partners)</li>
              <li>Business information for billboard owners</li>
              <li>Profile information and preferences</li>
              <li>Communications with our platform and support team</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.2 Usage Information</h3>
            <p className="text-gray-700 leading-relaxed">
              We automatically collect certain information about your device and how you interact with our platform,
              including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>IP address and device identifiers</li>
              <li>Browser type and operating system</li>
              <li>Pages viewed and features used</li>
              <li>Time spent on the platform and interaction patterns</li>
              <li>Referral sources</li>
              <li>Location information (with your permission)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed">We use the collected information for various purposes, including to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Verify user identity and prevent fraud</li>
              <li>Personalize your experience</li>
              <li>Communicate with you about our services, updates, and promotions</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed">We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>With billboard owners and advertisers to facilitate transactions</li>
              <li>With service providers who perform services on our behalf</li>
              <li>For legal purposes, including to comply with laws or respond to legal requests</li>
              <li>In connection with a business transfer, merger, or acquisition</li>
              <li>With your consent or at your direction</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">We do not sell your personal information to third parties for marketing purposes.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against
              unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p className="text-gray-700 leading-relaxed">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to
              use commercially acceptable means to protect your personal information, we cannot guarantee its absolute
              security.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed">Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Accessing, correcting, or deleting your personal information</li>
              <li>Restricting or objecting to our processing of your data</li>
              <li>Requesting portability of your data</li>
              <li>Withdrawing consent where processing is based on consent</li>
              <li>Opting out of marketing communications</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">To exercise these rights, please contact us using the information provided at the end of this policy.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar tracking technologies to collect information about your browsing activities and to
              remember your preferences. You can instruct your browser to refuse all cookies or to indicate when a cookie is
              being sent.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal
              information from children. If we learn that we have collected personal information from a child, we will take
              steps to delete that information.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. These
              countries may have different data protection laws. We will take appropriate measures to ensure that your
              personal information remains protected.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last
              Updated" date. We encourage you to review this Privacy Policy periodically.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <p className="text-gray-700 leading-relaxed">
                Email: support@xposuregh.com
                <br />
                Address: Nii Aryee Street, Accra, Ghana
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
