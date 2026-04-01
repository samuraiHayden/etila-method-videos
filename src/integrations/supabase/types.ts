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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          preferred_date: string
          preferred_time: string
          status: string
          timezone: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          preferred_date: string
          preferred_time: string
          status?: string
          timezone?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          preferred_date?: string
          preferred_time?: string
          status?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_responses: {
        Row: {
          id: string
          responses: Json
          submitted_at: string
          template_id: string
          user_id: string
        }
        Insert: {
          id?: string
          responses?: Json
          submitted_at?: string
          template_id: string
          user_id: string
        }
        Update: {
          id?: string
          responses?: Json
          submitted_at?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_responses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checkin_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          questions: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          questions?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          questions?: Json
        }
        Relationships: []
      }
      consent_logs: {
        Row: {
          consented_liability: boolean
          consented_tos: boolean
          created_at: string
          email: string
          id: string
          ip_address: string | null
        }
        Insert: {
          consented_liability?: boolean
          consented_tos?: boolean
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          consented_liability?: boolean
          consented_tos?: boolean
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          drip_week: number | null
          id: string
          order_index: number
          title: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          drip_week?: number | null
          id?: string
          order_index?: number
          title: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          drip_week?: number | null
          id?: string
          order_index?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          drip_enabled: boolean
          id: string
          is_published: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          drip_enabled?: boolean
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          drip_enabled?: boolean
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_workflow_steps: {
        Row: {
          created_at: string
          delay_hours: number
          email_number: number
          html_body: string
          id: string
          is_active: boolean
          subject: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          delay_hours?: number
          email_number: number
          html_body: string
          id?: string
          is_active?: boolean
          subject: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          delay_hours?: number
          email_number?: number
          html_body?: string
          id?: string
          is_active?: boolean
          subject?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "email_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      email_workflows: {
        Row: {
          cancel_conditions: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sequence_type: string
          trigger_conditions: Json
          trigger_event: string
          updated_at: string
        }
        Insert: {
          cancel_conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sequence_type: string
          trigger_conditions?: Json
          trigger_event?: string
          updated_at?: string
        }
        Update: {
          cancel_conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sequence_type?: string
          trigger_conditions?: Json
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          coaching_tips: string | null
          created_at: string
          created_by: string | null
          equipment: string[] | null
          id: string
          level: string | null
          muscle_groups: string[] | null
          name: string
          updated_at: string
          video_url: string | null
          written_cues: string | null
        }
        Insert: {
          coaching_tips?: string | null
          created_at?: string
          created_by?: string | null
          equipment?: string[] | null
          id?: string
          level?: string | null
          muscle_groups?: string[] | null
          name: string
          updated_at?: string
          video_url?: string | null
          written_cues?: string | null
        }
        Update: {
          coaching_tips?: string | null
          created_at?: string
          created_by?: string | null
          equipment?: string[] | null
          id?: string
          level?: string | null
          muscle_groups?: string[] | null
          name?: string
          updated_at?: string
          video_url?: string | null
          written_cues?: string | null
        }
        Relationships: []
      }
      food_items: {
        Row: {
          calories: number
          carbs: number
          category: string
          created_at: string
          default_portion_qty: number
          default_portion_unit: string
          fat: number
          id: string
          name: string
          protein: number
        }
        Insert: {
          calories?: number
          carbs?: number
          category: string
          created_at?: string
          default_portion_qty?: number
          default_portion_unit?: string
          fat?: number
          id?: string
          name: string
          protein?: number
        }
        Update: {
          calories?: number
          carbs?: number
          category?: string
          created_at?: string
          default_portion_qty?: number
          default_portion_unit?: string
          fat?: number
          id?: string
          name?: string
          protein?: number
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
        }
        Insert: {
          activity_type?: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          activity_type?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_questionnaire_responses: {
        Row: {
          budget_range: string
          coaching_preference: string
          created_at: string
          experience_level: string
          fitness_goal: string
          gender: string
          id: string
          lead_id: string
          qualification_result: string
          training_frequency: string
        }
        Insert: {
          budget_range: string
          coaching_preference: string
          created_at?: string
          experience_level: string
          fitness_goal: string
          gender?: string
          id?: string
          lead_id: string
          qualification_result?: string
          training_frequency: string
        }
        Update: {
          budget_range?: string
          coaching_preference?: string
          created_at?: string
          experience_level?: string
          fitness_goal?: string
          gender?: string
          id?: string
          lead_id?: string
          qualification_result?: string
          training_frequency?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_questionnaire_responses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          last_contacted_at: string | null
          notes: string | null
          phone_number: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          last_contacted_at?: string | null
          notes?: string | null
          phone_number?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_contacted_at?: string | null
          notes?: string | null
          phone_number?: string | null
          status?: string
        }
        Relationships: []
      }
      lesson_completions: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          duration_minutes: number | null
          id: string
          is_start_here: boolean
          module_id: string
          order_index: number
          title: string
        }
        Insert: {
          content?: string | null
          content_type: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_start_here?: boolean
          module_id: string
          order_index?: number
          title: string
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_start_here?: boolean
          module_id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_items: {
        Row: {
          created_at: string
          custom_ingredients: Json | null
          day_of_week: number
          id: string
          meal_id: string
          meal_plan_id: string
          meal_type: string
          scheduled_time: string | null
          serving_quantity: number | null
          serving_unit: string | null
        }
        Insert: {
          created_at?: string
          custom_ingredients?: Json | null
          day_of_week: number
          id?: string
          meal_id: string
          meal_plan_id: string
          meal_type: string
          scheduled_time?: string | null
          serving_quantity?: number | null
          serving_unit?: string | null
        }
        Update: {
          created_at?: string
          custom_ingredients?: Json | null
          day_of_week?: number
          id?: string
          meal_id?: string
          meal_plan_id?: string
          meal_type?: string
          scheduled_time?: string | null
          serving_quantity?: number | null
          serving_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_items_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          id: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          calories: number | null
          carbs: number | null
          category: string
          created_at: string
          created_by: string | null
          default_ingredients: Json | null
          description: string | null
          fat: number | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          instructions: string | null
          name: string
          prep_time_minutes: number | null
          protein: number | null
          updated_at: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          category: string
          created_at?: string
          created_by?: string | null
          default_ingredients?: Json | null
          description?: string | null
          fat?: number | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          instructions?: string | null
          name: string
          prep_time_minutes?: number | null
          protein?: number | null
          updated_at?: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          category?: string
          created_at?: string
          created_by?: string | null
          default_ingredients?: Json | null
          description?: string | null
          fat?: number | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          instructions?: string | null
          name?: string
          prep_time_minutes?: number | null
          protein?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      measurement_logs: {
        Row: {
          body_fat_percentage: number | null
          chest: number | null
          created_at: string
          hips: number | null
          id: string
          left_arm: number | null
          left_thigh: number | null
          logged_at: string
          notes: string | null
          right_arm: number | null
          right_thigh: number | null
          user_id: string
          waist: number | null
          weight: number | null
        }
        Insert: {
          body_fat_percentage?: number | null
          chest?: number | null
          created_at?: string
          hips?: number | null
          id?: string
          left_arm?: number | null
          left_thigh?: number | null
          logged_at?: string
          notes?: string | null
          right_arm?: number | null
          right_thigh?: number | null
          user_id: string
          waist?: number | null
          weight?: number | null
        }
        Update: {
          body_fat_percentage?: number | null
          chest?: number | null
          created_at?: string
          hips?: number | null
          id?: string
          left_arm?: number | null
          left_thigh?: number | null
          logged_at?: string
          notes?: string | null
          right_arm?: number | null
          right_thigh?: number | null
          user_id?: string
          waist?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      message_threads: {
        Row: {
          client_id: string
          coach_id: string | null
          created_at: string
          id: string
          is_archived: boolean
          last_message_at: string | null
          subject: string | null
        }
        Insert: {
          client_id: string
          coach_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          subject?: string | null
        }
        Update: {
          client_id?: string
          coach_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          assigned_coach_id: string | null
          avatar_url: string | null
          created_at: string
          current_weight: string | null
          email: string
          experience_level: string | null
          full_name: string | null
          goal_weight: string | null
          goals: string[] | null
          height: string | null
          id: string
          injuries: string | null
          program_start_date: string | null
          starting_weight: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_coach_id?: string | null
          avatar_url?: string | null
          created_at?: string
          current_weight?: string | null
          email: string
          experience_level?: string | null
          full_name?: string | null
          goal_weight?: string | null
          goals?: string[] | null
          height?: string | null
          id?: string
          injuries?: string | null
          program_start_date?: string | null
          starting_weight?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_coach_id?: string | null
          avatar_url?: string | null
          created_at?: string
          current_weight?: string | null
          email?: string
          experience_level?: string | null
          full_name?: string | null
          goal_weight?: string | null
          goals?: string[] | null
          height?: string | null
          id?: string
          injuries?: string | null
          program_start_date?: string | null
          starting_weight?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      program_days: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          is_rest_day: boolean
          program_id: string
          workout_id: string | null
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          is_rest_day?: boolean
          program_id: string
          workout_id?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          is_rest_day?: boolean
          program_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_days_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_days_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      program_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_weeks: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_weeks?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_weeks?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          photo_type: string | null
          photo_url: string
          taken_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_type?: string | null
          photo_url: string
          taken_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_type?: string | null
          photo_url?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_emails: {
        Row: {
          created_at: string
          email_number: number
          error_message: string | null
          html_body: string
          id: string
          lead_id: string
          send_at: string
          sent_at: string | null
          sequence_type: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email_number: number
          error_message?: string | null
          html_body: string
          id?: string
          lead_id: string
          send_at: string
          sent_at?: string | null
          sequence_type?: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email_number?: number
          error_message?: string | null
          html_body?: string
          id?: string
          lead_id?: string
          send_at?: string
          sent_at?: string | null
          sequence_type?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      set_logs: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          is_pr: boolean | null
          notes: string | null
          reps: number | null
          rpe: number | null
          set_number: number
          weight: number | null
          workout_log_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          is_pr?: boolean | null
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          set_number: number
          weight?: number | null
          workout_log_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          is_pr?: boolean | null
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          set_number?: number
          weight?: number | null
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_day_exercises: {
        Row: {
          created_at: string
          day_of_week: number
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          reps: string
          sets: number
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number
          reps?: string
          sets?: number
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          reps?: string
          sets?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_day_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exercise_overrides: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reps: string | null
          sets: number | null
          updated_at: string
          user_id: string
          workout_exercise_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reps?: string | null
          sets?: number | null
          updated_at?: string
          user_id: string
          workout_exercise_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reps?: string | null
          sets?: number | null
          updated_at?: string
          user_id?: string
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_overrides_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_meals: {
        Row: {
          created_at: string
          id: string
          meal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_meals_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_nutrition_targets: {
        Row: {
          assigned_by: string | null
          calories: number | null
          carbs: number | null
          created_at: string
          fat: number | null
          id: string
          notes: string | null
          protein: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: string
          notes?: string | null
          protein?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: string
          notes?: string | null
          protein?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_program_days: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          is_rest_day: boolean
          user_id: string
          workout_id: string | null
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          is_rest_day?: boolean
          user_id: string
          workout_id?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          is_rest_day?: boolean
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_program_days_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_programs: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          program_id: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          program_id: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          program_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          reps: string
          rest_seconds: number | null
          rpe: number | null
          sets: number
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number
          reps?: string
          rest_seconds?: number | null
          rpe?: number | null
          sets?: number
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          reps?: string
          rest_seconds?: number | null
          rpe?: number | null
          sets?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          rating: number | null
          started_at: string | null
          user_id: string
          workout_date: string
          workout_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          started_at?: string | null
          user_id: string
          workout_date?: string
          workout_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          started_at?: string | null
          user_id?: string
          workout_date?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_assigned_coach_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "coach" | "content_admin" | "client"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["super_admin", "coach", "content_admin", "client"],
    },
  },
} as const
