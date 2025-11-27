export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface OptimisticUpdate<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  timestamp: number;
  confidence: number;
  rollbackData?: T;
}

export interface UIState {
  isOptimistic: boolean;
  confidence: number;
  errorProbability: number;
  userPattern?: string;
}

export interface UserBehaviorPattern {
  userId: string;
  successRate: number;
  averageResponseTime: number;
  commonErrors: string[];
  preferredFeedbackStyle: 'minimal' | 'detailed' | 'animated';
}