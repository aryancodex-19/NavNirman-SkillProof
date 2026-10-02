import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export const maxDuration = 60;

// Programmatic HTML Generation Engine
function generatePortfolioHtml(resumeData: any, template: string, personalInfo: any): string {
  const name = personalInfo?.name || resumeData?.fullName || "Developer";
  const role = personalInfo?.role || resumeData?.targetRole || "Software Engineer";
  const email = personalInfo?.email || resumeData?.email || "";
  const github = personalInfo?.github || "";
  const linkedin = personalInfo?.linkedin || "";
  const twitter = personalInfo?.twitter || "";
  const website = personalInfo?.website || "";
  
  const summary = resumeData?.summary || "Passionate developer focused on building modern, high-performance web applications.";
  const skills: string[] = Array.isArray(resumeData?.skills) ? resumeData.skills : [];
  const rawExperience = Array.isArray(resumeData?.experience) ? resumeData.experience : [];
  const education = Array.isArray(resumeData?.education) ? resumeData.education : [];

  // Parse and separate experiences and projects
  const projectsList: any[] = [];
  const workExperiences: any[] = [];

  rawExperience.forEach((exp: any) => {
    const company = (exp.company || "").toLowerCase();
    const expRole = (exp.role || "").toLowerCase();
    if (
      company.includes("project") ||
      expRole.includes("project") ||
      company.includes("portfolio") ||
      company.includes("open-source") ||
      company.includes("freelance project")
    ) {
      projectsList.push(exp);
    } else {
      workExperiences.push(exp);
    }
  });

  // Render social links html helper
  const renderSocialLinks = () => {
    let html = "";
    if (github) html += `<a href="${github}" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="fab fa-github"></i></a>`;
    if (linkedin) html += `<a href="${linkedin}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>`;
    if (twitter) html += `<a href="${twitter}" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><i class="fab fa-x-twitter"></i></a>`;
    if (website) html += `<a href="${website}" target="_blank" rel="noopener noreferrer" aria-label="Website"><i class="fas fa-globe"></i></a>`;
    if (email) html += `<a href="mailto:${email}" aria-label="Email"><i class="fas fa-envelope"></i></a>`;
    return html;
  };

  // Render skill pills html helper
  const renderSkills = (templateStyle: string) => {
    if (skills.length === 0) return "<p class='text-muted'>No skills loaded.</p>";
    return skills.map(skill => {
      let badgeClass = "skill-badge";
      if (templateStyle === "bold") {
        badgeClass = "skill-badge-cyber";
      } else if (templateStyle === "minimal") {
        badgeClass = "skill-badge-minimal";
      }
      return `<span class="${badgeClass}">${skill}</span>`;
    }).join("");
  };

  // Render experience timeline helper
  const renderExperienceTimeline = () => {
    if (workExperiences.length === 0) return "<p class='text-muted'>No experience history provided.</p>";
    return workExperiences.map((exp: any) => {
      const bullets = Array.isArray(exp.bullets) 
        ? exp.bullets.map((b: string) => `<li>${b}</li>`).join("")
        : `<li>${exp.description || "Contributed to design, development, and system deployments."}</li>`;
        
      return `
        <div class="timeline-item">
          <div class="timeline-header">
            <span class="timeline-duration font-mono">${exp.duration || "Present"}</span>
            <h3 class="timeline-title">${exp.role || "Software Engineer"}</h3>
            <h4 class="timeline-company">${exp.company || "Company"}</h4>
          </div>
          <ul class="timeline-bullets">
            ${bullets}
          </ul>
        </div>
      `;
    }).join("");
  };

  // Render education timeline helper
  const renderEducationTimeline = () => {
    if (education.length === 0) return "<p class='text-muted'>No education details provided.</p>";
    return education.map((edu: any) => {
      return `
        <div class="timeline-item">
          <div class="timeline-header">
            <span class="timeline-duration font-mono">${edu.year || "N/A"}</span>
            <h3 class="timeline-title">${edu.degree || "Degree"}</h3>
            <h4 class="timeline-company">${edu.school || "University"}</h4>
          </div>
          ${edu.gpa ? `<p class="gpa-badge font-mono">GPA: ${edu.gpa}</p>` : ""}
        </div>
      `;
    }).join("");
  };

  // Render projects grid helper
  const renderProjectsGrid = (templateStyle: string) => {
    if (projectsList.length === 0) return "";
    return projectsList.map((proj: any, idx: number) => {
      const bullets = Array.isArray(proj.bullets) ? proj.bullets.join(" ") : proj.description || "";
      const cardClass = templateStyle === "bold" 
        ? "project-card project-card-cyber" 
        : templateStyle === "minimal" 
          ? "project-card project-card-minimal"
          : "project-card";
          
      return `
        <div class="${cardClass}">
          <div class="project-header">
            <div class="project-folder"><i class="far fa-folder-open"></i></div>
            <div class="project-links">
              ${github ? `<a href="${github}" target="_blank" rel="noopener noreferrer" aria-label="Project Source"><i class="fab fa-github"></i></a>` : ""}
              <a href="#" aria-label="Project Demo"><i class="fas fa-external-link-alt"></i></a>
            </div>
          </div>
          <h3 class="project-title">${proj.role || proj.company || `Project ${idx + 1}`}</h3>
          <p class="project-description">${bullets}</p>
        </div>
      `;
    }).join("");
  };

  // TEMPLATE 1: MODERN DARK (Brittany Chiang split column style)
  if (template === "modern") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} | Portfolio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --bg: #030712;
      --card-bg: rgba(255, 255, 255, 0.02);
      --card-border: rgba(255, 255, 255, 0.05);
      --card-hover-border: rgba(99, 102, 241, 0.2);
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #6366f1;
      --secondary: #a855f7;
      --accent: #ec4899;
      --font-sans: 'Plus Jakarta Sans', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      scroll-behavior: smooth;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      line-height: 1.6;
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    #cursor-glow {
      position: fixed;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
      pointer-events: none;
      transform: translate(-50%, -50%);
      z-index: 1;
      transition: opacity 0.3s ease;
      opacity: 0.85;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      position: relative;
      z-index: 2;
    }

    /* Split column layout on desktop */
    @media (min-width: 1024px) {
      .split-layout {
        display: grid;
        grid-template-columns: 4.5fr 5.5fr;
        gap: 5rem;
      }
      .left-col {
        position: sticky;
        top: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 6rem 0;
      }
      .right-col {
        padding: 6rem 0;
      }
    }

    @media (max-width: 1023px) {
      .left-col {
        padding: 4rem 0 2rem;
      }
      .right-col {
        padding: 2rem 0 4rem;
      }
    }

    /* Hero section info */
    .hero-name {
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.1;
      background: linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .hero-role {
      font-size: 1.25rem;
      font-weight: 600;
      color: #e2e8f0;
      margin-top: 0.5rem;
    }

    .hero-typewriter {
      font-family: var(--font-mono);
      font-size: 0.9rem;
      color: var(--primary);
      margin-top: 0.75rem;
      min-height: 24px;
    }

    .hero-bio {
      color: var(--text-muted);
      margin-top: 1.5rem;
      max-width: 20rem;
      font-size: 0.95rem;
    }

    /* Navigation Links spy list */
    .nav-links {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 3rem;
    }
    
    @media (max-width: 1023px) {
      .nav-links {
        display: none; /* Hide nav links on mobile split */
      }
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #64748b;
      text-decoration: none;
      transition: all 0.3s ease;
      width: fit-content;
    }

    .nav-line {
      width: 30px;
      height: 1px;
      background-color: #64748b;
      transition: all 0.3s ease;
    }

    .nav-item:hover, .nav-item.active {
      color: #f8fafc;
    }

    .nav-item:hover .nav-line, .nav-item.active .nav-line {
      width: 60px;
      background-color: #f8fafc;
    }

    /* Social Links style */
    .social-links {
      display: flex;
      gap: 1.5rem;
      margin-top: 3rem;
    }

    .social-links a {
      color: var(--text-muted);
      font-size: 1.4rem;
      transition: color 0.3s ease, transform 0.2s ease;
      display: inline-block;
    }

    .social-links a:hover {
      color: var(--primary);
      transform: translateY(-2px);
    }

    /* Section content right col */
    section {
      margin-bottom: 5rem;
    }

    .section-title-mobile {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #f8fafc;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      position: sticky;
      top: 0;
      background: rgba(3, 7, 18, 0.8);
      backdrop-filter: blur(8px);
      padding: 1rem 0;
      z-index: 10;
    }

    @media (min-width: 1024px) {
      .section-title-mobile {
        display: none; /* Hide sticky section title on desktop split */
      }
    }

    .section-content {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .about-text p {
      margin-bottom: 1rem;
    }

    /* Skills badges */
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .skill-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.15);
      color: #818cf8;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .skill-badge:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.35);
      transform: translateY(-1px);
    }

    /* Timeline component */
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      margin-top: 1rem;
    }

    .timeline-item {
      position: relative;
      padding: 1.5rem;
      border-radius: 16px;
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      transition: all 0.3s ease;
    }

    .timeline-item:hover {
      background-color: rgba(255, 255, 255, 0.03);
      border-color: var(--card-hover-border);
      transform: translateY(-2px);
    }

    .timeline-header {
      margin-bottom: 1rem;
    }

    .timeline-duration {
      font-size: 0.75rem;
      color: var(--primary);
      font-weight: 700;
      display: block;
      margin-bottom: 0.25rem;
    }

    .timeline-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .timeline-company {
      font-size: 0.9rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .timeline-bullets {
      margin-left: 1.25rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .timeline-bullets li {
      margin-bottom: 0.5rem;
    }

    .gpa-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      background: rgba(168, 85, 247, 0.1);
      border: 1px solid rgba(168, 85, 247, 0.2);
      border-radius: 6px;
      font-size: 0.75rem;
      color: #c084fc;
      font-weight: 600;
      margin-top: 0.5rem;
    }

    /* Projects cards styles */
    .projects-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    @media (min-width: 640px) {
      .projects-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .project-card {
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.3s ease;
      min-height: 200px;
    }

    .project-card:hover {
      background-color: rgba(255, 255, 255, 0.03);
      border-color: var(--card-hover-border);
      transform: translateY(-4px);
    }

    .project-header {
      display: flex;
      justify-content: justify;
      align-items: center;
      margin-bottom: 1rem;
      width: 100%;
    }

    .project-folder {
      font-size: 1.5rem;
      color: var(--primary);
    }

    .project-links {
      display: flex;
      gap: 0.75rem;
      margin-left: auto;
    }

    .project-links a {
      color: var(--text-muted);
      font-size: 1.1rem;
      transition: color 0.2s ease;
    }

    .project-links a:hover {
      color: #f8fafc;
    }

    .project-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 0.5rem;
    }

    .project-description {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Contact Details */
    .contact-card {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.04), rgba(168, 85, 247, 0.02));
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 2rem;
      text-align: center;
      margin-top: 1rem;
    }

    .contact-card h3 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #f8fafc;
      margin-bottom: 0.5rem;
    }

    .contact-card p {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    .contact-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.8rem 1.8rem;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      border: none;
      border-radius: 9999px;
      color: white;
      font-size: 0.85rem;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 10px 20px -10px rgba(99, 102, 241, 0.5);
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .contact-btn:hover {
      opacity: 0.95;
      transform: translateY(-2px);
      box-shadow: 0 15px 25px -10px rgba(99, 102, 241, 0.6);
    }

    /* Footer styling */
    footer {
      border-top: 1px solid var(--card-border);
      padding: 2rem 0;
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 3rem;
    }
  </style>
</head>
<body>
  <div id="cursor-glow"></div>
  <div class="container">
    <div class="split-layout">
      <!-- Left Column: Bio and Sticky Navigation -->
      <header class="left-col">
        <div>
          <h1 class="hero-name">${name}</h1>
          <h2 class="hero-role">${role}</h2>
          <div class="hero-typewriter"><span id="typewriter"></span>|</div>
          <p class="hero-bio">${summary}</p>
          
          <nav class="nav-links">
            <a href="#about" class="nav-item active"><span class="nav-line"></span> About</a>
            <a href="#skills" class="nav-item"><span class="nav-line"></span> Skills</a>
            <a href="#experience" class="nav-item"><span class="nav-line"></span> Experience</a>
            <a href="#education" class="nav-item"><span class="nav-line"></span> Education</a>
            ${projectsList.length > 0 ? `<a href="#projects" class="nav-item"><span class="nav-line"></span> Projects</a>` : ""}
            <a href="#contact" class="nav-item"><span class="nav-line"></span> Contact</a>
          </nav>
        </div>

        <div class="social-links">
          ${renderSocialLinks()}
        </div>
      </header>

      <!-- Right Column: Scrolling Section Details -->
      <main class="right-col">
        <!-- About Section -->
        <section id="about">
          <div class="section-title-mobile"><i class="far fa-user text-indigo-400"></i> About</div>
          <div class="section-content about-text">
            <p>${summary}</p>
            <p>I enjoy translating complicated problems into elegant, maintainable, and high-performance code. My approach focuses on scalability, clean user-centric interfaces, and robust systems design.</p>
          </div>
        </section>

        <!-- Skills Section -->
        <section id="skills">
          <div class="section-title-mobile"><i class="fas fa-code text-indigo-400"></i> Skills</div>
          <div class="section-content">
            <div class="skills-grid">
              ${renderSkills("modern")}
            </div>
          </div>
        </section>

        <!-- Experience Section -->
        <section id="experience">
          <div class="section-title-mobile"><i class="briefcase fas fa-briefcase text-indigo-400"></i> Experience</div>
          <div class="section-content">
            <div class="timeline">
              ${renderExperienceTimeline()}
            </div>
          </div>
        </section>

        <!-- Education Section -->
        <section id="education">
          <div class="section-title-mobile"><i class="fas fa-graduation-cap text-indigo-400"></i> Education</div>
          <div class="section-content">
            <div class="timeline">
              ${renderEducationTimeline()}
            </div>
          </div>
        </section>

        <!-- Projects Section -->
        ${projectsList.length > 0 ? `
        <section id="projects">
          <div class="section-title-mobile"><i class="fas fa-tasks text-indigo-400"></i> Projects</div>
          <div class="section-content">
            <div class="projects-grid">
              ${renderProjectsGrid("modern")}
            </div>
          </div>
        </section>
        ` : ""}

        <!-- Contact Section -->
        <section id="contact">
          <div class="section-title-mobile"><i class="far fa-paper-plane text-indigo-400"></i> Contact</div>
          <div class="section-content">
            <div class="contact-card">
              <h3>Let's build something!</h3>
              <p>I am always open to discussing new opportunities, collaborations, or open-source projects.</p>
              ${email ? `<a href="mailto:${email}" class="contact-btn"><i class="fas fa-envelope"></i> Send Message</a>` : ""}
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer>
          <p>© 2026 ${name}. Built with CareerOS. All rights reserved.</p>
        </footer>
      </main>
    </div>
  </div>

  <script>
    // Cursor glow tracking effect
    document.addEventListener('mousemove', (e) => {
      const glow = document.getElementById('cursor-glow');
      if (glow) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
      }
    });

    // Subtitle typewriter effect loop
    const phrases = [
      "Translating requirements into clean code.",
      "Building responsive full-stack applications.",
      "Developing scalable software systems."
    ];
    let i = 0;
    let j = 0;
    let currentPhrase = [];
    let isDeleting = false;
    let isEnd = false;
    function loop() {
      isEnd = false;
      const typewriter = document.getElementById("typewriter");
      if (!typewriter) return;
      if (i < phrases.length) {
        if (!isDeleting && j <= phrases[i].length) {
          currentPhrase.push(phrases[i][j]);
          j++;
          typewriter.innerHTML = currentPhrase.join("");
        }
        if (isDeleting && j <= phrases[i].length) {
          currentPhrase.pop();
          j--;
          typewriter.innerHTML = currentPhrase.join("");
        }
        if (j == phrases[i].length) {
          isEnd = true;
          isDeleting = true;
        }
        if (isDeleting && j === 0) {
          currentPhrase = [];
          isDeleting = false;
          i++;
          if (i === phrases.length) i = 0;
        }
      }
      const speed = isEnd ? 2000 : isDeleting ? 30 : 60;
      setTimeout(loop, speed);
    }
    setTimeout(loop, 1000);

    // Scroll spy navigation highlight
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 150) {
          current = section.getAttribute('id');
        }
      });
      navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#' + current) {
          item.classList.add('active');
        }
      });
    });
  </script>
