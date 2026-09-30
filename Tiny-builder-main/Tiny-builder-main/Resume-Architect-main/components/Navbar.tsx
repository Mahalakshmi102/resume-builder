import React, { useState } from 'react';
import { FileText, Cpu, Target, ShieldCheck, BarChart3, Download, Printer, Menu, X, Sparkles, UserCheck } from 'lucide-react';

export type NavTab = 'builder' | 'analyzer' | 'matcher' | 'evidence' | 'reports';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onLoadDemo: () => void;
  onDownloadWord: () => void;
  onDownloadPDF: () => void;
  onPrint: () => void;
  activeProfileName?: string;
}

const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onLoadDemo,
  onDownloadWord,
  onDownloadPDF,
  onPrint,
  activeProfileName = 'Joshva Rahul',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: any }[] = [
    { id: 'builder', label: 'Builder', icon: FileText },
    { id: 'analyzer', label: 'AI Analyzer', icon: Cpu },
    { id: 'matcher', label: 'Job Matcher', icon: Target },
    { id: 'evidence', label: 'Evidence', icon: ShieldCheck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center">
              <FileText size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                Resume<span className="text-blue-600">Architect</span>
              </span>
              <span className="hidden sm:inline-block ml-2.5 px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold text-[10px] rounded-full border border-blue-200 uppercase tracking-wide">
                Analyser AI
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right Header Actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onLoadDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 rounded-lg text-xs font-semibold transition-colors shadow-xs"
              title="Load complete Joshva Rahul profile with projects & evidence"
            >
              <Sparkles size={14} className="text-amber-600" />
              Load Demo Profile
            </button>

            {activeTab === 'builder' && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <button
                  onClick={onDownloadWord}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Export Word Document (.doc)"
                >
                  <Download size={14} /> Word
                </button>
                <button
                  onClick={onDownloadPDF}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Export Direct PDF"
                >
                  <FileText size={14} /> PDF
                </button>
                <button
                  onClick={onPrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                  title="Print or Vector PDF"
                >
                  <Printer size={14} /> Print / Vector PDF
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                {activeProfileName ? activeProfileName.charAt(0) : 'J'}
              </div>
            </div>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onLoadDemo}
              className="p-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-xs font-semibold flex items-center gap-1"
            >
              <Sparkles size={14} /> Demo
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {activeTab === 'builder' && (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={onDownloadWord}
                  className="py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg text-center"
                >
                  Word
                </button>
                <button
                  onClick={onDownloadPDF}
                  className="py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg text-center"
                >
                  PDF
                </button>
                <button
                  onClick={onPrint}
                  className="py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg text-center"
                >
                  Print
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
