import { useState } from 'react';
import { useDebug, DebugEvent } from '@/contexts/DebugContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bug, 
  X, 
  Trash2, 
  Download, 
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  AlertCircle,
  RefreshCw,
  Navigation,
  MessageSquare
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const categoryConfig: Record<DebugEvent['category'], { icon: React.ReactNode; color: string; label: string }> = {
  form: { icon: <FileText className="h-3 w-3" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Form' },
  api: { icon: <Globe className="h-3 w-3" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'API' },
  response: { icon: <RefreshCw className="h-3 w-3" />, color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Response' },
  error: { icon: <AlertCircle className="h-3 w-3" />, color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Error' },
  state: { icon: <RefreshCw className="h-3 w-3" />, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'State' },
  navigation: { icon: <Navigation className="h-3 w-3" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'Nav' },
  prompt: { icon: <MessageSquare className="h-3 w-3" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Prompt' },
};

const EventItem = ({ event }: { event: DebugEvent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const config = categoryConfig[event.category];
  const hasDetails = event.details && Object.keys(event.details).length > 0;
  
  return (
    <div className="border-b border-border/50 py-2 px-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-2">
        <Badge variant="outline" className={`${config.color} text-[10px] px-1.5 py-0 flex items-center gap-1`}>
          {config.icon}
          {config.label}
        </Badge>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium truncate">{event.action}</span>
            {event.duration && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {event.duration}ms
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {event.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{event.timestamp.getMilliseconds().toString().padStart(3, '0')}
          </span>
        </div>
        {hasDetails && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        )}
      </div>
      {hasDetails && isOpen && (
        <pre className="mt-2 p-2 bg-muted/50 rounded text-[10px] overflow-x-auto max-h-40 overflow-y-auto">
          {typeof event.details === 'string' 
            ? event.details 
            : JSON.stringify(event.details, null, 2)}
        </pre>
      )}
    </div>
  );
};

export const DebugPanel = () => {
  const { events, isDebugMode, toggleDebugMode, clearLogs, exportLogs } = useDebug();
  const [isMinimized, setIsMinimized] = useState(false);
  const [filter, setFilter] = useState<DebugEvent['category'] | 'all'>('all');
  
  if (!isDebugMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm shadow-lg"
        onClick={toggleDebugMode}
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug
      </Button>
    );
  }

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.category === filter);

  const stats = {
    total: events.length,
    errors: events.filter(e => e.category === 'error').length,
    api: events.filter(e => e.category === 'api').length,
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="bg-background/95 backdrop-blur-sm shadow-xl border-primary/20 w-48">
          <CardHeader className="p-2 flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">{stats.total} Events</span>
              {stats.errors > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1">{stats.errors}</Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsMinimized(false)}>
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={toggleDebugMode}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="bg-background/95 backdrop-blur-sm shadow-xl border-primary/20 w-96 max-h-[70vh] flex flex-col">
        <CardHeader className="p-3 border-b flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Debug-Protokoll</CardTitle>
            <Badge variant="secondary" className="text-[10px]">{stats.total}</Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={exportLogs} title="Exportieren">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={clearLogs} title="Löschen">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsMinimized(true)}>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={toggleDebugMode}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        
        {/* Filter Tabs */}
        <div className="p-2 border-b flex gap-1 flex-wrap">
          <Badge 
            variant={filter === 'all' ? 'default' : 'outline'} 
            className="cursor-pointer text-[10px]"
            onClick={() => setFilter('all')}
          >
            Alle ({stats.total})
          </Badge>
          {(Object.keys(categoryConfig) as DebugEvent['category'][]).map(cat => {
            const count = events.filter(e => e.category === cat).length;
            if (count === 0) return null;
            return (
              <Badge 
                key={cat}
                variant={filter === cat ? 'default' : 'outline'} 
                className={`cursor-pointer text-[10px] ${filter === cat ? '' : categoryConfig[cat].color}`}
                onClick={() => setFilter(cat)}
              >
                {categoryConfig[cat].label} ({count})
              </Badge>
            );
          })}
        </div>

        <ScrollArea className="flex-1 max-h-80">
          {filteredEvents.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Keine Events protokolliert
            </div>
          ) : (
            <div className="flex flex-col-reverse">
              {filteredEvents.slice().reverse().map(event => (
                <EventItem key={event.id} event={event} />
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};
