/**
 * Domain Entities and Core Types for Data3D Expert Reasoning Engine
 *
 * This file contains all shared domain entities, enums, and core types used
 * across the Data3D application. These types form the foundation of the event
 * sourcing system and are referenced by all services.
 *
 * @module types/contracts
 * @version 0.1.0
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Source of candidate acquisition
 */
export type CandidateSource =
  | 'direct'           // Applied directly
  | 'meta_ad'          // Facebook/Instagram ad
  | 'youtube_ad'       // YouTube ad
  | 'ctv_ad'           // Connected TV ad
  | 'partner_referral' // Affiliate partner
  | 'employee_referral'
  | 'organic';

/**
 * Candidate status in the recruitment pipeline
 */
export type CandidateStatus =
  | 'submitted'        // Resume uploaded, awaiting interview
  | 'interview_scheduled'
  | 'interview_in_progress'
  | 'interview_completed'
  | 'scoring_in_progress'
  | 'scored'           // Axioms evaluated
  | 'under_review'     // Recruiter reviewing
  | 'approved'
  | 'rejected'
  | 'withdrawn';

/**
 * Interview session status
 */
export type InterviewStatus =
  | 'created'          // Interview record created
  | 'room_ready'       // LiveKit room provisioned
  | 'candidate_joined' // Candidate connected
  | 'in_progress'      // Interview actively happening
  | 'completed'        // All questions answered
  | 'abandoned'        // Candidate disconnected early
  | 'failed';          // Technical failure

/**
 * Type of question asked during interview
 */
export type QuestionType =
  | 'prefix'           // Standard scenario question
  | 'dynamic_resume'   // Generated from resume
  | 'dynamic_followup' // Generated based on previous answer
  | 'clarification';   // Agent asked for clarification

/**
 * Axiom category for evaluation criteria classification
 */
export type AxiomCategory =
  | 'clinical_knowledge'    // Domain expertise
  | 'communication'         // How they communicate
  | 'language_proficiency'  // Bilingual capability
  | 'crisis_handling'       // Emergency response
  | 'empathy'               // Patient-centered care
  | 'professionalism';      // General conduct

/**
 * User role in the system (RBAC)
 */
export type UserRole =
  | 'Admin'      // Data3D staff — full access
  | 'Recruiter'  // Client staff — review/annotate
  | 'Partner'    // Affiliate — submit only
  | 'Candidate'; // Expert — interview portal only

/**
 * Assessment scenario types
 */
export type ScenarioType =
  | 'sjt'           // Situational Judgment Test (multiple choice)
  | 'roleplay'      // Role-play with AI voice interview
  | 'casestudy'     // Clinical case study (structured text input)
  | 'ethical'       // Ethical dilemma scenario
  | 'crisis';       // Crisis response assessment

/**
 * Assessment template categories
 */
export type AssessmentCategory =
  | 'clinical_skills'
  | 'crisis_intervention'
  | 'ethics'
  | 'treatment_planning'
  | 'diagnostic_skills'
  | 'communication'
  | 'custom';

/**
 * Response types for assessment questions
 */
export type ResponseType =
  | 'video'           // Video recording
  | 'audio'           // Audio only
  | 'text'            // Text input
  | 'multiple_choice'; // SJT selection

/**
 * Proficiency levels for competencies
 */
export type ProficiencyLevel =
  | 'entry'     // Entry-level (0-2 years experience)
  | 'mid'       // Mid-level (2-5 years experience)
  | 'senior';   // Senior-level (5+ years experience)

/**
 * Assessment status
 */
export type AssessmentStatus =
  | 'created'        // Assessment created, not started
  | 'onboarding'     // Candidate in onboarding flow
  | 'in_progress'    // Candidate actively taking assessment
  | 'completed'      // Assessment submitted for evaluation
  | 'evaluated';     // AI evaluation complete

/**
 * Job requisition status
 */
export type JobRequisitionStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'closed';

/**
 * Partner status
 */
export type PartnerStatus =
  | 'pending'
  | 'active'
  | 'suspended';

// ============================================================================
// DOMAIN ENTITIES
// ============================================================================

/**
 * Resume parsing result from LLM extraction
 */
export interface ResumeParsed {
  /** Extracted candidate name */
  extractedName?: string;
  /** Extracted email address */
  extractedEmail?: string;
  /** Extracted phone number */
  extractedPhone?: string;
  /** Years of professional experience */
  yearsExperience?: number;
  /** Programming languages or spoken languages */
  languages?: string[];
  /** Professional certifications */
  certifications?: string[];
  /** Relevant work history */
  relevantRoles?: {
    title: string;
    company: string;
    duration?: string;
  }[];
  /** Full extracted text from resume */
  rawText: string;
}

/**
 * Candidate - The expert being evaluated
 */
