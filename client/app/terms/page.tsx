import type { Metadata } from "next"
import { Header } from "@/components/Header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Terms of Service | Xposure GH",
  description: "Terms and conditions for using the Xposure GH platform",
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Header showBrowse />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 text-lg">Last Updated: June 11, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 md:p-12">
          <div className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using the Xposure GH platform, you agree to be bound by these Terms of Service. If
              you do not agree to these terms, please do not use our services.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              Xposure GH provides an online platform connecting billboard owners with advertisers seeking to rent
              advertising space. Our services include listing, browsing, booking, and payment processing for billboard
              advertising spaces.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
            <p className="text-gray-700 leading-relaxed">
              To access certain features of our platform, you must register for an account. You are responsible for
              maintaining the confidentiality of your account information and for all activities that occur under your
              account.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You agree to provide accurate, current, and complete information during registration and to update such
              information to keep it accurate, current, and complete.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Listing and Booking Policies</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">For Billboard Owners:</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You must have the legal right to list and rent the billboard spaces you offer on our platform.</li>
              <li>All listings must accurately represent the billboard's location, size, visibility, and condition.</li>
              <li>You are responsible for setting your rates and availability.</li>
              <li>You must honor bookings made through our platform according to the terms agreed upon.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">For Advertisers:</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You must comply with all applicable advertising laws and regulations.</li>
              <li>Content displayed on billboards must not be illegal, offensive, or violate third-party rights.</li>
              <li>You are responsible for providing print-ready artwork that meets the specifications provided.</li>
              <li>Cancellations are subject to the policies specified by the billboard owner.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Payments and Fees</h2>
            <p className="text-gray-700 leading-relaxed">
              Xposure GH charges service fees for successful transactions on our platform. These fees are clearly
              displayed before booking completion.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Payment processing is handled through our secure payment partners. By using our services, you agree to their
              terms and conditions as well.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Prohibited Activities</h2>
            <p className="text-gray-700 leading-relaxed">Users are prohibited from:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Violating any applicable laws or regulations</li>
              <li>Infringing on intellectual property rights</li>
              <li>Posting false, misleading, or deceptive content</li>
              <li>Attempting to manipulate our platform's algorithms or ratings</li>
              <li>Using our platform to distribute malware or other harmful code</li>
              <li>Engaging in any activity that disrupts or interferes with our services</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Content Ownership and License</h2>
            <p className="text-gray-700 leading-relaxed">
              Users retain ownership of the content they submit to our platform. By posting content, you grant Xposure
              GH a non-exclusive, worldwide, royalty-free license to use, display, and distribute that content in
              connection with our services.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              Xposure GH is not liable for disputes between users, the content of advertisements, or damages
              arising from the use of our services. Our liability is limited to the amount paid by you for the specific
              service in question.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to terminate or suspend accounts that violate these terms or for any other reason at our
              discretion. Users may terminate their accounts at any time.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may modify these terms at any time. Continued use of our services after changes constitutes acceptance of
              the modified terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">These terms are governed by the laws of Ghana, without regard to its conflict of law provisions.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">For questions about these Terms of Service, please contact us at legal@xposuregh.com.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
