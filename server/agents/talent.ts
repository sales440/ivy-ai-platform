/**
 * Ivy-Talent: HR & Recruitment Agent
 * Specializes in candidate screening, interview scheduling, and talent assessment
 */

import { IvyAgent, AgentType, Department } from './core';
import type { TaskInput, TaskResult } from './core';
import * as db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { invokeLLM } from '../_core/llm';

export class IvyTalent extends IvyAgent {
  constructor() {
    const capabilities = [
      "resume_screening",
      "candidate_matching",
      "interview_scheduling",
      "skills_assessment",
      "onboarding_automation"
    ];

    const initialKPIs = {
      candidates_screened: 0,
      interviews_scheduled: 0,
      successful_hires: 0,
      avg_time_to_hire: 0
    };

    super("Ivy-Talent", AgentType.TALENT, Department.HR, capabilities, initialKPIs);
  }

  protected async _processTask(task: TaskInput): Promise<TaskResult> {
    const { type } = task;

    switch (type) {
      case "screen_resume":
        return await this._screenResume(task.resume, task.job_requirements);
      case "match_candidate":
        return await this._matchCandidate(task.candidate_profile, task.open_positions);
      case "generate_interview_questions":
        return await this._generateInterviewQuestions(task.role, task.level);
      case "assess_cultural_fit":
        return await this._assessCulturalFit(task.candidate_data, task.company_values);
      default:
        throw new Error(`Unsupported task type: ${type}`);
    }
  }

  /**
   * Screen candidate resume
   */
  private async _screenResume(resume: string, jobRequirements: any): Promise<TaskResult> {
    try {
      const prompt = `You are an expert HR recruiter. Screen this resume against job requirements:

Job Title: ${jobRequirements.title || "Not specified"}
Required Skills: ${jobRequirements.required_skills || "Not specified"}
Experience Level: ${jobRequirements.experience_level || "Mid-level"}
Education: ${jobRequirements.education || "Bachelor's degree"}

Resume:
${resume}

Provide:
- overall_match_score (0-100)
- skills_match (percentage of required skills present)
- experience_match (does experience level match)
- education_match (does education meet requirements)
- strengths (key strengths of candidate)
- concerns (potential red flags or gaps)
- recommendation (hire, interview, reject)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an experienced HR professional specializing in resume screening and candidate evaluation." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "resume_screening",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overall_match_score: { type: "number" },
                skills_match: { type: "number" },
                experience_match: { type: "boolean" },
                education_match: { type: "boolean" },
                strengths: { type: "string" },
                concerns: { type: "string" },
                recommendation: {
                  type: "string",
                  enum: ["hire", "interview", "reject"]
                }
              },
              required: ["overall_match_score", "skills_match", "experience_match", "education_match", "strengths", "concerns", "recommendation"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const screening = JSON.parse(contentStr || "{}");

      // Update KPIs
      this.kpis.candidates_screened += 1;

      return {
        status: "completed",
        data: {
          screening_id: uuidv4(),
          job_title: jobRequirements.title,
          screening: screening,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Match candidate to open positions
   */
  private async _matchCandidate(candidateProfile: any, openPositions: any[]): Promise<TaskResult> {
    try {
      const prompt = `Match this candidate to the best open positions:

Candidate Profile:
- Name: ${candidateProfile.name || "Candidate"}
- Skills: ${candidateProfile.skills || "Not specified"}
- Experience: ${candidateProfile.years_experience || 0} years
- Current Role: ${candidateProfile.current_role || "Not specified"}
- Salary Expectation: $${candidateProfile.salary_expectation || "Not specified"}

Open Positions:
${JSON.stringify(openPositions, null, 2)}

Provide:
- best_match_position (title of best matching position)
- match_score (0-100 for best match)
- alternative_positions (other suitable positions)
- skill_gaps (skills candidate needs to develop)
- recommendation (detailed recommendation)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a talent acquisition specialist expert at matching candidates to optimal roles." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "candidate_matching",
            strict: true,
            schema: {
              type: "object",
              properties: {
                best_match_position: { type: "string" },
                match_score: { type: "number" },
                alternative_positions: { type: "string" },
                skill_gaps: { type: "string" },
                recommendation: { type: "string" }
              },
              required: ["best_match_position", "match_score", "alternative_positions", "skill_gaps", "recommendation"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const matching = JSON.parse(contentStr || "{}");

      return {
        status: "completed",
        data: {
          candidate: candidateProfile.name,
          matching: matching,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Generate interview questions
   */
  private async _generateInterviewQuestions(role: string, level: string): Promise<TaskResult> {
    try {
      const prompt = `Generate a comprehensive interview question set:

Role: ${role}
Level: ${level}

Create:
- technical_questions (5 role-specific technical questions)
- behavioral_questions (5 behavioral/situational questions)
- cultural_fit_questions (3 questions to assess cultural fit)
- assessment_criteria (how to evaluate answers)

Questions should be appropriate for ${level} level and specific to ${role} role.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert interviewer who creates insightful, role-specific interview questions." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "interview_questions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                technical_questions: { type: "string" },
                behavioral_questions: { type: "string" },
                cultural_fit_questions: { type: "string" },
                assessment_criteria: { type: "string" }
              },
              required: ["technical_questions", "behavioral_questions", "cultural_fit_questions", "assessment_criteria"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const questions = JSON.parse(contentStr || "{}");

      // Update KPIs
      this.kpis.interviews_scheduled += 0.5; // Partial credit for question generation

      return {
        status: "completed",
        data: {
          question_set_id: uuidv4(),
          role: role,
          level: level,
          questions: questions,
          generated_at: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Assess cultural fit
   */
  private async _assessCulturalFit(candidateData: any, companyValues: any): Promise<TaskResult> {
    try {
      const prompt = `Assess candidate's cultural fit with company:

Candidate Information:
- Work Style: ${candidateData.work_style || "Not specified"}
- Values: ${candidateData.values || "Not specified"}
- Career Goals: ${candidateData.career_goals || "Not specified"}
- Team Preferences: ${candidateData.team_preferences || "Not specified"}

Company Values:
${JSON.stringify(companyValues, null, 2)}

Provide:
- cultural_fit_score (0-100)
- alignment_areas (where candidate aligns well)
- potential_conflicts (areas of potential misalignment)
- integration_recommendations (how to help candidate integrate)
- hire_confidence (0.0 to 1.0)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an organizational psychologist specializing in cultural fit assessment." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "cultural_fit_assessment",
            strict: true,
            schema: {
              type: "object",
              properties: {
                cultural_fit_score: { type: "number" },
                alignment_areas: { type: "string" },
                potential_conflicts: { type: "string" },
                integration_recommendations: { type: "string" },
                hire_confidence: { type: "number" }
              },
              required: ["cultural_fit_score", "alignment_areas", "potential_conflicts", "integration_recommendations", "hire_confidence"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const assessment = JSON.parse(contentStr || "{}");

      // Update KPIs if high confidence
      if (assessment.hire_confidence > 0.7) {
        this.kpis.successful_hires += 0.25; // Partial credit for assessment
      }

      return {
        status: "completed",
        data: {
          assessment_id: uuidv4(),
          candidate: candidateData.name || "Candidate",
          assessment: assessment,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }
}
