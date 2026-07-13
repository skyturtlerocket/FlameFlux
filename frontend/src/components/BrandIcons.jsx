import React from 'react';

// Font Awesome's "linkedin-in" glyph (letters only, no background) so we can
// drop it into our own badge and match the real LinkedIn logo colors.
export const LinkedInGlyph = ({ className }) => (
  <svg viewBox="0 0 448 512" fill="currentColor" className={className} aria-hidden="true">
    <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
  </svg>
);

export const LinkedInBadge = ({ href, label, className = '' }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className={`inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#0A66C2] hover:bg-[#0958a8] border border-white/10 transition-colors ${className}`}
  >
    <LinkedInGlyph className="w-4 h-4 text-white" />
  </a>
);
