import React, { useState } from 'react';
import { 
  useList, 
  useOne, 
  useCreate, 
  useUpdate, 
  useDelete, 
  useToggleStatus 
} from '../../hooks/useStyleQuiz';
import { StyleQuizFilterOptions, StyleQuizStatus } from '../../types/styleQuiz';
import { StyleQuizList } from './StyleQuizList';
import { StyleQuizDetail } from './StyleQuizDetail';
import { StyleQuizForm } from './StyleQuizForm';
import { StyleQuizFormData } from '../../schemas/styleQuizSchema';
import { Loader2 } from 'lucide-react';

export const StyleQuizManager: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'create' | 'edit'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filter state for list view
  const [filterOptions, setFilterOptions] = useState<StyleQuizFilterOptions>({
    search: '',
    status: 'all',
    page: 1,
    pageSize: 6,
  });

  // Query Hooks
  const { 
    data: listData, 
    isLoading: isListLoading 
  } = useList(filterOptions);

  const { 
    data: activeQuiz, 
    isLoading: isSingleLoading 
  } = useOne(selectedId);

  // Mutation Hooks
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();
  const toggleStatusMutation = useToggleStatus();

  // Handlers
  const handleFilterChange = (newOptions: Partial<StyleQuizFilterOptions>) => {
    setFilterOptions((prev) => ({ ...prev, ...newOptions }));
  };

  const handleCreateSubmit = async (data: StyleQuizFormData) => {
    await createMutation.mutateAsync(data);
    setCurrentView('list');
  };

  const handleUpdateSubmit = async (data: StyleQuizFormData) => {
    if (!selectedId) return;
    await updateMutation.mutateAsync({ id: selectedId, data });
    setCurrentView('detail');
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    if (selectedId === id) {
      setSelectedId(null);
      setCurrentView('list');
    }
  };

  const handleToggleStatus = (id: string, newStatus: StyleQuizStatus) => {
    toggleStatusMutation.mutate({ id, status: newStatus });
  };

  // Render based on current view
  if (currentView === 'create') {
    return (
      <StyleQuizForm
        mode="create"
        isPending={createMutation.isPending}
        onSubmit={handleCreateSubmit}
        onCancel={() => setCurrentView('list')}
      />
    );
  }

  if (currentView === 'edit') {
    if (isSingleLoading) {
      return (
        <div className="p-12 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-stone-200">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
          <p className="text-sm text-stone-600 font-medium">Loading Quiz Details...</p>
        </div>
      );
    }

    return (
      <StyleQuizForm
        mode="edit"
        initialData={activeQuiz}
        isPending={updateMutation.isPending}
        onSubmit={handleUpdateSubmit}
        onCancel={() => setCurrentView('detail')}
      />
    );
  }

  if (currentView === 'detail') {
    if (isSingleLoading || !activeQuiz) {
      return (
        <div className="p-12 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-stone-200">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
          <p className="text-sm text-stone-600 font-medium">Loading Style Quiz...</p>
        </div>
      );
    }

    return (
      <StyleQuizDetail
        quiz={activeQuiz}
        onBack={() => {
          setSelectedId(null);
          setCurrentView('list');
        }}
        onEdit={(id) => {
          setSelectedId(id);
          setCurrentView('edit');
        }}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        isDeleting={deleteMutation.isPending}
      />
    );
  }

  // Default: List View
  return (
    <StyleQuizList
      data={listData}
      isLoading={isListLoading}
      filterOptions={filterOptions}
      onFilterChange={handleFilterChange}
      onCreateNew={() => {
        setSelectedId(null);
        setCurrentView('create');
      }}
      onViewDetail={(id) => {
        setSelectedId(id);
        setCurrentView('detail');
      }}
      onEdit={(id) => {
        setSelectedId(id);
        setCurrentView('edit');
      }}
      onDelete={handleDelete}
      onToggleStatus={handleToggleStatus}
      isDeleting={deleteMutation.isPending}
    />
  );
};
