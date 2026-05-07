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

function e(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function fmtDate(s: string): string {
  if (!s) return '';
  try {
    return new Date(s + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch { return s; }
}

function fmtRange(start?: string, end?: string, isCurrent?: boolean): string {
  if (!start) return '';
  const from = fmtDate(start);
  if (isCurrent) return `${from} – Present`;
  if (end) return `${from} – ${fmtDate(end)}`;
  return from;
}

export function getTemplateStyles(template: 'classic' | 'modern'): string {
  const isModern = template === 'modern';
  const accent = isModern ? '#2563eb' : '#1a1a2e';
  const h2Border = isModern
    ? `border-bottom: 1.5pt solid #2563eb; padding-bottom: 2pt;`
    : `border-bottom: 0.75pt solid #d1d5db; padding-bottom: 2pt;`;

  return `
*{box-sizing:border-box;margin:0;padding:0}
html{overflow-x:hidden}
html,body{
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  font-size:10.5pt;
  line-height:1.42;
  color:#111827;
  background:#fff;
}
body{padding:0;overflow-x:hidden}

h1{font-size:22pt;font-weight:700;color:${accent};line-height:1.1;margin-bottom:3pt}
h2{font-size:11.5pt;font-weight:700;color:${accent};${h2Border}margin-bottom:5pt;letter-spacing:0.01em}
h3{font-size:10.5pt;font-weight:600;color:#111827;margin-bottom:1pt}
p{margin:0 0 2pt;color:#374151}
ul{margin:3pt 0 0 14pt;padding:0}
li{margin-bottom:1.5pt;color:#374151}
a{color:#2563eb;text-decoration:none}

.header{text-align:center;margin-bottom:12pt}
.name{font-size:22pt;font-weight:700;color:${accent};line-height:1.1;margin-bottom:3pt}
.prof-title{font-size:11pt;color:#4b5563;margin-bottom:5pt}
.contact{display:flex;justify-content:center;flex-wrap:wrap;gap:0 14pt;font-size:9.5pt;color:#4b5563}
.contact span{white-space:nowrap}

.section{margin-bottom:10pt}
.section:last-child{margin-bottom:0}

.row{display:flex;justify-content:space-between;align-items:flex-start;gap:8pt}
.row-left{flex:1;min-width:0}
.row-right{font-size:9.5pt;color:#4b5563;white-space:nowrap;flex-shrink:0;text-align:right;line-height:1.4}

.sub{font-size:10pt;color:#374151;margin:1pt 0 2pt}
.detail{font-size:9.5pt;color:#6b7280;margin-top:1pt}

.item{margin-bottom:6pt;break-inside:avoid;page-break-inside:avoid}
.item:last-child{margin-bottom:0}

.tags{display:flex;flex-wrap:wrap;margin-top:3pt}
.tag{display:inline-block;background:#f3f4f6;border:0.5pt solid #e5e7eb;color:#374151;font-size:8.5pt;padding:1pt 5pt;border-radius:2pt;margin:0 2pt 2pt 0}

.two-col{display:grid;grid-template-columns:1fr 1fr;gap:6pt}
.skill-label{font-size:10pt;font-weight:600;color:#374151;margin-bottom:3pt}

@page{size:A4;margin:18mm}
h2,h3{break-after:avoid;page-break-after:avoid}
.section{break-inside:auto;page-break-inside:auto}
.item{break-inside:avoid;page-break-inside:avoid}
`.trim();
}

export function resumeDataToHtml(data: ResumeData, template: 'classic' | 'modern' = 'classic'): string {
  let html = '';

  // Header
  html += '<div class="header">';
  html += `<div class="name">${e(data.header.name || 'Your Name')}</div>`;
  if (data.header.title) {
    html += `<div class="prof-title">${e(data.header.title)}</div>`;
  }
  const contacts = [data.header.email, data.header.phone, data.header.location, data.header.website].filter(Boolean);
  if (contacts.length > 0) {
    html += '<div class="contact">';
    contacts.forEach(c => { html += `<span>${e(c)}</span>`; });
    html += '</div>';
  }
  html += '</div>';

  // Professional Summary
  if (data.professionalSummary) {
    html += '<div class="section">';
    html += '<h2>Professional Summary</h2>';
    html += `<p style="line-height:1.55">${e(data.professionalSummary)}</p>`;
    html += '</div>';
  }

  // Skills
  const hasTech = data.skills.technical.length > 0;
  const hasSoft = data.skills.soft.length > 0;
  if (hasTech || hasSoft) {
    html += '<div class="section">';
    html += '<h2>Skills</h2>';
    html += '<div class="two-col">';
    if (hasTech) {
      html += '<div>';
      html += '<div class="skill-label">Technical</div>';
      html += '<div class="tags">';
      data.skills.technical.forEach(s => { html += `<span class="tag">${e(s)}</span>`; });
      html += '</div></div>';
    }
    if (hasSoft) {
      html += '<div>';
      html += '<div class="skill-label">Soft Skills</div>';
      html += '<div class="tags">';
      data.skills.soft.forEach(s => { html += `<span class="tag">${e(s)}</span>`; });
      html += '</div></div>';
    }
    html += '</div>';
    html += '</div>';
  }

  // Experience
  if (data.experience.length > 0) {
    html += '<div class="section">';
    html += '<h2>Experience</h2>';
    data.experience.forEach((exp: any) => {
      html += '<div class="item">';
      html += '<div class="row">';
      html += '<div class="row-left">';
      html += `<h3>${e(exp.role || 'Job Title')}</h3>`;
      html += `<div class="sub">${e(exp.company || 'Company')}</div>`;
      html += '</div>';
      const dr = fmtRange(exp.startDate, exp.endDate, exp.isCurrent);
      if (dr) html += `<div class="row-right">${e(dr)}</div>`;
      html += '</div>';
      if (exp.achievements && exp.achievements.length > 0) {
        html += '<ul>';
        exp.achievements.forEach((a: string) => { html += `<li>${e(a)}</li>`; });
        html += '</ul>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  // Education
  if (data.education.length > 0) {
    html += '<div class="section">';
    html += '<h2>Education</h2>';
    data.education.forEach((edu: any) => {
      html += '<div class="item">';
      html += '<div class="row">';
      html += '<div class="row-left">';
      html += `<h3>${e(edu.degree || 'Degree')}</h3>`;
      html += `<div class="sub">${e(edu.institution || 'Institution')}</div>`;
      if (edu.fieldOfStudy) html += `<div class="detail">${e(edu.fieldOfStudy)}</div>`;
      html += '</div>';
      if (edu.graduationYear) html += `<div class="row-right">${e(edu.graduationYear)}</div>`;
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Projects
  if (data.projects.length > 0) {
    html += '<div class="section">';
    html += '<h2>Projects</h2>';
    data.projects.forEach((proj: any) => {
      html += '<div class="item">';
      html += `<h3>${e(proj.name || 'Project')}</h3>`;
      if (proj.url) html += `<div class="detail"><a href="${e(proj.url)}">${e(proj.url)}</a></div>`;
      if (proj.description) html += `<p style="margin-top:2pt">${e(proj.description)}</p>`;
      if (proj.technologies && proj.technologies.length > 0) {
        html += '<div class="tags">';
        proj.technologies.forEach((t: string) => { html += `<span class="tag">${e(t)}</span>`; });
        html += '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  // Certifications
  if (data.certifications.length > 0) {
    html += '<div class="section">';
    html += '<h2>Certifications</h2>';
    data.certifications.forEach((cert: any) => {
      html += '<div class="item">';
      html += '<div class="row">';
      html += '<div class="row-left">';
      html += `<h3>${e(cert.name || 'Certification')}</h3>`;
      if (cert.issuer) html += `<div class="sub">${e(cert.issuer)}</div>`;
      html += '</div>';
      html += '<div class="row-right">';
      if (cert.date) html += `<div>Issued: ${fmtDate(cert.date)}</div>`;
      if (cert.expiryDate) html += `<div>Expires: ${fmtDate(cert.expiryDate)}</div>`;
      html += '</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // References
  if (data.references.length > 0) {
    html += '<div class="section">';
    html += '<h2>References</h2>';
    html += '<div class="two-col">';
    data.references.forEach((ref: any) => {
      html += '<div class="item">';
      html += `<h3>${e(ref.name || 'Name')}</h3>`;
      if (ref.title) html += `<div class="sub">${e(ref.title)}</div>`;
      if (ref.company) html += `<div class="sub">${e(ref.company)}</div>`;
      if (ref.email) html += `<div class="detail">${e(ref.email)}</div>`;
      if (ref.phone) html += `<div class="detail">${e(ref.phone)}</div>`;
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  }

  return html;
}

/**
 * Generates a self-contained paged preview HTML for the iframe.
 * Content is measured and distributed into fixed A4 page containers by JS.
 * Each page renders as a white A4 rectangle so users see exactly how many pages
 * their resume will produce. Reports page count to parent via postMessage.
 */
export function resumeDataToPreviewHtml(data: ResumeData, template: 'classic' | 'modern' = 'classic'): string {
  const baseStyles = getTemplateStyles(template);
  const bodyContent = resumeDataToHtml(data, template);

  const previewOverrides = `
/* ── Preview layout overrides ── */
html,body{background:#e8eaed;padding:0;margin:0;width:auto;min-height:100%}
#src{position:absolute;left:-9999px;top:0;visibility:hidden;width:174mm}
#pages{padding:20px 0 32px;display:flex;flex-direction:column;align-items:center}
.rp{width:210mm;height:297mm;background:#fff;box-shadow:0 2px 14px rgba(0,0,0,0.15);border-radius:3px;padding:18mm;box-sizing:border-box;overflow:hidden;margin-bottom:20px;flex-shrink:0}
`;

  /* The pagination script:
     1. Reads elements from #src (rendered with correct CSS = accurate heights)
     2. Distributes them into .rp page divs
     3. Sends page count to parent window
     Items that are direct children of a .section can be split across pages.
     Sections without direct .item children are kept atomic.                  */
  const paginationScript = `
(function(){
  var PH=(297-36)*3.7795;   /* ~987px: A4 content height (297 - 18top - 18bottom) mm→px */
  var IG=8,H2G=13,SG=13;    /* item-gap, h2-gap, section-gap (approximate margin-bottoms) */

  function run(){
    var src=document.getElementById('src');
    var out=document.getElementById('pages');
    var nodes=Array.from(src.children);

    if(!nodes.length){ var p=mk(); p.innerHTML=src.innerHTML; out.appendChild(p); send(1); return; }

    var pgs=[],pg=mk(),pgH=0; pgs.push(pg);

    function flip(){ pg=mk(); pgH=0; pgs.push(pg); }

    nodes.forEach(function(node){
      var items=Array.from(node.querySelectorAll(':scope>.item'));

      if(!items.length){
        /* Atomic block (header, summary, skills, references two-col, etc.) */
        var h=rect(node)+SG;
        if(pgH+h>PH&&pg.children.length) flip();
        pg.appendChild(node.cloneNode(true));
        pgH+=h;
        return;
      }

      /* Section with splittable items (experience, education, projects, certifications) */
      var h2=node.querySelector(':scope>h2');
      var h2H=h2?rect(h2)+H2G:0;
      var wrap=null;

      items.forEach(function(item){
        var iH=rect(item)+IG;
        if(!wrap){
          if(pgH+h2H+iH>PH&&pg.children.length) flip();
          wrap=div('section');
          if(h2) wrap.appendChild(h2.cloneNode(true));
          wrap.appendChild(item.cloneNode(true));
          pg.appendChild(wrap);
          pgH+=h2H+iH;
        } else {
          if(pgH+iH>PH){
            flip();
            wrap=div('section');
            if(h2) wrap.appendChild(h2.cloneNode(true));
            wrap.appendChild(item.cloneNode(true));
            pg.appendChild(wrap);
            pgH+=h2H+iH;
          } else {
            wrap.appendChild(item.cloneNode(true));
            pgH+=iH;
          }
        }
      });
    });

    pgs.forEach(function(p){ out.appendChild(p); });
    send(pgs.length);
  }

  function rect(el){ return el.getBoundingClientRect().height; }
  function mk(){ return div('rp'); }
  function div(cls){ var d=document.createElement('div'); d.className=cls; return d; }
  function send(n){ try{ window.parent.postMessage({type:'resumePages',count:n},'*'); }catch(e){} }

  /* Double rAF ensures styles are applied before measurement */
  requestAnimationFrame(function(){ requestAnimationFrame(run); });
})();
`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${baseStyles}
${previewOverrides}</style>
</head>
<body>
<div id="src">${bodyContent}</div>
<div id="pages"></div>
<script>${paginationScript}<\/script>
</body>
</html>`;
}

export function resumeDataToFullHtml(data: ResumeData, template: 'classic' | 'modern' = 'classic'): string {
  const styles = getTemplateStyles(template);
  const body = resumeDataToHtml(data, template);
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${styles}</style>
</head>
<body>${body}</body>
</html>`;
}

export async function exportResumeToPdf(fullHtml: string, filename: string = 'resume'): Promise<Blob> {
  const res = await fetch('/api/resume-builder/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: fullHtml, filename }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Export failed' }));
    throw new Error(error.error || 'Export failed');
  }
  return res.blob();
}

export async function exportResumeToDocx(fullHtml: string, filename: string = 'resume', template: 'classic' | 'modern' = 'classic'): Promise<Blob> {
  const res = await fetch('/api/resume-builder/export/docx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: fullHtml, filename, template }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Export failed' }));
    throw new Error(error.error || 'Export failed');
  }
  return res.blob();
}

export async function downloadResume(
  format: 'pdf' | 'docx',
  data: ResumeData,
  template: 'classic' | 'modern' = 'classic',
  filename?: string
): Promise<void> {
  const fullHtml = resumeDataToFullHtml(data, template);
  const defaultFilename = data.header.name ? data.header.name.replace(/\s+/g, '-').toLowerCase() : 'resume';
  const finalFilename = filename || defaultFilename;

  try {
    const blob = format === 'pdf'
      ? await exportResumeToPdf(fullHtml, finalFilename)
      : await exportResumeToDocx(fullHtml, finalFilename, template);

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
