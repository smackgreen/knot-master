
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VendorCategory } from "@/types";
import { useTranslation } from "react-i18next";

interface TaskFiltersProps {
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  timelineView?: "week" | "month";
  viewMode: "list" | "timeline";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTimelineViewChange?: (value: "week" | "month") => void;
}

const TaskFilters = ({
  searchTerm,
  statusFilter,
  priorityFilter,
  categoryFilter,
  timelineView,
  viewMode,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onTimelineViewChange,
}: TaskFiltersProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('tasks.search')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="w-full md:w-40">
        <Select
          value={statusFilter}
          onValueChange={onStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')} {t('common.status')}</SelectItem>
            <SelectItem value="not_started">{t('tasks.notStarted')}</SelectItem>
            <SelectItem value="in_progress">{t('tasks.inProgress')}</SelectItem>
            <SelectItem value="completed">{t('tasks.completed')}</SelectItem>
            <SelectItem value="overdue">{t('tasks.overdue')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-40">
        <Select
          value={priorityFilter}
          onValueChange={onPriorityChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('tasks.priority')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')} {t('tasks.priority')}</SelectItem>
            <SelectItem value="high">{t('tasks.high')}</SelectItem>
            <SelectItem value="medium">{t('tasks.medium')}</SelectItem>
            <SelectItem value="low">{t('tasks.low')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-40">
        <Select
          value={categoryFilter}
          onValueChange={onCategoryChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('tasks.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')} {t('tasks.categories')}</SelectItem>
            <SelectItem value="venue">{t('vendors.categories.venue')}</SelectItem>
            <SelectItem value="catering">{t('vendors.categories.catering')}</SelectItem>
            <SelectItem value="photography">{t('vendors.categories.photography')}</SelectItem>
            <SelectItem value="videography">{t('vendors.categories.videography')}</SelectItem>
            <SelectItem value="florist">{t('vendors.categories.florist')}</SelectItem>
            <SelectItem value="music">{t('vendors.categories.music')}</SelectItem>
            <SelectItem value="cake">{t('vendors.categories.cake')}</SelectItem>
            <SelectItem value="attire">{t('vendors.categories.attire')}</SelectItem>
            <SelectItem value="hair_makeup">{t('vendors.categories.hairMakeup')}</SelectItem>
            <SelectItem value="transportation">{t('vendors.categories.transportation')}</SelectItem>
            <SelectItem value="rentals">{t('vendors.categories.rentals')}</SelectItem>
            <SelectItem value="stationery">{t('vendors.categories.stationery')}</SelectItem>
            <SelectItem value="gifts">{t('vendors.categories.gifts')}</SelectItem>
            <SelectItem value="other">{t('vendors.categories.other')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {viewMode === "timeline" && onTimelineViewChange && (
        <div className="w-full md:w-40">
          <Select
            value={timelineView}
            onValueChange={onTimelineViewChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('common.view')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t('tasks.weekView')}</SelectItem>
              <SelectItem value="month">{t('tasks.monthView')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;
