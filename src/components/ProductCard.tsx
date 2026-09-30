import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (slug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(product.slug)}
      className="group relative rounded-2xl bg-zinc-900/60 border border-zinc-800/90 p-7 flex flex-col justify-between hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 cursor-pointer overflow-hidden"
    >
      {/* Subtle top indicator bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-opacity duration-300 opacity-70 group-hover:opacity-100"
        style={{ backgroundColor: product.accentColor }}
      />

      <div>
        {/* Header row: Action tag & Badge */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span
            className="text-xs font-mono font-bold px-2.5 py-1 rounded-md tracking-wider uppercase"
            style={{
              backgroundColor: `${product.accentColor}15`,
              color: product.accentColor,
              border: `1px solid ${product.accentColor}30`,
            }}
          >
            {product.shortAction}
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            {product.positioning}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors font-sans mb-2">
          {product.name}
        </h3>

        {/* Short Tagline */}
        <p className="text-sm font-medium text-zinc-300 mb-3 font-mono">
          {product.tagline}
        </p>

        {/* Description */}
        <p className="text-sm text-zinc-400 leading-relaxed mb-6 font-normal">
          {product.summary}
        </p>

        {/* Highlight points */}
        <div className="space-y-2 border-t border-zinc-800/80 pt-4 mb-6">
          {product.highlights.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-400">
              <Check
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                style={{ color: product.accentColor }}
              />
              <span className="leading-snug">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono font-medium">
        <span className="text-zinc-400 group-hover:text-white transition-colors">
          Explore specifications
        </span>
        <span
          className="inline-flex items-center gap-1 transition-transform group-hover:translate-x-1"
          style={{ color: product.accentColor }}
        >
          Learn more
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
