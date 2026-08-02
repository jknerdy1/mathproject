import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Modules from '@/pages/Modules';
import HeroOverlay from '@/components/HeroOverlay';
import About from '@/pages/About';
import PythagoreanModule from '@/pages/PythagoreanModule';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

// REQUIRED — copy verbatim
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

// Light/cream theme matching the site palette
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(250 65% 52%)",
    colorForeground: "#1c1108",
    colorMutedForeground: "#6b5742",
    colorDanger: "hsl(0 72% 52%)",
    colorBackground: "#FFF8F2",
    colorInput: "#f5ece3",
    colorInputForeground: "#1c1108",
    colorNeutral: "#d6c4af",
    fontFamily: "'Space Grotesk', sans-serif",
    borderRadius: "12px",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "w-[440px] max-w-full overflow-hidden rounded-[14px] border border-[#d6c4af] shadow-sm bg-[#FFF8F2]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold tracking-tight text-[#1c1108]",
    headerSubtitle: "text-[#6b5742]",
    socialButtonsBlockButtonText: "font-medium text-[#1c1108]",
    socialButtonsBlockButton:
      "bg-white border-[#d6c4af] hover:bg-[#fdf5ee] transition-colors text-[#1c1108]",
    formFieldLabel: "font-medium text-[#1c1108]",
    formFieldInput:
      "bg-white border-[#d6c4af] text-[#1c1108] focus:border-[#6644cc] focus:ring-1 focus:ring-[#6644cc] placeholder:text-[#a89070]",
    formButtonPrimary:
      "bg-[#1c1108] hover:bg-[#2d2010] text-[#FFF1E7] font-bold transition-all",
    footerActionLink: "text-[#6644cc] hover:text-[#5533aa] font-semibold",
    footerActionText: "text-[#6b5742]",
    footerAction: "mt-6 text-center",
    dividerText: "text-[#6b5742] text-xs uppercase tracking-wider",
    dividerLine: "bg-[#d6c4af]",
    logoBox: "flex justify-center mb-6",
    logoImage: "h-12 w-auto",
    alert: "bg-red-50 border-red-200 text-red-800",
    alertText: "text-red-800",
    otpCodeFieldInput: "bg-white border-[#d6c4af] text-[#1c1108] focus:border-[#6644cc]",
    formFieldRow: "mb-4",
    main: "w-full",
    identityPreviewEditButton: "text-[#6644cc] hover:text-[#5533aa]",
  },
};

function SignInPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFF1E7",
        padding: "24px",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
        />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFF1E7",
        padding: "24px",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
        />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);
  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to continue your journey",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start exploring mathematics",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          {/* Public homepage — the module grid with hero overlay */}
          <Route path="/" component={() => <><HeroOverlay /><Modules /></>} />
          {/* About page (repurposed landing page) */}
          <Route path="/about" component={About} />
          {/* Auth */}
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          {/* Module pages (no sign-in required) */}
          <Route path="/modules/pythagorean" component={PythagoreanModule} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
