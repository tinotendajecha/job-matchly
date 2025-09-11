import { z } from "zod";

/**
 * All fields required (OpenAI structured outputs constraint).
 * Provide safe defaults instead of .optional().
 */
export const ResumeSchema = z.object({
  name: z.string().default(""),
  headline: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  website: z.string().default(""),

  // NEW: Social links (plain URLs or "Label | URL")
  socialLinks: z.array(z.string()).default([]),

  summary: z.string().default(""),
  skills: z.array(z.string()).default([]),

  experience: z.array(z.object({
    company: z.string().default(""),
    role: z.string().default(""),
    start: z.string().default(""),
    end: z.string().default(""),
    bullets: z.array(z.string()).default([]),
  })).default([]),

  education: z.array(z.object({
    school: z.string().default(""),
    degree: z.string().default(""),
    year: z.string().default(""),
  })).default([]),

  // (Optional for later) projects users sometimes include
  projects: z.array(z.object({
    name: z.string().default(""),
    link: z.string().default(""),
    summary: z.string().default(""),
    bullets: z.array(z.string()).default([]),
  })).default([]),

  // NEW: References (include only if provided)
  references: z.array(z.object({
    name: z.string().default(""),
    title: z.string().default(""),
    company: z.string().default(""),
    contact: z.string().default(""), // email/phone or "Available upon request"
  })).default([]),
});

export type ResumeJson = z.infer<typeof ResumeSchema>;
