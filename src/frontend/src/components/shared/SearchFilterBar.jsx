import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchFilterBar({ onSearch, placeholder = 'Search attacks...' }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        Search
      </button>
    </form>
  );
}
