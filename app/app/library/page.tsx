'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Filter,
  Grid3X3,
  List,
  FileText,
  MoreVertical,
  Eye,
  Copy,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockResumes = [
  {
    id: '1',
    name: 'Software Engineer Resume',
    template: 'Modern',
    lastEdited: '2 hours ago',
    atsScore: 92,
    tailoredFor: 'Google Frontend Developer',
    createdAt: '2025-01-15'
  },
  {
    id: '2', 
    name: 'Product Manager CV',
    template: 'Classic',
    lastEdited: '1 day ago',
    atsScore: 88,
    tailoredFor: 'Meta Product Manager',
    createdAt: '2025-01-14'
  },
  {
    id: '3',
    name: 'Data Analyst Resume',
    template: 'Modern', 
    lastEdited: '3 days ago',
    atsScore: 85,
    tailoredFor: 'Microsoft Data Analyst',
    createdAt: '2025-01-12'
  },
  {
    id: '4',
    name: 'UX Designer Portfolio',
    template: 'Creative',
    lastEdited: '1 week ago', 
    atsScore: 79,
    tailoredFor: 'Figma UX Designer',
    createdAt: '2025-01-08'
  }
];

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResumes, setFilteredResumes] = useState(mockResumes);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = mockResumes.filter(resume =>
      resume.name.toLowerCase().includes(query.toLowerCase()) ||
      resume.tailoredFor.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredResumes(filtered);
  };

  const handleAction = (action: string, resumeId: string, resumeName: string) => {
    switch (action) {
      case 'preview':
        toast.info(`Opening preview for ${resumeName}`);
        break;
      case 'edit':
        toast.success(`Editing ${resumeName}`);
        window.location.href = `/app/builder/${resumeId}`;
        break;
      case 'duplicate':
        toast.success(`Duplicated ${resumeName}`);
        break;
      case 'delete':
        toast.success(`Deleted ${resumeName}`);
        setFilteredResumes(filteredResumes.filter(r => r.id !== resumeId));
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Library</h1>
              <p className="text-muted-foreground">
                Manage all your resumes and cover letters in one place
              </p>
            </div>
            
            <Button asChild>
              <Link href="/app/builder/new">
                <Plus className="h-4 w-4 mr-2" />
                New Resume
              </Link>
            </Button>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {filteredResumes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No resumes found' : 'No resumes yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start by building your first resume or uploading an existing one'
                }
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/app/builder/new">Create First Resume</Link>
                </Button>
              )}
            </motion.div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {filteredResumes.map((resume, index) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  {viewMode === 'grid' ? (
                    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <CardContent className="p-0">
                        {/* Preview Thumbnail */}
                        <div className="aspect-[8.5/11] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center border-b">
                          <div className="w-16 h-20 bg-white shadow-md rounded-sm flex flex-col p-1">
                            <div className="h-1 bg-gray-900 rounded-sm mb-0.5" />
                            <div className="h-0.5 bg-gray-600 rounded-sm w-3/4 mb-1" />
                            <div className="space-y-0.5 flex-1">
                              <div className="h-0.5 bg-gray-400 rounded-sm" />
                              <div className="h-0.5 bg-gray-400 rounded-sm w-5/6" />
                              <div className="h-0.5 bg-gray-400 rounded-sm w-4/6" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Card Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                              {resume.name}
                            </h3>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleAction('preview', resume.id, resume.name)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('edit', resume.id, resume.name)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('duplicate', resume.id, resume.name)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleAction('delete', resume.id, resume.name)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <Badge variant="outline">{resume.template}</Badge>
                              <Badge 
                                variant={resume.atsScore >= 85 ? "default" : "secondary"}
                                className="gap-1"
                              >
                                ATS {resume.atsScore}%
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-muted-foreground">
                              Tailored for: {resume.tailoredFor}
                            </p>
                            
                            <p className="text-xs text-muted-foreground">
                              Last edited: {resume.lastEdited}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // List view
                    <Card className="group hover:shadow-md transition-shadow duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-16 bg-gradient-to-br from-primary/5 to-primary/10 rounded flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                              {resume.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Tailored for: {resume.tailoredFor}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{resume.lastEdited}</span>
                              <span>•</span>
                              <span>{resume.template} template</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={resume.atsScore >= 85 ? "default" : "secondary"}
                              className="gap-1"
                            >
                              ATS {resume.atsScore}%
                            </Badge>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleAction('preview', resume.id, resume.name)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('edit', resume.id, resume.name)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('duplicate', resume.id, resume.name)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleAction('delete', resume.id, resume.name)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}