export interface Candidate {
  /** Unique identifier: cand_{ulid} */
  id: string;

  // Basic Info
  /** Candidate email address */
  email: string;
  /** Candidate full name */
  name: string;
  /** Contact phone number */
  phone?: string;

  // Source Tracking
  /** How the candidate was acquired */
  source: CandidateSource;
  /**
   * Additional source attribution details
   * Common fields: partnerId, campaignId, utmParams
   */
  sourceDetails?: Record<string, unknown>;

  // Documents
  /** S3 path to resume file */
  resumeUrl?: string;
  /** LLM-extracted resume structure */
  resumeParsed?: ResumeParsed;

  // Status
  /** Current status in recruitment pipeline */
  status: CandidateStatus;

  // Timestamps
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * Interview - A single interview session
 */
export interface Interview {
  /** Unique identifier: intv_{ulid} */
  id: string;
  /** Reference to Candidate */
  candidateId: string;

  // Configuration
  /** Which job they're interviewing for */
  jobRequisitionId: string;
  /** Which axioms to evaluate against */
  axiomSetId: string;

  // Session Details
  /** LiveKit room identifier */
  livekitRoomName: string;
  /** Encrypted participant token */
  livekitRoomToken?: string;

  // Timing
  /** If pre-scheduled */
  scheduledAt?: string;
  /** When interview started */
  startedAt?: string;
  /** When interview completed */
  completedAt?: string;
  /** Total interview duration in seconds */
  durationSeconds?: number;

  // Status
  /** Current interview status */
  status: InterviewStatus;

  // Recordings
  /** S3 path to full recording */
  recordingUrl?: string;

  // Generated Content
  /** Resume-based question generated for this interview */
  dynamicQuestionGenerated?: string;

  // Metadata
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * QuestionTurn - A single question-answer exchange within an interview
 * This is the atomic unit for axiom evaluation
 */
export interface QuestionTurn {
  /** Unique identifier: turn_{ulid} */
  id: string;
  /** Reference to Interview */
  interviewId: string;

  // Sequence
  /** Turn sequence number (1, 2, 3, etc.) */
  turnNumber: number;
  /** Type of question asked */
  questionType: QuestionType;

  // Content
  /** What the agent asked */
  questionText: string;
  /** S3 path to agent audio */
  questionAudioUrl?: string;

  // Candidate Response
  /** Whisper/Deepgram transcription output */
  responseTranscript?: string;
  /** S3 path to candidate audio */
  responseAudioUrl?: string;
  /** Length of candidate response in seconds */
  responseDurationSeconds?: number;

  // Timing
  /** When question was asked */
  questionAskedAt: string;
  /** When candidate started responding */
  responseStartedAt?: string;
  /** When candidate finished responding */
  responseCompletedAt?: string;

  // Agent Behavior
  /** Did agent use wait_more tool? */
  waitMoreTriggered: boolean;
  /** Dynamic follow-up if any */
  followUpGenerated?: string;

  // Metadata
  /** ISO 8601 timestamp of creation */
  createdAt: string;
}

/**
 * AxiomResult - Result of evaluating a single axiom
 */
export interface AxiomResult {
  /** Axiom code (e.g., "FAIL_JARGON") */
  axiomCode: string;
  /** Was this axiom relevant to this question? */
  applicable: boolean;
  /** Result if applicable */
  result?: 'pass' | 'fail';
  /** Confidence score 0.0 - 1.0 */
  confidence: number;
  /** LLM's explanation */
  reasoningTrace: string;
  /** Specific quotes from transcript */
  evidenceQuotes: string[];
}

/**
 * AxiomEvaluation - The result of scoring one QuestionTurn against all applicable axioms
 */
export interface AxiomEvaluation {
  /** Unique identifier: eval_{ulid} */
  id: string;
  /** Reference to QuestionTurn */
  questionTurnId: string;
  /** Denormalized for query efficiency */
  interviewId: string;
  /** Denormalized for query efficiency */
  candidateId: string;

  // Scoring Model Info
  /** Model used for evaluation (e.g., "claude-3-5-sonnet-20241022") */
  modelUsed: string;
  /** Version of the judge prompt */
  promptVersion: string;

  // Results (one per axiom)
  /** Array of axiom evaluation results */
  axiomResults: AxiomResult[];

  // Aggregate
  /** Total number of passed axioms */
  passCount: number;
  /** Total number of failed axioms */
  failCount: number;

  // Timing
  /** When evaluation was performed */
  scoredAt: string;
  /** Processing time in milliseconds */
  processingTimeMs: number;

  // Metadata
  /** ISO 8601 timestamp of creation */
  createdAt: string;
}

/**
 * AlignmentEvent - Recruiter feedback on an AI evaluation (RLHF signal)
 */
export interface AlignmentEvent {
  /** Unique identifier: align_{ulid} */
  id: string;

