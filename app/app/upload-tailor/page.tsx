'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload,
  FileText,
  Target,
  Download,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Zap,
  Link as LinkIcon
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function UploadTailorPage() {
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [atsScore, setAtsScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('text');

  const handleResumeUpload = () => {
    setResumeUploaded(true);
    toast.success('Resume uploaded successfully!');
  };

  const handleTailor = () => {
    if (!resumeUploaded || !jobDescription.trim()) {
      toast.error('Please upload a resume and add a job description');
      return;
    }
    
    setShowResults(true);
    // Animate ATS score
    let score = 0;
    const targetScore = 87;
    const interval = setInterval(() => {
      score += 2;
      setAtsScore(score);
      if (score >= targetScore) {
        clearInterval(interval);
      }
    }, 50);
    
    toast.success('Resume tailored successfully! 🎯');
  };

  const keywords = [
    { word: 'React', matched: true, frequency: 3 },
    { word: 'TypeScript', matched: true, frequency: 2 },
    { word: 'Problem-solving', matched: true, frequency: 1 },
    { word: 'Agile', matched: false, frequency: 0 },
    { word: 'Leadership', matched: false, frequency: 0 },
    { word: 'Node.js', matched: true, frequency: 1 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Upload & Tailor</h1>
            <p className="text-muted-foreground">
              Upload your resume and job description to see how well they match
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Inputs */}
            <div className="space-y-6">
              {/* Resume Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Resume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!resumeUploaded ? (
                    <motion.div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      onClick={handleResumeUpload}
                    >
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Drop your resume here</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Supports PDF, DOCX, and image files
                      </p>
                      <Button variant="outline">Choose File</Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">John_Doe_Resume.pdf</p>
                        <p className="text-sm text-muted-foreground">Uploaded successfully</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Job Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Job Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="text">Paste Text</TabsTrigger>
                      <TabsTrigger value="upload">Upload File</TabsTrigger>
                      <TabsTrigger value="url">URL</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text" className="space-y-4">
                      <Textarea
                        placeholder="Paste the job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={8}
                        className="resize-none"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{jobDescription.length} characters</span>
                        <span>Minimum 100 characters recommended</span>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="upload" className="space-y-4">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Upload job posting (PDF, DOCX)</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => toast.info('File upload coming soon!')}>
                          Choose File
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="url" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="jobUrl">Job Posting URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="jobUrl"
                            placeholder="https://company.com/careers/job-id"
                            className="flex-1"
                          />
                          <Button variant="outline" onClick={() => toast.info('URL import coming soon!')}>
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  size="lg"
                  onClick={handleTailor}
                  disabled={!resumeUploaded || !jobDescription.trim()}
                  className="flex-1"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Generate Tailored Resume
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleTailor}
                  disabled={!resumeUploaded || !jobDescription.trim()}
                  className="flex-1"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Cover Letter
                </Button>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6">
              {showResults ? (
                <>
                  {/* ATS Score */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          ATS Compatibility Score
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center space-y-4">
                          <motion.div
                            className="text-4xl font-bold text-green-600"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            {atsScore}%
                          </motion.div>
                          <Progress value={atsScore} className="h-3" />
                          <p className="text-sm text-muted-foreground">
                            Great! Your resume is ATS-friendly
                          </p>
                        </div>
                        
                        <div className="space-y-3 mt-6">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Standard formatting detected</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Keywords properly integrated</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">Consider adding more technical skills</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Keyword Matching */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Keyword Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm">
                            <span>Match Rate</span>
                            <span className="font-medium">67% (4/6 keywords)</span>
                          </div>
                          
                          <div className="space-y-2">
                            {keywords.map((keyword, index) => (
                              <motion.div
                                key={keyword.word}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                              >
                                <div className="flex items-center gap-2">
                                  {keyword.matched ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                  )}
                                  <span className="text-sm font-medium">{keyword.word}</span>
                                </div>
                                <Badge variant={keyword.matched ? "default" : "secondary"}>
                                  {keyword.matched ? `${keyword.frequency}x` : 'Missing'}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Download Actions */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Download Your Documents</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full justify-between" onClick={() => toast.info('Download coming soon!')}>
                          <span className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Tailored Resume (PDF)
                          </span>
                          <Badge variant="secondary">Ready</Badge>
                        </Button>
                        
                        <Button variant="outline" className="w-full justify-between" onClick={() => toast.info('Download coming soon!')}>
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Cover Letter (PDF)
                          </span>
                          <Badge variant="secondary">Ready</Badge>
                        </Button>
                        
                        <Button variant="outline" className="w-full justify-between" onClick={() => toast.info('Download coming soon!')}>
                          <span className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            ATS Report
                          </span>
                          <Badge variant="secondary">Ready</Badge>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center p-8">
                    <Target className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Ready to Tailor?</h3>
                    <p className="text-muted-foreground">
                      Upload your resume and add a job description to see the magic happen
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}