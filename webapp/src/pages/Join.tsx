import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
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
import { joinParticipant } from '@/lib/storage';
import { ApiError } from '@/lib/api';

const joinSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(20, 'Max 20 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  favoriteTeam: z.string().optional(),
});

type JoinFormValues = z.infer<typeof joinSchema>;

export default function Join() {
  const navigate = useNavigate();

  const form = useForm<JoinFormValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      fullName: '',
      displayName: '',
      email: '',
      phone: '',
      city: '',
      country: '',
      favoriteTeam: '',
    },
  });

  async function onSubmit(values: JoinFormValues) {
    try {
      await joinParticipant({
        fullName: values.fullName,
        displayName: values.displayName,
        email: values.email,
        phone: values.phone || undefined,
        city: values.city || undefined,
        country: values.country || undefined,
        favoriteTeam: values.favoriteTeam || undefined,
      });
      navigate('/predictions');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const data = err.data as { code?: string } | null;
        if (data?.code === 'DISPLAY_NAME_TAKEN') {
          form.setError('displayName', { message: 'Display name already taken' });
        } else if (data?.code === 'EMAIL_TAKEN') {
          form.setError('email', { message: 'Email already registered' });
        } else {
          form.setError('root', { message: 'This account already exists.' });
        }
      } else {
        form.setError('root', { message: 'Something went wrong. Please try again.' });
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
            <UserPlus size={24} className="text-primary" />
          </div>
          <h1 className="font-heading text-4xl text-foreground mb-2">JOIN THE LEAGUE</h1>
          <p className="font-body text-sm text-muted-foreground">
            Create your predictor profile to start earning points
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-body text-sm text-foreground">Full Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Carlos Mendoza"
                        className="bg-field border-stripe text-foreground placeholder:text-muted-foreground focus:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="font-body text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-body text-sm text-foreground">
                      Display Name *{' '}
                      <span className="text-muted-foreground font-normal">(shown on leaderboard)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. CarlosM"
                        className="bg-field border-stripe text-foreground placeholder:text-muted-foreground focus:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="font-body text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-body text-sm text-foreground">Email *</FormLabel>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body text-sm text-foreground">City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Buenos Aires"
                          className="bg-field border-stripe text-foreground placeholder:text-muted-foreground focus:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-body text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body text-sm text-foreground">Country</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Argentina"
                          className="bg-field border-stripe text-foreground placeholder:text-muted-foreground focus:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-body text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="favoriteTeam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-body text-sm text-foreground">Favourite Team</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Argentina"
                        className="bg-field border-stripe text-foreground placeholder:text-muted-foreground focus:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="font-body text-xs" />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <p className="text-xs font-body text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-body font-semibold h-11"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Joining...' : 'Join the League'}
                </Button>
              </div>

              <p className="text-center text-xs font-body text-muted-foreground pt-1">
                Already joined?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          </Form>
        </div>

        <p className="text-center mt-4 text-xs font-body text-muted-foreground">
          Your predictions are saved to the shared leaderboard.
        </p>
      </motion.div>
    </div>
  );
}
