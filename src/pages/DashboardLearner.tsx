import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PrimaryNav, TopBar } from '../components/LayoutPieces';
import { Sidebar } from '../components/Sidebars';
import { uiStore } from '../data/uiStore';
import { api } from '../utils/api';
// Removed unused import: import { readJson } from '../utils/storage';

// Defined types based on your API spec
interface Lesson {
  _id: string;
  title: string;
  category: string;
}

interface Quiz {
  _id: string;
  title: string;
  lesson: string; // This should likely be lessonId: string
}

// Define a type for user data to safely access properties
interface UserData {
  name?: string;
  completedLessons?: string[]; // Assuming these are arrays of lesson IDs
  completedQuizzes?: string[]; // Assuming these are arrays of quiz IDs
  // Add other user properties if known
}

export default function DashboardLearner() {
  // State for fetched data
  const [lessons, setLessons] = useState<Array<Lesson>>([]);
  const [quizzes, setQuizzes] = useState<Array<Quiz>>([]);
  const [userData, setUserData] = useState<UserData | null>(null); // Changed from unknown to UserData | null for safer access
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // useEffect hook for fetching data
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Use the corrected API functions
        const [lessonsRes, quizzesRes, userRes] = await Promise.all([
          api.lessons.list(),     // GET /lessons
          api.quizzes.list(),     // GET /quizzes
          api.auth.me()           // GET /auth/me
        ]);

        if (isMounted) {
          setLessons(lessonsRes.data.lessons || []);
          setQuizzes(quizzesRes.data.quizzes || []);
          // Ensure user data is set correctly, casting if necessary or relying on API response structure
          setUserData(userRes.data.user || null); 
          setError(''); // Clear any previous errors
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Dashboard data fetch error:', err);
          setError(err?.message || 'Failed to load dashboard data.'); // Set error for user feedback
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => { isMounted = false; };
  }, []);

  // Derived stats from fetched data
  const totalLessons = lessons.length;
  const totalQuizzes = quizzes.length;
  
  // Safely calculate user-specific progress
  const completedLessonsCount = userData?.completedLessons?.length || 0;
  const completedQuizzesCount = userData?.completedQuizzes?.length || 0;
  
  // Calculate progress percentage
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
  const successRate = totalQuizzes > 0 ? Math.round((completedQuizzesCount / totalQuizzes) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f5f8ff] text-slate-800">
      <TopBar />
      <PrimaryNav
        variant="dashboard"
        items={[
          { label: 'Home', to: '/' },
          { label: 'Lessons', to: '/lesson' },
          { label: 'Quiz', to: '/quiz' }
        ]}
      />

      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[260px_1fr] gap-8">
          <Sidebar
            title="Learner"
            links={[
              { label: 'Overview', active: true },
              { label: 'My Lessons', to: '/lesson' },
              { label: 'My Quizzes', to: '/quiz' },
              { label: 'Logout', to: '/login' }
            ]}
          />

          <div className="animate-fadeInUp">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <p className="text-primary uppercase font-semibold tracking-wider">Dashboard</p>
                <h1 className="text-4xl font-extrabold gradient-text">Learner Overview</h1>
                <p className="text-gray-600 mt-2">Continue where you left off.</p>
              </div>
              <div className="flex gap-3">
                <Link to="/lesson" className="bg-primary text-white px-5 py-2 rounded-md font-semibold hover:bg-blue-700 transition-all duration-300">
                  Resume Lesson
                </Link>
                <Link
                  to="/quiz"
                  className="border-2 border-primary text-primary px-5 py-2 rounded-md font-semibold hover:bg-primary hover:text-white transition-all duration-300"
                >
                  Take Quiz
                </Link>
              </div>
            </div>

            {error && <p className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 border border-red-100">{error}</p>}

            {/* Stats Grid - Using derived stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg hover-lift">
                <p className="text-sm text-gray-500">Lessons Available</p>
                <h3 className="text-3xl font-bold mt-2">{totalLessons}</h3> {/* Corrected from lessonCount */}
                <p className="text-xs text-gray-500 mt-2">{uiStore.statsNotes.lessons}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg hover-lift">
                <p className="text-sm text-gray-500">My Progress</p>
                <h3 className="text-3xl font-bold mt-2">{progressPercentage}%</h3> {/* Correctly using progressPercentage */}
                <p className="text-xs text-gray-500 mt-2">{completedLessonsCount} of {totalLessons} completed</p> {/* Correctly using derived counts */}
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg hover-lift">
                <p className="text-sm text-gray-500">Quizzes Passed</p>
                <h3 className="text-3xl font-bold mt-2">{completedQuizzesCount}</h3> {/* Corrected from completedQuizzes */}
                <p className="text-xs text-gray-500 mt-2">Verified by server</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg hover-lift">
                <p className="text-sm text-gray-500">Success Rate</p>
                <h3 className="text-3xl font-bold mt-2">{successRate}%</h3> {/* Correctly using successRate */}
                <p className="text-xs text-gray-500 mt-2">Overall completion</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mt-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4">Continue Learning</h3>
                <div className="grid gap-3 text-sm">
                  {uiStore.learner.continueLessons.length ? (
                    uiStore.learner.continueLessons.slice(0, 3).map((lesson) => (
                      <div key={lesson.title} className="flex items-center justify-between">
                        <span>{lesson.title}</span>
                        <Link to="/lesson" className="text-primary font-semibold">
                          Open
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No lesson data available.</p>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4">Upcoming Quizzes</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  {uiStore.learner.upcomingQuizzes.length ? (
                    uiStore.learner.upcomingQuizzes.slice(0, 3).map((quiz) => (
                      <li key={`${quiz.module}-${quiz.title}`}>{`${quiz.module}: ${quiz.title}`}</li>
                    ))
                  ) : (
                    <li>No quiz data available.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <p className="text-sm text-gray-500">Total Quizzes</p>
                <h3 className="text-3xl font-bold mt-2">{totalQuizzes}</h3> {/* Corrected from quizCount */}
                <p className="text-xs text-gray-500 mt-2">From /quizzes</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <p className="text-sm text-gray-500">Next Step</p>
                <h3 className="text-xl font-bold mt-2">Continue a lesson or take a quiz</h3>
                <p className="text-xs text-gray-500 mt-2">Your progress is saved locally.</p>
              </div>
            </div>
            <div className="mb-8">
              <p className="text-primary uppercase font-semibold tracking-wider text-sm">Real-time Stats</p>
              <h1 className="text-4xl font-extrabold gradient-text">Welcome back, {userData?.name || 'Learner'}</h1> {/* Safely access name */}
            </div>

            {error && <p className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 border border-red-100">{error}</p>}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-gray-600">Loading your data...</span>
              </div>
            ) : (
              <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Lessons" value={totalLessons} note="Available in catalog" />
              <StatCard title="My Progress" value={progressPercentage} note={`${completedLessonsCount} of ${totalLessons} completed`} noteColor="text-green-600" />
              <StatCard title="Quizzes Passed" value={completedQuizzesCount} note="Verified by server" />
              <StatCard title="Success Rate" value={`${successRate}%`} note="Overall completion" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mt-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4">Latest Lessons</h3>
                <div className="space-y-4">
                  {lessons.slice(0, 4).map((lesson) => (
                    <div key={lesson._id} className="flex items-center justify-between border-b border-gray-50 pb-2">
                      <div>
                        <p className="text-sm font-medium">{lesson.title}</p>
                        <p className="text-xs text-gray-400">{lesson.category}</p>
                      </div>
                      <Link to={`/lesson/${lesson._id}`} className="text-primary text-sm font-semibold hover:underline">Start</Link>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4">Available Quizzes</h3>
                <div className="space-y-4">
                  {quizzes.slice(0, 4).map((quiz) => (
                    <div key={quiz._id} className="flex items-center justify-between border-b border-gray-50 pb-2">
                      <span className="text-sm font-medium">{quiz.title}</span>
                      <Link to={`/quiz/${quiz._id}`} className="bg-blue-50 text-primary px-3 py-1 rounded text-xs font-bold hover:bg-primary hover:text-white transition">Take Quiz</Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  note: string;
  noteColor?: string;
}

function StatCard({ title, value, note, noteColor = "text-gray-500" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-3xl font-bold mt-2">{value}</h3>
      <p className={`text-xs mt-2 ${noteColor}`}>{note}</p>
    </div>
  );
}