import { useState } from 'react';
import { Resource } from '../types';
import { Download, Star, FileText, ArrowRight, Heart, Video, Newspaper } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onSelect: (resource: Resource) => void;
  onQuickDownload?: (resource: Resource) => void;
  isSaved?: boolean;
  onToggleSaved?: (resource: Resource) => void;
}

export function ResourceCard({ resource, onSelect, onQuickDownload, isSaved = false, onToggleSaved }: ResourceCardProps) {
  const [imgError, setImgError] = useState(false);
  const isJambIssue = resource.category === 'jamb_issues';

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'post_utme':
        return 'Post-UTME Past Exam';
      case 'jamb_utme':
        return 'JAMB UTME Past Paper';
      case 'jamb_issues':
        return 'JAMB Issue';
      case 'syllabus_novel':
        return 'Novel & Syllabus Guide';
      case 'formula_sheet':
        return 'Formula Handbook';
      case 'bundle':
        return 'Faculty 4-in-1 Pack';
      default:
        return 'Study Resource';
    }
  };

  return (
    <article className="group bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden h-full">
      
      {/* Visual Cover Area */}
      <div 
        onClick={() => onSelect(resource)}
        className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer"
      >
        {!imgError && resource.coverUrl ? (
          <img
            src={resource.coverUrl}
            alt={resource.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-300"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          /* Styled CSS Fallback Container */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0F294A] to-[#1E3A8A] text-white text-center">
            {isJambIssue && resource.mediaType !== 'video' ? <Newspaper className="w-12 h-12 text-orange-400 mb-2 opacity-80" /> : resource.mediaType === 'video' ? <Video className="w-12 h-12 text-orange-400 mb-2 opacity-80" /> : <FileText className="w-12 h-12 text-orange-400 mb-2 opacity-80" />}
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
              {resource.institution || 'Sam Edu Hub'}
            </span>
            <p className="text-sm font-bold line-clamp-2 mt-1">
              {resource.title}
            </p>
          </div>
        )}

        {/* Free / Paid Marker (unboxed clean tag or top right indicator) */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {isJambIssue ? (
            <span className="px-2.5 py-1 text-xs font-bold text-orange-800 bg-orange-50 border border-orange-200/80 rounded-md shadow-xs">
              {resource.mediaType === 'video' ? 'VIDEO ISSUE' : 'JAMB UPDATE'}
            </span>
          ) : (
            <>
              {resource.mediaType === 'video' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white bg-orange-600 rounded-md shadow-xs">
                  <Video className="w-3 h-3" /> VIDEO LESSON
                </span>
              )}
              {resource.isFree ? (
                <span className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-md shadow-xs">
                  {resource.mediaType === 'video' ? 'FREE VIDEO' : 'FREE PDF'}
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-bold text-slate-900 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-md shadow-xs tabular-nums">
                  ₦{resource.price.toLocaleString()}
                </span>
              )}
            </>
          )}
        </div>

        {onToggleSaved && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleSaved(resource);
            }}
            title={isSaved ? 'Remove from saved materials' : 'Save material'}
            aria-label={isSaved ? 'Remove from saved materials' : 'Save material'}
            className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition-colors ${
              isSaved
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-white/70 bg-white/90 text-slate-500 hover:text-rose-600'
            }`}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        
        <div>
          {/* Quiet 1-line metadata kicker (No pills, unboxed with dot separators) */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5 truncate">
            <span>{resource.institution || 'JAMB UTME'}</span>
            <span aria-hidden="true">·</span>
            <span>{resource.yearRange}</span>
            <span aria-hidden="true">·</span>
              <span>{isJambIssue ? resource.mediaType === 'video' ? 'Video Issue' : 'JAMB Issue' : resource.mediaType === 'video' ? 'Video' : resource.format.split(' ')[0]}</span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onSelect(resource)}
            className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors cursor-pointer line-clamp-2 leading-snug"
          >
            {resource.title}
          </h3>

          {/* Brief Description */}
          <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
            {resource.description}
          </p>
        </div>

        {/* Card Footer: Metrics & Interactive Action */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          
          <div className="flex items-center justify-between text-xs text-slate-500">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-slate-800 tabular-nums">{resource.rating.toFixed(1)}</span>
              <span className="text-slate-400">({resource.reviewCount})</span>
            </div>

            {/* Downloads count */}
            <div className="flex items-center gap-1 tabular-nums text-slate-500">
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>{resource.downloadsCount.toLocaleString()} downloads</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onSelect(resource)}
              className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{isJambIssue ? resource.mediaType === 'video' ? 'Watch JAMB Video' : 'Read JAMB Issue' : resource.mediaType === 'video' ? 'Watch Video' : resource.isFree ? 'Read & Download' : 'View Past Questions'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {resource.isFree && !isJambIssue && onQuickDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickDownload(resource);
                }}
                title={resource.mediaType === 'video' ? 'Quick Free Video Access' : 'Quick Free PDF Download'}
                className="py-2 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold rounded-lg transition-colors border border-orange-200 cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{resource.mediaType === 'video' ? 'Watch' : 'Get PDF'}</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </article>
  );
}
