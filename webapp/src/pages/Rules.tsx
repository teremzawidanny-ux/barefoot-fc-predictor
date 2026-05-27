import { motion } from 'framer-motion';
import { Trophy, Target, Clock, Zap, CheckCircle2, XCircle, List } from 'lucide-react';

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function SectionCard({ icon, title, children }: SectionCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        <h2 className="font-heading text-2xl text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

interface ScoreRowProps {
  condition: string;
  points: string;
  note?: string;
  positive?: boolean;
}

function ScoreRow({ condition, points, note, positive = true }: ScoreRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex items-start gap-2 flex-1">
        {positive ? (
          <CheckCircle2 size={14} className="text-primary mt-0.5 flex-shrink-0" />
        ) : (
          <XCircle size={14} className="text-destructive mt-0.5 flex-shrink-0" />
        )}
        <div>
          <p className="font-body text-sm text-foreground">{condition}</p>
          {note && <p className="font-body text-xs text-muted-foreground mt-0.5">{note}</p>}
        </div>
      </div>
      <span className={`font-heading text-xl flex-shrink-0 ${positive ? 'text-gold' : 'text-muted-foreground'}`}>
        {points}
      </span>
    </div>
  );
}

interface ExampleProps {
  title: string;
  actual: string;
  predicted: string;
  breakdown: { label: string; points: number; met: boolean }[];
  total: number;
}

