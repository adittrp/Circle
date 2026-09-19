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
  public: {
    Tables: {
      activities: {
        Row: {
          campus_location_id: string | null
          circle_id: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          emoji: string | null
          id: string
          is_spontaneous: boolean
          location_label: string | null
          mood: string | null
          reason: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["activity_status"]
          title: string
        }
        Insert: {
          campus_location_id?: string | null
          circle_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          emoji?: string | null
          id?: string
          is_spontaneous?: boolean
          location_label?: string | null
          mood?: string | null
          reason?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          title: string
        }
        Update: {
          campus_location_id?: string | null
          circle_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          emoji?: string | null
          id?: string
          is_spontaneous?: boolean
          location_label?: string | null
          mood?: string | null
          reason?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_campus_location_id_fkey"
            columns: ["campus_location_id"]
            isOneToOne: false
            referencedRelation: "campus_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_attendance: {
        Row: {
          activity_id: string
          created_at: string
          marked_by: string
          profile_id: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          activity_id: string
          created_at?: string
          marked_by: string
          profile_id: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          activity_id?: string
          created_at?: string
          marked_by?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "activity_attendance_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "activity_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_attendance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_attendance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "activity_attendance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_feedback: {
        Row: {
          activity_id: string
          emoji: string | null
          hang_again: Database["public"]["Enums"]["hang_again"] | null
          profile_id: string
          submitted_at: string
        }
        Insert: {
          activity_id: string
          emoji?: string | null
          hang_again?: Database["public"]["Enums"]["hang_again"] | null
          profile_id: string
          submitted_at?: string
        }
        Update: {
          activity_id?: string
          emoji?: string | null
          hang_again?: Database["public"]["Enums"]["hang_again"] | null
          profile_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feedback_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "activity_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_rsvps: {
        Row: {
          activity_id: string
          profile_id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          updated_at: string
        }
        Insert: {
          activity_id: string
          profile_id: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
        }
        Update: {
          activity_id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_rsvps_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_rsvps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_rsvps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "activity_rsvps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_locations: {
        Row: {
          category: Database["public"]["Enums"]["location_category"]
          data_status: Database["public"]["Enums"]["data_status"]
          id: string
          name: string
          university_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["location_category"]
          data_status?: Database["public"]["Enums"]["data_status"]
          id?: string
          name: string
          university_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["location_category"]
          data_status?: Database["public"]["Enums"]["data_status"]
          id?: string
          name?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_locations_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_leave_feedback: {
        Row: {
          circle_id: string
          created_at: string
          id: string
          notes: string | null
          profile_id: string
          reason: Database["public"]["Enums"]["circle_leave_reason"]
        }
        Insert: {
          circle_id: string
          created_at?: string
          id?: string
          notes?: string | null
          profile_id: string
          reason: Database["public"]["Enums"]["circle_leave_reason"]
        }
        Update: {
          circle_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          profile_id?: string
          reason?: Database["public"]["Enums"]["circle_leave_reason"]
        }
        Relationships: [
          {
            foreignKeyName: "circle_leave_feedback_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_leave_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_leave_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "circle_leave_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_members: {
        Row: {
          circle_id: string
          id: string
          joined_at: string
          left_at: string | null
          member_role: string
          profile_id: string
          status: string
        }
        Insert: {
          circle_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          member_role?: string
          profile_id: string
          status?: string
        }
        Update: {
          circle_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          member_role?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "circle_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_rules: {
        Row: {
          accessibility_needed: boolean
          age_18_plus: boolean
          circle_id: string
          early_evening: boolean
          id: string
          low_cost: boolean
          no_drinking: boolean
          no_parties: boolean
          no_smoking: boolean
          notes: string | null
          public_campus_only: boolean
          study_focused: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accessibility_needed?: boolean
          age_18_plus?: boolean
          circle_id: string
          early_evening?: boolean
          id?: string
          low_cost?: boolean
          no_drinking?: boolean
          no_parties?: boolean
          no_smoking?: boolean
          notes?: string | null
          public_campus_only?: boolean
          study_focused?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accessibility_needed?: boolean
          age_18_plus?: boolean
          circle_id?: string
          early_evening?: boolean
          id?: string
          low_cost?: boolean
          no_drinking?: boolean
          no_parties?: boolean
          no_smoking?: boolean
          notes?: string | null
          public_campus_only?: boolean
          study_focused?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "circle_rules_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: true
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "circle_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          active_member_count: number
          completed_meetups: number
          created_at: string
          formed_at: string
          formed_by: string | null
          id: string
          is_active: boolean
          match_meta: Json
          match_score: number | null
          stage: Database["public"]["Enums"]["circle_stage"]
          university_id: string
          why_together: string[]
        }
        Insert: {
          active_member_count?: number
          completed_meetups?: number
          created_at?: string
          formed_at?: string
          formed_by?: string | null
          id?: string
          is_active?: boolean
          match_meta?: Json
          match_score?: number | null
          stage?: Database["public"]["Enums"]["circle_stage"]
          university_id: string
          why_together?: string[]
        }
        Update: {
          active_member_count?: number
          completed_meetups?: number
          created_at?: string
          formed_at?: string
          formed_by?: string | null
          id?: string
          is_active?: boolean
          match_meta?: Json
          match_score?: number | null
          stage?: Database["public"]["Enums"]["circle_stage"]
          university_id?: string
          why_together?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "circles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["community_kind"]
          major_id: string | null
          name: string
          slug: string
          university_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["community_kind"]
          major_id?: string | null
          name: string
          slug: string
          university_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["community_kind"]
          major_id?: string | null
          name?: string
          slug?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string
          profile_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          profile_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          category: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          category: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          category?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      karma_events: {
        Row: {
          created_at: string
          delta: number
          id: string
          kind: Database["public"]["Enums"]["karma_kind"]
          metadata: Json
          profile_id: string
          report_id: string | null
          source_id: string | null
          source_key: string | null
        }
        Insert: {
          created_at?: string
          delta?: number
          id?: string
          kind: Database["public"]["Enums"]["karma_kind"]
          metadata?: Json
          profile_id: string
          report_id?: string | null
          source_id?: string | null
          source_key?: string | null
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          kind?: Database["public"]["Enums"]["karma_kind"]
          metadata?: Json
          profile_id?: string
          report_id?: string | null
          source_id?: string | null
          source_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "karma_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karma_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "karma_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karma_events_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      majors: {
        Row: {
          id: string
          name: string
          university_id: string
        }
        Insert: {
          id?: string
          name: string
          university_id: string
        }
        Update: {
          id?: string
          name?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "majors_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_rounds: {
        Row: {
          completed_at: string | null
          id: string
          notes: string | null
          started_at: string
          university_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          university_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_rounds_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_id: string
          body: string
          circle_id: string | null
          community_id: string | null
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          circle_id?: string | null
          community_id?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          circle_id?: string | null
          community_id?: string | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action_type"]
          actor_id: string
          created_at: string
          id: string
          notes: string | null
          report_id: string | null
          target_profile_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action_type"]
          actor_id: string
          created_at?: string
          id?: string
          notes?: string | null
          report_id?: string | null
          target_profile_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action_type"]
          actor_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          report_id?: string | null
          target_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "moderation_actions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "moderation_actions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          community_id: string | null
          created_at: string
          id: string
          source_url: string | null
          suggested_activity_id: string | null
          title: string | null
        }
        Insert: {
          author_id: string
          body: string
          community_id?: string | null
          created_at?: string
          id?: string
          source_url?: string | null
          suggested_activity_id?: string | null
          title?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          community_id?: string | null
          created_at?: string
          id?: string
          source_url?: string | null
          suggested_activity_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_suggested_activity_id_fkey"
            columns: ["suggested_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_verifications: {
        Row: {
          method: Database["public"]["Enums"]["verification_method"]
          profile_id: string
          verified_at: string
        }
        Insert: {
          method?: Database["public"]["Enums"]["verification_method"]
          profile_id: string
          verified_at?: string
        }
        Update: {
          method?: Database["public"]["Enums"]["verification_method"]
          profile_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profile_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          first_name: string | null
          hometown: string | null
          id: string
          is_synthetic: boolean
          last_name: string | null
          major_id: string | null
          minor: string | null
          onboarding_completed_at: string | null
          residence_hall_id: string | null
          second_major_id: string | null
          university_id: string | null
          updated_at: string
          visibility: Json
          year: Database["public"]["Enums"]["year_level"] | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          hometown?: string | null
          id?: string
          is_synthetic?: boolean
          last_name?: string | null
          major_id?: string | null
          minor?: string | null
          onboarding_completed_at?: string | null
          residence_hall_id?: string | null
          second_major_id?: string | null
          university_id?: string | null
          updated_at?: string
          visibility?: Json
          year?: Database["public"]["Enums"]["year_level"] | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          hometown?: string | null
          id?: string
          is_synthetic?: boolean
          last_name?: string | null
          major_id?: string | null
          minor?: string | null
          onboarding_completed_at?: string | null
          residence_hall_id?: string | null
          second_major_id?: string | null
          university_id?: string | null
          updated_at?: string
          visibility?: Json
          year?: Database["public"]["Enums"]["year_level"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_residence_hall_id_fkey"
            columns: ["residence_hall_id"]
            isOneToOne: false
            referencedRelation: "residence_halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_second_major_id_fkey"
            columns: ["second_major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          activity_id: string | null
          category: Database["public"]["Enums"]["report_category"]
          circle_id: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          subject_profile_id: string | null
        }
        Insert: {
          activity_id?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          circle_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          subject_profile_id?: string | null
        }
        Update: {
          activity_id?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          circle_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          subject_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reports_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      residence_halls: {
        Row: {
          data_status: Database["public"]["Enums"]["data_status"]
          id: string
          is_off_campus: boolean
          name: string
          university_id: string
        }
        Insert: {
          data_status?: Database["public"]["Enums"]["data_status"]
          id?: string
          is_off_campus?: boolean
          name: string
          university_id: string
        }
        Update: {
          data_status?: Database["public"]["Enums"]["data_status"]
          id?: string
          is_off_campus?: boolean
          name?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "residence_halls_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_acknowledgements: {
        Row: {
          acknowledged_at: string
          document_key: string
          document_version: number
          id: string
          profile_id: string
        }
        Insert: {
          acknowledged_at?: string
          document_key: string
          document_version: number
          id?: string
          profile_id: string
        }
        Update: {
          acknowledged_at?: string
          document_key?: string
          document_version?: number
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_acknowledgements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_acknowledgements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "safety_acknowledgements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_moderators: {
        Row: {
          created_at: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_moderators_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_moderators_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "safety_moderators_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          abbreviation: string
          city: string
          created_at: string
          id: string
          logo_path: string
          name: string
          primary_color: string
          secondary_color: string
          slug: string
        }
        Insert: {
          abbreviation: string
          city: string
          created_at?: string
          id?: string
          logo_path?: string
          name: string
          primary_color?: string
          secondary_color?: string
          slug: string
        }
        Update: {
          abbreviation?: string
          city?: string
          created_at?: string
          id?: string
          logo_path?: string
          name?: string
          primary_color?: string
          secondary_color?: string
          slug?: string
        }
        Relationships: []
      }
      university_email_domains: {
        Row: {
          domain: string
          id: string
          university_id: string
        }
        Insert: {
          domain: string
          id?: string
          university_id: string
        }
        Update: {
          domain?: string
          id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_email_domains_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_availability: {
        Row: {
          id: string
          time_window: Database["public"]["Enums"]["availability_window"]
          user_id: string
          weekday: number
        }
        Insert: {
          id?: string
          time_window: Database["public"]["Enums"]["availability_window"]
          user_id: string
          weekday: number
        }
        Update: {
          id?: string
          time_window?: Database["public"]["Enums"]["availability_window"]
          user_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          interest_id: string
          user_id: string
        }
        Insert: {
          interest_id: string
          user_id: string
        }
        Update: {
          interest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          answers: Json
          food_text: string | null
          friday_night: string | null
          group_size: string | null
          looking_for: string[] | null
          planning_style: string | null
          sleep_schedule: string | null
          social_energy: number | null
          spontaneous_vs_planned: number | null
          updated_at: string
          user_id: string
          vibe_completed: boolean
          weekend_style: string | null
        }
        Insert: {
          answers?: Json
          food_text?: string | null
          friday_night?: string | null
          group_size?: string | null
          looking_for?: string[] | null
          planning_style?: string | null
          sleep_schedule?: string | null
          social_energy?: number | null
          spontaneous_vs_planned?: number | null
          updated_at?: string
          user_id: string
          vibe_completed?: boolean
          weekend_style?: string | null
        }
        Update: {
          answers?: Json
          food_text?: string | null
          friday_night?: string | null
          group_size?: string | null
          looking_for?: string[] | null
          planning_style?: string | null
          sleep_schedule?: string | null
          social_energy?: number | null
          spontaneous_vs_planned?: number | null
          updated_at?: string
          user_id?: string
          vibe_completed?: boolean
          weekend_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reputation: {
        Row: {
          karma: number
          late_cancellations: number
          no_shows: number
          plans_accepted: number
          plans_attended: number
          profile_id: string
          standing: Database["public"]["Enums"]["community_standing"]
          updated_at: string
        }
        Insert: {
          karma?: number
          late_cancellations?: number
          no_shows?: number
          plans_accepted?: number
          plans_attended?: number
          profile_id: string
          standing?: Database["public"]["Enums"]["community_standing"]
          updated_at?: string
        }
        Update: {
          karma?: number
          late_cancellations?: number
          no_shows?: number
          plans_accepted?: number
          plans_attended?: number
          profile_id?: string
          standing?: Database["public"]["Enums"]["community_standing"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reputation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reputation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_reputation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      user_verifications: {
        Row: {
          created_at: string
          evidence_digest: string | null
          id: string
          method: Database["public"]["Enums"]["verification_method"]
          profile_id: string
          provider: string
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_digest?: string | null
          id?: string
          method: Database["public"]["Enums"]["verification_method"]
          profile_id: string
          provider?: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_digest?: string | null
          id?: string
          method?: Database["public"]["Enums"]["verification_method"]
          profile_id?: string
          provider?: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_trust_badges: {
        Row: {
          profile_id: string | null
          university_verified: boolean | null
        }
        Insert: {
          profile_id?: string | null
          university_verified?: never
        }
        Update: {
          profile_id?: string | null
          university_verified?: never
        }
        Relationships: []
      }
      reputation_events: {
        Row: {
          created_at: string | null
          delta: number | null
          id: string | null
          kind: Database["public"]["Enums"]["karma_kind"] | null
          metadata: Json | null
          profile_id: string | null
          report_id: string | null
          source_id: string | null
          source_key: string | null
        }
        Insert: {
          created_at?: string | null
          delta?: number | null
          id?: string | null
          kind?: Database["public"]["Enums"]["karma_kind"] | null
          metadata?: Json | null
          profile_id?: string | null
          report_id?: string | null
          source_id?: string | null
          source_key?: string | null
        }
        Update: {
          created_at?: string | null
          delta?: number | null
          id?: string | null
          kind?: Database["public"]["Enums"]["karma_kind"] | null
          metadata?: Json | null
          profile_id?: string | null
          report_id?: string | null
          source_id?: string | null
          source_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "karma_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karma_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_trust_badges"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "karma_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karma_events_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      student_directory: {
        Row: {
          avatar_url: string | null
          bio: string | null
          first_name: string | null
          hometown: string | null
          id: string | null
          last_name: string | null
          major_id: string | null
          residence_hall_id: string | null
          university_id: string | null
          year: Database["public"]["Enums"]["year_level"] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: never
          first_name?: string | null
          hometown?: never
          id?: string | null
          last_name?: never
          major_id?: never
          residence_hall_id?: never
          university_id?: string | null
          year?: never
        }
        Update: {
          avatar_url?: string | null
          bio?: never
          first_name?: string | null
          hometown?: never
          id?: string | null
          last_name?: never
          major_id?: never
          residence_hall_id?: never
          university_id?: string | null
          year?: never
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_moderation_action: {
        Args: {
          p_action: Database["public"]["Enums"]["moderation_action_type"]
          p_notes?: string
          p_report_id?: string
          p_target: string
        }
        Returns: string
      }
      filter_match_candidates: {
        Args: { candidate_ids: string[] }
        Returns: string[]
      }
      form_matched_circle: {
        Args: {
          companion_ids: string[]
          why?: string[]
          p_match_score?: number | null
          p_match_meta?: Json
        }
        Returns: string
      }
      get_matching_pool: {
        Args: { include_synthetic?: boolean }
        Returns: {
          profile_id: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          university_id: string
          year: Database["public"]["Enums"]["year_level"] | null
          major_id: string | null
          major_name: string | null
          residence_hall_id: string | null
          residence_name: string | null
          hometown: string | null
          bio: string | null
          is_synthetic: boolean
          interest_ids: string[] | null
          interest_names: string[] | null
          availability: Json
          social_energy: number | null
          planning_style: string | null
          sleep_schedule: string | null
          group_size: string | null
          weekend_style: string | null
          looking_for: string[] | null
        }[]
      }
      get_my_active_circle: {
        Args: Record<string, never>
        Returns: {
          circle_id: string
          university_id: string
          stage: Database["public"]["Enums"]["circle_stage"]
          formed_at: string
          why_together: string[]
          match_score: number | null
          match_meta: Json
          members: Json
        }[]
      }
      invite_student_to_circle: {
        Args: { invitee_id: string }
        Returns: string
      }
      leave_circle: {
        Args: {
          p_circle_id: string
          p_notes?: string
          p_reason?: Database["public"]["Enums"]["circle_leave_reason"]
        }
        Returns: undefined
      }
      record_own_karma_event: {
        Args: {
          p_kind: Database["public"]["Enums"]["karma_kind"]
          p_metadata?: Json
          p_source_id?: string
          p_source_key?: string
        }
        Returns: string
      }
    }
    Enums: {
      activity_status: "upcoming" | "completed" | "cancelled"
      attendance_status: "attended" | "no_show"
      availability_window: "morning" | "afternoon" | "evening"
      circle_leave_reason:
        | "not_clicking"
        | "schedule"
        | "no_longer_interested"
        | "felt_uncomfortable"
        | "other"
      circle_stage: "introduced" | "met_once" | "met_again" | "regular"
      community_kind: "major" | "campus" | "interest"
      community_standing: "good" | "limited" | "restricted" | "suspended"
      data_status: "verified" | "needs_review"
      hang_again: "yes" | "maybe" | "no"
      karma_kind:
        | "rsvp_kept"
        | "no_show"
        | "meetup_completed"
        | "rsvp_accepted"
        | "late_cancellation"
        | "plan_organized"
        | "consistent_participation"
        | "university_verified"
        | "identity_verified"
        | "confirmed_spam"
        | "confirmed_harassment"
        | "confirmed_rule_violation"
      location_category: "hangout" | "gym" | "library" | "dining"
      moderation_action_type:
        | "dismiss_report"
        | "confirm_violation"
        | "confirm_harassment"
        | "confirm_spam"
        | "restrict_account"
        | "suspend_account"
        | "restore_account"
      report_category:
        | "harassment"
        | "spam"
        | "threatening_behavior"
        | "hate_discrimination"
        | "unsafe_behavior"
        | "fake_account"
        | "inappropriate_content"
        | "other"
      report_status:
        | "open"
        | "reviewing"
        | "resolved"
        | "dismissed"
        | "confirmed"
      rsvp_status: "pending" | "in" | "cant"
      verification_method: "edu_email" | "identity_provider"
      verification_status: "unverified" | "pending" | "verified" | "failed"
      year_level: "Freshman" | "Sophomore" | "Junior" | "Senior" | "Graduate"
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
  public: {
    Enums: {
      activity_status: ["upcoming", "completed", "cancelled"],
      attendance_status: ["attended", "no_show"],
      availability_window: ["morning", "afternoon", "evening"],
      circle_leave_reason: [
        "not_clicking",
        "schedule",
        "no_longer_interested",
        "felt_uncomfortable",
        "other",
      ],
      circle_stage: ["introduced", "met_once", "met_again", "regular"],
      community_kind: ["major", "campus", "interest"],
      community_standing: ["good", "limited", "restricted", "suspended"],
      data_status: ["verified", "needs_review"],
      hang_again: ["yes", "maybe", "no"],
      karma_kind: [
        "rsvp_kept",
        "no_show",
        "meetup_completed",
        "rsvp_accepted",
        "late_cancellation",
        "plan_organized",
        "consistent_participation",
        "university_verified",
        "identity_verified",
        "confirmed_spam",
        "confirmed_harassment",
        "confirmed_rule_violation",
      ],
      location_category: ["hangout", "gym", "library", "dining"],
      moderation_action_type: [
        "dismiss_report",
        "confirm_violation",
        "confirm_harassment",
        "confirm_spam",
        "restrict_account",
        "suspend_account",
        "restore_account",
      ],
      report_category: [
        "harassment",
        "spam",
        "threatening_behavior",
        "hate_discrimination",
        "unsafe_behavior",
        "fake_account",
        "inappropriate_content",
        "other",
      ],
      report_status: [
        "open",
        "reviewing",
        "resolved",
        "dismissed",
        "confirmed",
      ],
      rsvp_status: ["pending", "in", "cant"],
      verification_method: ["edu_email", "identity_provider"],
      verification_status: ["unverified", "pending", "verified", "failed"],
      year_level: ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"],
    },
  },
} as const

// Helper aliases for Path 1. Do not export `Interest` from this file —
// Path 2 uses that name as a union in src/lib/types.ts.

export type YearLevel = Database["public"]["Enums"]["year_level"];
export type LocationCategory = Database["public"]["Enums"]["location_category"];
export type AvailabilityWindow = Database["public"]["Enums"]["availability_window"];
export type DataStatus = Database["public"]["Enums"]["data_status"];
export type CircleStage = Database["public"]["Enums"]["circle_stage"];
export type CommunityKind = Database["public"]["Enums"]["community_kind"];
export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type KarmaKind = Database["public"]["Enums"]["karma_kind"];
export type VerificationMethod = Database["public"]["Enums"]["verification_method"];
export type VerificationStatus = Database["public"]["Enums"]["verification_status"];
export type ReportCategory = Database["public"]["Enums"]["report_category"];
export type CommunityStanding = Database["public"]["Enums"]["community_standing"];
export type CircleLeaveReason = Database["public"]["Enums"]["circle_leave_reason"];
export type ModerationActionType = Database["public"]["Enums"]["moderation_action_type"];
export type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

export interface ProfileVisibility {
  last_name: boolean;
  year: boolean;
  major: boolean;
  residence: boolean;
  hometown: boolean;
  bio: boolean;
}

export const DEFAULT_VISIBILITY: ProfileVisibility = {
  last_name: false,
  year: true,
  major: true,
  residence: false,
  hometown: false,
  bio: false,
};

export type University = Database["public"]["Tables"]["universities"]["Row"];
export type Major = Database["public"]["Tables"]["majors"]["Row"];
export type ResidenceHall = Database["public"]["Tables"]["residence_halls"]["Row"];
export type CampusLocation = Database["public"]["Tables"]["campus_locations"]["Row"];
export type InterestRow = Database["public"]["Tables"]["interests"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type Profile = Omit<ProfileRow, "visibility" | "email"> & {
  visibility: ProfileVisibility;
};
export type UserAvailability = Database["public"]["Tables"]["user_availability"]["Row"];
export type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];
