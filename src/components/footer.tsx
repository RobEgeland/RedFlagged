import Link from 'next/link';
import { Twitter, Mail } from 'lucide-react';
import Logo from './logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 border-t border-slate-200">
      <div className="w-full py-12 px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Logo width={72} height={72} className="flex-shrink-0" />
              <span className="text-xl font-bold text-slate-900">
                RedFlagged
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              The decision tool for private-party used car buyers. Know if it&apos;s a deal, caution, or disaster before you buy.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="#analyze" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">Analyze a Deal</Link></li>
              <li><Link href="#pricing" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">Pricing</Link></li>
              <li><Link href="/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">Dashboard</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">How It Works</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">FAQs</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">Buyer Guide</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200">
          <div className="text-slate-400 text-sm mb-4 md:mb-0">
            © {currentYear} RedFlagged. All rights reserved.
          </div>
          
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">
              <span className="sr-only">Twitter</span>
              <Twitter className="h-5 w-5" />
            </a>
            <a href="mailto:hello@redflagged.com" className="text-slate-400 hover:text-slate-900 transition-colors">
              <span className="sr-only">Email</span>
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center max-w-3xl mx-auto leading-relaxed">
            RedFlagged provides analysis based on publicly available data and pricing algorithms. We cannot guarantee the accuracy of seller-provided information. 
            Always verify claims independently and consider a professional pre-purchase inspection before completing any vehicle purchase. 
            This tool is for informational purposes only and does not constitute professional automotive or financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
