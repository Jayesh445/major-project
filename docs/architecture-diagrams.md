# Architecture Diagrams

Full visual architecture of the StationeryChain supply chain system — all components, connections, agent workflows, and data flows.

---

## 1. System Overview

```mermaid
graph TB
    subgraph CLIENT["Client Layer"]
        BROWSER["Browser"]
        subgraph FRONTEND["Next.js 16 — :3000"]
            PAGES["App Router Pages\n(auth / dashboard / dev-tools)"]
            STORE["Zustand Auth Store\n(localStorage persistence)"]
            RQ["TanStack React Query\n(server state cache)"]
            SVC["Service Layer\n(authService / productService / ...)"]
            AXIOS["Axios Client\n(JWT interceptors + auto-refresh)"]
        end
    end

    subgraph BACKEND["Backend Layer — Express.js :5000"]
        MW["Middleware Stack\n(CORS → JSON → authenticate → authorize)"]
        subgraph MODULES["API Modules /api/v1"]
            USER["User Module\n(auth + RBAC)"]
            PROD["Product Module"]
            WH["Warehouse Module"]
            INV["Inventory Module"]
            SUP["Supplier Module"]
            PO["Purchase Order Module"]
            FC["Forecast Module"]
            BL["Blockchain Module"]
            NOTIF["Notification Module"]
        end
        subgraph AI_BACKEND["AI Agents /api"]
            FA["Forecast Agent\n(LangGraph)"]
            OA["Optimization Agent\n(LangGraph)"]
            SCHED["ForecastScheduler\n(node-cron)"]
        end
        EH["Error Handler\n(ApiError → JSON)"]
    end

    subgraph AI_MODULE["Mastra AI Module — standalone process"]
        MASTRA["Mastra 1.4.0\nAgent Orchestrator"]
        MEM["LibSQL Memory\n(persistent context)"]
        EVALS["Mastra Evals\n(agent testing)"]
        OBS["Mastra Observability\n(structured traces)"]
    end

    subgraph EXTERNAL["External Services"]
        GEMINI["Google Gemini API\n(LLM)"]
        LANGSMITH["LangSmith\n(optional tracing)"]
        ATLAS["MongoDB Atlas\n(primary database)"]
    end

    BROWSER --> FRONTEND
    AXIOS --> MW
    MW --> MODULES
    MW --> AI_BACKEND
    MODULES --> EH
    AI_BACKEND --> EH

    FA --> GEMINI
    OA --> GEMINI
    FA -.->|optional| LANGSMITH
    OA -.->|optional| LANGSMITH
    SCHED -->|triggers| FA

    MASTRA --> GEMINI
    MASTRA --> MEM
    MASTRA --> EVALS
    MASTRA --> OBS

    MODULES --> ATLAS
    FA --> ATLAS
    MEM --> ATLAS

    PAGES --> RQ
    RQ --> SVC
    SVC --> AXIOS
    AXIOS --> STORE
```

---

## 2. Backend Module Dependency Map

```mermaid
graph LR
    subgraph CORE["Core Infrastructure"]
        ENV["config/env.ts\n(Zod validation)"]
        DB["config/database.ts\n(MongoDB singleton)"]
        AUTH_MW["middlewares/auth.ts\n(authenticate / authorize)"]
        ERR_MW["middlewares/errorHandler.ts"]
        UTILS["utils/\n(ApiError, asyncHandler,\nresponseHandler, validateRequest)"]
    end

    subgraph MODULES["Business Modules"]
        USER["User\n(auth, sessions, RBAC)"]
        PROD["Product\n(catalog, SKU, categories)"]
        SUP["Supplier\n(catalog, contracts, rating)"]
        WH["Warehouse\n(zones, capacity)"]
        INV["Inventory\n(stock, transactions)"]
        PO["Purchase Order\n(lifecycle, approval)"]
        FC["Forecast\n(predictions, MAPE)"]
        BL["Blockchain\n(event logs, txHash)"]
        NOTIF["Notification\n(in-app, email)"]
    end

    ENV --> DB
    ENV --> AUTH_MW
    DB --> USER
    DB --> PROD
    DB --> SUP
    DB --> WH
    DB --> INV
    DB --> PO
    DB --> FC
    DB --> BL
    DB --> NOTIF

    AUTH_MW --> PROD
    AUTH_MW --> SUP
    AUTH_MW --> WH
    AUTH_MW --> INV
    AUTH_MW --> PO
    AUTH_MW --> FC

    USER --> AUTH_MW

    PROD --> INV
    WH --> INV
    SUP --> PO
    PROD --> PO
    WH --> PO
    INV --> PO

    PO --> BL
    INV --> BL
    PO --> NOTIF
    INV --> NOTIF
    FC --> NOTIF
    WH --> NOTIF

    FC --> PO
```

