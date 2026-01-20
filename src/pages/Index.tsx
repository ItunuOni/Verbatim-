import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, User, Loader2, Sparkles } from 'lucide-react';

const Index = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg text-foreground">My App</span>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {user.email}
                  </span>
                  <Button variant="outline" onClick={signOut} size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Welcome to Your App
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A modern application with authentication built-in. Start building your amazing project here!
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {user ? (
            <Card className="border-border/50 shadow-xl shadow-primary/5">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">You're signed in!</CardTitle>
                <CardDescription>
                  Welcome back, {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground">
                  You now have access to all authenticated features. Start exploring!
                </p>
                <Button onClick={signOut} variant="outline" className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 shadow-xl shadow-primary/5">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <LogIn className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Get Started</CardTitle>
                <CardDescription>
                  Sign in or create an account to access all features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/auth">
                  <Button className="w-full">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In / Sign Up
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
