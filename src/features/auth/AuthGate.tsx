import { useEffect, useRef, useState } from "react";
import { LogIn, Sparkles, UserPlus } from "lucide-react";
import DietApp from "../../app/DietApp";
import { neon } from "../../lib/neon";
import "./auth.css";

export function AuthGate() {
  if (!neon) {
    return (
      <main className="auth-page">
        <section className="auth-panel auth-error-panel">
          <h1>Neon 연결 설정이 필요합니다</h1>
          <p>`VITE_NEON_DATABASE_URL` 환경변수를 확인해 주세요.</p>
        </section>
      </main>
    );
  }

  return <ConfiguredAuthGate />;
}

function ConfiguredAuthGate() {
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [sessionError, setSessionError] = useState("");
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [initializedEmail, setInitializedEmail] = useState("");
  const [initializationError, setInitializationError] = useState("");
  const initializingEmail = useRef("");

  useEffect(() => {
    let active = true;
    neon!.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) throw error;
        setUser(data?.user ?? null);
        setSessionError("");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSessionError(
          error instanceof Error
            ? error.message
            : "Neon Auth에 연결하지 못했습니다.",
        );
      })
      .finally(() => {
        if (active) setLoadingSession(false);
      });

    return () => {
      active = false;
    };
  }, [sessionAttempt]);

  useEffect(() => {
    if (
      !user ||
      initializationError ||
      initializedEmail === user.email ||
      initializingEmail.current === user.email
    )
      return;
    let active = true;
    initializingEmail.current = user.email;

    const initialize = async () => {
      try {
        const { error } = await neon!.rpc("initialize_current_user");
        if (!active) return;
        if (error) {
          initializingEmail.current = "";
          setInitializationError(error.message);
        } else setInitializedEmail(user.email);
      } catch (error) {
        if (!active) return;
        initializingEmail.current = "";
        setInitializationError(
          error instanceof Error ? error.message : "초기화에 실패했습니다.",
        );
      }
    };

    void initialize();
    return () => {
      active = false;
    };
  }, [initializationError, initializedEmail, user]);

  if (
    loadingSession ||
    (user && initializedEmail !== user.email && !initializationError)
  ) {
    return <AuthLoading />;
  }

  if (sessionError) {
    return (
      <main className="auth-page">
        <section className="auth-panel auth-error-panel">
          <h1>Neon Auth에 연결하지 못했습니다</h1>
          <p>{sessionError}</p>
          <button
            onClick={() => {
              setLoadingSession(true);
              setSessionAttempt((current) => current + 1);
            }}
          >
            다시 시도
          </button>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <LoginPage
        signedIn={async () => {
          const { data } = await neon!.auth.getSession();
          setUser(data?.user ?? null);
        }}
      />
    );
  }

  if (initializationError) {
    return (
      <main className="auth-page">
        <section className="auth-panel auth-error-panel">
          <h1>사용자 데이터를 준비하지 못했습니다</h1>
          <p>{initializationError}</p>
          <button onClick={() => setInitializationError("")}>다시 시도</button>
        </section>
      </main>
    );
  }

  return (
    <DietApp
      userEmail={user.email}
      signOut={async () => {
        await neon!.auth.signOut();
        initializingEmail.current = "";
        setInitializedEmail("");
        setUser(null);
      }}
    />
  );
}

function LoginPage({ signedIn }: { signedIn: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand-mark">
          <Sparkles size={22} />
        </div>
        <span className="auth-eyebrow">DIET MEMORY</span>
        <h1>
          {creatingAccount ? "나만의 계정 만들기" : "나의 기록으로 돌아가기"}
        </h1>
        <p>
          {creatingAccount
            ? "처음 한 번만 사용할 개인 계정을 만드세요."
            : "Neon에 등록한 개인 계정으로 로그인하세요."}
        </p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitting(true);
            setError("");
            setNotice("");
            try {
              const result = creatingAccount
                ? await neon!.auth.signUp.email({
                    name: email.split("@")[0] || "User",
                    email,
                    password,
                  })
                : await neon!.auth.signIn.email({ email, password });
              if (result.error) {
                setError(
                  result.error.message ??
                    (creatingAccount
                      ? "계정 생성에 실패했습니다."
                      : "로그인에 실패했습니다."),
                );
              } else {
                await signedIn();
                if (creatingAccount) {
                  setCreatingAccount(false);
                  setPassword("");
                  setNotice("계정이 생성되었습니다. 새 계정으로 로그인하세요.");
                }
              }
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : creatingAccount
                    ? "계정 생성에 실패했습니다."
                    : "로그인에 실패했습니다.",
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <label>
            <span>이메일</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={
                creatingAccount ? "new-password" : "current-password"
              }
              minLength={creatingAccount ? 8 : undefined}
              required
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          {notice && <p className="auth-notice">{notice}</p>}
          <button disabled={submitting}>
            {creatingAccount ? <UserPlus size={17} /> : <LogIn size={17} />}
            {submitting
              ? creatingAccount
                ? "계정 생성 중..."
                : "로그인 중..."
              : creatingAccount
                ? "개인 계정 만들기"
                : "로그인"}
          </button>
        </form>
        {import.meta.env.DEV ? (
          <button
            type="button"
            className="auth-mode-toggle"
            onClick={() => {
              setCreatingAccount((current) => !current);
              setError("");
              setNotice("");
            }}
          >
            {creatingAccount ? "기존 계정으로 로그인" : "최초 개인 계정 만들기"}
          </button>
        ) : (
          <small>회원가입은 제공하지 않습니다.</small>
        )}
      </section>
    </main>
  );
}

function AuthLoading() {
  return (
    <main className="auth-page">
      <div className="auth-loading" aria-label="로그인 상태 확인 중" />
    </main>
  );
}