---

## 3. Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant MW as Middleware Stack
    participant AU as authenticate()
    participant AZ as authorize()
    participant V as validateBody()
    participant CT as Controller
    participant SV as Service Layer
    participant DB as MongoDB
    participant EH as errorHandler

    C->>MW: HTTP Request + Bearer token
    MW->>AU: extract + verify JWT
    alt token valid
        AU->>AZ: attach req.user
        AZ->>V: check role
        V->>CT: validate Zod schema
        CT->>SV: delegate to service
        SV->>DB: Mongoose query
        DB-->>SV: document(s)
        SV-->>CT: result
        CT-->>C: sendSuccess(res, data)
    else token invalid / expired
        AU->>EH: ApiError(401)
        EH-->>C: { success: false, statusCode: 401 }
    else role forbidden
        AZ->>EH: ApiError(403)
        EH-->>C: { success: false, statusCode: 403 }
    else validation fails
        V->>EH: ZodError
        EH-->>C: { success: false, statusCode: 400, errors[] }
    end
```

---

## 4. Authentication & Token Flow

```mermaid
sequenceDiagram
    participant U as User / Browser
    participant FE as Frontend (Zustand + Axios)
    participant BE as Backend /api/v1/users
    participant DB as MongoDB

    Note over U,DB: LOGIN
    U->>FE: submit email + password
    FE->>BE: POST /users/login
    BE->>DB: find user by email
    DB-->>BE: user doc (with passwordHash)
    BE->>BE: bcrypt.compare(password, hash)
    BE->>BE: sign accessToken (15m, JWT_SECRET)
    BE->>BE: sign refreshToken (7d, REFRESH_TOKEN_SECRET)
    BE->>DB: push refreshToken to user.refreshTokens[]
    BE-->>FE: { user, accessToken, refreshToken }
    FE->>FE: setTokens() + setUser() in Zustand
    FE->>FE: persist user + refreshToken to localStorage

    Note over U,DB: AUTHENTICATED REQUEST
    U->>FE: user action
    FE->>BE: GET /api/v1/resource + Authorization: Bearer <AT>
    BE->>BE: verifyToken(AT) → { userId, email, role }
    BE-->>FE: 200 { data }

    Note over U,DB: TOKEN REFRESH (on 401)
    FE->>BE: any request → 401 Unauthorized
    FE->>BE: POST /users/refresh-token { refreshToken }
    BE->>DB: find user with matching refreshToken
    BE->>BE: verify not expired
    BE->>BE: issue new accessToken + refreshToken
    BE->>DB: replace old refreshToken in user.refreshTokens[]
    BE-->>FE: { accessToken, refreshToken }
    FE->>FE: setTokens() with new tokens
    FE->>BE: retry original request with new AT

    Note over U,DB: LOGOUT
    U->>FE: logout action
    FE->>BE: POST /users/logout { refreshToken }
    BE->>DB: remove refreshToken from user.refreshTokens[]
    BE-->>FE: 200 OK
    FE->>FE: logout() → clear Zustand + localStorage
    FE->>U: redirect to /login
