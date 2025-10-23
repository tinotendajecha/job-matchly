'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Activity } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { UserPlus, FileText, ShoppingCart } from 'lucide-react';

interface RecentActivityProps {
  activities: Activity[];
  limit?: number;
}

export function RecentActivity({ activities, limit = 10 }: RecentActivityProps) {
  const displayActivities = activities.slice(0, limit);

  const getIcon = (eventType: Activity['type']) => {
    switch (eventType) {
      case 'signup':
        return <UserPlus className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'purchase':
        return <ShoppingCart className="h-4 w-4" />;
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
        return 'document created';
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
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayActivities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {getInitials(activity.user.name, activity.user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.user.name || activity.user.email}
                </p>
                <Badge variant="outline" className={getBadgeClass(activity.type)}>
                  <span className="flex items-center gap-1">
                    {getIcon(activity.type)}
                    <span className="text-xs">{getEventLabel(activity)}</span>
                  </span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
              {activity.title && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {activity.title}
                </p>
              )}
              {activity.amount && (
                <p className="text-xs font-medium text-primary mt-0.5">
                  ${activity.amount.toFixed(2)}
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formatRelativeTime(activity.timestamp)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
