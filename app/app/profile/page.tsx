'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Target,
  Zap,
  CheckCircle,
  Settings,
  Save,
  Camera
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const profileData = {
  name: 'John Doe',
  email: 'john@example.com',
  location: 'Cape Town, South Africa',
  joinedDate: 'December 2024',
  title: 'Frontend Developer',
  bio: 'Passionate about creating beautiful, user-friendly web applications.',
};

const activityLog = [
  { action: 'Created resume', item: 'Software Engineer Resume', time: '2 hours ago', type: 'create' },
  { action: 'Tailored to job', item: 'Google Frontend Developer', time: '1 day ago', type: 'tailor' },
  { action: 'Generated cover letter', item: 'Meta Product Designer', time: '3 days ago', type: 'cover' },
  { action: 'Updated profile', item: 'Professional title changed', time: '5 days ago', type: 'profile' },
  { action: 'ATS check passed', item: 'Startup Founder Resume', time: '1 week ago', type: 'check' },
];

const preferences = {
  emailNotifications: true,
  marketingEmails: false,
  weeklyDigest: true,
  newFeatures: true,
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profileData);
  const [notificationPrefs, setNotificationPrefs] = useState(preferences);

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditedProfile(profileData);
    setIsEditing(false);
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile & Activity</h1>
            <p className="text-muted-foreground">
              Manage your account and view your JobMatchly activity
            </p>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                      </CardTitle>
                      {!isEditing ? (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={handleCancel}>
                            Cancel
                          </Button>
                          <Button onClick={handleSave}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Avatar Section */}
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar className="w-20 h-20">
                            <AvatarFallback className="text-xl">
                              {editedProfile.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {isEditing && (
                            <motion.button
                              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg"
                              whileHover={{ scale: 1.1 }}
                              onClick={() => toast.info('Avatar upload coming soon!')}
                            >
                              <Camera className="h-4 w-4 text-primary-foreground" />
                            </motion.button>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{editedProfile.name}</h3>
                          <p className="text-muted-foreground">{editedProfile.title}</p>
                          <Badge variant="outline" className="mt-2">
                            Member since {profileData.joinedDate}
                          </Badge>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={editedProfile.name}
                            onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                            disabled={!isEditing}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={editedProfile.email}
                            onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                            disabled={!isEditing}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="title">Professional Title</Label>
                          <Input
                            id="title"
                            value={editedProfile.title}
                            onChange={(e) => setEditedProfile({...editedProfile, title: e.target.value})}
                            disabled={!isEditing}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={editedProfile.location}
                            onChange={(e) => setEditedProfile({...editedProfile, location: e.target.value})}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input
                          id="bio"
                          value={editedProfile.bio}
                          onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                          disabled={!isEditing}
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activityLog.map((activity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.type === 'create' ? 'bg-blue-100 dark:bg-blue-900' :
                            activity.type === 'tailor' ? 'bg-green-100 dark:bg-green-900' :
                            activity.type === 'cover' ? 'bg-purple-100 dark:bg-purple-900' :
                            activity.type === 'profile' ? 'bg-orange-100 dark:bg-orange-900' :
                            'bg-gray-100 dark:bg-gray-900'
                          }`}>
                            {activity.type === 'create' && <FileText className="h-4 w-4" />}
                            {activity.type === 'tailor' && <Target className="h-4 w-4" />}
                            {activity.type === 'cover' && <Mail className="h-4 w-4" />}
                            {activity.type === 'profile' && <User className="h-4 w-4" />}
                            {activity.type === 'check' && <CheckCircle className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.item}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Stats Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { label: 'Resumes Created', value: '8', icon: FileText },
                  { label: 'Jobs Applied', value: '23', icon: Target },
                  { label: 'Avg ATS Score', value: '87%', icon: CheckCircle },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-6 text-center">
                        <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                        <div className="text-2xl font-bold mb-1">{stat.value}</div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive important updates via email' },
                      { key: 'marketingEmails', label: 'Marketing Emails', description: 'Tips, tutorials, and product news' },
                      { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Summary of your activity and new features' },
                      { key: 'newFeatures', label: 'New Features', description: 'Be the first to know about new features' },
                    ].map((pref, index) => (
                      <motion.div
                        key={pref.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{pref.label}</p>
                          <p className="text-sm text-muted-foreground">{pref.description}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationPrefs[pref.key as keyof typeof notificationPrefs]}
                          onChange={(e) => {
                            setNotificationPrefs({
                              ...notificationPrefs,
                              [pref.key]: e.target.checked
                            });
                            toast.success('Preferences updated');
                          }}
                          className="w-4 h-4"
                        />
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Account Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => toast.info('Export feature coming soon!')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export All Data
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => toast.info('Password reset email sent!')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start"
                      onClick={() => toast.info('Account deletion requires confirmation')}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}