```

---

## 5. Frontend Data Architecture

```mermaid
graph TD
    subgraph NEXT["Next.js App Router"]
        subgraph AUTH_PAGES["Auth Pages /auth"]
            LOGIN["/login"]
            SIGNUP["/signup"]
            FORGOT["/forgot-password"]
        end

        subgraph DASH["Dashboard /dashboard"]
            ADMIN["/admin\n(products, users, warehouses, suppliers)"]
            WH_MGR["/warehouse\n(inventory)"]
            PROC["/procurement\n(orders, replenishment)"]
            DEV["/dev-tools\n(agent-monitor)"]
        end

        PR["ProtectedRoute\n(checks isAuthenticated + role)"]
    end

    subgraph STATE["State Layer"]
        ZUSTAND["Zustand Auth Store\nuser | accessToken | refreshToken\n(refreshToken → localStorage)"]
        REACT_QUERY["TanStack Query Cache\nproducts | inventory | warehouses\nsuppliers | purchase-orders | users"]
    end

    subgraph HOOKS["React Query Hooks"]
        H_PROD["useProducts / useCreateProduct\nuseUpdateProduct / useDeleteProduct"]
        H_INV["useInventory / useAdjustStock\nuseTransferStock"]
        H_WH["useWarehouses / useCreateWarehouse"]
        H_SUP["useSuppliers / useCreateSupplier"]
        H_PO["usePurchaseOrders / useCreatePO\nuseApprovePO / useRejectPO"]
        H_USER["useUsers / useCreateUser"]
    end

    subgraph SERVICES["Service Layer"]
        SVC_AUTH["authService"]
        SVC_PROD["productService"]
        SVC_INV["inventoryService"]
        SVC_WH["warehouseService"]
        SVC_SUP["supplierService"]
        SVC_PO["poService"]
        SVC_USER["userService"]
    end

    AXIOS_CLIENT["Axios Client\nbaseURL: NEXT_PUBLIC_API_URL\nRequest: attach Bearer token\nResponse: auto-refresh on 401"]

    DASH --> PR
    PR --> ZUSTAND
    DASH --> HOOKS
    AUTH_PAGES --> SVC_AUTH
    SVC_AUTH --> ZUSTAND

    HOOKS --> REACT_QUERY
    REACT_QUERY --> SERVICES
    SERVICES --> AXIOS_CLIENT
    AXIOS_CLIENT --> ZUSTAND
    AXIOS_CLIENT -->|HTTP| BACKEND["Backend :5000"]
```

---

## 6. AI Agent Architecture

```mermaid
graph TB
    subgraph TRIGGERS["Agent Triggers"]
        CRON["ForecastScheduler\n(node-cron — runs 02:00 nightly)"]
        HTTP_F["POST /api/forecast"]
        HTTP_O["POST /api/warehouse-optimization/analyze"]
        DEV_UI["Dev Tools Dashboard\n/dashboard/dev-tools/agent-monitor"]
    end

    subgraph FORECAST_AGENT["Forecast Agent (LangGraph)"]
        FA_N1["Node: fetchHistoricalData\n→ queryInventoryTransactions(90 days)"]
        FA_N2["Node: fetchProductMeta\n→ getProductMetadata()"]
        FA_N3["Node: generateForecast\n→ LLM call (Gemini)"]
        FA_N4["Node: calcConfidence\n→ statistical post-processing"]
        FA_N5["Node: persistForecast\n→ upsert DemandForecast doc"]
        FA_N1 --> FA_N2
        FA_N2 --> FA_N3
        FA_N3 --> FA_N4
        FA_N4 --> FA_N5
    end

    subgraph OPT_AGENT["Optimization Agent (LangGraph)"]
        OA_N1["Node: fetchWarehouseData\n→ getWarehouseStats()"]
        OA_N2["Node: fetchMovementPatterns\n→ getInventoryMovements(30 days)"]
        OA_N3["Node: analyzeUtilization\n→ compute zone percentages"]
        OA_N4["Node: generateRecs\n→ LLM call (Gemini)"]
        OA_N1 --> OA_N2
        OA_N2 --> OA_N3
        OA_N3 --> OA_N4
    end

    subgraph MASTRA["Mastra AI Module (standalone :4111)"]
        M_AGENT["Mastra Agent\n(declarative config)"]
        M_MEM["LibSQL Memory\n(persistent conversation)"]
        M_EVALS["Evals Harness\n(automated testing)"]
        M_OBS["Observability\n(structured traces)"]
        M_AGENT --> M_MEM
        M_AGENT --> M_EVALS
        M_AGENT --> M_OBS
    end

    subgraph LLM["LLM Layer"]
        GEMINI["Google Gemini API\n(gemini-pro, temp=0.1)"]
        LANGSMITH["LangSmith\n(optional — trace every node)"]
    end

    subgraph DB["MongoDB Collections"]
        COL_INV["inventories\n(transactions, stock levels)"]
        COL_PROD["products\n(reorderPoint, leadTime)"]
        COL_WH["warehouses\n(zones, capacity)"]
        COL_FC["demandforecasts\n(dailyForecasts, MAPE)"]
        COL_NOTIF["notifications\n(forecast_ready alert)"]
        COL_PO["purchaseorders\n(auto_replenishment)"]
    end

    CRON --> FORECAST_AGENT
    HTTP_F --> FORECAST_AGENT
    HTTP_O --> OPT_AGENT
    DEV_UI -->|reads| COL_FC

    FA_N1 --> COL_INV
    FA_N2 --> COL_PROD
    FA_N5 --> COL_FC
    FA_N5 --> COL_NOTIF

    OA_N1 --> COL_WH
    OA_N2 --> COL_INV

    FA_N3 --> GEMINI
    OA_N4 --> GEMINI
    M_AGENT --> GEMINI

    FA_N3 -.->|optional| LANGSMITH
    OA_N4 -.->|optional| LANGSMITH
