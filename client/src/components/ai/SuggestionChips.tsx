import { Suggestion } from '@/types/ai';
import { Button } from '@/components/ui/button';

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
  isLoading?: boolean;
}

export default function SuggestionChips({
  suggestions,
  onSelect,
  isLoading = false,
}: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.id}
          onClick={() => onSelect(suggestion)}
          disabled={isLoading}
          variant="outline"
          className="text-xs h-auto px-3 py-2 text-slate-300 border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-all"
        >
          {suggestion.icon && <span className="mr-2">{suggestion.icon}</span>}
          {suggestion.text}
        </Button>
      ))}
    </div>
  );
}
