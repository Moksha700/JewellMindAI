import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  UploadCloud, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileSpreadsheet, 
  FileCode, 
  File, 
  Search, 
  Layers, 
  Eye, 
  X, 
  Sparkles,
  Info,
  Database,
  ArrowUpRight,
  Send,
  Copy,
  Check,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { KnowledgeDocument, KnowledgeBaseStats, KnowledgeSearchResult } from '../../types/knowledgeBase';
import { 
  getKnowledgeDocuments, 
  processAndSaveKnowledgeFile, 
  deleteKnowledgeDocument, 
  getKnowledgeBaseStats 
} from '../../services/knowledgeBaseService';
import { askKnowledgeBaseRAG } from '../../services/ragService';

export const KnowledgeBasePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Guard: Knowledge Base upload and documents are strictly restricted to authenticated users
  useEffect(() => {
    if (!user) {
      window.location.hash = 'signin';
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<KnowledgeBaseStats>({
    totalDocuments: 0,
    totalChunks: 0,
    totalWords: 0,
    totalSizeBytes: 0,
    formattedTotalSize: '0 B',
  });

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected document for preview modal
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  
  // Delete confirmation
  const [documentToDelete, setDocumentToDelete] = useState<KnowledgeDocument | null>(null);

  // RAG Q&A State
  const [ragQuestion, setRagQuestion] = useState('');
  const [ragAnswer, setRagAnswer] = useState('');
  const [ragIsLoading, setRagIsLoading] = useState(false);
  const [ragRetrievedChunks, setRagRetrievedChunks] = useState<KnowledgeSearchResult[]>([]);
  const [ragHasQueried, setRagHasQueried] = useState(false);
  const [ragCopied, setRagCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents
  const loadData = async () => {
    try {
      setLoading(true);
      const docs = await getKnowledgeDocuments(user?.uid);
      setDocuments(docs);
      const currentStats = await getKnowledgeBaseStats(user?.uid);
      setStats(currentStats);
    } catch (err: any) {
      console.error('Error loading knowledge documents:', err);
      showToast('Could not load knowledge documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle files selected / dropped
  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt', 'csv', 'md', 'json'];
    const maxSizeBytes = 25 * 1024 * 1024; // 25 MB max

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (!allowedExtensions.includes(ext)) {
        setUploadError(`"${file.name}" has an unsupported format. Please upload PDF, DOC, DOCX, TXT, CSV, MD, or JSON.`);
        showToast(`Format .${ext} not supported for ${file.name}`, 'error');
        failCount++;
        continue;
      }

      if (file.size > maxSizeBytes) {
        setUploadError(`"${file.name}" exceeds the 25MB limit.`);
        showToast(`File "${file.name}" exceeds 25MB limit`, 'error');
        failCount++;
        continue;
      }

      try {
        setUploadProgressText(`Processing "${file.name}" & indexing RAG chunks... (${i + 1}/${files.length})`);
        await processAndSaveKnowledgeFile(file, user?.uid);
        successCount++;
      } catch (err: any) {
        console.error('Error processing file:', file.name, err);
        showToast(`Failed to process "${file.name}"`, 'error');
        failCount++;
      }
    }

    setIsUploading(false);
    setUploadProgressText('');

    if (successCount > 0) {
      showToast(
        `Successfully uploaded and indexed ${successCount} document${successCount > 1 ? 's' : ''} for RAG!`,
        'success'
      );
      await loadData();
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag-and-drop listeners
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Delete document
  const confirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      await deleteKnowledgeDocument(documentToDelete.id);
      showToast(`Removed "${documentToDelete.name}" from Knowledge Base`, 'info');
      setDocumentToDelete(null);
      if (selectedDoc?.id === documentToDelete.id) {
        setSelectedDoc(null);
      }
      await loadData();
    } catch (err) {
      showToast('Could not delete document', 'error');
    }
  };

  // Helper to load a sample jewelry document for instant testing
  const loadSampleDocument = async () => {
    setIsUploading(true);
    setUploadProgressText('Generating and indexing Atelier Gemology Reference Guide...');
    try {
      const sampleContent = `ATELIER JEWELMIND GEMOLOGICAL STANDARDS & BESPOKE METALLURGY MANUAL
Version: 2026.4
Author: Master Gemological Atelier

1. DIAMOND COLOR & CLARITY CALIBRATION:
- D-F Range: Colorless. Preferred for platinum and 18k white gold settings to prevent body color absorption.
- G-H Range: Near colorless. Ideal value proposition for 18k yellow gold settings where warm reflection masks subtle tint.
- FL/IF to VVS2: Precision collection grade.
- VS1-VS2: Eye-clean luxury benchmark for commercial bespoke creations.

2. PRECIOUS ALLOY DENSITIES & HALLMARKS:
- 18k Yellow Gold (750 AU): 75% Pure Gold, 12.5% Fine Silver, 12.5% Copper. Rich warm luster, high durability for daily pavé.
- 18k Rose Gold (750 AU): 75% Pure Gold, 20% Copper, 5% Silver. High tensile strength, compliments warm skin tones.
- Platinum 950 (950 PT): 95% Pure Platinum, 5% Ruthenium. Naturally white, hypoallergenic, secure prong grip for 2.0ct+ center gems.

3. ART DECO & VINTAGE GEOMETRIC SETTING RULES:
- Baguette and Calibré cut halos require channel or bezel retention with minimum 0.8mm metal thickness.
- Milgrain edging must be hand-rolled with 0.3mm beaded wheel at 45-degree angle.
- Prong tips for emerald cut diamonds should use double claw prongs to prevent corner cleavage fracture.

4. OCCASION MATCHING GUIDELINES:
- Gala / Red Carpet: High-contrast statement necklaces (30ct+ total carat weight) with matched chandelier drop earrings.
- Black Tie Wedding: Platinum halo pendants, classic tennis bracelets, and diamond cluster studs.
- Daily Quiet Luxury: Solitaire bezel-set pendants, tapered gold bands, and huggie hoops.`;

      const sampleFile = new window.File(
        [sampleContent], 
        'Atelier_Gemology_Bespoke_Manual.txt', 
        { type: 'text/plain' }
      );

      await processAndSaveKnowledgeFile(sampleFile, user?.uid);
      showToast('Sample Gemology Guide indexed into Knowledge Base!', 'success');
      await loadData();
    } catch (e: any) {
      showToast('Failed to load sample document', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  // RAG Q&A Query Handlers
  const handleAskKnowledgeBase = async (overrideQuery?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : ragQuestion;
    if (!q.trim()) {
      showToast('Please enter a question to ask the Knowledge Base', 'error');
      return;
    }

    if (ragIsLoading) return;

    setRagIsLoading(true);
    setRagAnswer('');
    setRagRetrievedChunks([]);
    setRagHasQueried(true);

    try {
      await askKnowledgeBaseRAG({
        question: q.trim(),
        userId: user?.uid,
        onToken: (token) => {
          setRagAnswer((prev) => prev + token);
        },
        onError: (err) => {
          showToast(err.message || 'Error querying Knowledge Base', 'error');
        },
        onComplete: (answer, chunks) => {
          setRagAnswer(answer);
          setRagRetrievedChunks(chunks);
        },
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to query Knowledge Base', 'error');
    } finally {
      setRagIsLoading(false);
    }
  };

  const handleCopyRagAnswer = () => {
    if (!ragAnswer) return;
    navigator.clipboard.writeText(ragAnswer);
    setRagCopied(true);
    showToast('Copied answer to clipboard', 'info');
    setTimeout(() => setRagCopied(false), 2000);
  };

  // Filter documents by query
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.displayType.toLowerCase().includes(q) ||
      doc.extension.toLowerCase().includes(q) ||
      (doc.textSnippet && doc.textSnippet.toLowerCase().includes(q))
    );
  });

  // Helper for document icon
  const renderDocIcon = (extension: string) => {
    switch (extension) {
      case 'pdf':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'doc':
      case 'docx':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'csv':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        );
      case 'json':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
            <FileCode className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
            <File className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div id="knowledge-base-page" className="space-y-8 pb-12 font-sans-clean">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
              RAG Knowledge Layer
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
              Gemini Multimodal Compatible
            </span>
          </div>
          <h1 className="font-serif-luxury text-3xl font-bold text-stone-900">
            Knowledge Base
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Upload atelier gemological manuals, custom metal specifications, pricing sheets, and stone catalogs. 
            Documents are parsed into semantic chunks to ground the AI in verified knowledge.
          </p>
        </div>

        {/* Quick Sample Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="kb-load-sample-btn"
            onClick={loadSampleDocument}
            disabled={isUploading}
            className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Load a pre-configured Atelier Gemology manual"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Sample Manual</span>
          </button>
          <button
            id="kb-trigger-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-[#1A1715] hover:bg-[#2A2522] text-[#FAF8F5] text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4 text-amber-300" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E7E2D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Documents</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-luxury text-2xl font-bold text-stone-900">{stats.totalDocuments}</p>
          <p className="text-[10px] text-stone-400">Indexed for retrieval</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E7E2D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Semantic Chunks</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-luxury text-2xl font-bold text-stone-900">{stats.totalChunks}</p>
          <p className="text-[10px] text-emerald-600 font-medium">Ready for RAG matching</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E7E2D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Indexed Words</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-luxury text-2xl font-bold text-stone-900">{stats.totalWords.toLocaleString()}</p>
          <p className="text-[10px] text-stone-400">Gemological vocabulary</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E7E2D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Knowledge Size</span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-luxury text-2xl font-bold text-stone-900">{stats.formattedTotalSize}</p>
          <p className="text-[10px] text-stone-400">Client-side zero-leak storage</p>
        </div>
      </div>

      {/* 3. Drag & Drop Upload Zone */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Upload Knowledge Documents</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Select or drop files to extract text, segment chunks, and prepare your RAG knowledge pipeline.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600">
              Max 25 MB/file
            </span>
          </div>
        </div>

        {/* Upload Error Banner */}
        {uploadError && (
          <div 
            id="kb-upload-error-banner"
            className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button 
              onClick={() => setUploadError(null)}
              className="text-rose-600 hover:text-rose-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Drop Zone Box */}
        <div
          id="kb-drag-drop-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-amber-500 bg-amber-50/60 scale-[1.005]'
              : isUploading
              ? 'border-amber-300 bg-amber-50/20 cursor-wait'
              : 'border-stone-200 hover:border-amber-400 bg-[#FAF8F5]/50 hover:bg-amber-50/15'
          }`}
        >
          <input
            ref={fileInputRef}
            id="kb-file-input"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.csv,.md,.json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFiles(e.target.files);
              }
            }}
          />

          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">
                  {uploadProgressText || 'Extracting & chunking document...'}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Parsing text semantics, calculating word counts, and indexing RAG vectors
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1715] text-amber-300 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-6 h-6 text-amber-300" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-900">
                  Drag and drop knowledge files here, or{' '}
                  <span className="text-amber-700 underline underline-offset-2">browse files</span>
                </p>
                <p className="text-xs text-stone-500">
                  Supported formats: PDF, Word (DOC, DOCX), Plain Text (TXT), CSV Spreadsheets, Markdown, JSON
                </p>
              </div>

              {/* Supported Format Pills */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 rounded-md">
                  PDF
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 rounded-md">
                  DOC / DOCX
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-md">
                  CSV
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 rounded-md">
                  TXT
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200 rounded-md">
                  MD / JSON
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Uploaded Files List */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Table / List Header */}
        <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <span>Indexed Knowledge Documents</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
                {documents.length}
              </span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Active documents stored and prepared for grounding and RAG retrieval.
            </p>
          </div>

          {/* Search bar */}
          {documents.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter files or text..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          )}
        </div>

        {/* List Content */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
            <p className="text-xs font-semibold text-stone-500">Loading knowledge base documents...</p>
          </div>
        ) : documents.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                No Knowledge Files Uploaded Yet
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Add your brand guidelines, diamond pricing books, cut guidelines, or metallurgy manuals. 
                They will be parsed into indexed chunks ready for the AI to cite and reference.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={loadSampleDocument}
                disabled={isUploading}
                className="w-full sm:w-auto px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Load Sample Gemology Guide</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full sm:w-auto px-4 py-2 bg-[#1A1715] hover:bg-[#2A2522] text-[#FAF8F5] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-amber-300" />
                <span>Upload Your First File</span>
              </button>
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Search className="w-6 h-6 text-stone-300 mx-auto" />
            <p className="text-xs font-semibold text-stone-600">No documents matched "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-amber-700 hover:underline font-bold"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          /* Table of Uploaded Documents */
          <div className="divide-y divide-stone-100">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                id={`kb-doc-row-${doc.id}`}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/80 transition-colors"
              >
                {/* File Details: Icon, Name, Type, Size */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  {renderDocIcon(doc.extension)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-stone-900 truncate max-w-md" title={doc.name}>
                        {doc.name}
                      </p>
                      {/* Status Badge */}
                      {doc.status === 'ready' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Ready for RAG</span>
                        </span>
                      ) : doc.status === 'processing' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                          <span>Processing...</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Upload Error</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata line */}
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1 flex-wrap">
                      <span className="font-semibold text-stone-700">{doc.displayType}</span>
                      <span>•</span>
                      <span>{doc.formattedSize}</span>
                      <span>•</span>
                      <span className="text-amber-800 font-medium">
                        {doc.chunkCount || doc.chunks?.length || 0} chunks ({doc.wordCount?.toLocaleString() || 0} words)
                      </span>
                      <span>•</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Snippet preview */}
                    {doc.textSnippet && (
                      <p className="text-[11px] text-stone-400 mt-1 line-clamp-1 italic max-w-xl">
                        "{doc.textSnippet}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: View Chunks, Delete */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    id={`kb-view-chunks-${doc.id}`}
                    onClick={() => setSelectedDoc(doc)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="View extracted chunks & preview"
                  >
                    <Eye className="w-3.5 h-3.5 text-stone-500" />
                    <span>View Chunks</span>
                  </button>
                  <button
                    id={`kb-delete-btn-${doc.id}`}
                    onClick={() => setDocumentToDelete(doc)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete document from Knowledge Base"
                    aria-label={`Delete ${doc.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. RAG Retrieval & Q&A Workspace */}
      <div id="kb-rag-workspace" className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                Live RAG Pipeline
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Grounding Active
              </span>
            </div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Ask Knowledge Base (RAG Q&A)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Ask any question grounded directly in your uploaded atelier guides, alloy specs, or catalogs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400">
              Indexed Chunks: <strong className="text-stone-700">{stats.totalChunks}</strong>
            </span>
            <a
              id="kb-open-chatbot-link"
              href="#chatbot"
              className="text-xs font-semibold text-stone-800 hover:text-stone-900 bg-stone-100 hover:bg-amber-100/70 border border-stone-200 hover:border-amber-300 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
              <span>Full Chatbot</span>
            </a>
          </div>
        </div>

        {/* Quick Sample Inquiries */}
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
            Suggested Inquiries for Grounded Testing:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'What are the exact alloy ratios for 18k yellow gold?',
              'What diamond color range is recommended for platinum settings?',
              'What are the Art Deco rules for calibrated baguette halos?',
              'What jewelry is recommended for Red Carpet Gala occasions?'
            ].map((sampleQuery, idx) => (
              <button
                key={idx}
                id={`kb-sample-query-${idx}`}
                type="button"
                onClick={() => {
                  setRagQuestion(sampleQuery);
                  handleAskKnowledgeBase(sampleQuery);
                }}
                disabled={ragIsLoading}
                className="text-left text-xs bg-stone-50 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 text-stone-700 border border-stone-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {sampleQuery}
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Box */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              id="kb-rag-input"
              value={ragQuestion}
              onChange={(e) => setRagQuestion(e.target.value)}
              placeholder="Ask a question about your uploaded documents (e.g. 'What is the recommended diamond clarity for commercial bespoke creations?')..."
              rows={3}
              disabled={ragIsLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAskKnowledgeBase();
                }
              }}
              className="w-full p-4 bg-[#FAF8F5] border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none disabled:opacity-60"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-stone-400">
              Press Enter or click Ask to retrieve relevant chunks and generate a grounded response.
            </p>

            <button
              id="kb-rag-submit-btn"
              type="button"
              onClick={() => handleAskKnowledgeBase()}
              disabled={ragIsLoading || !ragQuestion.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1715] hover:bg-[#2A2522] text-[#FAF8F5] font-semibold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              {ragIsLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>Retrieving & Answering...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ask Knowledge Base</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output & Grounding Display */}
        {(ragHasQueried || ragAnswer || ragIsLoading) && (
          <div id="kb-rag-response-container" className="pt-4 border-t border-stone-100 space-y-4">
            
            {/* Retrieved Sources Header */}
            {ragRetrievedChunks.length > 0 && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Retrieved {ragRetrievedChunks.length} Relevant Knowledge Chunk{ragRetrievedChunks.length > 1 ? 's' : ''}</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-semibold uppercase tracking-wider">
                    Source Citations
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ragRetrievedChunks.map((chunk, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1 bg-white border border-amber-200/90 rounded-lg text-[11px] text-stone-800 shadow-2xs flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3 h-3 text-amber-700 shrink-0" />
                      <span className="font-semibold truncate max-w-[200px]">{chunk.documentName}</span>
                      <span className="text-stone-400">#chunk-{chunk.chunkIndex}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        Score: {Math.round(chunk.relevanceScore * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Answer Box */}
            <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#1A1715] text-amber-300 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Grounded Atelier Response
                  </span>
                </div>

                {ragAnswer && (
                  <button
                    id="kb-rag-copy-btn"
                    onClick={handleCopyRagAnswer}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
                    title="Copy response to clipboard"
                  >
                    {ragCopied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {ragIsLoading && !ragAnswer ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-stone-500 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Scanning indexed chunks and generating grounded answer...</span>
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-stone-800 font-sans leading-relaxed whitespace-pre-wrap">
                  {ragAnswer}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* 6. Document Chunks & RAG Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {renderDocIcon(selectedDoc.extension)}
                <div>
                  <h3 className="font-serif-luxury text-lg font-bold text-stone-900 truncate max-w-md">
                    {selectedDoc.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                    <span>{selectedDoc.displayType}</span>
                    <span>•</span>
                    <span>{selectedDoc.formattedSize}</span>
                    <span>•</span>
                    <span className="font-bold text-emerald-700">
                      {selectedDoc.chunks?.length || 0} Indexed RAG Chunks
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Chunks */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>RAG Preparation Status: Ready</span>
                </p>
                <p className="text-[11px] text-amber-900/80 leading-relaxed">
                  This document has been parsed into {selectedDoc.chunks?.length || 0} overlapping semantic chunks. 
                  When the RAG prompt is executed in the next step, relevant chunks will be retrieved and injected into the Gemini context.
                </p>
              </div>

              {/* Chunks List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Segmented Chunks ({selectedDoc.chunks?.length || 0})
                </h4>
                {selectedDoc.chunks && selectedDoc.chunks.length > 0 ? (
                  selectedDoc.chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-stone-500">
                        <span className="px-2 py-0.5 bg-white border border-stone-200 rounded-md text-stone-700">
                          Chunk #{chunk.chunkIndex}
                        </span>
                        <span>{chunk.charCount} characters</span>
                      </div>
                      <p className="text-xs text-stone-700 font-mono whitespace-pre-wrap leading-relaxed">
                        {chunk.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-stone-50 rounded-xl text-xs text-stone-500 text-center">
                    No chunks parsed for this file.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-100 bg-[#FAF8F5] flex items-center justify-between">
              <span className="text-[11px] text-stone-400">
                Uploaded {new Date(selectedDoc.uploadedAt).toLocaleString()}
              </span>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Dialog */}
      {documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                Remove from Knowledge Base?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Are you sure you want to remove <strong className="text-stone-900">"{documentToDelete.name}"</strong>? 
                Its indexed chunks will be deleted and will no longer be available for AI retrieval.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDocumentToDelete(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-doc-btn"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
