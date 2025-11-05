'use client';

import { TemplateProps } from '../lib/template-registry';
import { Badge } from '@/components/ui/badge';

export function ModernTemplate({ data }: TemplateProps) {
  return (
    <div className="modern-template" style={{ width: '100%', color: '#000', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="section header-section">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-3xl font-bold text-blue-600">{data.header.name || 'Your Name'}</h1>
          <p className="text-lg text-gray-700">{data.header.title || 'Professional Title'}</p>
          <div className="flex justify-center gap-4 text-sm text-gray-600 flex-wrap">
            {data.header.email && <span>{data.header.email}</span>}
            {data.header.phone && <span>{data.header.phone}</span>}
            {data.header.location && <span>{data.header.location}</span>}
            {data.header.website && <span>{data.header.website}</span>}
          </div>
        </div>
        <div className="border-b-2 border-blue-600 mb-6" />
      </div>

      {/* Professional Summary */}
      {data.professionalSummary && (
        <div className="section">
          <h2 className="text-xl font-semibold mb-3 text-blue-600 border-b-2 border-blue-600 pb-1">
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">{data.professionalSummary}</p>
        </div>
      )}

      {/* Skills */}
      {(data.skills.technical.length > 0 || data.skills.soft.length > 0) && (
        <div className="section">
          <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b-2 border-blue-600 pb-1">
            Skills
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {data.skills.technical.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Technical</h3>
                <div className="flex flex-wrap gap-1">
                  {data.skills.technical.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.skills.soft.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Soft Skills</h3>
                <div className="flex flex-wrap gap-1">
                  {data.skills.soft.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="section">
          <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b-2 border-blue-600 pb-1">
            Experience
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.id} className="experience-item">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{exp.role || 'Job Title'}</h3>
                    <p className="text-gray-700">{exp.company || 'Company Name'}</p>
                  </div>
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    {exp.startDate && (
                      new Date(exp.startDate + '-01').toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    )}
                    {exp.startDate && (exp.isCurrent || exp.endDate) && ' - '}
                    {exp.isCurrent ? 'Present' : exp.endDate && (
                      new Date(exp.endDate + '-01').toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    )}
                  </span>
                </div>
                {exp.achievements.length > 0 && (
                  <ul className="space-y-1 text-gray-700 ml-4">
                    {exp.achievements.map((achievement, achIndex) => (
                      <li key={achIndex}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div className="section">
          <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b-2 border-blue-600 pb-1">
            Education
          </h2>
          <div className="space-y-4">
            {data.education.map((edu) => (
              <div key={edu.id} className="education-item">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{edu.degree || 'Degree'}</h3>
                    <p className="text-gray-700">{edu.institution || 'Institution'}</p>
                    {edu.fieldOfStudy && (
                      <p className="text-sm text-gray-600">{edu.fieldOfStudy}</p>
                    )}
                  </div>
                  {edu.graduationYear && (
                    <span className="text-sm text-gray-600">{edu.graduationYear}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div className="section">
          <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b-2 border-blue-600 pb-1">
            Projects
          </h2>
          <div className="space-y-4">
            {data.projects.map((proj) => (
              <div key={proj.id} className="project-item">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{proj.name || 'Project Name'}</h3>
                    {proj.url && (
                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {proj.url}
                      </a>
                    )}
                  </div>
                </div>
                {proj.description && (
                  <p className="text-gray-700 mb-2">{proj.description}</p>
                )}
                {proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {proj.technologies.map((tech, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <div className="section">
          <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b-2 border-blue-600 pb-1">
            Certifications
          </h2>
          <div className="space-y-3">
            {data.certifications.map((cert) => (
              <div key={cert.id} className="certification-item">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{cert.name || 'Certification Name'}</h3>
                    <p className="text-gray-700">{cert.issuer || 'Issuer'}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    {cert.date && (
                      <div>
                        Issued: {new Date(cert.date + '-01').toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                    {cert.expiryDate && (
                      <div>
                        Expires: {new Date(cert.expiryDate + '-01').toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {data.references.length > 0 && (
        <div className="section">
          <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b-2 border-blue-600 pb-1">
            References
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {data.references.map((ref) => (
              <div key={ref.id} className="reference-item">
                <h3 className="font-semibold text-gray-900">{ref.name || 'Name'}</h3>
                <p className="text-sm text-gray-700">{ref.title || 'Title'}</p>
                <p className="text-sm text-gray-700">{ref.company || 'Company'}</p>
                {ref.email && <p className="text-sm text-gray-600">{ref.email}</p>}
                {ref.phone && <p className="text-sm text-gray-600">{ref.phone}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Changes Summary */}
      {data.changesSummary && (
        <div className="section">
          <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b-2 border-blue-600 pb-1">
            Changes Summary
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{data.changesSummary}</p>
        </div>
      )}
    </div>
  );
}

