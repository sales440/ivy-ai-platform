/**
 * Global Search Component (Cmd+K)
 * Quick navigation and search across the platform
 */

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  path: string;
  category: 'page' | 'lead' | 'ticket' | 'action';
}

const QUICK_ACTIONS: SearchResult[] = [
  { id: '1', title: 'Dashboard', description: 'View main dashboard', path: '/dashboard', category: 'page' },
  { id: '2', title: 'Leads', description: 'Manage leads', path: '/leads', category: 'page' },
  { id: '3', title: 'Tickets', description: 'View support tickets', path: '/tickets', category: 'page' },
  { id: '4', title: 'Analytics', description: 'View analytics dashboard', path: '/analytics', category: 'page' },
  { id: '5', title: 'ML Scoring', description: 'View ML scoring dashboard', path: '/analytics/ml-scoring', category: 'page' },
  { id: '6', title: 'ROI Dashboard', description: 'Revenue projections by sector', path: '/analytics/roi', category: 'page' },
  { id: '7', title: 'Campaign Metrics', description: 'Email campaign performance', path: '/analytics/campaigns', category: 'page' },
  { id: '8', title: 'Email Templates', description: 'Manage email templates', path: '/email-templates', category: 'page' },
  { id: '9', title: 'Import Leads', description: 'Import leads from CSV', path: '/admin/import-leads', category: 'action' },
  { id: '10', title: 'Scheduled Tasks', description: 'View scheduled tasks', path: '/scheduled-tasks', category: 'page' },
  { id: '11', title: 'Call History', description: 'View call history', path: '/calls', category: 'page' },
  { id: '12', title: 'Workflows', description: 'Manage workflows', path: '/workflows', category: 'page' },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      
      // Close on Escape
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter results based on query
  const filteredResults = query.length > 0
    ? QUICK_ACTIONS.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      )
    : QUICK_ACTIONS;

  const handleSelect = (path: string) => {
    setLocation(path);
    setOpen(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-2xl">
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <Input
            placeholder="Search pages, leads, tickets... (Cmd+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filteredResults.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result.path)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{result.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {result.description}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd> to close</span>
          <span>Navigate with <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↑</kbd> <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↓</kbd></span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