```

---

## 7. Forecast Agent — Detailed LangGraph State Flow

```mermaid
stateDiagram-v2
    [*] --> fetchHistoricalData : input { productId, warehouseId, horizonDays }

    fetchHistoricalData : fetchHistoricalData
    fetchHistoricalData : Tool: queryInventoryTransactions()
    fetchHistoricalData : → last 90 days of transactions

    fetchProductMeta : fetchProductMeta
    fetchProductMeta : Tool: getProductMetadata()
    fetchProductMeta : → reorderPoint, safetyStock
    fetchProductMeta : → leadTimeDays, unitPrice

    generateForecast : generateForecast
    generateForecast : LLM: Google Gemini
    generateForecast : Prompt: structured JSON forecast
    generateForecast : → dailyDemand[], confidenceLow[]
    generateForecast : → confidenceHigh[]

    calcConfidence : calcConfidence
    calcConfidence : Statistical post-processing
    calcConfidence : → totalPredicted7Day
    calcConfidence : → recommendedReorderQty
    calcConfidence : → recommendedOrderDate

    persistForecast : persistForecast
    persistForecast : Upsert DemandForecast in MongoDB
    persistForecast : Create Notification (forecast_ready)
    persistForecast : Check if replenishment needed

    [*] --> fetchHistoricalData
    fetchHistoricalData --> fetchProductMeta
    fetchProductMeta --> generateForecast
    generateForecast --> calcConfidence
    calcConfidence --> persistForecast
    persistForecast --> [*]
```

---

## 8. Auto-Replenishment Flow (Forecast → Purchase Order)

```mermaid
flowchart TD
    A(["ForecastScheduler\ntriggers @ 02:00 nightly"]) --> B["Forecast Agent runs\nfor each product × warehouse"]
    B --> C["DemandForecast saved\nwith recommendedReorderQty\nand recommendedOrderDate"]
    C --> D{"Is availableStock\n≤ reorderPoint?"}
    D -- No --> E[/"No action needed"/]
    D -- Yes --> F["Inventory Service sets\nreplenishmentTriggered = true"]
    F --> G["Purchase Order Service\ncreates PO\ntriggeredBy: auto_replenishment\nstatus: draft"]
    G --> H["PO submitted for approval\nstatus: pending_approval"]
    H --> I["Notification created\ntype: reorder_triggered\nchannel: in_app + email"]
    H --> J["Admin / Procurement Officer\napproves PO\nstatus: approved"]
    J --> K["PO sent to supplier\nstatus: sent_to_supplier"]
    K --> L["Supplier acknowledges\nstatus: acknowledged"]
    L --> M["Goods received\nstatus: partially_received\nor fully_received"]
    M --> N["Inventory updated\ntransaction: purchase\ncurrentStock increases"]
    N --> O["Blockchain event logged\neventType: po_received\ntxHash generated"]
    O --> P(["Replenishment cycle complete"])
