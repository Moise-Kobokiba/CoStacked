import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../features/projects/projectsSlice';
import { fetchUsers } from '../features/users/usersSlice';

// UI Components
import { Button } from '../components/shared/Button';
import { ProjectCard } from '../components/shared/ProjectCard';
import { UserCard } from '../components/shared/UserCard';
import { Carousel } from '../components/shared/Carousel';
import { Lightbulb, Users, ShieldCheck, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#111621] font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden">
      
      {/* --- HERO SECTION --- */}
      <section className="relative px-5 py-12 md:py-32 flex flex-col items-center text-center">
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 bg-blue-500/10 blur-[80px] rounded-full"></div>
        
        <div className="max-w-4xl">
          <h1 className="text-3xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Connect, Collaborate, Create. <span className="text-blue-600">Your Next Project Starts Here.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base md:text-xl text-slate-600 dark:text-slate-400 mb-8 px-2">
            CoStacked is the platform where ambitious founders and talented developers unite to build the future.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto">
            <Button to="/projects" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25">
              Discover Projects
            </Button>
            {!isLoggedIn && (
              <Button to="/signup" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold">
                Join Community
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="py-16 px-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="text-blue-600 text-xs font-bold uppercase tracking-widest">The Workflow</span>
            <h2 className="text-2xl md:text-4xl font-black mt-2">How CoStacked Works</h2>
            <p className="text-slate-500 mt-2">Streamlined journey from idea to execution.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureStep 
              Icon={Lightbulb} 
              title="1. Share Your Vision" 
              desc="Founders post structured project listings including skills, compensation, and stage."
            />
            <FeatureStep 
              Icon={Users} 
              title="2. Discover Your Match" 
              desc="Developers browse open projects while founders filter by skills and experience."
            />
            <FeatureStep 
              Icon={ShieldCheck} 
              title="3. Collaborate & Build" 
              desc="Teams collaborate independently, with CoStacked acting as the trust layer."
            />
          </div>
        </div>
      </section>

      {/* --- LOGGED IN CONTENT (Preserved) --- */}
      {isLoggedIn && (
        <main className="max-w-7xl mx-auto px-5 py-12 space-y-20">
          {latestProjects.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-xl font-black">Latest Projects</h2>
                <Link to="/projects" className="text-blue-600 font-bold text-sm flex items-center">
                  See All <ArrowRight size={14} className="ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {latestProjects.map((project) => <ProjectCard key={project._id} project={project} />)}
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
};

const FeatureStep = ({ Icon, title, desc }) => (
  <div className="p-6 rounded-2xl bg-[#f6f6f8] dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
      <Icon size={24} />
    </div>
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
    <div className="mt-4 flex items-center text-blue-600 font-bold text-xs uppercase tracking-wider cursor-pointer">
      Learn more <ArrowRight size={12} className="ml-1" />
    </div>
  </div>
);
