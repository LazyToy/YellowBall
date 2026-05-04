export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole = 'super_admin' | 'admin' | 'user';
export type ProfileStatus = 'active' | 'suspended' | 'deleted_pending';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate =
  Database['public']['Tables']['profiles']['Update'];
export type NotificationPreference =
  Database['public']['Tables']['notification_preferences']['Row'];
export type NotificationPreferenceUpdate =
  Database['public']['Tables']['notification_preferences']['Update'];
export type Address = Database['public']['Tables']['addresses']['Row'];
export type AddressInsert =
  Database['public']['Tables']['addresses']['Insert'];
export type AddressUpdate =
  Database['public']['Tables']['addresses']['Update'];
export type UserRacket = Database['public']['Tables']['user_rackets']['Row'];
export type UserRacketInsert =
  Database['public']['Tables']['user_rackets']['Insert'];
export type UserRacketUpdate =
  Database['public']['Tables']['user_rackets']['Update'];
export type AdminPermission =
  Database['public']['Tables']['admin_permissions']['Row'];
export type AppSetting = Database['public']['Tables']['app_settings']['Row'];
export type AppNotification =
  Database['public']['Tables']['notifications']['Row'];
export type AppNotificationUpdate =
  Database['public']['Tables']['notifications']['Update'];
export type BookingStatusLog =
  Database['public']['Tables']['booking_status_logs']['Row'];
export type BookingStatusLogInsert =
  Database['public']['Tables']['booking_status_logs']['Insert'];
export type AdministratorAuditLog =
  Database['public']['Tables']['administrator_audit_logs']['Row'];
export type AdministratorAuditLogInsert =
  Database['public']['Tables']['administrator_audit_logs']['Insert'];
export type StringCatalogItem =
  Database['public']['Tables']['string_catalog']['Row'];
export type StringCatalogInsert =
  Database['public']['Tables']['string_catalog']['Insert'];
export type StringCatalogUpdate =
  Database['public']['Tables']['string_catalog']['Update'];
export type UserStringSetup =
  Database['public']['Tables']['user_string_setups']['Row'];
export type UserStringSetupInsert =
  Database['public']['Tables']['user_string_setups']['Insert'];
export type UserStringSetupUpdate =
  Database['public']['Tables']['user_string_setups']['Update'];
export type DemoRacket = Database['public']['Tables']['demo_rackets']['Row'];
export type DemoRacketInsert =
  Database['public']['Tables']['demo_rackets']['Insert'];
export type DemoRacketUpdate =
  Database['public']['Tables']['demo_rackets']['Update'];
export type DemoRacketStatus =
  | 'active'
  | 'inactive'
  | 'maintenance'
  | 'damaged'
  | 'sold'
  | 'hidden';
export type BookingSlot =
  Database['public']['Tables']['booking_slots']['Row'];
export type BookingSlotInsert =
  Database['public']['Tables']['booking_slots']['Insert'];
export type BookingSlotUpdate =
  Database['public']['Tables']['booking_slots']['Update'];
export type BookingServiceType = 'stringing' | 'demo';
export type ServiceBooking =
  Database['public']['Tables']['service_bookings']['Row'];
export type ServiceBookingInsert =
  Database['public']['Tables']['service_bookings']['Insert'];
export type ServiceBookingUpdate =
  Database['public']['Tables']['service_bookings']['Update'];
export type ServiceBookingStatus =
  | 'requested'
  | 'approved'
  | 'visit_pending'
  | 'racket_received'
  | 'in_progress'
  | 'completed'
  | 'pickup_ready'
  | 'delivered'
  | 'done'
  | 'cancelled_user'
  | 'cancelled_admin'
  | 'rejected'
  | 'reschedule_requested'
  | 'no_show'
  | 'refund_pending'
  | 'refund_done';
export type ServiceDeliveryMethod = 'store_pickup' | 'local_quick' | 'parcel';
export type DemoBooking =
  Database['public']['Tables']['demo_bookings']['Row'];
export type DemoBookingInsert =
  Database['public']['Tables']['demo_bookings']['Insert'];
export type DemoBookingUpdate =
  Database['public']['Tables']['demo_bookings']['Update'];
export type DemoBookingStatus =
  | 'requested'
  | 'approved'
  | 'in_use'
  | 'returned'
  | 'cancelled_user'
  | 'cancelled_admin'
  | 'rejected'
  | 'no_show'
  | 'overdue';
export type BookingStatusLogType = 'service' | 'demo';
export type RacketConditionCheck =
  Database['public']['Tables']['racket_condition_checks']['Row'];
export type RacketConditionCheckInsert =
  Database['public']['Tables']['racket_condition_checks']['Insert'];
