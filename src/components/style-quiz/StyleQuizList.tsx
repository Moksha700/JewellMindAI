import React, { useState } from 'react';
import { 
  StyleQuizItem, 
  StyleQuizStatus, 
  StyleQuizFilterOptions, 
  PaginatedResult 
} from '../../types/styleQuiz';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Filter, 
  Clock, 
  CheckCircle2, 
  Archive, 
  ChevronLeft, 
  ChevronRight,
  Gem,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';

interface StyleQuizListProps {
  data: PaginatedResult<StyleQuizItem> | undefined;
  isLoading: boolean;
  filterOptions: StyleQuizFilterOptions;
  onFilterChange: (options: Partial<StyleQuizFilterOptions>) => void;
  onCreateNew: () => void;
  onViewDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void> | void;
  onToggleStatus: (id: string, newStatus: StyleQuizStatus) => void;
  isDeleting: boolean;
}

export const StyleQuizList: React.FC<StyleQuizListProps> = ({
  data,
  isLoading,
  filterOptions,
  onFilterChange,
  onCreateNew,
  onViewDetail,
  onEdit,
  onDelete,
  onToggleStatus,
  isDeleting,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<StyleQuizItem | null>(null);

  const search = filterOptions.search || '';
  const currentStatus = filterOptions.status || 'all';
  const currentPage = data?.page || 1;
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.total || 0;
  const items = data?.data || [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ search: e.target.value, page: 1 });
  };

  const handleStatusFilterChange = (status: 'all' | StyleQuizStatus) => {
    onFilterChange({ status, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onFilterChange({ page: newPage });
    }
  };

  const getStatusBadge = (item: StyleQuizItem) => {
    switch (item.status) {
      case 'completed':
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(item.id, 'draft');
            }}
            title="Click to toggle to Draft"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </button>
        );
      case 'archived':
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(item.id, 'draft');
            }}
            title="Click to restore to Draft"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 transition-colors"
          >
            <Archive className="w-3.5 h-3.5 text-stone-500" />
            Archived
          </button>
        );
      case 'draft':
      default:
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(item.id, 'completed');
            }}
            title="Click to mark Completed"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Draft
          </button>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Section: Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300/60 flex items-center justify-center text-amber-800">
              <Sparkles className="w-5 h-5" />
            </span>
            Style Quiz Vault
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-1">
            Manage, edit, and fine-tune your bespoke jewellery styling records and aesthetic parameters.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Style Quiz
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by quiz title, gemstone, metal, aesthetic, or notes..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: '', page: 1 })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          <span className="text-xs font-semibold text-stone-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Status:
          </span>
          {(['all', 'draft', 'completed', 'archived'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => handleStatusFilterChange(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all shrink-0 cursor-pointer ${
                currentStatus === st
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        
        {/* Skeleton State */}
        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="h-8 bg-stone-100 rounded-lg animate-pulse w-1/4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-stone-100 flex items-center justify-between gap-4 animate-pulse">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-stone-200 rounded w-1/3" />
                    <div className="h-3 bg-stone-100 rounded w-1/2" />
                  </div>
                  <div className="h-6 bg-stone-100 rounded-full w-24" />
                  <div className="h-8 bg-stone-100 rounded-lg w-24" />
                </div>
              ))}
            </div>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="p-12 md:p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 mb-4 shadow-inner">
              <FolderOpen className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-serif font-bold text-stone-900 mb-1">
              {search || currentStatus !== 'all' ? 'No Matching Style Quizzes' : 'No Style Quizzes Yet'}
            </h3>

            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mb-6">
              {search || currentStatus !== 'all'
                ? 'Try clearing your search query or adjusting your status filters to view records.'
                : 'Create your first Style Quiz to capture your custom metal preferences, gemstone favorites, and aesthetic direction.'}
            </p>

            {search || currentStatus !== 'all' ? (
              <button
                type="button"
                onClick={() => onFilterChange({ search: '', status: 'all', page: 1 })}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Reset Search &amp; Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create your first Style Quiz
              </button>
            )}
          </div>
        ) : (
          /* Responsive Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  <th className="py-3.5 px-4 sm:px-6">Quiz Profile &amp; Style</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Metal &amp; Gemstone</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Budget &amp; Occasion</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
                {items.map((quiz) => (
                  <tr
                    key={quiz.id}
                    onClick={() => onViewDetail(quiz.id)}
                    className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                  >
                    {/* Title & Style */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-serif font-bold text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                        {quiz.title}
                      </div>
                      <div className="flex items-center gap-2 text-stone-500 text-xs mt-1">
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <Sparkles className="w-3 h-3" />
                          {quiz.payload.aestheticStyle || 'Bespoke Style'}
                        </span>
                        <span>•</span>
                        <span>{new Date(quiz.updatedAt || quiz.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Metal & Gemstone */}
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="text-stone-800 font-medium line-clamp-1 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        {quiz.payload.metalPreference}
                      </div>
                      <div className="text-stone-500 text-xs mt-0.5 line-clamp-1 flex items-center gap-1.5">
                        <Gem className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        {quiz.payload.primaryGemstone}
                      </div>
                    </td>

                    {/* Budget & Occasion */}
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <div className="text-stone-800 font-medium line-clamp-1">
                        {quiz.payload.budgetRange}
                      </div>
                      <div className="text-stone-500 text-xs mt-0.5 line-clamp-1">
                        {quiz.payload.occasionType}
                      </div>
                    </td>

                    {/* Status Badge with quick click */}
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(quiz)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onViewDetail(quiz.id)}
                          title="View Quiz Details"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(quiz.id)}
                          title="Edit Quiz"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(quiz)}
                          title="Delete Quiz"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="p-4 border-t border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
            <div>
              Showing <span className="font-semibold text-stone-800">{items.length}</span> of{' '}
              <span className="font-semibold text-stone-800">{totalItems}</span> Style Quizzes
              {totalPages > 1 && (
                <> (Page {currentPage} of {totalPages})</>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => handlePageChange(pNum)}
                      className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-colors ${
                        currentPage === pNum
                          ? 'bg-stone-900 text-white'
                          : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmDialog
          isOpen={!!deleteTarget}
          title={deleteTarget.title}
          isDeleting={isDeleting}
          onConfirm={async () => {
            await onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