function Example({ title, actual, predicted, breakdown, total }: ExampleProps) {
  return (
    <div className="bg-field border border-stripe rounded-lg p-4">
      <p className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-3">{title}</p>
      <div className="flex items-center gap-6 mb-3">
        <div className="text-center">
          <p className="font-body text-xs text-muted-foreground mb-1">Actual Result</p>
          <p className="font-heading text-lg text-foreground">{actual}</p>
        </div>
        <div className="text-center">
          <p className="font-body text-xs text-muted-foreground mb-1">Your Prediction</p>
          <p className="font-heading text-lg text-foreground">{predicted}</p>
        </div>
        <div className="text-center ml-auto">
          <p className="font-body text-xs text-muted-foreground mb-1">Points</p>
          <p className="font-heading text-2xl text-gold">{total}</p>
        </div>
      </div>
      <div className="space-y-1">
        {breakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs font-body">
            <div className="flex items-center gap-1.5">
              {item.met ? (
                <CheckCircle2 size={12} className="text-primary" />
              ) : (
                <XCircle size={12} className="text-muted-foreground" />
              )}
              <span className={item.met ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
            </div>
            <span className={item.met ? 'text-gold font-semibold' : 'text-muted-foreground'}>
              {item.met ? `+${item.points}` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Rules() {
  return (
    <div className="min-h-screen bg-pitch px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="mb-8">
            <h1 className="font-heading text-5xl text-foreground mb-2">RULES & SCORING</h1>
            <p className="font-body text-sm text-muted-foreground">
              How the Barefoot FC World Cup Predictor works
            </p>
          </div>

          <SectionCard icon={<Target size={18} />} title="HOW IT WORKS">
            <ol className="space-y-3 font-body text-sm text-muted-foreground list-decimal list-inside">
              <li className="leading-relaxed">
                <span className="text-foreground">Join the league</span> by creating your predictor profile with a display name and email.
              </li>
              <li className="leading-relaxed">
                <span className="text-foreground">Predict every match</span> — all 104 group stage and knockout matches from the Group Stage through to the Final.
              </li>
              <li className="leading-relaxed">
                For <span className="text-foreground">group stage</span> matches, draws are possible and all matches end in regulation. For <span className="text-foreground">knockout</span> matches from the Round of 32 onward, predict the winner and how the match will be decided (full time, extra time, or penalties).
              </li>
              <li className="leading-relaxed">
                After each match completes, points are awarded automatically based on the scoring system below.
              </li>
              <li className="leading-relaxed">
                The player with the most points at the end of the tournament <span className="text-gold">wins the league!</span>
              </li>
            </ol>
          </SectionCard>

          <SectionCard icon={<List size={18} />} title="MATCH TYPES">
            <div className="space-y-4 font-body text-sm text-muted-foreground">
              <div>
                <p className="text-foreground font-medium mb-1">Group Stage (72 matches)</p>
                <p className="leading-relaxed">
                  All matches end in regulation time (90 minutes). Draws are allowed — if you predict a tied score, the outcome is a Draw. No extra time or penalties.
                </p>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">Knockout Stage (32 matches)</p>
                <p className="leading-relaxed">
                  From the Round of 32 to the Final, every match must have a winner. If you predict a tied score, you must pick penalties as the method. No draws allowed.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<Clock size={18} />} title="DEADLINE RULES">
            <div className="space-y-3 font-body text-sm text-muted-foreground">
              <p className="leading-relaxed">
                Each match has a <span className="text-foreground">prediction deadline</span> — typically 11:59 PM ET the night before the match kicks off.
              </p>
              <p className="leading-relaxed">
                Once the deadline passes, predictions for that match are <span className="text-orange-400">locked</span>. You cannot submit or edit a prediction after the deadline.
              </p>
              <p className="leading-relaxed">
                Predictions for matches where the teams haven't been confirmed yet are <span className="text-amber-400">pending</span>. They open as soon as both teams are known.
              </p>
              <div className="bg-field border border-stripe rounded-lg p-3 mt-2">
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">Tip:</span> Don't wait until the last minute — submit your predictions as early as possible to avoid missing the deadline.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<Trophy size={18} />} title="SCORING SYSTEM">
            <div className="mb-2">
              <p className="font-body text-sm text-muted-foreground mb-4">
                A maximum of <span className="text-gold font-semibold">8 points</span> can be earned per match.
                All bonuses require getting the winner correct first.
              </p>
              <ScoreRow
                condition="Correct winner"
                points="3 pts"
                note="Foundation of all scoring — must get this right to earn bonuses"
              />
              <ScoreRow
                condition="Exact score (both teams)"
                points="+3 pts"
                note="Only awarded if you also predicted the correct winner"
              />
              <ScoreRow
                condition="Correct goal difference"
                points="+1 pt"
                note="Awarded if goal diff matches, but score isn't exact. Only with correct winner"
              />
              <ScoreRow
                condition="Correct method (FT / ET / Pens)"
                points="+1 pt"
                note="Awarded if you predicted how the match was decided. Only with correct winner"
              />
              <ScoreRow
                condition="Wrong winner"
                points="0 pts"
                note="No points for any part of the prediction"
                positive={false}
              />
            </div>

            <div className="mt-4 bg-field border border-stripe rounded-lg p-3">
              <p className="font-body text-xs text-muted-foreground">
                <span className="text-gold font-semibold">Maximum: </span>
                <span className="text-gold">8 pts</span> per match — Correct winner/outcome (3) + Exact score (3) + Correct goal difference (1) + Correct method (1). Note: exact score already implies correct goal difference, so the effective max is 3 + 3 + 1 (method) = 7 pts on the exact-score path, or 3 + 1 (goal diff) + 1 (method) = 5 pts on the goal-difference path.
              </p>
            </div>
          </SectionCard>

          <SectionCard icon={<Zap size={18} />} title="EXAMPLES">
            <div className="space-y-4">
              <Example
                title="Best case — exact score + method"
                actual="Argentina 2–1 France (Full Time)"
                predicted="Argentina 2–1, Full Time"
                breakdown={[
                  { label: 'Correct winner (Argentina)', points: 3, met: true },
                  { label: 'Exact score (2–1)', points: 3, met: true },
                  { label: 'Correct goal difference (1)', points: 1, met: false },
                  { label: 'Correct method (Full Time)', points: 1, met: true },
                ]}
                total={7}
              />

              <Example
                title="Group stage draw — exact score"
                actual="Brazil 1–1 Scotland (Draw, Full Time)"
                predicted="Brazil 1–1, Draw, Full Time"
                breakdown={[
                  { label: 'Correct outcome (Draw)', points: 3, met: true },
                  { label: 'Exact score (1–1)', points: 3, met: true },
                  { label: 'Correct goal difference (0)', points: 1, met: true },
                  { label: 'Correct method (Full Time)', points: 1, met: true },
                ]}
                total={8}
              />

              <Example
                title="Correct winner + goal diff + method"
                actual="Argentina 2–1 France (Full Time)"
                predicted="Argentina 1–0, Full Time"
                breakdown={[
                  { label: 'Correct winner (Argentina)', points: 3, met: true },
                  { label: 'Exact score (2–1 ≠ 1–0)', points: 3, met: false },
                  { label: 'Correct goal difference (diff=1)', points: 1, met: true },
                  { label: 'Correct method (Full Time)', points: 1, met: true },
                ]}
                total={5}
              />

              <Example
                title="Correct winner only"
                actual="Argentina 2–1 France (Full Time)"
                predicted="Argentina 3–1, Extra Time"
                breakdown={[
                  { label: 'Correct winner (Argentina)', points: 3, met: true },
                  { label: 'Exact score (2–1 ≠ 3–1)', points: 3, met: false },
                  { label: 'Correct goal difference (diff 1 ≠ diff 2)', points: 1, met: false },
                  { label: 'Correct method (FT ≠ ET)', points: 1, met: false },
                ]}
                total={3}
              />

              <Example
                title="Penalty shootout prediction"
                actual="England 1–1 France (Penalties, England win)"
                predicted="England 1–1, Penalties, England win"
                breakdown={[
                  { label: 'Correct winner (England)', points: 3, met: true },
                  { label: 'Exact score (1–1)', points: 3, met: true },
                  { label: 'Correct goal difference (0)', points: 1, met: false },
                  { label: 'Correct method (Penalties)', points: 1, met: true },
                ]}
                total={7}
              />

              <Example
                title="Wrong winner — no points"
                actual="Argentina 2–1 France (Full Time)"
                predicted="France 1–0, Full Time"
                breakdown={[
                  { label: 'Correct winner (France ✗)', points: 3, met: false },
                  { label: 'Exact score', points: 3, met: false },
                  { label: 'Correct goal difference', points: 1, met: false },
                  { label: 'Correct method', points: 1, met: false },
                ]}
                total={0}
              />
            </div>
          </SectionCard>
        </motion.div>
      </div>
    </div>
  );
}
