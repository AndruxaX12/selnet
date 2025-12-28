// Email templates в български

interface EmailTemplateParams {
  userName?: string;
  userEmail: string;
  role: string;
  reason: string;
  adminEmail: string;
  adminName?: string;
  date: string;
}

export function roleGrantedEmail(params: EmailTemplateParams): { subject: string; html: string; text: string } {
  const { userName, userEmail, role, reason, adminEmail, date } = params;
  
  const roleNames: Record<string, string> = {
    citizen: "Гражданин",
    moderator: "Модератор",
    operator: "Оператор",
    ombudsman: "Омбудсман",
    admin: "Администратор"
  };
  
  const roleName = roleNames[role] || role;
  
  return {
    subject: `Присвоена е нова роля: ${roleName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2563eb; }
          .label { font-weight: bold; color: #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">SelNet - Промяна на роля</h1>
          </div>
          <div class="content">
            <p>Здравейте${userName ? ` ${userName}` : ''},</p>
            
            <p>Вашата роля в платформата SelNet е променена.</p>
            
            <div class="info-box">
              <p><span class="label">Нова роля:</span> ${roleName}</p>
              <p><span class="label">Присвоена от:</span> ${adminEmail}</p>
              <p><span class="label">Дата:</span> ${date}</p>
            </div>
            
            <div class="info-box">
              <p class="label">Причина:</p>
              <p>${reason}</p>
            </div>
            
            <p>С новата роля имате достъп до следните функции:</p>
            <ul>
              ${getRolePermissions(role)}
            </ul>
            
            <p>За да видите пълните си права, влезте в платформата.</p>
            
            <p style="margin-top: 30px;">
              <a href="https://selnet.bg/login" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Вход в SelNet</a>
            </p>
          </div>
          <div class="footer">
            <p>Това е автоматично генерирано съобщение от платформата SelNet.</p>
            <p>Ако имате въпроси, свържете се с администратор на ${adminEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
SelNet - Промяна на роля

Здравейте${userName ? ` ${userName}` : ''},

Вашата роля в платформата SelNet е променена.

Нова роля: ${roleName}
Присвоена от: ${adminEmail}
Дата: ${date}

Причина:
${reason}

За повече информация влезте в платформата на https://selnet.bg/login

Това е автоматично генерирано съобщение от платформата SelNet.
    `
  };
}

export function roleRevokedEmail(params: EmailTemplateParams): { subject: string; html: string; text: string } {
  const { userName, userEmail, role, reason, adminEmail, date } = params;
  
  const roleNames: Record<string, string> = {
    citizen: "Гражданин",
    moderator: "Модератор",
    operator: "Оператор",
    ombudsman: "Омбудсман",
    admin: "Администратор"
  };
  
  const roleName = roleNames[role] || role;
  
  return {
    subject: `Отнета е роля: ${roleName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc2626; }
          .label { font-weight: bold; color: #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">SelNet - Промяна на роля</h1>
          </div>
          <div class="content">
            <p>Здравейте${userName ? ` ${userName}` : ''},</p>
            
            <p>Вашата роля в платформата SelNet е отнета.</p>
            
            <div class="info-box">
              <p><span class="label">Отнета роля:</span> ${roleName}</p>
              <p><span class="label">Отнета от:</span> ${adminEmail}</p>
              <p><span class="label">Дата:</span> ${date}</p>
            </div>
            
            <div class="info-box">
              <p class="label">Причина:</p>
              <p>${reason}</p>
            </div>
            
            <p>Ако смятате, че това е грешка, моля свържете се с администратор.</p>
          </div>
          <div class="footer">
            <p>Това е автоматично генерирано съобщение от платформата SelNet.</p>
            <p>Ако имате въпроси, свържете се с администратор на ${adminEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
SelNet - Промяна на роля

Здравейте${userName ? ` ${userName}` : ''},

Вашата роля в платформата SelNet е отнета.

Отнета роля: ${roleName}
Отнета от: ${adminEmail}
Дата: ${date}

Причина:
${reason}

Ако смятате, че това е грешка, моля свържете се с администратор на ${adminEmail}

Това е автоматично генерирано съобщение от платформата SelNet.
    `
  };
}

export function approvalRequestEmail(params: {
  requesterEmail: string;
  targetUserEmail: string;
  role: string;
  reason: string;
  requestId: string;
}): { subject: string; html: string; text: string } {
  const { requesterEmail, targetUserEmail, role, reason, requestId } = params;
  
  const roleNames: Record<string, string> = {
    admin: "Администратор",
    ombudsman: "Омбудсман"
  };
  
  const roleName = roleNames[role] || role;
  
  return {
    subject: `Нова заявка за одобрение: ${roleName} роля`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f59e0b; }
          .label { font-weight: bold; color: #1f2937; }
          .warning { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">⚠️ SelNet - Заявка за одобрение</h1>
          </div>
          <div class="content">
            <p>Здравейте,</p>
            
            <p>Има нова заявка за одобрение, която изисква вашето внимание.</p>
            
            <div class="warning">
              <strong>⚠️ Високорискова операция</strong>
              <p>Това действие изисква одобрение от втори администратор преди да бъде изпълнено.</p>
            </div>
            
            <div class="info-box">
              <p><span class="label">Заявено от:</span> ${requesterEmail}</p>
              <p><span class="label">Целеви потребител:</span> ${targetUserEmail}</p>
              <p><span class="label">Роля за присвояване:</span> ${roleName}</p>
              <p><span class="label">ID на заявката:</span> ${requestId}</p>
            </div>
            
            <div class="info-box">
              <p class="label">Причина:</p>
              <p>${reason}</p>
            </div>
            
            <p style="margin-top: 30px;">
              <a href="https://selnet.bg/admin" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Прегледай заявката</a>
            </p>
          </div>
          <div class="footer">
            <p>Това е автоматично генерирано съобщение от платформата SelNet.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
SelNet - Заявка за одобрение

⚠️ Високорискова операция

Има нова заявка за одобрение, която изисква вашето внимание.

Заявено от: ${requesterEmail}
Целеви потребител: ${targetUserEmail}
Роля за присвояване: ${roleName}
ID на заявката: ${requestId}

Причина:
${reason}

Влезте в админ панела за да прегледате заявката: https://selnet.bg/admin

Това е автоматично генерирано съобщение от платформата SelNet.
    `
  };
}

function getRolePermissions(role: string): string {
  const permissions: Record<string, string[]> = {
    citizen: [
      "Създаване на сигнали",
      "Създаване на идеи",
      "Гласуване за идеи",
      "Коментиране"
    ],
    moderator: [
      "Всички права на Гражданин",
      "Модериране на сигнали",
      "Модериране на идеи",
      "Модериране на коментари"
    ],
    operator: [
      "Всички права на Модератор",
      "Създаване на събития",
      "Промяна на статус на сигнали",
      "Верификация на сигнали"
    ],
    ombudsman: [
      "Преглед на жалби",
      "Отговор на жалби",
      "Достъп до специален панел"
    ],
    admin: [
      "Пълен достъп до системата",
      "Управление на роли",
      "Изпращане на покани",
      "Преглед на одит логове"
    ]
  };
  
  const perms = permissions[role] || [];
  return perms.map(p => `<li>${p}</li>`).join('\n');
}
