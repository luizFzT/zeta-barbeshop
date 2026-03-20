# 🗺️ Plano de Migração: Estado Local → Supabase como Fonte Única da Verdade

> **Objetivo:** Eliminar bugs causados pela divergência entre estado React (memória)
> e o banco de dados Supabase, tornando o Supabase a única fonte de verdade (Single Source of Truth).

---

## 🔴 Problema Atual

O sistema tem **duas camadas de estado paralelas** que frequentemente desincronizam:

| Camada | Onde Vive | Problema |
|---|---|---|
| **Supabase** | Banco de dados | Verdade permanente |
| **React `useState`** | Memória do browser | Cópia temporária que pode divergir |

### Exemplos de bugs gerados por isso:
- `activeClient` sumia do dashboard porque era derivado do `queue` local (que o `startService` limpava)
- Cliente via o contador de chegada persistindo após confirmar presença
- Clientes "chamados" ainda aparecendo na fila de espera

---

## ✅ Fase 1 — Migração do Schema (Banco de Dados)

### 1.1 Adicionar `status: 'in_service'` na tabela `queue_entries`

Atualmente o fluxo é: `waiting → called → [DELETADO]`
O novo fluxo deve ser: `waiting → called → in_service → completed`

```sql
-- Adicionar novo valor ao enum (ou usar texto com constraint)
ALTER TABLE queue_entries
ADD COLUMN IF NOT EXISTS service_started_at TIMESTAMPTZ;

-- Atualizar o check constraint de status para incluir 'in_service' e 'completed'
ALTER TABLE queue_entries
DROP CONSTRAINT IF EXISTS queue_entries_status_check;

ALTER TABLE queue_entries
ADD CONSTRAINT queue_entries_status_check
CHECK (status IN ('waiting', 'called', 'in_service', 'completed'));
```

### 1.2 Atualizar RLS Policies
As políticas de segurança precisam permitir que o dono da barbearia atualize o status
para todos os valores, incluindo `in_service` e `completed`.

```sql
-- Política de update já deve existir para o owner, mas verificar se cobre os novos status
-- Checar em: Supabase Dashboard > Authentication > Policies > queue_entries
```

---

## ✅ Fase 2 — Refatoração do Hook `useBarbershop.jsx`

### 2.1 Modificar `startService()`

**Antes (problemático):**
```js
// Deleta o registro completamente — a UI perde a referência
await supabase.from('queue_entries').delete().eq('id', entryId);
```

**Depois (correto):**
```js
// Apenas atualiza o status — o realtime subscription reage automaticamente
await supabase
  .from('queue_entries')
  .update({
    status: 'in_service',
    service_started_at: new Date().toISOString()
  })
  .eq('id', entryId);
```

### 2.2 Modificar `fetchQueue()` para incluir `in_service`

```js
// Antes: buscava apenas 'waiting' e 'called'
.in('status', ['waiting', 'called'])

// Depois: inclui 'in_service'
.in('status', ['waiting', 'called', 'in_service'])
```

### 2.3 Adicionar função `completeService(entryId)`

```js
const completeService = async (entryId) => {
  // Marca como completed + registra no histórico
  await supabase
    .from('queue_entries')
    .update({ status: 'completed' })
    .eq('id', entryId);

  // Log para service_history (já feito em startService hoje — mover para cá)
};
```

---

## ✅ Fase 3 — Refatoração do `DashboardPage.jsx`

### 3.1 Remover o workaround `inServiceClient`

O estado `inServiceClient` foi adicionado como patch temporário.
Com a Fase 2 implementada, `activeClient` pode ser derivado diretamente do
`queue` novamente, pois o cliente agora tem `status === 'in_service'` na fila.

```js
// Antes (workaround)
const [inServiceClient, setInServiceClient] = useState(null);
const activeClient = queue.find(e => e.status === 'called') || inServiceClient;

// Depois (limpo)
const activeClient = queue.find(e => e.status === 'called' || e.status === 'in_service') || null;
```

### 3.2 Atualizar `ActiveClientCanvas`

- Remover a prop e lógica de `_inService`
- Usar `client.status === 'in_service'` para determinar o estado visual
- Adicionar botão **"Finalizar Atendimento"** que chama `completeService()`

```jsx
{client.status === 'in_service' ? (
  <button className="btn btn-danger" onClick={() => completeService(client.id)}>
    <span className="material-symbols-outlined">check_circle</span>
    Finalizar Atendimento
  </button>
) : (
  <button className="btn btn-primary" onClick={() => startService(client.id)}>
    <span className="material-symbols-outlined">play_circle</span>
    Iniciar Atendimento
  </button>
)}
```

---

## ✅ Fase 4 — Refatoração do `ClientQueuePage.jsx`

### 4.1 Remover estado local de tolerância

O `toleranceEnd`, `toleranceCountdown` e `showConfirmModal` devem ser
**derivados do estado da queue vinda do Supabase**, não de estado local.

| Estado Local Atual | Substituição via Supabase |
|---|---|
| `toleranceEnd` | Campo `tolerance_deadline` em `queue_entries` |
| `showConfirmModal` | Derivado de `myEntry.confirmation_status === 'pending'` |
| `toleranceCountdown` | Calculado a partir de `myEntry.tolerance_deadline` |

### 4.2 Adicionar coluna `tolerance_deadline` (opcional)

```sql
ALTER TABLE queue_entries
ADD COLUMN IF NOT EXISTS tolerance_deadline TIMESTAMPTZ;
```

O barbeiro ao chamar um cliente (`callNext`) seta esse campo com o timestamp
de expiração. O cliente lê esse campo via realtime e sabe exatamente até quando tem.

---

## ✅ Fase 5 — Eliminar Modo Demo (Opcional / Longo Prazo)

O **modo demo** usa `localStorage` como banco simulado, que é a maior fonte
de inconsistências. Quando tokens permitirem, considerar:

1. Criar um **projeto Supabase de demo** com dados pré-populados e reset automático
2. Ou remover o modo demo completamente (já que o app está em produção)

---

## 📋 Ordem Recomendada de Implementação

```
Fase 1 (Schema)      → 30 min — apenas SQL no Supabase Dashboard
Fase 2 (Hook)        → 2–3h  — refatorar startService e fetchQueue
Fase 3 (Dashboard)   → 1–2h  — limpar workaround, adicionar completeService
Fase 4 (Cliente)     → 1–2h  — derivar toleranceCountdown do Supabase
Fase 5 (Demo Mode)   → 3–4h  — opcional, se quiser eliminar de vez
```

**Total estimado:** ~8–12h de desenvolvimento focado

---

## 🔗 Arquivos Afetados

| Arquivo | Mudança |
|---|---|
| `src/shared/hooks/useBarbershop.jsx` | `startService`, `completeService`, `fetchQueue` |
| `src/dashboard/DashboardPage.jsx` | `activeClient`, `ActiveClientCanvas`, remover `inServiceClient` |
| `src/client/ClientQueuePage.jsx` | `toleranceEnd`, `toleranceCountdown`, derivar do Supabase |
| Supabase SQL | Adicionar status `in_service`, `completed`, `tolerance_deadline` |

---

> **Nota:** Os patches atuais (`inServiceClient`, limpeza de `toleranceEnd` no confirm)
> são workarounds funcionais e **não precisam ser desfeitos urgentemente**. Eles podem
> coexistir até que esta migração seja implementada.
