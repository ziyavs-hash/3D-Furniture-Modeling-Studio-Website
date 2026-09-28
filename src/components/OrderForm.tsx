import { useState, useRef } from 'react';
import { Send, Upload, FileText, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { WHATSAPP_LINK, WHATSAPP_DEFAULT_MESSAGE } from '@/lib/constants';
import { useReveal } from '@/hooks/useReveal';
import { useI18n, optionTranslations } from '@/lib/i18n';

type FormState = {
  name: string;
  email: string;
  phone: string;
  service: string;
  furniture_category: string;
  pinterest_url: string;
  description: string;
};

const INITIAL: FormState = {
  name: '',
  email: '',
  phone: '',
  service: '',
  furniture_category: '',
  pinterest_url: '',
  description: '',
};

export default function OrderForm() {
  const { ref, isVisible } = useReveal();
  const { language, t } = useI18n();
  const serviceOptions = optionTranslations[language].services;
  const categoryOptions = optionTranslations[language].categories;
  const [form, setForm] = useState<FormState>(INITIAL);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let filePath: string | null = null;

      if (file) {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('order-files')
          .upload(fileName, file);
        if (uploadError) throw new Error(t.order.uploadError);
        filePath = fileName;
      }

      const { error: insertError } = await supabase.from('orders').insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        service: form.service,
        furniture_category: form.furniture_category || null,
        pinterest_url: form.pinterest_url || null,
        description: form.description || null,
        file_path: filePath,
      });

      if (insertError) throw new Error(t.order.submitError);

      setSuccess(true);
      setForm(INITIAL);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : t.order.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="order" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#d4af37]/[0.04] blur-[120px]" />
      <div className="max-w-4xl mx-auto px-5 sm:px-8 relative">
        <div ref={ref} className={`reveal ${isVisible ? 'is-visible' : ''} text-center mb-12`}>
          <span className="text-sm font-medium text-[#d4af37] tracking-widest uppercase">{t.order.eyebrow}</span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3">
            {t.order.title}
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-lg">
            {t.order.subtitle}
          </p>
        </div>

        {success ? (
          <div className="glass-strong rounded-2xl p-10 text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-[#d4af37]/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[#d4af37]" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white mb-3">{t.order.successTitle}</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {t.order.successText}
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-6 px-6 py-3 rounded-full glass text-white font-medium hover:bg-white/10 transition-colors"
            >
              {t.order.newOrder}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6 sm:p-10 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.order.name}</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]/50 focus:bg-white/[0.07] transition-all"
                  placeholder={t.order.namePlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.order.email}</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]/50 focus:bg-white/[0.07] transition-all"
                  placeholder={t.order.emailPlaceholder}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.order.phone}</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]/50 focus:bg-white/[0.07] transition-all"
                placeholder={t.order.phonePlaceholder}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.order.service}</label>
                <select
                  required
                  value={form.service}
                  onChange={(e) => handleChange('service', e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#d4af37]/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#1a1a1c]">{t.order.choose}</option>
                  {serviceOptions.map((s) => (
                    <option key={s} value={s} className="bg-[#1a1a1c]">{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.order.category}</label>
                <select
                  value={form.furniture_category}
                  onChange={(e) => handleChange('furniture_category', e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#d4af37]/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#1a1a1c]">{t.order.choose}</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c} className="bg-[#1a1a1c]">{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.order.pinterest}</label>
              <input
                type="url"
                value={form.pinterest_url}
                onChange={(e) => handleChange('pinterest_url', e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]/50 focus:bg-white/[0.07] transition-all"
                placeholder={t.order.pinterestPlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.order.details}</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]/50 focus:bg-white/[0.07] transition-all resize-none"
                placeholder={t.order.detailsPlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.order.file}</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-6 rounded-xl bg-white/5 border border-dashed border-white/10 hover:border-[#d4af37]/40 hover:bg-white/[0.07] transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                {file ? (
                  <>
                    <FileText className="w-8 h-8 text-[#d4af37]" />
                    <span className="text-sm text-white">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-500" />
                    <span className="text-sm text-gray-400">{t.order.fileTypes}</span>
                    <span className="text-xs text-gray-600">{t.order.fileClick}</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf,.webp,.bmp,.tiff,.svg,.zip,.rar,.max,.rfa,.obj,.fbx,.skp"
                className="hidden"
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#d4af37] text-[#0a0a0b] font-semibold text-base hover:bg-[#e0bd4a] transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-[#0a0a0b]/30 border-t-[#0a0a0b] rounded-full animate-spin" />
                  {t.order.sending}...
                </span>
              ) : (
                <>
                  {t.order.send}
                  <Send className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="relative flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">{t.order.or}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <a
              href={`${WHATSAPP_LINK}?text=${WHATSAPP_DEFAULT_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#25D366] text-white font-semibold text-base hover:bg-[#1da851] transition-all duration-300 hover:scale-[1.01]"
            >
              <MessageCircle className="w-5 h-5" />
              {t.order.whatsapp}
            </a>
          </form>
        )}
      </div>
    </section>
  );
}
