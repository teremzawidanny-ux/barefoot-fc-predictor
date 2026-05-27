import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Trophy, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentParticipant, clearCurrentParticipant } from '@/lib/storage';
import { Participant } from '@/lib/types';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Predictions', to: '/predictions' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Rules', to: '/rules' },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    setParticipant(getCurrentParticipant());
  }, [location]);

  function handleLogout() {
    clearCurrentParticipant();
    setParticipant(null);
    setMobileOpen(false);
    navigate('/');
  }

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <nav className="sticky top-0 z-50 bg-field border-b border-stripe">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            onClick={() => setMobileOpen(false)}
          >
            <img
              src="/barefoot-fc-logo.jpg"
              alt="Barefoot FC"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/60 group-hover:ring-gold transition-all"
            />
            <span className="font-heading text-2xl text-foreground tracking-wider group-hover:text-gold transition-colors">
              BAREFOOT FC
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-4 py-2 rounded-md font-body text-sm font-medium transition-colors',
                  isActive(link.to)
                    ? 'text-gold border-b-2 border-gold rounded-none'
                    : 'text-muted-foreground hover:text-foreground hover:bg-stripe'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3">
            {participant ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-stripe rounded-full">
                  <Trophy size={14} className="text-gold" />
                  <span className="text-sm font-medium text-foreground">
                    {participant.displayName}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-stripe transition-colors"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Log in
                </Link>
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white font-body">
                  <Link to="/join">Join Now</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-stripe transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-stripe bg-field animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-md font-body text-sm font-medium transition-colors',
                  isActive(link.to)
                    ? 'text-gold bg-stripe'
                    : 'text-muted-foreground hover:text-foreground hover:bg-stripe'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-stripe mt-2">
              {participant ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-4 py-2">
                    <Trophy size={16} className="text-gold" />
                    <span className="text-sm font-medium text-foreground">
                      {participant.displayName}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2.5 rounded-md text-sm font-body text-muted-foreground hover:text-foreground hover:bg-stripe transition-colors"
                  >
                    <LogOut size={15} />
                    Log out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-md font-body text-sm text-muted-foreground hover:text-foreground hover:bg-stripe transition-colors"
                  >
                    Already joined? Log in
                  </Link>
                  <Link
                    to="/join"
                    onClick={() => setMobileOpen(false)}
                    className="block"
                  >
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-body">
                      Join Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
