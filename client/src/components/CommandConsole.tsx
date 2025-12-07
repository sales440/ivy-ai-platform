import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/lib/trpc';
import { Terminal, Loader2 } from 'lucide-react';
import { COMMAND_HELP } from '@/const';

interface CommandEntry {
  id: string;
  command: string;
  result?: any;
  error?: string;
  timestamp: Date;
  executionTime?: number;
}

export function CommandConsole() {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const executeCommand = trpc.command.execute.useMutation({
    onSuccess: (data, variables) => {
      const entry: CommandEntry = {
        id: Date.now().toString(),
        command: variables.command,
        result: data.result,
        error: data.success ? undefined : data.error,
        timestamp: new Date(),
        executionTime: data.executionTime
      };
      setHistory(prev => [...prev, entry]);
      setCommand('');
      setHistoryIndex(-1);
    },
    onError: (error) => {
      const entry: CommandEntry = {
        id: Date.now().toString(),
        command: command,
        error: error.message,
        timestamp: new Date()
      };
      setHistory(prev => [...prev, entry]);
      setCommand('');
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    // Handle help command locally
    if (command.trim() === '/help') {
      const entry: CommandEntry = {
        id: Date.now().toString(),
        command: command,
        result: COMMAND_HELP,
        timestamp: new Date()
      };
      setHistory(prev => [...prev, entry]);
      setCommand('');
      return;
    }

    // Handle clear command
    if (command.trim() === '/clear') {
      setHistory([]);
      setCommand('');
      return;
    }

    // Execute command
    executeCommand.mutate({ command: command.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const commandHistory = history.map(h => h.command);
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const commandHistory = history.map(h => h.command);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const formatResult = (result: any): string => {
    if (typeof result === 'string') return result;
    if (typeof result === 'object') {
      return JSON.stringify(result, null, 2);
    }
    return String(result);
  };

  return (
    <Card className="flex flex-col h-full bg-card">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Terminal className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-card-foreground">Command Console</h3>
        <div className="ml-auto text-xs text-muted-foreground">
          Type /help for available commands
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3 font-mono text-sm">
          {history.map((entry) => (
            <div key={entry.id} className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <span>{entry.timestamp.toLocaleTimeString()}</span>
                {entry.executionTime && (
                  <span className="text-primary">({entry.executionTime}ms)</span>
                )}
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">$</span>
                <span className="text-foreground">{entry.command}</span>
              </div>
              {entry.error && (
                <div className="pl-4 text-destructive whitespace-pre-wrap">
                  Error: {entry.error}
                </div>
              )}
              {entry.result && (
                <div className="pl-4 text-muted-foreground whitespace-pre-wrap">
                  {formatResult(entry.result)}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-primary font-bold font-mono">$</span>
          <Input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            className="flex-1 font-mono"
            disabled={executeCommand.isPending}
            autoFocus
          />
          <Button
            type="submit"
            disabled={!command.trim() || executeCommand.isPending}
            size="sm"
          >
            {executeCommand.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Running
              </>
            ) : (
              'Execute'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
