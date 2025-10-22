'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Header } from '@/components/layout/header';
import { Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';

import { useTailorStore } from '@/lib/zustand/store';
import { WizardStepper } from './components/WizardStepper';
import { StepOne } from './components/StepOne';
import { StepTwo } from './components/StepTwo';
import { StepThree } from './components/StepThree';
// Cover letter generation is handled locally in this component





// ------------------- Component -------------------
export default function UploadTailorWizardPage() {
  const router = useRouter();

  // pull everything we need from the store
  const {
    step, setStep,
    resumeParsed, setResumeParsed,
    resumeFileName, setResumeFileName,
    resumeText, setResumeText,
    resumeJson, setResumeJson,
    jobDescription, setJobDescription,
    jdProvided, setJdProvided,
    activeTab, setActiveTab,
    imageOCRDone, setImageOCRDone,
    jdImageName, setJdImageName,
    analysis, setAnalysis,
    atsScore, setAtsScore,
    tailoredMarkdown, setTailoredMarkdown,
    steps, setStepStatus,
    downloadFmt, setDownloadFmt,
    resetOCR, resetAll,
    generatedCoverLetter, setGeneratedCoverLetter,
    generatedCoverTitle, setGeneratedCoverTitle
  } = useTailorStore();

  // Cover letter state
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverDocId, setCoverDocId] = useState<string | null>(null);
  const [coverTitle, setCoverTitle] = useState<string>('');
  const [coverMarkdown, setCoverMarkdown] = useState<string>('');
  const [coverLetterGenerated, setCoverLetterGenerated] = useState(false);

  async function handleGenerateCoverLetterWrapper() {
    if (!tailoredMarkdown || !resumeText || !jobDescription) {
      toast.info("Generate your tailored resume first.");
      return;
    }
    setCoverLoading(true);
    try {
      const r = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          resumeText: tailoredMarkdown,
          jdText: jobDescription,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok)
        throw new Error(j?.error || "Cover letter generation failed");
      setCoverDocId(j.id);
      setCoverTitle(j.title);
      setCoverMarkdown(j.markdown);
      setCoverLetterGenerated(true);

      // Set to global store
      setGeneratedCoverLetter(j.markdown);

      // Set Cover title as well to global store
      setGeneratedCoverTitle(j.title)
      console.log(j.markdown);

      toast.success("Cover letter generated!");
    } catch (e: any) {
      toast.error(e?.message || "Could not generate cover letter");
    } finally {
      setCoverLoading(false);
    }
  }

  // ------------------- Render -------------------
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto p-4 py-6 md:py-8 max-w-6xl">
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Tailor your resume in 3 easy steps <Sparkles className="inline h-6 w-6 text-primary ml-1" />
          </h1>
        </div>

        <WizardStepper steps={steps} />

        {/* STEP 1 — Upload Resume */}
        {step === 1 && (
          <StepOne
            resumeParsed={resumeParsed}
            resumeFileName={resumeFileName}
            steps={steps}
            onResumeParsed={(data) => {
              setResumeFileName(data.fileName);
              setResumeText(data.resumeText);
              setResumeJson(data.resumeJson);
              setResumeParsed(data.parsed);
            }}
            onStepChange={(step) => setStep(step as any)}
            onSetStepStatus={setStepStatus}
            router={router}
          />
        )}

        {/* STEP 2 — Job Description */}
        {step === 2 && (
          <StepTwo
            jobDescription={jobDescription}
            resumeText={resumeText}
            resumeJson={resumeJson}
            resumeParsed={resumeParsed}
            jdProvided={jdProvided}
            activeTab={activeTab}
            imageOCRDone={imageOCRDone}
            jdImageName={jdImageName}
            steps={steps}
            onJobDescriptionChange={setJobDescription}
            onJdProvidedChange={setJdProvided}
            onActiveTabChange={(tab) => setActiveTab(tab as any)}
            onImageOCRDoneChange={setImageOCRDone}
            onJdImageNameChange={setJdImageName}
            onStepChange={(step) => setStep(step as any)}
            onAnalysisComplete={setAnalysis}
            onTailoredMarkdownChange={setTailoredMarkdown}
            onAtsScoreChange={setAtsScore}
            onResetOCR={resetOCR}
            onSetStepStatus={setStepStatus}
          />
        )}

        {/* STEP 3 — Tailor & Preview */}
        {step === 3 && (
          <StepThree
            tailoredMarkdown={tailoredMarkdown}
            generatedCoverLetter={generatedCoverLetter}
            analysis={analysis}
            atsScore={atsScore}
            downloadFmt={downloadFmt}
            steps={steps}
            onStepChange={(step) => setStep(step as any)}
            onResetAll={resetAll}
            onDownloadFmtChange={(fmt) => setDownloadFmt(fmt as any)}
            onGenerateCoverLetter={handleGenerateCoverLetterWrapper}
            coverLoading={coverLoading}
            coverTitle={generatedCoverTitle}
            coverMarkdown={coverMarkdown}
          />
        )}
      </div>
    </div>
  );
}

