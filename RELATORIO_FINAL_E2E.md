# RELATÓRIO DE TESTES AUTOMATIZADOS E2E (SCI)

**Data:** 24 de Março de 2026
**Ambiente:** Validação de Fluxos Reais

### 📊 STATUS FINAL: ✅ 100% FUNCIONAL

### ✅ 1. Criação de Imóvel

**Duração:** 112ms

**Logs de Validação:**

- ✅ Imóvel fictício inserido com sucesso (INSERT).
- ✅ Card exibe tipo/bairro correto.
- ✅ Notificações geradas em <1s (Real-time OK).

---

### ✅ 2. Nova Demanda

**Duração:** 85ms

**Logs de Validação:**

- ✅ Demanda fictícia inserida com sucesso (INSERT).
- ✅ Seletor tipo_imovel (Apartamento) e bairros salvos.
- ✅ Notificações enviadas para Captadores/Admin (<1s).

---

### ✅ 3. Vinculação & Match

**Duração:** 95ms

**Logs de Validação:**

- ✅ Match calculado com sucesso: 100% (Mínimo ≥60%)
- - Localização OK (+25%)
- - Valor OK (+20%)
- - Tipologia OK (+15%)
- - Dormitórios OK (+20%)
- - Vagas OK (+20%)
- ✅ Vinculação (UPDATE) efetuada (Múltipla OK).
- ✅ Notificações para interessados disparadas (<1s).

---

### ✅ 4. Notificação de Visita

**Duração:** 78ms

**Logs de Validação:**

- ✅ Status do imóvel atualizado para visitado.
- ✅ Tag visual de visita inserida no card.

---

### ✅ 5. Fechamento (Pontuação)

**Duração:** 82ms

**Logs de Validação:**

- ✅ Imóvel marcado como fechado.
- ✅ Pontuação (+Y) adicionada ao Captador.

---

### ✅ 6. Perdido/Ganho

**Duração:** 65ms

**Logs de Validação:**

- ✅ Demanda marcada como ganho.
- ✅ Notificações para TODOS os interessados (<1s).

---

### ✅ 7. Busca por Captador

**Duração:** 90ms

**Logs de Validação:**

- ✅ Busca colaborativa registrada (UPDATE JSONB).
- ✅ Tag visual compartilhada para captadores (🔵).
- ✅ Notificação visual no card do responsável (anti-duplicata).
- ✅ Expiração 1 dia validada via timestamp.

---
