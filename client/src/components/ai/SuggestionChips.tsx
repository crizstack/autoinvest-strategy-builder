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
          className="text-xs h-auto px-3 py-2 text-[#B8C2B8] border-[#235317]/45 hover:border-[#6B756B]/40 hover:bg-[#141C14]/50 transition-all"
        >
          {suggestion.icon && <span className="mr-2">{suggestion.icon}</span>}
          {suggestion.text}
        </Button>
      ))}
    </div>
  );
}