  // What's being evaluated
  /** Reference to AxiomEvaluation */
  axiomEvaluationId: string;
  /** Which specific axiom */
  axiomCode: string;

  // Who's providing feedback
  /** Reference to User (recruiter) */
  recruiterId: string;

  // The Feedback
  /** What the AI decided */
  aiDecision: 'pass' | 'fail';
  /** Whether recruiter agrees */
  recruiterDecision: 'agree' | 'disagree';
  /** If disagreed, what should it be? */
  correctedResult?: 'pass' | 'fail';

  // Detailed Notes
  /** Free-form explanation */
  correctionNotes?: string;
  /** How bad was the AI error? */
  severity?: 'minor' | 'major' | 'critical';

  // Metadata
  /** ISO 8601 timestamp of creation */
  createdAt: string;
}

/**
 * Axiom - The evaluation criteria defined by domain experts
 */
export interface Axiom {
  /** Unique identifier: axiom_{ulid} */
  id: string;

  // Identity
  /** Unique code (e.g., "FAIL_JARGON") */
  code: string;
  /** Category classification */
  category: AxiomCategory;

  // Definition
  /** Human-readable name */
  name: string;
  /** Detailed explanation */
  description: string;

  // Scoring Guidance
  /** What "pass" looks like */
  passIndicators: string[];
  /** What "fail" looks like */
  failIndicators: string[];
  /** Example good answer */
  examplePassResponse?: string;
  /** Example bad answer */
  exampleFailResponse?: string;

  // Configuration
  /** Importance (0.0 - 1.0) */
  weight: number;
  /** Which questions use this axiom */
  appliesToQuestionTypes: QuestionType[];

  // Status
  /** Is axiom currently active */
  isActive: boolean;

  // Versioning (for prompt optimization)
  /** Version number */
  version: number;
  /** Reference to previous version */
  previousVersionId?: string;

  // Metadata
  /** User ID who created this */
  createdBy: string;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * AxiomSet - A collection of axioms used for a specific job type
 */
export interface AxiomSet {
  /** Unique identifier: aset_{ulid} */
  id: string;

  // Identity
  /** Name (e.g., "Bilingual Mental Health Counselor v2") */
  name: string;
  /** Optional description */
  description?: string;

  // Configuration
  /** Ordered list of axiom IDs */
  axiomIds: string[];
  /** Minimum pass rate (0.0 - 1.0) */
  passingThreshold: number;

  // Status
  /** Is set currently active */
  isActive: boolean;
  /** Use for new interviews if no other specified */
  isDefault: boolean;

  // Metadata
  /** User ID who created this */
  createdBy: string;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * JobRequisition - The job being hired for
 */
export interface JobRequisition {
  /** Unique identifier: job_{ulid} */
  id: string;

  // Basic Info
  /** Job title */
  title: string;
  /** Job description */
  description: string;
  /** Which client (e.g., PIN Sourcing) */
  clientId: string;

  // Requirements
  /** Required languages for the role */
  requiredLanguages: string[];
  /** Required professional certifications */
  requiredCertifications?: string[];
  /** Minimum years of experience */
  yearsExperienceMin?: number;

  // Evaluation
  /** Which axioms to use */
  axiomSetId: string;

  // Interview Config
  /** Standard questions for this role */
  prefixQuestions: string[];
  /** Prompt template for resume-based question */
  dynamicQuestionPrompt: string;

  // Status
  /** Current job status */
  status: JobRequisitionStatus;

  // Metadata
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * Partner - Affiliate recruiters who submit candidates
 */
export interface Partner {
  /** Unique identifier: part_{ulid} */
  id: string;

  // Identity
  /** Partner name */
  name: string;
  /** Company name */
  companyName?: string;
  /** Contact email */
  email: string;

  // Tracking
  /** Unique code for attribution */
  referralCode: string;
  /** Personalized landing page URL */
  referralUrl: string;

  // Stats (denormalized for quick access)
  /** Total number of referrals */
  totalReferrals: number;
  /** Number of accepted referrals */
  acceptedReferrals: number;

  // Commission
  /** Percentage (0.0 - 1.0) */
  commissionRate: number;

  // Status
  /** Partner status */
  status: PartnerStatus;

  // Metadata
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * User - User account (Auth Layer — Turso)
 * Note: This lives in the Turso auth database, not DuckLake
 */
export interface User {
  /** Unique identifier: user_{ulid} */
  id: string;

  // Auth
  /** User email address */
  email: string;
  /** User full name */
  name: string;

  // RBAC
  /** User role for access control */
  role: UserRole;

  // Associations
  /** If role is 'Partner', reference to Partner ID */
  partnerId?: string;
  /** Which client they belong to (for Recruiters) */
  clientId?: string;