export type RacketConditionCheckUpdate =
  Database['public']['Tables']['racket_condition_checks']['Update'];
export type RacketConditionCheckType = 'before_rental' | 'after_return';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          nickname: string;
          phone: string;
          role: ProfileRole;
          status: ProfileStatus;
          expo_push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          nickname: string;
          phone: string;
          role?: ProfileRole;
          status?: ProfileStatus;
          expo_push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          nickname?: string;
          phone?: string;
          role?: ProfileRole;
          status?: ProfileStatus;
          expo_push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          booking_notifications: boolean;
          delivery_notifications: boolean;
          string_life_notifications: boolean;
          marketing_notifications: boolean;
          quiet_hours_enabled: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
        };
        Insert: {
          user_id: string;
          booking_notifications?: boolean;
          delivery_notifications?: boolean;
          string_life_notifications?: boolean;
          marketing_notifications?: boolean;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
        };
        Update: {
          user_id?: string;
          booking_notifications?: boolean;
          delivery_notifications?: boolean;
          string_life_notifications?: boolean;
          marketing_notifications?: boolean;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          recipient_name: string;
          phone: string;
          postal_code: string | null;
          address_line1: string;
          address_line2: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipient_name: string;
          phone: string;
          postal_code?: string | null;
          address_line1: string;
          address_line2?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipient_name?: string;
          phone?: string;
          postal_code?: string | null;
          address_line1?: string;
          address_line2?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'addresses_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_rackets: {
        Row: {
          id: string;
          owner_id: string;
          brand: string;
          model: string;
          grip_size: string | null;
          weight: number | null;
          balance: string | null;
          photo_url: string | null;
          is_primary: boolean;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          brand: string;
          model: string;
          grip_size?: string | null;
          weight?: number | null;
          balance?: string | null;
          photo_url?: string | null;
          is_primary?: boolean;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          brand?: string;
          model?: string;
          grip_size?: string | null;
          weight?: number | null;
          balance?: string | null;
          photo_url?: string | null;
          is_primary?: boolean;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_rackets_owner_id_fkey';
            columns: ['owner_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      admin_permissions: {
        Row: {
          admin_id: string;
          can_manage_strings: boolean;
          can_manage_demo_rackets: boolean;
          can_manage_bookings: boolean;
          can_ban_users: boolean;
          can_manage_products: boolean;
          can_manage_orders: boolean;
          can_post_notice: boolean;
          can_toggle_app_menu: boolean;
          can_manage_admins: boolean;
        };
        Insert: {
          admin_id: string;
          can_manage_strings?: boolean;
          can_manage_demo_rackets?: boolean;
          can_manage_bookings?: boolean;
          can_ban_users?: boolean;
          can_manage_products?: boolean;
          can_manage_orders?: boolean;
          can_post_notice?: boolean;
          can_toggle_app_menu?: boolean;
          can_manage_admins?: boolean;
        };
        Update: {
          admin_id?: string;
          can_manage_strings?: boolean;
          can_manage_demo_rackets?: boolean;
          can_manage_bookings?: boolean;
          can_ban_users?: boolean;
          can_manage_products?: boolean;
          can_manage_orders?: boolean;
          can_post_notice?: boolean;
          can_toggle_app_menu?: boolean;
          can_manage_admins?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_permissions_admin_id_fkey';
            columns: ['admin_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      app_settings: {
        Row: {
          key: string;
          value: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'app_settings_updated_by_fkey';
            columns: ['updated_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          notification_type: string | null;
          data: Json | null;
          read: boolean;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          notification_type?: string | null;
          data?: Json | null;
          read?: boolean;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          notification_type?: string | null;
          data?: Json | null;
          read?: boolean;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      booking_status_logs: {
        Row: {
          id: string;
          booking_type: BookingStatusLogType;
          booking_id: string;
          previous_status: string | null;
          new_status: string;
          changed_by: string | null;
          reason: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          booking_type: BookingStatusLogType;
          booking_id: string;
          previous_status?: string | null;
          new_status: string;
          changed_by?: string | null;
          reason?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          booking_type?: BookingStatusLogType;
          booking_id?: string;
          previous_status?: string | null;
          new_status?: string;
          changed_by?: string | null;
          reason?: string | null;
          changed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'booking_status_logs_changed_by_fkey';
            columns: ['changed_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      administrator_audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_table: string | null;
          target_id: string | null;
          before_value: Json | null;
          after_value: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          target_table?: string | null;
          target_id?: string | null;
          before_value?: Json | null;
          after_value?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          target_table?: string | null;
          target_id?: string | null;
          before_value?: Json | null;
          after_value?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'administrator_audit_logs_actor_id_fkey';
            columns: ['actor_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      string_catalog: {
        Row: {
          id: string;
          brand: string;
          name: string;
          gauge: string | null;
          color: string | null;
          image_url: string | null;
          description: string | null;
          price: number | null;
          recommended_style: string | null;
          is_active: boolean;
          deactivation_reason: string | null;
          deactivated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand: string;
          name: string;
          gauge?: string | null;
          color?: string | null;
          image_url?: string | null;
          description?: string | null;
          price?: number | null;
          recommended_style?: string | null;
          is_active?: boolean;
          deactivation_reason?: string | null;
          deactivated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand?: string;
          name?: string;
          gauge?: string | null;
          color?: string | null;
          image_url?: string | null;
          description?: string | null;
          price?: number | null;
          recommended_style?: string | null;
          is_active?: boolean;
          deactivation_reason?: string | null;
          deactivated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_string_setups: {
        Row: {
          id: string;
          user_id: string;
          racket_id: string;
          main_string_id: string;
          cross_string_id: string;
          tension_main: number;
          tension_cross: number;
          is_hybrid: boolean;
          memo: string | null;
          last_strung_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          racket_id: string;
          main_string_id: string;
          cross_string_id: string;
          tension_main: number;
          tension_cross: number;
          is_hybrid?: boolean;
          memo?: string | null;
          last_strung_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          racket_id?: string;
          main_string_id?: string;
          cross_string_id?: string;
          tension_main?: number;
          tension_cross?: number;
          is_hybrid?: boolean;
          memo?: string | null;
          last_strung_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_string_setups_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_string_setups_racket_id_fkey';
            columns: ['racket_id'];
            referencedRelation: 'user_rackets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_string_setups_main_string_id_fkey';
            columns: ['main_string_id'];
            referencedRelation: 'string_catalog';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_string_setups_cross_string_id_fkey';
            columns: ['cross_string_id'];
            referencedRelation: 'string_catalog';
            referencedColumns: ['id'];
          },
        ];
      };
      demo_rackets: {
        Row: {
          id: string;
          brand: string;
          model: string;
          grip_size: string | null;
          weight: number | null;
          head_size: string | null;
          photo_url: string | null;
          description: string | null;
          status: DemoRacketStatus;
          is_demo_enabled: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand: string;
          model: string;
          grip_size?: string | null;
          weight?: number | null;
          head_size?: string | null;
          photo_url?: string | null;
          description?: string | null;
          status?: DemoRacketStatus;
          is_demo_enabled?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand?: string;
          model?: string;
          grip_size?: string | null;
          weight?: number | null;
          head_size?: string | null;
          photo_url?: string | null;
          description?: string | null;
          status?: DemoRacketStatus;
          is_demo_enabled?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_slots: {
        Row: {
          id: string;
          service_type: BookingServiceType;
          start_time: string;
          end_time: string;
          capacity: number;
          reserved_count: number;
          is_blocked: boolean;
          block_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_type: BookingServiceType;
          start_time: string;
          end_time: string;
          capacity?: number;
          reserved_count?: number;
          is_blocked?: boolean;
          block_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_type?: BookingServiceType;
          start_time?: string;
          end_time?: string;
          capacity?: number;
          reserved_count?: number;
          is_blocked?: boolean;
          block_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_bookings: {
        Row: {
          id: string;
          user_id: string;
          racket_id: string;
          main_string_id: string;
          cross_string_id: string;
          tension_main: number;
          tension_cross: number;
          slot_id: string;
          delivery_method: ServiceDeliveryMethod;
          address_id: string | null;
          status: ServiceBookingStatus;
          user_notes: string | null;
          admin_notes: string | null;
          no_show_counted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          racket_id: string;
          main_string_id: string;
          cross_string_id: string;
          tension_main: number;
          tension_cross: number;
          slot_id: string;
          delivery_method: ServiceDeliveryMethod;
          address_id?: string | null;
          status?: ServiceBookingStatus;
          user_notes?: string | null;
          admin_notes?: string | null;
          no_show_counted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          racket_id?: string;
          main_string_id?: string;
          cross_string_id?: string;
          tension_main?: number;
          tension_cross?: number;
          slot_id?: string;
          delivery_method?: ServiceDeliveryMethod;
          address_id?: string | null;
          status?: ServiceBookingStatus;
          user_notes?: string | null;
          admin_notes?: string | null;
          no_show_counted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'service_bookings_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_bookings_racket_id_fkey';
            columns: ['racket_id'];
            referencedRelation: 'user_rackets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_bookings_main_string_id_fkey';
            columns: ['main_string_id'];
            referencedRelation: 'string_catalog';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_bookings_cross_string_id_fkey';
            columns: ['cross_string_id'];
            referencedRelation: 'string_catalog';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_bookings_slot_id_fkey';
            columns: ['slot_id'];
            referencedRelation: 'booking_slots';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_bookings_address_id_fkey';
            columns: ['address_id'];
            referencedRelation: 'addresses';
            referencedColumns: ['id'];
          },
        ];
      };
      demo_bookings: {
        Row: {
          id: string;
          user_id: string;
          demo_racket_id: string;
          slot_id: string;
          start_time: string;
          expected_return_time: string;
          actual_return_time: string | null;
          status: DemoBookingStatus;
          user_notes: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          demo_racket_id: string;
          slot_id: string;
          start_time: string;
          expected_return_time: string;
          actual_return_time?: string | null;
          status?: DemoBookingStatus;
          user_notes?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          demo_racket_id?: string;
          slot_id?: string;
          start_time?: string;
          expected_return_time?: string;
          actual_return_time?: string | null;
          status?: DemoBookingStatus;
          user_notes?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'demo_bookings_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'demo_bookings_demo_racket_id_fkey';
            columns: ['demo_racket_id'];
            referencedRelation: 'demo_rackets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'demo_bookings_slot_id_fkey';
            columns: ['slot_id'];
            referencedRelation: 'booking_slots';
            referencedColumns: ['id'];
          },
        ];
      };
      racket_condition_checks: {
        Row: {
          id: string;
          demo_booking_id: string;
          check_type: RacketConditionCheckType;
          photo_urls: string[];
          scratch_notes: string | null;
          string_condition: string | null;
          grip_condition: string | null;
          damage_detected: boolean;
          deposit_deduction: number;
          checked_by: string;
          checked_at: string;
        };
        Insert: {
          id?: string;
          demo_booking_id: string;
          check_type: RacketConditionCheckType;
          photo_urls?: string[];
          scratch_notes?: string | null;
          string_condition?: string | null;
          grip_condition?: string | null;
          damage_detected?: boolean;
          deposit_deduction?: number;
          checked_by: string;
          checked_at?: string;
        };
        Update: {
          id?: string;
          demo_booking_id?: string;
          check_type?: RacketConditionCheckType;
          photo_urls?: string[];
          scratch_notes?: string | null;
          string_condition?: string | null;
          grip_condition?: string | null;
          damage_detected?: boolean;
          deposit_deduction?: number;
          checked_by?: string;
          checked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'racket_condition_checks_demo_booking_id_fkey';
            columns: ['demo_booking_id'];
            referencedRelation: 'demo_bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'racket_condition_checks_checked_by_fkey';
            columns: ['checked_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_service_booking_transaction: {
        Args: {
          p_user_id: string;
          p_racket_id: string;
          p_main_string_id: string;
          p_cross_string_id: string;
          p_tension_main: number;
          p_tension_cross: number;
          p_slot_id: string;
          p_delivery_method: ServiceDeliveryMethod;
          p_address_id: string | null;
          p_user_notes: string | null;
        };
        Returns: ServiceBooking;
      };
      create_demo_booking_transaction: {
        Args: {
          p_user_id: string;
          p_demo_racket_id: string;
          p_slot_id: string;
          p_start_time: string;
          p_expected_return_time: string;
          p_user_notes: string | null;
        };
        Returns: DemoBooking;
      };
      admin_update_service_booking_status: {
        Args: {
          p_booking_id: string;
          p_admin_id: string;
          p_new_status: ServiceBookingStatus;
          p_reason: string | null;
        };
        Returns: ServiceBooking;
      };
      admin_update_demo_booking_status: {
        Args: {
          p_booking_id: string;
          p_admin_id: string;
          p_new_status: DemoBookingStatus;
          p_reason: string | null;
          p_actual_return_time: string | null;
        };
        Returns: DemoBooking;
      };
      user_cancel_service_booking: {
        Args: {
          p_booking_id: string;
          p_user_id: string;
        };
        Returns: ServiceBooking;
      };
      record_service_booking_no_show: {
        Args: {
          p_booking_id: string;
          p_admin_id: string;
        };
        Returns: ServiceBooking;
      };
      request_profile_account_deletion: {
        Args: {
          p_user_id: string;
        };
        Returns: Profile;
      };
      update_profile_push_token: {
        Args: {
          p_user_id: string;
          p_expo_push_token: string | null;
        };
        Returns: Profile;
      };
      admin_set_profile_role: {
        Args: {
          p_actor_id: string;
          p_target_id: string;
          p_role: ProfileRole;
        };
        Returns: Profile;
      };
      admin_set_profile_status: {
        Args: {
          p_actor_id: string;
          p_target_id: string;
          p_status: ProfileStatus;
        };
        Returns: Profile;
      };
      admin_suspend_user_transaction: {
        Args: {
          p_actor_id: string;
          p_target_id: string;
          p_reason: string | null;
        };
        Returns: Profile;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
