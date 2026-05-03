export interface StudentQuery {
  id: string;
  subject: string;
  topic: string;
  query: string;
  response: string;
  timestamp: number;
}

export interface StudySession {
  id: string;
  subject: string;
  topic: string;
  content: string;
  timestamp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface UserState {
  points: number;
  level: number;
  sessions: StudySession[];
  achievements: Achievement[];
}
