/**
 * Connect (Step 5 — Student Engagement) types.
 * Features from Shep's Student Engagement app (branch relay-ui): student
 * profiles, AI-matched classmates, club recommendations and messaging.
 */

export interface ConnectProfile {
  name: string;
  major: string;
  gradYear: number;
  /** Up to 5 interests (free text or picked from suggestions). */
  interests: string[];
  goal: string;
}

export interface Peer extends ConnectProfile {
  id: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  tags: string[];
  meetingInfo: string;
  link: string;
}

export interface PeerMatch {
  peer: Peer;
  /** 0–100, how strongly the profiles line up. */
  score: number;
  /** Interests the two students have in common. */
  shared: string[];
  /** One sentence on why they should meet. */
  reason: string;
}

export interface ClubMatch {
  club: Club;
  score: number;
  shared: string[];
  reason: string;
}

export interface ConnectResults {
  matches: PeerMatch[];
  clubs: ClubMatch[];
  /** 'ai' = OpenAI embeddings + written reasons; 'rules' = offline matcher. */
  method: 'ai' | 'rules';
}

export interface ChatMessage {
  from: 'me' | 'them';
  text: string;
  at: number;
}

export interface Conversation {
  peerId: string;
  messages: ChatMessage[];
  unread: number;
}

export interface ConnectState {
  /** The student's edited profile; null = use the one built from their data. */
  profile: ConnectProfile | null;
  conversations: Record<string, Conversation>;
}