</body>
</html>`;
  }

  // TEMPLATE 2: CLEAN MINIMAL (Lee Robinson centered dark style)
  if (template === "minimal") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} | Portfolio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --bg: #09090b;
      --border: #27272a;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --font-sans: 'Inter', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      scroll-behavior: smooth;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      line-height: 1.6;
      min-height: 100vh;
      overflow-y: auto;
    }

    .container {
      max-width: 720px;
      margin: 0 auto;
      padding: 5rem 1.5rem;
    }

    header {
      margin-bottom: 4rem;
    }

    .hero-name {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
    }

    .hero-role {
      font-size: 1rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
      margin-top: 0.25rem;
    }

    .hero-typewriter {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
      opacity: 0.8;
    }

    .social-links {
      display: flex;
      gap: 1.25rem;
      margin-top: 1.5rem;
    }

    .social-links a {
      color: var(--text-muted);
      font-size: 1.25rem;
      transition: color 0.2s ease;
    }

    .social-links a:hover {
      color: #ffffff;
    }

    /* Section lines and layouts */
    section {
      border-top: 1px solid var(--border);
      padding: 3rem 0;
    }

    .section-title {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    .section-content {
      font-size: 0.95rem;
    }

    .about-text p {
      margin-bottom: 1rem;
      color: var(--text-muted);
    }

    /* Skills badges */
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .skill-badge-minimal {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      padding: 0.3rem 0.6rem;
      background-color: #18181b;
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      transition: all 0.2s ease;
    }

    .skill-badge-minimal:hover {
      background-color: #27272a;
      border-color: #3f3f46;
    }

    /* Timelines minimal */
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }

    .timeline-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .timeline-header {
      display: flex;
      flex-direction: column;
    }

    @media (min-width: 640px) {
      .timeline-header {
        flex-direction: row;
        justify-content: justify;
        align-items: baseline;
      }
    }

    .timeline-title {
      font-size: 1rem;
      font-weight: 700;
      color: #ffffff;
    }

    .timeline-company {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-left: 0.5rem;
    }

    .timeline-duration {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-left: auto;
    }

    .timeline-bullets {
      margin-left: 1rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .timeline-bullets li {
      margin-bottom: 0.25rem;
    }

    .gpa-badge {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
      border: 1px solid var(--border);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      width: fit-content;
    }

    /* Minimal Project styling */
    .projects-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .project-card-minimal {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: background-color 0.2s ease;
    }

    .project-card-minimal:hover {
      background-color: #18181b;
    }

    .project-header {
      display: flex;
      justify-content: justify;
      align-items: center;
      margin-bottom: 0.5rem;
      width: 100%;
    }

    .project-folder {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .project-links {
      display: flex;
      gap: 0.5rem;
      margin-left: auto;
    }

    .project-links a {
      color: var(--text-muted);
      font-size: 1rem;
      transition: color 0.2s ease;
    }

    .project-links a:hover {
      color: #ffffff;
    }

    .project-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #ffffff;
    }

    .project-description {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }

    /* Contact minimal */
    .contact-text {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    .contact-email {
      font-family: var(--font-mono);
      color: #ffffff;
      text-decoration: underline;
      transition: opacity 0.2s ease;
    }

    .contact-email:hover {
      opacity: 0.8;
    }

    footer {
      border-top: 1px solid var(--border);
      padding-top: 2rem;
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1 class="hero-name">${name}</h1>
      <h2 class="hero-role">${role}</h2>
      <div class="hero-typewriter"><span id="typewriter"></span>|</div>
      <div class="social-links">
        ${renderSocialLinks()}
      </div>
    </header>

    <main>
      <!-- About -->
      <section id="about">
        <h2 class="section-title">About</h2>
        <div class="section-content about-text">
          <p>${summary}</p>
        </div>
      </section>

      <!-- Skills -->
      <section id="skills">
        <h2 class="section-title">Skills</h2>
        <div class="section-content">
          <div class="skills-grid">
            ${renderSkills("minimal")}
          </div>
        </div>
      </section>

      <!-- Experience -->
      <section id="experience">
        <h2 class="section-title">Experience</h2>
        <div class="section-content">
          <div class="timeline">
            ${renderExperienceTimeline()}
          </div>
        </div>
      </section>

      <!-- Education -->
      <section id="education">
        <h2 class="section-title">Education</h2>
        <div class="section-content">
          <div class="timeline">
            ${renderEducationTimeline()}
          </div>
        </div>
      </section>

      <!-- Projects -->
      ${projectsList.length > 0 ? `
      <section id="projects">
        <h2 class="section-title">Projects</h2>
        <div class="section-content">
          <div class="projects-grid">
            ${renderProjectsGrid("minimal")}
          </div>
        </div>
      </section>
      ` : ""}

      <!-- Contact -->
      <section id="contact">
        <h2 class="section-title">Contact</h2>
        <div class="section-content">
          <p class="contact-text">Drop me an email if you'd like to collaborate, talk shop, or just say hello.</p>
          ${email ? `<a href="mailto:${email}" class="contact-email">${email}</a>` : ""}
        </div>
      </section>

      <!-- Footer -->
      <footer>
        <p>© 2026 ${name}. Built using CareerOS.</p>
      </footer>
    </main>
  </div>

  <script>
    // Subtitle typewriter effect loop
    const phrases = [
      "Specializing in modern full-stack engineering.",
      "Writing clean, maintainable systems code."
    ];
    let i = 0;
    let j = 0;
    let currentPhrase = [];
    let isDeleting = false;
    let isEnd = false;
    function loop() {
      isEnd = false;
      const typewriter = document.getElementById("typewriter");
      if (!typewriter) return;
      if (i < phrases.length) {
        if (!isDeleting && j <= phrases[i].length) {
          currentPhrase.push(phrases[i][j]);
          j++;
          typewriter.innerHTML = currentPhrase.join("");
        }
        if (isDeleting && j <= phrases[i].length) {
          currentPhrase.pop();
          j--;
          typewriter.innerHTML = currentPhrase.join("");
        }
        if (j == phrases[i].length) {
          isEnd = true;
          isDeleting = true;
        }
        if (isDeleting && j === 0) {
          currentPhrase = [];
          isDeleting = false;
          i++;
          if (i === phrases.length) i = 0;
        }
      }
      const speed = isEnd ? 2000 : isDeleting ? 30 : 60;
      setTimeout(loop, speed);
    }
    setTimeout(loop, 1000);
  </script>
</body>
</html>`;
  }

  // TEMPLATE 3: BOLD CYBERPUNK (Vibrant Neon cyber grids)
  if (template === "bold") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} | Portfolio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --bg: #040406;
      --primary: #00f2fe;
      --secondary: #ec4899;
      --border: rgba(6, 182, 212, 0.2);
      --text: #e2e8f0;
      --text-muted: #94a3b8;
      --font-cyber: 'Space Grotesk', sans-serif;
      --font-mono: 'Share Tech Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      scroll-behavior: smooth;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-cyber);
      line-height: 1.6;
      min-height: 100vh;
      overflow-y: auto;
      background-image: linear-gradient(to right, rgba(255, 255, 255, 0.01) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.01) 1px, transparent 1px);
      background-size: 20px 20px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 4rem 1.5rem;
    }

    header {
      border: 2px solid var(--border);
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.1);
      padding: 2.5rem;
      border-radius: 12px;
      background-color: rgba(4, 4, 6, 0.95);
      margin-bottom: 3rem;
      position: relative;
    }

    header::before {
      content: "";
      position: absolute;
      top: -2px;
      left: -2px;
      width: 30px;
      height: 30px;
      border-top: 3px solid var(--secondary);
      border-left: 3px solid var(--secondary);
      border-radius: 12px 0 0 0;
    }

    .hero-name {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      text-transform: uppercase;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-role {
      font-family: var(--font-mono);
      font-size: 1.1rem;
      color: var(--primary);
      margin-top: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .hero-typewriter {
      font-family: var(--font-mono);
      font-size: 0.9rem;
      color: var(--secondary);
      margin-top: 0.5rem;
    }

    .social-links {
      display: flex;
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .social-links a {
      color: var(--text-muted);
      font-size: 1.3rem;
      transition: color 0.2s ease, transform 0.2s ease;
    }

    .social-links a:hover {
      color: var(--primary);
      transform: scale(1.1);
      text-shadow: 0 0 8px var(--primary);
    }

    /* Section bold designs */
    section {
      margin-bottom: 3rem;
      border: 2px solid var(--border);
      border-radius: 12px;
      padding: 2.5rem;
      background-color: rgba(4, 4, 6, 0.9);
      position: relative;
    }

    section::before {
      content: "";
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 20px;
      height: 20px;
      border-bottom: 3px solid var(--secondary);
      border-right: 3px solid var(--secondary);
      border-radius: 0 0 12px 0;
    }

    .section-title {
      font-family: var(--font-mono);
      font-size: 1.1rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--primary);
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.5rem;
    }

    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .skill-badge-cyber {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      padding: 0.4rem 0.8rem;
      background-color: rgba(6, 182, 212, 0.05);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--primary);
      transition: all 0.2s ease;
    }

    .skill-badge-cyber:hover {
      background-color: rgba(236, 72, 153, 0.1);
      border-color: var(--secondary);
      color: var(--secondary);
      box-shadow: 0 0 10px rgba(236, 72, 153, 0.25);
    }

    /* Timeline cyberpunk */
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .timeline-item {
      border-left: 2px solid var(--secondary);
      padding-left: 1.5rem;
      position: relative;
    }

    .timeline-item::before {
      content: "";
      position: absolute;
      left: -6px;
      top: 6px;
      width: 10px;
      height: 10px;
      background-color: var(--bg);
      border: 2px solid var(--primary);
      box-shadow: 0 0 8px var(--primary);
    }

    .timeline-duration {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--secondary);
      display: block;
      margin-bottom: 0.25rem;
    }

    .timeline-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #ffffff;
    }

    .timeline-company {
      font-size: 0.95rem;
      color: var(--primary);
      margin-bottom: 0.75rem;
    }

    .timeline-bullets {
      margin-left: 1rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .timeline-bullets li {
      margin-bottom: 0.4rem;
    }

    .gpa-badge {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--primary);
      margin-top: 0.5rem;
      display: block;
    }

    /* Cyber Projects grid */
    .projects-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 640px) {
      .projects-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .project-card-cyber {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.25rem;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 200px;
    }

    .project-card-cyber:hover {
      border-color: var(--primary);
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
      transform: translateY(-2px);
    }

    .project-header {
      display: flex;
      justify-content: justify;
      align-items: center;
      margin-bottom: 1rem;
      width: 100%;
    }

    .project-folder {
      font-family: var(--font-mono);
      color: var(--secondary);
      font-size: 1.2rem;
    }

    .project-links {
      display: flex;
      gap: 0.75rem;
      margin-left: auto;
    }

    .project-links a {
      color: var(--text-muted);
      font-size: 1.1rem;
      transition: color 0.2s ease;
    }

    .project-links a:hover {
      color: var(--primary);
      text-shadow: 0 0 8px var(--primary);
    }

    .project-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.5rem;
    }

    .project-description {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    /* Cyber Contact card */
    .contact-card-cyber {
      text-align: center;
    }

    .contact-card-cyber h3 {
      font-size: 1.3rem;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      color: #ffffff;
    }

    .contact-btn {
      font-family: var(--font-mono);
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.8rem 1.8rem;
      background: transparent;
      border: 2px solid var(--secondary);
      color: #ffffff;
      font-size: 0.9rem;
      text-transform: uppercase;
      text-decoration: none;
      box-shadow: 0 0 10px rgba(236, 72, 153, 0.15);
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .contact-btn:hover {
      background-color: var(--secondary);
      box-shadow: 0 0 20px rgba(236, 72, 153, 0.45);
      transform: scale(1.02);
    }

    footer {
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1 class="hero-name">${name}</h1>
      <h2 class="hero-role">${role}</h2>
      <div class="hero-typewriter"><span id="typewriter"></span>|</div>
      <div class="social-links">
        ${renderSocialLinks()}
      </div>
    </header>

    <main>
      <!-- About -->
      <section id="about">
        <h2 class="section-title">// ABOUT_USER</h2>
        <div class="section-content">
          <p>${summary}</p>
        </div>
      </section>

      <!-- Skills -->
      <section id="skills">
        <h2 class="section-title">// TECH_STACK</h2>
        <div class="section-content">
          <div class="skills-grid">
            ${renderSkills("bold")}
          </div>
        </div>
      </section>

      <!-- Experience -->
      <section id="experience">
        <h2 class="section-title">// WORK_HISTORY</h2>
        <div class="section-content">
          <div class="timeline">
            ${renderExperienceTimeline()}
          </div>
        </div>
      </section>

      <!-- Education -->
      <section id="education">
        <h2 class="section-title">// ACADEMICS</h2>
        <div class="section-content">
          <div class="timeline">
            ${renderEducationTimeline()}
          </div>
        </div>
      </section>

      <!-- Projects -->
      ${projectsList.length > 0 ? `
      <section id="projects">
        <h2 class="section-title">// PROJECTS_GRID</h2>
        <div class="section-content">
          <div class="projects-grid">
            ${renderProjectsGrid("bold")}
          </div>
        </div>
      </section>
      ` : ""}

      <!-- Contact -->
      <section id="contact">
        <h2 class="section-title">// ESTABLISH_LINK</h2>
        <div class="section-content contact-card-cyber">
          <h3>Ready to coordinate operations?</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.9rem;">Submit connection request using details below.</p>
          ${email ? `<a href="mailto:${email}" class="contact-btn"><i class="fas fa-envelope"></i> Send Email</a>` : ""}
        </div>
      </section>

      <!-- Footer -->
      <footer style="margin-top: 2rem;">
        <p>© 2026 ${name}. System executed via CareerOS.</p>
      </footer>
    </main>
  </div>

  <script>
    // Subtitle typewriter effect loop
    const phrases = [
      "Executing responsive web architecture.",
      "Initiating full-stack engineering protocols."
    ];
    let i = 0;
    let j = 0;
    let currentPhrase = [];
    let isDeleting = false;
    let isEnd = false;
    function loop() {
      isEnd = false;
      const typewriter = document.getElementById("typewriter");
      if (!typewriter) return;
      if (i < phrases.length) {
        if (!isDeleting && j <= phrases[i].length) {
          currentPhrase.push(phrases[i][j]);
          j++;
          typewriter.innerHTML = currentPhrase.join("");
        }
        if (isDeleting && j <= phrases[i].length) {
          currentPhrase.pop();
          j--;
          typewriter.innerHTML = currentPhrase.join("");
        }
        if (j == phrases[i].length) {
          isEnd = true;
          isDeleting = true;
        }
        if (isDeleting && j === 0) {
          currentPhrase = [];
          isDeleting = false;
          i++;
          if (i === phrases.length) i = 0;
        }
      }
      const speed = isEnd ? 2000 : isDeleting ? 30 : 60;
      setTimeout(loop, speed);
    }
    setTimeout(loop, 1000);
  </script>
</body>
</html>`;
  }

  // Fallback to basic HTML
  return `<html><body><h1>${name}</h1><p>${summary}</p></body></html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { resumeData, template, personalInfo } = await req.json();

    // Generate complete HTML locally on the server (ensures 100% completion & 0 token truncation)
    const generatedHtml = generatePortfolioHtml(resumeData, template || "modern", personalInfo);

    // Save to database
    try {
      const user = await prisma.user.findUnique({ where: { clerkId } });
      if (user) {
        const existingPortfolio = await (prisma as any).portfolio.findFirst({
          where: { userId: user.id }
        });
        if (existingPortfolio) {
          await (prisma as any).portfolio.update({
            where: { id: existingPortfolio.id },
            data: {
              template: template || "modern",
              htmlContent: generatedHtml,
            }
          });
        } else {
          await (prisma as any).portfolio.create({
            data: {
              userId: user.id,
              template: template || "modern",
              htmlContent: generatedHtml,
            }
          });
        }
      }
    } catch (dbErr) {
      console.error("Portfolio DB save error:", dbErr);
    }

    return NextResponse.json({ html: generatedHtml });
  } catch (error: any) {
    console.error("Portfolio generate error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate portfolio" }, { status: 500 });
  }
}
