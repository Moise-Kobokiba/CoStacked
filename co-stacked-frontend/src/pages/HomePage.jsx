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
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* --- HERO SECTION --- */}
      <section className="relative px-6 py-20 md:py-32 overflow-hidden">
        {/* Soft Glow Background Ornament */}
        <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 bg-primary/5 blur-[120px] rounded-full"></div>
        
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8">
            Connect, Collaborate, Create. <span className="text-primary">Your Next Project Starts Here.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-10">
            CoStacked is the platform where ambitious founders and talented developers unite to build the future. Find your perfect match and bring your ideas to life.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button to="/projects" className="w-full sm:w-auto min-w-[200px] h-14 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              Discover Projects
            </Button>
            {!isLoggedIn && (
              <Button to="/signup" className="w-full sm:w-auto min-w-[200px] h-14 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-50 transition-all">
                Join the Community
              </Button>
            )}
          </div>
        </div>

        {/* Hero Image / Illustration Placeholder */}
        <div className="mt-20 mx-auto max-w-5xl px-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
            <img alt="Team Collaboration" className="w-full aspect-video object-cover" src="/api/placeholder/1200/675" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* --- LOGGED IN CONTENT --- */}
      {isLoggedIn && (
        <main className="max-w-7xl mx-auto px-6 py-12 space-y-24">
          {featuredProjects.length > 0 && (
            <section>
              <h2 className="text-2xl font-black mb-8">Featured Projects</h2>
              <Carousel>
                {featuredProjects.map((project) => <ProjectCard key={project._id} project={project} />)}
              </Carousel>
            </section>
          )}

          {featuredUsers.length > 0 && (
            <section>
              <h2 className="text-2xl font-black mb-8">Featured Talent</h2>
              <Carousel>
                {featuredUsers.map((user) => <UserCard key={user._id} user={user} />)}
              </Carousel>
            </section>
          )}

          <section>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black">Latest Projects</h2>
              <Link to="/projects" className="text-primary font-bold flex items-center gap-1 hover:underline">
                See All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestProjects.map((project) => <ProjectCard key={project._id} project={project} />)}
            </div>
          </section>
        </main>
      )}

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="bg-white dark:bg-slate-900/30 py-24 px-6 border-y border-slate-100 dark:border-slate-800">
        <div className="mx-auto max-w-7xl text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">The Workflow</span>
          <h2 className="text-3xl md:text-5xl font-black">How CoStacked Works</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Our platform streamlines the journey from idea to execution through three simple steps.
          </p>
        </div>

        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8">
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
            desc="Teams collaborate independently, with CoStacked acting as the discovery and trust layer."
          />
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-slate-900 p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Ready to build the future?</h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Join thousands of founders and developers already collaborating on CoStacked.
            </p>
            <Button to="/signup" className="min-w-[240px] h-14 rounded-xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/30 hover:scale-105 transition-all">
              Get Started Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureStep = ({ Icon, title, desc }) => (
  <div className="group p-8 rounded-2xl bg-background-light dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all duration-300">
    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    <div className="mt-6 flex items-center text-primary font-bold text-sm cursor-pointer">
      Learn more <ArrowRight size={14} className="ml-1" />
    </div>
  </div>
);
