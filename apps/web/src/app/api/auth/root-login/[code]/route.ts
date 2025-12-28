import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase/server";
import { ROLES } from "@/lib/rbac/roles";

/**
 * Root Admin Login via Secret Code
 * URL: /api/auth/root-login/[code]
 * 
 * GET: Shows login form if secret code is valid
 * POST: Processes login credentials
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    
    // Verify secret code from environment
    const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || "SUPER_SECRET_2024";

    if (code !== ADMIN_SECRET_CODE) {
      return NextResponse.json({ ok: false, message: "Invalid code" }, { status: 403 });
    }

    // Show login form
    const loginFormHtml = `
    <!DOCTYPE html>
    <html lang="bg">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Root Admin Login</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .login-container {
          background: white;
          padding: 2.5rem;
          border-radius: 1rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          width: 100%;
          max-width: 400px;
        }
        .logo {
          text-align: center;
          margin-bottom: 2rem;
        }
        .logo-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        h1 {
          text-align: center;
          color: #333;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .subtitle {
          text-align: center;
          color: #666;
          font-size: 0.875rem;
          margin-bottom: 2rem;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          color: #333;
          font-weight: 500;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }
        input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: all 0.2s;
        }
        input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .btn {
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        .btn:active {
          transform: translateY(0);
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .error-message {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          display: none;
        }
        .success-message {
          background: #d1fae5;
          color: #065f46;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          display: none;
        }
        .loader {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <div class="logo">
          <div class="logo-icon">🔐</div>
          <h1>Root Admin</h1>
          <p class="subtitle">Вход в административния панел</p>
        </div>

        <div id="errorMessage" class="error-message"></div>
        <div id="successMessage" class="success-message"></div>

        <form id="loginForm">
          <div class="form-group">
            <label for="email">Имейл адрес</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required 
              autocomplete="email"
              placeholder="admin@example.com"
            />
          </div>

          <div class="form-group">
            <label for="password">Парола</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              required 
              autocomplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" class="btn" id="submitBtn">
            <span id="btnText">Влез</span>
            <span id="btnLoader" class="loader" style="display:none;"></span>
          </button>
        </form>
      </div>

      <script>
        const form = document.getElementById('loginForm');
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const btnLoader = document.getElementById('btnLoader');

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const code = "${code}";

          // Show loading
          submitBtn.disabled = true;
          btnText.style.display = 'none';
          btnLoader.style.display = 'inline-block';
          errorDiv.style.display = 'none';
          successDiv.style.display = 'none';

          try {
            const response = await fetch('/api/auth/root-login/${code}', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Грешка при влизане');
            }

            // Success - save user data
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('firebaseToken', data.token);

            // Show success message
            successDiv.textContent = '✓ Успешно влизане! Пренасочване...';
            successDiv.style.display = 'block';

            // Redirect to admin panel
            setTimeout(() => {
              window.location.href = '/admin';
            }, 1000);

          } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
          }
        });
      </script>
    </body>
    </html>
    `;

    return new NextResponse(loginFormHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });

  } catch (error: any) {
    console.error("Root login GET error:", error);
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST handler for login
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || "SUPER_SECRET_2024";

    if (code !== ADMIN_SECRET_CODE) {
      return NextResponse.json(
        { ok: false, message: "Invalid secret code" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate using Firebase REST API
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      const errorMessage = errorData.error?.message || "Invalid credentials";
      
      console.error("Firebase auth error:", errorData);
      
      // More specific error messages
      let message = "Невалиден имейл или парола";
      if (errorMessage.includes("EMAIL_NOT_FOUND")) {
        message = "Потребителят не е намерен. Моля използвай setup endpoint първо.";
      } else if (errorMessage.includes("INVALID_PASSWORD")) {
        message = "Невалидна парола";
      } else if (errorMessage.includes("USER_DISABLED")) {
        message = "Профилът е деактивиран";
      }
      
      return NextResponse.json(
        { ok: false, message, debug: errorMessage },
        { status: 401 }
      );
    }

    const authData = await authResponse.json();
    const uid = authData.localId;
    const idToken = authData.idToken;

    // Verify user is admin
    const user = await adminAuth.getUser(uid);
    const role = user.customClaims?.role;

    if (role !== ROLES.ADMIN) {
      return NextResponse.json(
        { ok: false, message: "Access denied: Admin role required" },
        { status: 403 }
      );
    }

    // Log admin login
    await adminDb.collection("system_logs").add({
      action: "ROOT_ADMIN_LOGIN",
      userId: uid,
      email: user.email,
      timestamp: FieldValue.serverTimestamp(),
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    });

    return NextResponse.json({
      ok: true,
      message: "Login successful",
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "Root Admin",
        role: ROLES.ADMIN,
        photoURL: user.photoURL || null,
      },
      token: idToken,
    });

  } catch (error: any) {
    console.error("Root login POST error:", error);
    return NextResponse.json(
      { ok: false, message: error.message || "Login failed" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