```

---

## 9. Purchase Order State Machine

```mermaid
stateDiagram-v2
    [*] --> draft : create PO\n(manual / auto_replenishment\n/ negotiation_agent)

    draft --> pending_approval : submit for approval
    draft --> cancelled : cancel

    pending_approval --> approved : admin / procurement_officer approves
    pending_approval --> rejected : admin rejects (with reason)
    pending_approval --> cancelled : cancel

    approved --> sent_to_supplier : send to supplier
    approved --> cancelled : cancel

    sent_to_supplier --> acknowledged : supplier confirms receipt of PO
    acknowledged --> partially_received : some items received
    acknowledged --> fully_received : all items received

    partially_received --> fully_received : remaining items received

    fully_received --> [*]
    cancelled --> [*]
    rejected --> [*]

    note right of approved
        Blockchain event logged:
        po_approved
    end note

    note right of fully_received
        Inventory updated (purchase transaction)
        Blockchain event: po_received
    end note
```

---

## 10. Inventory Transaction Flow

```mermaid
flowchart LR
    subgraph INPUTS["Stock In Events"]
        A1["Purchase Receipt\ntype: purchase"]
        A2["Return from Customer\ntype: return"]
        A3["Transfer Received\ntype: transfer_in"]
        A4["Adjustment (add)\ntype: adjustment"]
    end

    subgraph INVENTORY["Inventory Document"]
        I1["currentStock"]
        I2["reservedStock"]
        I3["availableStock\n= currentStock - reservedStock"]
        I4["transactions[]\n(full audit trail)"]
        I5{"availableStock\n≤ reorderPoint?"}
    end

    subgraph OUTPUTS["Stock Out Events"]
        B1["Sales Order Fulfillment\ntype: sale"]
        B2["Transfer Out\ntype: transfer_out"]
        B3["Damage / Write-off\ntype: damage"]
        B4["Adjustment (remove)\ntype: adjustment"]
        B5["Reserve for PO\ntype: reservation"]
        B6["Release Reservation\ntype: release_reservation"]
    end

    subgraph TRIGGERS["Auto Actions"]
        T1["replenishmentTriggered = true"]
        T2["Create Draft PO\n(auto_replenishment)"]
        T3["Notification:\nlow_stock_alert"]
        T4["Blockchain Event:\ninventory_adjustment"]
    end

    INPUTS --> I1
    OUTPUTS --> I1
    B5 --> I2
    B6 --> I2
    I1 --> I3
    I1 --> I4
    I3 --> I5
    I5 -- Yes --> T1
    T1 --> T2
    T1 --> T3
    INPUTS --> T4
    OUTPUTS --> T4
```

---

## 11. Role-Based Access Control (RBAC)

```mermaid
graph TD
    subgraph ROLES["User Roles"]
        ADMIN["admin"]
        WM["warehouse_manager"]
        PO_ROLE["procurement_officer"]
        SUP_ROLE["supplier"]
    end

    subgraph ENDPOINTS["Protected Endpoints"]
        E1["GET /users (all)\nPATCH /users/:id\nDELETE /users/:id"]
        E2["POST /products\nPUT /products/:id\nDELETE /products/:id"]
        E3["POST /warehouses\nPUT /warehouses/:id"]
        E4["POST /inventory/adjust\nPOST /inventory/transfer"]
        E5["POST /purchase-orders\nGET /purchase-orders"]
        E6["POST /purchase-orders/:id/approve"]
        E7["GET /suppliers\nPOST /suppliers"]
        E8["POST /forecast\nGET /forecast/predictions"]
        E9["POST /warehouse-optimization/analyze"]
    end

    ADMIN --> E1
    ADMIN --> E2
    ADMIN --> E3
    ADMIN --> E4
    ADMIN --> E5
    ADMIN --> E6
    ADMIN --> E7
    ADMIN --> E8
    ADMIN --> E9

    WM --> E4
    WM --> E9
    WM -.->|read only| E5

    PO_ROLE --> E5
    PO_ROLE --> E6
    PO_ROLE --> E7
    PO_ROLE --> E8

    SUP_ROLE -.->|own catalog only| E7
