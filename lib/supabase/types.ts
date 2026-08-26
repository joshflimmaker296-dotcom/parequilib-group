export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          role: "buyer" | "admin";
          stripe_account_id: string | null;
          stripe_onboarded: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          role?: "buyer" | "admin";
          stripe_account_id?: string | null;
          stripe_onboarded?: boolean;
        };
        Update: {
          name?: string;
          avatar_url?: string | null;
          role?: "buyer" | "admin";
          stripe_account_id?: string | null;
          stripe_onboarded?: boolean;
        };
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string;
          price: number;
          category: string;
          image_url: string | null;
          ai_generated: boolean;
          status: "active" | "sold" | "removed";
          created_at: string;
        };
        Insert: {
          seller_id: string;
          title: string;
          description: string;
          price: number;
          category: string;
          image_url?: string | null;
          ai_generated?: boolean;
          status?: "active" | "sold" | "removed";
        };
        Update: {
          title?: string;
          description?: string;
          price?: number;
          category?: string;
          image_url?: string | null;
          status?: "active" | "sold" | "removed";
        };
      };
      messages: {
        Row: {
          id: string;
          listing_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          listing_id: string;
          sender_id: string;
          body: string;
        };
        Update: Record<string, never>;
      };
      offers: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          amount: number;
          status: "pending" | "accepted" | "declined";
          created_at: string;
        };
        Insert: {
          listing_id: string;
          buyer_id: string;
          amount: number;
          status?: "pending" | "accepted" | "declined";
        };
        Update: {
          status?: "pending" | "accepted" | "declined";
        };
      };
      orders: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          platform_fee: number;
          stripe_session_id: string;
          status: "pending" | "paid" | "refunded";
          created_at: string;
        };
        Insert: {
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          platform_fee: number;
          stripe_session_id: string;
          status?: "pending" | "paid" | "refunded";
        };
        Update: {
          status?: "pending" | "paid" | "refunded";
        };
      };
    };
  };
};
