// Helper functions for exporting resume

export interface ResumeData {
  header: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    website: string;
  };
  professionalSummary: string;
  skills: {
    technical: string[];
    soft: string[];
  };
  experience: any[];
  education: any[];
  projects: any[];
  certifications: any[];
  references: any[];
  changesSummary: string;
}

/**
 * Convert resume data to HTML string
 */
export function resumeDataToHtml(data: ResumeData, template: 'classic' | 'modern' = 'classic'): string {
  // Template-specific styling
  const isModern = template === 'modern';
  const h1Color = isModern ? '#2563eb' : '#111827';
  const h2Color = isModern ? '#2563eb' : '#111827';
  const borderColor = isModern ? '#2563eb' : '#d1d5db';
  const borderWidth = isModern ? '2px' : '1px';
  
  let html = '';

  // Header
  html += '<div class="section header-section">';
  html += '<div style="text-align: center; margin-bottom: 1.5rem;">';
  html += `<h1 style="color: ${h1Color};">${escapeHtml(data.header.name || 'Your Name')}</h1>`;
  html += `<p style="font-size: 1.125rem; color: #374151; margin-bottom: 0.5rem;">${escapeHtml(data.header.title || 'Professional Title')}</p>`;
  html += '<div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; font-size: 0.875rem; color: #4b5563;">';
  if (data.header.email) html += `<span>${escapeHtml(data.header.email)}</span>`;
  if (data.header.phone) html += `<span>${escapeHtml(data.header.phone)}</span>`;
  if (data.header.location) html += `<span>${escapeHtml(data.header.location)}</span>`;
  if (data.header.website) html += `<span>${escapeHtml(data.header.website)}</span>`;
  html += '</div>';
  html += '</div>';
  html += `<div style="border-bottom: ${borderWidth} solid ${borderColor}; margin-bottom: 1.5rem;"></div>`;
  html += '</div>';

  // Professional Summary
  if (data.professionalSummary) {
    html += '<div class="section">';
    const h2Style = isModern 
      ? `color: ${h2Color}; border-bottom: ${borderWidth} solid ${borderColor}; padding-bottom: 0.25rem;`
      : `color: ${h2Color};`;
    html += `<h2 style="${h2Style}">Professional Summary</h2>`;
    html += `<p style="color: #374151; line-height: 1.5;">${escapeHtml(data.professionalSummary)}</p>`;
    html += '</div>';
  }

  // Skills
  if (data.skills.technical.length > 0 || data.skills.soft.length > 0) {
    html += '<div class="section">';
    const h2Style = isModern 
      ? `color: ${h2Color}; border-bottom: ${borderWidth} solid ${borderColor}; padding-bottom: 0.25rem;`
      : `color: ${h2Color};`;
    html += `<h2 style="${h2Style}">Skills</h2>`;
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">';
    if (data.skills.technical.length > 0) {
      html += '<div>';
      html += '<h3>Technical</h3>';
      html += '<div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">';
      data.skills.technical.forEach(skill => {
        html += `<span style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">${escapeHtml(skill)}</span>`;
      });
      html += '</div>';
      html += '</div>';
    }
    if (data.skills.soft.length > 0) {
      html += '<div>';
      html += '<h3>Soft Skills</h3>';
      html += '<div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">';
      data.skills.soft.forEach(skill => {
        html += `<span style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">${escapeHtml(skill)}</span>`;
      });
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
  }

  // Experience
  if (data.experience.length > 0) {
    html += '<div class="section">';
    const h2Style = isModern 
      ? `color: ${h2Color}; border-bottom: ${borderWidth} solid ${borderColor}; padding-bottom: 0.25rem;`
      : `color: ${h2Color};`;
    html += `<h2 style="${h2Style}">Experience</h2>`;
    data.experience.forEach(exp => {
      html += '<div class="experience-item">';
      html += '<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">';
      html += '<div>';
      html += `<h3>${escapeHtml(exp.role || 'Job Title')}</h3>`;
      html += `<p style="color: #374151;">${escapeHtml(exp.company || 'Company Name')}</p>`;
      html += '</div>';
      const dateRange = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
      if (dateRange) {
        html += `<span style="font-size: 0.875rem; color: #4b5563; white-space: nowrap;">${escapeHtml(dateRange)}</span>`;
      }
      html += '</div>';
      if (exp.achievements && exp.achievements.length > 0) {
        html += '<ul style="margin-left: 1rem; color: #374151;">';
        exp.achievements.forEach((achievement: string) => {
          html += `<li>${escapeHtml(achievement)}</li>`;
        });
        html += '</ul>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  // Education
  if (data.education.length > 0) {
    html += '<div class="section">';
    const h2Style = isModern 
      ? `color: ${h2Color}; border-bottom: ${borderWidth} solid ${borderColor}; padding-bottom: 0.25rem;`
      : `color: ${h2Color};`;
    html += `<h2 style="${h2Style}">Education</h2>`;
    data.education.forEach(edu => {
      html += '<div class="education-item">';
      html += '<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">';
      html += '<div>';
      html += `<h3>${escapeHtml(edu.degree || 'Degree')}</h3>`;
      html += `<p style="color: #374151;">${escapeHtml(edu.institution || 'Institution')}</p>`;
      if (edu.fieldOfStudy) {
        html += `<p style="font-size: 0.875rem; color: #4b5563;">${escapeHtml(edu.fieldOfStudy)}</p>`;
      }
      html += '</div>';
      if (edu.graduationYear) {
        html += `<span style="font-size: 0.875rem; color: #4b5563;">${escapeHtml(edu.graduationYear)}</span>`;
      }
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Projects
  if (data.projects.length > 0) {
    html += '<div class="section">';
    const h2Style = isModern 
      ? `color: ${h2Color}; border-bottom: ${borderWidth} solid ${borderColor}; padding-bottom: 0.25rem;`
      : `color: ${h2Color};`;
    html += `<h2 style="${h2Style}">Projects</h2>`;
    data.projects.forEach(proj => {
      html += '<div class="project-item">';
      html += '<div style="margin-bottom: 0.5rem;">';
      html += `<h3>${escapeHtml(proj.name || 'Project Name')}</h3>`;
      if (proj.url) {
        html += `<a href="${escapeHtml(proj.url)}" style="font-size: 0.875rem; color: #2563eb;">${escapeHtml(proj.url)}</a>`;
      }
      html += '</div>';
      if (proj.description) {
        html += `<p style="color: #374151; margin-bottom: 0.5rem;">${escapeHtml(proj.description)}</p>`;
      }
      if (proj.technologies && proj.technologies.length > 0) {
        html += '<div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">';
        proj.technologies.forEach((tech: string) => {
          html += `<span style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">${escapeHtml(tech)}</span>`;
        });
        html += '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  // Certifications
  if (data.certifications.length > 0) {
    html += '<div class="section">';
    const h2Style = isModern 
      ? `color: ${h2Color}; border-bottom: ${borderWidth} solid ${borderColor}; padding-bottom: 0.25rem;`
      : `color: ${h2Color};`;
    html += `<h2 style="${h2Style}">Certifications</h2>`;
    data.certifications.forEach(cert => {
      html += '<div class="certification-item">';
      html += '<div style="display: flex; justify-content: space-between; align-items: start;">';
      html += '<div>';
      html += `<h3>${escapeHtml(cert.name || 'Certification Name')}</h3>`;
      html += `<p style="color: #374151;">${escapeHtml(cert.issuer || 'Issuer')}</p>`;
      html += '</div>';
      html += '<div style="text-align: right; font-size: 0.875rem; color: #4b5563;">';
      if (cert.date) {
        html += `<div>Issued: ${formatDate(cert.date)}</div>`;
      }
      if (cert.expiryDate) {
        html += `<div>Expires: ${formatDate(cert.expiryDate)}</div>`;
      }
      html += '</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // References
  if (data.references.length > 0) {
    html += '<div class="section">';
    const h2Style = isModern 
      ? `color: ${h2Color}; border-bottom: ${borderWidth} solid ${borderColor}; padding-bottom: 0.25rem;`
      : `color: ${h2Color};`;
    html += `<h2 style="${h2Style}">References</h2>`;
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">';
    data.references.forEach(ref => {
      html += '<div class="reference-item">';
      html += `<h3>${escapeHtml(ref.name || 'Name')}</h3>`;
      html += `<p style="font-size: 0.875rem; color: #374151;">${escapeHtml(ref.title || 'Title')}</p>`;
      html += `<p style="font-size: 0.875rem; color: #374151;">${escapeHtml(ref.company || 'Company')}</p>`;
      if (ref.email) html += `<p style="font-size: 0.875rem; color: #4b5563;">${escapeHtml(ref.email)}</p>`;
      if (ref.phone) html += `<p style="font-size: 0.875rem; color: #4b5563;">${escapeHtml(ref.phone)}</p>`;
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  }

  // Changes Summary (exclude from export)
  // if (data.changesSummary) {
  //   html += '<div class="section">';
  //   html += '<h2>Changes Summary</h2>';
  //   html += `<p style="color: #374151; line-height: 1.75; white-space: pre-wrap;">${escapeHtml(data.changesSummary)}</p>`;
  //   html += '</div>';
  // }

  return html;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  // Safe HTML escaping
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}

function formatDateRange(startDate?: string, endDate?: string, isCurrent?: boolean): string {
  const parts: string[] = [];
  if (startDate) {
    parts.push(formatDate(startDate));
  }
  if (startDate && (isCurrent || endDate)) {
    parts.push(' - ');
  }
  if (isCurrent) {
    parts.push('Present');
  } else if (endDate) {
    parts.push(formatDate(endDate));
  }
  return parts.join('');
}

/**
 * Export resume to PDF
 */
export async function exportResumeToPdf(html: string, filename: string = 'resume', template: 'classic' | 'modern' = 'classic'): Promise<Blob> {
  const res = await fetch('/api/resume-builder/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, filename, template, templateId: template }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Export failed' }));
    throw new Error(error.error || 'Export failed');
  }
  return res.blob();
}

/**
 * Export resume to DOCX
 */
export async function exportResumeToDocx(html: string, filename: string = 'resume', template: 'classic' | 'modern' = 'classic'): Promise<Blob> {
  const res = await fetch('/api/resume-builder/export/docx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, filename, template, templateId: template }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Export failed' }));
    throw new Error(error.error || 'Export failed');
  }
  return res.blob();
}

/**
 * Download resume in specified format
 */
export async function downloadResume(
  format: 'pdf' | 'docx',
  data: ResumeData,
  template: 'classic' | 'modern' = 'classic',
  filename?: string
): Promise<void> {
  const html = resumeDataToHtml(data, template);
  const defaultFilename = data.header.name ? data.header.name.replace(/\s+/g, '-').toLowerCase() : 'resume';
  const finalFilename = filename || defaultFilename;

  try {
    const blob = format === 'pdf'
      ? await exportResumeToPdf(html, finalFilename, template)
      : await exportResumeToDocx(html, finalFilename, template);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${finalFilename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error('Download failed:', err);
    throw new Error(err.message || 'Download failed');
  }
}

