export interface CanvasCourse {
  id: number;
  name: string;
  courseCode: string;
  enrollmentState: string;
  currentGrade?: string;
  currentScore?: number;
}

export interface CanvasAssignment {
  id: number;
  courseId: number;
  courseName: string;
  name: string;
  dueAt: string | null;
  pointsPossible: number;
  submissionTypes: string[];
  submittedAt?: string | null;
  score?: number | null;
  gradeMatchesCurrentSubmission?: boolean;
  htmlUrl: string;
}

export interface CanvasGrade {
  courseId: number;
  courseName: string;
  currentGrade: string;
  currentScore: number;
  finalGrade: string;
  finalScore: number;
}

export interface CanvasData {
  courses: CanvasCourse[];
  assignments: CanvasAssignment[];
  grades: CanvasGrade[];
  fetchedAt: string;
}
