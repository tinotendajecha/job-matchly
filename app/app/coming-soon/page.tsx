'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Users,
  Star,
  Briefcase,
  MapPin,
  Bell,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useState } from 'react';

const roadmapItems = [
  {
    title: 'Internship Finder',
    description: 'Discover paid internships matched to your skills and career goals. Get notified when new opportunities align with your profile.',
    icon: Users,
    eta: 'Q2 2025',
    status: 'planned',
    features: [
      'Skills-based matching algorithm',
      'Real-time notifications',
      'Company culture insights',
      'Application tracking'
    ]
  },
  {
    title: 'Scholarship Search',
    description: 'Find funding opportunities for your education. Search through thousands of scholarships based on your background and field of study.',
    icon: Star,
    eta: 'Q2 2025',
    status: 'planned',
    features: [
      'Personalized scholarship matching',
      'Deadline reminders',
      'Application requirements tracker',
      'Success rate analytics'
    ]
  },
  {
    title: 'Job Board Integration',
    description: 'Apply directly through JobMatchly with auto-tailored resumes. One-click applications to top companies.',
    icon: Briefcase,
    eta: 'Q3 2025',
    status: 'development',
    features: [
      'Auto-resume tailoring per job',
      'One-click applications',
      'Application status tracking',
      'Interview scheduling integration'
    ]
  },
  {
    title: 'Referral Network',
    description: 'Connect with alumni and professionals in your target companies. Get insider insights and referral opportunities.',
    icon: MapPin,
    eta: 'Q4 2025',
    status: 'research',
    features: [
      'Alumni network matching',
      'Company insider insights',
      'Referral request system',
      'Networking event notifications'
    ]
  }
];

export default function ComingSoonPage() {
  const [notifications, setNotifications] = useState<Record<string, boolean>>({});

  const toggleNotification = (itemTitle: string) => {
    setNotifications(prev => ({
      ...prev,
      [itemTitle]: !prev[itemTitle]
    }));
    
    const action = notifications[itemTitle] ? 'disabled' : 'enabled';
    toast.success(`Notifications ${action} for ${itemTitle}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'development': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'planned': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'research': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'development': return 'In Development';
      case 'planned': return 'Planned';
      case 'research': return 'Research Phase';
      default: return 'Coming Soon';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="h-16 w-16 text-primary mx-auto mb-6" />
            </motion.div>
            <h1 className="text-4xl font-bold mb-4">What's Coming Next</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're building the future of career success. Get notified when these features launch.
            </p>
          </div>

          {/* Roadmap Timeline */}
          <div className="space-y-8">
            {roadmapItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-3 gap-0">
                      {/* Icon & Status */}
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                          <item.icon className="h-8 w-8 text-primary" />
                        </div>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">{item.eta}</p>
                      </div>

                      {/* Content */}
                      <div className="md:col-span-2 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                            <p className="text-muted-foreground">{item.description}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <label htmlFor={`notify-${item.title}`} className="text-sm">
                              Notify me
                            </label>
                            <Switch
                              id={`notify-${item.title}`}
                              checked={notifications[item.title] || false}
                              onCheckedChange={() => toggleNotification(item.title)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Key Features:</p>
                          <ul className="grid md:grid-cols-2 gap-2">
                            {item.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Stay Updated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  We'll send you updates on feature releases and early access opportunities. 
                  You can unsubscribe at any time.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="flex-1" onClick={() => toast.success('You\'ll receive email updates!')}>
                    <Bell className="h-4 w-4 mr-2" />
                    Enable All Notifications
                  </Button>
                  <Button variant="outline" onClick={() => toast.info('Preferences updated!')}>
                    Manage Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-16 p-8 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl"
          >
            <h2 className="text-2xl font-bold mb-4">Have suggestions?</h2>
            <p className="text-muted-foreground mb-6">
              We'd love to hear what features would help you land your dream job
            </p>
            <Button variant="outline" onClick={() => toast.info('Feedback form coming soon!')}>
              Share Your Ideas
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}