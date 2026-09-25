export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      activity_events: {
        Row: {
          created_at: string
          cycle_id: string | null
          event_type: string
          id: string
          journey_id: string | null
          metadata: Json
          occurred_at: string
          source_id: string | null
          source_type: string | null
          summary: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_id?: string | null
          event_type: string
          id?: string
          journey_id?: string | null
          metadata?: Json
          occurred_at?: string
          source_id?: string | null
          source_type?: string | null
          summary?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_id?: string | null
          event_type?: string
          id?: string
          journey_id?: string | null
          metadata?: Json
          occurred_at?: string
          source_id?: string | null
          source_type?: string | null
          summary?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      assessment_capability_scores: {
        Row: {
          assessment_session_id: string
          capability_id: string
          capability_score: number
          case_score: number
          created_at: string
          evidence_level: string
          evidence_refs: Json
          id: string
          knowledge_score: number
          practice_score: number
          rationale: string
          user_id: string
        }
        Insert: {
          assessment_session_id: string
          capability_id: string
          case_score: number
          created_at?: string
          evidence_level?: string
          evidence_refs?: Json
          id?: string
          knowledge_score: number
          practice_score: number
          rationale: string
          user_id: string
        }
        Update: {
          assessment_session_id?: string
          capability_id?: string
          case_score?: number
          created_at?: string
          evidence_level?: string
          evidence_refs?: Json
          id?: string
          knowledge_score?: number
          practice_score?: number
          rationale?: string
          user_id?: string
        }
        Relationships: []
      }
      assessment_sessions: {
        Row: {
          assessment_type: string
          completed_at: string | null
          confidence_score: number | null
          created_at: string
          cycle_id: string | null
          id: string
          journey_id: string
          readiness_score: number | null
          scoring_version: number
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_type: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          cycle_id?: string | null
          id?: string
          journey_id: string
          readiness_score?: number | null
          scoring_version?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_type?: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          cycle_id?: string | null
          id?: string
          journey_id?: string
          readiness_score?: number | null
          scoring_version?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_events: Database["graphql_public"]["Tables"]["activity_events"]
      assessment_capability_scores: Database["graphql_public"]["Tables"]["assessment_capability_scores"]
      assessment_sessions: Database["graphql_public"]["Tables"]["assessment_sessions"]
      ai_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          feature: string
          id: string
          model: string
          source_id: string | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          feature: string
          id?: string
          model: string
          source_id?: string | null
          started_at?: string | null
          status: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          feature?: string
          id?: string
          model?: string
          source_id?: string | null
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      capabilities: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          title_en: string
          title_zh: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order: number
          title_en: string
          title_zh: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title_en?: string
          title_zh?: string
          updated_at?: string
        }
        Relationships: []
      }
      capture_entries: {
        Row: {
          analysis_error: string | null
          analysis_status: string
          analyzed_at: string | null
          content: string
          created_at: string
          entry_type: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_error?: string | null
          analysis_status?: string
          analyzed_at?: string | null
          content: string
          created_at?: string
          entry_type: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_error?: string | null
          analysis_status?: string
          analyzed_at?: string | null
          content?: string
          created_at?: string
          entry_type?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_capability_tags: {
        Row: {
          capability_id: string
          confidence: number | null
          created_at: string
          daily_reflection_id: string
          id: string
          user_id: string
        }
        Insert: {
          capability_id: string
          confidence?: number | null
          created_at?: string
          daily_reflection_id: string
          id?: string
          user_id: string
        }
        Update: {
          capability_id?: string
          confidence?: number | null
          created_at?: string
          daily_reflection_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_capability_tags_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_capability_tags_daily_reflection_id_user_id_fkey"
            columns: ["daily_reflection_id", "user_id"]
            isOneToOne: false
            referencedRelation: "daily_reflections"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      daily_reflections: {
        Row: {
          analysis: string | null
          capture_entry_id: string | null
          created_at: string
          id: string
          raw_content: string
          reflection_date: string
          responsibility_hint: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis?: string | null
          capture_entry_id?: string | null
          created_at?: string
          id?: string
          raw_content: string
          reflection_date?: string
          responsibility_hint?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis?: string | null
          capture_entry_id?: string | null
          created_at?: string
          id?: string
          raw_content?: string
          reflection_date?: string
          responsibility_hint?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reflections_capture_entry_id_user_id_fkey"
            columns: ["capture_entry_id", "user_id"]
            isOneToOne: false
            referencedRelation: "capture_entries"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      growth_gaps: {
        Row: {
          capability_id: string | null
          concept_id: string | null
          created_at: string
          daily_reflection_id: string | null
          detail: string | null
          gap_type: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capability_id?: string | null
          concept_id?: string | null
          created_at?: string
          daily_reflection_id?: string | null
          detail?: string | null
          gap_type: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capability_id?: string | null
          concept_id?: string | null
          created_at?: string
          daily_reflection_id?: string | null
          detail?: string | null
          gap_type?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_gaps_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_gaps_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "knowledge_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_gaps_daily_reflection_id_user_id_fkey"
            columns: ["daily_reflection_id", "user_id"]
            isOneToOne: false
            referencedRelation: "daily_reflections"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      interview_messages: {
        Row: {
          capability_id: string | null
          content: string
          created_at: string
          id: string
          interview_session_id: string
          role: string
          sequence_number: number
          user_id: string
        }
        Insert: {
          capability_id?: string | null
          content: string
          created_at?: string
          id?: string
          interview_session_id: string
          role: string
          sequence_number: number
          user_id: string
        }
        Update: {
          capability_id?: string | null
          content?: string
          created_at?: string
          id?: string
          interview_session_id?: string
          role?: string
          sequence_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_messages_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_messages_interview_session_id_user_id_fkey"
            columns: ["interview_session_id", "user_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          quarterly_review_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          quarterly_review_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          quarterly_review_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_quarterly_review_id_user_id_fkey"
            columns: ["quarterly_review_id", "user_id"]
            isOneToOne: false
            referencedRelation: "quarterly_reviews"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      learning_cycles: {
        Row: {
          assessment_due_on: string
          completed_at: string | null
          created_at: string
          cycle_number: number
          ends_on: string
          id: string
          journey_id: string
          starts_on: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_due_on: string
          completed_at?: string | null
          created_at?: string
          cycle_number: number
          ends_on: string
          id?: string
          journey_id: string
          starts_on: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_due_on?: string
          completed_at?: string | null
          created_at?: string
          cycle_number?: number
          ends_on?: string
          id?: string
          journey_id?: string
          starts_on?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_journeys: {
        Row: {
          archived_at: string | null
          baseline_completed_on: string | null
          created_at: string
          formal_started_on: string | null
          id: string
          mode: string
          preparation_started_on: string
          restart_reason: string | null
          sequence_number: number
          stage: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          baseline_completed_on?: string | null
          created_at?: string
          formal_started_on?: string | null
          id?: string
          mode: string
          preparation_started_on: string
          restart_reason?: string | null
          sequence_number: number
          stage?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          baseline_completed_on?: string | null
          created_at?: string
          formal_started_on?: string | null
          id?: string
          mode?: string
          preparation_started_on?: string
          restart_reason?: string | null
          sequence_number?: number
          stage?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_categories: {
        Row: {
          capability_id: string
          category_code: string
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          title_en: string | null
          title_zh: string
          updated_at: string
        }
        Insert: {
          capability_id: string
          category_code: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order: number
          title_en?: string | null
          title_zh: string
          updated_at?: string
        }
        Update: {
          capability_id?: string
          category_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title_en?: string | null
          title_zh?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_categories_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_concept_prerequisites: {
        Row: {
          concept_id: string
          created_at: string
          prerequisite_concept_id: string
        }
        Insert: {
          concept_id: string
          created_at?: string
          prerequisite_concept_id: string
        }
        Update: {
          concept_id?: string
          created_at?: string
          prerequisite_concept_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_concept_prerequisites_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "knowledge_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_concept_prerequisites_prerequisite_concept_id_fkey"
            columns: ["prerequisite_concept_id"]
            isOneToOne: false
            referencedRelation: "knowledge_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_concepts: {
        Row: {
          application_questions: Json
          capability_id: string
          category_id: string
          common_mistakes: Json
          concept_code: string
          core_principles: Json
          created_at: string
          description: string
          id: string
          is_active: boolean
          key_questions: Json
          sort_order: number
          tags: Json
          title_en: string
          title_zh: string
          updated_at: string
          why_it_matters: string
        }
        Insert: {
          application_questions?: Json
          capability_id: string
          category_id: string
          common_mistakes?: Json
          concept_code: string
          core_principles?: Json
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          key_questions?: Json
          sort_order: number
          tags?: Json
          title_en: string
          title_zh: string
          updated_at?: string
          why_it_matters: string
        }
        Update: {
          application_questions?: Json
          capability_id?: string
          category_id?: string
          common_mistakes?: Json
          concept_code?: string
          core_principles?: Json
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          key_questions?: Json
          sort_order?: number
          tags?: Json
          title_en?: string
          title_zh?: string
          updated_at?: string
          why_it_matters?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_concepts_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_concepts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_progress: {
        Row: {
          concept_id: string
          consecutive_successes: number
          created_at: string
          first_learned_at: string | null
          id: string
          last_application_score: number | null
          last_concept_score: number | null
          last_reviewed_at: string | null
          next_review_at: string | null
          review_count: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concept_id: string
          consecutive_successes?: number
          created_at?: string
          first_learned_at?: string | null
          id?: string
          last_application_score?: number | null
          last_concept_score?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string | null
          review_count?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concept_id?: string
          consecutive_successes?: number
          created_at?: string
          first_learned_at?: string | null
          id?: string
          last_application_score?: number | null
          last_concept_score?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string | null
          review_count?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_progress_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "knowledge_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_reviews: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          recommended_concept_ids: Json
          recommended_focus_codes: Json
          recommended_practice_challenges: Json
          review_markdown: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          recommended_concept_ids?: Json
          recommended_focus_codes?: Json
          recommended_practice_challenges?: Json
          review_markdown: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          recommended_concept_ids?: Json
          recommended_focus_codes?: Json
          recommended_practice_challenges?: Json
          review_markdown?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      practice_evidence: {
        Row: {
          action: string | null
          capability_id: string
          context: string | null
          created_at: string
          decision: string | null
          evidence_level: string
          id: string
          limitations: string | null
          next_evidence_needed: string | null
          outcome: string | null
          source_daily_id: string | null
          stakeholders: string | null
          updated_at: string
          user_id: string
          user_role: string | null
          why_it_matters: string | null
        }
        Insert: {
          action?: string | null
          capability_id: string
          context?: string | null
          created_at?: string
          decision?: string | null
          evidence_level: string
          id?: string
          limitations?: string | null
          next_evidence_needed?: string | null
          outcome?: string | null
          source_daily_id?: string | null
          stakeholders?: string | null
          updated_at?: string
          user_id: string
          user_role?: string | null
          why_it_matters?: string | null
        }
        Update: {
          action?: string | null
          capability_id?: string
          context?: string | null
          created_at?: string
          decision?: string | null
          evidence_level?: string
          id?: string
          limitations?: string | null
          next_evidence_needed?: string | null
          outcome?: string | null
          source_daily_id?: string | null
          stakeholders?: string | null
          updated_at?: string
          user_id?: string
          user_role?: string | null
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_evidence_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_evidence_source_daily_id_user_id_fkey"
            columns: ["source_daily_id", "user_id"]
            isOneToOne: false
            referencedRelation: "daily_reflections"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      quarterly_reviews: {
        Row: {
          assessment_markdown: string | null
          created_at: string
          executive_level_gaps: Json
          id: string
          next_quarter_focus: Json
          period_end: string
          period_start: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_markdown?: string | null
          created_at?: string
          executive_level_gaps?: Json
          id?: string
          next_quarter_focus?: Json
          period_end: string
          period_start: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_markdown?: string | null
          created_at?: string
          executive_level_gaps?: Json
          id?: string
          next_quarter_focus?: Json
          period_end?: string
          period_start?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_attempts: {
        Row: {
          ai_feedback: string | null
          ai_rationale: string | null
          application_answer: string | null
          application_question: string
          application_score: number | null
          concept_id: string
          concept_score: number | null
          created_at: string
          expires_at: string
          id: string
          recall_answer: string | null
          recall_question: string
          session_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_rationale?: string | null
          application_answer?: string | null
          application_question: string
          application_score?: number | null
          concept_id: string
          concept_score?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          recall_answer?: string | null
          recall_question: string
          session_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          ai_rationale?: string | null
          application_answer?: string | null
          application_question?: string
          application_score?: number | null
          concept_id?: string
          concept_score?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          recall_answer?: string | null
          recall_question?: string
          session_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_attempts_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "knowledge_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          ai_feedback: string
          ai_rationale: string
          application_answer: string
          application_question: string
          application_score: number
          attempt_id: string | null
          committed_at: string
          concept_id: string
          concept_score: number
          created_at: string
          id: string
          invalidated_at: string | null
          invalidated_reason: string | null
          is_valid: boolean
          recall_answer: string
          recall_question: string
          resulting_next_review_at: string
          resulting_status: string
          session_type: string
          user_id: string
        }
        Insert: {
          ai_feedback: string
          ai_rationale: string
          application_answer: string
          application_question: string
          application_score: number
          attempt_id?: string | null
          committed_at?: string
          concept_id: string
          concept_score: number
          created_at?: string
          id?: string
          invalidated_at?: string | null
          invalidated_reason?: string | null
          is_valid?: boolean
          recall_answer: string
          recall_question: string
          resulting_next_review_at: string
          resulting_status: string
          session_type: string
          user_id: string
        }
        Update: {
          ai_feedback?: string
          ai_rationale?: string
          application_answer?: string
          application_question?: string
          application_score?: number
          attempt_id?: string | null
          committed_at?: string
          concept_id?: string
          concept_score?: number
          created_at?: string
          id?: string
          invalidated_at?: string | null
          invalidated_reason?: string | null
          is_valid?: boolean
          recall_answer?: string
          recall_question?: string
          resulting_next_review_at?: string
          resulting_status?: string
          session_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_attempt_id_user_id_fkey"
            columns: ["attempt_id", "user_id"]
            isOneToOne: false
            referencedRelation: "study_attempts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "study_sessions_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "knowledge_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_plans: {
        Row: {
          change_reason: string | null
          confidence_basis: Json
          confidence_score: number
          created_at: string
          ended_at: string | null
          focus_codes: string[]
          id: string
          long_term_goal: string
          milestones: Json
          phase_goal: string
          previous_plan_id: string | null
          rationale: string
          source: string
          starts_at: string
          status: string
          target_ends_at: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          change_reason?: string | null
          confidence_basis?: Json
          confidence_score: number
          created_at?: string
          ended_at?: string | null
          focus_codes: string[]
          id?: string
          long_term_goal: string
          milestones?: Json
          phase_goal: string
          previous_plan_id?: string | null
          rationale: string
          source: string
          starts_at?: string
          status?: string
          target_ends_at: string
          updated_at?: string
          user_id: string
          version: number
        }
        Update: {
          change_reason?: string | null
          confidence_basis?: Json
          confidence_score?: number
          created_at?: string
          ended_at?: string | null
          focus_codes?: string[]
          id?: string
          long_term_goal?: string
          milestones?: Json
          phase_goal?: string
          previous_plan_id?: string | null
          rationale?: string
          source?: string
          starts_at?: string
          status?: string
          target_ends_at?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "growth_plans_previous_plan_id_fkey"
            columns: ["previous_plan_id"]
            isOneToOne: false
            referencedRelation: "growth_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_focuses: {
        Row: {
          capability_id: string
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          note: string | null
          priority: number
          starts_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capability_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          note?: string | null
          priority?: number
          starts_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capability_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          note?: string | null
          priority?: number
          starts_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_focuses_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_growth_state: {
        Row: {
          capability_assessments: Json
          created_at: string
          knowledge_gaps: Json
          overall_goal: string | null
          practice_gaps: Json
          recent_training_direction: string | null
          strengths: Json
          summary: string | null
          updated_at: string
          user_id: string
          weaknesses: Json
        }
        Insert: {
          capability_assessments?: Json
          created_at?: string
          knowledge_gaps?: Json
          overall_goal?: string | null
          practice_gaps?: Json
          recent_training_direction?: string | null
          strengths?: Json
          summary?: string | null
          updated_at?: string
          user_id: string
          weaknesses?: Json
        }
        Update: {
          capability_assessments?: Json
          created_at?: string
          knowledge_gaps?: Json
          overall_goal?: string | null
          practice_gaps?: Json
          recent_training_direction?: string | null
          strengths?: Json
          summary?: string | null
          updated_at?: string
          user_id?: string
          weaknesses?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_growth_plan: {
        Args: {
          p_change_reason: string | null
          p_confidence_basis: Json
          p_confidence_score: number
          p_focus_codes: string[]
          p_long_term_goal: string
          p_milestones: Json
          p_phase_goal: string
          p_rationale: string
          p_source: string
          p_target_ends_at: string
        }
        Returns: Database["public"]["Tables"]["growth_plans"]["Row"]
      }
      commit_study_attempt: {
        Args: { p_attempt_id: string }
        Returns: Database["public"]["Tables"]["study_sessions"]["Row"]
      }
      confirm_formal_learning_start: {
        Args: { p_date: string }
        Returns: Database["public"]["Tables"]["learning_cycles"]["Row"]
      }
      correct_journey_preparation_date: {
        Args: { p_date: string; p_reason: string }
        Returns: Database["public"]["Tables"]["learning_journeys"]["Row"]
      }
      complete_quarterly_review: {
        Args: {
          p_assessment_markdown: string
          p_capability_assessments: Json
          p_executive_level_gaps: Json
          p_knowledge_gaps: Json
          p_next_quarter_focus: string[]
          p_practice_gaps: Json
          p_recent_training_direction: string
          p_session_id: string
          p_strengths: Json
          p_summary: string
          p_weaknesses: Json
        }
        Returns: Database["public"]["Tables"]["quarterly_reviews"]["Row"]
      }
      finalize_capture_analysis: {
        Args: { p_analysis: Json; p_capture_id: string }
        Returns: Database["public"]["Tables"]["daily_reflections"]["Row"]
      }
      finalize_monthly_review: {
        Args: {
          p_capability_assessments: Json
          p_focus_codes: string[]
          p_knowledge_gaps: Json
          p_period_end: string
          p_period_start: string
          p_practice_gaps: Json
          p_recent_training_direction: string
          p_recommended_concept_ids: Json
          p_recommended_practice_challenges: Json
          p_review_markdown: string
          p_strengths: Json
          p_summary: string
          p_weaknesses: Json
        }
        Returns: Database["public"]["Tables"]["monthly_reviews"]["Row"]
      }
      rebuild_knowledge_progress: {
        Args: { p_concept_id: string; p_user_id: string }
        Returns: Database["public"]["Tables"]["knowledge_progress"]["Row"]
      }
      restart_learning_journey: {
        Args: {
          p_confirmation: string
          p_copy_long_term_goal: boolean
          p_mode: string
          p_preparation_started_on: string
          p_reason: string
        }
        Returns: Database["public"]["Tables"]["learning_journeys"]["Row"]
      }
      set_study_session_validity: {
        Args: {
          p_reason: string | null
          p_session_id: string
          p_valid: boolean
        }
        Returns: Database["public"]["Tables"]["knowledge_progress"]["Row"]
      }
      set_growth_profile: {
        Args: { p_focus_codes: string[]; p_overall_goal: string }
        Returns: undefined
      }
      start_quarterly_interview: {
        Args: { p_period_end: string; p_period_start: string }
        Returns: Database["public"]["Tables"]["interview_sessions"]["Row"]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
