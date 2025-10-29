'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Activity } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { UserPlus, FileText, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface RecentActivityProps {
  activities: Activity[];
  limit?: number;
}

export function RecentActivity({ activities, limit = 10 }: RecentActivityProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Limit activities first, then paginate
  const limitedActivities = activities.slice(0, limit);
  
  // Calculate pagination
  const totalPages = Math.ceil(limitedActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayActivities = limitedActivities.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const getIcon = (eventType: Activity['type']) => {
    switch (eventType) {
      case 'signup':
        return <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
      case 'document':
        return <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
      case 'purchase':
        return <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
    }
  };

  const getBadgeClass = (eventType: Activity['type']) => {
    switch (eventType) {
      case 'signup':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'document':
        return 'bg-chart-2/10 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/20';
      case 'purchase':
        return 'bg-chart-1/10 text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]/20';
    }
  };

  const getEventLabel = (activity: Activity) => {
    switch (activity.type) {
      case 'signup':
        return 'signup';
      case 'document':
        return 'document';
      case 'purchase':
        return 'purchase';
    }
  };

  const getInitials = (name: string, email: string) => {
    if (name && name !== 'Anonymous') {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const formatRelativeTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <Card className="bg-card border-border w-full min-w-0">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
          {totalPages > 1 && (
            <div className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3 sm:space-y-4">
          {displayActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-muted transition-colors w-full min-w-0"
            >
              {/* Avatar */}
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs sm:text-sm">
                  {getInitials(activity.user.name, activity.user.email)}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                {/* User Name & Badge */}
                <div className="flex items-start gap-1.5 sm:gap-2 flex-wrap">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
                    {activity.user.name || activity.user.email}
                  </p>
                  <Badge variant="outline" className={cn(getBadgeClass(activity.type), 'flex-shrink-0')}>
                    <span className="flex items-center gap-1">
                      {getIcon(activity.type)}
                      <span className="text-[10px] sm:text-xs">{getEventLabel(activity)}</span>
                    </span>
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{activity.description}</p>

                {/* Additional Info */}
                <div className="flex items-center gap-2 flex-wrap">
                  {activity.title && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                      {activity.title}
                    </p>
                  )}
                  {activity.amount && (
                    <p className="text-[10px] sm:text-xs font-medium text-primary flex-shrink-0">
                      ${activity.amount.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 mt-1">
                {formatRelativeTime(activity.timestamp)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 border-t border-border">
            {/* Previous Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={cn(
                'group flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200',
                'bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'border border-primary/20 hover:border-primary/30',
                'min-h-[40px] sm:min-h-[44px]'
              )}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span className="text-xs sm:text-sm hidden sm:inline">Prev</span>
            </motion.button>

            {/* Page Indicators - Desktop/Tablet only */}
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'w-8 h-8 sm:w-9 sm:h-9 rounded-full font-medium text-xs sm:text-sm transition-all duration-200',
                    page === currentPage
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  )}
                >
                  {page}
                </motion.button>
              ))}
            </div>

            {/* Mobile Page Counter */}
            <div className="sm:hidden text-xs text-muted-foreground font-medium px-2">
              {currentPage} / {totalPages}
            </div>

            {/* Next Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={cn(
                'group flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200',
                'bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'border border-primary/20 hover:border-primary/30',
                'min-h-[40px] sm:min-h-[44px]'
              )}
            >
              <span className="text-xs sm:text-sm hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </motion.button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
