export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      links: {
        Row: {
          id: string;
          user_id: string;
          original_url: string;
          slug: string;
          path_type: "s" | "t" | "p";
          title: string | null;
          description: string | null;
          memo: string | null;
          og_image_url: string | null;
          is_active: boolean;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          original_url: string;
          slug: string;
          path_type?: "s" | "t" | "p";
          title?: string | null;
          description?: string | null;
          memo?: string | null;
          og_image_url?: string | null;
          is_active?: boolean;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["links"]["Insert"]>;
        Relationships: [];
      };
      link_destinations: {
        Row: {
          id: string;
          link_id: string;
          destination_url: string;
          weight: number;
          is_active: boolean;
          clicks_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          link_id: string;
          destination_url: string;
          weight?: number;
          is_active?: boolean;
          clicks_count?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["link_destinations"]["Insert"]>;
        Relationships: [];
      };
      click_events: {
        Row: {
          id: string;
          link_id: string;
          destination_id: string | null;
          clicked_at: string;
          referrer: string | null;
          user_agent: string | null;
          ip_hash: string | null;
          country: string | null;
          device_type: string | null;
          browser: string | null;
          os: string | null;
        };
        Insert: {
          id?: string;
          link_id: string;
          destination_id?: string | null;
          clicked_at?: string;
          referrer?: string | null;
          user_agent?: string | null;
          ip_hash?: string | null;
          country?: string | null;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["click_events"]["Insert"]>;
        Relationships: [];
      };
      labels: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["labels"]["Insert"]>;
        Relationships: [];
      };
      link_labels: {
        Row: {
          link_id: string;
          label_id: string;
        };
        Insert: {
          link_id: string;
          label_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["link_labels"]["Insert"]>;
        Relationships: [];
      };
      landing_pages: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          title: string;
          bio: string | null;
          theme: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          title: string;
          bio?: string | null;
          theme?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["landing_pages"]["Insert"]>;
        Relationships: [];
      };
      landing_page_items: {
        Row: {
          id: string;
          landing_page_id: string;
          type: string;
          title: string;
          url: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          landing_page_id: string;
          type: string;
          title: string;
          url?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["landing_page_items"]["Insert"]>;
        Relationships: [];
      };
    };
    Functions: {
      increment_destination_clicks: {
        Args: { destination_uuid: string };
        Returns: undefined;
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Link = Database["public"]["Tables"]["links"]["Row"];
export type LinkDestination = Database["public"]["Tables"]["link_destinations"]["Row"];
export type ClickEvent = Database["public"]["Tables"]["click_events"]["Row"];
export type Label = Database["public"]["Tables"]["labels"]["Row"];
export type LandingPage = Database["public"]["Tables"]["landing_pages"]["Row"];
export type LandingPageItem = Database["public"]["Tables"]["landing_page_items"]["Row"];
