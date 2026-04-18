import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { CalendarIcon, Check, ChevronDown, Clock, Filter, Save, Search, Star, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Mock data for categories and clients
const MOCK_CATEGORIES = [
  { id: "1", name: "Weddings", color: "#f472b6" },
  { id: "1-1", name: "Ceremonies", color: "#ec4899", parent: "1" },
  { id: "1-2", name: "Receptions", color: "#db2777", parent: "1" },
  { id: "2", name: "Meetings", color: "#60a5fa" },
  { id: "2-1", name: "Client Consultations", color: "#3b82f6", parent: "2" },
  { id: "2-2", name: "Vendor Meetings", color: "#2563eb", parent: "2" },
  { id: "3", name: "Deadlines", color: "#f97316" },
  { id: "4", name: "Personal", color: "#a78bfa" }
];

const MOCK_CLIENTS = [
  { id: "1", name: "John & Sarah Smith" },
  { id: "2", name: "Michael & Emily Johnson" },
  { id: "3", name: "David & Jessica Williams" },
  { id: "4", name: "Robert & Jennifer Brown" }
];

const EVENT_STATUSES = [
  { id: "confirmed", name: "Confirmed" },
  { id: "tentative", name: "Tentative" },
  { id: "cancelled", name: "Cancelled" },
  { id: "completed", name: "Completed" }
];

interface SearchQuery {
  keyword: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  clients: string[];
  categories: string[];
  statuses: string[];
}

interface SavedSearch {
  id: string;
  name: string;
  query: SearchQuery;
}

interface AdvancedSearchProps {
  onSearch: (query: SearchQuery) => void;
  onClose: () => void;
}

const AdvancedSearch = ({ onSearch, onClose }: AdvancedSearchProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [query, setQuery] = useState<SearchQuery>({
    keyword: "",
    dateRange: {
      from: null,
      to: null
    },
    clients: [],
    categories: [],
    statuses: []
  });
  
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: "1",
      name: "Upcoming Weddings",
      query: {
        keyword: "",
        dateRange: {
          from: new Date(),
          to: null
        },
        clients: [],
        categories: ["1"],
        statuses: ["confirmed", "tentative"]
      }
    },
    {
      id: "2",
      name: "This Month's Meetings",
      query: {
        keyword: "",
        dateRange: {
          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        },
        clients: [],
        categories: ["2"],
        statuses: []
      }
    }
  ]);
  
  const [isSavingSearch, setIsSavingSearch] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");
  
  // Toggle client selection
  const toggleClient = (clientId: string) => {
    setQuery(prev => ({
      ...prev,
      clients: prev.clients.includes(clientId)
        ? prev.clients.filter(id => id !== clientId)
        : [...prev.clients, clientId]
    }));
  };
  
  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setQuery(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };
  
  // Toggle status selection
  const toggleStatus = (statusId: string) => {
    setQuery(prev => ({
      ...prev,
      statuses: prev.statuses.includes(statusId)
        ? prev.statuses.filter(id => id !== statusId)
        : [...prev.statuses, statusId]
    }));
  };
  
  // Load a saved search
  const loadSavedSearch = (search: SavedSearch) => {
    setQuery(search.query);
    toast({
      title: t('calendar.search.searchLoaded'),
      description: t('calendar.search.searchLoadedDescription', { name: search.name }),
    });
  };
  
  // Save current search
  const saveSearch = () => {
    if (!newSearchName) {
      toast({
        title: t('calendar.search.nameRequired'),
        description: t('calendar.search.pleaseEnterName'),
        variant: "destructive"
      });
      return;
    }
    
    const newSearch: SavedSearch = {
      id: `${Date.now()}`,
      name: newSearchName,
      query: { ...query }
    };
    
    setSavedSearches(prev => [...prev, newSearch]);
    setNewSearchName("");
    setIsSavingSearch(false);
    
    toast({
      title: t('calendar.search.searchSaved'),
      description: t('calendar.search.searchSavedDescription', { name: newSearchName }),
    });
  };
  
  // Clear all filters
  const clearFilters = () => {
    setQuery({
      keyword: "",
      dateRange: {
        from: null,
        to: null
      },
      clients: [],
      categories: [],
      statuses: []
    });
    
    toast({
      title: t('calendar.search.filtersCleared'),
      description: t('calendar.search.filtersClearedDescription'),
    });
  };
  
  // Execute search
  const executeSearch = () => {
    onSearch(query);
    onClose();
  };
  
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{t('calendar.search.title')}</CardTitle>
        <CardDescription>{t('calendar.search.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Keyword Search */}
        <div className="space-y-2">
          <Label htmlFor="keyword">{t('calendar.search.keyword')}</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="keyword"
              placeholder={t('calendar.search.keywordPlaceholder')}
              className="pl-8"
              value={query.keyword}
              onChange={(e) => setQuery({ ...query, keyword: e.target.value })}
            />
          </div>
        </div>
        
        {/* Date Range */}
        <div className="space-y-2">
          <Label>{t('calendar.search.dateRange')}</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !query.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {query.dateRange.from ? (
                      format(query.dateRange.from, "PPP")
                    ) : (
                      <span>{t('calendar.search.startDate')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={query.dateRange.from || undefined}
                    onSelect={(date) => setQuery({
                      ...query,
                      dateRange: { ...query.dateRange, from: date }
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !query.dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {query.dateRange.to ? (
                      format(query.dateRange.to, "PPP")
                    ) : (
                      <span>{t('calendar.search.endDate')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={query.dateRange.to || undefined}
                    onSelect={(date) => setQuery({
                      ...query,
                      dateRange: { ...query.dateRange, to: date }
                    })}
                    initialFocus
                    disabled={(date) => 
                      query.dateRange.from ? date < query.dateRange.from : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        {/* Clients */}
        <div className="space-y-2">
          <Label>{t('calendar.search.clients')}</Label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
            {MOCK_CLIENTS.map(client => (
              <Badge
                key={client.id}
                variant={query.clients.includes(client.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleClient(client.id)}
              >
                {client.name}
                {query.clients.includes(client.id) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Categories */}
        <div className="space-y-2">
          <Label>{t('calendar.search.categories')}</Label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
            {MOCK_CATEGORIES.filter(cat => !cat.parent).map(category => (
              <div key={category.id} className="flex flex-col gap-1 w-full">
                <Badge
                  variant={query.categories.includes(category.id) ? "default" : "outline"}
                  className="cursor-pointer w-fit"
                  style={{ 
                    backgroundColor: query.categories.includes(category.id) ? category.color : 'transparent',
                    borderColor: category.color,
                    color: query.categories.includes(category.id) ? 'white' : 'inherit'
                  }}
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.name}
                  {query.categories.includes(category.id) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
                
                <div className="ml-4 flex flex-wrap gap-1">
                  {MOCK_CATEGORIES.filter(cat => cat.parent === category.id).map(subcat => (
                    <Badge
                      key={subcat.id}
                      variant={query.categories.includes(subcat.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={{ 
                        backgroundColor: query.categories.includes(subcat.id) ? subcat.color : 'transparent',
                        borderColor: subcat.color,
                        color: query.categories.includes(subcat.id) ? 'white' : 'inherit'
                      }}
                      onClick={() => toggleCategory(subcat.id)}
                    >
                      {subcat.name}
                      {query.categories.includes(subcat.id) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Statuses */}
        <div className="space-y-2">
          <Label>{t('calendar.search.statuses')}</Label>
          <div className="flex flex-wrap gap-2">
            {EVENT_STATUSES.map(status => (
              <Badge
                key={status.id}
                variant={query.statuses.includes(status.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleStatus(status.id)}
              >
                {status.name}
                {query.statuses.includes(status.id) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Saved Searches */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between items-center">
            <Label>{t('calendar.search.savedSearches')}</Label>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsSavingSearch(true)}
            >
              <Save className="mr-2 h-4 w-4" />
              {t('calendar.search.saveCurrentSearch')}
            </Button>
          </div>
          
          {isSavingSearch && (
            <div className="flex gap-2 items-center">
              <Input
                placeholder={t('calendar.search.searchName')}
                value={newSearchName}
                onChange={(e) => setNewSearchName(e.target.value)}
              />
              <Button size="sm" onClick={saveSearch}>
                {t('common.save')}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setIsSavingSearch(false);
                  setNewSearchName("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {savedSearches.map(search => (
              <div 
                key={search.id}
                className="flex items-center justify-between p-2 border rounded-md cursor-pointer hover:bg-muted"
                onClick={() => loadSavedSearch(search)}
              >
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>{search.name}</span>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            {t('calendar.search.clearFilters')}
          </Button>
        </div>
        <Button onClick={executeSearch}>
          <Search className="mr-2 h-4 w-4" />
          {t('calendar.search.search')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdvancedSearch;
