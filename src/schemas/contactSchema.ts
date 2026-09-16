import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(80, { message: 'Name cannot exceed 80 characters' }),
  email: z
    .string()
    .trim()
    .min(5, { message: 'Please enter your email address' })
    .max(120, { message: 'Email cannot exceed 120 characters' })
    .email({ message: 'Please enter a valid email address' }),
  message: z
    .string()
    .trim()
    .min(10, { message: 'Message must be at least 10 characters' })
    .max(2000, { message: 'Message cannot exceed 2000 characters' }),
  source: z.string().optional(),
  // Honeypot field: invisible to real users, bots fill it out
  _hp_verification: z.string().optional(),
});

export type ContactMessageFormData = z.infer<typeof contactMessageSchema>;
