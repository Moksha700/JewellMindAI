import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Download, 
  Printer, 
  Search, 
  X, 
  Diamond, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  Compass, 
  FileText, 
  CheckCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { KNOWLEDGE_BASE_DATA, KBCategory, KBArticle } from '../../data/knowledgeBaseData';
import { generateKnowledgeBasePDF } from '../../utils/pdfGenerator';
import { useToast } from '../../context/ToastContext';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticleId, setActiveArticleId] = useState<string>('gemini-orchestration');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const { showToast } = useToast();

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'Diamond':
        return <Diamond className="w-4 h-4 text-amber-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4 text-amber-500" />;
      case 'Eye':
        return <Eye className="w-4 h-4 text-amber-500" />;
      case 'Compass':
        return <Compass className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-amber-500" />;
    }
  };

  // Filter articles based on search & category
  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const allArticles: (KBArticle & { categoryName: string; categoryId: string })[] = [];

    KNOWLEDGE_BASE_DATA.forEach(cat => {
      if (selectedCategory !== 'all' && cat.id !== selectedCategory) return;

      cat.articles.forEach(art => {
        const matchesQuery = 
          !q ||
          art.title.toLowerCase().includes(q) ||
          art.summary.toLowerCase().includes(q) ||
          art.content.some(c => c.toLowerCase().includes(q)) ||
          art.category.toLowerCase().includes(q);

        if (matchesQuery) {
          allArticles.push({
            ...art,
            categoryName: cat.name,
            categoryId: cat.id,
          });
        }
      });
    });

    return allArticles;
  }, [searchQuery, selectedCategory]);

  const activeArticle = useMemo(() => {
    if (filteredArticles.length === 0) return null;
    const found = filteredArticles.find(a => a.id === activeArticleId);
    return found || filteredArticles[0];
  }, [filteredArticles, activeArticleId]);

  const handleDownloadPDF = () => {
    try {
      setDownloadingPdf(true);
      generateKnowledgeBasePDF();
      showToast('Knowledge Base PDF generated and downloaded successfully!', 'success');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      showToast('Could not generate PDF. Please try again.', 'error');
    } finally {
      setTimeout(() => setDownloadingPdf(false), 800);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kb-modal-title"
    >
      <div className="bg-[#FAF8F5] w-full max-w-6xl h-[92vh] rounded-3xl border border-[#E7E2D8] shadow-2xl flex flex-col overflow-hidden text-[#1A1715] font-sans-clean">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 bg-[#1A1715] text-white flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-sm">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="kb-modal-title" className="font-serif-luxury text-xl font-bold text-white tracking-tight">
                  JewelMind AI Knowledge Base
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30 uppercase tracking-wider">
                  v2.4 Manual
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Official guide to Gemini 2.5 architecture, 4Cs diamond science, metallurgy, and virtual try-on
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download PDF CTA */}
            <button
              id="kb-download-pdf-button"
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#1A1715] font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Download Complete Knowledge Base as print-ready PDF"
            >
              <Download className="w-4 h-4 text-[#1A1715]" />
              <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF (Full KB)'}</span>
            </button>

            {/* Print button */}
            <button
              id="kb-print-button"
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700"
              title="Print document"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              id="kb-close-modal-button"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700 ml-1"
              aria-label="Close Knowledge Base"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SEARCH & CATEGORY BAR */}
        <div className="px-6 py-3.5 bg-white border-b border-[#E7E2D8] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="kb-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics (e.g., 4Cs, Gemini 2.5, Platinum, Try-On, RLS)..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 hover:bg-stone-100/70 focus:bg-white text-xs sm:text-sm text-stone-800 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-stone-400"
            />
          </div>

          {/* Categories Horizontal Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#1A1715] text-amber-300 shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Modules
            </button>
            {KNOWLEDGE_BASE_DATA.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-[#1A1715] text-amber-300 shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {getCategoryIcon(cat.iconName)}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MODAL BODY (TWO COLUMNS: SIDEBAR + ARTICLE CONTENT) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: ARTICLE LIST */}
          <div className="w-full md:w-80 lg:w-96 border-r border-[#E7E2D8] bg-white/70 overflow-y-auto p-4 space-y-2 flex-shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-2 mb-2 flex items-center justify-between">
              <span>Articles ({filteredArticles.length})</span>
              <span className="text-amber-600 font-medium">Ready for PDF</span>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="text-center py-10 px-4 text-stone-400 space-y-2">
                <Search className="w-6 h-6 mx-auto opacity-40" />
                <p className="text-xs">No articles matched your search.</p>
              </div>
            ) : (
              filteredArticles.map(art => {
                const isSelected = activeArticle?.id === art.id;
                return (
                  <button
                    key={art.id}
                    onClick={() => setActiveArticleId(art.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-300/80 shadow-sm ring-1 ring-amber-400/40'
                        : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                        {art.categoryName}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-amber-600 translate-x-0.5' : 'text-stone-400'}`} />
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm text-stone-900 leading-snug line-clamp-2">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* RIGHT: MAIN ARTICLE VIEWER */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#FAF8F5]">
            {activeArticle ? (
              <article className="max-w-3xl mx-auto space-y-6">
                
                {/* Article Header */}
                <div className="border-b border-[#E7E2D8] pb-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-100 px-2.5 py-1 rounded-lg">
                      {activeArticle.categoryName}
                    </span>
                    <span className="text-xs text-stone-400">• Official Documentation</span>
                  </div>
                  <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1A1715] leading-tight">
                    {activeArticle.title}
                  </h1>
                </div>

                {/* Summary Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7E2D8] shadow-sm space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
                    Executive Summary
                  </span>
                  <p className="text-sm text-stone-700 leading-relaxed italic">
                    {activeArticle.summary}
                  </p>
                </div>

                {/* Body Paragraphs */}
                <div className="space-y-4 text-stone-800 text-sm sm:text-base leading-relaxed">
                  {activeArticle.content.map((paragraph, pIdx) => (
                    <p key={pIdx} className="leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Key Takeaways */}
                {activeArticle.keyTakeaways && activeArticle.keyTakeaways.length > 0 && (
                  <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                      <CheckCircle className="w-4 h-4 text-amber-600" />
                      <span>Key Takeaways & Best Practices</span>
                    </div>
                    <ul className="space-y-2">
                      {activeArticle.keyTakeaways.map((point, kIdx) => (
                        <li key={kIdx} className="text-xs sm:text-sm text-stone-800 flex items-start gap-2.5">
                          <span className="text-amber-500 font-bold text-xs mt-0.5">◆</span>
                          <span className="leading-normal">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Structured Table (if available) */}
                {activeArticle.tableData && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Comparative Reference Matrix
                    </h4>
                    <div className="overflow-x-auto rounded-2xl border border-[#E7E2D8] bg-white shadow-sm">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#1A1715] text-amber-300">
                            {activeArticle.tableData.headers.map((h, hIdx) => (
                              <th key={hIdx} className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {activeArticle.tableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50/60'}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-4 py-3 text-stone-800 font-medium whitespace-nowrap">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Bottom PDF Download Banner */}
                <div className="pt-6 border-t border-[#E7E2D8] flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-amber-50/60 to-transparent p-5 rounded-2xl border">
                  <div>
                    <h5 className="text-sm font-bold text-[#1A1715]">
                      Need an offline copy of the complete manual?
                    </h5>
                    <p className="text-xs text-stone-500">
                      Download all modules formatted in a high-resolution A4 PDF booklet.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1715] hover:bg-stone-800 text-amber-300 font-semibold text-xs sm:text-sm rounded-xl shadow transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>Download Knowledge Base (PDF)</span>
                  </button>
                </div>

              </article>
            ) : (
              <div className="text-center py-20 text-stone-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-600" />
                <p className="text-sm">Select an article from the left navigation to read.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
