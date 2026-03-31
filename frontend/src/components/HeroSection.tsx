interface HeroSectionProps {
  title: string;
  subtitle: string;
}

export function HeroSection({ title, subtitle }: HeroSectionProps) {
  return (
    <div className="text-center py-10 md:py-14">
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium mb-5">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        准确率 95%+
      </div>
      <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight mb-4">
        {title}
      </h1>
      <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">{subtitle}</p>
    </div>
  );
}
