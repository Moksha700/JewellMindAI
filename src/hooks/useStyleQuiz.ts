import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  listStyleQuizzes, 
  getStyleQuizById, 
  createStyleQuiz, 
  updateStyleQuiz, 
  deleteStyleQuiz,
  toggleStyleQuizStatus
} from '../services/styleQuizService';
import { 
  StyleQuizFilterOptions, 
  PaginatedResult, 
  StyleQuizItem, 
  StyleQuizStatus 
} from '../types/styleQuiz';
import { StyleQuizFormData } from '../schemas/styleQuizSchema';

/**
 * Hook to fetch paginated Style Quizzes for current user with search & filters.
 * Filtered by user_id = auth.uid().
 */
export function useList(options: StyleQuizFilterOptions = {}) {
  const { user } = useAuth();
  const userId = user?.uid || '';

  return useQuery<PaginatedResult<StyleQuizItem>, Error>({
    queryKey: ['styleQuizzes', userId, options],
    queryFn: () => listStyleQuizzes(userId, options),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to fetch a single Style Quiz by ID for current user.
 */
export function useOne(quizId: string | null | undefined) {
  const { user } = useAuth();
  const userId = user?.uid || '';

  return useQuery<StyleQuizItem | null, Error>({
    queryKey: ['styleQuiz', userId, quizId],
    queryFn: () => (quizId ? getStyleQuizById(quizId, userId) : Promise.resolve(null)),
    enabled: !!userId && !!quizId,
  });
}

/**
 * Hook to create a new Style Quiz.
 */
export function useCreate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?.uid || '';

  return useMutation({
    mutationFn: (data: StyleQuizFormData) => {
      if (!userId) throw new Error('User not authenticated');
      return createStyleQuiz(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styleQuizzes', userId] });
      showToast('Style Quiz created successfully!', 'success');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to create Style Quiz', 'error');
    },
  });
}

/**
 * Hook to update an existing Style Quiz.
 */
export function useUpdate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?.uid || '';

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StyleQuizFormData }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateStyleQuiz(id, userId, data);
    },
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['styleQuizzes', userId] });
      queryClient.setQueryData(['styleQuiz', userId, updatedItem.id], updatedItem);
      showToast('Style Quiz updated successfully!', 'success');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to update Style Quiz', 'error');
    },
  });
}

/**
 * Hook to delete a Style Quiz with OPTIMISTIC UPDATE.
 */
export function useDelete() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?.uid || '';

  return useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteStyleQuiz(id, userId);
    },
    onMutate: async (deletedId: string) => {
      // Cancel outgoing queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['styleQuizzes', userId] });

      // Snapshot previous queries across all filter variants
      const previousQueries = queryClient.getQueriesData<PaginatedResult<StyleQuizItem>>({
        queryKey: ['styleQuizzes', userId],
      });

      // Optimistically remove item from all cached results
      queryClient.setQueriesData<PaginatedResult<StyleQuizItem>>(
        { queryKey: ['styleQuizzes', userId] },
        (old) => {
          if (!old) return old;
          const filtered = old.data.filter((item) => item.id !== deletedId);
          return {
            ...old,
            data: filtered,
            total: Math.max(0, old.total - 1),
            totalPages: Math.max(1, Math.ceil((old.total - 1) / old.pageSize)),
          };
        }
      );

      return { previousQueries };
    },
    onError: (err: Error, _deletedId, context) => {
      // Rollback to snapshot on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      showToast(err.message || 'Failed to delete Style Quiz', 'error');
    },
    onSuccess: () => {
      showToast('Style Quiz deleted', 'success');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['styleQuizzes', userId] });
    },
  });
}

/**
 * Hook to toggle status with OPTIMISTIC UPDATE.
 */
export function useToggleStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?.uid || '';

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StyleQuizStatus }) => {
      if (!userId) throw new Error('User not authenticated');
      return toggleStyleQuizStatus(id, userId, status);
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['styleQuizzes', userId] });

      const previousQueries = queryClient.getQueriesData<PaginatedResult<StyleQuizItem>>({
        queryKey: ['styleQuizzes', userId],
      });

      // Optimistically update status in all lists
      queryClient.setQueriesData<PaginatedResult<StyleQuizItem>>(
        { queryKey: ['styleQuizzes', userId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((item) =>
              item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item
            ),
          };
        }
      );

      return { previousQueries };
    },
    onError: (err: Error, _vars, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      showToast(err.message || 'Failed to update status', 'error');
    },
    onSuccess: (updatedItem) => {
      showToast(`Status changed to ${updatedItem.status}`, 'info');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['styleQuizzes', userId] });
    },
  });
}
