import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase/server";
import { ROLES } from "@/lib/rbac/roles";

/**
 * Setup Root Admin
 * URL: /api/auth/setup-admin/[code]
 * 
 * Creates or resets root admin account with predefined credentials
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    
    // Verify secret code from environment
    const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || "SUPER_SECRET_2024";
    const ROOT_ADMIN_EMAIL = process.env.ROOT_ADMIN_EMAIL || "admin@cenner.bg";
    const ROOT_ADMIN_PASSWORD = process.env.ROOT_ADMIN_PASSWORD || "Admin2024!Strong";
    const ROOT_ADMIN_NAME = process.env.ROOT_ADMIN_NAME || "Root Administrator";

    if (code !== ADMIN_SECRET_CODE) {
      return NextResponse.json(
        { ok: false, message: "Invalid secret code" },
        { status: 403 }
      );
    }

    let rootAdmin;
    let isNewUser = false;
    let passwordReset = false;

    // Check if root admin exists
    try {
      rootAdmin = await adminAuth.getUserByEmail(ROOT_ADMIN_EMAIL);
      console.log(`Root admin found: ${rootAdmin.uid}`);
      
      // Update password for existing user
      await adminAuth.updateUser(rootAdmin.uid, {
        password: ROOT_ADMIN_PASSWORD,
        displayName: ROOT_ADMIN_NAME,
        emailVerified: true,
      });
      
      passwordReset = true;
      console.log("Password reset for existing root admin");
      
    } catch (error: any) {
      // Root admin doesn't exist, create new one
      console.log("Creating new root admin user...");
      
      rootAdmin = await adminAuth.createUser({
        email: ROOT_ADMIN_EMAIL,
        password: ROOT_ADMIN_PASSWORD,
        displayName: ROOT_ADMIN_NAME,
        emailVerified: true,
      });
      
      isNewUser = true;
      console.log(`New root admin created: ${rootAdmin.uid}`);
    }

    // Set ADMIN role in custom claims
    await adminAuth.setCustomUserClaims(rootAdmin.uid, { role: ROLES.ADMIN });

    // Update/Create user document in Firestore
    const userData: any = {
      email: ROOT_ADMIN_EMAIL,
      displayName: ROOT_ADMIN_NAME,
      role: ROLES.ADMIN,
      isRootAdmin: true,
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    // Only add createdAt for new users
    if (isNewUser) {
      userData.createdAt = FieldValue.serverTimestamp();
    }
    
    await adminDb.collection("users").doc(rootAdmin.uid).set(userData, { merge: true });

    // Log setup action
    await adminDb.collection("system_logs").add({
      action: isNewUser ? "ROOT_ADMIN_CREATED" : "ROOT_ADMIN_PASSWORD_RESET",
      userId: rootAdmin.uid,
      email: ROOT_ADMIN_EMAIL,
      timestamp: FieldValue.serverTimestamp(),
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    });

    // Return success HTML page
    const successHtml = `
    <!DOCTYPE html>
    <html lang="bg">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Root Admin Setup</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .container {
          background: white;
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          width: 100%;
        }
        .success-icon {
          text-align: center;
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: bounce 0.6s;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 1.5rem;
          font-size: 1.75rem;
        }
        .info-box {
          background: #f0fdf4;
          border: 2px solid #10b981;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #d1fae5;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: 600;
          color: #065f46;
          font-size: 0.875rem;
        }
        .value {
          font-family: 'Courier New', monospace;
          color: #333;
          background: #fff;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        .password-value {
          background: #fef3c7;
          color: #92400e;
          font-weight: 600;
        }
        .warning {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          color: #92400e;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .warning strong {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }
        .actions {
          display: flex;
          gap: 1rem;
        }
        .btn {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }
        .btn-secondary:hover {
          background: #e5e7eb;
        }
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .badge-new {
          background: #dbeafe;
          color: #1e40af;
        }
        .badge-reset {
          background: #fef3c7;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✅</div>
        
        <div style="text-align: center;">
          <span class="status-badge ${isNewUser ? 'badge-new' : 'badge-reset'}">
            ${isNewUser ? '🆕 НОВ ПРОФИЛ' : '🔄 ПАРОЛА ОБНОВЕНА'}
          </span>
        </div>
        
        <h1>${isNewUser ? 'Root Admin Създаден' : 'Root Admin Обновен'}</h1>
        
        <div class="warning">
          <strong>⚠️ ВАЖНО - Запази тези данни!</strong>
          Запиши паролата на сигурно място. Този екран се показва само веднъж!
        </div>

        <div class="info-box">
          <div class="info-row">
            <span class="label">📧 Имейл:</span>
            <span class="value">${ROOT_ADMIN_EMAIL}</span>
          </div>
          <div class="info-row">
            <span class="label">🔑 Парола:</span>
            <span class="value password-value">${ROOT_ADMIN_PASSWORD}</span>
          </div>
          <div class="info-row">
            <span class="label">👤 Име:</span>
            <span class="value">${ROOT_ADMIN_NAME}</span>
          </div>
          <div class="info-row">
            <span class="label">🎭 Роля:</span>
            <span class="value">ADMIN</span>
          </div>
          <div class="info-row">
            <span class="label">🆔 UID:</span>
            <span class="value" style="font-size: 0.75rem;">${rootAdmin.uid}</span>
          </div>
        </div>

        <div class="actions">
          <a href="/api/auth/root-login/${code}" class="btn btn-primary">
            🔐 Влез сега
          </a>
          <button onclick="copyCredentials()" class="btn btn-secondary">
            📋 Копирай
          </button>
        </div>
      </div>

      <script>
        function copyCredentials() {
          const text = \`Root Admin Credentials:
Email: ${ROOT_ADMIN_EMAIL}
Password: ${ROOT_ADMIN_PASSWORD}
Login URL: \${window.location.origin}/api/auth/root-login/${code}\`;
          
          navigator.clipboard.writeText(text).then(() => {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '✓ Копирано!';
            btn.style.background = '#10b981';
            btn.style.color = 'white';
            
            setTimeout(() => {
              btn.textContent = originalText;
              btn.style.background = '#f3f4f6';
              btn.style.color = '#374151';
            }, 2000);
          }).catch(() => {
            alert('Грешка при копиране. Моля копирай ръчно.');
          });
        }
      </script>
    </body>
    </html>
    `;

    return new NextResponse(successHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });

  } catch (error: any) {
    console.error("Setup admin error:", error);
    
    const errorHtml = `
    <!DOCTYPE html>
    <html lang="bg">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Setup Error</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        .container {
          background: white;
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          text-align: center;
        }
        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          color: #333;
          margin-bottom: 1rem;
        }
        .error-details {
          background: #fee2e2;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-top: 1rem;
          color: #991b1b;
          font-family: monospace;
          font-size: 0.875rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">⚠️</div>
        <h1>Грешка при Setup</h1>
        <p>Неуспешно създаване на Root Admin профил</p>
        <div class="error-details">${error.message}</div>
      </div>
    </body>
    </html>
    `;

    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }
}

export const dynamic = "force-dynamic";
