"use client";

import React, { useState, useMemo, useCallback } from "react";
import { updateProfile } from "@/app/profile/actions";
import { toast } from "sonner";
import { z } from "zod";
import {
  User,
  Briefcase,
  Code,
  Loader2,
  Check,
  X,
  ChevronDown,
  FileText,
  Save,
} from "lucide-react";

/* ── Inline brand icon SVGs ── */
const GithubIcon = React.memo((props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={props.className} {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
));
GithubIcon.displayName = "GithubIcon";

const LinkedinIcon = React.memo((props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={props.className} {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
));
LinkedinIcon.displayName = "LinkedinIcon";

/* ── Zod Validation Schema ── */
const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  targetRole: z.string().min(1, "Please select a target role"),
  skills: z.array(z.string()),
  githubUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  linkedinUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(500, "Bio must be under 500 characters").optional().or(z.literal("")),
});

/* ── Constants ── */
const AVAILABLE_ROLES = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Mobile Engineer",
  "DevOps Engineer",
  "Data Scientist",
  "ML Engineer",
  "Product Manager",
  "Product Designer",
];

const AVAILABLE_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "Go", "Rust", "Ruby",
  "SQL", "R", "Swift", "Kotlin", "PHP", "Scala",
  "React", "Next.js", "Vue", "Angular", "Svelte", "HTML5", "CSS3", "Tailwind CSS",
  "Node.js", "Express", "NestJS", "Django", "FastAPI", "Spring Boot", "Flask",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Prisma", "GraphQL",
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "CI/CD", "Git", "Linux",
  "TensorFlow", "PyTorch", "Pandas", "NumPy",
  "UI/UX Design", "Figma", "Agile", "System Design",
];

/* Helper to map skills to colorful badges deterministically */
const getSkillColorClass = (skill: string) => {
  const hash = skill.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % 3;
  if (index === 0) {
    return "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-200";
  } else if (index === 1) {
    return "bg-violet-500/10 text-violet-300 border-violet-500/20 hover:bg-violet-500/20 hover:text-violet-200";
  } else {
    return "bg-pink-500/10 text-pink-300 border-pink-500/20 hover:bg-pink-500/20 hover:text-pink-200";
  }
};

/* ── Component Props ── */
interface ProfileFormProps {
  initialData?: {
    name: string;
    targetRole: string | null;
    skills: string[] | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    bio: string | null;
  };
}

