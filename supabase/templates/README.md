# Configuração de Templates de Email - Supabase + Brevo

Este diretório contém os templates HTML customizados com o branding da **Etic Captação** (cor verde `#10B981`, design responsivo, conteúdo em português e layout otimizado).

## 🚀 Como configurar no Supabase

Para aplicar estes templates no seu projeto Supabase, siga os passos abaixo:

1. Acesse o painel do seu projeto no [Supabase](https://app.supabase.com).
2. No menu lateral esquerdo, vá em **Authentication** > **Email Templates**.
3. Você verá várias abas de templates: *Confirm signup*, *Invite user*, *Magic Link*, *Change Email Address*, *Reset Password*.

### 1. Template de Confirmação de Cadastro
- Vá na aba **Confirm signup**.
- No campo **Subject**, insira: `✅ Confirme seu email - Etic Captação`
- Copie todo o conteúdo do arquivo `confirmacao-cadastro.html` e cole no campo **Message (HTML)**.
- Clique em **Save**.

### 2. Template de Recuperação de Senha
- Vá na aba **Reset Password**.
- No campo **Subject**, insira: `🔐 Redefinição de Senha - Etic Captação`
- Copie todo o conteúdo do arquivo `recuperacao-senha.html` e cole no campo **Message (HTML)**.
- Clique em **Save**.

### 3. Template de Convite de Usuário
- Vá na aba **Invite user**.
- No campo **Subject**, insira: `🤝 Você foi convidado para a Etic Captação`
- Copie todo o conteúdo do arquivo `convite-usuario.html` e cole no campo **Message (HTML)**.
- Clique em **Save**.

---

## ⚙️ Configuração do SMTP (Brevo)

Para garantir que os emails cheguem na caixa de entrada em menos de 5 segundos, configure o Brevo como provedor SMTP:

1. Acesse **Authentication** > **Providers** > **Email**.
2. Role a página até encontrar a seção **Custom SMTP**.
3. Ative a opção **Enable Custom SMTP**.
4. Preencha com as credenciais do Brevo:
   - **Sender email:** `suporte@eticcaptacao.com.br` (ou o email verificado no Brevo)
   - **Sender name:** `Etic Captação`
   - **Host:** `smtp-relay.brevo.com`
   - **Port:** `587`
   - **Username:** `(Seu login do Brevo SMTP)`
   - **Password:** `(Sua Master Password do Brevo SMTP)`
5. Clique em **Save**.

> **Nota:** Certifique-se de configurar o limite de expiração do link para **24 horas (86400 segundos)** em **Authentication** > **Providers** > **Email** > **Secure email change**.