```

---

## 12. Full Data Model Relationships

```mermaid
erDiagram
    User {
        ObjectId _id
        string name
        string email
        string passwordHash
        enum role
        ObjectId supplierRef
        ObjectId[] assignedWarehouses
        boolean isActive
        Date lastLogin
        RefreshToken[] refreshTokens
    }

    Product {
        ObjectId _id
        string sku
        string name
        enum category
        number unitPrice
        number reorderPoint
        number safetyStock
        number leadTimeDays
        ObjectId primarySupplier
        ObjectId[] alternateSuppliers
        boolean isActive
    }

    Warehouse {
        ObjectId _id
        string name
        string code
        object location
        number totalCapacity
        number usedCapacity
        Zone[] zones
        ObjectId manager
        boolean isActive
    }

    Supplier {
        ObjectId _id
        string companyName
        string contactEmail
        CatalogProduct[] catalogProducts
        ContractTerms currentContractTerms
        number rating
        boolean isApproved
    }

    Inventory {
        ObjectId _id
        ObjectId product
        ObjectId warehouse
        number currentStock
        number reservedStock
        number availableStock
        number reorderPoint
        boolean replenishmentTriggered
        Transaction[] transactions
        string zone
    }

    PurchaseOrder {
        ObjectId _id
        string poNumber
        ObjectId supplier
        ObjectId warehouse
        LineItem[] lineItems
        number totalAmount
        enum status
        enum triggeredBy
        string blockchainTxHash
        ObjectId createdBy
        ObjectId approvedBy
    }

    DemandForecast {
        ObjectId _id
        ObjectId product
        ObjectId warehouse
        Date forecastedAt
        number forecastHorizonDays
        DailyForecast[] dailyForecasts
        number totalPredicted7Day
        number overallMape
        number recommendedReorderQty
        Date recommendedOrderDate
    }

    BlockchainEvent {
        ObjectId _id
        enum eventType
        string referenceModel
        ObjectId referenceId
        string txHash
        enum confirmationStatus
        ObjectId triggeredBy
    }

    Notification {
        ObjectId _id
        ObjectId recipient
        enum type
        string title
        string message
        string relatedModel
        ObjectId relatedId
        enum channel
        boolean isRead
    }

    User ||--o{ Inventory : "manages via warehouse"
    User ||--o{ PurchaseOrder : "createdBy / approvedBy"
    User ||--o{ Notification : "recipient"
    User }o--|| Supplier : "supplierRef (role=supplier)"

    Product ||--o{ Inventory : "tracked in"
    Product ||--o{ PurchaseOrder : "line items"
    Product ||--o{ DemandForecast : "forecasted for"

    Warehouse ||--o{ Inventory : "stores in"
    Warehouse ||--o{ PurchaseOrder : "delivers to"
    Warehouse ||--o{ DemandForecast : "forecasted at"

    Supplier ||--o{ PurchaseOrder : "fulfils"
    Supplier ||--o{ Product : "primarySupplier"

    PurchaseOrder ||--o{ BlockchainEvent : "logs to"
    Inventory ||--o{ BlockchainEvent : "logs to"

    PurchaseOrder ||--o{ Notification : "triggers"
    Inventory ||--o{ Notification : "triggers (low stock)"
    DemandForecast ||--o{ Notification : "triggers (forecast_ready)"
```

---

## 13. Deployment Architecture

```mermaid
graph TB
    subgraph INTERNET["Internet"]
        USER_BROWSER["User Browser"]
    end

    subgraph VERCEL["Vercel (Frontend)"]
        NEXT_APP["Next.js 16 App\n(SSR + Static)"]
        VERCEL_ANALYTICS["Vercel Analytics"]
    end

    subgraph CLOUD["Cloud (Backend)"]
        EXPRESS["Express.js Server\n(Node.js + TypeScript)\nPort 5000"]
        MASTRA_PROC["Mastra AI Process\n(standalone)\nPort 4111"]
    end

    subgraph ATLAS["MongoDB Atlas"]
        PRIMARY["Primary Node"]
        SECONDARY["Secondary Nodes\n(read replicas)"]
    end

    subgraph GOOGLE["Google Cloud"]
        GEMINI_API["Gemini API\n(LLM inference)"]
    end

    subgraph MONITORING["Optional Monitoring"]
        LS["LangSmith\n(agent traces)"]
    end

    USER_BROWSER --> NEXT_APP
    NEXT_APP --> EXPRESS
    NEXT_APP --> VERCEL_ANALYTICS
    EXPRESS --> ATLAS
    EXPRESS --> GEMINI_API
    MASTRA_PROC --> GEMINI_API
    EXPRESS -.-> LS
    PRIMARY --> SECONDARY
```
