// Test utility for filename generation
export function testFilenameGeneration() {
  // Test resume filename generation
  const resumeMarkdown = `# John Doe
Software Engineer

## Experience
Senior Developer at Tech Corp`;

  const nameMatch = resumeMarkdown.match(/^#\s+(.+)$/m);
  const name = nameMatch ? nameMatch[1].trim() : 'Resume';
  const resumeFilename = name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, ' ').trim();
  
  console.log('Resume filename:', resumeFilename); // Should be "John Doe"

  // Test cover letter filename generation
  const coverTitle = "John Doe Cover Letter for Tech Corp (Software Engineer)";
  const coverFilename = coverTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, ' ').trim();
  
  console.log('Cover letter filename:', coverFilename); // Should be "John Doe Cover Letter for Tech Corp Software Engineer"

  return { resumeFilename, coverFilename };
}
