"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, useSession, signOut } from "@/lib/auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useHasPassword } from "@/lib/hooks/use-has-password";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loginMethod, setLoginMethod] = useState<"email" | "username">("username");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ssoEmail, setSsoEmail] = useState("");
  const [ssoError, setSsoError] = useState<string | null>(null);
  const { data: session } = useSession();
  const { hasPassword, isLoading: isCheckingAuth, mutate: mutateHasPassword } = useHasPassword();

  // Check for signup, email, and callbackURL params from URL
  const signupParam = searchParams.get('signup');
  const emailParam = searchParams.get('email');
  const callbackURL = searchParams.get('callbackURL') || '/';
  
  useEffect(() => {
    if (signupParam === 'true') {
      setIsSignUp(true);
    }
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams, signupParam, emailParam]);


  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // If user is logged in and adding a password, use setPassword API instead of signup
        if (session?.user) {
          const response = await fetch('/api/user/set-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newPassword: password }),
          });
          
          const result = await response.json();
          
          if (result.error) {
            setError(result.error.message || "Failed to add password");
          } else {
            setError(null);
            // Invalidate cache since password was just created
            await mutateHasPassword();
            router.push(callbackURL);
            router.refresh();
          }
        } else {
          // New signup - use normal signup flow
          const signUpData: any = {
            email,
            password,
          };
          
          if (name) {
            signUpData.name = name;
          }
          
          if (username) {
            signUpData.username = username;
          }
          
          const result = await authClient.signUp.email(signUpData);
          if (result.error) {
            setError(result.error.message || "Failed to sign up");
          } else {
            // Invalidate cache since password was just created
            await mutateHasPassword();
            router.push(callbackURL);
            router.refresh();
          }
        }
      } else {
        if (loginMethod === "username") {
          const result = await authClient.signIn.username({
            username,
            password,
          });
          if (result.error) {
            setError(result.error.message || "Failed to sign in");
          } else {
            router.push(callbackURL);
            router.refresh();
          }
        } else {
          const result = await authClient.signIn.email({
            email,
            password,
          });
          if (result.error) {
            setError(result.error.message || "Failed to sign in");
          } else {
            router.push(callbackURL);
            router.refresh();
          }
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackURL,
      });
    } catch (err) {
      setError("Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  const handleSSOSignIn = async () => {
    setIsLoading(true);
    setSsoError(null);
    setError(null);

    try {
      const res = await fetch("/api/auth/sign-in/sso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ssoEmail,
          callbackURL: callbackURL,
          errorCallbackURL: "/",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setSsoError(data.error.message || "No SSO provider found for this domain");
        setIsLoading(false);
      } else {
        setSsoError("No SSO provider found for this domain");
        setIsLoading(false);
      }
    } catch (err) {
      setSsoError("Failed to initiate SSO sign-in");
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.refresh();
            setIsLoading(false);
          },
          onError: () => {
            setError("Failed to sign out");
            setIsLoading(false);
          },
        },
      });
    } catch (err) {
      setError("Failed to sign out");
      setIsLoading(false);
    }
  };

  // If user is logged in AND not trying to create a password, show user info and sign out button
  // If they're trying to create a password (signup=true in URL), show the signup form instead
  if (session?.user && signupParam !== 'true') {
    const user = session.user;

    if (isCheckingAuth) {
      return (
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <Avatar className="mx-auto mb-4 h-20 w-20">
            <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
            <AvatarFallback>
              {user.name
                ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
                : user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, {user.name || user.email}!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {hasPassword && user.image ? (
              "Your account supports email/password and Google SSO"
            ) : hasPassword ? (
              "You're signed in"
            ) : (
              "You're signed in with Google SSO"
            )}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-600">Name:</span>
                <span className="ml-2 text-gray-900">{user.name || "Not provided"}</span>
              </div>
              {(user as any).username || (user as any).displayUsername ? (
                <div>
                  <span className="font-medium text-gray-600">Username:</span>
                  <span className="ml-2 text-gray-900">
                    {(user as any).displayUsername || (user as any).username || "Not provided"}
                  </span>
                </div>
              ) : null}
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <span className="ml-2 text-gray-900">{user.email || "Not provided"}</span>
              </div>
              {user.emailVerified !== undefined && (
                <div>
                  <span className="font-medium text-gray-600">Email Verified:</span>
                  <span className={`ml-2 ${user.emailVerified ? "text-green-600" : "text-yellow-600"}`}>
                    {user.emailVerified ? "Yes" : "No"}
                  </span>
                </div>
              )}
              {user.image && (
                <div>
                  <span className="font-medium text-gray-600">Profile Image:</span>
                  <a 
                    href={user.image} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    View Image
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isSignUp && session?.user ? "Add Password" : isSignUp ? "Sign up" : "Sign in"}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isSignUp && session?.user ? (
            "Add a password to your account to enable email/password authentication"
          ) : isSignUp ? (
            "Create an account to get started"
          ) : (
            "Sign in to your account"
          )}
        </p>
      </div>

      {session?.user && isSignUp && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-600">
            You're currently signed in with Google SSO. Signing up with the same email will link both authentication methods to your account.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleEmailPassword} className="space-y-4">
        {isSignUp && !session?.user && (
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isSignUp && !session?.user}
              placeholder="John Doe"
              disabled={isLoading}
            />
          </div>
        )}

        {isSignUp && !session?.user && (
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={isSignUp && !session?.user}
              placeholder="johndoe"
              disabled={isLoading}
              minLength={3}
            />
          </div>
        )}

        {!isSignUp && (
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => {
                setLoginMethod("username");
                setEmail("");
                setUsername("");
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMethod === "username"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Username
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod("email");
                setEmail("");
                setUsername("");
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMethod === "email"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Email
            </button>
          </div>
        )}

        {!isSignUp && loginMethod === "username" ? (
          <div>
            <Label htmlFor="username-login">Username</Label>
            <Input
              id="username-login"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="johndoe"
              disabled={isLoading}
            />
          </div>
        ) : !isSignUp ? (
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="email-signup">Email</Label>
            <Input
              id="email-signup"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>
        )}

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            disabled={isLoading}
            minLength={8}
          />
        </div>

        <Button
          type="submit"
          className="w-full text-white hover:opacity-90"
          style={{ backgroundColor: '#397A4A' }}
          disabled={isLoading}
          size="lg"
        >
          {isLoading
            ? "Loading..."
            : isSignUp && session?.user
              ? "Add Password"
              : isSignUp
                ? "Sign up"
                : "Sign in"}
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full mt-4"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        size="lg"
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      {!isSignUp && (
        <>
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or use enterprise SSO</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex gap-2">
              <Input
                type="email"
                value={ssoEmail}
                onChange={(e) => setSsoEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSSOSignIn}
                disabled={isLoading || !ssoEmail}
                size="lg"
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "SSO"
                )}
              </Button>
            </div>
            {ssoError && (
              <p className="mt-2 text-xs text-red-500">{ssoError}</p>
            )}
          </div>
        </>
      )}

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setEmail("");
            setUsername("");
            setPassword("");
            setLoginMethod("username");
          }}
          className="text-sm text-gray-600 hover:text-gray-900"
          disabled={isLoading}
        >
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <span className="font-semibold text-blue-600 hover:text-blue-700">Sign in</span>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <span className="font-semibold text-blue-600 hover:text-blue-700">Sign up</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

