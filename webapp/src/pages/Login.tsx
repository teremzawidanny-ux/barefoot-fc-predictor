import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { loginParticipant, getCurrentParticipant } from '@/lib/storage';
import { ApiError } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const existing = getCurrentParticipant();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await loginParticipant(values.email);
      navigate('/predictions');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        form.setError('email', {
          message: 'No account found with that email.',
        });
      } else {
        form.setError('email', {
          message: 'Something went wrong. Please try again.',
        });
      }
    }
  }

  return (
    <div className="min-h-screen bg-pitch flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 border border-primary/40 mb-4">
            <LogIn size={24} className="text-primary" />
          </div>
          <h1 className="font-heading text-4xl text-foreground mb-2">WELCOME BACK</h1>
          <p className="font-body text-sm text-muted-foreground">
            Enter your email to log back in
          </p>
        </div>

        {/* Already logged in */}
        {existing ? (
          <div className="bg-card border border-border rounded-xl p-6 shadow-xl text-center">
            <p className="font-body text-sm text-foreground mb-4">
              You're already logged in as{' '}
              <span className="font-semibold text-gold">{existing.displayName}</span>.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-white font-body">
              <Link to="/predictions">Go to Predictions</Link>
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body text-sm text-foreground">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          className="bg-field border-stripe text-foreground placeholder:text-muted-foreground focus:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-body text-xs" />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-body font-semibold h-11"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? 'Logging in...' : 'Log In'}
                  </Button>
                </div>

                <p className="text-center text-xs font-body text-muted-foreground pt-1">
                  No account yet?{' '}
                  <Link to="/join" className="text-primary hover:underline">
                    Join the league
                  </Link>
                </p>
              </form>
            </Form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
