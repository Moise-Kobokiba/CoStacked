import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../features/projects/projectsSlice';
import { fetchUsers } from '../features/users/usersSlice';

// Import components
import { Button } from '../components/shared/Button';
import { ProjectCard } from '../components/shared/ProjectCard';
import { UserCard } from '../components/shared/UserCard';
import { Carousel } from '../components/shared/Carousel';
import { Lightbulb, Users, ShieldCheck, ArrowRight } from 'lucide-react';

// NOTE: I removed the import styles from './HomePage.module.css'

const features = [
  { icon: Lightbulb, title: '1. Share Your Vision', description: 'Founders post structured project listings that include required skills, expected commitment, compensation type, and project stage.' },
  { icon: Users, title: '2. Discover Your Match', description: 'Developers browse open projects and apply directly, while founders filter collaborators by skills, availability, and experience.' },
  { icon: ShieldCheck, title: '3. Collaborate & Build', description: 'Once connected, teams collaborate independently using their own tools, with CoStacked acting as the discovery and trust layer.' },
];

export const HomePage = () => {
  const dispatch = useDispatch();
  
  const { token } = useSelector((state) => state.auth);
  const isLoggedIn = !!token;

  const { items: allProjects = [] } = useSelector((state) => state.projects || {});
  const { items: allUsers = [] } = useSelector((state) => state.users || {});

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchProjects());
      dispatch(fetchUsers());
    }
  }, [dispatch, isLoggedIn]);

  const { featuredProjects, latestProjects, featuredUsers, latestUsers } = useMemo(() => {
    if (!isLoggedIn) return { featuredProjects: [], latestProjects: [], featuredUsers: [], latestUsers: [] };
    const now = new Date();
    const sortedProjects = [...allProjects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const fProjects = sortedProjects.filter(p => p.isBoosted && new Date(p.boostExpiresAt) > now);
    const lProjects = sortedProjects.filter(p => !p.isBoosted || new Date(p.boostExpiresAt) <= now).slice(0, 4);
    const sortedUsers = [...allUsers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const fUsers = sortedUsers.filter(u => u.isBoosted && new Date(u.boostExpiresAt) > now);
    const lUsers = sortedUsers.filter(u => !u.isBoosted || new Date(u.boostExpiresAt) <= now).slice(0, 4);

    return { featuredProjects: fProjects, latestProjects: lProjects, featuredUsers: fUsers, latestUsers: lUsers };
  }, [allProjects, allUsers, isLoggedIn]);

  return (
    <div className="w-full bg-[#f6f6f8] dark:bg-[#111621] font-sans">
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 px-6 text-center overflow-hidden">
        {/* The "Glow" from the mockup */}
        <div className="absolute top-0 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 bg-blue-500/5 blur-[100px] rounded-full"></div>
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-8">
            Connect, Collaborate, Create. <br /> 
            <span className="text-blue-600">Your Next Project Starts Here.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
            CoStacked is the platform where ambitious founders and talented developers unite to build the future. Find your perfect match and bring your ideas to life.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button to="/projects" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
              Discover Projects
            </Button>
            {!isLoggedIn && (
              <Button to="/signup" className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all">
                Join the Community
              </Button>
            )}
          </div>
        </div>

        {/* Hero Image - The illustration in the image */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50">
             <img src="/path-to-your-illustration.png" alt="Collaborating" className="w-full h-auto" />
          </div>
        </div>
      </section>

      {/* Logged In Content */}
      {isLoggedIn && (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-20">
          {latestProjects.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Latest Projects</h2>
                <Link to="/projects" className="text-blue-600 font-bold flex items-center gap-1 hover:underline">
                  See All <ArrowRight size={18} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {latestProjects.map((project) => <ProjectCard key={project._id} project={project} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* How It Works Section */}
      <section className="bg-white dark:bg-slate-900/50 py-24 px-6 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">The Workflow</span>
            <h2 className="text-3xl md:text-5xl font-black mt-4 text-slate-900 dark:text-white">How CoStacked Works</h2>
            <p className="text-slate-500 mt-4">Three simple steps to build the future.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-8 rounded-2xl bg-[#f6f6f8] dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-blue-600/10 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                   <f.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 dark:text-white">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
