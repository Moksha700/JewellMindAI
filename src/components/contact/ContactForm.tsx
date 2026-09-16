import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactMessageSchema, ContactMessageFormData } from '../../schemas/contactSchema';
import { submitContactMessage, getSubmitRateCooldownRemaining } from '../../services/contactService';
import { useToast } from '../../context/ToastContext';
import { 
  Send, 
  Loader2, 
  Mail, 
  User, 
  MessageSquare, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Diamond
} from 'lucide-react';

interface ContactFormProps {
  source?: string;
  onSuccess?: () => void;
  className?: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  source = 'web_contact_form',
  onSuccess,
  className = '',
}) => {
  const { showToast } = useToast();
  const [cooldown, setCooldown] = useState<number>(0);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactMessageFormData>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      source,
      _hp_verification: '',
    },
  });

  const messageVal = watch('message') || '';

  // Check rate limit cooldown every second
  useEffect(() => {
    const updateCooldown = () => {
      const remaining = getSubmitRateCooldownRemaining();
      setCooldown(remaining);
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: ContactMessageFormData) => {
    // Check submit rate guard
    const remaining = getSubmitRateCooldownRemaining();
    if (remaining > 0) {
      showToast(
        `Rate limit active: please wait ${remaining}s before sending another message.`,
        'error'
      );
      return;
    }

    try {
      await submitContactMessage({
        ...data,
        source,
      });

      // UX requirement: Success toast + reset form
      showToast(
        'Thank you! Your message has been sent to the JewelMind concierge.',
        'success'
      );
      reset({
        name: '',
        email: '',
        message: '',
        source,
        _hp_verification: '',
      });
      setSubmittedSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // UX requirement: Error toast on failure
      const msg = err?.message || 'Failed to submit message. Please try again.';
      showToast(msg, 'error');
    }
  };

  const isButtonDisabled = isSubmitting || cooldown > 0;

  return (
    <div className={`bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 ${className}`}>
      
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Haute Concierge Desk</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
          Connect With Our Jewellery Curators
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
          Questions about custom commissions, gemological specifications, or bespoke AI styling? Send us an inquiry below.
        </p>
      </div>

      {submittedSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <p className="font-semibold text-emerald-950">Inquiry Delivered</p>
            <p className="mt-0.5">
              Your inquiry has been stored securely in our cloud repository. A specialist will reply within 24 hours.
            </p>
          </div>
        </div>
      )}

      {/* Suggested Quick Inquiry Topics */}
      <div className="mb-6">
        <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
          Quick Topics:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            'Custom Engagement Ring Commission',
            'Bespoke Gemstone Sourcing',
            'Virtual Try-On Consultation',
            'Boutique Partnership Inquiry',
          ].map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => {
                const current = watch('message') || '';
                const prefix = `[Topic: ${topic}] `;
                if (!current.startsWith('[Topic:')) {
                  setValue('message', `${prefix}${current}`.trim());
                }
              }}
              className="text-[11px] font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 active:bg-amber-100 active:text-amber-900 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              + {topic}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        
        {/* HONEYPOT FIELD - Invisible to real humans, traps automated spam bots */}
        <div 
          aria-hidden="true" 
          style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
        >
          <label htmlFor="hp_check">Verification (Leave Blank)</label>
          <input
            id="hp_check"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register('_hp_verification')}
          />
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="contact-name" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-stone-400" />
              Full Name <span className="text-rose-500">*</span>
            </span>
            <span className="text-[10px] text-stone-400 font-normal">2 - 80 characters</span>
          </label>
          <input
            id="contact-name"
            type="text"
            placeholder="e.g. Eleanor Vance"
            disabled={isSubmitting}
            {...register('name')}
            className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
              errors.name 
                ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' 
                : 'border-stone-200 focus:ring-amber-500/20 focus:border-amber-500'
            } disabled:opacity-60`}
          />
          {errors.name && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="contact-email" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-stone-400" />
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            placeholder="e.g. eleanor@vance-atelier.com"
            disabled={isSubmitting}
            {...register('email')}
            className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
              errors.email 
                ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' 
                : 'border-stone-200 focus:ring-amber-500/20 focus:border-amber-500'
            } disabled:opacity-60`}
          />
          {errors.email && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="contact-message" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
              Inquiry / Message <span className="text-rose-500">*</span>
            </span>
            <span className={`text-[10px] ${messageVal.length > 2000 ? 'text-rose-600 font-bold' : 'text-stone-400'}`}>
              {messageVal.length} / 2000
            </span>
          </label>
          <textarea
            id="contact-message"
            rows={4}
            placeholder="Please detail your desired jewellery commission, diamond or gemstone specifications, or platform inquiries..."
            disabled={isSubmitting}
            {...register('message')}
            className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
              errors.message 
                ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' 
                : 'border-stone-200 focus:ring-amber-500/20 focus:border-amber-500'
            } disabled:opacity-60`}
          />
          {errors.message && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.message.message}</p>
          )}
        </div>

        {/* Cooldown Warning Notice */}
        {cooldown > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center gap-2 text-xs text-amber-800">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Submit rate guard active: please wait <strong>{cooldown}s</strong> before submitting again.
            </span>
          </div>
        )}

        {/* Submit Button & Security Assurance */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>RLS Protected &bull; SSL Encrypted</span>
          </div>

          <button
            id="contact-submit-button"
            type="submit"
            disabled={isButtonDisabled}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-900" />
                <span>Sending Inquiry...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="w-4 h-4 text-stone-700" />
                <span>Cooldown ({cooldown}s)</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-stone-900" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
