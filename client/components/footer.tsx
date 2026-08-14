import Link from "next/link"

const socials = [
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@xposuregh",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.2 8.2 0 0 0 4.79 1.52V6.82a4.85 4.85 0 0 1-1.02-.13z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/xposuregh",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    name: "X",
    href: "https://www.x.com/xposuregh",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
]

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">XP</span>
              </div>
              <span className="text-2xl font-bold">Xposure GH</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Ghana's premier billboard marketplace connecting owners with advertisers. 
              Transform your advertising strategy with us.
            </p>
            <div className="flex items-center space-x-4 mt-6">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-6 text-lg">For Owners</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/list-billboard" className="hover:text-white transition-colors duration-200">
                  List Billboard
                </Link>
              </li>
              <li>
                <Link href="/owner-dashboard" className="hover:text-white transition-colors duration-200">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors duration-200">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6 text-lg">For Advertisers</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/browse" className="hover:text-white transition-colors duration-200">
                  Browse Billboards
                </Link>
              </li>
              <li>
                <Link href="/advertiser-dashboard" className="hover:text-white transition-colors duration-200">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-white transition-colors duration-200">
                  Reviews
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6 text-lg">Support</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/contact" className="hover:text-white transition-colors duration-200">
                  Contact Us
                </Link>
              </li>
              <li>
                <a 
                  href="https://glib-safflower-7cd.notion.site/Welcome-to-Xposure-GH-2ed6c05722c38026a8abd291ef3c88bc" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors duration-200"
                >
                  Blog
                </a>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy;{new Date().getFullYear()} Xposure GH. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