function ProfileForm({ initialData }: ProfileFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [targetRole, setTargetRole] = useState(initialData?.targetRole || "");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialData?.skills || []
  );
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(
    initialData?.linkedinUrl || ""
  );
  const [bio, setBio] = useState(initialData?.bio || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillsSearch, setSkillsSearch] = useState("");
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleToggleSkill = useCallback((skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }, []);

  const filteredSkills = useMemo(() => {
    return AVAILABLE_SKILLS.filter((skill) =>
      skill.toLowerCase().includes(skillsSearch.toLowerCase())
    );
  }, [skillsSearch]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = {
      name,
      targetRole,
      skills: selectedSkills,
      githubUrl,
      linkedinUrl,
      bio,
    };

    /* Validate with Zod */
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      toast.error("Please fix the errors below.");
      return;
    }

    try {
      await updateProfile(formData);
      toast.success("Profile updated successfully!", {
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, targetRole, selectedSkills, githubUrl, linkedinUrl, bio]);

  const inputClasses =
    "block w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-foreground placeholder-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200";
  const labelClasses =
    "block text-sm font-semibold text-foreground mb-2";
  const iconClasses =
    "absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground z-10";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 max-w-2xl mx-auto bg-card p-8 rounded-2xl border border-border shadow-sm animate-slide-up"
    >
      {/* ── Name ── */}
      <div>
        <label htmlFor="name" className={labelClasses}>
          Full Name <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <div className={iconClasses}>
            <User className="h-5 w-5" />
          </div>
          <input
            id="name"
            type="text"
            required
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClasses} premium-focus`}
          />
        </div>
        {errors.name && (
          <p className="text-xs text-danger mt-1.5">{errors.name}</p>
        )}
      </div>

      {/* ── Target Role ── */}
      <div>
        <label htmlFor="targetRole" className={labelClasses}>
          Target Role <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <div className={iconClasses}>
            <Briefcase className={`h-5 w-5 transition-colors ${targetRole ? "text-indigo-400" : "text-muted-foreground"}`} />
          </div>
          <button
            id="targetRole"
            type="button"
            onClick={() => setIsRoleOpen((prev) => !prev)}
            className={`${inputClasses} flex items-center justify-between text-left cursor-pointer transition-all duration-200 ${
              targetRole ? "gradient-border-active text-foreground border-transparent" : "text-muted-foreground/50 border-input"
            }`}
          >
            <span>{targetRole || "Select your target role"}</span>
            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isRoleOpen ? "rotate-180" : ""}`} />
          </button>
          
          {/* Dropdown with simple backdrop to handle click-outside */}
          {isRoleOpen && (
            <>
              <div 
                className="fixed inset-0 z-20 cursor-default" 
                onClick={() => setIsRoleOpen(false)} 
              />
              <div className="absolute z-30 w-full mt-2 max-h-60 overflow-y-auto rounded-xl border border-border bg-[#12121a] shadow-2xl py-1 dropdown-scrollbar dropdown-panel animate-slide-up">
                {AVAILABLE_ROLES.map((role) => {
                  const isSelected = targetRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setTargetRole(role);
                        setIsRoleOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-all duration-150 custom-select-option ${
                        isSelected
                          ? "custom-select-option-active font-semibold"
                          : "text-foreground"
                      }`}
                    >
                      <span>{role}</span>
                      {isSelected && <Check className="h-4 w-4 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
        {errors.targetRole && (
          <p className="text-xs text-danger mt-1.5">{errors.targetRole}</p>
        )}
      </div>

      {/* ── Skills Multi-select ── */}
      <div className="relative">
        <label className={labelClasses}>Skills</label>

        {/* Selected skills pills */}
        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-muted/40 rounded-xl border border-border transition-all duration-300">
            {selectedSkills.map((skill) => (
              <span
                key={skill}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all duration-200 animate-scale-in ${getSkillColorClass(
                  skill
                )}`}
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleToggleSkill(skill)}
                  className="rounded-full p-0.5 hover:bg-white/10 text-current transition-colors cursor-pointer"
                  aria-label={`Remove ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative">
          <div className={iconClasses}>
            <Code className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Search and select skills..."
            value={skillsSearch}
            onFocus={() => setIsSkillsOpen(true)}
            onChange={(e) => {
              setSkillsSearch(e.target.value);
              setIsSkillsOpen(true);
            }}
            className={`${inputClasses} premium-focus`}
          />
        </div>

        {/* Dropdown with simple backdrop to handle click-outside */}
        {isSkillsOpen && (
          <>
            <div 
              className="fixed inset-0 z-20 cursor-default" 
              onClick={() => setIsSkillsOpen(false)} 
            />
            <div className="absolute z-30 w-full mt-2 max-h-60 overflow-y-auto rounded-xl border border-border bg-[#12121a] shadow-2xl py-1 dropdown-scrollbar dropdown-panel animate-slide-up">
              <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-white/5">
                <span>
                  {filteredSkills.length} skill
                  {filteredSkills.length !== 1 ? "s" : ""} found
                </span>
                <button
                  type="button"
                  onClick={() => setIsSkillsOpen(false)}
                  className="hover:text-foreground transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
              {filteredSkills.length === 0 ? (
                <div className="px-4 py-4 text-sm text-muted-foreground text-center">
                  No skills matching &quot;{skillsSearch}&quot;
                </div>
              ) : (
                filteredSkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-all duration-150 custom-select-option ${
                        isSelected
                          ? "custom-select-option-active font-semibold"
                          : "text-foreground"
                      }`}
                    >
                      <span>{skill}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-indigo-400" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Bio ── */}
      <div>
        <label htmlFor="bio" className={labelClasses}>
          Bio / About
        </label>
        <div className="relative">
          <div className="absolute top-3 left-0 pl-3.5 pointer-events-none text-muted-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <textarea
            id="bio"
            placeholder="Tell us a bit about yourself, your goals, and what you're passionate about..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
            className="block w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-foreground placeholder-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none premium-focus"
          />
        </div>
        <div className="flex justify-between mt-1.5">
          {errors.bio ? (
            <p className="text-xs text-danger">{errors.bio}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground font-medium">
            {bio.length}/500
          </span>
        </div>
      </div>

      {/* ── GitHub URL ── */}
      <div>
        <label htmlFor="githubUrl" className={labelClasses}>
          GitHub Profile URL
        </label>
        <div className="relative">
          <div className={iconClasses}>
            <GithubIcon className="h-5 w-5" />
          </div>
          <input
            id="githubUrl"
            type="url"
            placeholder="https://github.com/username"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className={`${inputClasses} premium-focus`}
          />
        </div>
        {errors.githubUrl && (
          <p className="text-xs text-danger mt-1.5">{errors.githubUrl}</p>
        )}
      </div>

      {/* ── LinkedIn URL ── */}
      <div>
        <label htmlFor="linkedinUrl" className={labelClasses}>
          LinkedIn Profile URL
        </label>
        <div className="relative">
          <div className={iconClasses}>
            <LinkedinIcon className="h-5 w-5" />
          </div>
          <input
            id="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/username"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className={`${inputClasses} premium-focus`}
          />
        </div>
        {errors.linkedinUrl && (
          <p className="text-xs text-danger mt-1.5">{errors.linkedinUrl}</p>
        )}
      </div>

      {/* ── Save Button ── */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl gradient-bg text-white font-semibold py-3.5 px-4 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving Profile...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Save Profile
          </>
        )}
      </button>
    </form>
  );
}

export default React.memo(ProfileForm);