  // Metadata
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

// ============================================================================
// ASSESSMENT ENTITIES
// ============================================================================

/**
 * AssessmentTemplate - Reusable assessment template for different roles
 */
export interface AssessmentTemplate {
  /** Unique identifier: tpl_{ulid} */
  id: string;

  // Basic Info
  /** Template name */
  name: string;
  /** Optional description */
  description?: string;
  /** Category classification */
  category: AssessmentCategory;

  // Template Content
  /** Array of scenario IDs */
  scenarios: string[];
  /** Array of {name, proficiency_level} objects */
  competencies: Competency[];

  // Settings
  /** Overall time limit in seconds */
  timeLimitSeconds?: number;
  /** Is template currently active */
  isActive: boolean;

  // Creator
  /** User ID who created this template */
  createdBy?: string;

  // Metadata
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * Competency - A skill or competency to be assessed
 */
export interface Competency {
  /** Competency name */
  name: string;
  /** Required proficiency level */
  proficiencyLevel: ProficiencyLevel;
}

/**
 * AssessmentScenario - Individual assessment scenario
 */
export interface AssessmentScenario {
  /** Unique identifier: scen_{ulid} */
  id: string;

  // References
  /** Template ID (optional, scenarios can be standalone) */
  templateId?: string;

  // Scenario Type
  /** Type of scenario */
  scenarioType: ScenarioType;

  // Content
  /** Scenario title */
  title: string;
  /** Brief description */
  description?: string;
  /** Full scenario details/prompt */
  content: string;

  // Additional Data
  /** JSON array of points to consider */
  considerations?: string[];
  /** JSON array for SJT multiple choice options */
  options?: SJTOption[];
  /** For SJT - the correct answer key */
  correctAnswer?: string;
  /** JSON scoring rubric for AI evaluation */
  rubric?: Record<string, unknown>;

  // Settings
  /** Time limit in seconds (default 5 minutes) */
  timeLimitSeconds: number;
  /** Order within template */
  orderIndex?: number;

  // Metadata
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * SJTOption - Multiple choice option for Situational Judgment Tests
 */
export interface SJTOption {
  /** Option identifier (A, B, C, D, etc.) */
  id: string;
  /** Option text */
  text: string;
  /** Whether this is the correct answer */
  isCorrect?: boolean;
}

/**
 * CandidateOnboarding - Candidate info collected during onboarding
 */
export interface CandidateOnboarding {
  /** Unique identifier: onb_{ulid} */
  id: string;

  // References
  /** Interview ID */
  interviewId: string;

  // Candidate Info
  /** Candidate name from onboarding */
  candidateName?: string;
  /** Candidate email from onboarding */
  candidateEmail?: string;
  /** Onboarding step reached (0-3) */
  stepCompleted: number;

  // Additional Data
  /** JSON for any additional fields */
  onboardingData?: Record<string, unknown>;

  // Timing
  /** When onboarding completed */
  completedAt?: string;

  // Metadata
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * AssessmentResponse - Candidate response to assessment scenario
 */
export interface AssessmentResponse {
  /** Unique identifier: resp_{ulid} */
  id: string;

  // References
  /** Interview ID */
  interviewId: string;
  /** Scenario ID */
  scenarioId?: string;

  // Response Type
  /** Type of response */
  responseType: ResponseType;

  // Response Content
  /** JSON: {answer, notes, etc.} */
  responseData?: Record<string, unknown>;
  /** For video/audio responses */
  recordingUrl?: string;
  /** Transcribed text from voice AI */
  transcript?: string;

  // Timing
  /** Time spent in seconds */
  timeSpentSeconds?: number;
  /** When response was submitted */
  submittedAt?: string;

  // Metadata
  /** ISO 8601 timestamp of creation */
  createdAt: string;
}

/**
 * AssessmentEvaluation - AI-generated evaluation of response
 */
export interface AssessmentEvaluation {
  /** Unique identifier: eval_{ulid} */
  id: string;

  // References
  /** Response ID */
  responseId: string;

  // Evaluation Criteria
  /** JSON: what was evaluated */
  evaluationCriteria?: Record<string, unknown>;
  /** Candidate score (0.0 to maxScore) */
  score: number;
  /** Maximum possible score */
  maxScore: number;

  // AI Feedback
  /** Detailed AI-generated feedback */
  feedback?: string;
  /** JSON array of identified strengths */
  strengths?: string[];
  /** JSON array of areas for improvement */
  improvements?: string[];

  // Confidence
  /** AI confidence score (0-1) */
  confidence?: number;
  /** Which AI model was used */
  modelUsed?: string;

  // Recruiter Review
  /** Recruiter can add their own assessment */
  recruiterReview?: string;
  /** Whether recruiter agrees with AI evaluation */
  recruiterAgreement?: boolean;

  // Metadata
  /** When evaluation was performed */
  evaluatedAt: string;
}
