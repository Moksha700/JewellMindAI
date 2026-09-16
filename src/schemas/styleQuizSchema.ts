import { z } from 'zod';

export const styleQuizSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: 'Title must be at least 3 characters long' })
    .max(100, { message: 'Title cannot exceed 100 characters' }),
  status: z.enum(['draft', 'completed', 'archived'], {
    message: 'Please choose a status',
  }),
  metalPreference: z
    .string()
    .min(1, { message: 'Please select a preferred precious metal' }),
  primaryGemstone: z
    .string()
    .min(1, { message: 'Please select a primary gemstone' }),
  aestheticStyle: z
    .string()
    .min(1, { message: 'Please choose an aesthetic design style' }),
  budgetRange: z
    .string()
    .min(1, { message: 'Please select an estimated budget bracket' }),
  occasionType: z
    .string()
    .min(1, { message: 'Please specify the primary occasion' }),
  notes: z
    .string()
    .max(1000, { message: 'Notes cannot exceed 1000 characters' })
    .optional()
    .or(z.literal('')),
});

export type StyleQuizFormData = z.infer<typeof styleQuizSchema>;
